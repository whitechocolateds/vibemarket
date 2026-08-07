import { NextResponse } from 'next/server';
import { listAvailableGeminiModels } from '@/lib/gemini';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const models = await listAvailableGeminiModels();
    return NextResponse.json({ success: true, models });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Greška pri preuzimanju modela.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
