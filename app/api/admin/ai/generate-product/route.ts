import { NextRequest, NextResponse } from 'next/server';
import { generateProductWithAI } from '@/lib/gemini';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { prompt, model } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Unesite naziv ili opis proizvoda.' }, { status: 400 });
    }

    const data = await generateProductWithAI(prompt, model);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Greška pri generisanju proizvoda.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
