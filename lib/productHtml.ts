import { escapeHtml, sanitizeProductHtml } from './sanitizeHtml';

/**
 * Gradnja opisa proizvoda iz STRUKTURIRANOG podatka.
 *
 * Model nikad ne emituje HTML - vraća polja, a tagove sastavlja ovaj modul.
 * Time "koristi samo p/strong/h3/ul/li" prestaje da bude nada u promptu i
 * postaje garancija koda, a površina za ubacivanje tagova je nula.
 *
 * Format prati kuću: uvodni <p> sa podebljanom kukom, pa 3-4 para
 * <h3> + <p>, i opciono jedna <ul> lista specifikacija. Isti oblik koji
 * ProductDetailClient.splitDescriptionSections očekuje.
 */

export interface CopySection {
  heading: string;
  body: string;
}

export interface StructuredCopy {
  /** Uvodni pasus. **ovako** postaje <strong>ovako</strong>. */
  lead: string;
  sections: CopySection[];
  /** Opciona lista specifikacija; postaje jedna <ul>. */
  specs?: string[];
}

const MAX_SECTIONS = 5;
const MAX_SPECS = 8;

/**
 * Podebljavanje se prenosi **markerima** umesto zasebnim `highlight` poljem:
 * ugovor "highlight mora biti tačan podniz teksta" stalno puca na srpskim
 * znakovima i oblicima reči.
 *
 * Bitno: eskejpuje se PRE konverzije markera, da ** iz korisničkog teksta
 * ne može da proizvede tag.
 */
function inline(text: string): string {
  return escapeHtml(String(text ?? '').trim()).replace(
    /\*\*(.+?)\*\*/g,
    (_, inner: string) => `<strong>${inner}</strong>`
  );
}

export function buildDescriptionHtml(copy: StructuredCopy): string {
  const parts: string[] = [];

  const lead = inline(copy.lead ?? '');
  if (lead) parts.push(`<p>${lead}</p>`);

  for (const section of (copy.sections ?? []).slice(0, MAX_SECTIONS)) {
    const heading = inline(section?.heading ?? '');
    const body = inline(section?.body ?? '');
    if (!heading && !body) continue;
    if (heading) parts.push(`<h3>${heading}</h3>`);
    if (body) parts.push(`<p>${body}</p>`);
  }

  const specs = (copy.specs ?? [])
    .map((s) => inline(s))
    .filter(Boolean)
    .slice(0, MAX_SPECS);
  if (specs.length) {
    parts.push(`<ul>${specs.map((s) => `<li>${s}</li>`).join('')}</ul>`);
  }

  // Poslednji prolaz kroz sanitizer - pojas i tregeri
  return sanitizeProductHtml(parts.join(''));
}

/* ─── Uredjivanje opisa u admin formi ───────────────────────────────────────
 *
 * Stranica proizvoda prikazuje descriptionHtml, a ne `description`. Da admin ne
 * bi menjao jedno a gledao drugo, forma radi nad LAKIM tekstualnim zapisom koji
 * se pretvara u isti ogranicen HTML (p / h3 / strong / ul / li):
 *
 *   ## Podnaslov      -> <h3>
 *   prazan red        -> novi pasus
 *   - stavka          -> <ul><li>
 *   **podebljano**    -> <strong>
 */

const HEADING_LINE = /^\s{0,3}#{2,3}\s+(.*)$/;
const LIST_LINE = /^\s{0,3}[-*]\s+(.*)$/;

export function editableTextToHtml(text: string): string {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const parts: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const body = inline(paragraph.join(' '));
    if (body) parts.push(`<p>${body}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    parts.push(`<ul>${listItems.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  for (const line of lines) {
    const heading = line.match(HEADING_LINE);
    const item = line.match(LIST_LINE);

    if (heading) {
      flushParagraph();
      flushList();
      const h = inline(heading[1]);
      if (h) parts.push(`<h3>${h}</h3>`);
    } else if (item) {
      flushParagraph();
      listItems.push(item[1]);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  flushList();

  return sanitizeProductHtml(parts.join(''));
}

/** Obrnuti smer: postojeci descriptionHtml -> tekst za formu. */
export function htmlToEditableText(html: string): string {
  if (!html) return '';

  const out: string[] = [];
  const blockRe = /<(h3|p|ul)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  const unwrap = (s: string) =>
    s
      .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();

  while ((match = blockRe.exec(html)) !== null) {
    const [, tag, inner] = match;
    if (tag.toLowerCase() === 'h3') {
      out.push(`## ${unwrap(inner)}`);
    } else if (tag.toLowerCase() === 'ul') {
      const items = [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => `- ${unwrap(m[1])}`);
      out.push(items.join('\n'));
    } else {
      out.push(unwrap(inner));
    }
  }

  // Ako HTML nije bio u ocekivanom obliku, bar vrati goli tekst
  if (out.length === 0) return unwrap(html);

  return out.join('\n\n').trim();
}
