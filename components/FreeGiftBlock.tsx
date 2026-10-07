'use client';

import { useReducedMotion } from 'framer-motion';
import { Gift } from 'lucide-react';
import type { FreeGift } from '@/lib/types';
import { jeVideo } from '@/lib/uploadPath';
import styles from './FreeGiftBlock.module.css';

/**
 * Blok "GRATIS uz svaku porudzbinu" na stranici proizvoda.
 *
 * Prikazuje se SAMO kad proizvod ima popunjen poklon; bez njega se ne iscrtava
 * nista, pa proizvodi bez poklona izgledaju tacno kao i do sada.
 *
 * Materijal moze biti slika ili kratka petlja. Petlja ide kroz <video> sa
 * `muted` i `playsInline` - bez toga je telefon ne pusta sam, nego otvara ceo
 * ekran. Zvuka nema; `preload="metadata"` da se ne vuce ceo fajl pre nego sto
 * kupac uopste dodje do bloka.
 *
 * Ko je u sistemu trazio manje pokreta ne dobija petlju koja se vrti, nego
 * miran prvi kadar. To se NE moze uraditi iz CSS-a - `autoplay` je svojstvo
 * elementa - pa se odluka donosi ovde.
 */
export default function FreeGiftBlock({ gift }: { gift: FreeGift }) {
  const manjePokreta = useReducedMotion();
  const naslov = gift.title.trim();
  if (!naslov) return null;

  const medij = gift.media?.trim();
  const video = !!medij && jeVideo(medij);

  return (
    <section className={styles.blok} aria-label="Poklon uz kupovinu">
      {medij && (
        <div className={styles.medijOkvir}>
          {video ? (
            <video
              className={styles.medij}
              autoPlay={!manjePokreta}
              muted
              loop
              playsInline
              preload="metadata"
              poster={gift.poster?.trim() || undefined}
            >
              {gift.mediaAlt?.trim() && <source src={gift.mediaAlt} type="video/webm" />}
              <source src={medij} type={medij.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
            </video>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element -- adresa iz admin panela, van remotePatterns liste */
            <img className={styles.medij} src={medij} alt={naslov} loading="lazy" />
          )}
        </div>
      )}

      <div className={styles.tekst}>
        <span className={styles.oznaka}>
          <Gift size={13} strokeWidth={2.4} /> GRATIS uz svaku porudžbinu
        </span>
        <p className={styles.naziv}>{naslov}</p>
        <p className={styles.napomena}>Stiže zajedno sa proizvodom, bez doplate.</p>
      </div>
    </section>
  );
}

/** Kratak bedz uz cenu. Prazno polje znaci podrazumevani tekst sa nazivom. */
export function freeGiftBadge(gift?: FreeGift): string | null {
  const naslov = gift?.title?.trim();
  if (!naslov) return null;
  return gift?.badge?.trim() || `+ GRATIS ${naslov}`;
}
