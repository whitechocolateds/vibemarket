import { MOCK_PRODUCTS } from './mockData';
import { readJsonFileResult, updateJsonFile, writeJsonFile } from './db';
import { Product, ProductInput } from './types';
import { slugify } from './slugify';
import { sanitizeProductHtml, htmlToPlainText, escapeHtml } from './sanitizeHtml';

const FILE = 'products.json';

/**
 * Sanitizacija i na čitanju, ne samo na upisu: proizvodi upisani pre nego što je
 * sanitizer postojao (ili direktnim POST-om koji zaobilazi formu) i dalje idu u
 * dangerouslySetInnerHTML na stranici proizvoda.
 */
function harden(product: Product): Product {
  const html = product.descriptionHtml;
  if (!html) return product;
  const safe = sanitizeProductHtml(html);
  return safe === html ? product : { ...product, descriptionHtml: safe };
}

/**
 * Ucitava katalog.
 *
 * SEED SE POKRECE SAMO kad skladiste dokazano NE POSTOJI (prvi start).
 * Ranije se demo katalog upisivao i kad citanje NE USPE, jer se greska i
 * praznina svodile na isti `null`. Jedan prolazni prekid citanja usred uvoza
 * bio je dovoljan da 8 demo proizvoda pregazi pravi katalog, a sve sto se
 * posle upisivalo gradilo se na njima.
 */
async function loadProducts(): Promise<Product[]> {
  const res = await readJsonFileResult<Product[]>(FILE);

  if (res.status === 'ok') {
    // Prazan niz je legitimno stanje (sve obrisano) - NE seeduje se
    return (Array.isArray(res.data) ? res.data : []).map(harden);
  }

  if (res.status === 'error') {
    // Nikada ne raditi nista nad podacima koje nismo uspeli da procitamo
    throw new Error(
      'Katalog nije procitan iz skladista. Upis je zaustavljen da ne bi pregazio postojece podatke. ' +
        `Uzrok: ${res.error instanceof Error ? res.error.message : String(res.error)}`
    );
  }

  // status === 'missing' -> prvi start, tek tada demo katalog
  console.log('Katalog ne postoji - upisujem pocetne demo proizvode.');
  try {
    await writeJsonFile(FILE, MOCK_PRODUCTS);
  } catch (error) {
    console.warn('Pocetni upis nije uspeo:', error);
  }
  return MOCK_PRODUCTS;
}

/**
 * Svaka izmena kataloga ide odavde.
 *
 * `mutate` dobija niz koji sme da menja na licu mesta i vraca `true` ako se
 * nesto promenilo. Ako se ne promeni nista, ne upisuje se nista.
 */
async function mutateProducts(
  mutate: (products: Product[]) => boolean
): Promise<Product[]> {
  let result: Product[] = [];

  await updateJsonFile<Product[]>(FILE, (current) => {
    if (current === null) {
      throw new Error('Katalog ne postoji u skladistu - izmena je zaustavljena.');
    }
    const products = (Array.isArray(current) ? current : []).map(harden);
    const changed = mutate(products);
    result = products;
    return changed ? products : null;
  });

  return result;
}

export async function getAllProducts(): Promise<Product[]> {
  return loadProducts();
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const products = await loadProducts();
  let decoded = handle;
  try {
    decoded = decodeURIComponent(handle);
  } catch {
    // handle was already decoded or isn't validly percent-encoded; fall back to raw value
  }
  return products.find((p) => p.handle === handle || p.handle === decoded) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await loadProducts();
  return products.find((p) => p.id === id) ?? null;
}

function buildProduct(input: ProductInput, id?: string): Product {
  const handle = input.handle?.trim() || slugify(input.title);
  const productId = id ?? `prod-${Date.now()}`;
  const variantId = `var-${productId}`;

  const allImageUrls = [
    input.imageUrl,
    ...(input.imageUrls ?? []).filter(Boolean),
  ].filter((url, i, arr) => url && arr.indexOf(url) === i);

  const images = allImageUrls.map((url, i) => ({
    url,
    altText: i === 0 ? input.title : `${input.title} ${i + 1}`,
  }));

  const priceStr = String(Math.round(input.price));
  const compareStr = input.compareAtPrice ? String(Math.round(input.compareAtPrice)) : null;

  // Ako nema gotovog HTML-a, čist opis se ESKEJPUJE pre umotavanja - inače je '<' u opisu injection.
  const rawHtml = input.descriptionHtml?.trim() || `<p>${escapeHtml(input.description.trim())}</p>`;
  const descriptionHtml = sanitizeProductHtml(rawHtml);
  const description = input.description.trim() || htmlToPlainText(descriptionHtml);

  return {
    id: productId,
    handle,
    title: input.title.trim(),
    description,
    descriptionHtml,
    featuredImage: images[0] ?? null,
    images,
    variants: [{
      id: variantId,
      title: 'Default',
      price: { amount: priceStr, currencyCode: 'RSD' },
      compareAtPrice: compareStr ? { amount: compareStr, currencyCode: 'RSD' } : null,
      availableForSale: input.availableForSale,
      quantityAvailable: input.quantity,
      selectedOptions: [{ name: 'Title', value: 'Default' }],
      ...(input.shopifyVariantId ? { shopifyVariantId: input.shopifyVariantId } : {}),
    }],
    priceRange: {
      minVariantPrice: { amount: priceStr, currencyCode: 'RSD' },
      maxVariantPrice: { amount: priceStr, currencyCode: 'RSD' },
    },
    tags: input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    vendor: input.vendor.trim() || 'VibeMarket',
    productType: input.productType.trim() || 'Ostalo',
    availableForSale: input.availableForSale,
    comparisonPoints: (input.comparisonPoints ?? []).map((p) => p.trim()).filter(Boolean),
    faqs: (input.faqs ?? []).filter((f) => f.question.trim() && f.answer.trim()),
    ...(input.shopifyProductId ? { shopifyProductId: input.shopifyProductId } : {}),
  };
}

