/**
 * Upisuje tabele poređenja i pitanja iz content/product-content.json u katalog.
 *
 *   npx tsx scripts/apply-product-content.ts        -- proba, ništa se ne upisuje
 *   npx tsx scripts/apply-product-content.ts --da   -- upisuje
 *
 * Sadržaj stoji u JSON fajlu, a ne u kodu, da bi se mogao pregledati i menjati
 * bez diranja skripta - i da ostane u gitu, pa se zna šta je tačno objavljeno.
 *
 * Pre upisa se svaka stavka proverava: nijedan broj iz teksta ne sme biti van
 * opisa tog proizvoda. Izmišljena specifikacija je gora od opšteg teksta, jer
 * izgleda tačno a vodi pravo u reklamaciju.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { htmlToPlainText } from '../lib/sanitizeHtml';
import { readJsonFileResult, updateJsonFile } from '../lib/db';
import type { Product, ProductFaq } from '../lib/types';

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
/** Svaka serija je svoj fajl - lakše se pregleda u pull requestu nego jedan ogroman. */
const IZVOR_DIR = path.join(process.cwd(), 'content', 'product-content');

async function ucitajSadrzaj(): Promise<Record<string, Unos>> {
  const fajlovi = (await fs.readdir(IZVOR_DIR)).filter((f) => f.endsWith('.json')).sort();
  const sve: Record<string, Unos> = {};
  for (const f of fajlovi) {
    const deo = JSON.parse(await fs.readFile(path.join(IZVOR_DIR, f), 'utf-8')) as Record<string, Unos>;
    for (const [h, u] of Object.entries(deo)) {
      if (sve[h]) throw new Error(`Handle "${h}" se pojavljuje u dva fajla.`);
      sve[h] = u;
    }
  }
  return sve;
}

interface Unos {
  comparisonPoints: string[];
  faqs: ProductFaq[];
}

/** Brojevi u obliku pogodnom za poređenje; 1.500 i 1500 se izjednačavaju. */
function brojevi(tekst: string): string[] {
  return (tekst.match(/\d[\d.,]*/g) ?? [])
    .map((n) => n.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.').replace(/\.$/, ''))
    .filter(Boolean);
}

function proveri(unos: Unos, opis: string): string[] {
  const uOpisu = new Set(brojevi(opis));
  const zamerke: string[] = [];

  const gledaj = (tekst: string, gde: string) => {
    const visak = brojevi(tekst).filter((b) => !uOpisu.has(b));
    if (visak.length > 0) zamerke.push(`${gde}: broj van opisa (${visak.join(', ')}) — "${tekst.slice(0, 60)}…"`);
  };

  unos.comparisonPoints.forEach((t, i) => gledaj(t, `stavka ${i + 1}`));
  unos.faqs.forEach((f, i) => gledaj(`${f.question} ${f.answer}`, `pitanje ${i + 1}`));
  return zamerke;
}

async function main() {
  await loadEnvLocal();
  const apply = process.argv.includes('--da');

  const sadrzaj = await ucitajSadrzaj();
  const handles = Object.keys(sadrzaj);

  const res = await readJsonFileResult<Product[]>(FILE);
  if (res.status !== 'ok') {
    console.error(`Katalog nije pročitan (${res.status}). Ništa nije menjano.`);
    if (res.status === 'error') console.error(res.error);
    process.exit(1);
  }

  const poHandle = new Map(res.data.map((p) => [p.handle, p]));
  const spremni: string[] = [];
  const problemi: string[] = [];

  for (const h of handles) {
    const p = poHandle.get(h);
    if (!p) { problemi.push(`${h}: nema ga u katalogu`); continue; }

    const unos = sadrzaj[h];
    if (!unos.comparisonPoints?.length || !unos.faqs?.length) {
      problemi.push(`${h}: prazan unos`);
      continue;
    }

    const zamerke = proveri(unos, htmlToPlainText(p.descriptionHtml ?? ''));
    if (zamerke.length > 0) {
      problemi.push(`${h}:\n    ` + zamerke.join('\n    '));
      continue;
    }
    spremni.push(h);
  }

  console.log(`U fajlu:     ${handles.length}`);
  console.log(`Ispravnih:   ${spremni.length}`);
  console.log(`Sa zamerkom: ${problemi.length}`);
  for (const p of problemi) console.log(`  - ${p}`);

  if (!apply) {
    console.log('\nProba — ništa nije upisano. Za upis dodaj --da');
    return;
  }
  if (problemi.length > 0) {
    console.error('\nUpis je zaustavljen: sredi zamerke iznad pa pokreni ponovo.');
    process.exit(1);
  }

  await updateJsonFile<Product[]>(FILE, (current) => {
    if (current === null) throw new Error('Katalog ne postoji u skladištu.');
    let dirnuto = 0;
    for (const h of spremni) {
      const p = current.find((x) => x.handle === h);
      if (!p) continue;
      p.comparisonPoints = sadrzaj[h].comparisonPoints;
      p.faqs = sadrzaj[h].faqs;
      dirnuto++;
    }
    return dirnuto > 0 ? current : null;
  });

  const posle = await readJsonFileResult<Product[]>(FILE);
  const ukupno =
    posle.status === 'ok' ? posle.data.filter((p) => (p.comparisonPoints?.length ?? 0) > 0).length : -1;
  console.log(`\nUpisano ${spremni.length}. U katalogu sada ${ukupno} proizvoda sa svojim sadržajem.`);
}

main().catch((error) => {
  console.error('\nNije uspelo:');
  console.error(error);
  process.exit(1);
});
