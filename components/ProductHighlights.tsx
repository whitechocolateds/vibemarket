import { Check } from 'lucide-react';
import type { ProductHighlights as Podaci } from '@/lib/types';
import styles from './ProductHighlights.module.css';

/**
 * Kartica "sta proizvod radi" - kratka lista sa kvacicama.
 *
 * Prikazuje se SAMO kad proizvod ima popunjene stavke; bez njih se ne iscrtava
 * nista, pa proizvodi bez tog polja izgledaju tacno kao i do sada.
 *
 * Koristi se na obe vrste stranica: na standardnoj posle opisa a pre pitanja, na
 * landing formatu posle statistike a pre pitanja. Zato je komponenta zasebna i
 * nema nijedan stil vezan za okolinu - sirinu joj odredjuje mesto gde stoji.
 */
export default function ProductHighlights({ data }: { data: Podaci }) {
  const stavke = (data.items ?? []).map((x) => x.trim()).filter(Boolean);
  if (stavke.length === 0) return null;

  return (
    <section className={styles.kartica} aria-label={data.title?.trim() || 'Prednosti'}>
      <h3 className={styles.naslov}>{data.title?.trim() || 'Prednosti'}</h3>
      <ul className={styles.lista}>
        {stavke.map((stavka, i) => (
          <li key={i} className={styles.stavka}>
            <span className={styles.kvacica} aria-hidden="true">
              <Check size={13} strokeWidth={3} />
            </span>
            {stavka}
          </li>
        ))}
      </ul>
    </section>
  );
}
