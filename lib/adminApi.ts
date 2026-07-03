import { NextResponse } from 'next/server';
import { getSessionToken, verifySessionToken } from '@/lib/adminAuth';

export async function requireAdmin(): Promise<NextResponse | null> {
  const token = await getSessionToken();
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });
  }
  return null;
}
