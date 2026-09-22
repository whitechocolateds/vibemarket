/** Provera pravila za sifre, bez dodirivanja skladista. */
import assert from 'assert';
import { generateSku, ensureSkus } from '../lib/sku';

const z = new Set<string>();
assert.strictEqual(generateSku('Traka za vežbanje sa šipkom', z), 'VM-TRA-001');
z.add('VM-TRA-001');
// isti pocetak -> sledeci redni broj, bez sudara
assert.strictEqual(generateSku('Trampolina za decu', z), 'VM-TRA-002');
// emodziji i dijakritici otpadaju
assert.strictEqual(generateSku('💦 360° Prskalica za Baštu', new Set()), 'VM-PRS-001');
// naziv bez slova -> rezervna oznaka
assert.strictEqual(generateSku('360 °', new Set()), 'VM-PRO-001');
// kratak naziv se dopunjava
assert.strictEqual(generateSku('TV', new Set()), 'VM-TVX-001');

// ensureSkus: postojece se NE dira, prazna dobijaju jedinstvene
const lista = [
  { title: 'Ventilator', sku: 'VM-RUC-042' },
  { title: 'Ventilator za sto' },
  { title: 'Ventilator mali' },
];
const dodato = ensureSkus(lista);
assert.strictEqual(dodato, 2);
assert.strictEqual(lista[0].sku, 'VM-RUC-042', 'postojeca sifra se ne sme menjati');
const sve = lista.map((p) => p.sku!);
assert.strictEqual(new Set(sve).size, 3, 'sifre moraju biti jedinstvene');
assert.deepStrictEqual(sve.slice(1), ['VM-VEN-001', 'VM-VEN-002']);

// drugi prolaz ne menja nista
assert.strictEqual(ensureSkus(lista), 0);

console.log('OK: sifre jedinstvene, stabilne, citljive. Primeri: ' + sve.join(', '));
