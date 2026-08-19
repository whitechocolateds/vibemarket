/**
 * Shopify Admin API klijent.
 *
 * Veza je DVOSMERNA:
 *   - proizvodi ULAZE  (citanje kataloga sa Shopify-ja u ovu prodavnicu)
 *   - porudzbine IZLAZE (kupovina ovde kreira porudzbinu u Shopify-ju)
 *
 * Token je Admin API access token custom aplikacije (pocinje sa `shpat_`).
 * Koristi se ISKLJUCIVO na serveru - nikada ne sme dobiti NEXT_PUBLIC_ prefiks,
 * jer daje pun pristup katalogu, porudzbinama i kupcima.
 */

/** Verzije koje probamo ako SHOPIFY_API_VERSION nije postavljen, od novije ka starijoj. */
export const CANDIDATE_API_VERSIONS = [
  '2026-07', '2026-04', '2026-01', '2025-10', '2025-07', '2025-04', '2025-01',
];

export class ShopifyError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export interface ShopifyConfig {
  shop: string;   // xxxx.myshopify.com
  token: string;
  version: string;
}

/** Prihvata i pun URL i goli domen; uvek vraca `xxx.myshopify.com`. */
export function normalizeShopDomain(raw: string): string {
  const trimmed = raw.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return trimmed.toLowerCase();
}

export function getShopifyConfig(): ShopifyConfig | null {
  const shop = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_ADMIN_TOKEN?.trim();
  if (!shop || !token) return null;
  return {
    shop: normalizeShopDomain(shop),
    token,
    version: process.env.SHOPIFY_API_VERSION?.trim() || CANDIDATE_API_VERSIONS[0],
  };
}

export function isShopifyConfigured(): boolean {
  return getShopifyConfig() !== null;
}

/** Slanje porudzbina se pali zasebno - pise u ZIVI Shopify nalog. */
export function isOrderPushEnabled(): boolean {
  return isShopifyConfigured() && process.env.SHOPIFY_PUSH_ORDERS === 'true';
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  config?: ShopifyConfig;
  /** Za paginaciju - pun URL iz Link zaglavlja. */
  absoluteUrl?: string;
}

export interface ShopifyResponse<T> {
  data: T;
  /** `page_info` sledece strane, ako postoji. */
  nextPageUrl: string | null;
}

export async function shopifyFetch<T>(path: string, opts: FetchOptions = {}): Promise<ShopifyResponse<T>> {
  const config = opts.config ?? getShopifyConfig();
  if (!config) {
    throw new ShopifyError('Shopify nije podesen. Postavi SHOPIFY_STORE_DOMAIN i SHOPIFY_ADMIN_TOKEN u .env.local.');
  }

  const url = opts.absoluteUrl ?? `https://${config.shop}/admin/api/${config.version}${path}`;

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      'X-Shopify-Access-Token': config.token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });

  if (res.status === 401 || res.status === 403) {
    throw new ShopifyError(
      'Shopify je odbio token. Proveri da je aplikacija instalirana i da ima potrebne dozvole.',
      res.status
    );
  }
  if (res.status === 404) {
    throw new ShopifyError(
      `Shopify putanja ne postoji (${path}). Najcesce znaci pogresnu verziju API-ja (${config.version}).`,
      404
    );
  }
  if (res.status === 429) {
    throw new ShopifyError('Shopify ogranicava broj zahteva (429). Sacekaj pa pokusaj ponovo.', 429);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new ShopifyError(`Shopify greska ${res.status}: ${text.slice(0, 300)}`, res.status);
  }

  // Paginacija ide kroz Link zaglavlje, ne kroz telo odgovora
  const link = res.headers.get('link') ?? '';
  const next = link.split(',').find((p) => p.includes('rel="next"'));
  const nextPageUrl = next?.match(/<([^>]+)>/)?.[1] ?? null;

  return { data: (await res.json()) as T, nextPageUrl };
}

// ─── Osnovne provere ────────────────────────────────────────────────────────

export interface ShopInfo {
  name: string;
  domain: string;
  currency: string;
  country: string;
  plan: string;
}

