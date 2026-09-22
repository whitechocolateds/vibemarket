/**
 * Meri kontrast boja svih landing tema po WCAG 2.1.
 *
 *   npm run check:contrast
 *
 * Postoji zato sto se kontrast NE VIDI pouzdano okom: siva na svetloj podlozi
 * deluje citljivo a ume da bude 3:1, sto je ispod praga. Ovde se racuna.
 *
 * Pragovi (WCAG 2.1 AA):
 *   4.5:1  obican tekst
 *   3.0:1  krupan tekst (>=24px, ili >=18.7px podebljano) i granice komponenti
 */
import assert from 'assert';
import { LANDING_THEMES, KONVERZIJA_THEMES, type LandingTheme } from '../lib/landing';

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

interface Provera {
  opis: string;
  prednja: string;
  pozadina: string;
  prag: number;
}

function provereZaTemu(t: LandingTheme): Provera[] {
  const cta = t.cta ?? t.to;
  const onCta = t.onCta ?? '#ffffff';
  const onGradient = t.onGradient ?? '#ffffff';
  return [
    { opis: 'glavni tekst na podlozi', prednja: t.ink, pozadina: t.bg, prag: 4.5 },
    { opis: 'prigušeni tekst na podlozi', prednja: t.muted, pozadina: t.bg, prag: 4.5 },
    { opis: 'glavni tekst na kartici', prednja: t.ink, pozadina: t.surface, prag: 4.5 },
    { opis: 'prigušeni tekst na kartici', prednja: t.muted, pozadina: t.surface, prag: 4.5 },
    // Istaknuta fraza ({{ovako}}) je obican tekst u telu, ne krupan naslov.
    { opis: 'istaknuta fraza na podlozi', prednja: t.to, pozadina: t.bg, prag: 4.5 },
    { opis: 'istaknuta fraza na kartici', prednja: t.to, pozadina: t.surface, prag: 4.5 },
    // Natpis na dugmetu: 0.95rem podebljano = 15px, dakle OBICAN tekst, prag 4.5.
    { opis: 'natpis na dugmetu za kupovinu', prednja: onCta, pozadina: cta, prag: 4.5 },
    // Pilula i ikone na gradijentu; boja teksta je po temi, ne uvek bela.
    { opis: 'tekst na početku gradijenta', prednja: onGradient, pozadina: t.from, prag: 4.5 },
    { opis: 'tekst na kraju gradijenta', prednja: onGradient, pozadina: t.to, prag: 4.5 },
  ];
}

/*
 * Granica kartice se NE meri.
 *
 * WCAG 1.4.11 trazi 3:1 za granice UI KOMPONENTI - dugme, polje, kontrola.
 * Kartica sa tekstom je sadrzaj, ne kontrola, pa taj prag na nju ne vazi;
 * merio sam ga u prvom prolazu i sve teme su "pale" na pravilu koje ih se ne tice.
 */

let palo = 0;
let ukupno = 0;

/*
 * Tvrdi se SAMO nad temama za 'konverzija'.
 *
 * Teme za 'pricu' su izmerene i prijavljene, ali se ne obaraju: izricit je
 * dogovor da ostanu netaknute. Merenje pokazuje da vise njih pada (najgore
 * 'mint'), pa to stoji kao nalaz za odluku, a ne kao tiho precutana stvar.
 */
const TVRDI_SE: Record<string, boolean> = { 'PRIČA': false, 'KONVERZIJA': true };
const nalaziPrice: string[] = [];

for (const [naziv, skup] of [['PRIČA', LANDING_THEMES], ['KONVERZIJA', KONVERZIJA_THEMES]] as const) {
  console.log(`\n=== ${naziv} ===${TVRDI_SE[naziv] ? '' : '   (izveštaj, ne obara proveru)'}`);
  for (const tema of skup) {
    const rezultati = provereZaTemu(tema).map((p) => ({ ...p, r: odnos(p.prednja, p.pozadina) }));
    const lose = rezultati.filter((x) => x.r < x.prag);
    ukupno += rezultati.length;
    if (TVRDI_SE[naziv]) palo += lose.length;
    else if (lose.length) nalaziPrice.push(`${tema.id} (${lose.length})`);

    console.log(`\n  ${tema.id.padEnd(10)} ${lose.length === 0 ? 'OK' : `PADA ${lose.length}`}`);
    for (const x of rezultati) {
      const oznaka = x.r < x.prag ? 'PADA' : '    ';
      console.log(`    ${oznaka} ${x.r.toFixed(2).padStart(5)}:1  (prag ${x.prag})  ${x.opis}`);
    }
  }
}

console.log(`\nukupno provera: ${ukupno}`);
if (nalaziPrice.length) {
  console.log(`NALAZ za 'priču' (nije obaranje, teme ostaju netaknute): ${nalaziPrice.join(', ')}`);
}
assert.strictEqual(palo, 0, `${palo} parova boja u temama za 'konverziju' je ispod WCAG praga`);
console.log("OK: sve teme za 'konverziju' prolaze WCAG 2.1 AA.");
