import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from '@vercel/blob';

const BLOB_PREFIX = 'store';

function blobPathname(filename: string): string {
  return `${BLOB_PREFIX}/${filename}`;
}

function blobCommandOptions() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const storeId = process.env.BLOB_STORE_ID;

  return {
    access: 'private' as const,
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
  };
}

export function isBlobStorageEnabled(): boolean {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token?.startsWith('vercel_blob_rw_')) return true;
  if (process.env.BLOB_STORE_ID?.startsWith('store_')) return true;
  return false;
}

/**
 * Ishod citanja mora da razlikuje TRI stanja, ne dva:
 *   'ok'      - procitano
 *   'missing' - objekat ne postoji (prvi put)
 *   'error'   - citanje nije uspelo
 *
 * Ranije se sve svodilo na `null`, pa je pozivalac prolaznu gresku citanja
 * tumacio kao "prodavnica je prazna" i upisivao demo podatke PREKO pravog
 * kataloga. Zato razlika mora da postoji na nivou tipa.
 */
export type BlobRead<T> =
  | { status: 'ok'; data: T; etag: string }
  | { status: 'missing' }
  | { status: 'error'; error: unknown };

/**
 * If-Match poredi ETag-ove STROGO, pa slab ETag (`W/"..."`) uvek ispadne kao
 * neslaganje. Vecim objektima Blob ume da vrati bas slab oblik - izmereno na
 * products.json - pa uslovan upis padne iako se nista nije promenilo.
 */
/**
 * Vercel Blob NE postavlja `name` na svoje greske - izmereno: `error.name` je
 * obicno 'Error', a pravu vrstu nosi klasa. Sve provere pisane kao
 * /NotFound/.test(error.name) su zato tiho promasivale, pa je "nema ga" prolazilo
 * kao obicna greska i obrnuto.
 */
function isNotFound(error: unknown): boolean {
  if (error instanceof BlobNotFoundError) return true;
  const e = error as { constructor?: { name?: string }; message?: string } | null;
  return (
    e?.constructor?.name === 'BlobNotFoundError' ||
    /does not exist|not found/i.test(e?.message ?? '')
  );
}

function isPreconditionFailure(error: unknown): boolean {
  if (error instanceof BlobPreconditionFailedError) return true;
  const e = error as { constructor?: { name?: string }; message?: string } | null;
  return (
    e?.constructor?.name === 'BlobPreconditionFailedError' ||
    /precondition failed/i.test(e?.message ?? '')
  );
}

function strongEtag(etag: string | undefined): string {
  return (etag ?? '').replace(/^W\//, '');
}

/**
 * Citanje vraca telo TEK kad se dokaze da telo i ETag opisuju istu verziju.
 *
 * Izmereno na objektu od 140 KB, u petlji upisi-pa-procitaj: `head()` je uvek
 * svez, ali sadrzaj iz `get()` kasni za njim. Kombinacija je podmukla - ETag iz
 * `head()` je jedini koji If-Match priznaje (6/6 naspram 0/6 sa ETag-om iz
 * `get()`), ali NE opisuje nuzno telo koje je stiglo. Upis sa takvim parom
 * prolazi i tiho gubi tudju izmenu: izmereno, od 12 izmena prezivela je jedna.
 *
 * Ono sto to cini uhvatljivim: `get()` uz telo vraca hes BAS tog tela. Ako se ne
 * poklopi sa ETag-om iz `head()`, telo je starija verzija - citanje se tada
 * ponavlja umesto da se na njemu gradi upis.
 */
async function readOnce<T>(pathname: string): Promise<BlobRead<T>> {
  const meta = await head(pathname, blobCommandOptions());
  const etag = strongEtag(meta.etag);

  // Verzija u upitu: URL se menja sa sadrzajem, pa kes ne moze da posluzi stariju
  const result = await get(`${meta.url}?v=${etag.replace(/"/g, '')}`, blobCommandOptions());

  if (!result) return { status: 'error', error: new Error('get() je vratio null iako head() vidi objekat') };
  if (result.statusCode !== 200 || !result.stream) {
    return { status: 'error', error: new Error(`neocekivan statusCode ${result.statusCode}`) };
  }

  const text = await new Response(result.stream).text();

  // Jedina provera koja stvarno drzi: opisuju li telo i ETag istu verziju
  const bodyEtag = strongEtag(result.blob.etag);
  if (bodyEtag !== etag) {
    return {
      status: 'error',
      error: new BlobTransientError(`telo je zastarelo: telo=${bodyEtag} skladiste=${etag}`),
    };
  }

  return { status: 'ok', data: JSON.parse(text) as T, etag };
}

/**
 * Budzet ponavljanja je nateran merenjem, ne procenom.
 *
 * Posle upisa telo iz `get()` kasni za `head()`-om: izmereno na 10 upisa objekta
 * od 140 KB - medijana 344 ms, maksimum 985 ms. Cekanja idu 500/1000/1500/2000/2500 ms,
 * dakle do 7,5 s ukupno, sto je sa dosta zazora iznad izmerenog maksimuma.
 */
const READ_RETRIES = 6;
const RETRY_MS = 500;

/**
 * "Nema ga" se tvrdi SAMO kad to kaze `head()`.
 *
 * Bas je prolazna greska citanja pravila stetu: ispala bi kao 'missing', pozivalac
 * bi to procitao kao "prodavnica je prazna" i upisao demo katalog preko pravog.
 */
export async function readJsonBlob<T>(filename: string): Promise<BlobRead<T>> {
  const pathname = blobPathname(filename);
  let lastError: unknown = new Error('citanje nije uspelo');

  for (let attempt = 0; attempt < READ_RETRIES; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_MS * attempt));

    try {
      const res = await readOnce<T>(pathname);
      if (res.status === 'ok') return res;
      lastError = res.status === 'error' ? res.error : lastError;
    } catch (error) {
      if (isNotFound(error)) return { status: 'missing' };
      lastError = error;
    }
  }

  return {
    status: 'error',
    error: isTransientBlobError(lastError)
      ? lastError
      : new BlobTransientError(
          lastError instanceof Error ? lastError.message : 'citanje nije uspelo',
          lastError
        ),
  };
}

