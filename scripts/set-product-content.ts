/**
 * Upisuje tabelu poređenja i pitanja za JEDAN proizvod.
 *
 *   npx tsx scripts/set-product-content.ts <handle>          -- pokaze sta bi upisao
 *   npx tsx scripts/set-product-content.ts <handle> --da     -- upise
 *
 * Zasto skript, a ne rucno kroz panel: sadrzaj je duzi i lakse ga je drzati u
 * verzionisanom fajlu nego ga prekucavati u polje. Panel i dalje radi isto -
 * `comparisonPoints` idu red po red, `faqs` u obliku "pitanje | odgovor".
 *
 * Prazna polja na proizvodu znace da stranica prikazuje opsti tekst iz
 * ProductComparisonTable i ProductFAQ, isti za sve proizvode. Ovo ih zamenjuje
 * sadrzajem koji vazi bas za taj artikal.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { updateJsonFile, readJsonFileResult } from '../lib/db';
import type { Product, ProductFaq } from '../lib/types';

async function loadEnvLocal(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      if (process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* nema fajla */
  }
}

interface Sadrzaj {
  comparisonPoints: string[];
  faqs: ProductFaq[];
}

/**
 * Sadrzaj po proizvodu.
 *
 * Sve tvrdnje su izvedene iz opisa samog artikla - brzina, kapacitet, napajanje,
 * dimenzije i sadrzaj pakovanja. Namerno se ne obecava vise nego sto opis kaze:
 * UV lampa POMAZE u proveri novcanica i nije sertifikovan detektor falsifikata.
 */
const SADRZAJ: Record<string, Sadrzaj> = {
  'prenosivi-brojac-novcanica-sa-uv-detekcijom': {
    comparisonPoints: [
      'Ugrađena UV lampa — novčanice proveravate tokom samog brojanja, bez drugog uređaja',
      'Radi i bez utičnice — na 4 AAA baterije ili preko adaptera 220V iz pakovanja',
      'Prenosiv: oko 450 g i 19 × 10 × 8 cm, sa zaštitnom torbicom u pakovanju',
      'Brzina do 600 novčanica u minutu, ležište prima 120–150 novčanica',
      'Funkcija sumiranja (Add) — sabira više uzastopnih brojanja bez računanja u glavi',
      'Broji i strane valute, kupone, karte i letke sličnih dimenzija',
    ],
    faqs: [
      {
        question: 'Da li prepoznaje falsifikovane novčanice?',
        answer:
          'Uređaj ima ugrađenu ultraljubičastu (UV) lampu koja pomaže u proveri novčanica tokom ' +
          'brojanja i daje dodatni nivo sigurnosti pri rukovanju gotovinom. Nije reč o ' +
          'sertifikovanom detektoru falsifikata, već o pomoćnoj proveri — kod sumnjive novčanice ' +
          'uvek proverite i ostala zaštitna obeležja.',
      },
      {
        question: 'Koliko brzo broji i koliko novčanica staje odjednom?',
        answer:
          'Broji do 600 novčanica u minutu, a ležište prima 120–150 novčanica. Dnevni pazar ili ' +
          'pripremu depozita završavate za nekoliko sekundi umesto ručnog prebrojavanja.',
      },
      {
        question: 'Može li da radi bez struje?',
        answer:
          'Može. Uređaj radi preko adaptera na 220V, koji dobijate u pakovanju, ili na 4 AAA ' +
          'baterije. Zbog toga je pogodan za pijace, sajmove, terenske prodaje i sva mesta gde ' +
          'nemate utičnicu pri ruci.',
      },
      {
        question: 'Da li broji dinare, evre i druge valute?',
        answer:
          'Uređaj nije vezan za jednu valutu — broji različite novčanice, kao i papire sličnih ' +
          'dimenzija poput kupona, karata, letaka i brošura. Broji komade, a ne prepoznaje ' +
          'apoene, pa se ukupan iznos ne prikazuje u novcu.',
      },
      {
        question: 'Šta tačno dobijam u pakovanju?',
        answer:
          'Prenosivi brojač novčanica, adapter za napajanje 220V, zaštitnu torbicu za nošenje, ' +
          'ograničivač novčanica i uputstvo za upotrebu.',
      },
      {
        question: 'Kako radi funkcija sumiranja?',
        answer:
          'Uređaj ima samo dva dugmeta — Recount (ponovno brojanje) i Add (sumiranje). Kada ' +
          'uključite Add, uređaj sabira rezultate više uzastopnih brojanja, pa veće količine ' +
          'možete brojati u gomilama bez zapisivanja međurezultata.',
      },
    ],
  },
};

const FILE = 'products.json';

async function main() {
  await loadEnvLocal();
  const handle = process.argv[2];
  const apply = process.argv.includes('--da');

  if (!handle || handle.startsWith('--')) {
    console.error('Upotreba: npx tsx scripts/set-product-content.ts <handle> [--da]');
    console.error('Dostupni handle-ovi: ' + Object.keys(SADRZAJ).join(', '));
    process.exit(1);
  }

  const sadrzaj = SADRZAJ[handle];
  if (!sadrzaj) {
    console.error(`Za "${handle}" nema pripremljenog sadržaja.`);
    console.error('Dostupno: ' + Object.keys(SADRZAJ).join(', '));
    process.exit(1);
  }

  const res = await readJsonFileResult<Product[]>(FILE);
  if (res.status !== 'ok') {
    console.error(`Katalog nije pročitan (${res.status}). Ništa nije menjano.`);
    if (res.status === 'error') console.error(res.error);
    process.exit(1);
  }

  const proizvod = res.data.find((p) => p.handle === handle);
  if (!proizvod) {
    console.error(`Proizvod "${handle}" ne postoji u katalogu.`);
    process.exit(1);
  }

  console.log(`Proizvod: ${proizvod.title}`);
  console.log(`Sada:     ${proizvod.comparisonPoints?.length ?? 0} stavki u tabeli, ${proizvod.faqs?.length ?? 0} pitanja`);
  console.log(`Posle:    ${sadrzaj.comparisonPoints.length} stavki u tabeli, ${sadrzaj.faqs.length} pitanja\n`);

  console.log('Tabela poređenja:');
  for (const t of sadrzaj.comparisonPoints) console.log(`  ✓ ${t}`);
  console.log('\nPitanja:');
  for (const f of sadrzaj.faqs) console.log(`  ? ${f.question}`);

  if (!apply) {
    console.log('\nOvo je bila proba, ništa nije upisano. Za upis:');
    console.log(`  npx tsx scripts/set-product-content.ts ${handle} --da`);
    return;
  }

  await updateJsonFile<Product[]>(FILE, (current) => {
    if (current === null) throw new Error('Katalog ne postoji u skladištu.');
    const p = current.find((x) => x.handle === handle);
    if (!p) throw new Error(`Proizvod "${handle}" nije nađen pri upisu.`);
    p.comparisonPoints = sadrzaj.comparisonPoints;
    p.faqs = sadrzaj.faqs;
    return current;
  });

  const posle = await readJsonFileResult<Product[]>(FILE);
  const p = posle.status === 'ok' ? posle.data.find((x) => x.handle === handle) : null;
  console.log(
    `\nUpisano. U katalogu sada: ${p?.comparisonPoints?.length ?? 0} stavki, ${p?.faqs?.length ?? 0} pitanja.`
  );
}

main().catch((error) => {
  console.error('\nUpis nije uspeo:');
  console.error(error);
  process.exit(1);
});
