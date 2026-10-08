import { Download, FileText, type LucideIcon } from 'lucide-react';
import { jeLandingIkona, type LandingIkona } from '@/lib/landing';
import { PRODUCT_DOCS } from '@/lib/productDocs';
import Reveal from './Reveal';
import styles from './LandingPage.module.css';

/**
 * Dva besplatna vodica na landing stranici, otvorena svakome.
 *
 * Preuzimanje ide PRAVO na fajl u `public/docs/`: obican <a download>, bez
 * posrednicke rute i bez provere. Fajlove servira CDN kao statiku, pa poziv
 * funkcije ne postoji, a `download` radi jer je link istog porekla.
 *
 * Podaci - naslov, opis, broj strana, ikona - dolaze iz lib/productDocs.ts.
 * Ovde se nista od toga ne ponavlja: da se sutra promeni broj strana, menja se
 * jedno mesto.
 */
export default function LandingDocs({ ikone }: { ikone: Record<LandingIkona, LucideIcon> }) {
  if (PRODUCT_DOCS.length === 0) return null;

  return (
    <div className={styles.docs}>
      <Reveal>
        <span className={styles.pill}>Besplatno</span>
        <h2 className={styles.docsTitle}>Preuzmite dva besplatna vodiča</h2>
        <p className={styles.docsLead}>
          Bez kupovine i bez prijave — kliknite i PDF se preuzima.
        </p>
      </Reveal>

      <div className={styles.docsGrid}>
        {PRODUCT_DOCS.map((d, i) => {
          const Ikona = jeLandingIkona(d.ikona) ? ikone[d.ikona] : FileText;
          return (
            <Reveal key={d.href} delay={i * 90}>
              <article className={styles.docCard}>
                <span className={styles.cardIcon}>
                  <Ikona size={22} />
                </span>
                <h3 className={styles.docCardTitle}>{d.naslov}</h3>
                <p className={styles.docMeta}>{d.meta}</p>
                <p className={styles.docText}>{d.opis}</p>
                <a className={styles.docBtn} href={d.href} download>
                  <Download size={17} strokeWidth={2.4} />
                  Preuzmi PDF
                </a>
              </article>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
