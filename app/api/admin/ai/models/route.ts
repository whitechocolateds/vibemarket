import { NextResponse } from 'next/server';
import { listAvailableGeminiModels } from '@/lib/gemini';

export async function GET() {
  try {
    const models = await listAvailableGeminiModels();
    return NextResponse.json({ success: true, models });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Greška pri preuzimanju modela.' }, { status: 500 });
  }
}
