/**
 * VibeMarket - Plan vezbi sa sipkom
 * Vodic uz proizvod "Traka za vezbanje sa sipkom" (Pilates Studio SF-18).
 *
 * Vezbe su birane tako da se SVE rade upravo ovom spravom: traka se gazi
 * stopalima ili prebacuje preko njih, a sipka se drzi rukama. Otpor se dozira
 * sirinom stava, pa nema potrebe za dodatnim trakama.
 */
const fs = require('fs');
const path = require('path');
const K = require('./kit');
const { C, M, CW } = K;

const OUT = path.join(__dirname, 'out', 'vibemarket-plan-vezbi-sa-sipkom.pdf');

/** Silueta sa sipkom i trakom - crta se na naslovnoj. */
function barIllo(doc, cx, cy) {
  const r = 58;
  doc.save();
  doc.circle(cx, cy, r + 10).lineWidth(1).strokeColor(C.white).strokeOpacity(0.32).stroke();
  doc.circle(cx, cy, r).fillColor(C.white).fillOpacity(0.12).fill().fillOpacity(1);
  doc.strokeColor(C.white).strokeOpacity(0.9).lineWidth(2).lineCap('round').lineJoin('round');

  // sipka
  doc.moveTo(cx - 34, cy - 16).lineTo(cx + 34, cy - 16).stroke();
  doc.lineWidth(3);
  doc.moveTo(cx - 34, cy - 20).lineTo(cx - 34, cy - 12).stroke();
  doc.moveTo(cx + 34, cy - 20).lineTo(cx + 34, cy - 12).stroke();

  // traka: dva luka od sipke do stopala
  doc.lineWidth(1.6).strokeOpacity(0.75);
  doc.moveTo(cx - 22, cy - 16).bezierCurveTo(cx - 30, cy + 6, cx - 26, cy + 20, cx - 16, cy + 30).stroke();
  doc.moveTo(cx + 22, cy - 16).bezierCurveTo(cx + 30, cy + 6, cx + 26, cy + 20, cx + 16, cy + 30).stroke();

  // stopala
  doc.lineWidth(3).strokeOpacity(0.9);
  doc.moveTo(cx - 24, cy + 31).lineTo(cx - 8, cy + 31).stroke();
  doc.moveTo(cx + 8, cy + 31).lineTo(cx + 24, cy + 31).stroke();

  doc.strokeOpacity(1).restore();
}

const doc = K.newDoc({
  title: 'Plan vežbi sa šipkom',
  subject: 'Vodič uz proizvod Traka za vežbanje sa šipkom - VibeMarket',
  accent: C.brand,
});

/**
 * Kartica jedne vezbe. Visina se prvo izmeri pa tek onda crta, da kartica
 * nikad ne bude presecena prelomom strane.
 */
