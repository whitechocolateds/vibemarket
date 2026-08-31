# VibeMarket

Online prodavnica na srpskom — Next.js 16, React 19, plaćanje pouzećem.
Admin panel na `/admin`.

## Pokretanje

```bash
npm install
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000). Podaci se čuvaju u
`data/*.json` lokalno, odnosno u Vercel Blob kad je konfigurisan (`lib/db.ts`).

## Podešavanje okruženja

Sve varijable idu u `.env.local` — fajl je u `.gitignore` i sam sebe dokumentuje.
Ništa nije obavezno za lokalni rad osim onoga što koristiš.

| Varijabla | Čemu služi | Bez nje |
|---|---|---|
| `ADMIN_PASSWORD` | prijava na `/admin` | pada na `admin123` |
| `GEMINI_API_KEY` | AI Studio i uvoz sa linka | AI koraci vraćaju grešku |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob za podatke i slike | piše u `data/` i `public/uploads/` |
| `UNSPLASH_ACCESS_KEY` | slike pri generisanju iz slobodnog teksta | pada na kuriranu listu |

> `ADMIN_PASSWORD=` sa **praznom** vrednošću je gore od nepostavljene —
> `lib/adminAuth.ts` koristi `??`, pa prazan string prolazi kao validna lozinka
> i svako se uloguje. Ili upiši vrednost, ili ostavi red zakomentarisan.

### Gemini

Ključ se uzima na [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
Kad ga upišeš u `.env.local`, proveri da radi:

```bash
npm run gemini:check
```

Alat javlja koji modeli iz `VALID_MODELS` zaista postoje, da li rade
`responseSchema` (uvoz sa linka) i `google_search` (generisanje iz slobodnog
teksta), pa predloži pročišćen redosled. Vredi ga pokrenuti jer fallback petlja
u `callGemini` tiho preskače nepostojeće modele — svaki od njih troši po jedan
uzaludan round-trip pri svakom zahtevu.

## Uvoz proizvoda sa linka

Nalepiš link proizvoda sa druge prodavnice, Gemini iz njega izvuče činjenice i
napiše **nov** opis na srpskom sa podnaslovima.

- **Uvezi i pregledaj** — `/admin/products/new`, popuni formu za proveru
- **Uvezi i objavi** — `/admin/ai-studio`, objavljuje odmah

Za Shopify prodavnice se koristi `<putanja>.json`, koji vraća gotov strukturiran
podatak. Za ostale se redom pokušavaju JSON-LD, OpenGraph pa goli tekst.

Model **nikad ne emituje HTML** — vraća strukturirana polja, a tagove sastavlja
`lib/productHtml.ts`. Zato je nemoguće da u opis dospe tag koji CSS ne stilizuje.

Tekst se prepisuje, ne kopira: doslovna kopija nosi duplicate-content kaznu na
Google-u i pravni rizik. Cena se uvozi kao **predlog** — ako valuta izvora nije
RSD, polje to izričito naznači i traži da uneseš iznos ručno.

## Slike

Otpremaju se sa računara na `/admin/products/new` (drag-drop, redosled, glavna
slika). Tip se određuje po *magic bytes*, ne po ekstenziji; SVG je namerno
odbijen jer se lokalne slike serviraju sa istog domena.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Vercel Blob — dva store-a

Pristup (`public` / `private`) je svojstvo **store-a** i ne može se promeniti
posle kreiranja. Zato su potrebna dva:

| Store | Pristup | Šta drži | Zašto tako |
|---|---|---|---|
| glavni | **private** | `products.json`, `orders.json` | `orders.json` sadrži imena, adrese i telefone kupaca — javan store znači da to čita svako sa URL-om |
| medijski | **public** | slike proizvoda | privatan blob Vercel isporučuje samo kroz funkciju preko `get()`, pa bi `<img>` u kupčevom browseru dobio 403, a svaka slika trošila poziv funkcije umesto CDN-a |

Ako medijski store nije podešen, slike padaju nazad na glavni — što radi samo
ako je i on javan. Kod privatnog glavnog store-a upis puca sa
`Cannot use public access on a private store`.

**Podešavanje drugog store-a:** Vercel → Storage → Create Database → Blob →
**Public** → Connect Project. Pri povezivanju izaberi prefiks `BLOB_MEDIA_`;
ako ga Vercel ne ponudi, dodaj ručno u Settings → Environment Variables:

```
BLOB_MEDIA_STORE_ID           # store_... drugog, javnog store-a
BLOB_MEDIA_READ_WRITE_TOKEN   # samo ako ne koristiš OIDC
```

Ako koristiš `vercel env pull`, dodaj ih **na Vercelu** pa povuci ponovo —
ručne izmene u `.env.local` briše sledeći `pull`.

```bash
npm run blob:check     # otprema probni GIF pa ga povlači bez autentifikacije
npm run blob:migrate   # lokalni data/*.json -> Blob (ne seed:blob, taj je demo)
```
