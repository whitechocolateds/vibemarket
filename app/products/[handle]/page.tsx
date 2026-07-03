import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { getProductByHandle, getAllProducts } from '@/lib/productStore';

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

  return <ProductDetailClient product={product} related={fallbackRelated} />;
}
