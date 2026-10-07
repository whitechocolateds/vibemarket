import Link from 'next/link';
import {
  BadgeCheck, Battery, Check, Clock, Dumbbell, Gauge, Heart, Home, Leaf, Lock,
  Package, Shield, Sofa, Sparkles, Star, TrafficCone, Truck, Wallet, Wrench,
  Zap, type LucideIcon,
} from 'lucide-react';
import { Product } from '@/lib/types';
import {
  LandingPage as Landing, landingVars, storyParagraphs, visibleStats,
  jeLandingIkona, type LandingIkona,
} from '@/lib/landing';
import RichText from './RichText';
import LandingStats from './LandingStats';
import OverlayFigure from './OverlayFigure';
import StoryRow from './StoryRow';
import LandingBuy from './LandingBuy';
import FreeGiftBlock from '@/components/FreeGiftBlock';
import styles from './LandingPage.module.css';

/**
 * Ime ikone -> lucide komponenta.
 *
 * Imena NE stoje ovde nego u LANDING_IKONE (lib/landing.ts), odakle ih cita i
 * prompt za AI. Tip `Record<LandingIkona, LucideIcon>` je zasto to ostaje
 * usklađeno: dodaš ime tamo a komponentu ne ovde - tsc pada.
 */
const IKONE: Record<LandingIkona, LucideIcon> = {
  sparkles: Sparkles, zap: Zap, shield: Shield, check: BadgeCheck, clock: Clock,
  heart: Heart, home: Home, leaf: Leaf, lock: Lock, package: Package,
  star: Star, truck: Truck, wallet: Wallet, wrench: Wrench, gauge: Gauge,
  battery: Battery, traffic: TrafficCone, dumbbell: Dumbbell, sofa: Sofa,
};

/** Ime iz podataka (gde sme da bude i prazno ili pogresno) -> komponenta ili undefined. */
function ikona(ime: string | undefined): LucideIcon | undefined {
  return ime && jeLandingIkona(ime) ? IKONE[ime] : undefined;
}


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
              <OverlayFigure
                image={landing.problemImage}
                title={landing.problemTitle}
                badge={landing.problemBadge}
                caption={landing.problemCaption}
              />
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

      {/*
          Granica uvoda. Lepljiva traka (LandingBuy) se pojavljuje kad ovaj
          marker izadje iznad ekrana - dakle kad su hero i slika problema
          prescrolovani. Marker, ne sama sekcija, jer slike problema ne mora
          da bude, a granica treba da postoji svakako.
      */}
      <div className={styles.gate} data-lp-gate aria-hidden="true" />

      {/* 3. Priča */}
      {prica.length > 0 && (
        <section className={styles.section}>
          <div className={`${styles.wrap} ${styles.narrow} ${styles.story}`}>
            {prica.map((p, i) => {
              const Ikona = ikona(landing.storyIcons?.[i]);
              return (
                <StoryRow key={i} delay={i * 90}>
                  {Ikona && (
                    <span className={styles.storyIcon} aria-hidden="true">
                      <Ikona size={17} strokeWidth={2.2} />
                    </span>
                  )}
                  <p><RichText text={p} /></p>
                </StoryRow>
              );
            })}
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
                const Ikona = ikona(b.icon) ?? Sparkles;
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

      {/* 6. Podaci koji grade poverenje, sa malom najavnom slikom iznad.
             Najava se prikazuje samo uz statistiku - sama, bez brojeva ispod,
             bila bi slika niotkuda. */}
      {stats.length > 0 && (
        <section className={styles.sectionTight}>
          <div className={styles.wrap}>
            {landing.statsImage && landing.statsTitle && (
              <div className={styles.statsIntro}>
                <OverlayFigure image={landing.statsImage} title={landing.statsTitle} compact />
              </div>
            )}
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
          <div className={styles.cta} data-lp-cta>
            <h2 className={styles.ctaTitle}>
              <RichText text={landing.ctaTitle || 'Naručite danas'} />
            </h2>
            {landing.ctaLead && <p className={styles.ctaLead}>{landing.ctaLead}</p>}
            {/* Poklon stoji neposredno iznad dugmadi, da se vidi pre porudzbine.
                FreeGiftBlock se boji --brand tokenima, koje landingVars premapira
                na temu proizvoda - pa se uklapa u svih pet tema bez izmena. */}
            {product.freeGift && (
              <div className={styles.giftWrap}>
                <FreeGiftBlock gift={product.freeGift} />
              </div>
            )}
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
