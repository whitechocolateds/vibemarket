import { slugify } from './slugify';

/**
 * Sifra artikla (SKU).
 *
 * Oblik: VM-TRA-001  =  prefiks prodavnice, tri slova iz naziva, redni broj
 * unutar TE grupe slova. Citljivo naglas i kratko za pisanje na paket.
 *
 * Generise se JEDNOM i cuva na proizvodu. Namerno se NE izvodi iz naziva u
 * trenutku prikaza: sifra mora da ostane ista i kad se proizvod preimenuje,
 * inace se raspada svaka porudzbina i papir koji je vec odstampan.
 */

const PREFIKS = 'VM';

/** Naslovi imaju emodzije i dijakritike; slugify ostavlja samo [a-z0-9-]. */
function slovaIzNaziva(title: string): string {
  const cist = slugify(title).replace(/[^a-z]/g, '');
  return (cist.slice(0, 3) || 'pro').toUpperCase().padEnd(3, 'X');
}

/**
 * Prva slobodna sifra za dati naziv.
 * `zauzete` sadrzi sve postojece sifre - broj se povecava dok se ne nadje rupa.
 */
export function generateSku(title: string, zauzete: Set<string>): string {
  const slova = slovaIzNaziva(title);
  for (let n = 1; n < 1000; n++) {
    const sku = `${PREFIKS}-${slova}-${String(n).padStart(3, '0')}`;
    if (!zauzete.has(sku)) return sku;
  }
  // Prakticno nedostizno (999 proizvoda sa istim pocetnim slovima), ali bolje
  // jedinstvena ruzna sifra nego duplikat ili beskonacna petlja.
  return `${PREFIKS}-${slova}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Dopisuje sifre proizvodima koji je nemaju. Menja niz na mestu i vraca koliko
 * ih je dobilo novu - pozivalac po tome zna da li uopste treba da upisuje.
 */
export function ensureSkus(products: { title: string; sku?: string }[]): number {
  const zauzete = new Set(products.map((p) => p.sku).filter((s): s is string => Boolean(s)));
  let dodato = 0;

  for (const p of products) {
    if (p.sku) continue;
    p.sku = generateSku(p.title, zauzete);
    zauzete.add(p.sku);
    dodato++;
  }

  return dodato;
}
