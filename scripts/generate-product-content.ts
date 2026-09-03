/**
 * Pravi tabelu poređenja i pitanja za proizvode koji ih nemaju.
 *
 *   npx tsx scripts/generate-product-content.ts            -- proba, ništa se ne upisuje
 *   npx tsx scripts/generate-product-content.ts --da        -- upisuje
 *   npx tsx scripts/generate-product-content.ts --limit 3   -- samo prva 3
 *   npx tsx scripts/generate-product-content.ts --handle x  -- samo taj proizvod
 *   npx tsx scripts/generate-product-content.ts --sve       -- i one koji već imaju sadržaj
 *
 * Sadržaj se izvodi ISKLJUČIVO iz opisa samog proizvoda. Zato postoji provera
 * ispod: svaki broj koji se pojavi u generisanom tekstu mora postojati i u opisu.
 * Izmišljena specifikacija ("do 900 komada/min" za uređaj koji radi 600) je gora
 * od opšteg teksta jer izgleda tačno, a vodi pravo u reklamaciju.
 *
 * Proizvodi bez upotrebljivog opisa se PRESKAČU. Za njih nema iz čega pisati, pa
 * stranica i dalje prikazuje opšti tekst - to je pošteno stanje dok se opis ne napiše.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { callGeminiJson } from '../lib/gemini';
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
/** Ispod ovoliko znakova opis ne nosi dovoljno da se iz njega išta tvrdi. */
const MIN_OPIS = 300;

interface Izlaz {
  comparisonPoints: string[];
  faqs: ProductFaq[];
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    comparisonPoints: { type: 'ARRAY', items: { type: 'STRING' } },
    faqs: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { question: { type: 'STRING' }, answer: { type: 'STRING' } },
        required: ['question', 'answer'],
      },
    },
  },
  required: ['comparisonPoints', 'faqs'],
};

const UPUTSTVO = `Ti si copywriter srpske internet prodavnice. Pišeš na srpskom, ijekavicu ne koristiš.

Dobijaš OPIS jednog proizvoda. Iz njega praviš dve stvari:
1. "comparisonPoints" - 5 do 6 kratkih stavki za tabelu "Zašto baš ovaj proizvod",
   svaka jedna rečenica, konkretna karakteristika TOG proizvoda.
2. "faqs" - 5 do 6 pitanja koja kupac stvarno postavlja o TOM proizvodu, sa
   odgovorima od 1 do 3 rečenice.

ŽELEZNA PRAVILA:
- Sve što napišeš mora se moći pročitati iz datog opisa. Ne dodaješ nijednu
  brojku, dimenziju, materijal, rok ni funkciju koja u opisu ne postoji.
- Ako opis nešto ne kaže, o tome ne pišeš. Bolje 5 stavki nego 6 izmišljenih.
- NE pišeš o dostavi, plaćanju pouzećem, garanciji, povraćaju novca ni podršci.
  To stoji na drugom mestu na sajtu i isto je za sve proizvode.
- Ne obećavaš više nego što opis tvrdi. Ako opis kaže da nešto "pomaže" ili
  "olakšava", ne pretvaraš to u "garantuje" ili "sprečava".
- Bez praznih superlativa ("najbolji na tržištu", "vrhunski kvalitet").
- Jedno od pitanja neka pokrije ono što kupca najčešće razočara kod te vrste
  proizvoda, ako se odgovor vidi iz opisa (šta uređaj NE radi, šta nije u pakovanju).`;

/** Brojevi iz teksta, u obliku pogodnom za poređenje. */
function brojevi(tekst: string): string[] {
  const nadjeni = tekst.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return nadjeni.map((n) => n.replace(',', '.'));
}

/**
 * Odbacuje stavke koje tvrde broj kojeg u opisu nema.
 *
 * Ovo je jedina provera koja se može uraditi mehanički, a hvata upravo onu vrstu
 * greške koja najviše šteti: uverljivo izmišljenu specifikaciju.
 */
function bezIzmisljenihBrojeva<T>(stavke: T[], tekstOd: (s: T) => string, opis: string): { ok: T[]; odbaceno: string[] } {
  const uOpisu = new Set(brojevi(opis));
  const ok: T[] = [];
  const odbaceno: string[] = [];

  for (const s of stavke) {
    const tekst = tekstOd(s);
    const visak = brojevi(tekst).filter((b) => !uOpisu.has(b));
    if (visak.length > 0) odbaceno.push(`${tekst.slice(0, 70)}… (broj van opisa: ${visak.join(', ')})`);
    else ok.push(s);
  }
  return { ok, odbaceno };
}

/** Stavke o dostavi/plaćanju su opšte i ne pripadaju tabeli proizvoda. */
const OPSTE = /dostav|pouze[ćc]|garanci|povra[ćc]aj novca|podršk|besplatn.{0,12}slanj|rok isporuke/i;

