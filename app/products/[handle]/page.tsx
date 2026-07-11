import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { getProductByHandle, getAllProducts } from '@/lib/productStore';
import { stableReviewCount, STORE_RATING } from '@/lib/reviewStats';
import { Product } from '@/lib/types';

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: 'Proizvod nije pronađen' };

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.featuredImage ? [product.featuredImage.url] : [],
    },
  };
}

function buildProductSchema(product: Product) {
  const variant = product.variants[0];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vibemarket.rs';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((i) => i.url),
    sku: variant?.id,
    brand: { '@type': 'Brand', name: product.vendor },
    offers: variant
      ? {
          '@type': 'Offer',
          url: `${baseUrl}/products/${product.handle}`,
          priceCurrency: variant.price.currencyCode,
          price: variant.price.amount,
          availability: product.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        }
      : undefined,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: STORE_RATING,
      reviewCount: stableReviewCount(product.id),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) notFound();

  const all = await getAllProducts();
  const related = all
    .filter((p) => p.id !== product.id)
    .filter((p) => p.productType === product.productType || p.tags.some((t) => product.tags.includes(t)))
    .slice(0, 4);
  const fallbackRelated = related.length > 0 ? related : all.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductSchema(product)) }}
      />
      <ProductDetailClient product={product} related={fallbackRelated} />
    </>
  );
}