export async function getShopInfo(config?: ShopifyConfig): Promise<ShopInfo> {
  const { data } = await shopifyFetch<{ shop: Record<string, unknown> }>('/shop.json', { config });
  const s = data.shop;
  return {
    name: String(s.name ?? ''),
    domain: String(s.domain ?? ''),
    currency: String(s.currency ?? ''),
    country: String(s.country_name ?? ''),
    plan: String(s.plan_display_name ?? ''),
  };
}

/** Dozvole koje je aplikacija stvarno dobila. Radi bez verzije API-ja. */
export async function getGrantedScopes(config?: ShopifyConfig): Promise<string[]> {
  const cfg = config ?? getShopifyConfig();
  if (!cfg) throw new ShopifyError('Shopify nije podesen.');

  const res = await fetch(`https://${cfg.shop}/admin/oauth/access_scopes.json`, {
    headers: { 'X-Shopify-Access-Token': cfg.token },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new ShopifyError(`Ne mogu da procitam dozvole (HTTP ${res.status}).`, res.status);

  const json = (await res.json()) as { access_scopes?: { handle: string }[] };
  return (json.access_scopes ?? []).map((s) => s.handle);
}

export const REQUIRED_SCOPES = {
  import: ['read_products'],
  orders: ['write_orders'],
} as const;

// ─── Slanje porudzbina u Shopify ────────────────────────────────────────────

export interface PushOrderInput {
  orderNumber: string;
  totalPrice: number;
  items: {
    title: string;
    variantTitle?: string;
    price: number;
    quantity: number;
    shopifyVariantId?: number;
  }[];
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    note?: string;
  };
}

export interface PushOrderResult {
  shopifyOrderId: number;
  shopifyOrderName: string;
}

/**
 * Kreira porudzbinu u Shopify-ju.
 *
 * PISE U ZIVI NALOG. Zato je iza zasebnog prekidaca SHOPIFY_PUSH_ORDERS.
 *
 * Stavke koje imaju shopifyVariantId se vezuju za pravi artikal, pa Shopify sam
 * skida zalihu. Stavke bez njega (proizvod nije uvezen sa Shopify-ja) idu kao
 * slobodne stavke - vidljive u porudzbini, ali bez veze sa katalogom i bez
 * skidanja zalihe.
 *
 * financial_status: 'pending' jer je placanje pouzecem - novac jos nije naplacen.
 * inventory_behaviour: 'decrement_obeying_policy' postuje podesavanje artikla.
 */
export async function createShopifyOrder(input: PushOrderInput): Promise<PushOrderResult> {
  const config = getShopifyConfig();
  if (!config) throw new ShopifyError('Shopify nije podesen.');

  const lineItems = input.items.map((item) =>
    item.shopifyVariantId
      ? { variant_id: item.shopifyVariantId, quantity: item.quantity, price: String(item.price) }
      : {
          title: item.variantTitle ? `${item.title} - ${item.variantTitle}` : item.title,
          price: String(item.price),
          quantity: item.quantity,
          requires_shipping: true,
        }
  );

  const address = {
    first_name: input.customer.firstName,
    last_name: input.customer.lastName,
    address1: input.customer.address,
    city: input.customer.city,
    zip: input.customer.postalCode,
    phone: input.customer.phone,
    country_code: 'RS',
  };

  const body = {
    order: {
      line_items: lineItems,
      currency: 'RSD',
      financial_status: 'pending',
      inventory_behaviour: 'decrement_obeying_policy',
      send_receipt: false,
      send_fulfillment_receipt: false,
      note: [`Poruceno preko VibeMarket (#${input.orderNumber})`, input.customer.note]
        .filter(Boolean)
        .join('\n'),
      tags: 'vibemarket,pouzece',
      customer: {
        first_name: input.customer.firstName,
        last_name: input.customer.lastName,
        ...(input.customer.email ? { email: input.customer.email } : {}),
        phone: input.customer.phone,
      },
      shipping_address: address,
      billing_address: address,
    },
  };

  const { data } = await shopifyFetch<{ order?: { id?: number; name?: string } }>('/orders.json', {
    method: 'POST',
    body,
  });

  if (!data.order?.id) throw new ShopifyError('Shopify nije vratio id porudzbine.');
  return { shopifyOrderId: data.order.id, shopifyOrderName: data.order.name ?? '' };
}
