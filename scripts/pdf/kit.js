/**
 * Zajednicki brend-kit za VibeMarket PDF vodice.
 *
 * Emodziji se NAMERNO ne koriste unutar PDF-a: Inter nema glifove za njih, pa bi
 * se iscrtali kao prazni kvadrati. Umesto toga ikone se crtaju vektorski.
 */
const PDFDocument = require('pdfkit');
const path = require('path');

const TTF = (n) => path.join(__dirname, 'fonts', 'inter', 'extras', 'ttf', n);
const FONT = {
  reg: TTF('Inter-Regular.ttf'),
  med: TTF('Inter-Medium.ttf'),
  semi: TTF('Inter-SemiBold.ttf'),
  bold: TTF('Inter-Bold.ttf'),
  disp: TTF('InterDisplay-Bold.ttf'),
  dispSemi: TTF('InterDisplay-SemiBold.ttf'),
};

const C = {
  brand: '#1652BE', light: '#2E6FE6', dark: '#0F3E9A', deep: '#0A2A6B',
  ink: '#101B33', body: '#33415C', muted: '#6B7A94',
  rule: '#E2E9F6', soft: '#F5F8FE', softer: '#FAFCFF', white: '#FFFFFF',
};

const PAGE = { w: 595.28, h: 841.89 };
const M = { l: 52, r: 52, t: 74, b: 64 };
const CW = PAGE.w - M.l - M.r;

function newDoc({ title, subject, accent }) {
  const doc = new PDFDocument({
    size: 'A4', margin: 0, autoFirstPage: false, bufferPages: true,
    info: { Title: title, Author: 'VibeMarket', Subject: subject, Creator: 'VibeMarket' },
  });
  for (const [k, v] of Object.entries(FONT)) doc.registerFont(k, v);
  doc.accent = accent || C.brand;
  doc.runningTitle = title;
  doc.chrome = false;
  doc.on('pageAdded', () => {
    doc.y = M.t;
    if (doc.chrome) drawChrome(doc);
  });
  return doc;
}

/** Zaglavlje i podnozje sadrzajnih strana. */
function drawChrome(doc) {
  doc.save();
  doc.font('semi').fontSize(7.5).fillColor(C.muted)
     .text('VIBEMARKET', M.l, 40, { width: CW, align: 'left', characterSpacing: 0.8 });
  doc.font('reg').fontSize(7.5).fillColor(C.muted)
     .text(doc.runningTitle.toUpperCase(), M.l, 40, { width: CW, align: 'right' });
  doc.moveTo(M.l, 54).lineTo(PAGE.w - M.r, 54).lineWidth(0.7).strokeColor(C.rule).stroke();
  doc.moveTo(M.l, 54).lineTo(M.l + 44, 54).lineWidth(1.6).strokeColor(doc.accent).stroke();
  doc.moveTo(M.l, PAGE.h - 46).lineTo(PAGE.w - M.r, PAGE.h - 46).lineWidth(0.7).strokeColor(C.rule).stroke();
  doc.font('reg').fontSize(7.5).fillColor(C.muted)
     .text('vibemarket.space', M.l, PAGE.h - 38, { width: CW, align: 'left' });
  doc.restore();
  doc.y = M.t;
}

/** Brojeve strana upisujemo na kraju, kad znamo ukupan broj. Naslovna se ne broji. */
function paginate(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 1; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    doc.font('reg').fontSize(7.5).fillColor(C.muted)
       .text(i + ' / ' + (range.count - 1), M.l, PAGE.h - 38, { width: CW, align: 'right' });
  }
}

const room = (doc) => PAGE.h - M.b - doc.y;
function ensure(doc, need) {
  if (room(doc) < need) doc.addPage();
}

