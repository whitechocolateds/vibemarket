/**
 * Meri kontrast kartice "prednosti proizvoda".
 *
 *   npm run check:highlights
 *
 * Postoji zato sto se roze kartica sa belim tekstom lako izabere okom a padne
 * na merenju: prvi predlog je isao od #FF6FA5, sto daje 2.60:1 - skoro upola
 * ispod praga, a na ekranu deluje citljivo.
 *
 * Nijanse stoje OVDE i u ProductHighlights.module.css. Ako se tamo promene a
 * ovde ne, provera pada - sto je i poenta.
 */
import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';

/** Relativna luminanca po WCAG - gama-korigovan zbir, ne prosek kanala. */
function luminanca(hex: string): number {
  const h = hex.replace('#', '');
  const v = parseInt(h, 16);
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

const PRAG_TEKST = 4.5;
const PRAG_GRAFIKA = 3.0;

(async () => {
  const css = await fs.readFile(
    path.join(process.cwd(), 'components', 'ProductHighlights.module.css'),
    'utf-8'
  );

  const gradijent = css.match(/linear-gradient\(135deg,([^)]+)\)/);
  assert.ok(gradijent, 'gradijent kartice nije pronadjen u CSS-u');
  const nijanse = [...gradijent[1].matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0]);
  assert.ok(nijanse.length >= 2, 'ocekuju se bar dve nijanse u gradijentu');

  console.log('beli tekst na kartici prednosti:');
  for (const n of nijanse) {
    const r = odnos('#ffffff', n);
    console.log(`  ${n}  ${r.toFixed(2)}:1  (prag ${PRAG_TEKST})`);
    assert.ok(r >= PRAG_TEKST, `${n} daje ${r.toFixed(2)}:1, ispod praga ${PRAG_TEKST}`);
  }

  // Kvacica je bela na poluprovidnoj beloj podlozi; najgore je nad najsvetlijom nijansom.
  const providnost = Number(css.match(/background: rgba\(255, 255, 255, ([\d.]+)\)/)?.[1] ?? '0.22');
  const najsvetlija = nijanse.reduce((a, b) => (luminanca(a) > luminanca(b) ? a : b));
  const v = parseInt(najsvetlija.slice(1), 16);
  const mesano = [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    .map((k) => Math.round(providnost * 255 + (1 - providnost) * k))
    .map((k) => k.toString(16).padStart(2, '0'))
    .join('');
  const rKvacica = odnos('#ffffff', `#${mesano}`);
  console.log(`\nkvacica na podlozi #${mesano.toUpperCase()}: ${rKvacica.toFixed(2)}:1  (prag ${PRAG_GRAFIKA})`);
  assert.ok(rKvacica >= PRAG_GRAFIKA, `kvacica daje ${rKvacica.toFixed(2)}:1, ispod praga ${PRAG_GRAFIKA}`);

  console.log('\nOK: kartica prednosti prolazi WCAG 2.1 AA na celoj povrsini gradijenta.');
})().catch((e) => {
  console.error('PALO:', e instanceof Error ? e.message : e);
  process.exit(1);
});
