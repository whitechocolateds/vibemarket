/**
 * Putanja pod kojom slika zavrsava u Blob store-u.
 *
 * Stoji u ZASEBNOM fajlu jer je trebaju obe strane: pretrazivac je gradi
 * (components/admin/ImageUploader.tsx), server je proverava pre nego sto izda
 * dozvolu (app/api/admin/upload/client/route.ts). lib/mediaStore.ts za to ne
 * moze da posluzi - koristi `fs` i ne sme u klijentski paket.
 *
 * Da su gradjenje i provera na dva mesta, razisli bi se i otpremanje bi palo uz
 * poruku "nedozvoljena putanja" koju niko ne bi umeo da objasni.
 */

export const BLOB_MEDIA_PREFIX = 'products';

/** Nastavak se izvodi iz tipa, ne iz imena fajla koje korisnik moze da izmeni. */
export const NASTAVAK_PO_TIPU: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  // Kratke petlje: GIF od nekoliko megabajta kao mp4 ispadne 20 puta manji.
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/** Da li se tip prikazuje kroz <video>, a ne kroz <img>. */
export function jeVideo(urlIliTip: string): boolean {
  return /(^video\/)|(\.(mp4|webm)(\?|$))/i.test(urlIliTip);
}

export const DOZVOLJENI_TIPOVI = Object.keys(NASTAVAK_PO_TIPU);

/**
 * Samo ovi znakovi smeju u putanju. Uzak skup je namerno: putanju predlaze
 * pretrazivac, pa sve sto lici na izlazak iz direktorijuma mora da otpadne.
 */
const PUTANJA = new RegExp(`^${BLOB_MEDIA_PREFIX}/[A-Za-z0-9._-]{1,120}$`);

export function jeUploadPutanja(p: string): boolean {
  return PUTANJA.test(p);
}

/** Naziv -> slug bez dijakritike i bez ijednog znaka van [a-z0-9-]. */
function slug(ime: string): string {
  return (
    ime
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'slika'
  );
}

export function uploadPutanja(ime: string, mime: string): string {
  const nastavak = NASTAVAK_PO_TIPU[mime] ?? 'jpg';
  const osnova = ime.replace(/\.[^.]*$/, '');
  const nasumicno = Math.random().toString(36).slice(2, 8);
  return `${BLOB_MEDIA_PREFIX}/${Date.now()}-${nasumicno}-${slug(osnova)}.${nastavak}`;
}
