import { NextRequest, NextResponse } from 'next/server';
import { generateSalesInsightsAI } from '@/lib/gemini';
import { getAdminStats } from '@/lib/orderStore';

export async function POST(req: NextRequest) {
  try {
    const stats = await getAdminStats();
    const insights = await generateSalesInsightsAI(stats);
    return NextResponse.json({ success: true, insights });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Greška pri analizi prodaje.' }, { status: 500 });
  }
}
