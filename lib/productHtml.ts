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
