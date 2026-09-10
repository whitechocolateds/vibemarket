/**
 * VibeMarket - Plan ishrane za 4 nedelje
 * Vodic uz proizvod "Traka za vezbanje sa sipkom" (Pilates Studio SF-18).
 *
 * Sadrzaj je namerno opsti i bezbedan: bez kalorijskih ciljeva, bez izbacivanja
 * grupa namirnica i bez medicinskih preporuka. Zavrsna napomena to i kaze.
 */
const fs = require('fs');
const path = require('path');
const K = require('./kit');
const { C, M, CW } = K;

const OUT = path.join(__dirname, 'out', 'vibemarket-plan-ishrane-4-nedelje.pdf');

/** Tanjir podeljen na polovinu povrca i dve cetvrtine - crta se na naslovnoj. */
function plateIllo(doc, cx, cy) {
  const r = 54;
  doc.save();
  doc.circle(cx, cy, r + 9).lineWidth(1).strokeColor(C.white).strokeOpacity(0.35).stroke();
  doc.circle(cx, cy, r).fillColor(C.white).fillOpacity(0.12).fill().fillOpacity(1);
  doc.strokeOpacity(0.8).strokeColor(C.white).lineWidth(1.4);
  doc.circle(cx, cy, r).stroke();
  doc.moveTo(cx, cy - r).lineTo(cx, cy + r).stroke();
  doc.moveTo(cx, cy).lineTo(cx + r, cy).stroke();
  doc.strokeOpacity(1);
  doc.font('semi').fontSize(7).fillColor(C.white).opacity(0.9);
  doc.text('POVRĆE', cx - r + 6, cy - 5, { width: r - 12, align: 'center' });
  doc.text('PROTEIN', cx + 8, cy - r / 2 - 4, { width: r - 20, align: 'center' });
  doc.text('ŽITARICE', cx + 8, cy + r / 2 - 4, { width: r - 20, align: 'center' });
  doc.opacity(1).restore();
}

const doc = K.newDoc({
  title: 'Plan ishrane za 4 nedelje',
  subject: 'Vodič uz proizvod Traka za vežbanje sa šipkom - VibeMarket',
  accent: C.brand,   // brend ostaje plav; dokumenti se razlikuju ilustracijom, ne bojom
});

// ── Naslovna ────────────────────────────────────────────────────────────────
K.cover(doc, {
  kicker: 'VODIČ UZ PROIZVOD',
  title: 'Plan ishrane\nza 4 nedelje',
  lead: 'Jednostavan, uravnotežen plan za sve koji vežbaju tri do četiri puta nedeljno. Bez brojanja kalorija i bez izbacivanja namirnica.',
  chips: ['4 nedelje', 'Nedeljni raspored obroka', 'Lista za kupovinu', 'Praćenje navika'],
  illo: plateIllo,
});

K.productBox(doc, {
  title: 'Traka za vežbanje sa šipkom',
  model: 'Model Pilates Studio SF-18  ·  šipka 92 cm  ·  traka 80 cm',
  specs: 'Uz ovaj vodič ide i zaseban PDF sa planom vežbi po nivoima.',
});

K.para(doc,
  'Ovaj plan ne traži da menjate sve odjednom. Napravljen je tako da svake nedelje dodate po jednu naviku, ' +
  'a ono što ste već uveli ostaje. Posle četiri nedelje imate ritam ishrane koji možete da držite i dalje, ' +
  'bez posebnog režima i bez merenja svakog obroka.');

K.callout(doc, {
  iconName: 'warn',
  tone: 'warn',
  title: 'Pročitajte pre početka',
  text: 'Ovo je opšti vodič, a ne medicinski savet ni propisana dijeta. Ako imate zdravstveno stanje, ' +
        'alergiju na hranu, uzimate terapiju, trudni ste ili dojite — posavetujte se sa lekarom pre nego što promenite ishranu.',
});

// ── Pravila ─────────────────────────────────────────────────────────────────
K.h2(doc, 'Četiri pravila koja nose sve ostalo', 'plate');
K.bullets(doc, [
  ['Pola tanjira je povrće.', 'Preostalu polovinu podelite na protein (meso, riba, jaja, mahunarke, mlečno) i složene ugljene hidrate (integralne žitarice, krompir, pirinač).'],
  ['Protein uz svaki glavni obrok.', 'On najviše doprinosi osećaju sitosti i oporavku mišića posle treninga.'],
  ['Ne preskačite obroke na dan treninga.', 'Trening na prazan stomak najčešće znači slabiju energiju i prejedanje uveče.'],
  ['Redovnost je važnija od savršenstva.', 'Jedan obrok van plana ništa ne kvari. Vratite se na sledeći obrok i nastavite.'],
]);

// ── Nedeljni raspored ───────────────────────────────────────────────────────
K.h2(doc, 'Nedeljni raspored obroka', 'calendar');
K.para(doc,
  'Ovo je predlog, ne obaveza. Dani se slobodno zamenjuju, a svaki obrok može da se zameni nečim ' +
  'sličnim iz tabele zamena na kraju vodiča.', { after: 12 });

