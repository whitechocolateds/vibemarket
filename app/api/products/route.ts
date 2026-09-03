import { NextRequest, NextResponse } from 'next/server';
import { MOCK_COLLECTIONS } from '@/lib/mockData';
import { getAllProducts, getProductByHandle } from '@/lib/productStore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const handle = searchParams.get('handle');
  const query = searchParams.get('q') ?? undefined;
  /*
   * Bez `first` se vraca CEO katalog.
   *
   * Podrazumevanih 24 je bilo tiho odsecanje: stranica kolekcije ne salje
   * `first`, pa je od 81 proizvoda prikazivala 24 i u zaglavlju pisala
   * "24 artikala" - kao da ih toliko i ima. Ogranicenje ostaje dostupno onima
   * koji ga izricito traze (npr. "srodni proizvodi").
   */
  const firstParam = searchParams.get('first');
  const first = firstParam === null ? Number.POSITIVE_INFINITY : Math.max(1, parseInt(firstParam) || 1);

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
    return NextResponse.json({
      data: Number.isFinite(first) ? products.slice(0, first) : products,
    });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
