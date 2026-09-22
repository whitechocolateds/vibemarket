/**
 * Dopisuje sifre artikla svim proizvodima koji je nemaju.
 *
 *   npm run products:sku
 *
 * Pokrece se jednom, za postojeci katalog. Novi proizvodi sifru dobijaju sami,
 * jer ensureSkus stoji u mutateProducts - jedinom levku kroz koji prolazi svaka
 * izmena kataloga.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { backfillSkus, getAllProducts } from '../lib/productStore';

async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* nema fajla */
  }
}

async function main() {
  await loadEnvLocal();

  const { ukupno, dodato } = await backfillSkus();
  console.log(`katalog: ${ukupno} proizvoda, dopisano sifara: ${dodato}`);

  const posle = await getAllProducts();
  const bez = posle.filter((p) => !p.sku);
  const sifre = posle.map((p) => p.sku!).filter(Boolean);
  const duplikati = sifre.filter((s, i) => sifre.indexOf(s) !== i);

  console.log(`bez sifre: ${bez.length}`);
  console.log(`duplikata: ${duplikati.length}${duplikati.length ? ' -> ' + duplikati.join(', ') : ''}`);
  console.log('\nprvih 10:');
  for (const p of posle.slice(0, 10)) console.log(`  ${p.sku}  ${p.title.slice(0, 55)}`);

  if (bez.length || duplikati.length) process.exit(1);
}

main().catch((e) => {
  console.error('PALO:', e instanceof Error ? e.message : e);
  process.exit(1);
});
