/**
 * Sanitizacija HTML-a za opise proizvoda.
 *
 * Ne FILTRIRA ulazni HTML nego ga RE-SERIJALIZUJE: tokenizuje ga i emituje isključivo
 * kanonske tagove bez atributa iz fiksne liste, uz eskejpovanje svakog tekstualnog čvora.
 * Pošto se izlaz gradi a ne prepisuje, ne postoji površina za napad preko atributa
 * (onerror, href="javascript:", style) ni preko egzotičnih entiteta.
 *
 * Lista tagova je namerno ista kao ono što CSS stilizuje u
 * app/products/[handle]/product.module.css (.topDescriptionText p/strong/h3/ul/li).
 * Sve van toga bi se renderovalo nestilizovano ili bi prelilo karticu.
 *
 * Bitno: ProductDetailClient.splitDescriptionSections deli opis regexom /<h3>(.*?)<\/h3>/,
 * dakle po literalnom <h3> bez atributa. Kanonski emiter to garantuje.
 */

const ALLOWED_TAGS = new Set([
  'p', 'strong', 'em', 'u', 's', 'h3', 'ul', 'ol', 'li', 'br', 'img', 'span',
]);
const VOID_TAGS = new Set(['br', 'img']);

/**
 * Jedine dozvoljene klase - fiksne veličine teksta. Proizvoljna `class` vrednost
 * bi dozvolila kačenje na tuđe stilove, a inline `style` je zabranjen u potpunosti.
 */
const SIZE_CLASS = /^ds-(sm|lg|xl)$/;

/**
 * Slike smeju da pokazuju SAMO na našu memoriju. Time otpadaju `javascript:`,
 * `data:` (SVG u data URI je izvršiv) i hotlink na tuđi CDN koji pukne kad ga rotiraju.
 */
function safeImageSrc(raw: string): string | null {
  const src = raw.trim();
  if (/^\/uploads\/[A-Za-z0-9._-]+$/.test(src)) return src;
  try {
    const url = new URL(src);
    if (url.protocol !== 'https:') return null;
    if (url.hostname.endsWith('.public.blob.vercel-storage.com')) return url.toString();
  } catch {
    /* nije apsolutan URL */
  }
  return null;
}

/** Iz sirovog tag stringa izvlači atribute; vrednosti ostaju neproverene. */
function readAttributes(rawTag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawTag)) !== null) {
    attrs[m[1].toLowerCase()] = m[3] ?? m[4] ?? m[5] ?? '';
  }
  return attrs;
}

/** Blokovi kod kojih se briše i sadržaj, ne samo tag. */
const DROP_WITH_CONTENT = /<(script|style|noscript|iframe|object|embed|template|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const COMMENTS = /<!--[\s\S]*?-->/g;
/** Neupareni otvarajući <script>/<style> bez zatvaranja - odseci do kraja. */
const DROP_DANGLING = /<(script|style|noscript|iframe|object|embed|template|svg|math)\b[\s\S]*$/i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  bull: '•',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  deg: '°',
  times: '×',
  copy: '©',
  reg: '®',
  trade: '™',
  euro: '€',
  middot: '·',
  shy: '',
  zwnj: '',
  zwj: '',
};

