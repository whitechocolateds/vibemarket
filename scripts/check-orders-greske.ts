/**
 * Provera lanca koji odlucuje da li admin panel vidi "pokusaj ponovo" ili
 * pravu gresku.
 *
 *   npm run check:orders-greske
 *
 * Ne dira skladiste i ne pravi porudzbine - sve je nad vec napravljenim
 * greskama. Postoji zato sto se bas na ovom lancu lomilo: prolazna smetnja
 * skladista stizala je do admina kao obicna greska, a spisak porudzbina bi se
 * ispraznio.
 */

import { BlobTransientError, BlobConflictError, isTransientBlobError } from '../lib/blobStore';

let pao = false;
function tvrdi(uslov: boolean, opis: string) {
  console.log(`  ${uslov ? 'OK  ' : 'PALO'}  ${opis}`);
  if (!uslov) pao = true;
}

/** Ista omotnica kakvu pravi loadOrders() u lib/orderStore.ts. */
function kaoLoadOrders(uzrok: unknown): Error {
  return new Error(
    'Porudzbine nisu procitane iz skladista. ' +
      `Uzrok: ${uzrok instanceof Error ? uzrok.message : String(uzrok)}`,
    { cause: uzrok }
  );
}

console.log('\nprepoznavanje prolazne smetnje:');

const zastarelo = new BlobTransientError('telo je zastarelo: telo=W/"a" skladiste=W/"b"');
tvrdi(isTransientBlobError(zastarelo), 'zastarelo telo je prolazna smetnja');
tvrdi(isTransientBlobError(new BlobConflictError()), 'sudar pri upisu je prolazna smetnja');

tvrdi(
  isTransientBlobError(kaoLoadOrders(zastarelo)),
  'omotnica iz loadOrders CUVA prolaznost (ovo je bilo pokvareno: cause se gubio)'
);

tvrdi(
  !isTransientBlobError(new Error('Porudžbina nije pronađena')),
  'prava greska NIJE prolazna - ne sme da se krije iza ponavljanja'
);
tvrdi(
  !isTransientBlobError(kaoLoadOrders(new TypeError('neispravan JSON'))),
  'omotnica oko prave greske ostaje neprolazna'
);

console.log('\nodgovor klijenta na telo bez `data`:');

/*
 * Tacan izraz koji je pravio stetu u app/admin/(panel)/orders/page.tsx.
 * Telo odgovora sa greskom je i dalje ispravan JSON, pa `catch` nije hvatao
 * nista - a `?? []` je spisak pretvarao u prazan.
 */
const telogreske = { error: 'Skladiste je trenutno zauzeto.' } as { data?: unknown[]; error?: string };
tvrdi(
  (telogreske.data ?? []).length === 0,
  'staro ponasanje bi dalo prazan spisak (zato provera `res.ok` mora da ide PRE citanja `data`)'
);

console.log(pao ? '\nIMA PADOVA\n' : '\nSve provere prolaze.\n');
process.exitCode = pao ? 1 : 0;