function exercise(doc, n, { name, target, start, steps, sets, tip }) {
  const pad = 13;
  const innerX = M.l + pad + 26;
  const innerW = CW - pad * 2 - 26;

  const hName = 17;
  const hTarget = 14;
  doc.font('reg').fontSize(9.2);
  const hStartLabel = 12;
  const hStart = doc.heightOfString(start, { width: innerW, lineGap: 2.2 });
  const hStepsLabel = 12;
  const hSteps = steps.reduce(
    (s, t) => s + doc.heightOfString(t, { width: innerW - 14, lineGap: 2.2 }) + 4, 0);
  doc.font('semi').fontSize(8.6);
  const hSets = 15;
  doc.font('reg').fontSize(8.6);
  const hTip = doc.heightOfString('Savet: ' + tip, { width: innerW, lineGap: 2.2 }) + 4;

  const h = pad * 2 + hName + hTarget + hStartLabel + hStart + 6 + hStepsLabel + hSteps + 8 + hSets + hTip;
  K.ensure(doc, h + 12);

  const y = doc.y;
  doc.roundedRect(M.l, y, CW, h, 11).fillColor(C.softer).fill();
  doc.roundedRect(M.l, y, CW, h, 11).lineWidth(0.8).strokeColor(C.rule).stroke();
  doc.rect(M.l, y + 14, 3, h - 28).fillColor(doc.accent).fill();

  // broj vezbe
  doc.circle(M.l + pad + 9, y + pad + 9, 10).fillColor(doc.accent).fill();
  doc.font('bold').fontSize(9.5).fillColor(C.white)
     .text(String(n), M.l + pad - 1, y + pad + 5.4, { width: 20, align: 'center' });

  let ty = y + pad;
  doc.font('bold').fontSize(11.5).fillColor(C.ink).text(name, innerX, ty, { width: innerW });
  ty += hName;

  doc.font('semi').fontSize(7.6).fillColor(doc.accent)
     .text('RADI NA: ' + target.toUpperCase(), innerX, ty, { width: innerW, characterSpacing: 0.4 });
  ty += hTarget;

  doc.font('semi').fontSize(8.6).fillColor(C.muted).text('Početni položaj', innerX, ty);
  ty += hStepsLabel;
  doc.font('reg').fontSize(9.2).fillColor(C.body).text(start, innerX, ty, { width: innerW, lineGap: 2.2 });
  ty += hStart + 6;

  doc.font('semi').fontSize(8.6).fillColor(C.muted).text('Izvođenje', innerX, ty);
  ty += hStepsLabel;
  steps.forEach((s, i) => {
    doc.font('semi').fontSize(9).fillColor(doc.accent).text(String(i + 1) + '.', innerX, ty, { width: 12 });
    doc.font('reg').fontSize(9.2).fillColor(C.body)
       .text(s, innerX + 14, ty, { width: innerW - 14, lineGap: 2.2 });
    ty = doc.y + 4;
  });
  ty += 4;

  doc.moveTo(innerX, ty).lineTo(M.l + CW - pad, ty).lineWidth(0.6).strokeColor(C.rule).stroke();
  ty += 5;
  doc.font('semi').fontSize(8.6).fillColor(C.ink).text(sets, innerX, ty, { width: innerW });
  ty += hSets;
  doc.font('semi').fontSize(8.6).fillColor(doc.accent).text('Savet: ', innerX, ty, { continued: true });
  doc.font('reg').fillColor(C.body).text(tip, { width: innerW, lineGap: 2.2 });

  doc.y = y + h + 12;
}

// ── Naslovna ────────────────────────────────────────────────────────────────
K.cover(doc, {
  kicker: 'VODIČ UZ PROIZVOD',
  title: 'Plan vežbi\nsa šipkom',
  lead: 'Dvanaest vežbi za celo telo, podeljenih na dva nivoa i raspoređenih kroz četiri nedelje. Sve se rade samo šipkom i trakom.',
  chips: ['2 nivoa', '12 vežbi', '4 nedelje', 'Bez dodatne opreme'],
  illo: barIllo,
});

K.productBox(doc, {
  title: 'Traka za vežbanje sa šipkom',
  model: 'Model Pilates Studio SF-18  ·  šipka 92 cm  ·  traka 80 cm  ·  guma i aluminijum',
  specs: 'Uz ovaj vodič ide i zaseban PDF sa planom ishrane za četiri nedelje.',
});

K.para(doc,
  'Jedan trening znači svih šest vežbi tog nivoa, redom, sa kratkom pauzom između serija. ' +
  'Prve dve nedelje radite Nivo 1 i učite pokret, druge dve prelazite na Nivo 2. ' +
  'Ceo trening traje između dvadeset i trideset minuta, zajedno sa zagrevanjem i istezanjem.');

K.callout(doc, {
  iconName: 'warn',
  tone: 'warn',
  title: 'Bezbednost pre svega',
  text: 'Pre svakog treninga pregledajte traku — ako primetite pukotinu, zasek ili istanjeno mesto, ne vežbajte. ' +
        'Nikada ne puštajte šipku dok je traka zategnuta i ne vežbajte sa trakom u visini lica. ' +
        'Ako osetite bol, prekinite vežbu.',
});

// ── Podešavanje otpora ──────────────────────────────────────────────────────
K.h2(doc, 'Kako se dozira otpor', 'bar');
K.bullets(doc, [
  ['Širina stava je vaš regulator.', 'Što su stopala šire razmaknuta na traci, traka je zategnutija i otpor je veći. Uži stav znači lakšu vežbu.'],
  ['Traka se gazi sredinom stopala,', 'nikada vrhom prstiju — tako ne može da isklizne tokom pokreta.'],
  ['Hvat na šipci u širini ramena', 'je polazna tačka za većinu vežbi. Širi hvat više uključuje ramena, uži ruke.'],
  ['Otpor je dobro podešen', 'kada poslednja dva ponavljanja u seriji budu teška, ali ih izvedete bez trzaja i bez zadržavanja daha.'],
  ['Disanje:', 'izdah na naporu (kad vučete ili gurate), udah pri vraćanju u početni položaj. Nikada ne zadržavajte dah.'],
]);