// Ikone -----------------------------------------------------------------------
/** Prosta linijska ikona u krugu. r = poluprecnik kruga. */
function icon(doc, name, cx, cy, r, color) {
  doc.save();
  doc.circle(cx, cy, r).fillColor(color).fillOpacity(0.10).fill().fillOpacity(1);
  doc.lineWidth(1.35).strokeColor(color).lineCap('round').lineJoin('round');
  const s = r * 0.52;
  const glyphs = {
    plate: () => {
      doc.circle(cx, cy, s).stroke();
      doc.moveTo(cx, cy - s).lineTo(cx, cy + s).stroke();
      doc.moveTo(cx, cy).lineTo(cx + s, cy).stroke();
    },
    drop: () => {
      doc.moveTo(cx, cy - s * 1.15)
         .bezierCurveTo(cx + s, cy - s * 0.1, cx + s * 0.78, cy + s, cx, cy + s)
         .bezierCurveTo(cx - s * 0.78, cy + s, cx - s, cy - s * 0.1, cx, cy - s * 1.15).stroke();
    },
    moon: () => {
      doc.moveTo(cx + s * 0.55, cy - s * 0.9)
         .bezierCurveTo(cx - s * 0.55, cy - s * 0.75, cx - s * 0.55, cy + s * 0.75, cx + s * 0.55, cy + s * 0.9)
         .bezierCurveTo(cx - s * 1.25, cy + s * 0.55, cx - s * 1.25, cy - s * 0.55, cx + s * 0.55, cy - s * 0.9).stroke();
    },
    clock: () => {
      doc.circle(cx, cy, s).stroke();
      doc.moveTo(cx, cy - s * 0.55).lineTo(cx, cy).lineTo(cx + s * 0.45, cy + s * 0.2).stroke();
    },
    check: () => {
      doc.moveTo(cx - s * 0.7, cy).lineTo(cx - s * 0.15, cy + s * 0.55).lineTo(cx + s * 0.75, cy - s * 0.6).stroke();
    },
    bar: () => {
      doc.moveTo(cx - s, cy).lineTo(cx + s, cy).stroke();
      doc.rect(cx - s * 1.15, cy - s * 0.6, s * 0.42, s * 1.2).stroke();
      doc.rect(cx + s * 0.73, cy - s * 0.6, s * 0.42, s * 1.2).stroke();
    },
    list: () => {
      for (let i = -1; i <= 1; i++) {
        const y = cy + i * s * 0.62;
        doc.circle(cx - s * 0.75, y, 0.9).fillColor(color).fill();
        doc.moveTo(cx - s * 0.3, y).lineTo(cx + s * 0.85, y).strokeColor(color).stroke();
      }
    },
    warn: () => {
      doc.moveTo(cx, cy - s).lineTo(cx + s * 0.95, cy + s * 0.7).lineTo(cx - s * 0.95, cy + s * 0.7).closePath().stroke();
      doc.moveTo(cx, cy - s * 0.25).lineTo(cx, cy + s * 0.15).stroke();
      doc.circle(cx, cy + s * 0.42, 0.75).fillColor(color).fill();
    },
    cart: () => {
      doc.moveTo(cx - s * 0.95, cy - s * 0.6).lineTo(cx - s * 0.5, cy - s * 0.6)
         .lineTo(cx - s * 0.1, cy + s * 0.35).lineTo(cx + s * 0.85, cy + s * 0.35).stroke();
      doc.moveTo(cx - s * 0.35, cy - s * 0.1).lineTo(cx + s * 0.95, cy - s * 0.1).stroke();
      doc.circle(cx - s * 0.05, cy + s * 0.8, 1).fillColor(color).fill();
      doc.circle(cx + s * 0.75, cy + s * 0.8, 1).fillColor(color).fill();
    },
    calendar: () => {
      doc.roundedRect(cx - s * 0.95, cy - s * 0.8, s * 1.9, s * 1.7, 1.5).stroke();
      doc.moveTo(cx - s * 0.95, cy - s * 0.25).lineTo(cx + s * 0.95, cy - s * 0.25).stroke();
      doc.moveTo(cx - s * 0.45, cy - s * 1.1).lineTo(cx - s * 0.45, cy - s * 0.55).stroke();
      doc.moveTo(cx + s * 0.45, cy - s * 1.1).lineTo(cx + s * 0.45, cy - s * 0.55).stroke();
    },
    spark: () => {
      doc.moveTo(cx, cy - s).lineTo(cx + s * 0.28, cy - s * 0.28).lineTo(cx + s, cy)
         .lineTo(cx + s * 0.28, cy + s * 0.28).lineTo(cx, cy + s).lineTo(cx - s * 0.28, cy + s * 0.28)
         .lineTo(cx - s, cy).lineTo(cx - s * 0.28, cy - s * 0.28).closePath().stroke();
    },
    body: () => {
      doc.circle(cx, cy - s * 0.62, s * 0.3).stroke();
      doc.moveTo(cx, cy - s * 0.3).lineTo(cx, cy + s * 0.3).stroke();
      doc.moveTo(cx - s * 0.8, cy).lineTo(cx + s * 0.8, cy).stroke();
      doc.moveTo(cx, cy + s * 0.3).lineTo(cx - s * 0.55, cy + s).stroke();
      doc.moveTo(cx, cy + s * 0.3).lineTo(cx + s * 0.55, cy + s).stroke();
    },
  };
  const g = glyphs[name];
  if (g) g();
  doc.restore();
}

