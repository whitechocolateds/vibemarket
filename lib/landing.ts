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

export interface LandingPage {
  enabled: boolean;
  /** Id teme iz LANDING_THEMES. */
  theme: string;
  /** Prepisuju gradijent teme kad su oba data - da proizvod moze da ima svoju boju. */
  accentFrom?: string;
  accentTo?: string;

  badge?: string;
  heroTitle?: string;
  heroLead?: string;

  problemImage?: string;
  problemCaption?: string;

  story?: string;

  solutionTitle?: string;
  solutionLead?: string;
  solutionImage?: string;

  benefits?: LandingBenefit[];
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

export const DEFAULT_LANDING_THEME = LANDING_THEMES[0];

export function landingTheme(id?: string): LandingTheme {
  return LANDING_THEMES.find((t) => t.id === id) ?? DEFAULT_LANDING_THEME;
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
  const t = landingTheme(landing.theme);
  const from = landing.accentFrom?.trim() || t.from;
  const to = landing.accentTo?.trim() || t.to;
  return {
    '--lp-from': from,
    '--lp-to': to,
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
    '--brand': from,
    '--brand-rgb': rgbTriple(from),
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
    .filter((x) => x.value && x.label);
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
