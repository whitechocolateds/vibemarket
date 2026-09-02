import { promises as fs } from 'fs';
import path from 'path';
import {
  isBlobStorageEnabled, readJsonBlob, updateJsonBlob, writeJsonToBlob, type BlobRead,
} from './blobStore';

const DATA_DIR = path.join(process.cwd(), 'data');

export async function ensureDataDir() {
  if (isBlobStorageEnabled()) return;
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/**
 * Citanje razlikuje "nema fajla" od "citanje nije uspelo".
 *
 * Ta razlika je nosiva: pozivalac koji je gresku tumacio kao praznu prodavnicu
 * upisivao je demo podatke PREKO pravog kataloga.
 */
export async function readJsonFileResult<T>(filename: string): Promise<BlobRead<T>> {
  if (isBlobStorageEnabled()) return readJsonBlob<T>(filename);

  await ensureDataDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    return { status: 'ok', data: JSON.parse(raw) as T, etag: '' };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return { status: 'missing' };
    return { status: 'error', error };
  }
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const res = await readJsonFileResult<T>(filename);
  if (res.status === 'ok') return res.data;
  if (res.status === 'error') console.error(`Citanje ${filename} nije uspelo:`, res.error);
  return fallback;
}

export async function writeJsonFile<T>(
  filename: string,
  data: T,
  options: { ifMatch?: string } = {}
): Promise<void> {
  if (isBlobStorageEnabled()) {
    await writeJsonToBlob(filename, data, options);
    return;
  }

  if (process.env.VERCEL === '1') {
    throw new Error(
      `Nije moguce upisati ${filename}: na Vercelu je fajl sistem samo za citanje. ` +
        'Ukljuci Vercel Blob: Vercel -> projekat -> Storage -> Create Database -> Blob -> ' +
        'Connect Project (sve tri sredine), pa uradi novi deploy. ' +
        'Bez toga ne rade ni uvoz proizvoda ni cuvanje porudzbina. ' +
        'Lokalna provera: npm run blob:check'
    );
  }

  await ensureDataDir();
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Izmena postojeceg fajla kao JEDNA celina: procitaj, izmeni, upisi.
 *
 * Postoji da pozivaoci ne bi rucno spajali citanje i upis - bas na tom sastavu
 * su se gubili podaci. Na Blob-u ide kroz uslovan upis sa ponavljanjem na sudar;
 * lokalno je fajl sistem sam po sebi dovoljan.
 *
 * `mutate` vraca `null` kad nema sta da se menja - tada se NE upisuje nista.
 */
export async function updateJsonFile<T>(
  filename: string,
  mutate: (current: T | null) => T | null
): Promise<T | null> {
  if (isBlobStorageEnabled()) return updateJsonBlob<T>(filename, mutate);

  const res = await readJsonFileResult<T>(filename);
  if (res.status === 'error') throw res.error;

  const next = mutate(res.status === 'ok' ? res.data : null);
  if (next === null) return res.status === 'ok' ? res.data : null;

  await writeJsonFile(filename, next);
  return next;
}