// Naslovna strana -------------------------------------------------------------
function cover(doc, { kicker, title, lead, chips, illo }) {
  doc.addPage();
  const bandH = 300;
  const grad = doc.linearGradient(0, 0, PAGE.w, bandH);
  grad.stop(0, C.light).stop(0.55, C.brand).stop(1, C.deep);
  doc.rect(0, 0, PAGE.w, bandH).fill(grad);

  doc.save().fillColor(C.white).fillOpacity(0.07)
     .circle(PAGE.w - 40, 44, 108).fill()
     .circle(46, bandH - 26, 74).fill()
     .fillOpacity(0.05).circle(PAGE.w - 128, bandH - 12, 52).fill().restore();

  doc.font('disp').fontSize(20).fillColor(C.white)
     .text('VibeMarket', M.l, 54, { characterSpacing: -0.3 });
  doc.font('reg').fontSize(8).fillColor(C.white).opacity(0.78)
     .text(kicker, M.l, 82, { characterSpacing: 1.4 });
  doc.opacity(1);

  doc.font('disp').fontSize(33).fillColor(C.white)
     .text(title, M.l, 124, { width: CW - 150, lineGap: 2, characterSpacing: -0.8 });
  doc.font('reg').fontSize(11.5).fillColor(C.white).opacity(0.9)
     .text(lead, M.l, doc.y + 12, { width: CW - 160, lineGap: 3.5 });
  doc.opacity(1);

  if (illo) illo(doc, PAGE.w - 132, 168);

  const cy = bandH + 32;
  doc.font('semi').fontSize(8.5);
  let cx = M.l;
  for (const chip of chips) {
    const w = doc.widthOfString(chip, { characterSpacing: 0.4 }) + 22;
    doc.roundedRect(cx, cy, w, 21, 10.5).fillColor(C.soft).fill();
    doc.fillColor(C.brand).text(chip, cx + 11, cy + 6.4, { characterSpacing: 0.4, lineBreak: false });
    cx += w + 8;
  }
  doc.y = cy + 44;
  // Naslovna nema zaglavlje; sve sledece strane ga dobijaju automatski.
  doc.chrome = true;
}

/** Kartica "uz koji proizvod ide ovaj vodic". */
function productBox(doc, { title, model, specs }) {
  const h = 86;
  ensure(doc, h + 16);
  const y = doc.y;
  doc.roundedRect(M.l, y, CW, h, 12).fillColor(C.softer).fill();
  doc.roundedRect(M.l, y, CW, h, 12).lineWidth(0.8).strokeColor(C.rule).stroke();
  doc.rect(M.l, y + 12, 3, h - 24).fillColor(doc.accent).fill();

  doc.font('semi').fontSize(7.5).fillColor(C.muted)
     .text('VODIČ UZ PROIZVOD', M.l + 20, y + 16, { characterSpacing: 1 });
  doc.font('bold').fontSize(13).fillColor(C.ink).text(title, M.l + 20, y + 31);
  doc.font('reg').fontSize(9).fillColor(C.body).text(model, M.l + 20, y + 50);
  doc.font('reg').fontSize(8.5).fillColor(C.muted).text(specs, M.l + 20, y + 65);
  doc.y = y + h + 20;
}

