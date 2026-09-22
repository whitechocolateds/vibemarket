/**
 * Provera Telegram lanca BEZ prave porudzbine.
 *
 *   npm run telegram:test
 *
 * Ne dira katalog, ne upisuje porudzbinu, ne skida zalihu - samo sastavi istu
 * poruku koju bi poslala prava porudzbina i posalje je, jasno oznacenu kao probu.
 *
 * Korisno i kasnije: kad se token zameni ili se bot premesti u grupu, ovo kaze
 * da li lanac jos radi, bez cekanja da neko stvarno naruci.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { formatOrderMessage, isTelegramEnabled } from '../lib/telegram';
import type { CartItem, OrderForm } from '../lib/types';

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

const KUPAC: OrderForm = {
  firstName: 'PROBA', lastName: '(nije prava porudžbina)',
  phone: '000000000', address: 'Probna adresa 1', city: 'Beograd', postalCode: '11000',
  paymentMethod: 'pouzeće',
};

const STAVKE: CartItem[] = [
  {
    id: 'proba-v1', productId: 'proba-p1', handle: 'proba',
    title: 'Traka za vežbanje sa šipkom', variantTitle: '',
    price: 1799, quantity: 2, image: null, sku: 'VM-TRA-001',
  },
];

async function main() {
  await loadEnvLocal();

  if (!isTelegramEnabled()) {
    console.error('TELEGRAM_BOT_TOKEN ili TELEGRAM_CHAT_ID nedostaje u .env.local.');
    process.exit(1);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID!.trim();

  // 1. Ko je bot? Provera tokena bez slanja ijedne poruke.
  const me = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const meJson = (await me.json()) as { ok: boolean; result?: { username?: string; first_name?: string }; description?: string };
  if (!meJson.ok) {
    console.error(`Token nije prihvacen: ${meJson.description ?? me.status}`);
    process.exit(1);
  }
  console.log(`bot: ${meJson.result?.first_name} (@${meJson.result?.username})`);
  console.log(`chat id: ${chatId.startsWith('-') ? 'grupa' : 'licno caskanje'}`);

  // 2. Prava poruka, istim sastavljacem koji koristi i porudzbina.
  const telo = [
    '🧪 <b>PROBNA PORUKA — ovo NIJE prava porudžbina</b>',
    '',
    formatOrderMessage({
      orderNumber: 'VM-PROBA',
      items: STAVKE,
      customerInfo: KUPAC,
      totalPrice: 1799 * 2 + 490,
      gift: true,
    }),
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: telo, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(10_000),
  });

  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) {
    console.error(`\nSlanje NIJE uspelo (${res.status}): ${json.description}`);
    if (/chat not found/i.test(json.description ?? '')) {
      console.error('Najcesci uzrok: niste pritisnuli START u caskanju sa botom, ili chat id nije vas.');
    }
    if (/bot was blocked/i.test(json.description ?? '')) {
      console.error('Bot je blokiran u tom caskanju - odblokirajte ga pa probajte ponovo.');
    }
    process.exit(1);
  }

  console.log('\nOK: poruka poslata. Proverite Telegram.');
}

main().catch((e) => {
  console.error('PALO:', e instanceof Error ? e.message : e);
  process.exit(1);
});
