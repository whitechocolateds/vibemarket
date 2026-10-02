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
import { sanitizeLanding, ocistiIsticanje } from '../lib/gemini';
import { parseStatValue, visibleStats, LANDING_IKONE, storyParagraphs } from '../lib/landing';

// 0. Isticanje: ispravni parovi prezive, nesparene zagrade se brisu cele
assert.strictEqual(ocistiIsticanje('60 km {{slobode}}'), '60 km {{slobode}}');
assert.strictEqual(ocistiIsticanje('dva {{ovo}} i {{ono}}'), 'dva {{ovo}} i {{ono}}');
assert.strictEqual(ocistiIsticanje('bez zagrada'), 'bez zagrada');
// nesparano -> bez ijedne zagrade, ali tekst ostaje citljiv
assert.strictEqual(ocistiIsticanje('pola {{otvoreno'), 'pola otvoreno');
assert.strictEqual(ocistiIsticanje('{{a}} i {{b'), 'a i b');
assert.strictEqual(ocistiIsticanje('visak}}'), 'visak');
assert.strictEqual(ocistiIsticanje(undefined), undefined);

// 0b. Kapice (^^fraza^^, serifni font): ispravni parovi prezive, nesparene se brisu
assert.strictEqual(ocistiIsticanje('i ^^kauc pobedjuje^^ na kraju'), 'i ^^kauc pobedjuje^^ na kraju');
assert.strictEqual(ocistiIsticanje('^^jedna^^ i ^^druga^^'), '^^jedna^^ i ^^druga^^');
assert.strictEqual(ocistiIsticanje('pola ^^otvoreno'), 'pola otvoreno');
assert.strictEqual(ocistiIsticanje('visak^^'), 'visak');
// Tri vrste isticanja se ne mesaju - svaka prezivi uz druge dve
assert.strictEqual(
  ocistiIsticanje('**bold** pa {{boja}} pa ^^serif^^'),
  '**bold** pa {{boja}} pa ^^serif^^'
);
// Pokvarena jedna vrsta ne obara ostale
assert.strictEqual(ocistiIsticanje('{{ok}} ali ^^pokvareno'), '{{ok}} ali pokvareno');
assert.strictEqual(ocistiIsticanje('^^ok^^ ali {{pokvareno'), '^^ok^^ ali pokvareno');

// Isticanje prolazi kroz sanitizeLanding na svim tekstualnim poljima
const ist = sanitizeLanding({
  heroTitle: 'Teretana je {{predaleko}}',
  problemTitle: 'pokvareno {{ovde',
  benefits: [{ icon: 'zap', title: 'ok {{ovo}}', text: 'lose {{ovde' }],
});
assert.strictEqual(ist.heroTitle, 'Teretana je {{predaleko}}');
assert.strictEqual(
  sanitizeLanding({ story: 'pasus sa ^^serifnom frazom^^ unutra' }).story,
  'pasus sa ^^serifnom frazom^^ unutra'
);
assert.strictEqual(ist.problemTitle, 'pokvareno ovde');
assert.strictEqual(ist.benefits?.[0]?.title, 'ok {{ovo}}');
assert.strictEqual(ist.benefits?.[0]?.text, 'lose ovde');

// 1. Vrednost se brise uvek, i kad je model sam popuni
for (const value of ['12.400+', '4,8 / 5', '98%', '500+', '1–3 dana']) {
  const r = sanitizeLanding({ stats: [{ value, label: 'zadovoljnih kupaca' }] });
  assert.strictEqual(r.stats?.[0]?.value, '', `vrednost je trebalo obrisati: ${value}`);
  assert.strictEqual(r.stats?.[0]?.label, 'zadovoljnih kupaca', 'kategorija je trebalo da ostane');
}

