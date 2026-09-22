/**
 * Meri kontrast boja landing tema po WCAG 2.1.
 *
 *   npm run check:contrast
 *
 * Postoji zato sto se kontrast NE VIDI pouzdano okom: siva na svetloj podlozi
 * deluje citljivo a ume da bude 3:1, sto je ispod praga.
 *
 * IZVESTAJ, NE KAPIJA — skripta ne obara build.
 * Teme su izricito ostavljene onakve kakve jesu, a merenje pokazuje da vise
 * njih pada. Da skripta tvrdi prolaz, jedini nacin da build prodje bio bi
 * menjanje bas tih boja. Zato broji i prijavljuje, a odluka ostaje coveku.
 *
 * Pragovi (WCAG 2.1 AA):
 *   4.5:1  obican tekst
 *   3.0:1  krupan tekst (>=24px, ili >=18.7px podebljano)
 *
 * Granica kartice se NE meri: WCAG 1.4.11 trazi 3:1 za granice UI KONTROLA -
 * dugme, polje - a kartica sa tekstom je sadrzaj, ne kontrola.
 */
import { LANDING_THEMES, type LandingTheme } from '../lib/landing';

/** Relativna luminanca po WCAG - nije prosek kanala nego gama-korigovan zbir. */
function luminanca(hex: string): number {
  const h = hex.replace('#', '');
  const pun = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const v = parseInt(pun, 16);
  const kanali = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((k) => {
    const s = k / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * kanali[0] + 0.7152 * kanali[1] + 0.0722 * kanali[2];
}

function odnos(a: string, b: string): number {
  const la = luminanca(a);
  const lb = luminanca(b);
  const [svetlija, tamnija] = la > lb ? [la, lb] : [lb, la];
  return (svetlija + 0.05) / (tamnija + 0.05);
}

function provereZaTemu(t: LandingTheme) {
  return [
    { opis: 'glavni tekst na podlozi', prednja: t.ink, pozadina: t.bg, prag: 4.5 },
    { opis: 'prigušeni tekst na podlozi', prednja: t.muted, pozadina: t.bg, prag: 4.5 },
    { opis: 'glavni tekst na kartici', prednja: t.ink, pozadina: t.surface, prag: 4.5 },
    { opis: 'prigušeni tekst na kartici', prednja: t.muted, pozadina: t.surface, prag: 4.5 },
    // Istaknuta fraza ({{ovako}}) je obican tekst u telu, ne krupan naslov.
    { opis: 'istaknuta fraza na podlozi', prednja: t.to, pozadina: t.bg, prag: 4.5 },
    { opis: 'istaknuta fraza na kartici', prednja: t.to, pozadina: t.surface, prag: 4.5 },
    // Pilula i dugme nose beo tekst preko gradijenta.
    { opis: 'beli tekst na početku gradijenta', prednja: '#ffffff', pozadina: t.from, prag: 4.5 },
    { opis: 'beli tekst na kraju gradijenta', prednja: '#ffffff', pozadina: t.to, prag: 4.5 },
  ];
}

let palo = 0;
let ukupno = 0;
const nalazi: string[] = [];

console.log('\n=== TEME LANDING STRANICE ===');
for (const tema of LANDING_THEMES) {
  const rezultati = provereZaTemu(tema).map((p) => ({ ...p, r: odnos(p.prednja, p.pozadina) }));
  const lose = rezultati.filter((x) => x.r < x.prag);
  ukupno += rezultati.length;
  palo += lose.length;
  if (lose.length) nalazi.push(`${tema.id} (${lose.length})`);

  console.log(`\n  ${tema.id.padEnd(10)} ${lose.length === 0 ? 'OK' : `ispod praga: ${lose.length}`}`);
  for (const x of rezultati) {
    const oznaka = x.r < x.prag ? 'PADA' : '    ';
    console.log(`    ${oznaka} ${x.r.toFixed(2).padStart(5)}:1  (prag ${x.prag})  ${x.opis}`);
  }
}

console.log(`\nukupno provera: ${ukupno}, ispod praga: ${palo}`);
if (nalazi.length) {
  console.log(`NALAZ (teme se namerno ne menjaju): ${nalazi.join(', ')}`);
  console.log('Najčešće pada prigušeni tekst i istaknuta fraza. Prag za običan tekst je 4.5:1.');
} else {
  console.log('OK: sve teme prolaze WCAG 2.1 AA.');
}
