import { AlertTriangle, Check, Clock } from 'lucide-react';
import type { ShopifySync } from '@/lib/types';
import styles from './ShopifySyncBadge.module.css';

interface Props {
  sync?: ShopifySync;
  /** Na stranici porudzbine razlog ide ceo; u tabeli se skracuje. */
  puniRazlog?: boolean;
}

/**
 * Stanje slanja porudzbine u Shopify.
 *
 * Postoji jer je neuspeh slanja ranije zavrsavao samo u logu servera - porudzbina
 * koja nikada nije stigla u Shopify izgledala je isto kao ona koja jeste.
 */
export default function ShopifySyncBadge({ sync, puniRazlog = false }: Props) {
  // Nema zapisa: slanje je iskljuceno, ili je porudzbina starija od ove provere
  if (!sync) return <span className={styles.nema}>—</span>;

  if (sync.status === 'poslato') {
    return (
      <span className={`${styles.badge} ${styles.poslato}`} title={`Poslato ${new Date(sync.at).toLocaleString('sr-RS')}`}>
        <Check size={11} strokeWidth={3} />
        {sync.shopifyOrderName || 'Poslato'}
      </span>
    );
  }

  if (sync.status === 'ceka') {
    return (
      <span
        className={`${styles.badge} ${styles.ceka}`}
        title="Slanje je zapoceto, ali se ishod nije upisao. Ako ovo dugo stoji, slanje je prekinuto na pola."
      >
        <Clock size={11} strokeWidth={2.5} />
        Čeka
      </span>
    );
  }

  return (
    <>
      <span className={`${styles.badge} ${styles.neuspelo}`}>
        <AlertTriangle size={11} strokeWidth={2.5} />
        Nije poslato
      </span>
      {sync.error && (
        <p className={`${styles.razlog} ${puniRazlog ? styles.razlogPun : ''}`} title={sync.error}>
          {puniRazlog || sync.error.length <= 90 ? sync.error : `${sync.error.slice(0, 90)}…`}
        </p>
      )}
    </>
  );
}
