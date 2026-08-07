import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { saveImage, MediaError, MAX_FILES_PER_REQUEST, type StoredMedia } from '@/lib/mediaStore';

// fs + crypto -> mora Node runtime, ne Edge
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Očekivan je multipart/form-data zahtev.' }, { status: 400 });
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'Nijedan fajl nije poslat.' }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Najviše ${MAX_FILES_PER_REQUEST} fajlova po zahtevu.` },
      { status: 400 }
    );
  }

  const data: StoredMedia[] = [];
  const errors: { name: string; reason: string }[] = [];

  // Jedan loš fajl ne obara ceo batch
  for (const file of files) {
    try {
      data.push(await saveImage(file));
    } catch (error) {
      const reason =
        error instanceof MediaError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Otpremanje nije uspelo.';
      errors.push({ name: file.name || 'bez imena', reason });
    }
  }

  if (data.length === 0) {
    return NextResponse.json({ error: errors[0]?.reason ?? 'Otpremanje nije uspelo.', errors }, { status: 400 });
  }

  return NextResponse.json({ success: true, data, errors });
}