K.table(doc, {
  cols: [
    { label: 'Dan', width: 50 },
    { label: 'Doručak', width: 118 },
    { label: 'Užina', width: 86 },
    { label: 'Ručak', width: 128 },
    { label: 'Večera', width: 110 },
  ],
  rows: [
    ['Pon', 'Ovsena kaša sa mlekom, bananom i orasima', 'Jogurt i šaka badema', 'Pileće belo meso, integralni pirinač, salata od kupusa', 'Kajgana od dva jajeta, integralni tost, paradajz'],
    ['Uto', 'Integralni hleb, sir, kuvano jaje, paprika', 'Jabuka i par oraha', 'Pasulj sa povrćem, parče hleba, zelena salata', 'Jogurt sa voćem i semenkama'],
    ['Sre', 'Palačinke od ovsenih pahuljica i jajeta, voće', 'Šargarepa i humus', 'Riba iz rerne, krompir, blitva', 'Salata sa tunjevinom, kuvano jaje, integralni hleb'],
    ['Čet', 'Jogurt sa pahuljicama, medom i voćem', 'Kruška i šaka lešnika', 'Ćufte u paradajz sosu, heljda, salata', 'Sendvič od integralnog hleba sa piletinom i povrćem'],
    ['Pet', 'Kajgana sa spanaćem i sirom, integralni hleb', 'Voćni smuti sa jogurtom', 'Punjene paprike, kiselo mleko, salata', 'Supa od povrća i parče hleba sa sirom'],
    ['Sub', 'Integralni tost sa avokadom i jajetom', 'Suvo voće i orašasti plodovi', 'Pileći paprikaš, testenina od celog zrna, salata', 'Omlet sa povrćem'],
    ['Ned', 'Kaša ili palačinke, voće, jogurt', 'Voće po izboru', 'Porodični ručak po želji — pola tanjira neka bude povrće', 'Lakši obrok: sir, povrće, integralni hleb'],
  ],
});

// ── Nedelja po nedelja ──────────────────────────────────────────────────────
K.h2(doc, 'Šta se menja iz nedelje u nedelju', 'spark');
K.table(doc, {
  cols: [
    { label: 'Nedelja', width: 62 },
    { label: 'Fokus', width: 104 },
    { label: 'Šta konkretno radite', width: 326 },
  ],
  rows: [
    ['1', 'Ritam', 'Uvodite tri glavna obroka u približno isto vreme svakog dana. Ništa ne izbacujete i ništa ne merite — samo držite vreme obroka.'],
    ['2', 'Povrće', 'Zadržavate ritam iz prve nedelje i dodajete povrće u svaki glavni obrok — sveže, kuvano ili iz rerne, svejedno je.'],
    ['3', 'Obroci oko treninga', 'Usklađujete obrok pre i posle treninga sa danima vežbanja. Užine pomerate tako da vam trening ne padne na prazan stomak.'],
    ['4', 'Ustaljivanje', 'Zadržavate ono što vam je leglo. Napravite spisak od pet obroka koji su vam bili najlakši i njih ponavljajte i dalje.'],
  ],
});

// ── Oko treninga ────────────────────────────────────────────────────────────
K.h2(doc, 'Obroci oko treninga', 'clock');
K.h3(doc, 'Pre treninga — jedan do dva sata ranije');
K.para(doc,
  'Lakši obrok u kojem preovlađuju ugljeni hidrati, uz nešto proteina: jogurt sa voćem, banana i par oraha, ' +
  'integralni tost sa sirom. Izbegavajte obilan i mastan obrok neposredno pre vežbanja. ' +
  'Ako trenirate odmah po ustajanju, dovoljno je komad voća, a pravi doručak dolazi posle.', { after: 12 });

K.h3(doc, 'Posle treninga — u roku od dva sata');
K.para(doc,
  'Obrok koji ima i protein i ugljene hidrate: piletina sa pirinčem, jaja sa integralnim hlebom, ' +
  'jogurt sa pahuljicama i voćem. Nije potreban nikakav poseban napitak ni dodatak ishrani — ' +
  'običan obrok radi isti posao.');

// ── Hidratacija ─────────────────────────────────────────────────────────────
K.h2(doc, 'Hidratacija', 'drop');
K.bullets(doc, [
  ['Pijte tokom celog dana,', 'ne samo uz obroke. Čaša vode uz svaki obrok i užinu je najlakši način da se to samo od sebe skupi.'],
  ['Tokom treninga', 'popijte nekoliko gutljaja na svakih deset do petnaest minuta, i pre nego što ožednite.'],
  ['Boja mokraće je najjednostavniji pokazatelj', '— svetla znači da pijete dovoljno, tamna da treba više.'],
  ['Kafa i čaj se računaju', 'u dnevni unos tečnosti, ali voda ostaje osnova.'],
  ['Zaslađeni napici i sokovi iz kesice', 'su najlakše mesto za promenu: zamenite ih vodom sa limunom ili nezaslađenim čajem.'],
]);

