@AGENTS.md

# VibeMarket — pravila za Claude

## Projekat
- VibeMarket: Next.js aplikacija na Vercel Pro, domen **vibemarket.space**.

## "Baza"
- `orders.json` i `products.json` žive u **privatnom** Vercel Blob store-u.
- Slike su u **javnom** media store-u.

## Git i deploy
- Vercel prati GitHub repo `whitechocolateds/vibemarket`, grana `master`.
- Remote `origin` MORA pokazivati na `https://github.com/whitechocolateds/vibemarket.git`
  (ranije je greškom pokazivao na `zoxknez/vibemarket`). Pre push-a proveri `git remote -v`.
- Posle svakog push-a:
  1. `git ls-remote https://github.com/whitechocolateds/vibemarket.git refs/heads/master`
     i potvrdi da se hash poklapa sa `git log -1`.
  2. Potvrdi da je Vercel deploy u statusu **Ready**.

## Porudžbine
- Shopify je otkazan (`SHOPIFY_PUSH_ORDERS=false`). Ne vraćaj Shopify logiku.
- Porudžbine idu na Telegram bota.

## Landing stranice
- Koriste "Priča" layout:
  - sticky traka za kupovinu,
  - `^^fraza^^` za istaknute reči,
  - ikone po paragrafu,
  - scroll animacije.

## Komunikacija
- Komunikacija i izveštaji na srpskom.
- Pre izmena reci koje fajlove menjaš.
- Commit i push radi sam, ali pre push-a mi ukratko reci šta ide na sajt i sačekaj moju potvrdu u chatu.
