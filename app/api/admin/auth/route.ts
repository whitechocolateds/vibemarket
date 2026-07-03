import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAdminAuthenticated,
} from '@/lib/adminAuth';

export async function GET() {
  const ok = await isAdminAuthenticated();
  return NextResponse.json({ authenticated: ok });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!password || !verifyPassword(password)) {
      return NextResponse.json({ error: 'Pogrešna lozinka' }, { status: 401 });
    }
    const token = createSessionToken();
    await setSessionCookie(token);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Greška pri prijavi' }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
