/**
 * Provera Meta Pixel / Conversions API podesavanja.
 *
 *   npm run meta:check
 *
 * Proverava ono sto se ne vidi dok ne krene saobracaj:
 *  1. da li su oba ID-a postavljena i da li su ISTI (najcesca greska)
 *  2. da li token stvarno radi - salje probni event na Graph API
 *  3. da li se event vezuje za tvoj pixel
 *
 * Token se nikada ne ispisuje.
 */

import { promises as fs } from 'fs';
import path from 'path';

const GRAPH = 'https://graph.facebook.com/v20.0';

async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, value] = m;
      if (process.env[key] === undefined) process.env[key] = value.replace(/^["']|["']$/g, '');
    }
  } catch {
    /* nema .env.local */
  }
}

function line(label: string, value: string) {
  console.log(`  ${label.padEnd(28)} ${value}`);
}

async function main() {
  await loadEnvLocal();

  const publicId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const serverId = process.env.META_PIXEL_ID?.trim();
  const token = process.env.META_CONVERSIONS_API_TOKEN?.trim();
  const testCode = process.env.META_TEST_EVENT_CODE?.trim();

  console.log('\n─── Meta Pixel podesavanje ───────────────────────────────────\n');

  if (!publicId && !serverId && !token) {
    console.log('  Nista nije postavljeno. Pracenje reklama je iskljuceno.\n');
    console.log('  1. Otvori https://business.facebook.com/events_manager');
    console.log('  2. Data sources -> izaberi pixel -> prepisi ID (15-16 cifara)');
    console.log('  3. U .env.local odkomentarisi i upisi:');
    console.log('       NEXT_PUBLIC_META_PIXEL_ID=<isti broj>');
    console.log('       META_PIXEL_ID=<isti broj>');
    console.log('  4. Za server-side pracenje: Settings -> Conversions API ->');
    console.log('     Generate access token -> META_CONVERSIONS_API_TOKEN=<token>');
    console.log('  5. Pokreni ponovo: npm run meta:check\n');
    process.exitCode = 1;
    return;
  }

  let problems = 0;

  // ── Pixel ID ───────────────────────────────────────────────────────────────
  if (!publicId) {
    line('NEXT_PUBLIC_META_PIXEL_ID', 'NEDOSTAJE - pixel se nece ni ugraditi u stranicu');
    problems++;
  } else if (!/^\d{15,16}$/.test(publicId)) {
    line('NEXT_PUBLIC_META_PIXEL_ID', `${publicId} - NEOCEKIVAN OBLIK (ocekuje se 15-16 cifara)`);
    problems++;
  } else {
    line('NEXT_PUBLIC_META_PIXEL_ID', `${publicId} (browser)`);
  }

  if (!serverId) {
    line('META_PIXEL_ID', 'NEDOSTAJE - Conversions API je iskljucen');
    problems++;
  } else {
    line('META_PIXEL_ID', `${serverId} (server)`);
  }

  if (publicId && serverId && publicId !== serverId) {
    console.log('\n  GRESKA: dva ID-a se razlikuju. Moraju biti ISTI broj -');
    console.log('  inace klijentski i serverski event zavrsavaju u razlicitim pixelima');
    console.log('  i Meta ih ne moze deduplicirati (kupovine se broje dvaput ili nikako).');
    problems++;
  }

  line('META_CONVERSIONS_API_TOKEN', token ? `postavljen (${token.length} znakova)` : 'nije postavljen (opciono)');
  line('META_TEST_EVENT_CODE', testCode || 'nije postavljen');

  // ── Provera tokena ─────────────────────────────────────────────────────────
  if (!token || !serverId) {
    console.log('\n  Bez tokena se salje samo klijentski Pixel. To radi, ali gubis');
    console.log('  konverzije kupaca koji imaju ad-blocker ili iOS zastitu.\n');
    process.exitCode = problems > 0 ? 1 : 0;
    return;
  }

  console.log('\n─── Provera Conversions API tokena ───────────────────────────\n');

  if (!testCode) {
    console.log('  META_TEST_EVENT_CODE nije postavljen, pa probni event nije poslat.');
    console.log('  Bez njega bi test upao u pravu statistiku. Uzmi kod u');
    console.log('  Events Manager -> Test events i pokreni ponovo.\n');
    process.exitCode = problems > 0 ? 1 : 0;
    return;
  }

  const body = {
    data: [
      {
        event_name: 'PageView',
        event_time: Math.floor(Date.now() / 1000),
        event_id: `meta-check-${Date.now()}`,
        action_source: 'website',
        event_source_url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        user_data: {
          // Meta trazi BAR DVA parametra za povezivanje; sam user agent odbija
          // kao "prosirok za matching" (Invalid parameter / insufficient customer information)
          client_user_agent: 'Mozilla/5.0 (compatible; VibeMarketMetaCheck/1.0)',
          client_ip_address: '127.0.0.1',
        },
      },
    ],
    test_event_code: testCode,
  };

  try {
    const res = await fetch(`${GRAPH}/${serverId}/events?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const json = await res.json();

    if (res.ok && json.events_received >= 1) {
      console.log(`  Probni event primljen. events_received = ${json.events_received}`);
      console.log(`  Pogledaj ga u Events Manager -> Test events (kod ${testCode}).`);
      console.log('\n  Token radi. Kad zavrsis proveru, obrisi META_TEST_EVENT_CODE');
      console.log('  iz .env.local da pravi saobracaj ne zavrsi u test rezimu.\n');
    } else {
      problems++;
      const err = json?.error ?? {};

      const msg = err.message ?? JSON.stringify(json).slice(0, 200);
      console.log(`  Meta je odbila event (HTTP ${res.status}).`);
      console.log(`  Poruka: ${msg}`);
      // Pravi razlog je skoro uvek ovde, a ne u `message`
      if (err.error_user_title) console.log(`  Razlog: ${err.error_user_title}`);
      if (err.error_user_msg) console.log(`  Detalj: ${err.error_user_msg}`);
      if (/access token/i.test(msg)) {
        console.log('\n  Token nije validan ili je opozvan. Generisi novi u');
        console.log('  Events Manager -> Settings -> Conversions API.');
      } else if (/does not exist|Unsupported/i.test(msg)) {
        console.log('\n  Pixel sa tim ID-em nije nadjen. Proveri META_PIXEL_ID.');
      }
      console.log('');
    }
  } catch (err) {
    problems++;
    console.log(`  Zahtev nije uspeo: ${err instanceof Error ? err.message : err}\n`);
  }

  process.exitCode = problems > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('\nProvera nije uspela:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
