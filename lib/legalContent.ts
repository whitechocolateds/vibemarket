/**
 * Tekst pravnih stranica (isporuka, reklamacije, uslovi korišćenja).
 *
 * Drži se na jednom mestu, a ne raspisan po `page.tsx` fajlovima, da bi izmena
 * kontakta ili roka isporuke bila jedna izmena umesto tri. Iste vrednosti koje
 * prodavnica stvarno koristi (`lib/shipping.ts`) uvoze se odavde, pa dokument i
 * naplata ne mogu da se raziđu.
 */

import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from './shipping';

export const KONTAKT = {
  email: 'vibemarketpodrska@gmail.com',
  telefon: '+381 61 2144 6605',
  /** Bez razmaka i crtica - za `tel:` vezu. */
  telefonHref: '+3816121446605',
} as const;

export const AZURIRANO = '3. septembar 2026.';

const rsd = (n: number) => `${n.toLocaleString('sr-RS')} RSD`;

/** Jedan blok teksta na stranici. */
export type LegalBlok =
  | { vrsta: 'p'; tekst: string }
  | { vrsta: 'h2'; tekst: string }
  | { vrsta: 'ul'; stavke: string[] }
  | { vrsta: 'ol'; stavke: string[] }
  | { vrsta: 'kontakt' };

export interface LegalStranica {
  naslov: string;
  uvod: string;
  blokovi: LegalBlok[];
}

export const ISPORUKA: LegalStranica = {
  naslov: 'Isporuka i dostava',
  uvod:
    'Ova stranica objašnjava kako se odvija isporuka porudžbina naručenih u internet ' +
    'prodavnici VibeMarket. Molimo Vas da je pažljivo pročitate pre nego što uputite porudžbinu.',
  blokovi: [
    { vrsta: 'h2', tekst: 'Područje isporuke' },
    {
      vrsta: 'p',
      tekst:
        'Isporuku vršimo na celoj teritoriji Republike Srbije, posredstvom kurirske službe sa ' +
        'kojom sarađujemo. Isporuka izvan teritorije Republike Srbije trenutno nije moguća.',
    },

    { vrsta: 'h2', tekst: 'Rok isporuke' },
    {
      vrsta: 'p',
      tekst:
        'Porudžbinu možete uputiti popunjavanjem porudžbenice na sajtu ili telefonom. Paket ' +
        'predajemo kurirskoj službi istog ili narednog radnog dana od prijema porudžbine, osim ' +
        'ako se sa Vama ne dogovorimo drugačije.',
    },
    {
      vrsta: 'p',
      tekst:
        'Od dana predaje kuriru potrebno je 1–3 radna dana da paket stigne na navedenu adresu. ' +
        'U rok isporuke ne računaju se vikendi i dani državnih praznika.',
    },

    { vrsta: 'h2', tekst: 'Troškovi dostave i plaćanje' },
    {
      vrsta: 'p',
      tekst:
        'Plaćanje se vrši pouzećem, gotovinom kuriru prilikom preuzimanja paketa. Avansno ' +
        'plaćanje nije potrebno.',
    },
    {
      vrsta: 'ul',
      stavke: [
        `Trošak dostave iznosi ${rsd(SHIPPING_COST)}.`,
        `Za porudžbine u vrednosti preko ${rsd(FREE_SHIPPING_THRESHOLD)} dostava je besplatna.`,
      ],
    },
    {
      vrsta: 'p',
      tekst:
        'Kuriru se plaća cena proizvoda uvećana za trošak dostave, ukoliko dostava nije ' +
        'besplatna. Ukupan iznos za naplatu prikazan je pre potvrde porudžbine i naveden je u ' +
        'potvrdi koju dobijate.',
    },

    { vrsta: 'h2', tekst: 'Preuzimanje pošiljke' },
    {
      vrsta: 'p',
      tekst:
        'Kurirske službe isporučuju pošiljke od ponedeljka do subote, u periodu od 8 do 16 ' +
        'časova. Budući da kurir dolazi na adresu navedenu u porudžbini, potrebno je da se na ' +
        'toj adresi u tom periodu nalazi osoba koja može da preuzme paket — to ne mora biti ' +
        'lice koje je porudžbinu uputilo.',
    },
    {
      vrsta: 'p',
      tekst:
        'Ukoliko unapred znate da u navedenom periodu nećete biti na kućnoj adresi, prilikom ' +
        'poručivanja možete navesti adresu na kojoj radite ili drugu adresu na kojoj ste u ' +
        'prilici da preuzmete pošiljku.',
    },

    { vrsta: 'h2', tekst: 'Obaveštenja o isporuci' },
    {
      vrsta: 'p',
      tekst:
        'Na dan isporuke kurirska služba Vas obaveštava SMS porukom da tog dana možete očekivati ' +
        'paket, pod uslovom da ste ostavili broj mobilnog telefona. Kurir Vas po pravilu poziva ' +
        'i pre dolaska na adresu.',
    },
    {
      vrsta: 'p',
      tekst:
        'Molimo Vas da imate u vidu da tačno vreme isporuke nije moguće zakazati, niti unapred ' +
        'odrediti koji će od 1–3 radna dana biti dan isporuke. Te okolnosti zavise od rasporeda ' +
        'kurirske službe i na njih ne možemo uticati.',
    },

    { vrsta: 'h2', tekst: 'Neuspela isporuka' },
    {
      vrsta: 'p',
      tekst:
        'Ukoliko se u trenutku dolaska kurira ne nalazite na adresi, a i dalje želite da primite ' +
        'pošiljku, moguć je dogovor o ponovnom dolasku istog ili narednog dana.',
    },
    {
      vrsta: 'p',
      tekst:
        'Kurir pokušava da uruči pošiljku dva puta. Ako ni tada niste dostupni na ostavljenom ' +
        'broju telefona ili se ne nalazite na navedenoj adresi, pošiljka se vraća nama. U tom ' +
        'slučaju kontaktiraćemo Vas radi dogovora o ponovnom slanju.',
    },

    { vrsta: 'h2', tekst: 'Kontakt' },
    { vrsta: 'p', tekst: 'Za sva pitanja u vezi sa isporukom stojimo Vam na raspolaganju:' },
    { vrsta: 'kontakt' },
  ],
};

