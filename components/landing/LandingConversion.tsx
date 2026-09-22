import Link from 'next/link';
import {
  BadgeCheck, Battery, Check, Clock, Gauge, Heart, Home, Leaf, Lock, Package,
  Shield, Sparkles, Star, Truck, Wallet, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import { Product } from '@/lib/types';
import { LandingPage as Landing, landingVars, storyParagraphs, visibleStats } from '@/lib/landing';
import { formatPrice } from '@/lib/format';
import RichText from './RichText';
import LandingStats from './LandingStats';
import OverlayFigure from './OverlayFigure';
import LandingBuy from './LandingBuy';
import LandingCta from './LandingCta';
import styles from './LandingConversion.module.css';

/**
 * Varijanta 'konverzija' — ISTI podaci kao 'prica', drugi redosled i drugi tip
 * sekcija. Nema svoj sistem za sadrzaj: cita ista polja koja puni isto AI dugme.
 *
 * Redosled je izveden iz obrazaca koje je predlozio ui-ux-pro-max za
 * e-commerce sa naglaskom na konverziju ("Hero + proizvod", dokazi pre teksta,
 * ponovljen CTA):
 *
 *   1. Zaglavlje: slika levo, ponuda desno, cena i DUGME ODMAH  <- CTA 1
 *   2. Brojke odmah ispod zaglavlja (dokaz pre citanja)
 *   3. Prednosti kao zbijena lista sa kvacicama, ne krupne kartice
 *   4. Traka sa pozivom na akciju                                <- CTA 2
 *   5. Prigovori, zbijeno
 *   6. Prica i slika problema - tek ovde, kao "zasto"
 *   7. Zavrsni blok sa izborom paketa i kupovinom                <- CTA 3
 *
 * Nasuprot tome, 'prica' vodi kupca kroz problem i pripovest pa tek na dnu nudi
 * kupovinu. Ko zna sta hoce, ovde ne mora nista da procita.
 */

const IKONE: Record<string, LucideIcon> = {
  sparkles: Sparkles, zap: Zap, shield: Shield, check: BadgeCheck, clock: Clock,
  heart: Heart, home: Home, leaf: Leaf, lock: Lock, package: Package,
  star: Star, truck: Truck, wallet: Wallet, wrench: Wrench, gauge: Gauge,
  battery: Battery,
};

export default function LandingConversion({ product, landing }: { product: Product; landing: Landing }) {
  const prica = storyParagraphs(landing.story);
  const benefits = landing.benefits ?? [];
  const stats = visibleStats(landing.stats);
  const objections = landing.objections ?? [];
  const heroImage = landing.solutionImage || product.featuredImage?.url;

  const variant = product.variants[0];
  const cena = Number(product.priceRange.minVariantPrice.amount);
  const staraCena = variant?.compareAtPrice ? Number(variant.compareAtPrice.amount) : null;
  const popust = staraCena && staraCena > cena
    ? Math.round(((staraCena - cena) / staraCena) * 100)
    : null;

  return (
    <div className={styles.page} style={landingVars(landing) as React.CSSProperties}>
      {/* 1. Zaglavlje: ponuda odmah, bez uvoda */}
      <header className={styles.hero}>
        <div className={styles.wrap}>
          <div className={styles.heroGrid}>
            {heroImage && (
              <div className={styles.heroMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt={product.title} className={styles.heroImg} />
                {popust !== null && <span className={styles.heroDiscount}>−{popust}%</span>}
              </div>
            )}

            <div className={styles.heroOffer}>
              {landing.badge && <span className={styles.pill}>{landing.badge}</span>}
              <h1 className={styles.heroTitle}>
                <RichText text={landing.heroTitle || product.title} />
              </h1>
              {landing.heroLead && (
                <p className={styles.heroLead}><RichText text={landing.heroLead} /></p>
              )}

              <div className={styles.priceRow}>
                <span className={styles.price}>{formatPrice(cena)}</span>
                {staraCena && staraCena > cena && (
                  <span className={styles.compare}>{formatPrice(staraCena)}</span>
                )}
              </div>

              {/* CTA 1 — vidljiv bez skrolovanja */}
              <LandingCta product={product} label="Naruči odmah" />

              <ul className={styles.trustList}>
                <li><Check size={14} strokeWidth={3} /> Plaćanje pouzećem, bez avansa</li>
                <li><Check size={14} strokeWidth={3} /> Dostava 1–3 radna dana</li>
                <li><Check size={14} strokeWidth={3} /> Zamena u roku od 14 dana</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Brojke odmah, kao dokaz pre teksta */}
      {stats.length > 0 && (
        <section className={styles.statsBand}>
          <div className={styles.wrap}>
            <LandingStats stats={stats} className={styles.statsGrid} />
          </div>
        </section>
      )}

      {/* 3. Prednosti kao zbijena lista, ne krupne kartice */}
      {benefits.length > 0 && (
        <section className={styles.section}>
          <div className={styles.wrap}>
            <h2 className={styles.sectionTitle}>Zašto baš ovaj</h2>
            <div className={styles.benefitList}>
              {benefits.map((b, i) => {
                const Ikona = IKONE[b.icon] ?? Sparkles;
                return (
                  <div key={i} className={styles.benefitRow}>
                    <span className={styles.benefitIcon}><Ikona size={18} /></span>
                    <div className={styles.benefitBody}>
                      <p className={styles.benefitTitle}>
                        <RichText text={b.title} />
                        {b.subtitle && <span className={styles.benefitTag}>{b.subtitle}</span>}
                      </p>
                      {b.text && <p className={styles.benefitText}><RichText text={b.text} /></p>}
                    </div>
                    {b.check && (
                      <span className={styles.benefitCheck}>
                        <Check size={12} strokeWidth={3} /> {b.check}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA 2 — posle prednosti, dok je razlog svež */}
      <section className={styles.sectionTight}>
        <div className={styles.wrap}>
          <div className={styles.ctaBand}>
            <p className={styles.ctaBandText}>
              <RichText text={landing.ctaTitle || 'Naručite danas'} />
            </p>
            <LandingCta product={product} label="Naruči odmah" />
          </div>
        </div>
      </section>

      {/* 4. Prigovori, zbijeno */}
      {objections.length > 0 && (
        <section className={styles.sectionTight}>
          <div className={`${styles.wrap} ${styles.narrow}`}>
            <h2 className={styles.sectionTitle}>Pre nego što poručite</h2>
            <div className={styles.qaList}>
              {objections.map((o, i) => (
                <div key={i} className={styles.qa}>
                  <p className={styles.qaQ}>{o.question}</p>
                  <p className={styles.qaA}>{o.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Priča tek ovde - ko je već ubeđen, nije morao da je čita */}
      {(prica.length > 0 || landing.problemImage) && (
        <section className={styles.sectionTight}>
          <div className={`${styles.wrap} ${styles.narrow}`}>
            {landing.problemImage && landing.problemTitle && (
              <div className={styles.storyMedia}>
                {/* Puna figura, namerno bez "compact": compact je visok 200px i
                    pravljen za naslov BEZ oznake. Sa oznakom i dužim naslovom tekst
                    iscuri preko svetlog dela slike — izmereno, 141px teksta u
                    okviru od 200px. */}
                <OverlayFigure
                  image={landing.problemImage}
                  title={landing.problemTitle}
                  badge={landing.problemBadge}
                />
              </div>
            )}
            {prica.length > 0 && (
              <div className={styles.story}>
                {prica.map((p, i) => <p key={i}><RichText text={p} /></p>)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA 3 — pun blok sa izborom paketa */}
      <section className={styles.section}>
        <div className={`${styles.wrap} ${styles.narrow}`}>
          <div className={styles.buyBox}>
            <h2 className={styles.buyTitle}>
              <RichText text={landing.solutionTitle || product.title} />
            </h2>
            {landing.ctaLead && <p className={styles.buyLead}><RichText text={landing.ctaLead} /></p>}
            <LandingBuy product={product} />
          </div>
        </div>
      </section>

      <div className={styles.backRow}>
        <Link href="/products" className={styles.backLink}>Pogledajte ostale proizvode</Link>
      </div>
    </div>
  );
}
