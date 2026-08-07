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

const ALLOWED_TAGS = new Set(['p', 'strong', 'em', 'h3', 'ul', 'li', 'br']);
const VOID_TAGS = new Set(['br']);

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
    cur = cur.replace(/<(p|h3|ul|li|strong|em)>\s*<\/\1>/g, '');
  } while (cur !== prev);
  return cur;
}

/**
 * Vraća HTML koji sadrži samo <p> <strong> <em> <h3> <ul> <li> <br>, bez ijednog atributa.
 * Nedozvoljeni tagovi se uklanjaju ali im se tekst zadržava (<div>tekst</div> -> tekst).
 */
export function sanitizeProductHtml(input: string): string {
  if (!input) return '';

  const src = stripDangerousBlocks(String(input));
  const out: string[] = [];
  const stack: string[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

  const pushText = (raw: string) => {
    if (!raw) return;
    out.push(escapeHtml(decodeEntities(raw)));
  };

  const closeDownTo = (index: number) => {
    for (let i = stack.length - 1; i >= index; i--) out.push(`</${stack[i]}>`);
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
      if (!isClosing) out.push(`<${name}>`);
      continue;
    }

    if (isClosing) {
      const open = stack.lastIndexOf(name);
      if (open === -1) continue; // zalutali zatvarajući tag
      closeDownTo(open);
      continue;
    }

    // <li> ima smisla samo unutar <ul>
    if (name === 'li' && !stack.includes('ul')) continue;

    // <p> i <h3> se ne ugnježđuju - otvaranje novog zatvara prethodni
    if ((name === 'p' || name === 'h3') && stack.includes(name)) {
      closeDownTo(stack.lastIndexOf(name));
    }

    out.push(`<${name}>`);
    stack.push(name);
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
