/**
 * Narativna ("long-form") landing stranica kao OPCIONI format po proizvodu.
 *
 * Standardna stranica proizvoda ostaje podrazumevana; ovo se ukljucuje
 * kvacicom u admin panelu i tada zamenjuje prikaz za taj jedan proizvod.
 *
 * Sekcije su fiksne i idu utvrdjenim redom - prazna sekcija se prosto ne
 * iscrtava. Namerno NIJE graditelj stranica sa premestanjem blokova: osam
 * sekcija koje se popunjavaju tekstom pokriva format, a sve preko toga je
 * masina koju bi trebalo odrzavati bez potrebe.
 */

export interface LandingBenefit {
  /** Ime lucide ikone; nepoznato ime pada na podrazumevanu. */
  icon: string;
  title: string;
  subtitle?: string;
  text?: string;
  /** Sitni "cekirani" dodatak na dnu kartice. */
  check?: string;
}

export interface LandingStat {
  value: string;
  label: string;
}

export interface LandingObjection {
  question: string;
  answer: string;
}

/**
 * Dva paralelna rasporeda istog sadrzaja.
 *
 * 'prica'      - narativni tok: problem, prica, resenje, pa tek na dnu kupovina.
 * 'konverzija' - ponuda odmah u zaglavlju, dokazi odmah ispod, prica na kraju;
 *                dugme za kupovinu se ponavlja tri puta.
 *
 * Polje je opciono zbog proizvoda sacuvanih pre ove podele - oni ostaju 'prica'.
 */
export type LandingVariant = 'prica' | 'konverzija';

export interface LandingPage {
  enabled: boolean;
  /** Raspored sekcija; bez njega vazi 'prica'. */
  variant?: LandingVariant;
  /** Id teme iz skupa koji pripada izabranoj varijanti. */
  theme: string;
  /** Prepisuju gradijent teme kad su oba data - da proizvod moze da ima svoju boju. */
  accentFrom?: string;
  accentTo?: string;

  badge?: string;
  heroTitle?: string;
  heroLead?: string;

  problemImage?: string;
  /** Kad postoji, slika dobija tamni preklop i tekst preko sebe umesto ispod. */
  problemTitle?: string;
  problemBadge?: string;
  problemCaption?: string;

  story?: string;

  solutionTitle?: string;
  solutionLead?: string;
  solutionImage?: string;

  benefits?: LandingBenefit[];

  /** Mala najavna slika neposredno iznad statistike; naslov preko nje je manji od glavnog. */
  statsImage?: string;
  statsTitle?: string;

  stats?: LandingStat[];
  objections?: LandingObjection[];

  ctaTitle?: string;
  ctaLead?: string;
}

export interface LandingTheme {
  id: string;
  name: string;
  from: string;
  to: string;
  /** Podloga cele stranice. */
  bg: string;
  /** Podloga kartica i sekcija koje se izdvajaju. */
  surface: string;
  ink: string;
  muted: string;
  border: string;
  /** Boja dugmeta za kupovinu. Kad nedostaje, koristi se gradijent (from/to). */
  cta?: string;
  /** Boja teksta NA tom dugmetu. Bira se merenjem kontrasta, ne po oseceju. */
  onCta?: string;
  /**
   * Boja teksta preko gradijenta (pilule, ikone).
   * Na svetlom gradijentu belo pada ispod praga, pa neke teme traze crno -
   * izmereno, nije stvar ukusa.
   */
  onGradient?: string;
}

/**
 * Teme su namerno van plavo-sivo-zute palete prodavnice: landing format treba
 * da izgleda kao zasebna stranica, ne kao jos jedan ekran VibeMarket-a.
 */
export const LANDING_THEMES: LandingTheme[] = [
  {
    id: 'aurora',
    name: 'Aurora (plavo-ljubičasta)',
    from: '#6366F1', to: '#A855F7',
    bg: '#0B0B1A', surface: '#15152B', ink: '#F5F5FF', muted: '#A5A5C4', border: '#2A2A4A',
  },
  {
    id: 'ember',
    name: 'Ember (topla, narandžasto-crvena)',
    from: '#F97316', to: '#E11D48',
    bg: '#14090B', surface: '#221115', ink: '#FFF5F0', muted: '#C9A59C', border: '#3D1F25',
  },
  {
    id: 'mint',
    name: 'Mint (svetla, tirkizna)',
    from: '#0D9488', to: '#22C55E',
    bg: '#F6FBF9', surface: '#FFFFFF', ink: '#0B2822', muted: '#5B7A72', border: '#DCEBE6',
  },
  {
    id: 'sand',
    name: 'Sand (svetla, topla neutralna)',
    from: '#B45309', to: '#D97706',
    bg: '#FBF8F3', surface: '#FFFFFF', ink: '#2A1F14', muted: '#7A6A57', border: '#EADFCE',
  },
  {
    id: 'midnight',
    name: 'Midnight (tamna, hladna)',
    from: '#0EA5E9', to: '#8B5CF6',
    bg: '#07090F', surface: '#111521', ink: '#EEF2FF', muted: '#94A3B8', border: '#1E2536',
  },
];

