/**
 * Provera putanje za otpremanje slika.
 *
 *   npm run check:upload
 *
 * Postoji zato sto putanju gradi PRETRAZIVAC, a prihvata je SERVER pre nego sto
 * izda dozvolu za pisanje u Blob. Ako se to dvoje raziđe, otpremanje pada uz
 * poruku "Nedozvoljena putanja" koja ne kaze zasto. Obe strane sada citaju
 * lib/uploadPath.ts, a ovo proverava da sve sto ta gradnja proizvede stvarno
 * prolazi proveru - ukljucujuci imena sa dijakritikom, razmacima i tackama.
 *
 * Mreza se ne dira: ovde je samo rasclanjivanje imena.
 */
import assert from 'assert';
import {
  BLOB_MEDIA_PREFIX,
  DOZVOLJENI_TIPOVI,
  NASTAVAK_PO_TIPU,
  jeUploadPutanja,
  uploadPutanja,
} from '../lib/uploadPath';

// 1. Sve sto gradnja proizvede mora da prodje proveru
const IMENA = [
  'maska.gif',
  'LED maska žuta.gif',
  'Снимак екрана.gif',
  'ime sa  više   razmaka.png',
  'tacka.u.imenu.jpg',
  'ČĆŽŠĐ čćžšđ.webp',
  '../../izlazak-iz-foldera.gif',
  'C:\\Users\\neko\\slika.gif',
  'a'.repeat(300) + '.avif',
  '.gif',
  '😀 emoji.gif',
  'navodnici "i" apostrof\'.png',
];

for (const ime of IMENA) {
  for (const tip of DOZVOLJENI_TIPOVI) {
    const p = uploadPutanja(ime, tip);
    assert.ok(jeUploadPutanja(p), `putanja ne prolazi proveru: ${p} (ime: ${ime})`);
    assert.ok(p.startsWith(`${BLOB_MEDIA_PREFIX}/`), `nije pod prefiksom: ${p}`);
    assert.ok(p.endsWith(`.${NASTAVAK_PO_TIPU[tip]}`), `pogresan nastavak: ${p} za ${tip}`);
    // Nista sto lici na izlazak iz direktorijuma ne sme da prodje
    assert.ok(!p.includes('..'), `dve tacke u putanji: ${p}`);
    assert.strictEqual(p.split('/').length, 2, `vise nivoa u putanji: ${p}`);
  }
}

// 2. Nastavak dolazi iz TIPA, ne iz imena - ime moze da laze
assert.ok(uploadPutanja('zlo.svg', 'image/png').endsWith('.png'));
assert.ok(uploadPutanja('slika.jpg', 'image/gif').endsWith('.gif'));
// Nepoznat tip pada na jpg, ali ImageUploader ga odbija pre nego sto dovde dodje
assert.ok(uploadPutanja('nesto.svg', 'image/svg+xml').endsWith('.jpg'));

// 3. Provera odbija ono sto treba da odbije
for (const lose of [
  'products/../tajna.gif',
  'products/pod/folder.gif',
  'drugi-folder/slika.gif',
  'products/slika sa razmakom.gif',
  'products/slika?upit=1.gif',
  '/products/slika.gif',
  'products/',
  'products/' + 'a'.repeat(121),
  'products/\u0161ipka.gif',
]) {
  assert.ok(!jeUploadPutanja(lose), `ovo je trebalo odbiti: ${lose}`);
}

// 4. Dve uzastopne putanje se ne poklapaju - fajl ne prepisuje prethodni
assert.notStrictEqual(uploadPutanja('ista.gif', 'image/gif'), uploadPutanja('ista.gif', 'image/gif'));

console.log(
  `OK: putanja za otpremanje - ${IMENA.length} imena x ${DOZVOLJENI_TIPOVI.length} tipova prolazi proveru, ` +
    'izlazak iz foldera i nedozvoljeni znakovi odbijeni.'
);