// Tipografija -----------------------------------------------------------------
function h2(doc, text, iconName) {
  ensure(doc, 80);
  const y = doc.y;
  if (iconName) icon(doc, iconName, M.l + 11, y + 10, 11, doc.accent);
  doc.font('disp').fontSize(15.5).fillColor(C.ink)
     .text(text, M.l + (iconName ? 32 : 0), y + 1,
           { width: CW - (iconName ? 32 : 0), characterSpacing: -0.2 });
  const bottom = Math.max(doc.y, y + 22);
  doc.moveTo(M.l, bottom + 7).lineTo(PAGE.w - M.r, bottom + 7).lineWidth(0.7).strokeColor(C.rule).stroke();
  doc.y = bottom + 17;
}

function h3(doc, text) {
  ensure(doc, 44);
  doc.font('semi').fontSize(10.5).fillColor(doc.accent).text(text, M.l, doc.y, { width: CW });
  doc.y += 5;
}

function para(doc, text, opt = {}) {
  const w = opt.width || CW;
  doc.font(opt.font || 'reg').fontSize(opt.size || 9.8).fillColor(opt.color || C.body);
  ensure(doc, doc.heightOfString(text, { width: w, lineGap: 3 }) + 6);
  doc.text(text, opt.x || M.l, doc.y, { width: w, lineGap: opt.lineGap ?? 3 });
  doc.y += opt.after ?? 10;
}

function bullets(doc, items, opt = {}) {
  const x = opt.x || M.l;
  const w = (opt.width || CW) - 15;
  for (const item of items) {
    const [head, rest] = Array.isArray(item) ? item : [null, item];
    doc.font('reg').fontSize(9.6);
    const h = doc.heightOfString(head ? head + ' ' + rest : rest, { width: w, lineGap: 2.5 }) + 8;
    ensure(doc, h);
    const y = doc.y;
    doc.circle(x + 3, y + 5.4, 2).fillColor(doc.accent).fill();
    if (head) {
      doc.font('semi').fillColor(C.ink).text(head, x + 15, y, { width: w, continued: true, lineGap: 2.5 });
      doc.font('reg').fillColor(C.body).text(' ' + rest, { width: w, lineGap: 2.5 });
    } else {
      doc.font('reg').fillColor(C.body).text(rest, x + 15, y, { width: w, lineGap: 2.5 });
    }
    doc.y += 5;
  }
  doc.y += 4;
}

/** Istaknuti okvir (napomena, upozorenje, savet). */
function callout(doc, { title, text, tone = 'info', iconName = 'warn' }) {
  const tint = tone === 'warn' ? '#B4540A' : doc.accent;
  const pad = 14;
  doc.font('reg').fontSize(9.3);
  const tw = CW - pad * 2 - 26;
  const h = doc.heightOfString(text, { width: tw, lineGap: 2.6 }) + pad * 2 + (title ? 15 : 0);
  ensure(doc, h + 12);
  const y = doc.y;
  doc.roundedRect(M.l, y, CW, h, 10).fillColor(tint).fillOpacity(0.055).fill().fillOpacity(1);
  doc.roundedRect(M.l, y, CW, h, 10).lineWidth(0.8).strokeColor(tint).strokeOpacity(0.28).stroke().strokeOpacity(1);
  icon(doc, iconName, M.l + pad + 8, y + pad + 6, 9.5, tint);
  let ty = y + pad;
  if (title) {
    doc.font('semi').fontSize(9.8).fillColor(tint).text(title, M.l + pad + 26, ty, { width: tw });
    ty += 15;
  }
  doc.font('reg').fontSize(9.3).fillColor(C.body).text(text, M.l + pad + 26, ty, { width: tw, lineGap: 2.6 });
  doc.y = y + h + 14;
}

// Tabela ----------------------------------------------------------------------
/**
 * cols: [{ label, width, align?, font? }]   rows: string[][]
 * Zaglavlje se ponavlja kad tabela predje na novu stranu.
 */