/** Zadrzano zbog postojecih poziva; gubi razliku izmedju 'missing' i 'error'. */
export async function readJsonFromBlob<T>(filename: string): Promise<T | null> {
  const res = await readJsonBlob<T>(filename);
  if (res.status === 'ok') return res.data;
  if (res.status === 'error') console.error(`Blob read failed for ${filename}:`, res.error);
  return null;
}

export interface WriteOptions {
  /**
   * Upis prolazi samo ako se objekat nije promenio od ovog etag-a.
   * Sprecava da paralelni upis tiho pregazi tudje izmene.
   */
  ifMatch?: string;
}

/**
 * Greska koja ce verovatno proci ako se pokusa ponovo.
 *
 * Postoji da bi se prolazno stanje skladista razlikovalo od prave greske.
 * Bez te razlike pozivalac ima samo dva losa izbora: da odustane na svaku
 * sitnicu, ili da uporno ponavlja i ono sto nikada nece proci.
 */
export class BlobTransientError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'BlobTransientError';
    if (cause !== undefined) this.cause = cause;
  }
}

export class BlobConflictError extends BlobTransientError {
  constructor() {
    super('Neko drugi je u medjuvremenu izmenio podatke.');
    this.name = 'BlobConflictError';
  }
}

/** Prepoznaje prolaznu gresku i kada je umotana u drugu (kroz `cause`). */
export function isTransientBlobError(error: unknown): boolean {
  for (let e = error, depth = 0; e && depth < 5; depth++) {
    if (e instanceof BlobTransientError) return true;
    e = (e as { cause?: unknown })?.cause;
  }
  return false;
}

export async function writeJsonToBlob<T>(
  filename: string,
  data: T,
  options: WriteOptions = {}
): Promise<void> {
  try {
    await put(blobPathname(filename), JSON.stringify(data, null, 2), {
      ...blobCommandOptions(),
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      // 0, ne 60: ovo su promenljivi podaci (katalog, porudzbine), a ne sadrzaj.
      // Sa kesom od 60 s uvoz u serijama cita ZASTAREO katalog, dopisuje na njega
      // i upisuje nazad - prethodna serija tako nestane, a sve deluje uspesno.
      cacheControlMaxAge: 0,
      ...(options.ifMatch ? { ifMatch: options.ifMatch } : {}),
    });
  } catch (error) {
    if (isPreconditionFailure(error)) throw new BlobConflictError();
    throw error;
  }
}

const UPDATE_RETRIES = 5;

/**
 * Procitaj -> izmeni -> uslovno upisi, uz ponavljanje na sudar.
 *
 * Ovo je JEDINI ispravan nacin da se menja deljeni JSON u Blob-u. Golo
 * "procitaj pa upisi" gubi podatke na dva nacina: paralelan zahtev upise izmedju
 * ta dva koraka, ili rubni kes posluzi zastarelu kopiju pa se na nju dopisuje.
 *
 * Uslovan upis oba slucaja pretvara u sudar umesto u tihi gubitak, a ponavljanje
 * ga resava - sledece citanje vidi noviju verziju jer se URL menja sa sadrzajem.
 */
export async function updateJsonBlob<T>(
  filename: string,
  mutate: (current: T | null) => T | null
): Promise<T | null> {
  let lastConflict: unknown = null;

  for (let attempt = 0; attempt < UPDATE_RETRIES; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_MS * attempt));

    const res = await readJsonBlob<T>(filename);
    if (res.status === 'error') {
      // Prolazno citanje je isto sto i sudar - ima smisla pokusati ponovo.
      // Ranije je prvo zastarelo telo odmah izbijalo do pozivaoca i obaralo
      // ceo posao, iako se stanje sleze za manje od sekunde.
      if (!isTransientBlobError(res.error) || attempt === UPDATE_RETRIES - 1) throw res.error;
      lastConflict = res.error;
      continue;
    }

    const current = res.status === 'ok' ? res.data : null;
    const next = mutate(current);
    if (next === null) return current;

    try {
      await writeJsonToBlob(filename, next, res.status === 'ok' && res.etag ? { ifMatch: res.etag } : {});
      return next;
    } catch (error) {
      if (!(error instanceof BlobConflictError)) throw error;
      lastConflict = error;
    }
  }

  throw lastConflict instanceof Error
    ? lastConflict
    : new Error('Upis nije uspeo ni posle vise pokusaja.');
}
