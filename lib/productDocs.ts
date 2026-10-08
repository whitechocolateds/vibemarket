/**
 * PDF vodiči koji idu uz JEDAN konkretan proizvod — traku za vežbanje sa šipkom.
 *
 * Namerno NIJE opšta funkcija: nema polja na `Product`, nema admin forme, nema
 * uvoza. Da bi drugi proizvod dobio svoje vodiče, treba svesno dopisati unos
 * ovde i otpremiti fajlove — a tada verovatno i preispitati da li je vreme za
 * pravo polje na proizvodu.
 *
 * Fajlovi stoje u `public/docs/`, pa ih servira CDN kao statiku, bez poziva
 * funkcije. Zato su linkovi istog porekla i atribut `download` na <a> radi —
 * kod fajla sa drugog domena ga pregledač ignoriše i samo otvori PDF.
 *
 * PREUZIMANJE JE JAVNO. Ranije je stajalo samo na stranici potvrde porudžbine,
 * dakle iza broja porudžbine. Sada stoji i na landing stranici, dostupno svakome
 * bez kupovine i bez prijave — vodič koji pokazuje vrednost pre kupovine vredi
 * više otvoren nego zaključan. Blok na potvrdi porudžbine ostaje kakav je bio.
 */

/** Handle proizvoda uz koji ovi vodiči idu. */
export const DOCS_PRODUCT_HANDLE = 'prenosivi-pilates-studio-sf-18';

export interface ProductDoc {
  naslov: string;
  opis: string;
  href: string;
  /** Prikazuje se uz naslov, da kupac zna šta preuzima pre nego što klikne. */
  meta: string;
  /** Ime iz LANDING_IKONE; stoji ovde, uz ostale podatke, a ne u komponenti. */
  ikona: string;
}

export const PRODUCT_DOCS: ProductDoc[] = [
  {
    naslov: 'Plan ishrane za 4 nedelje',
    opis: 'Nedeljni raspored obroka, obroci oko treninga, lista za kupovinu i tabela za praćenje navika.',
    href: '/docs/vibemarket-plan-ishrane-4-nedelje.pdf',
    meta: 'PDF · 4 strane',
    ikona: 'leaf',
  },
  {
    naslov: 'Plan vežbi sa šipkom',
    opis: 'Dvanaest vežbi u dva nivoa, sa opisom izvođenja, brojem serija i nedeljnim rasporedom.',
    href: '/docs/vibemarket-plan-vezbi-sa-sipkom.pdf',
    meta: 'PDF · 8 strana',
    ikona: 'dumbbell',
  },
];