function table(doc, { cols, rows, zebra = true, headFill }) {
  const total = cols.reduce((s, c) => s + c.width, 0);
  const w = cols.map((c) => (c.width / total) * CW);
  const pad = 7;
  const fill = headFill || doc.accent;

  const drawHead = () => {
    const y = doc.y;
    doc.roundedRect(M.l, y, CW, 24, 5).fillColor(fill).fill();
    let x = M.l;
    doc.font('semi').fontSize(8.4).fillColor(C.white);
    cols.forEach((c, i) => {
      doc.text(c.label, x + pad, y + 7.6, { width: w[i] - pad * 2, align: c.align || 'left', ellipsis: true });
      x += w[i];
    });
    doc.y = y + 24;
  };

  ensure(doc, 80);
  drawHead();

  rows.forEach((row, ri) => {
    doc.font('reg').fontSize(8.8);
    const rh = Math.max(...row.map((cell, i) =>
      doc.heightOfString(String(cell), { width: w[i] - pad * 2, lineGap: 1.8 }))) + pad * 2 - 2;
    if (room(doc) < rh + 6) { doc.addPage(); drawHead(); }
    const y = doc.y;
    if (zebra && ri % 2 === 1) doc.rect(M.l, y, CW, rh).fillColor(C.softer).fill();
    let x = M.l;
    row.forEach((cell, i) => {
      const c = cols[i];
      doc.font(c.font || (i === 0 ? 'semi' : 'reg')).fontSize(8.8)
         .fillColor(i === 0 ? C.ink : C.body)
         .text(String(cell), x + pad, y + pad - 1,
               { width: w[i] - pad * 2, align: c.align || 'left', lineGap: 1.8 });
      x += w[i];
    });
    doc.moveTo(M.l, y + rh).lineTo(PAGE.w - M.r, y + rh).lineWidth(0.6).strokeColor(C.rule).stroke();
    doc.y = y + rh;
  });
  doc.y += 14;
}

/** Mreza praznih polja koju kupac sam popunjava. */
function tracker(doc, { rowLabels, colLabels, labelWidth = 96 }) {
  const cellW = (CW - labelWidth) / colLabels.length;
  const rowH = 22;
  ensure(doc, rowH * (rowLabels.length + 1) + 16);
  let y = doc.y;
  doc.font('semi').fontSize(8).fillColor(C.muted);
  colLabels.forEach((c, i) => {
    doc.text(c, M.l + labelWidth + i * cellW, y + 6, { width: cellW, align: 'center' });
  });
  y += rowH;
  rowLabels.forEach((label, ri) => {
    if (ri % 2 === 1) doc.rect(M.l, y, CW, rowH).fillColor(C.softer).fill();
    doc.font('semi').fontSize(8.6).fillColor(C.ink).text(label, M.l + 2, y + 6.5, { width: labelWidth - 8 });
    for (let i = 0; i < colLabels.length; i++) {
      const cx = M.l + labelWidth + i * cellW + cellW / 2;
      doc.roundedRect(cx - 6.5, y + 4.5, 13, 13, 3).lineWidth(0.8).strokeColor(C.rule).stroke();
    }
    y += rowH;
  });
  doc.moveTo(M.l, y).lineTo(PAGE.w - M.r, y).lineWidth(0.6).strokeColor(C.rule).stroke();
  doc.y = y + 12;
}

/** Zavrsna napomena na dnu poslednje strane. */
function disclaimer(doc, text) {
  doc.font('reg').fontSize(8).fillColor(C.muted);
  const h = doc.heightOfString(text, { width: CW - 24, lineGap: 2.4 }) + 18;
  ensure(doc, h + 4);
  const y = doc.y;
  doc.roundedRect(M.l, y, CW, h, 8).fillColor(C.soft).fill();
  doc.fillColor(C.muted).text(text, M.l + 12, y + 9, { width: CW - 24, lineGap: 2.4 });
  doc.y = y + h + 10;
}

module.exports = {
  PDFDocument, newDoc, drawChrome, paginate, cover, productBox, h2, h3, para,
  bullets, callout, table, tracker, disclaimer, icon, ensure, room,
  C, M, CW, PAGE,
};
