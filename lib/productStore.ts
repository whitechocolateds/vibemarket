import { MOCK_PRODUCTS } from './mockData';
import { readJsonFile, writeJsonFile } from './db';
import { Product, ProductInput } from './types';
import { slugify } from './slugify';

const FILE = 'products.json';

async function loadProducts(): Promise<Product[]> {
  const stored = await readJsonFile<Product[] | null>(FILE, null);
  if (stored && stored.length > 0) return stored;

  await writeJsonFile(FILE, MOCK_PRODUCTS);
  return MOCK_PRODUCTS;
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

  return {
    id: productId,
    handle,
    title: input.title.trim(),
    description: input.description.trim(),
    descriptionHtml: input.descriptionHtml?.trim() || `<p>${input.description.trim()}</p>`,
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
    }],
    priceRange: {
      minVariantPrice: { amount: priceStr, currencyCode: 'RSD' },
      maxVariantPrice: { amount: priceStr, currencyCode: 'RSD' },
    },
    tags: input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    vendor: input.vendor.trim() || 'VibeMarket',
    productType: input.productType.trim() || 'Ostalo',
    availableForSale: input.availableForSale,
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const products = await loadProducts();
  const handle = input.handle?.trim() || slugify(input.title);

  if (products.some((p) => p.handle === handle)) {
    throw new Error('Proizvod sa tim URL-om već postoji');
  }

  const product = buildProduct(input);
  products.unshift(product);
  await writeJsonFile(FILE, products);
  return product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const products = await loadProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Proizvod nije pronađen');

  const handle = input.handle?.trim() || slugify(input.title);
  if (products.some((p) => p.handle === handle && p.id !== id)) {
    throw new Error('Proizvod sa tim URL-om već postoji');
  }

  const updated = buildProduct(input, id);
  updated.variants[0].id = products[index].variants[0]?.id ?? updated.variants[0].id;
  products[index] = updated;
  await writeJsonFile(FILE, products);
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await loadProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) throw new Error('Proizvod nije pronađen');
  await writeJsonFile(FILE, filtered);
}
