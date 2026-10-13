/**
 * Pravila automatskog listanja galerije.
 *
 *   npm run check:galerija
 *
 * Zove isti kod koji zove i komponenta (lib/galerija.ts). Pokriva ono sto se
 * okom ne vidi pouzdano: da se posle poslednje slike vraca na prvu, i da svaki
 * od uslova za zaustavljanje stvarno zaustavlja listanje.
 */

import { listanjeRadi, sledeciIndeks, trajanjeZaSliku, TRAJANJE_MS, TRAJANJE_GIF_MS, type StanjeListanja } from '../lib/galerija';

let pao = false;
function tvrdi(uslov: boolean, opis: string) {
  console.log(`  ${uslov ? 'OK  ' : 'PALO'}  ${opis}`);
  if (!uslov) pao = true;
}

const radi: StanjeListanja = {
  brojSlika: 4, rucnoIzabrano: false, misIznad: false,
  karticaSakrivena: false, manjePokreta: false, uvecanPrikaz: false,
};

console.log('\nkada listanje radi, a kada ne:');
tvrdi(listanjeRadi(radi), 'vise slika, nista ne smeta -> radi');
tvrdi(!listanjeRadi({ ...radi, brojSlika: 1 }), 'jedna slika -> ne radi (pravilo 1)');
tvrdi(!listanjeRadi({ ...radi, brojSlika: 0 }), 'bez slika -> ne radi');
tvrdi(!listanjeRadi({ ...radi, rucnoIzabrano: true }), 'posle rucnog izbora -> ne radi (pravilo 2)');
tvrdi(!listanjeRadi({ ...radi, misIznad: true }), 'mis iznad slike -> ne radi (pravilo 3)');
tvrdi(!listanjeRadi({ ...radi, manjePokreta: true }), 'prefers-reduced-motion -> ne radi (pravilo 4)');
tvrdi(!listanjeRadi({ ...radi, karticaSakrivena: true }), 'kartica u pozadini -> ne radi (pravilo 5)');
tvrdi(!listanjeRadi({ ...radi, uvecanPrikaz: true }), 'otvoren uvecan prikaz -> ne radi (pravilo 2)');

console.log('\nredosled i vracanje na prvu:');
tvrdi(sledeciIndeks(0, 4) === 1, '0 -> 1');
tvrdi(sledeciIndeks(2, 4) === 3, '2 -> 3');
tvrdi(sledeciIndeks(3, 4) === 0, 'posle poslednje se vraca na prvu');
tvrdi(sledeciIndeks(0, 1) === 0, 'sa jednom slikom ostaje na njoj');
tvrdi(sledeciIndeks(0, 0) === 0, 'bez slika ne puca');

console.log('\ntrajanje po slici:');
tvrdi(trajanjeZaSliku('https://x/slika.jpg') === TRAJANJE_MS, 'obicna slika dobija osnovno vreme');
tvrdi(trajanjeZaSliku('https://x/animacija.gif') === TRAJANJE_GIF_MS, 'GIF dobija duze vreme (pravilo 8)');
tvrdi(trajanjeZaSliku('https://x/A.GIF?v=2') === TRAJANJE_GIF_MS, 'GIF se prepoznaje i sa upitom i velikim slovima');
tvrdi(trajanjeZaSliku('https://x/gif-uputstvo.webp') === TRAJANJE_MS, '"gif" u imenu nije dovoljno - gleda se nastavak');

/*
 * Lazni sat: koliko puta bi se slika promenila za 30 sekundi i gde bi stala.
 * Pravi tajmer se u pregledacu ne moze meriti pouzdano kad je panel skriven
 * (tada se tajmeri zaustavljaju), pa se redosled proverava ovde, racunski.
 */
console.log('\nlazni sat - 30 s nad galerijom [jpg, gif, jpg, jpg]:');
const slike = ['a.jpg', 'b.gif', 'c.jpg', 'd.jpg'];
let sat = 0;
let i = 0;
const promene: string[] = [];
while (sat < 30_000) {
  sat += trajanjeZaSliku(slike[i]);
  if (sat > 30_000) break;
  i = sledeciIndeks(i, slike.length);
  promene.push(`${(sat / 1000).toFixed(1)}s -> ${slike[i]}`);
}
console.log('   ' + promene.join('\n   '));
tvrdi(promene.length === 5, `za 30 s se desi 5 promena (dobijeno ${promene.length})`);
tvrdi(promene[3].includes('a.jpg'), 'cetvrta promena vraca na prvu sliku');
tvrdi(promene[0].startsWith('4.5s'), 'prva promena posle 4,5 s');
tvrdi(promene[1].startsWith('13.5s'), 'posle GIF-a se ceka 9 s, ne 4,5');

console.log(pao ? '\nIMA PADOVA\n' : '\nSve provere prolaze.\n');
process.exitCode = pao ? 1 : 0;
