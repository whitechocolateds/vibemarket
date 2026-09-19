/**
 * Provera da brojke iz AI odgovora nikad ne postanu tvrdnja prodavnice.
 *
 *   npm run check:landing
 *
 * Pravilo: model sme da predlozi SAMO kategoriju kartice ("zadovoljnih
 * kupaca"), a sam broj upisuje covek u admin panelu. Prompt to trazi, ali
 * prompt nije garancija - sanitizeLanding jeste, pa mora da ima proveru koja
 * pada kad se pokvari.
 */
import assert from 'assert';
import { sanitizeLanding } from '../lib/gemini';
import { parseStatValue, visibleStats } from '../lib/landing';

// 1. Vrednost se brise uvek, i kad je model sam popuni
for (const value of ['12.400+', '4,8 / 5', '98%', '500+', '1–3 dana']) {
  const r = sanitizeLanding({ stats: [{ value, label: 'zadovoljnih kupaca' }] });
  assert.strictEqual(r.stats?.[0]?.value, '', `vrednost je trebalo obrisati: ${value}`);
  assert.strictEqual(r.stats?.[0]?.label, 'zadovoljnih kupaca', 'kategorija je trebalo da ostane');
}

// 2. Kategorija sa brojkom u sebi se odbacuje cela
for (const label of ['preko 12.000 kupaca', '98% zadovoljnih', 'ocena 4,8 / 5']) {
  const r = sanitizeLanding({ stats: [{ value: '', label }] });
  assert.strictEqual(r.stats?.length, 0, `kategoriju je trebalo odbaciti: ${label}`);
}

// 3. Ciste kategorije prolaze, prazne vrednosti
const ciste = ['zadovoljnih kupaca', 'godina iskustva', 'dana za povracaj', 'prosecno vreme dostave'];
const r3 = sanitizeLanding({ stats: ciste.map((label) => ({ value: 'x', label })) });
assert.strictEqual(r3.stats?.length, ciste.length);
assert.ok(r3.stats?.every((s) => s.value === ''), 'nijedna vrednost ne sme da prodje od modela');

// 4. Kartica bez upisanog broja se NE prikazuje na sajtu
assert.strictEqual(visibleStats(r3.stats).length, 0, 'prazna kartica ne sme na sajt');
assert.strictEqual(
  visibleStats([{ value: '500+', label: 'kupaca' }, { value: '', label: 'godina' }]).length,
  1
);

// 5. Rasclanjivanje vrednosti za odbrojavanje
assert.deepStrictEqual(parseStatValue('500+'), { broj: 500, prefiks: '', sufiks: '+' });
assert.deepStrictEqual(parseStatValue('12.400'), { broj: 12400, prefiks: '', sufiks: '' });
assert.deepStrictEqual(parseStatValue('4,8'), { broj: 4.8, prefiks: '', sufiks: '' });
assert.deepStrictEqual(parseStatValue('98%'), { broj: 98, prefiks: '', sufiks: '%' });
assert.deepStrictEqual(parseStatValue('preko 200 gradova'), { broj: 200, prefiks: 'preko ', sufiks: ' gradova' });
// bez broja nema odbrojavanja - tekst se ispisuje kakav jeste
assert.strictEqual(parseStatValue('Pouzećem').broj, null);

// 6. Prazan i nepotpun ulaz ne obara funkciju
const prazno = sanitizeLanding({
  benefits: [{ icon: 'zap', title: '' }],
  objections: [{ question: 'Pitanje?', answer: '' }],
});
assert.deepStrictEqual(prazno.stats, []);
assert.strictEqual(prazno.benefits?.length, 0);
assert.strictEqual(prazno.objections?.length, 0);

console.log('OK: brojke od modela se brisu, kategorije sa ciframa odbacuju, prazne kartice ne idu na sajt.');