export const REKLAMACIJE: LegalStranica = {
  naslov: 'Reklamacije i povraćaj robe',
  uvod:
    'Kao potrošač imate zakonom zajemčena prava koja VibeMarket u potpunosti poštuje. U ' +
    'nastavku su objašnjena dva odvojena prava: pravo na odustanak od kupovine i pravo na ' +
    'reklamaciju zbog nesaobraznosti robe.',
  blokovi: [
    { vrsta: 'h2', tekst: 'Odustanak od kupovine u roku od 14 dana' },
    {
      vrsta: 'p',
      tekst:
        'Kupovinom putem interneta imate pravo da u roku od 14 dana od dana prijema pošiljke ' +
        'odustanete od kupovine, bez navođenja razloga i bez dodatnih troškova, osim troškova ' +
        'vraćanja robe.',
    },
    { vrsta: 'p', tekst: 'Postupak je sledeći:' },
    {
      vrsta: 'ol',
      stavke: [
        `Obavestite nas o odustanku — telefonom na ${KONTAKT.telefon} ili e-poštom na ${KONTAKT.email}. Tom prilikom dogovaramo datum preuzimanja pošiljke.`,
        'Kurir dolazi na Vašu adresu u roku od 1–3 radna dana, osim ako se ne dogovorimo drugačije. Ukoliko Vam kurir sam ne izda potvrdu o preuzimanju pošiljke, imate pravo da je zatražite, kao i da odbijete predaju pošiljke ako potvrda ne može biti izdata.',
        'Kurir nam pošiljku vraća u roku od 1–3 radna dana.',
        'Po prijemu pošiljke i proveri stanja robe, u roku od 14 dana vraćamo Vam plaćeni iznos, umanjen za trošak dostave. Povraćaj sredstava vrši se isključivo uplatom na tekući račun, budući da je plaćanje izvršeno pouzećem.',
      ],
    },
    { vrsta: 'p', tekst: 'Uz robu je potrebno da vratite i račun koji ste dobili uz pošiljku.' },
    {
      vrsta: 'p',
      tekst:
        'Robu možete raspakovati i pregledati kako biste utvrdili njenu prirodu, svojstva i ' +
        'funkcionalnost — jednako kao što biste to učinili u prodavnici. Odgovorni ste, ' +
        'međutim, za umanjenu vrednost robe koja nastane rukovanjem preko onoga što je ' +
        'neophodno za tu proveru. Molimo Vas da originalnu ambalažu sačuvate i vratite zajedno ' +
        'sa proizvodom.',
    },

    { vrsta: 'h2', tekst: 'Reklamacija zbog nesaobraznosti' },
    {
      vrsta: 'p',
      tekst:
        'Ukoliko ste dobili proizvod koji je oštećen ili ne funkcioniše ispravno, molimo Vas da ' +
        'nas o tome obavestite odmah po otvaranju pošiljke.',
    },
    { vrsta: 'p', tekst: 'Postupak reklamacije je sledeći:' },
    {
      vrsta: 'ol',
      stavke: [
        `Obavestite nas o nesaobraznosti — telefonom na ${KONTAKT.telefon} ili e-poštom na ${KONTAKT.email}. Tom prilikom dogovaramo datum preuzimanja pošiljke.`,
        'Kurir dolazi na Vašu adresu u roku od 1–3 radna dana, osim ako se ne dogovorimo drugačije. Ukoliko Vam kurir sam ne izda potvrdu o preuzimanju pošiljke, imate pravo da je zatražite, kao i da odbijete predaju pošiljke ako potvrda ne može biti izdata.',
        'Kurir nam pošiljku vraća u roku od 1–3 radna dana.',
        'Odgovor na izjavljenu reklamaciju dostavljamo Vam u roku od 8 dana od dana prijema reklamacije. Ukoliko je reklamacija osnovana, rešavamo je u roku od 15 dana od dana prijema reklamacije.',
      ],
    },
    {
      vrsta: 'p',
      tekst:
        'Umesto povraćaja sredstava možete izabrati zamenu neispravnog proizvoda za isti ' +
        'ispravan ili za drugi proizvod. Ukoliko je zamenski proizvod skuplji od prvobitno ' +
        'poručenog, doplaćujete razliku; ukoliko je jeftiniji, razliku Vam vraćamo uplatom na ' +
        'tekući račun.',
    },
    { vrsta: 'p', tekst: 'Kod reklamacije izjavljene e-poštom potrebno je da dostavite sledeće podatke:' },
    {
      vrsta: 'ol',
      stavke: [
        'ime i prezime kupca;',
        'datum poručivanja;',
        'naziv poručenog proizvoda;',
        'razlog reklamacije, po mogućstvu uz fotografiju.',
      ],
    },

    { vrsta: 'h2', tekst: 'Rok odgovornosti za nesaobraznost' },
    {
      vrsta: 'p',
      tekst:
        'Za nesaobraznost robe odgovaramo u roku od dve godine od dana prelaska rizika na ' +
        'potrošača, u skladu sa Zakonom o zaštiti potrošača. Ukoliko se nesaobraznost pojavi u ' +
        'prvih šest meseci, pretpostavlja se da je postojala u trenutku isporuke, pa teret ' +
        'dokazivanja suprotnog snosimo mi kao prodavac.',
    },
    {
      vrsta: 'p',
      tekst:
        'Pravo na reklamaciju ne obuhvata oštećenja i neispravnosti nastale nenamenskom ' +
        'upotrebom, nepravilnim rukovanjem ili mehaničkim oštećenjem proizvoda nakon preuzimanja.',
    },

    { vrsta: 'h2', tekst: 'Kontakt za reklamacije' },
    { vrsta: 'kontakt' },
    {
      vrsta: 'p',
      tekst:
        'Robu ne šaljete sami — nakon Vaše prijave organizujemo preuzimanje pošiljke kurirskom ' +
        'službom na Vašoj adresi.',
    },
  ],
};

