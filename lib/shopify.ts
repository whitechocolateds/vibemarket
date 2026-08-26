/**
 * Shopify Admin API klijent.
 *
 * Veza je DVOSMERNA:
 *   - proizvodi ULAZE  (citanje kataloga sa Shopify-ja u ovu prodavnicu)
 *   - porudzbine IZLAZE (kupovina ovde kreira porudzbinu u Shopify-ju)
 *
 * DVA NACINA PRIJAVE, jer je Shopify promenio pravila:
 *
 *   1. client_credentials  - aplikacija napravljena u Dev Dashboard-u.
 *      Razmenjuje Client ID + Client Secret za token koji vazi 24 SATA.
 *      Token se kesira i sam obnavlja. Radi samo ako su aplikacija i
 *      prodavnica u ISTOJ Shopify organizaciji.
 *
 *   2. staticki shpat_ token - aplikacije napravljene u admin panelu
 *      prodavnice. Shopify vise NE DOZVOLJAVA pravljenje takvih, ali
 *      postojeci tokeni i dalje rade, pa se nacin zadrzava.
 *
 * Tajne se koriste ISKLJUCIVO na serveru - nikada NEXT_PUBLIC_ prefiks.
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

export type AuthMode = 'client_credentials' | 'static_token';

export interface ShopifyConfig {
  shop: string;   // xxxx.myshopify.com
  version: string;
  mode: AuthMode;
  /** mode === 'static_token' */
  token?: string;
  /** mode === 'client_credentials' */
  clientId?: string;
  clientSecret?: string;
}

/** Prihvata i pun URL i goli domen; uvek vraca `xxx.myshopify.com`. */
export function normalizeShopDomain(raw: string): string {
  return raw.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
}

export function getShopifyConfig(): ShopifyConfig | null {
  const shopRaw = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  if (!shopRaw) return null;

  const shop = normalizeShopDomain(shopRaw);
  const version = process.env.SHOPIFY_API_VERSION?.trim() || CANDIDATE_API_VERSIONS[0];

  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (clientId && clientSecret) {
    return { shop, version, mode: 'client_credentials', clientId, clientSecret };
  }

  const token = process.env.SHOPIFY_ADMIN_TOKEN?.trim();
  if (token) return { shop, version, mode: 'static_token', token };

  return null;
}

export function isShopifyConfigured(): boolean {
  return getShopifyConfig() !== null;
}

/** Slanje porudzbina se pali zasebno - pise u ZIVI Shopify nalog. */
export function isOrderPushEnabled(): boolean {
  return isShopifyConfigured() && process.env.SHOPIFY_PUSH_ORDERS === 'true';
}

// ─── Token: pribavljanje, kesiranje, obnavljanje ─────────────────────────────

interface CachedToken {
  token: string;
  /** Unix ms kada istice. */
  expiresAt: number;
  scope: string;
}

/** Kes po prodavnici. Zivi koliko i proces - na serverless-u to je jedna topla instanca. */
const tokenCache = new Map<string, CachedToken>();
/** Sprecava da paralelni pozivi svaki za sebe traze token. */
const inFlight = new Map<string, Promise<CachedToken>>();

