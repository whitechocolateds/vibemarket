import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ data: MOCK_COLLECTIONS });
    }

    if (type === 'product' && handle) {
      const product = await getProductByHandle(handle);
      return NextResponse.json({ data: product ?? null });
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
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