async function zaProizvod(p: Product): Promise<{ izlaz: Izlaz; odbaceno: string[] } | null> {
  const opis = htmlToPlainText(p.descriptionHtml ?? '').trim();
  if (opis.length < MIN_OPIS) return null;

  const prompt = `NAZIV: ${p.title}\n\nOPIS:\n${opis.slice(0, 6000)}`;
  const sirovo = await callGeminiJson<Izlaz>(prompt, {
    systemInstruction: UPUTSTVO,
    responseSchema: SCHEMA,
    temperature: 0.4,
  });

  const tacke = (sirovo.comparisonPoints ?? [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .filter((t) => !OPSTE.test(t));
  const pitanja = (sirovo.faqs ?? [])
    .filter((f) => f && f.question && f.answer)
    .map((f) => ({ question: String(f.question).trim(), answer: String(f.answer).trim() }))
    .filter((f) => !OPSTE.test(f.question) && !OPSTE.test(f.answer));

  const a = bezIzmisljenihBrojeva(tacke, (t) => t, opis);
  const b = bezIzmisljenihBrojeva(pitanja, (f) => `${f.question} ${f.answer}`, opis);

  return {
    izlaz: { comparisonPoints: a.ok.slice(0, 6), faqs: b.ok.slice(0, 6) },
    odbaceno: [...a.odbaceno, ...b.odbaceno],
  };
}

async function main() {
  await loadEnvLocal();
  const args = process.argv.slice(2);
  const apply = args.includes('--da');
  const sve = args.includes('--sve');
  const limit = Number(args[args.indexOf('--limit') + 1]) || Infinity;
  const samoHandle = args.includes('--handle') ? args[args.indexOf('--handle') + 1] : null;

  const res = await readJsonFileResult<Product[]>(FILE);
  if (res.status !== 'ok') {
    console.error(`Katalog nije pročitan (${res.status}). Ništa nije menjano.`);
    if (res.status === 'error') console.error(res.error);
    process.exit(1);
  }

  let redosled = res.data;
  if (samoHandle) redosled = redosled.filter((p) => p.handle === samoHandle);
  else if (!sve) redosled = redosled.filter((p) => (p.comparisonPoints?.length ?? 0) === 0);

  const preskoceni: string[] = [];
  const uradjeni: { handle: string; izlaz: Izlaz; odbaceno: string[] }[] = [];
  let obradjeno = 0;

  for (const p of redosled) {
    if (obradjeno >= limit) break;

    const opis = htmlToPlainText(p.descriptionHtml ?? '').trim();
    if (opis.length < MIN_OPIS) {
      preskoceni.push(`${p.title} (${opis.length} znakova opisa)`);
      continue;
    }

    obradjeno++;
    process.stdout.write(`[${obradjeno}] ${p.title.slice(0, 48)} … `);
    try {
      const r = await zaProizvod(p);
      if (!r || r.izlaz.comparisonPoints.length < 3 || r.izlaz.faqs.length < 3) {
        console.log('premalo upotrebljivog, preskačem');
        preskoceni.push(`${p.title} (model nije dao dovoljno)`);
        continue;
      }
      uradjeni.push({ handle: p.handle, izlaz: r.izlaz, odbaceno: r.odbaceno });
      console.log(
        `${r.izlaz.comparisonPoints.length} stavki, ${r.izlaz.faqs.length} pitanja` +
          (r.odbaceno.length ? `  (odbačeno ${r.odbaceno.length})` : '')
      );
      for (const o of r.odbaceno) console.log(`      odbačeno: ${o}`);
    } catch (e) {
      console.log(`greška: ${e instanceof Error ? e.message.slice(0, 90) : 'nepoznata'}`);
      preskoceni.push(`${p.title} (greška pri generisanju)`);
    }
  }

  console.log(`\nSpremno za upis: ${uradjeni.length}`);
  console.log(`Preskočeno:      ${preskoceni.length}`);
  for (const s of preskoceni) console.log(`  - ${s}`);

  if (!apply) {
    console.log('\nProba — ništa nije upisano. Za upis dodaj --da');
    if (uradjeni.length > 0) {
      const prvi = uradjeni[0];
      console.log(`\nPrimer (${prvi.handle}):`);
      for (const t of prvi.izlaz.comparisonPoints) console.log(`  ✓ ${t}`);
      for (const f of prvi.izlaz.faqs) console.log(`  ? ${f.question}\n    ${f.answer}`);
    }
    return;
  }

  if (uradjeni.length === 0) return;

  // Jedan upis za sve odjednom, kroz uslovan upis sa ponavljanjem na sudar
  await updateJsonFile<Product[]>(FILE, (current) => {
    if (current === null) throw new Error('Katalog ne postoji u skladištu.');
    let dirnuto = 0;
    for (const u of uradjeni) {
      const p = current.find((x) => x.handle === u.handle);
      if (!p) continue;
      p.comparisonPoints = u.izlaz.comparisonPoints;
      p.faqs = u.izlaz.faqs;
      dirnuto++;
    }
    return dirnuto > 0 ? current : null;
  });

  const posle = await readJsonFileResult<Product[]>(FILE);
  const saSadrzajem =
    posle.status === 'ok' ? posle.data.filter((p) => (p.comparisonPoints?.length ?? 0) > 0).length : -1;
  console.log(`\nUpisano ${uradjeni.length}. U katalogu sada ${saSadrzajem} proizvoda sa svojim sadržajem.`);
}

main().catch((error) => {
  console.error('\nNije uspelo:');
  console.error(error);
  process.exit(1);
});
