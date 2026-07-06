import Link from 'next/link';

interface LogoProps {
  /** Boja teksta u zavisnosti od pozadine */
  variant?: 'onLight' | 'onDark';
  /** Visina znaka (torbe) u px; tekst se skalira uz njega */
  size?: number;
  /** Prikaži slogan "Kupuj na klik" ispod naziva */
  tagline?: boolean;
  /** Samo znak, bez teksta */
  iconOnly?: boolean;
  /** Obmotaj u <Link href="/"> */
  href?: string | null;
  className?: string;
}

/** Znak: zlatna shopping torba sa origami avionom — vektorska replika logotipa. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      {/* telo torbe */}
      <path
        d="M13 18 H35 a2 2 0 0 1 2 2.1 l-1.4 18 a4 4 0 0 1 -4 3.6 H16.4 a4 4 0 0 1 -4 -3.6 L11 20.1 a2 2 0 0 1 2 -2.1 Z"
        stroke="var(--gold)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* drške */}
      <path
        d="M18.5 18 v-2.6 a5.5 5.5 0 0 1 11 0 V18"
        stroke="var(--gold)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* origami avion (kupuj na klik) */}
      <path d="M13.5 32.5 L30.5 25 L23.2 40 L20.6 34.4 Z" fill="var(--gold)" />
      <path
        d="M30.5 25 L20.6 34.4"
        stroke="var(--bg-card)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* linije brzine */}
      <path
        d="M6.5 29.5 h4 M5.5 33.5 h3.4 M7.5 37.5 h4"
        stroke="var(--gold)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  variant = 'onLight',
  size = 30,
  tagline = false,
  iconOnly = false,
  href = '/',
  className = '',
}: LogoProps) {
  const primaryColor = variant === 'onDark' ? '#FFFFFF' : 'var(--text-primary)';

  const inner = (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.32,
        textDecoration: 'none',
        lineHeight: 1,
      }}
    >
      <LogoMark size={size} />
      {!iconOnly && (
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800,
              fontSize: size * 0.62,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              color: primaryColor,
            }}
          >
            Vibe<span style={{ color: 'var(--gold)' }}>Market</span>
          </span>
          {tagline && (
            <span
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 600,
                fontSize: size * 0.27,
                letterSpacing: '0.02em',
                color: 'var(--gold)',
              }}
            >
              Kupuj na klik
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="VibeMarket — Kupuj na klik" style={{ display: 'inline-flex' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