/**
 * Teme za 'konverzija'. Izvedene iz paleta koje je predlozio ui-ux-pro-max za
 * e-commerce sa naglaskom na hitnost, pa proverene merenjem kontrasta
 * (npm run check:contrast) - odatle i `onCta`, koji nije biran po oseceju:
 * beli tekst na narandzastoj ne prolazi 4.5:1, crni prolazi.
 *
 * Namerno odvojene od tema za 'pricu': tamo je gradijent glavni nosilac boje,
 * ovde postoji ZASEBNA boja dugmeta koja se probija iz palete.
 */
export const KONVERZIJA_THEMES: LandingTheme[] = [
  {
    id: 'signal',
    name: 'Signal (plava + narandžasti CTA)',
    from: '#1D4ED8', to: '#2563EB', onGradient: '#FFFFFF',
    bg: '#F8FAFC', surface: '#FFFFFF', ink: '#1E293B', muted: '#475569', border: '#CBD5E1',
    cta: '#EA580C', onCta: '#000000',
  },
  {
    id: 'harvest',
    name: 'Harvest (zelena + narandžasti CTA)',
    from: '#065F46', to: '#047857', onGradient: '#FFFFFF',
    bg: '#ECFDF5', surface: '#FFFFFF', ink: '#064E3B', muted: '#3F6212', border: '#A7F3D0',
    cta: '#EA580C', onCta: '#000000',
  },
  {
    id: 'nocturne',
    name: 'Nocturne (tamna + topli CTA)',
    from: '#EF4444', to: '#F97316', onGradient: '#000000',
    bg: '#020617', surface: '#111827', ink: '#F8FAFC', muted: '#9CA3AF', border: '#1F2937',
    cta: '#EF4444', onCta: '#000000',
  },
  {
    id: 'slate',
    name: 'Slate (mornarska + plavi CTA)',
    from: '#0F172A', to: '#1E3A5F', onGradient: '#FFFFFF',
    bg: '#F8FAFC', surface: '#FFFFFF', ink: '#020617', muted: '#475569', border: '#CBD5E1',
    cta: '#0369A1', onCta: '#FFFFFF',
  },
];

export const DEFAULT_LANDING_THEME = LANDING_THEMES[0];

/** Teme koje pripadaju datoj varijanti; svaka ima svoj skup. */
export function themesFor(variant?: LandingVariant): LandingTheme[] {
  return variant === 'konverzija' ? KONVERZIJA_THEMES : LANDING_THEMES;
}

export function landingTheme(id?: string, variant?: LandingVariant): LandingTheme {
  const skup = themesFor(variant);
  return skup.find((t) => t.id === id) ?? skup[0];
}

/** '#1652BE' -> '22, 82, 190'; --brand-rgb ocekuje trojku, ne hex. */
function rgbTriple(hex: string): string {
  const h = hex.replace('#', '');
  const pun = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const v = parseInt(pun, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255].join(', ');
}

