import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  setProductAvailability,
} from '@/lib/productStore';
import { ProductInput } from '@/lib/types';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get('id');
  try {
    if (id) {
      const product = await getProductById(id);
      if (!product) return NextResponse.json({ error: 'Proizvod nije pronađen' }, { status: 404 });
      return NextResponse.json({ data: product });
    }
    const products = await getAllProducts();
    return NextResponse.json({ data: products });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju proizvoda' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json() as ProductInput;
    const product = await createProduct(body);
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Greška';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json() as ProductInput & { id: string };
    if (!body.id) return NextResponse.json({ error: 'ID je obavezan' }, { status: 400 });
    const { id, ...input } = body;
    const product = await updateProduct(id, input);
    return NextResponse.json({ data: product });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Greška';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await req.json() as { id: string; availableForSale: boolean };
    if (!body.id || typeof body.availableForSale !== 'boolean') {
      return NextResponse.json({ error: 'Nedostaju podaci' }, { status: 400 });
    }
    const product = await setProductAvailability(body.id, body.availableForSale);
    return NextResponse.json({ data: product });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Greška';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID je obavezan' }, { status: 400 });

  try {
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Greška';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
