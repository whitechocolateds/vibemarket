/**
 * Uklanja demo proizvode iz pravog kataloga.
 *
 *   npm run products:clean-demo          -- samo pokaze sta bi obrisao
 *   npm run products:clean-demo -- --da  -- stvarno brise
 *
 * Zasto postoji: dok se seed pokretao i na neuspelo citanje, demo katalog je
 * umeo da se upise preko pravog. Uzrok je otklonjen, ali proizvodi koji su vec
 * dospeli u skladiste treba nekako da izadju napolje.
 *
 * Brise se SAMO ono sto se poklapa sa MOCK_PRODUCTS i po id-u i po handle-u i
 * po nazivu. Proizvod koji je stvarno uvezen sa Shopify-ja ima shopifyProductId
 * i takav se nikada ne dira.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { MOCK_PRODUCTS } from '../lib/mockData';
import { readJsonBlob, writeJsonToBlob, isBlobStorageEnabled } from '../lib/blobStore';
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

const DEMO_IDS = new Set(MOCK_PRODUCTS.map((p) => p.id));
const DEMO_HANDLES = new Set(MOCK_PRODUCTS.map((p) => p.handle));
const DEMO_TITLES = new Set(MOCK_PRODUCTS.map((p) => p.title));

/** Sva tri moraju da se poklope - jedno poklapanje nije dovoljno da se nesto obrise. */
function isDemo(p: Product): boolean {
  if (p.shopifyProductId) return false;
  return DEMO_IDS.has(p.id) && DEMO_HANDLES.has(p.handle) && DEMO_TITLES.has(p.title);
}

const FILE = 'products.json';

async function main() {
  await loadEnvLocal();
  const apply = process.argv.includes('--da');

  let products: Product[];
  let etag = '';
  const local = path.join(process.cwd(), 'data', FILE);

  if (isBlobStorageEnabled()) {
    console.log('Izvor: Vercel Blob\n');
    const res = await readJsonBlob<Product[]>(FILE);
    if (res.status === 'missing') {
      console.log('U skladistu nema products.json - nema sta da se cisti.');
      return;
    }
    if (res.status === 'error') {
      console.error('Citanje nije uspelo, nista nije menjano:');
      console.error(res.error);
      process.exit(1);
    }
    products = res.data;
    etag = res.etag;
  } else {
    console.log(`Izvor: ${local}\n`);
    products = JSON.parse(await fs.readFile(local, 'utf-8'));
  }

  const demo = products.filter(isDemo);
  const keep = products.filter((p) => !isDemo(p));

  console.log(`Ukupno u katalogu: ${products.length}`);
  console.log(`Demo za brisanje:  ${demo.length}`);
  console.log(`Ostaje:            ${keep.length}\n`);

  for (const p of demo) console.log(`  - ${p.id.padEnd(10)} ${p.title}`);
  if (demo.length === 0) {
    console.log('  (nista)');
    return;
  }

  if (!apply) {
    console.log('\nOvo je bila samo proba. Za stvarno brisanje:');
    console.log('  npm run products:clean-demo -- --da');
    return;
  }

  if (isBlobStorageEnabled()) {
    // Uslovan upis: ako je neko izmenio katalog otkad smo ga procitali, pada
    await writeJsonToBlob(FILE, keep, etag ? { ifMatch: etag } : {});
  } else {
    await fs.writeFile(local, JSON.stringify(keep, null, 2), 'utf-8');
  }
  console.log(`\nObrisano ${demo.length}. U katalogu ostaje ${keep.length} proizvoda.`);
}

main().catch((error) => {
  console.error('\nCiscenje nije uspelo:');
  console.error(error);
  process.exit(1);
});
