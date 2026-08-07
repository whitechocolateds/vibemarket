import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { isBlobStorageEnabled } from './blobStore';
import { slugify } from './slugify';

/**
 * Čuvanje slika proizvoda. Prati isto grananje kao lib/db.ts:
 * Vercel Blob kad je konfigurisan, inače lokalni public/uploads/.
 *
 * NAPOMENA: ne koristi blobCommandOptions() iz blobStore.ts - ono hardkoduje
 * access: 'private', pa bi <img> na tu putanju vraćao 403. Slike moraju biti javne.
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const BLOB_MEDIA_PREFIX = 'products';

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
  if (!isBlobStorageEnabled() && process.env.VERCEL === '1') {
    throw new Error(
      'Otpremanje slika na Vercelu zahteva Blob storage. Poveži Blob store ili postavi BLOB_READ_WRITE_TOKEN.'
    );
  }
}

async function storeBytes(bytes: Uint8Array, name: string, kind: ImageKind): Promise<StoredMedia> {
  assertWritable();
  const contentType = MIME_BY_KIND[kind];

  if (isBlobStorageEnabled()) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const storeId = process.env.BLOB_STORE_ID;
    const pathname = `${BLOB_MEDIA_PREFIX}/${name}`;

    const result = await put(pathname, Buffer.from(bytes), {
      access: 'public',
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: 31_536_000,
      ...(token ? { token } : {}),
      ...(storeId ? { storeId } : {}),
    });

    return { url: result.url, pathname: result.pathname, size: bytes.byteLength, contentType };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return { url: `/uploads/${name}`, pathname: name, size: bytes.byteLength, contentType };
}

export class MediaError extends Error {}

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
