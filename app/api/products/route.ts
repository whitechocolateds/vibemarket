import { NextRequest, NextResponse } from 'next/server';
import { MOCK_COLLECTIONS } from '@/lib/mockData';
import { getAllProducts, getProductByHandle } from '@/lib/productStore';
import type { Product, ProductListItem } from '@/lib/types';

/** Kartica prikazuje naslovnu i drugu sliku (zamena na hover) - dalje ne ide. */
const SLIKA_ZA_KARTICU = 2;

/**
 * Svodi proizvod na ono sto lista stvarno prikazuje.
 *
 * Polja se nabrajaju rucno, umesto brisanjem nezeljenih, da novo polje na
 * `Product` ne bi tiho uslo u odgovor - narocito ako je veliko kao opis.
 */
function zaListu(p: Product): ProductListItem {
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor,
    tags: p.tags,
    availableForSale: p.availableForSale,
    featuredImage: p.featuredImage,
    images: p.images.slice(0, SLIKA_ZA_KARTICU),
    priceRange: p.priceRange,
    variants: p.variants,
  };
}

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

    // Pojedinacan proizvod ide U CELOSTI - opis, sve slike, poredjenje, pitanja
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
    const izabrani = Number.isFinite(first) ? products.slice(0, first) : products;
    return NextResponse.json({ data: izabrani.map(zaListu) });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
