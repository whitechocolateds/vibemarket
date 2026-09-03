import { shopifyFetch, ShopifyError, getShopInfo, type ShopifyConfig } from './shopify';
import { sanitizeProductHtml, htmlToPlainText, escapeHtml } from './sanitizeHtml';
import { importImageFromUrl } from './mediaStore';
import { slugify } from './slugify';
import type { ProductInput } from './types';

/**
 * Uvoz kataloga sa Shopify-ja u ovu prodavnicu.
 *
 * Jednosmerno: cita sa Shopify-ja, pise ovde. Shopify se NE menja.
 *
 * Slike se preuzimaju u nasu memoriju umesto da se hotlinkuju sa Shopify CDN-a -
 * tudji URL pukne cim ga rotiraju, a nije ni u remotePatterns.
 */

const PAGE_SIZE = 50;
const MAX_IMAGES_PER_PRODUCT = 6;

interface ShopifyImage {
  src?: string;
  position?: number;
}

export interface ShopifyVariant {
  id?: number;
  title?: string;
  price?: string;
  compare_at_price?: string | null;
  inventory_quantity?: number;
  inventory_policy?: string;
  /** null kad Shopify NE prati zalihu za taj proizvod - tada se prodaje uvek. */
  inventory_management?: string | null;
}

export interface ShopifyProduct {
  id?: number;
  title?: string;
  handle?: string;
  body_html?: string | null;
  vendor?: string;
  product_type?: string;
  tags?: string;
  status?: string;
  images?: ShopifyImage[];
  variants?: ShopifyVariant[];
}

export interface ImportedProductPreview {
  shopifyProductId: number;
  title: string;
  handle: string;
  price: number;
  quantity: number;
  images: number;
  status: string;
}

/** Vraca SVE proizvode, prolazeci kroz stranice preko Link zaglavlja. */
export async function fetchAllShopifyProducts(config?: ShopifyConfig): Promise<ShopifyProduct[]> {
  const out: ShopifyProduct[] = [];
  let url: string | null = null;

  for (let page = 0; page < 40; page++) {
    const res: { data: { products?: ShopifyProduct[] }; nextPageUrl: string | null } = url
      ? await shopifyFetch<{ products?: ShopifyProduct[] }>('', { config, absoluteUrl: url })
      : await shopifyFetch<{ products?: ShopifyProduct[] }>(`/products.json?limit=${PAGE_SIZE}`, { config });

    out.push(...(res.data.products ?? []));
    if (!res.nextPageUrl) break;
    url = res.nextPageUrl;
  }

  return out;
}

function parseNumber(value: unknown): number {
  const n = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Shopify body_html sadrzi tagove koje nasa stranica ne stilizuje (h1, h2, div,
 * table, inline style). Sanitizer ih svodi na dozvoljeni skup, a nedozvoljeni
 * tag gubi omotac ali zadrzava tekst.
 */
function buildDescription(product: ShopifyProduct): { descriptionHtml: string; description: string } {
  const raw = product.body_html?.trim();
  const descriptionHtml = raw
    ? sanitizeProductHtml(raw)
    : `<p>${escapeHtml(product.title ?? '')}</p>`;
  return {
    descriptionHtml,
    description: htmlToPlainText(descriptionHtml).slice(0, 2000),
  };
}

/**
 * Mapira jedan Shopify proizvod u nas ProductInput.
 *
 * Uzima PRVU varijantu. Ova prodavnica ima jednu varijantu po proizvodu
 * (buildProduct u productStore uvek pravi jednu "Default"), pa proizvod sa vise
 * velicina ili boja gubi ostale - to je poznato ogranicenje, ne previd.
 */
/**
 * Dostupnost se racuna kao sto je racuna i sam Shopify.
 *
 * Kljucno je `inventory_management`: kad je null, Shopify NE prati zalihu za taj
 * proizvod i prodaje ga bez obzira na kolicinu - `inventory_quantity` je tada
 * besmislen podatak i stoji na 0.
 *
 * Izmereno na katalogu od 81 proizvoda: 78 ne prati zalihu, 3 prati, a svima je
 * `inventory_quantity` 0. Formula koja je gledala samo kolicinu obelezila je
 * zato svih 81 kao rasprodato, iako se u Shopify-ju svi normalno prodaju.
 *
 * Izdvojeno jer istu odluku pravi i `npm run shopify:availability` - dve kopije
 * bi se pre ili posle razisle.
 */
export function deriveAvailability(
  product: Pick<ShopifyProduct, 'status'>,
  variant: ShopifyVariant | undefined
): { tracked: boolean; stock: number; availableForSale: boolean } {
  const stock = variant?.inventory_quantity ?? 0;
  const tracked = variant?.inventory_management != null;
  // `continue` znaci da Shopify dozvoljava prodaju i na nuli
  const oversell = variant?.inventory_policy === 'continue';

  return {
    tracked,
    stock,
    availableForSale: product.status === 'active' && (!tracked || oversell || stock > 0),
  };
}

export async function mapShopifyProduct(
  product: ShopifyProduct,
  opts: { rehostImages?: boolean } = {}
): Promise<ProductInput> {
  const variant = product.variants?.[0];
  const price = parseNumber(variant?.price);
  const compareAt = variant?.compare_at_price ? parseNumber(variant.compare_at_price) : null;

  const remoteImages = (product.images ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((i) => i.src)
    .filter((s): s is string => typeof s === 'string')
    .slice(0, MAX_IMAGES_PER_PRODUCT);

  const images = opts.rehostImages === false
    ? remoteImages
    : await Promise.all(
        remoteImages.map(async (src) => {
          try {
            return (await importImageFromUrl(src)).url;
          } catch (err) {
            console.warn(`Slika ${src} nije preuzeta:`, err instanceof Error ? err.message : err);
            return src; // bolje hotlink nego proizvod bez slike
          }
        })
      );

  const { descriptionHtml, description } = buildDescription(product);

  const tags = (product.tags ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

  const { tracked, stock, availableForSale } = deriveAvailability(product, variant);

  return {
    title: (product.title ?? '').trim(),
    handle: product.handle?.trim() || slugify(product.title ?? ''),
    description,
    descriptionHtml,
    price,
    compareAtPrice: compareAt && compareAt > price ? compareAt : null,
    imageUrl: images[0] ?? '',
    imageUrls: images.slice(1),
    tags,
    vendor: (product.vendor ?? '').trim() || 'VibeMarket',
    productType: (product.product_type ?? '').trim() || 'Ostalo',
    quantity: Math.max(0, stock),
    trackInventory: tracked,
    availableForSale,
    comparisonPoints: [],
    faqs: [],
    shopifyProductId: product.id,
    shopifyVariantId: variant?.id,
  };
}

/** Odbija uvoz ako valuta Shopify prodavnice nije RSD - cene se ne konvertuju. */
export async function assertCurrencyMatches(config?: ShopifyConfig): Promise<void> {
  const info = await getShopInfo(config);
  if (info.currency !== 'RSD') {
    throw new ShopifyError(
      `Shopify prodavnica radi u ${info.currency}, a VibeMarket iskljucivo u RSD. ` +
        'Cene se ne konvertuju automatski, pa bi uvoz preneo pogresne iznose.'
    );
  }
}
