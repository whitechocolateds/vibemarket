import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { AZURIRANO, KONTAKT, type LegalStranica } from '@/lib/legalContent';
import styles from './LegalPage.module.css';

/**
 * Prikaz pravne stranice iz `lib/legalContent`.
 *
 * Jedna komponenta za sve tri stranice: razlikuju se samo sadržajem, pa bi tri
 * kopije značile tri mesta na kojima se kvari razmak ili kontakt.
 */
export default function LegalPage({ stranica }: { stranica: LegalStranica }) {
  return (
    <div className={styles.wrap}>
      <div className="container">
        <article className={styles.card}>
          <Link href="/" className={styles.back}>
            <ArrowLeft size={14} strokeWidth={2} /> Nazad na početnu
          </Link>

          <h1 className={styles.title}>{stranica.naslov}</h1>
          <p className={styles.uvod}>{stranica.uvod}</p>

          {stranica.blokovi.map((blok, i) => {
            if (blok.vrsta === 'h2') return <h2 key={i} className={styles.h2}>{blok.tekst}</h2>;
            if (blok.vrsta === 'p') return <p key={i} className={styles.p}>{blok.tekst}</p>;
            if (blok.vrsta === 'ul') {
              return (
                <ul key={i} className={styles.lista}>
                  {blok.stavke.map((s, j) => <li key={j}>{s}</li>)}
                </ul>
              );
            }
            if (blok.vrsta === 'ol') {
              return (
                <ol key={i} className={styles.lista}>
                  {blok.stavke.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              );
            }
            // kontakt: veze koje se na telefonu mogu pozvati jednim dodirom
            return (
              <div key={i} className={styles.kontakt}>
                <a href={`mailto:${KONTAKT.email}`} className={styles.kontaktLink}>
                  <Mail size={15} strokeWidth={2} /> {KONTAKT.email}
                </a>
                <a href={`tel:${KONTAKT.telefonHref}`} className={styles.kontaktLink}>
                  <Phone size={15} strokeWidth={2} /> {KONTAKT.telefon}
                </a>
              </div>
            );
          })}

          <p className={styles.azurirano}>Poslednje ažuriranje: {AZURIRANO}</p>
        </article>
      </div>
    </div>
  );
}
