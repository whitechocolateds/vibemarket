/**
 * Provera Vercel Blob skladista.
 *
 *   npm run blob:check
 *
 * Bez Blob-a aplikacija na Vercelu ne moze da pise NISTA - ni proizvode ni
 * porudzbine. To znaci da kupac ne moze ni da zavrsi kupovinu. Lokalno se
 * pise u data/*.json pa se problem ne vidi dok se ne deployuje.
 *
 * Skript stvarno upisuje i cita probni objekat, jer se samo tako vidi da li
 * token ima prava pisanja, a ne samo da postoji.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { isBlobStorageEnabled, readJsonFromBlob, writeJsonToBlob } from '../lib/blobStore';

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

const row = (l: string, v: string) => console.log(`  ${l.padEnd(26)} ${v}`);

async function localCount(file: string): Promise<string> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'data', file), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? `${parsed.length}` : 'nije niz';
  } catch {
    return 'nema fajla';
  }
}

async function main() {
  await loadEnvLocal();

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();

  console.log('\n─── Vercel Blob skladiste ────────────────────────────────────\n');

  if (!isBlobStorageEnabled()) {
    console.log('  Blob NIJE ukljucen. Lokalno se pise u data/*.json, sto radi.');
    console.log('  Na Vercelu fajl sistem je samo za citanje, pa BEZ Blob-a pucaju:');
    console.log('    - uvoz proizvoda');
    console.log('    - cuvanje porudzbina (kupac ne moze da zavrsi kupovinu)');
    console.log('    - otpremanje slika\n');

    if (token) {
      row('BLOB_READ_WRITE_TOKEN', `postavljen ali ne pocinje sa "vercel_blob_rw_"`);
      console.log('\n  Proveri da si kopirao ceo token.\n');
    } else if (storeId) {
      row('BLOB_STORE_ID', 'postavljen ali ne pocinje sa "store_"');
      console.log('');
    } else {
      console.log('  Kako se ukljucuje:');
      console.log('   1. vercel.com -> tvoj projekat -> Storage -> Create Database');
      console.log('   2. izaberi Blob -> ime npr. "vibemarket-data" -> Create');
      console.log('   3. Connect Project -> izaberi projekat i sve tri sredine');
      console.log('      (Production, Preview, Development)');
      console.log('   4. Vercel sam dodaje BLOB_READ_WRITE_TOKEN u projekat');
      console.log('   5. Redeploy - env varijable se citaju tek pri novom deployu\n');
      console.log('  Za lokalnu probu: Storage -> tvoj store -> .env.local tab ->');
      console.log('  kopiraj BLOB_READ_WRITE_TOKEN u .env.local, pa pokreni ovo ponovo.\n');
    }
    process.exitCode = 1;
    return;
  }

  row('BLOB_READ_WRITE_TOKEN', token ? `postavljen (${token.length} znakova)` : 'nije postavljen');
  row('BLOB_STORE_ID', storeId || 'nije postavljen (nije obavezan)');

  // ── Da li token STVARNO moze da pise ──────────────────────────────────────
  console.log('\n─── Provera upisa i citanja ──────────────────────────────────\n');

  const probe = { probe: true, at: new Date().toISOString() };
  try {
    await writeJsonToBlob('_probe.json', probe);
    console.log('  upis    ok');
  } catch (err) {
    console.log(`  upis    NE RADI: ${err instanceof Error ? err.message : err}`);
    console.log('\n  Token postoji ali nema prava pisanja, ili store ne postoji.\n');
    process.exitCode = 1;
    return;
  }

  try {
    const back = await readJsonFromBlob<typeof probe>('_probe.json');
    if (back?.at === probe.at) {
      console.log('  citanje ok');
    } else {
      console.log(`  citanje VRACA POGRESNO: ${JSON.stringify(back)}`);
      process.exitCode = 1;
      return;
    }
  } catch (err) {
    console.log(`  citanje NE RADI: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
    return;
  }

  // ── Sta je vec u skladistu ────────────────────────────────────────────────
  console.log('\n─── Sadrzaj ──────────────────────────────────────────────────\n');

  const blobProducts = await readJsonFromBlob<unknown[]>('products.json');
  const blobOrders = await readJsonFromBlob<unknown[]>('orders.json');

  row('Blob products.json', blobProducts ? `${blobProducts.length} proizvoda` : 'ne postoji');
  row('Blob orders.json', blobOrders ? `${blobOrders.length} porudzbina` : 'ne postoji');
  row('Lokalno data/products.json', await localCount('products.json'));
  row('Lokalno data/orders.json', await localCount('orders.json'));

  const localProducts = await localCount('products.json');
  if (!blobProducts && localProducts !== 'nema fajla' && localProducts !== '0') {
    console.log('\n  Blob je prazan a lokalno imas podatke. Prebaci ih:');
    console.log('     npm run blob:migrate');
    console.log('\n  NE pokrecaj `npm run seed:blob` - on upisuje DEMO proizvode.');
  } else if (blobProducts && blobProducts.length > 0) {
    console.log('\n  Blob je spreman i vec sadrzi podatke.');
  }

  console.log('');
}

main().catch((err) => {
  console.error('\nProvera nije uspela:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
