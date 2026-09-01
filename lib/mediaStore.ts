import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { slugify } from './slugify';

/**
 * Čuvanje slika proizvoda.
 *
 * DVA ODVOJENA BLOB STORE-A, jer je pristup svojstvo STORE-a i ne može se
 * promeniti posle kreiranja:
 *
 *   - JSON (proizvodi, porudžbine) -> PRIVATNI store (lib/blobStore.ts).
 *     Mora biti privatan: orders.json sadrži imena, adrese i telefone kupaca.
 *
 *   - slike -> JAVNI store (ovaj fajl). Moraju biti javne jer privatni blob
 *     Vercel isporučuje samo kroz našu funkciju preko get(), pa bi <img> iz
 *     kupčevog browsera dobio 403. Uz to bi svaka slika trošila poziv funkcije
 *     umesto da je servira CDN.
 *
 * Ako BLOB_MEDIA_* nije postavljen, pada nazad na glavni store - to radi samo
 * ako je i on javan. Kod privatnog glavnog store-a Vercel vraća
 * "Cannot use public access on a private store".
 *
 * VAŽNO, izmereno: kad se prosledi i `token` i `storeId`, TOKEN određuje u koji
 * store upis ide i nadjačava `storeId` — iako dokumentacija tvrdi suprotno
 * ("token ... Ignored when Vercel OIDC token is available and either
 * BLOB_STORE_ID or options.storeId is set"). Zato se kredencijali dva store-a
 * nikad ne mešaju.
 */

export class MediaError extends Error {}

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const BLOB_MEDIA_PREFIX = 'products';

/**
 * Zaseban JAVNI store za slike. Ako nije podešen, koristi se glavni.
 * Vercel pri povezivanju drugog store-a dozvoljava svoj prefiks za env
 * varijable - imenuj ga BLOB_MEDIA_ da se ne sudari sa glavnim.
 */
function mediaCredentials(): { token?: string; storeId?: string } {
  const mediaToken = process.env.BLOB_MEDIA_READ_WRITE_TOKEN?.trim();
  const mediaStoreId = process.env.BLOB_MEDIA_STORE_ID?.trim();

  /**
   * Kad postoji zaseban medijski store, koriste se ISKLJUCIVO njegovi kredencijali.
   *
   * Ranije se ovde padalo na BLOB_READ_WRITE_TOKEN glavnog store-a kad medijski
   * token ne postoji (Vercel ga i ne pravi kad se koristi OIDC). To je bilo pogresno:
   * izmereno je da TOKEN odredjuje odrediste i nadjacava storeId, pa je upis
   * zavrsavao u glavnom PRIVATNOM store-u i padao sa
   * "Cannot use public access on a private store" - iako je storeId pokazivao
   * na javni store. Bez tokena SDK koristi OIDC uz prosledjeni storeId i pogadja
   * pravi store.
   */
  if (mediaToken || mediaStoreId) {
    return { token: mediaToken, storeId: mediaStoreId };
  }

  return {
    token: process.env.BLOB_READ_WRITE_TOKEN?.trim(),
    storeId: process.env.BLOB_STORE_ID?.trim(),
  };
}

/** Da li slike uopšte idu u Blob (a ne na lokalni disk). */
export function isMediaBlobEnabled(): boolean {
  const { token, storeId } = mediaCredentials();
  return Boolean(token?.startsWith('vercel_blob_rw_') || storeId?.startsWith('store_'));
}

/** True kad se koristi zaseban medijski store, a ne glavni. */
export function usesDedicatedMediaStore(): boolean {
  return Boolean(
    process.env.BLOB_MEDIA_READ_WRITE_TOKEN?.trim() || process.env.BLOB_MEDIA_STORE_ID?.trim()
  );
}

/** Ispod Vercel-ovog ~4.5 MB limita na telo zahteva. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_FILES_PER_REQUEST = 10;

export interface StoredMedia {
  url: string;
  pathname: string;
  size: number;
  contentType: string;
}

type ImageKind = 'jpg' | 'png' | 'webp' | 'avif' | 'gif';

const MIME_BY_KIND: Record<ImageKind, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

export const ACCEPTED_MIME = Object.values(MIME_BY_KIND).join(',');

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  return sig.every((b, i) => bytes[offset + i] === b);
}

/**
 * Tip se određuje ISKLJUČIVO po magic bytes. file.type i ekstenzija dolaze od klijenta
 * i ne smeju se verovati. SVG se namerno NE podržava: lokalne slike se serviraju sa
 * istog domena iz /uploads/, pa je SVG upload direktan stored XSS na sopstvenom sajtu.
 */
