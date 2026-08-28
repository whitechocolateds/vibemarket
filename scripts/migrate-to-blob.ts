/**
 * Prebacivanje LOKALNIH podataka u Vercel Blob.
 *
 *   npm run blob:migrate
 *
 * Razlika u odnosu na `npm run seed:blob`: taj upisuje DEMO proizvode iz
 * mockData. Ovaj uzima ono sto stvarno imas u data/*.json - proizvode koje si
 * uvezao ili rucno napravio, i postojece porudzbine.
 *
 * Ne prepisuje postojeci sadrzaj bez `--force`, da se slucajnim pokretanjem
 * ne obrisu porudzbine koje su vec u Blob-u.
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

async function readLocal<T>(file: string): Promise<T[] | null> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'data', file), 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

async function migrate(file: string, label: string, force: boolean): Promise<boolean> {
  const local = await readLocal(file);
  if (!local) {
    console.log(`  ${label.padEnd(12)} preskacem - nema lokalnog data/${file}`);
    return true;
  }

  const remote = await readJsonFromBlob<unknown[]>(file);
  if (remote && remote.length > 0 && !force) {
    console.log(`  ${label.padEnd(12)} PRESKACEM - Blob vec ima ${remote.length}, lokalno ${local.length}`);
    console.log(`  ${''.padEnd(12)} pokreni sa --force ako hoces da prepises`);
    return false;
  }

  await writeJsonToBlob(file, local);
  const verify = await readJsonFromBlob<unknown[]>(file);
  const ok = Array.isArray(verify) && verify.length === local.length;
  console.log(
    `  ${label.padEnd(12)} ${ok ? 'preneto' : 'UPISANO ALI PROVERA NE VALJA'} - ${local.length} zapisa` +
      (remote && remote.length > 0 ? ` (prepisano preko ${remote.length})` : '')
  );
  return ok;
}

async function main() {
  await loadEnvLocal();
  const force = process.argv.includes('--force');

  console.log('\n─── Prebacivanje lokalnih podataka u Blob ────────────────────\n');

  if (!isBlobStorageEnabled()) {
    console.log('  Blob nije ukljucen. Prvo pokreni:  npm run blob:check\n');
    process.exitCode = 1;
    return;
  }

  if (force) console.log('  --force: postojeci sadrzaj u Blob-u ce biti PREPISAN\n');

  const a = await migrate('products.json', 'Proizvodi', force);
  const b = await migrate('orders.json', 'Porudzbine', force);

  console.log(
    a && b
      ? '\n  Gotovo. Proveri sa: npm run blob:check\n'
      : '\n  Deo nije prenet - vidi poruke iznad.\n'
  );
  process.exitCode = a && b ? 0 : 1;
}

main().catch((err) => {
  console.error('\nPrebacivanje nije uspelo:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