export interface BulkOutcome {
  input: ProductInput;
  action: 'kreiran' | 'azuriran';
  product: Product;
}

/**
 * Upisuje CELU seriju kroz jedno citanje i jedan upis.
 *
 * Ranije je svaki proizvod isao kroz createProduct, sto je za seriju od 10
 * znacilo 10 ciklusa procitaj-ceo-niz / upisi-ceo-niz. Svaki od njih je bio
 * prilika da se izgubi tudji upis, a i deset puta skuplje.
 */
export async function saveProductsBulk(
  inputs: ProductInput[],
  opts: { overwrite: boolean }
): Promise<BulkOutcome[]> {
  let outcomes: BulkOutcome[] = [];

  await mutateProducts((products) => {
    // Ponovni pokusaj posle sudara krece od nule, nad SVEZE procitanim katalogom
    outcomes = [];

    for (const input of inputs) {
      const handle = input.handle?.trim() || slugify(input.title);
      const index = products.findIndex(
        (p) =>
          (input.shopifyProductId && p.shopifyProductId === input.shopifyProductId) ||
          p.handle === handle
      );

      if (index !== -1 && !opts.overwrite) continue;

      if (index !== -1) {
        const existing = products[index];
        const updated = buildProduct({ ...input, handle }, existing.id);
        updated.variants[0].id = existing.variants[0]?.id ?? updated.variants[0].id;
        products[index] = updated;
        outcomes.push({ input, action: 'azuriran', product: updated });
      } else {
        // Vise proizvoda u istoj seriji: sam Date.now() bi im dao isti id
        const product = buildProduct({ ...input, handle }, `prod-${Date.now()}-${outcomes.length}`);
        products.unshift(product);
        outcomes.push({ input, action: 'kreiran', product });
      }
    }

    return outcomes.length > 0;
  });

  return outcomes;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const handle = input.handle?.trim() || slugify(input.title);
  let created: Product | null = null;

  await mutateProducts((products) => {
    if (products.some((p) => p.handle === handle)) {
      throw new Error('Proizvod sa tim URL-om već postoji');
    }
    created = buildProduct({ ...input, handle });
    products.unshift(created);
    return true;
  });

  return created!;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const handle = input.handle?.trim() || slugify(input.title);
  let updated: Product | null = null;

  await mutateProducts((products) => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Proizvod nije pronađen');
    if (products.some((p) => p.handle === handle && p.id !== id)) {
      throw new Error('Proizvod sa tim URL-om već postoji');
    }

    updated = buildProduct({ ...input, handle }, id);
    updated.variants[0].id = products[index].variants[0]?.id ?? updated.variants[0].id;
    products[index] = updated;
    return true;
  });

  return updated!;
}

export async function setProductAvailability(id: string, availableForSale: boolean): Promise<Product> {
  let changed: Product | null = null;

  await mutateProducts((products) => {
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error('Proizvod nije pronađen');

    product.availableForSale = availableForSale;
    for (const v of product.variants) v.availableForSale = availableForSale;
    changed = product;
    return true;
  });

  return changed!;
}

export async function decrementStock(items: { productId: string; quantity: number }[]): Promise<void> {
  await mutateProducts((products) => {
    let changed = false;

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants[0];
      if (!product || !variant || typeof variant.quantityAvailable !== 'number') continue;

      variant.quantityAvailable = Math.max(0, variant.quantityAvailable - item.quantity);
      if (variant.quantityAvailable === 0) {
        variant.availableForSale = false;
        product.availableForSale = false;
      }
      changed = true;
    }

    return changed;
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await mutateProducts((products) => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Proizvod nije pronađen');
    products.splice(index, 1);
    return true;
  });
}
