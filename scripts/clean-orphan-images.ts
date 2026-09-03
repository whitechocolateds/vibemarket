/**
 * Brise slike koje nijedan proizvod i nijedna porudzbina ne koriste.
 *
 *   npm run blob:clean-images          -- samo pokaze
 *   npm run blob:clean-images -- --da  -- stvarno brise
 *
 * Odakle takve slike: svaki uvoz sa Shopify-ja prvo preuzme slike, pa tek onda
 * upisuje proizvode. Kad upis padne - a padao je - slike ostanu, a proizvodi ne.
 * Izmereno posle serije neuspelih uvoza: 719 od 948 objekata (195,8 MB) nije
 * vezano ni za sta.
 *
 * Sta se smatra "u upotrebi": naslovna slika, sve slike proizvoda, slike unutar
 * HTML opisa (src="..."), i slike stavki u porudzbinama - da se istorija
 * porudzbina ne oglusi o sopstvene slicice.
 *
 * NAMERNO ne brise po datumu ni po imenu, nego iskljucivo po tome sto na objekat
 * niko ne pokazuje. I odbija da radi ako katalog nije procitan - inace bi
 * neuspelo citanje izgledalo kao "nista se ne koristi" i pobrisalo sve.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { del, list } from '@vercel/blob';
import { readJsonBlob } from '../lib/blobStore';
import type { Order, Product } from '../lib/types';

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

const mb = (n: number) => (n / 1024 / 1024).toFixed(1);

async function main() {
  await loadEnvLocal();
  const apply = process.argv.includes('--da');

  const media = {
    ...(process.env.BLOB_MEDIA_READ_WRITE_TOKEN ? { token: process.env.BLOB_MEDIA_READ_WRITE_TOKEN } : {}),
    ...(process.env.BLOB_MEDIA_STORE_ID ? { storeId: process.env.BLOB_MEDIA_STORE_ID } : {}),
  };
  if (!media.token && !media.storeId) {
    console.error('Media Blob store nije podesen. Provera: npm run blob:check');
    process.exit(1);
  }

  const katalog = await readJsonBlob<Product[]>('products.json');
  if (katalog.status !== 'ok') {
    console.error(
      `Katalog nije procitan (${katalog.status}). Brisanje je zaustavljeno - bez kataloga bi ` +
        'ispalo da nijedna slika nije u upotrebi, pa bi se obrisale sve.'
    );
    if (katalog.status === 'error') console.error(katalog.error);
    process.exit(1);
  }
  const porudzbine = await readJsonBlob<Order[]>('orders.json');
  if (porudzbine.status === 'error') {
    console.error('Porudzbine nisu procitane; brisanje je zaustavljeno da se ne obrisu slike iz istorije.');
    process.exit(1);
  }

  const uUpotrebi = new Set<string>();
  const dodaj = (u?: string | null) => { if (u) uUpotrebi.add(u.split('?')[0]); };

  for (const p of katalog.data) {
    dodaj(p.featuredImage?.url);
    for (const im of p.images ?? []) dodaj(im.url);
    // slike ubacene kroz tekst editor zive samo u HTML-u opisa
    for (const m of String(p.descriptionHtml ?? '').matchAll(/src="([^"]+)"/g)) dodaj(m[1]);
  }
  if (porudzbine.status === 'ok') {
    for (const o of porudzbine.data) for (const it of o.items ?? []) dodaj(it.image?.url);
  }

  let cursor: string | undefined;
  const svi: { pathname: string; url: string; size: number; uploadedAt: Date }[] = [];
  do {
    const r = await list({ ...media, limit: 1000, ...(cursor ? { cursor } : {}) } as never);
    svi.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);

  const siroce = svi.filter((b) => !uUpotrebi.has(b.url.split('?')[0]));
  const bajtova = siroce.reduce((s, b) => s + b.size, 0);

  console.log(`Proizvoda u katalogu:  ${katalog.data.length}`);
  console.log(`Porudzbina:            ${porudzbine.status === 'ok' ? porudzbine.data.length : 0}`);
  console.log(`Slika u upotrebi:      ${uUpotrebi.size}`);
  console.log(`Objekata u store-u:    ${svi.length}  (${mb(svi.reduce((s, b) => s + b.size, 0))} MB)`);
  console.log(`Nekoriscenih:          ${siroce.length}  (${mb(bajtova)} MB)\n`);

  if (siroce.length === 0) { console.log('Nema sta da se brise.'); return; }

  for (const b of siroce.slice(0, 15)) {
    console.log(`  ${b.pathname.slice(0, 72)}  ${(b.size / 1024).toFixed(0)} KB  ${b.uploadedAt.toISOString().slice(0, 10)}`);
  }
  if (siroce.length > 15) console.log(`  ... i jos ${siroce.length - 15}`);

  if (!apply) {
    console.log('\nOvo je bila proba, nista nije obrisano. Za stvarno brisanje:');
    console.log('  npm run blob:clean-images -- --da');
    return;
  }

  let obrisano = 0;
  for (const b of siroce) {
    try { await del(b.url, media); obrisano++; }
    catch (e) { console.error(`  nije obrisano: ${b.pathname} - ${(e as Error).message}`); }
  }
  console.log(`\nObrisano ${obrisano} od ${siroce.length}. Oslobodjeno oko ${mb(bajtova)} MB.`);
}

main().catch((error) => {
  console.error('\nCiscenje nije uspelo:');
  console.error(error);
  process.exit(1);
});
