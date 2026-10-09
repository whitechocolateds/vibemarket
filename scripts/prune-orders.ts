/**
 * Ciscenje porudzbina: brise sve starije od danas i skida mrtvu Shopify oznaku.
 *
 *   npm run orders:prune              -- samo ispise sta bi uradio
 *   npm run orders:prune -- --da      -- stvarno upisuje
 *
 * Zasto postoji: Shopify je ugasen, pa `shopifySync` na starim porudzbinama
 * trajno pali upozorenje u adminu za posao koji vise nema gde da se obavi.
 *
 * Granica brisanja je LOKALNA ponoc danasnjeg dana - sve pre toga ide napolje,
 * danasnje ostaju. Pre upisa se trazi potvrda da se ta granica poklapa sa
 * brojevima porudzbina koje je korisnik naveo (`--od` i `--do`): ako se ne
 * poklopi, skripta NE brise nista. Porudzbine su podaci kupaca i nemaju
 * "undo" - jedina zastita je da se dve nezavisne provere sloze.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { readJsonBlob, writeJsonToBlob, isBlobStorageEnabled } from '../lib/blobStore';
import type { Order } from '../lib/types';

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

const FILE = 'orders.json';

function arg(ime: string): string | undefined {
  const i = process.argv.indexOf(ime);
  return i === -1 ? undefined : process.argv[i + 1];
}

function dan(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function main() {
  await loadEnvLocal();
  const apply = process.argv.includes('--da');
  const ocekivanoDo = arg('--do');   // najnovija koja SME da nestane
  const ocekivanoOd = arg('--od');   // najstarija koja SME da nestane

  if (!isBlobStorageEnabled()) {
    console.error('Blob nije podesen - skripta radi samo nad pravim skladistem.');
    process.exit(1);
  }

  const res = await readJsonBlob<Order[]>(FILE);
  if (res.status !== 'ok') {
    console.error(`Citanje ${FILE} nije uspelo (${res.status}).`);
    process.exit(1);
  }
  const orders = res.data;

  // Lokalna ponoc danasnjeg dana.
  const granica = new Date();
  granica.setHours(0, 0, 0, 0);

  const stare = orders.filter((o) => new Date(o.createdAt) < granica);
  const ostaju = orders.filter((o) => new Date(o.createdAt) >= granica);

  console.log(`Ukupno porudzbina: ${orders.length}`);
  console.log(`Granica: ${dan(granica.toISOString())} (lokalno)\n`);

  console.log(`OSTAJU (${ostaju.length}):`);
  for (const o of ostaju) {
    console.log(`  ${o.orderNumber}  ${dan(o.createdAt)}  ${o.status}  ${o.shopifySync?.status ?? '-'}`);
  }

  console.log(`\nZA BRISANJE (${stare.length}):`);
  for (const o of stare) {
    console.log(`  ${o.orderNumber}  ${dan(o.createdAt)}  ${o.status}  ${o.shopifySync?.status ?? '-'}`);
  }

  // Oznaka slanja na porudzbinama koje ostaju - Shopify je ugasen, posla nema.
  const zaocistiti = ostaju.filter((o) => o.shopifySync);
  console.log(`\nShopify oznaka za skidanje sa preostalih: ${zaocistiti.length}` +
    (zaocistiti.length ? ` (${zaocistiti.map((o) => o.orderNumber).join(', ')})` : ''));

  if (!apply) {
    console.log('\nProbni prolaz - nista nije upisano. Dodaj --da za stvarnu izmenu.');
    return;
  }

  // Dve nezavisne provere moraju da se sloze pre upisa.
  const najnovijaStara = stare[0]?.orderNumber;
  const najstarija = stare[stare.length - 1]?.orderNumber;
  if (ocekivanoDo && najnovijaStara !== ocekivanoDo) {
    console.error(`\nSTOP: najnovija za brisanje je ${najnovijaStara}, ocekivano ${ocekivanoDo}.`);
    process.exit(1);
  }
  if (ocekivanoOd && najstarija !== ocekivanoOd) {
    console.error(`\nSTOP: najstarija za brisanje je ${najstarija}, ocekivano ${ocekivanoOd}.`);
    process.exit(1);
  }

  const novo = ostaju.map((o) => {
    if (!o.shopifySync) return o;
    const kopija = { ...o };
    delete kopija.shopifySync;
    return kopija;
  });

  // Rezerva pre upisa. Ide u /data (gitignorovano) jer sadrzi podatke kupaca.
  const rezerva = path.join(process.cwd(), 'data', `orders-rezerva-${Date.now()}.json`);
  await fs.mkdir(path.dirname(rezerva), { recursive: true });
  await fs.writeFile(rezerva, JSON.stringify(orders, null, 2), 'utf-8');
  console.log(`\nRezerva: ${rezerva}`);

  await writeJsonToBlob(FILE, novo, { ifMatch: res.etag });
  console.log(`\nUpisano. Ostalo ${novo.length} porudzbina, obrisano ${stare.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
