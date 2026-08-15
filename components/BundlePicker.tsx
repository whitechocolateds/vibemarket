'use client';

import { useId, useRef } from 'react';
import { bundleTierPricings, BUNDLE_BADGES } from '@/lib/bundlePricing';
import { formatPrice } from '@/lib/format';
import styles from './BundlePicker.module.css';

interface Props {
  basePrice: number;
  compareAtPrice?: number | null;
  value: number;
  onChange: (quantity: number) => void;
  /** Vidljivi naslov iznad liste (stranica proizvoda). */
  label?: string;
  /** Koristi se kad nema vidljivog naslova (checkout ima više grupa po stranici). */
  ariaLabel?: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function BundlePicker({
  basePrice,
  compareAtPrice,
  value,
  onChange,
  label,
  ariaLabel,
  variant = 'default',
  className = '',
}: Props) {
  const labelId = useId();
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tiers = bundleTierPricings(basePrice, compareAtPrice);

  /**
   * Korpa ima ± dugmad, pa stavka može stići sa količinom koja ne odgovara nijednom
   * paketu (npr. 5). Bez ovog fallbacka bi SVI redovi dobili tabIndex -1 i grupa bi
   * postala nedostupna tastaturom. Količina se ne prepravlja u tišini - to je
   * korisnikova korpa.
   */
  const selectedIndex = tiers.findIndex((t) => t.quantity === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const select = (i: number) => {
    onChange(tiers[i].quantity);
    rowRefs.current[i]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
    const n = tiers.length;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        select((i + 1) % n);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        select((i - 1 + n) % n);
        break;
      case 'Home':
        e.preventDefault();
        select(0);
        break;
      case 'End':
        e.preventDefault();
        select(n - 1);
        break;
    }
  };

  return (
    <div className={`${styles.root} ${variant === 'compact' ? styles.compact : ''} ${className}`}>
      {label && <p className={styles.label} id={labelId}>{label}</p>}

      <div
        className={styles.list}
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-label={label ? undefined : ariaLabel}
      >
        {tiers.map((tier, i) => {
          const selected = tier.quantity === value;
          const badge = BUNDLE_BADGES[tier.quantity];
          const noun = tier.quantity === 1 ? 'komad' : 'komada';

          // Vizuelno je cena desno od naziva; bez ovoga bi čitač ekrana
          // pročitao četiri nepovezana stringa
          const spoken = [
            `${tier.quantity} ${noun}`,
            `ukupno ${formatPrice(tier.total)}`,
            tier.savings > 0 ? `ušteda ${formatPrice(tier.savings)}` : null,
            badge?.label,
          ]
            .filter(Boolean)
            .join(', ');

          return (
            <button
              key={tier.quantity}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={spoken}
              tabIndex={i === activeIndex ? 0 : -1}
              ref={(el) => { rowRefs.current[i] = el; }}
              className={`${styles.row} ${selected ? styles.rowActive : ''} ${badge ? styles.rowBadged : ''}`}
              onClick={() => onChange(tier.quantity)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              {badge && (
                <span className={`${styles.badge} ${badge.tone === 'success' ? styles.badgeSuccess : styles.badgeDanger}`}>
                  {badge.label}
                </span>
              )}

              <span className={styles.radio} aria-hidden="true">
                <span className={styles.radioDot} />
              </span>

              <span className={styles.info}>
                <span className={styles.qty}>{tier.quantity} {noun}</span>
                {tier.savings > 0 && (
                  <span className={styles.save}>Uštedi {formatPrice(tier.savings)}</span>
                )}
              </span>

              <span className={styles.prices}>
                <span className={styles.total}>{formatPrice(tier.total)}</span>
                {tier.strikeTotal !== null && (
                  <span className={styles.strike}>{formatPrice(tier.strikeTotal)}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