export const USLOVI: LegalStranica = {
  naslov: 'Uslovi korišćenja',
  uvod:
    'Korišćenjem bilo kog dela internet prodavnice VibeMarket potvrđujete da ste upoznati sa ' +
    'ovim uslovima korišćenja i da ih u celosti prihvatate. Ukoliko se sa njima ne slažete, ' +
    'molimo Vas da sajt ne koristite.',
  blokovi: [
    { vrsta: 'h2', tekst: 'Kontakt' },
    {
      vrsta: 'p',
      tekst:
        'Za sva pitanja u vezi sa porudžbinom, isporukom ili reklamacijom možete nam se obratiti:',
    },
    { vrsta: 'kontakt' },

    { vrsta: 'h2', tekst: 'Dozvoljeno korišćenje' },
    {
      vrsta: 'p',
      tekst:
        'Nijedan deo sajta ne sme se koristiti u nezakonite svrhe, niti radi njihovog ' +
        'promovisanja. Govor mržnje, uvrede, vulgarni sadržaj i diskriminacija po bilo kom ' +
        'osnovu — rasnom, nacionalnom, verskom, polnom ili drugom — predstavljaju kršenje ovih ' +
        'uslova.',
    },
    {
      vrsta: 'p',
      tekst:
        'Posetiocima je korišćenje sajta besplatno, ukoliko nije izričito drugačije navedeno i ' +
        'ukoliko se pridržavaju ovih uslova.',
    },

    { vrsta: 'h2', tekst: 'Podaci koje ostavljate prilikom poručivanja' },
    {
      vrsta: 'p',
      tekst:
        'Za kupovinu nije potrebna registracija niti otvaranje korisničkog naloga. Prilikom ' +
        'poručivanja ostavljate samo podatke neophodne za isporuku i kontakt.',
    },
    {
      vrsta: 'p',
      tekst:
        'Odgovorni ste za tačnost podataka koje unosite. Netačna adresa ili broj telefona ' +
        'najčešći su razlog neuspele isporuke, zbog čega Vas molimo da ih pre potvrde ' +
        'porudžbine proverite.',
    },
    {
      vrsta: 'p',
      tekst:
        `Ukoliko se prijavite na našu listu obaveštenja, prijavu možete otkazati u svakom ` +
        `trenutku, putem veze u samoj poruci ili obaveštenjem na ${KONTAKT.email}.`,
    },

    { vrsta: 'h2', tekst: 'Privatnost' },
    {
      vrsta: 'p',
      tekst:
        'Poštujemo privatnost korisnika ovog sajta. Podatke koje ostavite koristimo isključivo ' +
        'radi obrade i isporuke porudžbine i ne ustupamo ih trećim licima, osim kurirskoj ' +
        'službi u meri neophodnoj za isporuku.',
    },
    {
      vrsta: 'p',
      tekst:
        'Lične podatke možemo otkriti ukoliko to od nas bude zahtevano na osnovu zakona, ' +
        'odlukom nadležnog suda ili zahtevom drugog nadležnog organa.',
    },

    { vrsta: 'h2', tekst: 'Cene i dostupnost proizvoda' },
    {
      vrsta: 'p',
      tekst:
        'Sve cene istaknute su u dinarima (RSD) i sadrže sve uračunate poreze. Cena koja važi ' +
        'za Vašu porudžbinu jeste cena istaknuta u trenutku potvrde porudžbine.',
    },
    {
      vrsta: 'p',
      tekst:
        'Zadržavamo pravo izmene cena i asortimana bez prethodne najave. Ukoliko poručeni ' +
        'proizvod nije dostupan, o tome ćemo Vas obavestiti u najkraćem roku i ponuditi zamenu ' +
        'ili otkazivanje porudžbine.',
    },

    { vrsta: 'h2', tekst: 'Intelektualna svojina' },
    {
      vrsta: 'p',
      tekst:
        'Sadržaj sajta — tekstovi, fotografije, logotip i drugi materijali — zaštićen je ' +
        'pravima intelektualne svojine. Preuzimanje i objavljivanje sadržaja u komercijalne ' +
        'svrhe bez naše prethodne saglasnosti nije dozvoljeno.',
    },

    { vrsta: 'h2', tekst: 'Odricanje od odgovornosti' },
    {
      vrsta: 'p',
      tekst:
        'Sadržaj i usluge na sajtu pružamo u dobroj veri i sa dužnom pažnjom. Sajt koristite na ' +
        'sopstvenu odgovornost i ne odgovaramo za posrednu ili posledičnu štetu nastalu ' +
        'njegovim korišćenjem.',
    },
    {
      vrsta: 'p',
      tekst:
        'Iako sajt redovno održavamo, ne možemo jemčiti da će u svakom trenutku raditi bez ' +
        'prekida i grešaka. Ovo odricanje ni na koji način ne isključuje niti ograničava prava ' +
        'koja Vam kao potrošaču pripadaju po sili zakona.',
    },

    { vrsta: 'h2', tekst: 'Izmene uslova' },
    {
      vrsta: 'p',
      tekst:
        'Zadržavamo pravo izmene sadržaja sajta, uključujući i ovu stranicu, bez prethodne ' +
        'najave. Izmenjeni uslovi važe od trenutka objavljivanja na sajtu. Na već potvrđene ' +
        'porudžbine primenjuju se uslovi koji su važili u trenutku poručivanja.',
    },

    { vrsta: 'h2', tekst: 'Rešavanje sporova' },
    {
      vrsta: 'p',
      tekst:
        'Na sve odnose nastale korišćenjem ovog sajta i na tumačenje ovih uslova primenjuju se ' +
        'propisi Republike Srbije, a za rešavanje sporova nadležan je stvarno nadležni sud u ' +
        'Republici Srbiji.',
    },
    {
      vrsta: 'p',
      tekst:
        'Eventualne nesporazume nastojaćemo da rešimo sporazumno. Kao potrošač imate i pravo da ' +
        'pokrenete postupak vansudskog rešavanja spora pred telom sa liste koju vodi ' +
        'ministarstvo nadležno za zaštitu potrošača.',
    },
  ],
};
