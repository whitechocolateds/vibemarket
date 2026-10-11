import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllOrders, getOrderById, updateOrderStatus } from '@/lib/orderStore';
import { isTransientBlobError } from '@/lib/blobStore';
import { Order } from '@/lib/types';

/**
 * Prolazna smetnja skladista nije ista stvar kao greska u zahtevu.
 *
 * Posle upisa telo u Blob-u nakratko kasni za svojim ETag-om; sloj ispod to
 * ponavlja i skoro uvek sam resi, ali kad budzet ponavljanja istekne greska je
 * izbijala do admina kao 400 sa unutrasnjim tekstom ("telo je zastarelo:
 * telo=... skladiste=..."). Takav odgovor klijent ne moze da razlikuje od
 * stvarne greske, pa je i ponavljanje bilo nemoguce.
 *
 * 503 kaze tacno ono sto jeste: pokusaj ponovo za koji trenutak.
 */
function odgovorNaGresku(error: unknown, uTokuRadnje: string) {
  if (isTransientBlobError(error)) {
    console.error(`${uTokuRadnje}: prolazna smetnja skladista`, error);
    return NextResponse.json(
      { error: 'Skladiste je trenutno zauzeto. Pokusaj ponovo za koji trenutak.', prolazno: true },
      { status: 503 }
    );
  }
  return null;
}

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
    const prolazno = odgovorNaGresku(error, 'Orders GET');
    if (prolazno) return prolazno;
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
    const prolazno = odgovorNaGresku(error, 'Orders PATCH');
    if (prolazno) return prolazno;
    const msg = error instanceof Error ? error.message : 'Greška';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
