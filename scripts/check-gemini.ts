/**
 * Provera Gemini podesavanja.
 *
 *   npm run gemini:check
 *
 * Radi tri stvari koje se ne mogu proveriti bez pravog kljuca:
 *  1. koji od modela iz VALID_MODELS zaista postoje (lista je delom nagadjana,
 *     a tihi fallback u callGemini maskira 404 - svaki zahtev tada placa pun
 *     round-trip po mrtvom modelu)
 *  2. da li model prihvata responseSchema (koristi ga uvoz sa linka)
 *  3. da li prihvata google_search alat (koristi ga generisanje iz slobodnog teksta)
 *
 * Na kraju ispisuje preporuceni redosled za VALID_MODELS.
 * Kljuc se nikada ne ispisuje.
 */

import { promises as fs } from 'fs';
import path from 'path';

const API = 'https://generativelanguage.googleapis.com/v1beta';

async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, value] = match;
      if (process.env[key] === undefined) {
        process.env[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* nema .env.local - oslanjamo se na okruzenje */
  }
}

interface Probe {
  model: string;
  plain: 'ok' | string;
  schema: 'ok' | string;
  search: 'ok' | string;
}

async function probe(model: string, key: string, variant: 'plain' | 'schema' | 'search'): Promise<'ok' | string> {
  const payload: Record<string, unknown> = {
    contents: [{ parts: [{ text: variant === 'schema' ? 'Vrati {"ok": true}' : 'Odgovori samo: ok' }] }],
  };

  if (variant === 'schema') {
    payload.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: { ok: { type: 'BOOLEAN' } },
        required: ['ok'],
      },
    };
  }
  if (variant === 'search') {
    payload.tools = [{ google_search: {} }];
  }

  try {
    const res = await fetch(`${API}/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const text = await res.text();
      const reason = text.match(/"message"\s*:\s*"([^"]{0,90})/)?.[1] ?? `HTTP ${res.status}`;
      return `${res.status}: ${reason}`;
    }

    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ? 'ok' : 'prazan odgovor';
  } catch (err) {
    return err instanceof Error ? err.message.slice(0, 60) : 'greska';
  }
}

async function main() {
  await loadEnvLocal();
  const key = process.env.GEMINI_API_KEY?.trim();

  console.log('\n─── Provera Gemini podesavanja ───────────────────────────────\n');

  if (!key) {
    console.log('  GEMINI_API_KEY nije postavljen.\n');
    console.log('  1. Otvori https://aistudio.google.com/apikey');
    console.log('  2. "Create API key" (obican Google nalog)');
    console.log('  3. U .env.local odkomentarisi red i upisi kljuc:');
    console.log('       GEMINI_API_KEY=AIza...');
    console.log('  4. Pokreni ponovo: npm run gemini:check\n');
    process.exitCode = 1;
    return;
  }

  console.log(`  Kljuc: pronadjen (${key.length} znakova, pocinje sa "${key.slice(0, 4)}")`);
  if (!key.startsWith('AIza')) {
    console.log('  UPOZORENJE: Gemini kljucevi obicno pocinju sa "AIza". Proveri da nisi zalepio nesto drugo.');
  }

  // ── 1. Koji modeli postoje ────────────────────────────────────────────────
  console.log('\n─── Dostupni modeli ──────────────────────────────────────────\n');

  let available: string[] = [];
  try {
    const res = await fetch(`${API}/models?key=${key}`, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      const text = await res.text();
      console.log(`  Lista modela nije dostupna (HTTP ${res.status}).`);
      if (res.status === 400 || res.status === 403) {
        console.log('  To obicno znaci da kljuc nije validan ili API nije ukljucen za projekat.');
        const reason = text.match(/"message"\s*:\s*"([^"]{0,120})/)?.[1] ?? text.slice(0, 120);
        console.log(`  Detalj: ${reason}\n`);
        process.exitCode = 1;
        return;
      }
    } else {
      const json = await res.json();
      type ApiModel = { name: string; supportedGenerationMethods?: string[] };
      available = (json.models as ApiModel[])
        .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m) => m.name.replace(/^models\//, ''))
        .filter((n) => n.startsWith('gemini'));

      console.log(`  Nalog vidi ${available.length} gemini modela za generateContent:`);
      for (const m of available) console.log(`    · ${m}`);
    }
  } catch (err) {
    console.log(`  Greska pri citanju liste: ${err instanceof Error ? err.message : err}`);
  }

  // ── 2. Sta iz VALID_MODELS zaista radi ───────────────────────────────────
  const { VALID_MODELS } = await import('../lib/gemini');

  console.log('\n─── Provera VALID_MODELS iz lib/gemini.ts ────────────────────\n');
  console.log('  Testira se: obican poziv | responseSchema (uvoz) | google_search (slobodan tekst)\n');

  const results: Probe[] = [];
  for (const model of VALID_MODELS) {
    const listed = available.length === 0 || available.includes(model);
    if (!listed) {
      console.log(`  ${model.padEnd(24)} NEMA GA u listi naloga - preskacem`);
      results.push({ model, plain: 'nije u listi', schema: '-', search: '-' });
      continue;
    }

    const plain = await probe(model, key, 'plain');
    const schema = plain === 'ok' ? await probe(model, key, 'schema') : '-';
    const search = plain === 'ok' ? await probe(model, key, 'search') : '-';

    results.push({ model, plain, schema, search });
    const mark = (v: string) => (v === 'ok' ? 'ok  ' : v === '-' ? '-   ' : 'X   ');
    console.log(`  ${model.padEnd(24)} ${mark(plain)} ${mark(schema)} ${mark(search)}`);
    if (plain !== 'ok' && plain !== '-') console.log(`      -> ${plain}`);
    if (schema !== 'ok' && schema !== '-') console.log(`      -> schema: ${schema}`);
    if (search !== 'ok' && search !== '-') console.log(`      -> search: ${search}`);
  }

  // ── 3. Zakljucak ─────────────────────────────────────────────────────────
  console.log('\n─── Zakljucak ────────────────────────────────────────────────\n');

  const working = results.filter((r) => r.plain === 'ok');
  const dead = results.filter((r) => r.plain !== 'ok');
  const schemaOk = working.filter((r) => r.schema === 'ok');
  const searchOk = working.filter((r) => r.search === 'ok');

  if (working.length === 0) {
    console.log('  Nijedan model iz VALID_MODELS ne radi. Uvoz i generisanje nece raditi.');
    if (available.length > 0) {
      console.log('  Zameni VALID_MODELS necim iz liste iznad.');
    }
    process.exitCode = 1;
    return;
  }

  console.log(`  Radi ${working.length} od ${results.length} modela.`);
  console.log(`  Uvoz sa linka (responseSchema): ${schemaOk.length > 0 ? `radi na ${schemaOk.length}` : 'NE RADI NI NA JEDNOM'}`);
  console.log(`  Slobodan tekst (google_search): ${searchOk.length > 0 ? `radi na ${searchOk.length}` : 'NE RADI NI NA JEDNOM'}`);

  if (dead.length > 0) {
    console.log(`\n  ${dead.length} model(a) ne radi. Svaki od njih trosi po jedan uzaludan`);
    console.log('  round-trip pri svakom zahtevu jer fallback petlja tiho prelazi dalje.');
    console.log('  Preporuceni VALID_MODELS (samo oni koji rade, schema-sposobni prvi):\n');

    const ordered = [
      ...working.filter((r) => r.schema === 'ok').map((r) => r.model),
      ...working.filter((r) => r.schema !== 'ok').map((r) => r.model),
    ];
    console.log('    export const VALID_MODELS = [');
    for (const m of ordered) console.log(`      '${m}',`);
    console.log('    ];\n');
  } else {
    console.log('\n  Svi modeli rade - nema sta da se menja.\n');
  }

  if (schemaOk.length === 0) {
    console.log('  PAZNJA: responseSchema ne radi nigde. callGeminiJson ima fallback koji');
    console.log('  ponavlja poziv bez scheme, pa ce uvoz raditi ali manje pouzdano.\n');
  }
}

main().catch((err) => {
  console.error('\nProvera nije uspela:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
