/**
 * Osvezava SAMO dostupnost i zalihu, po stanju na Shopify-ju.
 *
 *   npm run shopify:availability          -- pokaze sta bi promenio
 *   npm run shopify:availability -- --da  -- primeni
 *
 * Postoji da se dostupnost ne mora ispravljati punim uvozom. Pun uvoz ponovo
 * preuzima svaku sliku (~230 slika, ~3 s po proizvodu), a ovde treba promeniti
 * dva polja - naziv, cena, opis i slike se NE diraju.
 *
 * Odluku pravi \`deriveAvailability\` iz lib/shopifyImport, ista koju koristi i
 * uvoz - da se ne razidu.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fetchAllShopifyProducts, deriveAvailability } from '../lib/shopifyImport';
import { isShopifyConfigured } from '../lib/shopify';
import { readJsonFileResult, updateJsonFile } from '../lib/db';
import type { Product } from '../lib/types';

async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* nema fajla */
  }
}

const FILE = 'products.json';

async function main() {
  await loadEnvLocal();
  const apply = process.argv.includes('--da');

  if (!isShopifyConfigured()) {
    console.error('Shopify nije podesen. Prvo: npm run shopify:check');
    process.exit(1);
  }

  const res = await readJsonFileResult<Product[]>(FILE);
  if (res.status !== 'ok') {
    console.error(`Katalog nije procitan (${res.status}). Nista nije menjano.`);
    if (res.status === 'error') console.error(res.error);
    process.exit(1);
  }
  const katalog = res.data;

  const shopify = await fetchAllShopifyProducts();
  const poId = new Map(shopify.filter((s) => s.id).map((s) => [s.id!, s]));

  interface Promena {
    title: string;
    izDostupno: boolean;
    uDostupno: boolean;
    izKolicina: number | undefined;
    uKolicina: number | undefined;
  }
  const promene: Promena[] = [];
  let bezVeze = 0;
  let nemaNaShopifyju = 0;

  for (const p of katalog) {
    if (!p.shopifyProductId) { bezVeze++; continue; }
    const sp = poId.get(p.shopifyProductId);
    if (!sp) { nemaNaShopifyju++; continue; }

    const { tracked, stock, availableForSale } = deriveAvailability(sp, sp.variants?.[0]);
    const novaKolicina = tracked ? Math.max(0, stock) : undefined;
    const staraKolicina = p.variants[0]?.quantityAvailable;

    if (p.availableForSale !== availableForSale || staraKolicina !== novaKolicina) {
      promene.push({
        title: p.title,
        izDostupno: p.availableForSale,
        uDostupno: availableForSale,
        izKolicina: staraKolicina,
        uKolicina: novaKolicina,
      });
    }
  }

  const kol = (q: number | undefined) => (q === undefined ? 'ne prati se' : String(q));

  console.log(`Katalog:            ${katalog.length}`);
  console.log(`Na Shopify-ju:      ${shopify.length}`);
  if (bezVeze) console.log(`Bez veze sa Shopify-jem (ne diraju se): ${bezVeze}`);
  if (nemaNaShopifyju) console.log(`Vise ne postoje na Shopify-ju (ne diraju se): ${nemaNaShopifyju}`);
  console.log(`Za promenu:         ${promene.length}\n`);

  for (const c of promene.slice(0, 100)) {
    console.log(
      `  ${c.izDostupno ? 'dostupno' : 'rasprodato'} -> ${c.uDostupno ? 'DOSTUPNO' : 'rasprodato'}` +
        `  |  zaliha ${kol(c.izKolicina)} -> ${kol(c.uKolicina)}  |  ${c.title.slice(0, 44)}`
    );
  }
  if (promene.length > 100) console.log(`  ... i jos ${promene.length - 100}`);

  if (promene.length === 0) {
    console.log('Nista se ne menja.');
    return;
  }

  if (!apply) {
    console.log('\nOvo je bila proba. Za primenu:');
    console.log('  npm run shopify:availability -- --da');
    return;
  }

  // Jedan upis za sve, kroz uslovan upis sa ponavljanjem na sudar
  const imena = new Set(promene.map((c) => c.title));
  await updateJsonFile<Product[]>(FILE, (current) => {
    if (current === null) throw new Error('Katalog ne postoji u skladistu.');
    let dirnuto = 0;

    for (const p of current) {
      if (!p.shopifyProductId || !imena.has(p.title)) continue;
      const sp = poId.get(p.shopifyProductId);
      if (!sp) continue;

      const { tracked, stock, availableForSale } = deriveAvailability(sp, sp.variants?.[0]);
      p.availableForSale = availableForSale;
      for (const v of p.variants) {
        v.availableForSale = availableForSale;
        if (tracked) v.quantityAvailable = Math.max(0, stock);
        else delete v.quantityAvailable;
      }
      dirnuto++;
    }

    return dirnuto > 0 ? current : null;
  });

  const posle = await readJsonFileResult<Product[]>(FILE);
  const dostupno = posle.status === 'ok' ? posle.data.filter((p) => p.availableForSale).length : -1;
  console.log(`\nPrimenjeno. Dostupnih u katalogu: ${dostupno} od ${katalog.length}.`);
}

main().catch((error) => {
  console.error('\nOsvezavanje nije uspelo:');
  console.error(error);
  process.exit(1);
});
