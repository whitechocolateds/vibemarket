/**
 * Provera ponasanja Conversions API sloja, bez mreze i bez prave kupovine.
 *
 *   npm run check:capi
 *
 * Pokriva tri stanja koja su do sada prolazila neprimeceno:
 *  1. token postavljen, META_PIXEL_ID nije  -> nista se ne salje, javi se upozorenje
 *  2. oba postavljena                       -> poziv ka Graph API-ju stvarno krene
 *  3. nista postavljeno                     -> tisina, bez upozorenja
 *
 * `fetch` se zamenjuje lazniakom, pa nijedan zahtev ne izlazi iz procesa.
 */

import { sendCapiEvent } from '../lib/metaConversionsApi';

const pravi = globalThis.fetch;
let pozvanoURL: string | null = null;
let poslatoTelo: unknown = null;

globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  pozvanoURL = String(url);
  poslatoTelo = JSON.parse(String(init?.body ?? 'null'));
  return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

const upozorenja: string[] = [];
const praviWarn = console.warn;
console.warn = (...args: unknown[]) => { upozorenja.push(args.join(' ')); };

let pao = false;
function tvrdi(uslov: boolean, opis: string) {
  console.log(`  ${uslov ? 'OK  ' : 'PALO'}  ${opis}`);
  if (!uslov) pao = true;
}

function ocisti() {
  pozvanoURL = null;
  poslatoTelo = null;
  upozorenja.length = 0;
}

async function main() {
  // Skripta se pokrece i kad .env.local postoji - zato se stanje postavlja rucno.
  delete process.env.META_PIXEL_ID;
  delete process.env.META_CONVERSIONS_API_TOKEN;

  console.log('\n1) token bez META_PIXEL_ID');
  ocisti();
  process.env.META_CONVERSIONS_API_TOKEN = 'lazni-token';
  await sendCapiEvent({ eventName: 'Purchase', value: 1799, currency: 'RSD' });
  tvrdi(pozvanoURL === null, 'nijedan zahtev nije poslat');
  tvrdi(upozorenja.some((u) => u.includes('META_PIXEL_ID')), 'upozorenje imenuje META_PIXEL_ID');

  ocisti();
  await sendCapiEvent({ eventName: 'Purchase', value: 1799, currency: 'RSD' });
  tvrdi(upozorenja.length === 0, 'upozorenje se ne ponavlja pri svakoj kupovini');

  console.log('\n2) oba postavljena');
  ocisti();
  process.env.META_PIXEL_ID = '123456789012345';
  await sendCapiEvent({
    eventName: 'Purchase',
    eventId: 'test-1',
    value: 1799,
    currency: 'RSD',
    contentIds: ['proizvod-1'],
  });
  tvrdi(pozvanoURL?.includes('/123456789012345/events') === true, 'zahtev ide na pravi pixel');
  const telo = poslatoTelo as { data: Array<Record<string, unknown>> } | null;
  const ev = telo?.data?.[0] as
    | { event_name?: string; event_id?: string; custom_data?: { value?: number; currency?: string } }
    | undefined;
  tvrdi(ev?.event_name === 'Purchase', 'event_name je Purchase');
  tvrdi(ev?.event_id === 'test-1', 'event_id se prenosi (dedup sa Pixel-om)');
  tvrdi(ev?.custom_data?.value === 1799, 'value se prenosi');
  tvrdi(ev?.custom_data?.currency === 'RSD', 'currency je RSD');

  console.log('\n3) nista postavljeno');
  ocisti();
  delete process.env.META_PIXEL_ID;
  delete process.env.META_CONVERSIONS_API_TOKEN;
  await sendCapiEvent({ eventName: 'Purchase', value: 1799, currency: 'RSD' });
  tvrdi(pozvanoURL === null, 'nijedan zahtev nije poslat');

  globalThis.fetch = pravi;
  console.warn = praviWarn;
  console.log(pao ? '\nIMA PADOVA\n' : '\nSve provere prolaze.\n');
  process.exitCode = pao ? 1 : 0;
}

main();
