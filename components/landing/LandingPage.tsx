import Link from 'next/link';
import {
  BadgeCheck, Battery, Check, Clock, Gauge, Heart, Home, Leaf, Lock, Package,
  Shield, Sparkles, Star, Truck, Wallet, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import { Product } from '@/lib/types';
import { LandingPage as Landing, landingVars, storyParagraphs, visibleStats } from '@/lib/landing';
import RichText from './RichText';
import LandingStats from './LandingStats';
import LandingBuy from './LandingBuy';
import styles from './LandingPage.module.css';

/**
 * Dozvoljene ikone za kartice prednosti. Namerno uzak spisak umesto celog
 * lucide skupa: ceo skup bi se zavrsio u bundlu, a admin panel nema pretragu
 * ikona pa bi vecina imena ionako bila pogodjena napamet.
 */
const IKONE: Record<string, LucideIcon> = {
  sparkles: Sparkles, zap: Zap, shield: Shield, check: BadgeCheck, clock: Clock,
  heart: Heart, home: Home, leaf: Leaf, lock: Lock, package: Package,
  star: Star, truck: Truck, wallet: Wallet, wrench: Wrench, gauge: Gauge,
  battery: Battery,
};

export default function LandingPage({ product, landing }: { product: Product; landing: Landing }) {
  const prica = storyParagraphs(landing.story);
  const benefits = landing.benefits ?? [];
  const stats = visibleStats(landing.stats);
  const objections = landing.objections ?? [];
  const solutionImage = landing.solutionImage || product.featuredImage?.url;

  return (
    <div className={styles.page} style={landingVars(landing) as React.CSSProperties}>
      {/* 1. Hook */}
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          {landing.badge && <span className={styles.pill}>{landing.badge}</span>}
          <h1 className={styles.heroTitle}>
            <RichText text={landing.heroTitle || product.title} />
          </h1>
          {landing.heroLead && <p className={styles.heroLead}><RichText text={landing.heroLead} /></p>}
        </div>
      </header>

      {/* 2. Slika koja pojačava problem.
           Sa `problemTitle` tekst ide PREKO slike, uz tamni preklop; bez njega
           ostaje ispod slike, kao i do sada. */}
      {landing.problemImage && (
        <section className={styles.sectionTight}>
          <div className={styles.wrap}>
            {landing.problemTitle ? (
              <figure className={`${styles.figure} ${styles.figureOverlay}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={landing.problemImage} alt="" className={styles.figureImg} loading="lazy" />
                <div className={styles.figureScrim} aria-hidden="true" />
                <figcaption className={styles.figureText}>
                  {landing.problemBadge && (
                    <span className={`${styles.pill} ${styles.pillGlass}`}>
                      <span className={styles.pillDot} aria-hidden="true" />
                      {landing.problemBadge}
                    </span>
                  )}
                  <p className={styles.figureTitle}><RichText text={landing.problemTitle} /></p>
                  {landing.problemCaption && (
                    <p className={styles.figureLead}><RichText text={landing.problemCaption} /></p>
                  )}
                </figcaption>
              </figure>
            ) : (
              <figure className={styles.figure}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={landing.problemImage} alt="" className={styles.figureImg} loading="lazy" />
                {landing.problemCaption && (
                  <figcaption className={styles.figureCaption}>
                    <RichText text={landing.problemCaption} />
                  </figcaption>
                )}
              </figure>
            )}
          </div>
        </section>
      )}

      {/* 3. Priča */}
      {prica.length > 0 && (
        <section className={styles.section}>
          <div className={`${styles.wrap} ${styles.narrow} ${styles.story}`}>
            {prica.map((p, i) => <p key={i}><RichText text={p} /></p>)}
          </div>
        </section>
      )}

      {/* 4. Proizvod kao rešenje */}
      {(landing.solutionTitle || solutionImage) && (
        <section className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.solution}>
              <div>
                <span className={styles.pill}>Rešenje</span>
                <h2 className={styles.solutionTitle}><RichText text={landing.solutionTitle || product.title} /></h2>
                {landing.solutionLead && <p className={styles.solutionLead}><RichText text={landing.solutionLead} /></p>}
              </div>
              {solutionImage && (
                <div className={styles.solutionMedia}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={solutionImage} alt={product.title} className={styles.solutionImg} loading="lazy" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5. Kartice prednosti */}
      {benefits.length > 0 && (
        <section className={styles.section}>
          <div className={styles.wrap}>
            <div className={styles.grid}>
              {benefits.map((b, i) => {
                const Ikona = IKONE[b.icon] ?? Sparkles;
                return (
                  <article key={i} className={styles.card}>
                    <span className={styles.cardIcon}><Ikona size={22} /></span>
                    <h3 className={styles.cardTitle}><RichText text={b.title} /></h3>
                    {b.subtitle && <p className={styles.cardSubtitle}>{b.subtitle}</p>}
                    {b.text && <p className={styles.cardText}><RichText text={b.text} /></p>}
                    {b.check && (
                      <p className={styles.cardCheck}>
                        <span className={styles.cardCheckIcon}><Check size={12} strokeWidth={3} /></span>
                        {b.check}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. Podaci koji grade poverenje */}
      {stats.length > 0 && (
        <section className={styles.sectionTight}>
          <div className={styles.wrap}>
            <LandingStats stats={stats} />
          </div>
        </section>
      )}

      {/* 7. Strahovi i prigovori */}
      {objections.length > 0 && (
        <section className={styles.section}>
          <div className={`${styles.wrap} ${styles.narrow}`}>
            <h2 className={styles.sectionTitle}>Pitanja koja se najčešće postavljaju</h2>
            <div className={styles.objections}>
              {objections.map((o, i) => (
                <div key={i} className={styles.objection}>
                  <p className={styles.objectionQ}>
                    <BadgeCheck size={18} className={styles.objectionIcon} />
                    {o.question}
                  </p>
                  <p className={styles.objectionA}>{o.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Kupovina */}
      <section className={styles.section}>
        <div className={`${styles.wrap} ${styles.narrow}`}>
          <div className={styles.cta}>
            <h2 className={styles.ctaTitle}>
              <RichText text={landing.ctaTitle || 'Naručite danas'} />
            </h2>
            {landing.ctaLead && <p className={styles.ctaLead}>{landing.ctaLead}</p>}
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