/** Tema kao CSS promenljive; sekcija ih koristi, pa je bojenje jedno mesto. */
export function landingVars(landing: LandingPage): Record<string, string> {
  const t = landingTheme(landing.theme, landing.variant);
  const from = landing.accentFrom?.trim() || t.from;
  const to = landing.accentTo?.trim() || t.to;
  // Boja radnje: na 'konverziji' zasebna boja dugmeta, inace kraj gradijenta.
  const akcija = t.cta ?? to;
  return {
    '--lp-from': from,
    '--lp-to': to,
    // Dugme za kupovinu; kad tema nema zasebnu boju, pada na kraj gradijenta.
    '--lp-cta': t.cta ?? to,
    '--lp-on-cta': t.onCta ?? '#ffffff',
    '--lp-on-gradient': t.onGradient ?? '#ffffff',
    /*
     * Zavrsno dugme deli LandingPage.module.css sa 'pricom'. Bez zasebnih
     * promenljivih moralo bi da se bira izmedju gradijenta (i 'prica' ostaje
     * netaknuta) i boje radnje (i 'konverzija' je dosledna). Ovako oba:
     * bez "cta" ostaje gradijent, sa "cta" postaje puna boja dugmeta.
     */
    '--lp-buy-from': t.cta ?? from,
    '--lp-buy-to': t.cta ?? to,
    '--lp-bg': t.bg,
    '--lp-surface': t.surface,
    '--lp-ink': t.ink,
    '--lp-muted': t.muted,
    '--lp-border': t.border,

    /*
     * BundlePicker se deli sa standardnom stranicom i boji se tokenima prodavnice.
     * Premapiranje TIH tokena unutar landing omotaca je jedini nacin da izbor
     * paketa dobije temu landing stranice, a da se sama komponenta ne dira.
     */
    /*
     * Na 'konverziji' se --brand vezuje za boju DUGMETA, ne za gradijent.
     * Zavrsni blok deli BundlePicker i LandingBuy sa 'pricom', pa bi inace
     * poslednje dugme bilo plavo dok su dva iznad njega narandzasta - jedna
     * radnja, dve boje.
     */
    '--brand': akcija,
    '--brand-rgb': rgbTriple(akcija),
    '--brand-dark': to,
    '--bg-elevated': t.surface,
    '--bg-tint': t.bg,
    '--border-medium': t.border,
    '--border-strong': t.border,
    '--text-primary': t.ink,
    '--text-muted': t.muted,
    '--text-inverse': '#ffffff',
  };
}

// ── Parsiranje iz admin panela ───────────────────────────────────────────────
// Isti obrazac koji forma vec koristi za FAQ: jedan red po stavci, polja
// razdvojena znakom "|". Bez toga bi trebao ugnjezden editor za svaku sekciju.

const redovi = (s: string): string[][] =>
  s.split('\n').map((r) => r.split('|').map((c) => c.trim())).filter((c) => c.some(Boolean));

export function parseBenefits(s: string): LandingBenefit[] {
  return redovi(s)
    .map(([icon, title, subtitle, text, check]) => ({
      icon: (icon || 'sparkles').toLowerCase(),
      title: title || '',
      subtitle: subtitle || undefined,
      text: text || undefined,
      check: check || undefined,
    }))
    .filter((b) => b.title);
}

export function benefitsToStr(items?: LandingBenefit[]): string {
  return (items ?? [])
    .map((b) => [b.icon, b.title, b.subtitle ?? '', b.text ?? '', b.check ?? ''].join(' | '))
    .join('\n');
}

export function parseStats(s: string): LandingStat[] {
  return redovi(s)
    .map(([value, label]) => ({ value: value || '', label: label || '' }))
    .filter((x) => x.label);
}

/** Na sajt ide samo kartica koja ima upisan broj - prazna se ne prikazuje. */
export function visibleStats(stats?: LandingStat[]): LandingStat[] {
  return (stats ?? []).filter((s) => s.value.trim() && s.label.trim());
}

/**
 * '500+' -> {broj: 500, prefiks: '', sufiks: '+'}; '1-3 dana' -> broj null.
 * Bez broja nema odbrojavanja - tekst se prikaze kakav jeste.
 */
export function parseStatValue(value: string): { broj: number | null; prefiks: string; sufiks: string } {
  const m = value.match(/^(\D*?)([\d.,]+)(.*)$/);
  if (!m) return { broj: null, prefiks: '', sufiks: '' };
  // '12.400' je hiljadarka, '4,8' je decimala - srpski zapis, ne engleski.
  const broj = Number(m[2].replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(broj)) return { broj: null, prefiks: '', sufiks: '' };
  return { broj, prefiks: m[1], sufiks: m[3] };
}

export function statsToStr(items?: LandingStat[]): string {
  return (items ?? []).map((x) => `${x.value} | ${x.label}`).join('\n');
}

export function parseObjections(s: string): LandingObjection[] {
  return redovi(s)
    .map(([question, answer]) => ({ question: question || '', answer: answer || '' }))
    .filter((x) => x.question && x.answer);
}

export function objectionsToStr(items?: LandingObjection[]): string {
  return (items ?? []).map((x) => `${x.question} | ${x.answer}`).join('\n');
}

/** Prica se pise kao obican tekst; prazan red deli pasuse. */
export function storyParagraphs(story?: string): string[] {
  return (story ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