// ── Zagrevanje ──────────────────────────────────────────────────────────────
K.h2(doc, 'Zagrevanje — pet minuta pre svakog treninga', 'clock');
K.table(doc, {
  cols: [
    { label: 'Vežba', width: 170 },
    { label: 'Trajanje', width: 74, align: 'center' },
    { label: 'Na šta pazite', width: 258 },
  ],
  rows: [
    ['Hodanje u mestu', '60 s', 'Podignite kolena do visine kukova, ruke prate ritam'],
    ['Kruženje ramenima', '30 s', 'Prvo unazad, pa unapred, laganim tempom'],
    ['Kruženje kukovima', '30 s', 'Šake na kukovima, stopala u širini ramena'],
    ['Zamasi rukama', '45 s', 'Ispred grudi pa u stranu, bez trzaja'],
    ['Poluvčučnjevi bez šipke', '45 s', 'Spuštate se do pola dubine, peta na podu'],
    ['Iskoraci u mestu', '60 s', 'Naizmenično levom pa desnom nogom, kontrolisano'],
  ],
});

// ── Raspored ────────────────────────────────────────────────────────────────
K.h2(doc, 'Nedeljni raspored', 'calendar');
K.para(doc,
  'Između dva treninga ostavite bar jedan dan pauze. Ako vam više odgovaraju drugi dani, slobodno ih pomerite — ' +
  'važno je samo da treninzi ne budu dva dana zaredom.', { after: 12 });
K.table(doc, {
  cols: [
    { label: 'Dan', width: 92 },
    { label: 'Tri treninga nedeljno', width: 200 },
    { label: 'Četiri treninga nedeljno', width: 200 },
  ],
  rows: [
    ['Ponedeljak', 'Trening', 'Trening'],
    ['Utorak', 'Odmor ili šetnja', 'Odmor ili šetnja'],
    ['Sreda', 'Trening', 'Trening'],
    ['Četvrtak', 'Odmor ili šetnja', 'Odmor ili šetnja'],
    ['Petak', 'Trening', 'Trening'],
    ['Subota', 'Odmor', 'Trening'],
    ['Nedelja', 'Odmor', 'Odmor'],
  ],
});

K.h2(doc, 'Napredovanje kroz četiri nedelje', 'spark');
K.table(doc, {
  cols: [
    { label: 'Nedelja', width: 62 },
    { label: 'Nivo', width: 96 },
    { label: 'Serije', width: 74, align: 'center' },
    { label: 'Šta je fokus', width: 260 },
  ],
  rows: [
    ['1', 'Nivo 1', '2 serije', 'Učite pokret. Radite lakšim otporom nego što možete — cilj je tehnika, ne umor.'],
    ['2', 'Nivo 1', '3 serije', 'Isti pokreti, jedna serija više. Proširite stav za nijansu da otpor poraste.'],
    ['3', 'Nivo 2', '2–3 serije', 'Prelazite na složenije vežbe. Prvi trening uradite sa dve serije, ostale sa tri.'],
    ['4', 'Nivo 2', '3 serije', 'Spuštanje tereta usporite na tri sekunde. Isti broj ponavljanja postaje osetno teži.'],
  ],
});

// ── NIVO 1 ──────────────────────────────────────────────────────────────────
K.h2(doc, 'Nivo 1 — početnik  ·  nedelje 1 i 2', 'body');
K.para(doc,
  'Šest osnovnih pokreta koji zajedno pokrivaju noge, leđa, grudi, ramena, ruke i trup. ' +
  'Pauza između serija je 45 do 60 sekundi.', { after: 12 });

