import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { getProductByHandle } from '@/lib/productStore';

interface Props {
  params: Promise<{ handle: string }>;
}

async function getProductData(handle: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/shopify?type=product&handle=${handle}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return json.data;
  } catch {
    return getProductByHandle(handle);
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductData(handle);
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

export default async function ProductDetailPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProductData(handle);

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