/** Obnavljamo malo pre isteka da zahtev u letu ne zatekne mrtav token. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function requestClientCredentialsToken(config: ShopifyConfig): Promise<CachedToken> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId!,
    client_secret: config.clientSecret!,
  });

  const res = await fetch(`https://${config.shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(20_000),
  });

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      throw new ShopifyError(
        'Shopify je odbio Client ID/Secret. Proveri da su prepisani tacno i da su ' +
          'aplikacija i prodavnica u ISTOJ Shopify organizaciji - client_credentials ' +
          `radi samo tada. Odgovor: ${text.slice(0, 200)}`,
        res.status
      );
    }
    throw new ShopifyError(`Pribavljanje tokena nije uspelo (HTTP ${res.status}): ${text.slice(0, 200)}`, res.status);
  }

  let json: { access_token?: string; expires_in?: number; scope?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new ShopifyError(`Neocekivan odgovor pri pribavljanju tokena: ${text.slice(0, 200)}`);
  }

  if (!json.access_token) {
    throw new ShopifyError('Shopify nije vratio access_token.');
  }

  // expires_in je 86399 (24h); oduzimamo marginu
  const ttl = (json.expires_in ?? 86_399) * 1000;
  return {
    token: json.access_token,
    expiresAt: Date.now() + ttl,
    scope: json.scope ?? '',
  };
}

/** Vraca vazeci token; kod client_credentials sam ga obnavlja. */
export async function getAccessToken(config?: ShopifyConfig): Promise<string> {
  const cfg = config ?? getShopifyConfig();
  if (!cfg) throw new ShopifyError('Shopify nije podesen.');

  if (cfg.mode === 'static_token') return cfg.token!;

  const key = `${cfg.shop}|${cfg.clientId}`;
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt - REFRESH_MARGIN_MS > Date.now()) return cached.token;

  const pending = inFlight.get(key);
  if (pending) return (await pending).token;

  const promise = requestClientCredentialsToken(cfg)
    .then((fresh) => {
      tokenCache.set(key, fresh);
      return fresh;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return (await promise).token;
}

/** Dozvole koje token stvarno nosi; kod client_credentials stizu uz sam token. */
export function getCachedScope(config?: ShopifyConfig): string | null {
  const cfg = config ?? getShopifyConfig();
  if (!cfg || cfg.mode !== 'client_credentials') return null;
  return tokenCache.get(`${cfg.shop}|${cfg.clientId}`)?.scope ?? null;
}

// ─── Pozivi ka Admin API-ju ─────────────────────────────────────────────────

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  config?: ShopifyConfig;
  /** Za paginaciju - pun URL iz Link zaglavlja. */
  absoluteUrl?: string;
}

export interface ShopifyResponse<T> {
  data: T;
  nextPageUrl: string | null;
}

export async function shopifyFetch<T>(path: string, opts: FetchOptions = {}): Promise<ShopifyResponse<T>> {
  const config = opts.config ?? getShopifyConfig();
  if (!config) {
    throw new ShopifyError(
      'Shopify nije podesen. Postavi SHOPIFY_STORE_DOMAIN i (SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET) u .env.local.'
    );
  }

  const token = await getAccessToken(config);
  const url = opts.absoluteUrl ?? `https://${config.shop}/admin/api/${config.version}${path}`;

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });

  if (res.status === 401 || res.status === 403) {
    // Token je mozda istekao ranije nego sto smo racunali - baci ga iz kesa
    if (config.mode === 'client_credentials') {
      tokenCache.delete(`${config.shop}|${config.clientId}`);
    }
    throw new ShopifyError(
      'Shopify je odbio token. Proveri da je aplikacija instalirana na prodavnici i da ima potrebne dozvole.',
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

/** Dozvole koje je token stvarno dobio. */
export async function getGrantedScopes(config?: ShopifyConfig): Promise<string[]> {
  const cfg = config ?? getShopifyConfig();
  if (!cfg) throw new ShopifyError('Shopify nije podesen.');

  // Kod client_credentials scope stize uz sam token, pa nema potrebe za dodatnim pozivom
  const fromToken = getCachedScope(cfg);
  if (fromToken) return fromToken.split(',').map((s) => s.trim()).filter(Boolean);

  const token = await getAccessToken(cfg);
  const res = await fetch(`https://${cfg.shop}/admin/oauth/access_scopes.json`, {
    headers: { 'X-Shopify-Access-Token': token },
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
 * slobodne stavke - vidljive u porudzbini, ali bez veze sa katalogom.
 *
 * financial_status: 'pending' jer je placanje pouzecem - novac jos nije naplacen.
 */
export async function createShopifyOrder(input: PushOrderInput): Promise<PushOrderResult> {
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
