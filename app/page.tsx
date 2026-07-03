import type { Metadata } from 'next';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Marquee from '@/components/Marquee';
import Reveal from '@/components/motion/Reveal';
import HeroSpotlight from '@/components/HeroSpotlight';
import HeroGlow from '@/components/HeroGlow';
import KineticHeading from '@/components/motion/KineticHeading';
import RotatingEyebrow from '@/components/motion/RotatingEyebrow';
import TestimonialCard from '@/components/TestimonialCard';
import { getAllProducts, getProductByHandle } from '@/lib/productStore';
import { Star, Truck, Wallet, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'VibeMarket - Prodavnica sa stavom',
  description: 'Pažljivo odabrani proizvodi. Dostava 1–3 radna dana širom Srbije. Plaćanje pouzećem.',
};

const TESTIMONIALS = [
  {
    quote: 'Poručila sam u ponedeljak, paket stigao u sredu - tačno kako piše. Kvalitet proizvoda daleko iznad očekivanog.',
    name: 'Milica R.',
    city: 'Beograd',
  },
  {
    quote: 'Konačno prodavnica koja ne obećava lažno. Plaćanje pouzećem mi daje sigurnost, a podrška odgovara isti dan.',
    name: 'Nikola T.',
    city: 'Novi Sad',
  },
  {
    quote: 'Ništa nije nasumično - svaki proizvod deluje promišljeno, ne kao gomila slučajnih artikala.',
    name: 'Jovana M.',
    city: 'Niš',
  },
];

const FEATURED_ORDER = [
  'bežične-slušalice-pro',
  'pametni-sat-sport',
  'bluetooth-zvucnik',
  'mehanička-tastatura',
  'web-kamera-4k',
  'wireless-punjač',
  'laptop-stend',
  'fitnes-narukvica',
  'kibla-za-led-mega',
];

export default async function HomePage() {
  const all = await getAllProducts();
  const products = [...all]
    .sort((a, b) => FEATURED_ORDER.indexOf(a.handle) - FEATURED_ORDER.indexOf(b.handle))
    .slice(0, 7);
  const heroProduct = (await getProductByHandle('bežične-slušalice-pro')) ?? products[0];
  const heroAccent = (await getProductByHandle('pametni-sat-sport')) ?? products[1];

  return (
    <>
      <div className={styles.heroFrame}>
      <section className={styles.hero}>
        <div className="mesh-bg" />
        <HeroGlow />
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <Reveal>
              <RotatingEyebrow />
            </Reveal>

            <KineticHeading
              text="Pronađi svoj vibe."
              emphasize="vibe."
              className={styles.heroTitle}
              delay={0.15}
            />

            <Reveal delay={0.5}>
              <p className={styles.heroLead}>
                Predmeti birani sa ukusom, ne nasumično.
                Naručite danas, platite kad vam stignu na vrata.
              </p>
            </Reveal>

            <Reveal delay={0.65}>
              <div className={styles.heroActions}>
                <Link href="/products" className="btn btn-primary btn-lg">
                  Pogledaj ponudu
                </Link>
                <Link href="/products?tag=novo" className="btn btn-ghost btn-lg">
                  Šta je novo →
                </Link>
              </div>
            </Reveal>

            <div className={styles.heroTrust}>
              <div className={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Reveal key={i} delay={0.85 + i * 0.08}>
                    <Star size={13} fill="currentColor" strokeWidth={0} />
                  </Reveal>
                ))}
              </div>
              <Reveal delay={1.25}>
                <span>4.9 / 5 · preko 2.400 recenzija</span>
              </Reveal>
            </div>
          </div>

          {heroProduct && <HeroSpotlight product={heroProduct} accent={heroAccent} />}
        </div>

        <div className={styles.heroScroll}>
          <span>Skroluj</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      <Marquee />
      </div>

      <section className={styles.collection}>
        <div className="container">
          <Reveal>
            <header className={styles.sectionHeader}>
              <div>
                <span className="section-label">Kolekcija</span>
                <h2 className="section-title">Izabrano za vas</h2>
              </div>
              <Link href="/products" className="btn btn-outline">
                Svi proizvodi
              </Link>
            </header>
          </Reveal>
          <div className={styles.spotlightGrid}>
            {products.map((product, i) => (
              <Reveal key={product.id} delay={i * 0.06} className={i === 0 ? styles.spotlightItem : undefined}>
                <ProductCard product={product} index={i} spotlight={i === 0} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.testimonials}>
        <div className="container">
          <Reveal>
            <span className="section-label">Iskustva kupaca</span>
            <h2 className="section-title">Reč po reč, bez filtera</h2>
          </Reveal>
          <div className={styles.testimonialGrid}>
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <TestimonialCard quote={t.quote} name={t.name} city={t.city} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="mesh-bg" />
        <div className={`container ${styles.ctaInner}`}>
          <Reveal>
            <span className="section-label">Spremni?</span>
            <h2 className={styles.ctaTitle}>Vaš vibe vas čeka.</h2>
            <p className={styles.ctaLead}>Poručite danas - platite kuriru tek kad paket stigne.</p>
            <Link href="/products" className="btn btn-primary btn-lg">
              Otvori prodavnicu
            </Link>
            <div className={styles.ctaTrust}>
              <span><Truck size={15} /> Dostava 1–3 dana</span>
              <span><Wallet size={15} /> Plaćanje pouzećem</span>
              <span><ShieldCheck size={15} /> Sigurna kupovina</span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
