import { Collection, Product } from './types';

// ─── Shopify GraphQL Fragments ────────────────────────────────────────────────

const PRODUCT_FRAGMENT = `
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    availableForSale
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

// ─── Shopify API Client ───────────────────────────────────────────────────────

async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) {
    throw new Error('Shopify credentials not configured');
  }

  const endpoint = `https://${domain}/api/2024-01/graphql.json`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // ISR - revalidate every 60s
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getProducts(first = 24, query?: string): Promise<Product[]> {
  const gql = `
    ${PRODUCT_FRAGMENT}
    query GetProducts($first: Int!, $query: String) {
      products(first: $first, query: $query, sortKey: BEST_SELLING) {
        edges {
          node {
            ...ProductFields
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ products: { edges: { node: Product }[] } }>(gql, {
    first,
    query,
  });

  return data.products.edges.map((e) => normalizeProduct(e.node));
}

export async function getProduct(handle: string): Promise<Product | null> {
  const gql = `
    ${PRODUCT_FRAGMENT}
    query GetProduct($handle: String!) {
      productByHandle(handle: $handle) {
        ...ProductFields
        collections(first: 5) {
          edges {
            node {
              id
              handle
              title
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ productByHandle: Product | null }>(gql, { handle });

  if (!data.productByHandle) return null;
  return normalizeProduct(data.productByHandle);
}

export async function getCollections(): Promise<Collection[]> {
  const gql = `
    query GetCollections {
      collections(first: 20) {
        edges {
          node {
            id
            handle
            title
            description
            image {
              url
              altText
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ collections: { edges: { node: Collection }[] } }>(gql);
  return data.collections.edges.map((e) => e.node);
}

export async function getProductsByCollection(collectionHandle: string, first = 24): Promise<Product[]> {
  const gql = `
    ${PRODUCT_FRAGMENT}
    query GetProductsByCollection($handle: String!, $first: Int!) {
      collectionByHandle(handle: $handle) {
        products(first: $first, sortKey: BEST_SELLING) {
          edges {
            node {
              ...ProductFields
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    collectionByHandle: { products: { edges: { node: Product }[] } } | null;
  }>(gql, { handle: collectionHandle, first });

  if (!data.collectionByHandle) return [];
  return data.collectionByHandle.products.edges.map((e) => normalizeProduct(e.node));
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeProduct(raw: any): Product {
  return {
    ...raw,
    images: raw.images?.edges?.map((e: { node: unknown }) => e.node) ?? [],
    variants: raw.variants?.edges?.map((e: { node: unknown }) => e.node) ?? [],
    collections: raw.collections?.edges?.map((e: { node: unknown }) => e.node) ?? [],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatPrice(amount: string | number, currencyCode = 'RSD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (currencyCode === 'RSD') {
    return `${num.toLocaleString('sr-RS')} RSD`;
  }
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: currencyCode,
  }).format(num);
}

export function getProductPrice(product: Product): { price: number; compareAtPrice: number | null } {
  const variant = product.variants[0];
  if (!variant) {
    return {
      price: parseFloat(product.priceRange.minVariantPrice.amount),
      compareAtPrice: null,
    };
  }
  return {
    price: parseFloat(variant.price.amount),
    compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
  };
}

export function isShopifyConfigured(): boolean {
  return !!(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
}