exercise(doc, 1, {
  name: 'Čučanj sa šipkom',
  target: 'noge i zadnjica',
  start: 'Stanite sredinom stopala na traku, stopala u širini kukova. Šipku držite ispred butina, hvat u širini ramena.',
  steps: [
    'Udahnite i spustite kukove unazad, kao da sedate na stolicu iza sebe.',
    'Kolena prate pravac stopala, kičma ostaje prava, pogled napred.',
    'Izdahnite i vratite se u uspravan stav, stiskajući zadnjicu na vrhu pokreta.',
  ],
  sets: '3 serije × 10–12 ponavljanja   ·   pauza 45–60 s',
  tip: 'Peta ostaje na podu celo vreme. Ako se odiže, spuštajte se pliće — dubina dolazi sama za nedelju dana.',
});

exercise(doc, 2, {
  name: 'Veslanje',
  target: 'leđa, zadnja strana ramena i biceps',
  start: 'Stanite na traku, blago savijte kolena i nagnite trup napred oko trideset stepeni, ravnih leđa. Šipka visi ispred kolena.',
  steps: [
    'Povucite šipku ka donjem delu stomaka, laktovi klize tik uz telo.',
    'Na kraju pokreta stisnite lopatice jednu ka drugoj i zadržite pola sekunde.',
    'Kontrolisano vratite šipku nadole, ali ne opuštajte traku do kraja.',
  ],
  sets: '3 serije × 10–12 ponavljanja   ·   pauza 45–60 s',
  tip: 'Vučete laktovima, ne šakama. Vrat ostaje u produžetku kičme — ne dižite pogled ka gore.',
});

exercise(doc, 3, {
  name: 'Biceps pregib',
  target: 'prednja loža nadlaktice',
  start: 'Uspravan stav na traci, šipka u visini butina, dlanovi okrenuti napred, laktovi uz rebra.',
  steps: [
    'Savijajte laktove i podižite šipku ka ramenima, bez pomeranja nadlaktica.',
    'Zadržite kratko u gornjem položaju, gde je otpor najveći.',
    'Spuštajte polako, brojeći do tri, sve do potpuno ispruženih ruku.',
  ],
  sets: '3 serije × 12 ponavljanja   ·   pauza 45 s',
  tip: 'Ako morate da se njišete trupom da biste podigli šipku, otpor je prevelik — suzite stav.',
});

exercise(doc, 4, {
  name: 'Potisak iznad glave',
  target: 'ramena i triceps',
  start: 'Stanite na traku, šipku držite u visini ključne kosti, hvat malo širi od ramena.',
  steps: [
    'Izdahnite i potisnite šipku pravo naviše, dok se laktovi skoro ne isprave.',
    'Rebra držite spuštena, a stomak lagano uvučen, da donja leđa ostanu neutralna.',
    'Udahnite i vratite šipku nazad u visinu ključne kosti.',
  ],
  sets: '3 serije × 10 ponavljanja   ·   pauza 60 s',
  tip: 'Stisnite zadnjicu tokom celog pokreta. To sprečava izvijanje u krstima, najčešću grešku kod ove vežbe.',
});

exercise(doc, 5, {
  name: 'Rumunsko mrtvo dizanje',
  target: 'zadnja loža buta, zadnjica i donja leđa',
  start: 'Stopala u širini kukova na traci, kolena blago savijena, šipka ispred butina.',
  steps: [
    'Gurajte kukove unazad i spuštajte šipku klizeći je niz prednju stranu nogu.',
    'Leđa ostaju prava; spuštajte se dok ne osetite istezanje zadnje lože buta.',
    'Izdahnite i vratite se uspravno, gurajući kukove napred.',
  ],
  sets: '3 serije × 10 ponavljanja   ·   pauza 60 s',
  tip: 'Ovo nije čučanj — kolena se skoro ne savijaju dodatno. Ceo pokret vode kukovi.',
});

exercise(doc, 6, {
  name: 'Rotacija trupa',
  target: 'kosi trbušni mišići',
  start: 'Stanite bočno, jednim stopalom na kraj trake. Šipku držite sa obe ruke pored kuka sa strane na kojoj je stopalo.',
  steps: [
    'Vodite šipku dijagonalno naviše, preko tela, ka suprotnom ramenu.',
    'Pokret dolazi iz trupa, ruke ostaju blago savijene i ne vuku same.',
    'Kontrolisano se vratite u početni položaj, pa ponovite sve na drugu stranu.',
  ],
  sets: '3 serije × 10 ponavljanja po strani   ·   pauza 45 s',
  tip: 'Kukovi se okreću zajedno sa trupom. Ako ostanu ukočeni, opterećenje pada na kolena.',
});