// ── Odmor ───────────────────────────────────────────────────────────────────
K.h2(doc, 'Odmor i san', 'moon');
K.bullets(doc, [
  ['Sedam do devet sati sna.', 'Oporavak mišića se najvećim delom dešava tokom sna, a ne tokom treninga.'],
  ['Bar dva dana nedeljno bez treninga.', 'Uz plan od tri do četiri treninga to se samo uklapa.'],
  ['Dan odmora ne mora biti dan nepokretnosti.', 'Šetnja od dvadesetak minuta ubrzava oporavak više nego ležanje.'],
  ['Ako ste iscrpljeni dva dana zaredom,', 'smanjite intenzitet ili preskočite trening. To nije nazadovanje, nego deo plana.'],
  ['Poslednji veliki obrok', 'ostavite bar dva sata pre spavanja — san je mirniji, a jutarnji apetit normalniji.'],
]);

// ── Zamene ──────────────────────────────────────────────────────────────────
K.h2(doc, 'Brze zamene', 'check');
K.table(doc, {
  cols: [
    { label: 'Umesto', width: 130 },
    { label: 'Probajte', width: 176 },
    { label: 'Zašto', width: 186 },
  ],
  rows: [
    ['Beli hleb i peciva', 'Integralni hleb', 'Vlakna duže drže osećaj sitosti'],
    ['Sok iz kesice', 'Voda sa limunom, sveže voće', 'Znatno manje šećera, više vlakana'],
    ['Grickalice iz kese', 'Šaka orašastih plodova', 'Zdrave masti umesto praznih kalorija'],
    ['Prženo meso', 'Meso iz rerne ili sa grila', 'Isti obrok sa manje masnoće'],
    ['Slatkiš posle večere', 'Voće ili jogurt sa cimetom', 'Sitost bez naglog pada energije'],
    ['Majonez u salati', 'Maslinovo ulje i limun', 'Lakše, a salata dobija na ukusu'],
  ],
});

// ── Kupovina ────────────────────────────────────────────────────────────────
K.h2(doc, 'Spisak za kupovinu', 'cart');
K.para(doc,
  'Sa ovim namirnicama u kući možete da sklopite svaki obrok iz nedeljnog rasporeda. ' +
  'Kupujte ono što je sezonsko — jeftinije je i najčešće ukusnije.', { after: 12 });
K.table(doc, {
  cols: [
    { label: 'Grupa', width: 108 },
    { label: 'Namirnice', width: 384 },
  ],
  rows: [
    ['Proteini', 'Jaja, pileće belo meso, riba, mleveno meso, jogurt, kiselo mleko, sir, pasulj, sočivo, leblebije'],
    ['Žitarice i skrob', 'Ovsene pahuljice, integralni hleb, pirinač, heljda, testenina od celog zrna, krompir'],
    ['Povrće', 'Paradajz, krastavac, paprika, kupus, spanać, blitva, brokoli, šargarepa, crni i beli luk'],
    ['Voće', 'Banana, jabuka, kruška, limun, sezonsko voće po izboru'],
    ['Masti i dodaci', 'Maslinovo ulje, orasi, bademi, lešnici, semenke, med, začinsko bilje'],
  ],
});

// ── Praćenje ────────────────────────────────────────────────────────────────
K.h2(doc, 'Praćenje navika', 'list');
K.para(doc,
  'Označite dan u kojem ste pojeli tri glavna obroka i popili dovoljno vode. ' +
  'Cilj nisu sva polja — cilj je da svake nedelje bude bar jedno više nego prethodne.', { after: 12 });
K.tracker(doc, {
  rowLabels: ['Nedelja 1', 'Nedelja 2', 'Nedelja 3', 'Nedelja 4'],
  colLabels: ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'],
});

K.para(doc,
  'Posle četvrte nedelje ne počinjete ništa novo — samo nastavljate. Ako želite dodatni korak, ' +
  'proširite raspored vežbi na naprednije nivoe iz drugog vodiča.', { after: 10 });

K.disclaimer(doc,
  'Napomena. Ovaj vodič je informativnog karaktera i ne predstavlja medicinski savet, dijagnozu, terapiju ' +
  'niti propisanu dijetu. Namerno je napisan bez brojanja kalorija, bez ciljne telesne mase i bez ' +
  'izbacivanja grupa namirnica. Ako ste trudni ili dojite, imate dijabetes, oboljenje srca, bubrega ili ' +
  'štitne žlezde, alergiju ili netoleranciju na hranu, poremećaj ishrane, ili uzimate terapiju — ' +
  'posavetujte se sa lekarom ili nutricionistom pre nego što promenite ishranu. Za osobe mlađe od 18 godina ' +
  'promene u ishrani vodi roditelj ili staratelj uz savet lekara. Prekinite i obratite se lekaru ako osetite ' +
  'vrtoglavicu, slabost, nesvesticu ili druge neuobičajene simptome. VibeMarket ne snosi odgovornost za ' +
  'posledice samostalne primene ovog vodiča.');

// ── Izlaz ───────────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUT), { recursive: true });
K.paginate(doc);
const out = fs.createWriteStream(OUT);
doc.pipe(out);
doc.end();
out.on('finish', () => {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log('Plan ishrane: ' + OUT + '  (' + kb + ' kB, ' + doc.bufferedPageRange().count + ' strana)');
});
