/**
 * Pravila listanja galerije, odvojena od komponente da bi mogla da se provere
 * bez pregledaca (components/ProductGallery.tsx ih uvozi, isto i skripta
 * scripts/check-galerija.ts).
 */

/** Koliko slika stoji na ekranu pre nego sto se predje na sledecu. */
export const TRAJANJE_MS = 4500;

/**
 * GIF dobija duze vreme.
 *
 * Pravu duzinu petlje nije moguce procitati iz `<img>` - za to bi trebalo
 * raspakovati same okvire GIF-a. Zato svi GIF-ovi dobijaju isto, duze vreme:
 * bolje da kratka animacija odstoji malo duze nego da duza bude presecena.
 */
export const TRAJANJE_GIF_MS = 9000;

export function trajanjeZaSliku(url: string): number {
  return /\.gif(\?|#|$)/i.test(url) ? TRAJANJE_GIF_MS : TRAJANJE_MS;
}

export function sledeciIndeks(trenutni: number, ukupno: number): number {
  return ukupno > 0 ? (trenutni + 1) % ukupno : 0;
}

/**
 * Jedno mesto koje odlucuje da li listanje uopste radi.
 *
 * Svako "ne" ovde je jedno pravilo iz zahteva; drzi ih se na okupu da se ne
 * izgube po komponenti.
 */
export interface StanjeListanja {
  brojSlika: number;
  rucnoIzabrano: boolean;
  misIznad: boolean;
  karticaSakrivena: boolean;
  manjePokreta: boolean;
  uvecanPrikaz: boolean;
}

export function listanjeRadi(s: StanjeListanja): boolean {
  if (s.brojSlika < 2) return false;
  if (s.rucnoIzabrano) return false;
  if (s.misIznad) return false;
  if (s.karticaSakrivena) return false;
  if (s.manjePokreta) return false;
  if (s.uvecanPrikaz) return false;
  return true;
}
