import { NextRequest, NextResponse } from 'next/server';
import { generateProductWithAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Unesite naziv ili opis proizvoda.' }, { status: 400 });
    }

    const data = await generateProductWithAI(prompt, model);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Greška pri generisanju proizvoda.' }, { status: 500 });
  }
}
