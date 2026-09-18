import { NextRequest, NextResponse } from 'next/server';
import { generateLandingWithAI, type LandingContext } from '@/lib/gemini';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { context, model } = (await req.json()) as { context?: LandingContext; model?: string };
    if (!context?.title?.trim()) {
      return NextResponse.json({ error: 'Naziv proizvoda je obavezan.' }, { status: 400 });
    }

    const data = await generateLandingWithAI(context, model);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Greška pri generisanju landing sadržaja.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