// ── NIVO 2 ──────────────────────────────────────────────────────────────────
K.h2(doc, 'Nivo 2 — napredniji  ·  nedelje 3 i 4', 'spark');
K.para(doc,
  'Iste mišićne grupe, ali kroz složenije pokrete: jedna noga ili ruka umesto dve, i kombinacije ' +
  'koje spajaju dve vežbe u jednu. Pauza između serija je 60 sekundi.', { after: 12 });

exercise(doc, 7, {
  name: 'Iskorak sa šipkom',
  target: 'noge, zadnjica i stabilizacija',
  start: 'Prednje stopalo na traci, zadnja noga korak unazad na prstima. Šipku držite ispred butina.',
  steps: [
    'Spuštajte zadnje koleno ka podu dok oba kolena ne budu savijena oko devedeset stepeni.',
    'Trup ostaje uspravan, težina na peti prednje noge.',
    'Odgurnite se prednjom petom nazad u početni položaj. Uradite sva ponavljanja na jednoj nozi, pa promenite.',
  ],
  sets: '3 serije × 8–10 ponavljanja po nozi   ·   pauza 60 s',
  tip: 'Ako gubite ravnotežu, skratite korak i zadržite pogled na jednoj tački ispred sebe.',
});

exercise(doc, 8, {
  name: 'Čučanj sa potiskom',
  target: 'celo telo — noge, ramena i trup',
  start: 'Stanite na traku, stopala u širini kukova, šipka u visini ključne kosti.',
  steps: [
    'Spustite se u čučanj, držeći šipku uz grudi.',
    'Dok se podižete, nastavite pokret naviše i potisnite šipku iznad glave.',
    'Spustite šipku nazad u visinu grudi i odmah krenite u sledeće ponavljanje.',
  ],
  sets: '3 serije × 8–10 ponavljanja   ·   pauza 60 s',
  tip: 'Potisak počinje čim se ispravite — to je jedan tečan pokret, a ne dva odvojena.',
});

exercise(doc, 9, {
  name: 'Veslanje jednom rukom',
  target: 'leđa, uz ispravljanje razlike između strana',
  start: 'Stanite jednim stopalom na traku, trup nagnut napred, šipku uhvatite jednom rukom po sredini.',
  steps: [
    'Povucite šipku ka kuku sa strane ruke koja radi, lakat klizi uz telo.',
    'Stisnite lopaticu na kraju pokreta, bez okretanja ramena ka gore.',
    'Kontrolisano spustite i uradite sva ponavljanja, pa promenite ruku.',
  ],
  sets: '3 serije × 10 ponavljanja po ruci   ·   pauza 60 s',
  tip: 'Slabija strana uvek radi prva, a jača strana radi isti broj ponavljanja — tako se razlika smanjuje.',
});

exercise(doc, 10, {
  name: 'Prednje podizanje sa zadrškom',
  target: 'prednja strana ramena',
  start: 'Uspravan stav na traci, šipka ispred butina, ruke ispružene, hvat u širini ramena.',
  steps: [
    'Podignite ispruženu šipku napred do visine ramena.',
    'Zadržite dve sekunde u gornjem položaju, bez podizanja ramena ka ušima.',
    'Spuštajte polako, brojeći do tri.',
  ],
  sets: '3 serije × 10 ponavljanja   ·   pauza 60 s',
  tip: 'Ne dižite šipku iznad visine ramena. Više od toga ne dodaje ništa, a opterećuje zglob ramena.',
});

exercise(doc, 11, {
  name: 'Triceps ekstenzija iznad glave',
  target: 'zadnja loža nadlaktice',
  start: 'Stanite na traku, podignite šipku iza glave tako da su laktovi savijeni i usmereni ka gore.',
  steps: [
    'Ispravljajte laktove i podižite šipku iznad glave, bez pomeranja nadlaktica.',
    'Laktovi ostaju blizu glave celo vreme.',
    'Polako savijte laktove i vratite šipku iza glave, do prijatnog istezanja.',
  ],
  sets: '3 serije × 10–12 ponavljanja   ·   pauza 60 s',
  tip: 'Ako vam je neudobno u ramenima, uhvatite šipku šire — pokret odmah postaje prirodniji.',
});