// 2. Kategorija sa brojkom u sebi se odbacuje cela - bilo kakvom brojkom.
//    'preko 500 gradova' je ranije prolazilo kroz heuristiku, pa je pravilo pooštreno.
for (const label of ['preko 12.000 kupaca', '98% zadovoljnih', 'ocena 4,8 / 5', 'preko 500 gradova', '5 godina iskustva']) {
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

// 6b. U pricu ne ulazi isticanje bojom: zagrade se skidaju, tekst ostaje.
//     U pasusima isticanje nosi serifni font, a dve vrste isticanja bi se borile
//     za pogled. Prompt to trazi, ali prompt nije garancija.
const i6b = sanitizeLanding({ story: 'pasus sa {{bojom}} i ^^serifom^^' });
assert.strictEqual(i6b.story, 'pasus sa bojom i ^^serifom^^');
// Naslovi i uvodne recenice zadrzavaju boju
const i6c = sanitizeLanding({ heroTitle: 'naslov sa {{bojom}}', heroLead: 'uvod sa {{bojom}}' });
assert.strictEqual(i6c.heroTitle, 'naslov sa {{bojom}}');
assert.strictEqual(i6c.heroLead, 'uvod sa {{bojom}}');
// Nesparena zagrada u prici ne ostavlja golu zagradu
assert.strictEqual(sanitizeLanding({ story: 'pasus {{pokvareno' }).story, 'pasus pokvareno');
// Brojanje pasusa za ikone radi i posle skidanja zagrada
assert.deepStrictEqual(
  sanitizeLanding({ story: 'a {{x}}\n\nb\n\nc', storyIcons: ['zap', 'home', 'leaf', 'star'] }).storyIcons,
  ['zap', 'home', 'leaf']
);

// 7. Ikone uz pasuse: polozaj u nizu je veza sa pasusom, pa se pogresno ime
//    zamenjuje praznim mestom - nikad se ne izbacuje, jer bi se sve posle njega
//    pomerilo na pogresan pasus.
const PRICA_3 = 'prvi pasus\n\ndrugi pasus\n\ntreci pasus';
assert.strictEqual(storyParagraphs(PRICA_3).length, 3, 'test se oslanja na tri pasusa');

const i7 = sanitizeLanding({ story: PRICA_3, storyIcons: ['traffic', 'izmisljena', 'sofa'] });
assert.deepStrictEqual(i7.storyIcons, ['traffic', '', 'sofa'], 'pogresno ime -> prazno mesto, bez pomeranja');

// Visak preko broja pasusa se odseca - nema gde da se prikaze
assert.deepStrictEqual(
  sanitizeLanding({ story: PRICA_3, storyIcons: ['zap', 'home', 'leaf', 'star', 'truck'] }).storyIcons,
  ['zap', 'home', 'leaf']
);

// Manje imena od pasusa je dozvoljeno: pasusi bez imena prosto nemaju ikonu
assert.deepStrictEqual(sanitizeLanding({ story: PRICA_3, storyIcons: ['zap'] }).storyIcons, ['zap']);

// Bez price nema ni ikona, bez obzira na to sta je model vratio
assert.deepStrictEqual(sanitizeLanding({ storyIcons: ['zap', 'home'] }).storyIcons, []);
assert.deepStrictEqual(sanitizeLanding({ story: PRICA_3 }).storyIcons, []);

// Ne-stringovi iz JSON-a ne smeju da prodju kao ime
assert.deepStrictEqual(
  sanitizeLanding({ story: PRICA_3, storyIcons: [null, 42, 'zap'] as unknown as string[] }).storyIcons,
  ['', '', 'zap']
);

// Svako ime iz jedinog izvora stvarno prolazi validaciju
const svaImena = Object.keys(LANDING_IKONE);
const i7b = sanitizeLanding({
  story: svaImena.map((_, n) => `pasus ${n}`).join('\n\n'),
  storyIcons: svaImena,
});
assert.deepStrictEqual(i7b.storyIcons, svaImena, 'ime iz LANDING_IKONE ne sme da bude odbaceno');

// 8. Ikona kartice iz AI-ja mora da bude dozvoljeno ime
assert.strictEqual(
  sanitizeLanding({ benefits: [{ icon: 'nepostojeca', title: 'ok' }] }).benefits?.[0]?.icon,
  'sparkles',
  'nepoznata ikona kartice pada na podrazumevanu, a ne u prikaz'
);
assert.strictEqual(
  sanitizeLanding({ benefits: [{ icon: 'dumbbell', title: 'ok' }] }).benefits?.[0]?.icon,
  'dumbbell'
);

console.log(`OK: isticanje ocisceno, brojke od modela obrisane, kategorije sa ciframa odbacene, prazne kartice ne idu na sajt, ikone validirane (${svaImena.length} dozvoljenih imena).`);
