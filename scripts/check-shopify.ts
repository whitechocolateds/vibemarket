/**
 * Provera veze sa Shopify nalogom.
 *
 *   npm run shopify:check
 *
 * Radi ono sto se ne moze pretpostaviti iz koda:
 *  1. da li domen i token uopste rade
 *  2. koja verzija Admin API-ja je ziva na tom nalogu (ne nagadja se)
 *  3. koje je dozvole aplikacija stvarno dobila
 *  4. da li je valuta prodavnice RSD, jer ova prodavnica racuna iskljucivo u RSD
 *  5. koliko proizvoda ima za uvoz
 *
 * Token se nikada ne ispisuje.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  CANDIDATE_API_VERSIONS, normalizeShopDomain, getShopInfo, getGrantedScopes,
  shopifyFetch, REQUIRED_SCOPES, getShopifyConfig, type ShopifyConfig,
} from '../lib/shopify';

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

const row = (l: string, v: string) => console.log(`  ${l.padEnd(24)} ${v}`);

async function main() {
  await loadEnvLocal();

  const rawShop = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  const staticToken = process.env.SHOPIFY_ADMIN_TOKEN?.trim();
  const haveCreds = Boolean((clientId && clientSecret) || staticToken);

  console.log('\n─── Veza sa Shopify nalogom ──────────────────────────────────\n');

  if (!rawShop || !haveCreds) {
    console.log('  Shopify nije podesen.\n');
    console.log('  Shopify vise NE dozvoljava pravljenje aplikacija sa gotovim');
    console.log('  shpat_ tokenom. Za aplikaciju iz Dev Dashboard-a ide razmena');
    console.log('  Client ID + Secret za token (client_credentials).\n');
    console.log('  1. Dev Dashboard -> tvoja aplikacija -> Settings -> Credentials');
    console.log('     prepisi Client ID i Client secret');
    console.log('  2. APLIKACIJA i PRODAVNICA moraju biti u ISTOJ organizaciji -');
    console.log('     client_credentials radi samo tada');
    console.log('  3. Na verziji aplikacije ukljuci dozvole:');
    console.log('       read_products, write_orders, read_orders');
    console.log('     pa objavi novu verziju i odobri promenu na prodavnici');
    console.log('  4. Instaliraj aplikaciju na prodavnicu');
    console.log('  5. U .env.local:');
    console.log('       SHOPIFY_STORE_DOMAIN=tvoja-prodavnica.myshopify.com');
    console.log('       SHOPIFY_CLIENT_ID=...');
    console.log('       SHOPIFY_CLIENT_SECRET=...');
    console.log('  6. npm run shopify:check\n');
    process.exitCode = 1;
    return;
  }

  const shop = normalizeShopDomain(rawShop);
  row('Domen', shop);
  const mode = clientId && clientSecret ? 'client_credentials' : 'static_token';
  row('Nacin prijave', mode === 'client_credentials'
    ? 'Client ID + Secret (Dev Dashboard aplikacija)'
    : 'staticki shpat_ token (starije aplikacije)');
  if (mode === 'client_credentials') {
    row('Client ID', `${clientId!.slice(0, 8)}... (${clientId!.length} znakova)`);
    row('Client secret', `postavljen (${clientSecret!.length} znakova)`);
  } else {
    row('Token', `postavljen (${staticToken!.length} znakova, pocinje "${staticToken!.slice(0, 6)}")`);
  }

  if (!shop.endsWith('.myshopify.com')) {
    console.log('\n  UPOZORENJE: ocekuje se *.myshopify.com, a ne tvoj javni domen.');
    console.log('  Pravi domen je u Shopify admin -> Settings -> Domains.');
  }
  if (mode === 'static_token' && !staticToken!.startsWith('shpat_')) {
    console.log('\n  UPOZORENJE: Admin API token obicno pocinje sa "shpat_".');
    console.log('  Ako si kopirao "API key" ili "API secret key", to nije to -');
    console.log('  treba "Admin API access token" sa Install app ekrana.');
  }

  // ── Koja verzija API-ja radi ──────────────────────────────────────────────
  console.log('\n─── Verzija Admin API-ja ─────────────────────────────────────\n');

  const forced = process.env.SHOPIFY_API_VERSION?.trim();
  const toTry = forced ? [forced] : CANDIDATE_API_VERSIONS;
  let working: string | null = null;

  for (const version of toTry) {
    const base = getShopifyConfig()!;
    const candidate: ShopifyConfig = { ...base, shop, version };
    try {
      await getShopInfo(candidate);
      working = version;
      console.log(`  ${version}  radi`);
      break;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/odbio token|odbio Client|401|403/.test(msg)) {
        console.log('\n  Prijava je odbijena. Najcesci uzroci:');
        console.log('   - aplikacija nije instalirana na TOJ prodavnici');
        console.log('   - aplikacija i prodavnica nisu u istoj Shopify organizaciji');
        console.log('     (client_credentials radi samo tada)');
        console.log('   - Client ID ili Secret su pogresno prepisani');
        console.log(`\n  Detalj: ${msg}\n`);
        process.exitCode = 1;
        return;
      }
      console.log(`  ${version}  nije dostupna`);
    }
  }

  if (!working) {
    console.log('\n  Nijedna verzija nije prosla. Proveri domen prodavnice.\n');
    process.exitCode = 1;
    return;
  }

  if (!forced) {
    console.log('\n  Upisi u .env.local da se ne pogadja pri svakom pozivu:');
    console.log(`     SHOPIFY_API_VERSION=${working}`);
  }

  const config: ShopifyConfig = { ...getShopifyConfig()!, shop, version: working };

  // ── Podaci o prodavnici ───────────────────────────────────────────────────
  console.log('\n─── Prodavnica ───────────────────────────────────────────────\n');
  const info = await getShopInfo(config);
  row('Naziv', info.name);
  row('Javni domen', info.domain);
  row('Valuta', info.currency);
  row('Zemlja', info.country);
  row('Plan', info.plan);

  let problems = 0;

  if (info.currency !== 'RSD') {
    problems++;
    console.log(`\n  PAZNJA: Shopify prodavnica radi u ${info.currency}, a VibeMarket racuna`);
    console.log('  iskljucivo u RSD. Cene se NE konvertuju automatski - uvezeni proizvod bi');
    console.log(`  imao broj iz ${info.currency} prikazan kao da su dinari.`);
  }

  // ── Dozvole ───────────────────────────────────────────────────────────────
  console.log('\n─── Dozvole aplikacije ───────────────────────────────────────\n');
  let scopes: string[] = [];
  try {
    scopes = await getGrantedScopes(config);
    console.log(`  Odobreno: ${scopes.join(', ') || '(nijedna)'}\n`);
  } catch (err) {
    console.log(`  Ne mogu da procitam dozvole: ${err instanceof Error ? err.message : err}\n`);
  }

  const check = (label: string, needed: readonly string[]) => {
    const missing = needed.filter((s) => !scopes.includes(s));
    if (missing.length === 0) {
      console.log(`  ${label.padEnd(22)} moze`);
    } else {
      problems++;
      console.log(`  ${label.padEnd(22)} NE MOZE - nedostaje: ${missing.join(', ')}`);
    }
  };
  check('Uvoz proizvoda', REQUIRED_SCOPES.import);
  check('Slanje porudzbina', REQUIRED_SCOPES.orders);

  // ── Koliko ima da se uveze ────────────────────────────────────────────────
  if (scopes.includes('read_products')) {
    console.log('\n─── Katalog ──────────────────────────────────────────────────\n');
    try {
      const { data } = await shopifyFetch<{ count: number }>('/products/count.json', { config });
      row('Proizvoda na Shopify-ju', String(data.count));
      if (data.count === 0) console.log('\n  Katalog je prazan - nema sta da se uveze.');
    } catch (err) {
      console.log(`  Ne mogu da prebrojim proizvode: ${err instanceof Error ? err.message : err}`);
    }
  }

  // ── Slanje porudzbina ─────────────────────────────────────────────────────
  console.log('\n─── Slanje porudzbina ────────────────────────────────────────\n');
  const pushOn = process.env.SHOPIFY_PUSH_ORDERS === 'true';
  row('SHOPIFY_PUSH_ORDERS', pushOn ? 'true - porudzbine SE salju' : 'iskljuceno');
  if (!pushOn) {
    console.log('\n  Namerno odvojeno: kada se upali, svaka kupovina ovde kreira PRAVU');
    console.log('  porudzbinu u tvom zivom Shopify nalogu. Upali tek kad uvoz proradi');
    console.log('  i kad proveris jednu probnu kupovinu.');
  }

  console.log(problems === 0 ? '\n  Sve je spremno.\n' : `\n  ${problems} stvar(i) treba resiti.\n`);
  process.exitCode = problems > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error('\nProvera nije uspela:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
