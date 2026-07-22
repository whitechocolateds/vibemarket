import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminStats } from '@/lib/orderStore';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const stats = await getAdminStats();
    return NextResponse.json({
      data: {
        pendingOrders: stats.pendingOrders,
        lowStockProducts: stats.lowStockCount,
        totalOrders: stats.totalOrders,
        todayRevenue: stats.todayRevenue,
        totalRevenue: stats.totalRevenue,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju statistike' }, { status: 500 });
  }
}
