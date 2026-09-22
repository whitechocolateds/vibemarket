import type { CartItem, OrderForm } from './types';
import { GIFT_TITLE } from './gift';
import { formatPrice } from './format';

/**
 * Obavestenje o novoj porudzbini na Telegram.
 *
 * Ukljucuje se ISKLJUCIVO preko env promenljivih; dok njih nema, funkcija tiho
 * ne radi nista. Tako prodavnica radi isto i sa podesenim botom i bez njega.
 *
 *   TELEGRAM_BOT_TOKEN - token od @BotFather
 *   TELEGRAM_CHAT_ID   - id caskanja u koje bot salje (vas licni id ili grupa)
 *
 * Token je tajna: stoji samo u .env.local (gitignore) i u Vercel podesavanjima,
 * nikada sa NEXT_PUBLIC_ prefiksom - to bi ga poslalo u pregledac kupca.
 */

const API = 'https://api.telegram.org';

export function isTelegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
}

/** Telegram u HTML rezimu prima samo par tagova; ostalo mora biti eskejpovano. */
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface OrderNotice {
  orderNumber: string;
  items: CartItem[];
  customerInfo: OrderForm;
  totalPrice: number;
  gift?: boolean;
}

export function formatOrderMessage(o: OrderNotice): string {
  const kupac = `${o.customerInfo.firstName} ${o.customerInfo.lastName}`.trim();
  const stavke = o.items
    .map((i) => {
      const sku = i.sku ? ` <code>${esc(i.sku)}</code>` : '';
      return `• ${esc(i.title)}${sku} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`;
    })
    .join('\n');

  /*
   * `null` je red koji otpada, '' je namerno prazan red.
   * Ranije su oba bila '', pa je filter brisao i razmake i poruka se slepila.
   */
  return [
    `🛒 <b>Nova porudžbina ${esc(o.orderNumber)}</b>`,
    '',
    stavke,
    o.gift ? `🎁 ${esc(GIFT_TITLE)}` : null,
    '',
    `💰 <b>Ukupno: ${formatPrice(o.totalPrice)}</b>`,
    '',
    `👤 ${esc(kupac)}`,
    `📞 ${esc(o.customerInfo.phone)}`,
    `📍 ${esc(o.customerInfo.address)}, ${esc(o.customerInfo.city)}`,
  ]
    .filter((red): red is string => red !== null)
    .join('\n');
}

/**
 * Salje poruku. NIKAD ne baca - obavestenje ne sme da obori porudzbinu koja je
 * vec sacuvana. Pozivalac dobija true/false samo radi upisa u log.
 */
export async function sendOrderToTelegram(o: OrderNotice): Promise<boolean> {
  if (!isTelegramEnabled()) return false;

  const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID!.trim();

  try {
    // Telegram ume da visi; bez prekida bi drzao `after` do isteka maxDuration.
    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatOrderMessage(o),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // Telegramov opis greske je jedino sto kaze STA ne valja (pogresan chat
      // id, bot nije startovan, token opozvan) - zato ide u log ceo.
      const telo = await res.text().catch(() => '');
      console.error(`[telegram] ${res.status}: ${telo.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[telegram] slanje nije uspelo:', error instanceof Error ? error.message : error);
    return false;
  }
}