export function sniffImageType(head: Uint8Array): ImageKind | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpg';
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(head, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  // RIFF....WEBP
  if (startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  // ....ftypavif / ....ftypavis
  if (startsWith(head, [0x66, 0x74, 0x79, 0x70], 4)) {
    const brand = String.fromCharCode(...head.slice(8, 12));
    if (brand === 'avif' || brand === 'avis') return 'avif';
  }
  return null;
}

/**
 * Korisnikov string nikad ne stiže do path.join u sirovom obliku - slugify izbacuje
 * sve osim [a-z0-9-], pa su '..', '/', '\' i NUL nemogući po konstrukciji.
 */
export function safeFileName(original: string, kind: ImageKind): string {
  const base = original.replace(/\.[^.]*$/, '');
  const slug = slugify(base).slice(0, 60) || 'slika';
  return `${Date.now()}-${randomUUID().slice(0, 8)}-${slug}.${kind}`;
}

function assertWritable() {
  if (!isMediaBlobEnabled() && process.env.VERCEL === '1') {
    throw new Error(
      'Otpremanje slika na Vercelu zahteva Blob storage. Poveži Blob store ili postavi BLOB_READ_WRITE_TOKEN.'
    );
  }
}

async function storeBytes(bytes: Uint8Array, name: string, kind: ImageKind): Promise<StoredMedia> {
  assertWritable();
  const contentType = MIME_BY_KIND[kind];

  if (isMediaBlobEnabled()) {
    const { token, storeId } = mediaCredentials();
    const pathname = `${BLOB_MEDIA_PREFIX}/${name}`;

    try {
      const result = await put(pathname, Buffer.from(bytes), {
        access: 'public',
        addRandomSuffix: true,
        contentType,
        cacheControlMaxAge: 31_536_000,
        ...(token ? { token } : {}),
        ...(storeId ? { storeId } : {}),
      });
      return { url: result.url, pathname: result.pathname, size: bytes.byteLength, contentType };
    } catch (error) {
      const original = error instanceof Error ? error.message : String(error);

      /**
       * Originalna Vercel poruka se UVEK zadrzava. Ranije je bila zamenjena
       * objasnjenjem, pa se nije videlo sta je stvarno vratio API - a objasnjenje
       * je usput promasivalo uzrok.
       */
      const hint = /public access on a private store/i.test(original)
        ? ' | Upis je otisao u PRIVATAN store. Proveri da je BLOB_MEDIA_STORE_ID id javnog ' +
          'store-a i da uz njega NE ide token glavnog store-a - token nadjacava storeId. ' +
          'Provera: npm run blob:check'
        : '';

      throw new MediaError(
        `Vercel Blob nije primio sliku (store: ${storeId ?? 'podrazumevani'}, ` +
          `token: ${token ? 'prosledjen' : 'nije prosledjen, koristi se OIDC'}). ` +
          `Originalna greska: ${original}${hint}`,
        { cause: error }
      );
    }
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/uploads/${name}`, pathname: name, size: bytes.byteLength, contentType };
}

export async function saveImage(file: File): Promise<StoredMedia> {
  if (file.size === 0) throw new MediaError('Fajl je prazan.');
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new MediaError(`Fajl je veći od ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImageType(bytes);
  if (!kind) {
    throw new MediaError('Nepodržan format. Dozvoljeni su JPG, PNG, WebP, AVIF i GIF (SVG nije dozvoljen).');
  }

  return storeBytes(bytes, safeFileName(file.name || 'slika', kind), kind);
}

/** Preuzima udaljenu sliku i čuva je kod nas - koristi se pri uvozu sa konkurentskog sajta. */
export async function importImageFromUrl(rawUrl: string): Promise<StoredMedia> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new MediaError('Neispravan URL slike.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new MediaError('URL slike mora biti http ili https.');
  }

  const res = await fetch(parsed, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15_000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VibeMarketBot/1.0)' },
  });
  if (!res.ok) throw new MediaError(`Slika nije dostupna (HTTP ${res.status}).`);

  const declared = Number(res.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_UPLOAD_BYTES) {
    throw new MediaError('Udaljena slika je prevelika.');
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new MediaError('Udaljena slika je prevelika.');

  const kind = sniffImageType(bytes);
  if (!kind) throw new MediaError('Udaljeni fajl nije podržana slika.');

  const nameFromUrl = decodeURIComponent(parsed.pathname.split('/').pop() || 'slika');
  return storeBytes(bytes, safeFileName(nameFromUrl, kind), kind);
}
