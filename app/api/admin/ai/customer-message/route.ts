import { NextRequest, NextResponse } from 'next/server';
import { generateCustomerMessageAI } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { order } = await req.json();
    if (!order) {
      return NextResponse.json({ error: 'Podaci o porudžbini su obavezni.' }, { status: 400 });
    }

    const message = await generateCustomerMessageAI(order);
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Greška pri kreiranju poruke.' }, { status: 500 });
  }
}