const ENTITY_RE = /&(#[xX]?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g;

function decodeEntities(input: string): string {
  return input.replace(ENTITY_RE, (full, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return full;
      // Surrogate polovine nisu validne same za sebe
      if (code >= 0xd800 && code <= 0xdfff) return full;
      try {
        return String.fromCodePoint(code);
      } catch {
        return full;
      }
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : full;
  });
}

/** Eskejpuje tekstualni čvor. Atributa nema u izlazu, pa su navodnici bezopasni. */
export function escapeHtml(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function stripDangerousBlocks(input: string): string {
  return input.replace(COMMENTS, '').replace(DROP_WITH_CONTENT, '').replace(DROP_DANGLING, '');
}

function collapseEmpty(html: string): string {
  let cur = html;
  let prev: string;
  do {
    prev = cur;
    cur = cur
      .replace(/<(p|h3|ul|ol|li|strong|em|u|s)>\s*<\/\1>/g, '')
      .replace(/<span class="[^"]*">\s*<\/span>/g, '');
  } while (cur !== prev);
  return cur;
}

/**
 * Vraća HTML sveden na dozvoljenu listu tagova. Jedini atributi koji prežive su
 * `src` na <img> (i to samo ka našoj memoriji) i `class` na <span> (i to samo
 * fiksne veličine teksta). Sve ostalo - style, on*, id, data-* - se odbacuje.
 * Nedozvoljeni tagovi se uklanjaju ali im se tekst zadržava (<div>tekst</div> -> tekst).
 */
export function sanitizeProductHtml(input: string): string {
  if (!input) return '';

  const src = stripDangerousBlocks(String(input));
  const out: string[] = [];
  /**
   * `emitted:false` znači da je tag odmotan (npr. <span> bez validne klase):
   * njegov zatvarajući tag mora da se proguta, a ne da zatvori neki element iznad.
   */
  const stack: { tag: string; emitted: boolean }[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

  const pushText = (raw: string) => {
    if (!raw) return;
    out.push(escapeHtml(decodeEntities(raw)));
  };

  const openIndexOf = (tag: string) => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].tag === tag) return i;
    return -1;
  };

  const closeDownTo = (index: number) => {
    for (let i = stack.length - 1; i >= index; i--) {
      if (stack[i].emitted) out.push(`</${stack[i].tag}>`);
    }
    stack.length = index;
  };

  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(src)) !== null) {
    pushText(src.slice(last, match.index));
    last = tagRe.lastIndex;

    const name = match[1].toLowerCase();
    const isClosing = match[0][1] === '/';

    // Nedozvoljen tag: ispusti tag, zadrži tekst koji sledi
    if (!ALLOWED_TAGS.has(name)) continue;

    if (VOID_TAGS.has(name)) {
      if (isClosing) continue;
      if (name === 'img') {
        const imgSrc = safeImageSrc(readAttributes(match[0]).src ?? '');
        // Slika van naše memorije se izbacuje cela - nema šta da se sačuva
        if (imgSrc) out.push(`<img src="${escapeHtml(imgSrc)}" alt="" />`);
      } else {
        out.push(`<${name}>`);
      }
      continue;
    }

    if (isClosing) {
      const open = openIndexOf(name);
      if (open === -1) continue; // zalutali zatvarajući tag
      closeDownTo(open);
      continue;
    }

    // <li> ima smisla samo unutar liste
    if (name === 'li' && openIndexOf('ul') === -1 && openIndexOf('ol') === -1) continue;

    // <span> nosi isključivo veličinu teksta; bez validne klase se odmotava
    if (name === 'span') {
      const cls = (readAttributes(match[0]).class ?? '').trim();
      if (!SIZE_CLASS.test(cls)) {
        stack.push({ tag: 'span', emitted: false });
        continue;
      }
      out.push(`<span class="${cls}">`);
      stack.push({ tag: 'span', emitted: true });
      continue;
    }

    // <p> i <h3> se ne ugnježđuju - otvaranje novog zatvara prethodni
    if ((name === 'p' || name === 'h3') && openIndexOf(name) !== -1) {
      closeDownTo(openIndexOf(name));
    }

    out.push(`<${name}>`);
    stack.push({ tag: name, emitted: true });
  }

  pushText(src.slice(last));
  closeDownTo(0);

  return collapseEmpty(out.join(''));
}

/** HTML -> čist tekst. Koristi se za `description`, meta opise i JSON-LD. */
export function htmlToPlainText(input: string): string {
  if (!input) return '';

  const withBreaks = stripDangerousBlocks(String(input))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<\/(p|h1|h2|h3|h4|h5|h6|div|li|ul|ol|tr|table|section|article|blockquote)\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '');

  return decodeEntities(withBreaks)
    .replace(/[ \t\u00A0]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * JSON.stringify ne eskejpuje '<', pa `</script>` u podacima izlazi iz
 * <script type="application/ld+json"> bloka. Ovi escape-ovi su i dalje validan JSON.
 */
export function escapeJsonLd(json: string): string {
  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
