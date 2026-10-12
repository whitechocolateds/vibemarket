/**
 * Provera pravila koje cuva spisak porudzbina u admin panelu.
 *
 *   npm run check:orders-greske
 *
 * Ne dira skladiste i ne pravi porudzbine.
 *
 * Zove ISTE funkcije koje zove i sama stranica (lib/orderList.ts). Ranija
 * verzija ove skripte je prepisivala logiku umesto da je pozove, pa je prolazila
 * i dok je stranica i dalje brisala spisak - zato se ovde uvozi pravi kod.
 */

import { spisakIzOdgovora, porudzbinaIzOdgovora } from '../lib/orderList';
import { BlobTransientError, BlobConflictError, isTransientBlobError } from '../lib/blobStore';

let pao = false;
function tvrdi(uslov: boolean, opis: string) {
  console.log(`  ${uslov ? 'OK  ' : 'PALO'}  ${opis}`);
  if (!uslov) pao = true;
}

const porudzbina = { id: 'VM-1', orderNumber: 'VM-1', status: 'pending', items: [], customerInfo: {}, totalPrice: 1799 };

console.log('\nspisak sme da zameni postojeci SAMO ako je potvrdjen i kompletan:');

tvrdi(spisakIzOdgovora({ data: [porudzbina] })?.length === 1, 'ispravan spisak prolazi');
tvrdi(spisakIzOdgovora({ data: [] })?.length === 0, 'prazan niz je validan spisak (moguce je da porudzbina nema)');

/*
 * Ovo je slucaj koji je obarao panel, i koji prethodna popravka (provera res.ok)
 * nije hvatala: odgovor je formalno uspesan, telo je ispravan JSON, ali nema
 * `data`. Staro ponasanje `json.data ?? []` dalo bi prazan niz.
 */
tvrdi(spisakIzOdgovora({ ok: true }) === null, 'telo 200 BEZ `data` se odbija (ovo je obaralo spisak)');
tvrdi(spisakIzOdgovora(null) === null, 'telo koje se ne raspakuje kao JSON se odbija');
tvrdi(spisakIzOdgovora({ data: null }) === null, '`data: null` se odbija');
tvrdi(spisakIzOdgovora({ data: 'nesto' }) === null, '`data` koji nije niz se odbija');
tvrdi(spisakIzOdgovora({ error: 'Neautorizovan pristup' }) === null, 'telo greske se odbija');
tvrdi(spisakIzOdgovora({ data: [porudzbina, { nesto: 1 }] }) === null, 'niz sa zapisom koji nije porudzbina se odbija');
tvrdi(spisakIzOdgovora({ data: [{ id: 'VM-1' }] }) === null, 'zapis bez `status` i `items` nije porudzbina');

console.log('\nodgovor na promenu statusa mora da nosi BAS tu porudzbinu:');

tvrdi(porudzbinaIzOdgovora({ data: porudzbina }, 'VM-1')?.id === 'VM-1', 'ispravan odgovor prolazi');
tvrdi(porudzbinaIzOdgovora({ data: porudzbina }, 'VM-2') === null, 'odgovor za drugu porudzbinu se odbija');
tvrdi(porudzbinaIzOdgovora({ ok: true }, 'VM-1') === null, 'telo bez `data` se odbija');
tvrdi(porudzbinaIzOdgovora(null, 'VM-1') === null, 'prazno telo se odbija');
tvrdi(porudzbinaIzOdgovora({ data: [porudzbina] }, 'VM-1') === null, 'niz umesto jedne porudzbine se odbija');

console.log('\nprepoznavanje prolazne smetnje skladista:');

const zastarelo = new BlobTransientError('telo je zastarelo: telo=W/"a" skladiste=W/"b"');
const kaoLoadOrders = (uzrok: unknown) =>
  new Error(`Porudzbine nisu procitane iz skladista. Uzrok: ${(uzrok as Error).message}`, { cause: uzrok });

tvrdi(isTransientBlobError(zastarelo), 'zastarelo telo je prolazna smetnja');
tvrdi(isTransientBlobError(new BlobConflictError()), 'sudar pri upisu je prolazna smetnja');
tvrdi(isTransientBlobError(kaoLoadOrders(zastarelo)), 'omotnica iz loadOrders cuva prolaznost');
tvrdi(!isTransientBlobError(new Error('Porudžbina nije pronađena')), 'prava greska NIJE prolazna');

console.log(pao ? '\nIMA PADOVA\n' : '\nSve provere prolaze.\n');
process.exitCode = pao ? 1 : 0;
