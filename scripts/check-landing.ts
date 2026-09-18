/**
 * Provera filtera lazne statistike za landing stranice.
 *
 *   npm run check:landing
 *
 * Postoji zato sto je to jedino mesto gde AI odgovor moze da postane tvrdnja
 * prodavnice. Prompt trazi da ne izmislja brojke, ali prompt nije garancija -
 * ovaj filter jeste, pa mora da ima proveru koja pada kad se pokvari.
 */
import assert from 'assert';
import { sanitizeLanding } from '../lib/gemini';

const izbaceno = [
  { value: '12.400+', label: 'prodatih komada u regionu' },
  { value: '4,8 / 5', label: 'prosečna ocena kupaca' },
  { value: '98%', label: 'zadovoljnih kupaca' },
  { value: '30.000', label: 'korisnika u Srbiji' },
  { value: '5k', label: 'porudžbina mesečno' },
];

const zadrzano = [
  { value: '1–3 dana', label: 'prosečno vreme dostave' },
  { value: 'Pouzećem', label: 'plaćanje pri preuzimanju' },
  { value: '14 dana', label: 'zakonski rok za odustanak' },
  { value: 'Bez avansa', label: 'ne plaćate unapred' },
];

for (const s of izbaceno) {
  const r = sanitizeLanding({ stats: [s] });
  assert.strictEqual(r.stats?.length, 0, `trebalo je izbaciti: ${s.value} ${s.label}`);
}

for (const s of zadrzano) {
  const r = sanitizeLanding({ stats: [s] });
  assert.strictEqual(r.stats?.length, 1, `trebalo je zadrzati: ${s.value} ${s.label}`);
}

// Mesovit ulaz: prolaze samo istinite stavke
const mesano = sanitizeLanding({ stats: [...izbaceno, ...zadrzano] });
assert.strictEqual(mesano.stats?.length, zadrzano.length);

// Prazne i nepotpune stavke ne smeju da prodju ni u jednoj listi
const prazno = sanitizeLanding({
  stats: [{ value: '', label: 'bez vrednosti' }],
  benefits: [{ icon: 'zap', title: '' }],
  objections: [{ question: 'Pitanje?', answer: '' }],
});
assert.strictEqual(prazno.stats?.length, 0);
assert.strictEqual(prazno.benefits?.length, 0);
assert.strictEqual(prazno.objections?.length, 0);

// Nedostajuca polja ne smeju da obore funkciju
const bezIcega = sanitizeLanding({});
assert.deepStrictEqual(bezIcega.stats, []);
assert.deepStrictEqual(bezIcega.benefits, []);

console.log(`OK: ${izbaceno.length} izmisljenih statistika odbaceno, ${zadrzano.length} istinitih zadrzano.`);
