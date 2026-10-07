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
  jeVideo,
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

// 1b. Video tipovi prolaze isti put kao slike
for (const [tip, nastavak] of [['video/mp4', 'mp4'], ['video/webm', 'webm']] as const) {
  const p = uploadPutanja('Petlja poklona žđč.gif', tip);
  assert.ok(jeUploadPutanja(p), `video putanja ne prolazi proveru: ${p}`);
  assert.ok(p.endsWith(`.${nastavak}`), `pogresan nastavak za ${tip}: ${p}`);
  assert.ok(jeVideo(tip), `${tip} mora da se prepozna kao video`);
  assert.ok(jeVideo(`https://primer.test/a/b.${nastavak}`), `adresa .${nastavak} mora da se prepozna kao video`);
  assert.ok(jeVideo(`https://primer.test/a/b.${nastavak}?v=2`), 'adresa sa upitom mora da se prepozna');
}
// Slika NIJE video - inace bi se iscrtavala kroz <video> i ostala prazna
for (const slika of ['image/png', 'image/gif', 'https://primer.test/a.gif', 'https://primer.test/a.webp']) {
  assert.ok(!jeVideo(slika), `${slika} ne sme da se prepozna kao video`);
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