exercise(doc, 12, {
  name: 'Pilates „stoti” sa šipkom',
  target: 'dubok trbušni zid',
  start: 'Lezite na leđa, prebacite traku preko stopala i podignite noge tako da su kolena savijena pod pravim uglom. Šipku držite ispruženim rukama iznad butina.',
  steps: [
    'Podignite glavu i ramena od poda, pogled usmerite ka kolenima.',
    'Ispruženim rukama pravite male brze zamahe gore-dole, sa malom amplitudom.',
    'Udahnite tokom pet zamaha, izdahnite tokom sledećih pet — to je jedan ciklus.',
  ],
  sets: '2 serije × 10 ciklusa   ·   pauza 60 s',
  tip: 'Donja leđa ostaju prislonjena uz pod. Ako se odižu, privucite kolena bliže grudima.',
});

// ── Istezanje ───────────────────────────────────────────────────────────────
K.h2(doc, 'Istezanje — pet minuta posle treninga', 'moon');
K.table(doc, {
  cols: [
    { label: 'Istezanje', width: 176 },
    { label: 'Trajanje', width: 74, align: 'center' },
    { label: 'Kako', width: 252 },
  ],
  rows: [
    ['Zadnja loža buta', '30 s po nozi', 'Sedeći, jedna noga ispružena, blago se naginjete ka stopalu'],
    ['Prednja loža buta', '30 s po nozi', 'Stojeći, privučete petu ka zadnjici, kolena jedno uz drugo'],
    ['Grudi i prednja ramena', '30 s', 'Ruke spojite iza leđa i lagano ih podignite'],
    ['Leđa — mačka i krava', '45 s', 'U položaju na četvorke naizmenično grbite i uvijate leđa'],
    ['Triceps', '20 s po ruci', 'Lakat iza glave, drugom rukom lagano pritisnete nadole'],
    ['Bočno istezanje trupa', '20 s po strani', 'Stojeći, ruka preko glave, naginjete se u suprotnu stranu'],
  ],
});

// ── Dnevnik ─────────────────────────────────────────────────────────────────
K.h2(doc, 'Dnevnik treninga', 'list');
K.para(doc,
  'Označite svaki obavljen trening. Četiri polja u nedelji su gornja granica, tri su sasvim dovoljna — ' +
  'popunjeno polje znači obavljen trening, ne savršen trening.', { after: 12 });
K.tracker(doc, {
  rowLabels: ['Nedelja 1', 'Nedelja 2', 'Nedelja 3', 'Nedelja 4'],
  colLabels: ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'],
});

K.para(doc,
  'Posle četvrte nedelje krenite ponovo od Nivoa 2, ali sa širim stavom na traci. Isti pokreti sa većim ' +
  'otporom su sledeći korak — nove vežbe nisu potrebne.', { after: 10 });

K.disclaimer(doc,
  'Napomena. Ovaj vodič je informativnog karaktera i ne predstavlja medicinski savet, dijagnozu ni terapiju, ' +
  'niti zamenjuje rad sa fizioterapeutom ili licenciranim trenerom. Ako imate povredu, bol u kičmi, ' +
  'zglobovima ili ramenima, povišen krvni pritisak, oboljenje srca, ako ste trudni ili se oporavljate od ' +
  'operacije — posavetujte se sa lekarom pre nego što počnete da vežbate. Osobe mlađe od 18 godina neka ' +
  'vežbaju uz nadzor odrasle osobe. Pre svakog treninga pregledajte traku i spojeve; oštećenu traku ne ' +
  'koristite. Prekinite vežbanje i obratite se lekaru ako osetite bol, vrtoglavicu, nedostatak vazduha ili ' +
  'bol u grudima. VibeMarket ne snosi odgovornost za povrede nastale nepravilnom ili nenadziranom upotrebom sprave.');

// ── Izlaz ───────────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUT), { recursive: true });
K.paginate(doc);
const out = fs.createWriteStream(OUT);
doc.pipe(out);
doc.end();
out.on('finish', () => {
  console.log('Plan vežbi: ' + OUT + '  (' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' kB)');
});
