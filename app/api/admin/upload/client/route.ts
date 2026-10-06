import { NextRequest, NextResponse } from 'next/server';
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { issueSignedToken } from '@vercel/blob';
import { requireAdmin } from '@/lib/adminAuth';
import { CLIENT_UPLOAD_MIME, MAX_CLIENT_UPLOAD_BYTES, mediaStoreId } from '@/lib/mediaStore';
import { jeUploadPutanja } from '@/lib/uploadPath';

/**
 * Izdaje kratkotrajnu dozvolu da pretrazivac otpremi sliku PRAVO u Blob.
 *
 * Postoji zbog GIF-ova. Otpremanje kroz nasu funkciju (/api/admin/upload) ima
 * tvrd plafon: Vercel odbija telo zahteva vece od ~4.5 MB, pa se taj put ne
 * moze podici ni na 10 MB. Ovde bajtovi nikad ne prolaze kroz nas - funkcija
 * samo potpise dozvolu, a fajl ide direktno u store.
 *
 * DVA STORE-A SE NE MESAJU: dozvola se izdaje za medijski (JAVNI) store preko
 * `storeId`, isto kao sto lib/mediaStore.ts radi za serverska otpremanja.
 * Glavni store je privatan i u njemu su porudzbine sa podacima kupaca.
 *
 * STO SE OVDE GUBI: bajtovi ne prolaze kroz nas, pa se tip vise ne moze
 * proveriti po magic bytes kao u saveImage. Ostaje `allowedContentTypes`, koji
 * gleda zaglavlje koje klijent posalje. Rutu moze da pozove samo prijavljen
 * admin, a store je na zasebnom domenu (*.public.blob.vercel-storage.com), pa
 * ni podmetnut SVG ne bi mogao da izvrsi skriptu na nasem domenu.
 */

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const storeId = mediaStoreId();
  if (!storeId) {
    return NextResponse.json(
      { error: 'BLOB_MEDIA_STORE_ID nije postavljen, pa nema gde da se otpremi.' },
      { status: 500 }
    );
  }

  let body: HandleUploadPresignedBody;
  try {
    body = (await req.json()) as HandleUploadPresignedBody;
  } catch {
    return NextResponse.json({ error: 'Očekivan je JSON zahtev.' }, { status: 400 });
  }

  try {
    const rezultat = await handleUploadPresigned({
      body,
      request: req,
      webhookPublicKey: process.env.BLOB_MEDIA_WEBHOOK_PUBLIC_KEY,
      getSignedToken: async (pathname) => {
        /*
         * Putanju predlaze pretrazivac, pa se ovde proverava - dozvola se vezuje
         * bas za nju. Bez ove provere bi se moglo pisati bilo gde po store-u.
         */
        if (!jeUploadPutanja(pathname)) {
          throw new Error(`Nedozvoljena putanja: ${pathname}`);
        }

        return {
          token: await issueSignedToken({
            storeId,
            pathname,
            operations: ['put'],
            allowedContentTypes: CLIENT_UPLOAD_MIME,
            maximumSizeInBytes: MAX_CLIENT_UPLOAD_BYTES,
          }),
          urlOptions: {
            addRandomSuffix: true,
            cacheControlMaxAge: 31_536_000,
            allowedContentTypes: CLIENT_UPLOAD_MIME,
            maximumSizeInBytes: MAX_CLIENT_UPLOAD_BYTES,
          },
        };
      },
    });

    return NextResponse.json(rezultat);
  } catch (error) {
    // Originalna poruka se zadrzava - bez nje se u admin panelu vidi samo "nije uspelo".
    const poruka = error instanceof Error ? error.message : 'Otpremanje nije uspelo.';
    return NextResponse.json({ error: poruka }, { status: 400 });
  }
}
