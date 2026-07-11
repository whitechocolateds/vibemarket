import Link from 'next/link';
import Image from 'next/image';

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

/** Znak: pravi VibeMarket logo (zlatna torba + origami avion), izrezan iz zvaničnog fajla. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <Image
      src="/logo-icon.png"
      alt=""
      width={size}
      height={size}
      priority
      style={{ flexShrink: 0, display: 'block', width: size, height: size, objectFit: 'contain' }}
    />
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
  void variant;

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
              color: 'var(--gold)',
            }}
          >
            VibeMarket
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
      <Link href={href} aria-label="VibeMarket - Kupuj na klik" style={{ display: 'inline-flex' }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
