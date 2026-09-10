# Generatori PDF vodiča

Prave dva PDF-a koji stoje uz proizvod „Traka za vežbanje sa šipkom"
(handle `prenosivi-pilates-studio-sf-18`). Gotovi fajlovi žive u `public/docs/`,
a stranica proizvoda ih čita iz [`lib/productDocs.ts`](../../lib/productDocs.ts).

Ovo je **jednokratna stvar za taj jedan proizvod**, ne opšta funkcija.

## Pokretanje

Ne zavise od aplikacije i ne idu u `package.json` — imaju svoje zavisnosti:

```bash
cd scripts/pdf
npm init -y
npm i pdfkit@0.15.0
```

Font (Inter, SIL Open Font License) se ne drži u repou. Preuzmi ga i raspakuj
tako da putanja bude `scripts/pdf/fonts/inter/extras/ttf/Inter-Regular.ttf`:

```bash
curl -L -o inter.zip https://github.com/rsms/inter/releases/download/v4.0/Inter-4.0.zip
```

Zatim:

```bash
node ishrana.js
node vezbe.js
```

Izlaz ide u `scripts/pdf/out/`. Prekopiraj ga u `public/docs/` i, ako se broj
strana promenio, ispravi polje `meta` u `lib/productDocs.ts`.

## Šta je gde

| Fajl | Sadržaj |
|---|---|
| `kit.js` | Brend-kit: fontovi, boje, naslovna, tabele, ikone, prelom strana |
| `ishrana.js` | Sadržaj plana ishrane |
| `vezbe.js` | Sadržaj plana vežbi |

Emodžiji se u PDF-u **ne koriste** — Inter nema glifove za njih, pa bi se
iscrtali kao prazni kvadrati. Ikone su zato vektorske, u `kit.js`.
