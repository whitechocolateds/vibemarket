import { htmlToPlainText } from './sanitizeHtml';

/**
 * Dohvatanje podataka o proizvodu sa konkurentske stranice.
 *
 * Redosled pokušaja:
 *  1. Shopify: <putanja>.json vraća čist strukturiran objekat - bez parsiranja HTML-a
 *  2. JSON-LD @type: Product (pokriva WooCommerce, Magento, PrestaShop)
 *  3. OpenGraph meta tagovi
 *  4. Goli tekst stranice
 *
 * Tekst odavde ide ISKLJUČIVO u LLM kao ulaz, nikad direktno u DOM - zato je
 * regex strip ovde dovoljan (za razliku od sanitizeHtml.ts, gde nije).
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 12_000;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_TEXT_CHARS = 12_000;

export type SourcePlatform = 'shopify' | 'jsonld' | 'opengraph' | 'generic';

export interface ImportedSource {
  sourceUrl: string;
  platform: SourcePlatform;
  title: string;
  /** Čist tekst sa stranice - činjenice iz kojih model piše originalan opis. */
  bodyText: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  price?: number;
  compareAtPrice?: number;
  /** Valuta IZVORNE prodavnice. Nikad se ne konvertuje automatski. */
  currency?: string;
  images: string[];
}

export class ImportError extends Error {}

// ─── SSRF zaštita ────────────────────────────────────────────────────────────

const BLOCKED_HOSTNAME = [
  /^localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /^\[?::1\]?$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
];

/**
 * Ruta jeste iza requireAdmin, ali ovo je server-side primitiv za proizvoljan fetch -
 * zatvaranje je jeftino.
 */
export function assertSafeSourceUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ImportError('Neispravan link. Nalepi pun URL, uključujući https://');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ImportError('Link mora počinjati sa http:// ili https://');
  }
  if (url.username || url.password) {
    throw new ImportError('Link ne sme sadržati korisničko ime i lozinku.');
  }
  if (BLOCKED_HOSTNAME.some((re) => re.test(url.hostname))) {
    throw new ImportError('Taj host nije dozvoljen.');
  }
  return url;
}

// ─── Preuzimanje ─────────────────────────────────────────────────────────────

async function fetchText(url: URL | string, accept: string): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': USER_AGENT,
      Accept: accept,
      'Accept-Language': 'sr,en;q=0.8',
    },
  });

  if (!res.ok) return { ok: false, status: res.status, text: '' };

  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new ImportError('Stranica je prevelika za obradu.');
  }

  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BODY_BYTES) {
    throw new ImportError('Stranica je prevelika za obradu.');
  }
  return { ok: true, status: res.status, text: new TextDecoder('utf-8').decode(buf) };
}

// ─── Pomoćne ─────────────────────────────────────────────────────────────────

export function stripHtmlToText(html: string): string {
  return htmlToPlainText(html).slice(0, MAX_TEXT_CHARS);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  // "1.299,00" (sr) i "1,299.00" (en) -> broj
  const cleaned = value.replace(/[^\d.,-]/g, '');
  if (!cleaned) return undefined;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma > lastDot) normalized = cleaned.replace(/\./g, '').replace(',', '.');
  else normalized = cleaned.replace(/,/g, '');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function absolutize(src: string, base: URL): string | null {
  try {
    return new URL(src, base).toString();
  } catch {
    return null;
  }
}

function uniqueImages(urls: (string | null | undefined)[], base: URL, limit = 8): string[] {
  const out: string[] = [];
  for (const raw of urls) {
    if (!raw || typeof raw !== 'string') continue;
    const abs = absolutize(raw.trim(), base);
    if (!abs || !/^https?:/.test(abs)) continue;
    if (!out.includes(abs)) out.push(abs);
    if (out.length >= limit) break;
  }
  return out;
}

// ─── 1. Shopify ──────────────────────────────────────────────────────────────

const SHOPIFY_PATH = /^(?:\/collections\/[^/]+)?\/products\/[^/]+$/;

interface ShopifyVariant {
  id?: number;
  price?: string;
  compare_at_price?: string | null;
}

function parseShopify(json: unknown, url: URL): ImportedSource | null {
  const product = (json as { product?: Record<string, unknown> })?.product;
  if (!product || typeof product.title !== 'string') return null;

  const variants = (product.variants as ShopifyVariant[] | undefined) ?? [];
  const wanted = url.searchParams.get('variant');
  const variant = (wanted && variants.find((v) => String(v.id) === wanted)) || variants[0];

  const rawTags = product.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((t): t is string => typeof t === 'string')
    : typeof rawTags === 'string'
      ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

  const images = (product.images as { src?: string }[] | undefined)?.map((i) => i.src) ?? [];

  return {
    sourceUrl: url.toString(),
    platform: 'shopify',
    title: product.title,
    bodyText: stripHtmlToText(String(product.body_html ?? '')),
    vendor: typeof product.vendor === 'string' ? product.vendor : undefined,
    productType: typeof product.product_type === 'string' ? product.product_type : undefined,
    tags: tags.slice(0, 10),
    price: toNumber(variant?.price),
    compareAtPrice: toNumber(variant?.compare_at_price ?? undefined),
    images: uniqueImages(images, url),
  };
}

/**
 * Product JSON ne sadrži valutu, a cena je samo broj. Bez ovoga bi "49.99" iz USD
 * prodavnice tiho ušlo kao 50 RSD. /meta.json je javan i vraća currency.
 */
