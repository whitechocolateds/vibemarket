/**
 * Vraca proizvode sa ukinutog rasporeda 'konverzija' na jedini preostali.
 *
 *   npm run landing:migrate
 *
 * Brise polje `variant` i, ako je tema bila iz ukinutog skupa, vraca je na
 * podrazumevanu. Bez ovoga bi proizvod ostao sa temom koja vise ne postoji -
 * prikaz bi tiho pao na prvu temu, a u JSON-u bi zauvek stajao mrtav podatak.
 *
 * Jednokratno; kad vise nema takvih proizvoda, skripta i fajl mogu da odu.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { readJsonBlob } from '../lib/blobStore';
import { updateJsonFile } from '../lib/db';
import { LANDING_THEMES, DEFAULT_LANDING_THEME } from '../lib/landing';
import type { Product } from '../lib/types';

const VAZECE = new Set(LANDING_THEMES.map((t) => t.id));

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

  const izmenjeni: string[] = [];

  await updateJsonFile<Product[]>('products.json', (current) => {
    if (current === null) throw new Error('Katalog nije procitan - izmena je zaustavljena.');
    const products = Array.isArray(current) ? current : [];
    let promena = false;

    for (const p of products) {
      const lp = p.landing as (typeof p.landing & { variant?: string }) | undefined;
      if (!lp) continue;

      const imaVarijantu = lp.variant !== undefined;
      const losaTema = !VAZECE.has(lp.theme);
      if (!imaVarijantu && !losaTema) continue;

      if (imaVarijantu) delete lp.variant;
      if (losaTema) lp.theme = DEFAULT_LANDING_THEME.id;
      izmenjeni.push(`${p.handle} (${imaVarijantu ? 'variant obrisan' : ''}${imaVarijantu && losaTema ? ', ' : ''}${losaTema ? 'tema -> ' + DEFAULT_LANDING_THEME.id : ''})`);
      promena = true;
    }

    return promena ? products : null;
  });

  console.log(`izmenjeno proizvoda: ${izmenjeni.length}`);
  for (const red of izmenjeni) console.log('  ' + red);

  // Provera posle upisa - ne verujemo da je proslo, nego pogledamo.
  const posle = await readJsonBlob<Product[]>('products.json');
  if (posle.status !== 'ok') {
    console.log('provera posle upisa nije uspela: ' + posle.status);
    process.exit(1);
  }
  const ostalo = posle.data.filter((p) => {
    const lp = p.landing as (typeof p.landing & { variant?: string }) | undefined;
    return lp && (lp.variant !== undefined || !VAZECE.has(lp.theme));
  });
  console.log(`zaostalih: ${ostalo.length}`);
  if (ostalo.length) process.exit(1);
}

main().catch((e) => {
  console.error('PALO:', e instanceof Error ? e.message : e);
  process.exit(1);
});
