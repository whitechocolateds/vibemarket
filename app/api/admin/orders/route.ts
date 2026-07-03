import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllOrders, getOrderById, updateOrderStatus } from '@/lib/orderStore';
import { Order } from '@/lib/types';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const id = new URL(req.url).searchParams.get('id');
  try {
    if (id) {
      const order = await getOrderById(id);
      if (!order) return NextResponse.json({ error: 'Porudžbina nije pronađena' }, { status: 404 });
      return NextResponse.json({ data: order });
    }
    const orders = await getAllOrders();
    return NextResponse.json({ data: orders });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju porudžbina' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id, status } = await req.json() as { id: string; status: Order['status'] };
    if (!id || !status) {
      return NextResponse.json({ error: 'Nedostaju podaci' }, { status: 400 });
    }
    const order = await updateOrderStatus(id, status);
    return NextResponse.json({ data: order });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Greška';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