async function fetchShopifyCurrency(origin: string): Promise<string | undefined> {
  try {
    const { ok, text } = await fetchText(`${origin}/meta.json`, 'application/json');
    if (!ok) return undefined;
    const meta = JSON.parse(text) as { currency?: unknown };
    return typeof meta.currency === 'string' ? meta.currency : undefined;
  } catch {
    return undefined;
  }
}

async function tryShopify(url: URL): Promise<ImportedSource | null> {
  if (!SHOPIFY_PATH.test(url.pathname)) return null;

  // ?variant= se odbacuje iz putanje, ali se čuva na `url` za izbor varijante
  const jsonUrl = `${url.origin}${url.pathname}.json`;
  try {
    const { ok, text } = await fetchText(jsonUrl, 'application/json');
    if (!ok || !text.trim().startsWith('{')) return null;

    const source = parseShopify(JSON.parse(text), url);
    if (!source) return null;

    source.currency = await fetchShopifyCurrency(url.origin);
    return source;
  } catch (error) {
    if (error instanceof ImportError) throw error;
    return null;
  }
}

// ─── 2. JSON-LD ──────────────────────────────────────────────────────────────

function collectJsonLdNodes(html: string): unknown[] {
  const nodes: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (Array.isArray(parsed)) nodes.push(...parsed);
      else nodes.push(parsed);
    } catch {
      /* nevalidan JSON-LD blok - preskoči */
    }
  }
  // @graph kontejneri
  const expanded: unknown[] = [];
  for (const node of nodes) {
    const graph = (node as { '@graph'?: unknown[] })?.['@graph'];
    if (Array.isArray(graph)) expanded.push(...graph);
    else expanded.push(node);
  }
  return expanded;
}

function isProductNode(node: unknown): node is Record<string, unknown> {
  const type = (node as { '@type'?: unknown })?.['@type'];
  if (typeof type === 'string') return type.toLowerCase() === 'product';
  if (Array.isArray(type)) return type.some((t) => String(t).toLowerCase() === 'product');
  return false;
}

function parseJsonLd(html: string, url: URL): ImportedSource | null {
  const product = collectJsonLdNodes(html).find(isProductNode);
  if (!product || typeof product.name !== 'string') return null;

  const offersRaw = product.offers;
  const offer = (Array.isArray(offersRaw) ? offersRaw[0] : offersRaw) as Record<string, unknown> | undefined;

  const brand = product.brand;
  const vendor =
    typeof brand === 'string'
      ? brand
      : typeof (brand as { name?: unknown })?.name === 'string'
        ? ((brand as { name: string }).name)
        : undefined;

  const imageRaw = product.image;
  const images = Array.isArray(imageRaw)
    ? imageRaw.map((i) => (typeof i === 'string' ? i : (i as { url?: string })?.url))
    : [typeof imageRaw === 'string' ? imageRaw : (imageRaw as { url?: string })?.url];

  return {
    sourceUrl: url.toString(),
    platform: 'jsonld',
    title: product.name,
    bodyText: stripHtmlToText(String(product.description ?? '')) || stripHtmlToText(html),
    vendor,
    productType: typeof product.category === 'string' ? product.category : undefined,
    tags: [],
    price: toNumber(offer?.price),
    compareAtPrice: undefined,
    currency: typeof offer?.priceCurrency === 'string' ? offer.priceCurrency : undefined,
    images: uniqueImages(images, url),
  };
}

// ─── 3. OpenGraph ────────────────────────────────────────────────────────────

function metaContent(html: string, property: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'i'
  );
  const tag = html.match(re)?.[0];
  if (!tag) return undefined;
  const content = tag.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? content.trim() : undefined;
}

function parseOpenGraph(html: string, url: URL): ImportedSource | null {
  const title = metaContent(html, 'og:title') ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (!title) return null;

  return {
    sourceUrl: url.toString(),
    platform: 'opengraph',
    title: htmlToPlainText(title),
    bodyText: stripHtmlToText(html),
    vendor: metaContent(html, 'og:site_name'),
    tags: [],
    price: toNumber(metaContent(html, 'product:price:amount')),
    currency: metaContent(html, 'product:price:currency'),
    images: uniqueImages([metaContent(html, 'og:image')], url),
  };
}

// ─── Ulazna tačka ────────────────────────────────────────────────────────────

export async function fetchCompetitorSource(raw: string): Promise<ImportedSource> {
  const url = assertSafeSourceUrl(raw);

  const shopify = await tryShopify(url);
  if (shopify) return shopify;

  let page: { ok: boolean; status: number; text: string };
  try {
    page = await fetchText(url, 'text/html,application/xhtml+xml');
  } catch (error) {
    if (error instanceof ImportError) throw error;
    throw new ImportError(
      'Stranica se ne može preuzeti. Moguće je da sajt blokira automatski pristup ili je link neispravan.'
    );
  }

  if (!page.ok) {
    throw new ImportError(`Stranica je vratila HTTP ${page.status}. Proveri link.`);
  }

  const fromJsonLd = parseJsonLd(page.text, url);
  if (fromJsonLd) return fromJsonLd;

  const fromOg = parseOpenGraph(page.text, url);
  if (fromOg) return fromOg;

  const text = stripHtmlToText(page.text);
  if (!text) throw new ImportError('Sa te stranice nije izvučen nikakav tekst.');

  return {
    sourceUrl: url.toString(),
    platform: 'generic',
    title: '',
    bodyText: text,
    tags: [],
    images: [],
  };
}
