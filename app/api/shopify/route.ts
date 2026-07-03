import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getProduct, getCollections, isShopifyConfigured } from '@/lib/shopify';
import { MOCK_COLLECTIONS } from '@/lib/mockData';
import { getAllProducts, getProductByHandle } from '@/lib/productStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const handle = searchParams.get('handle');
  const query = searchParams.get('q') ?? undefined;
  const first = parseInt(searchParams.get('first') ?? '24');

  try {
    if (type === 'collections') {
      if (!isShopifyConfigured()) {
        return NextResponse.json({ data: MOCK_COLLECTIONS });
      }
      const collections = await getCollections();
      return NextResponse.json({ data: collections });
    }

    if (type === 'product' && handle) {
      if (isShopifyConfigured()) {
        const product = await getProduct(handle);
        if (product) return NextResponse.json({ data: product });
      }
      const local = await getProductByHandle(handle);
      return NextResponse.json({ data: local ?? null });
    }

    if (isShopifyConfigured()) {
      const products = await getProducts(first, query);
      return NextResponse.json({ data: products });
    }

    let products = await getAllProducts();
    if (query) {
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      );
    }
    return NextResponse.json({ data: products.slice(0, first) });
  } catch (error) {
    console.error('Shopify API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
