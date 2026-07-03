import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'VibeMarket — Premium Online Prodavnica | Dostava 1–3 dana, plaćanje pouzećem',
  description: 'Pronađite premium elektroniku, modu, sport i još mnogo toga. Dostava 1–3 radna dana, plaćanje pouzećem. Srbija.',
};

async function getFeaturedProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/shopify?first=8`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed');
    const json = await res.json();
    return json.data ?? MOCK_PRODUCTS.slice(0, 8);
  } catch {
    return MOCK_PRODUCTS.slice(0, 8);
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();
  const heroProduct = products[0];

  const categories = [
    { icon: '📱', label: 'Elektronika', tag: 'elektronika' },
    { icon: '👕', label: 'Moda', tag: 'moda' },
    { icon: '⚽', label: 'Sport', tag: 'sport' },
    { icon: '🎮', label: 'Gaming', tag: 'gaming' },
  ];

  const features = [
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: 'Plaćanje pouzećem',
    desc: 'Platite kuriru pri preuzimanju',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: 'Dostava 1–3 dana',
    desc: 'Cela Srbija',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Sigurna kupovina',
    desc: 'Zaštita kupaca',
  },
  {
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: 'Podrška 24/7',
    desc: 'Tu smo za vas',
  },
];

  return (
    <>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <span className="section-label">Online prodavnica #1 u Srbiji</span>
            <h1 className={styles.heroTitle}>
              Sve što vam treba,<br />
              <em>na jednom mestu</em>
            </h1>
            <p className={styles.heroSubtitle}>
              Pažljivo odabrani proizvodi po najboljim cenama. Brza dostava i plaćanje pouzećem — kupovina bez stresa.
            </p>
            <div className={styles.heroCta}>
              <Link href="/products" className="btn btn-primary btn-lg" id="hero-shop-btn">
                Istraži proizvode
              </Link>
              <Link href="/products?tag=bestseller" className="btn btn-secondary btn-lg">
                Bestselleri
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>500+</span>
                <span className={styles.statLabel}>Proizvoda</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>10k+</span>
                <span className={styles.statLabel}>Zadovoljnih kupaca</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>4.9★</span>
                <span className={styles.statLabel}>Ocena</span>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroImageWrap}>
              {heroProduct?.featuredImage ? (
                <Image
                  src={heroProduct.featuredImage.url}
                  alt={heroProduct.title}
                  fill
                  sizes="(max-width: 960px) 80vw, 500px"
                  className={styles.heroImage}
                  priority
                />
              ) : (
                <div className={styles.heroPlaceholder}>🛍️</div>
              )}
            </div>
            <div className={styles.heroCard}>
              <p className={styles.heroCardLabel}>Izdvojeno</p>
              <p className={styles.heroCardName}>{heroProduct?.title ?? 'Premium Proizvod'}</p>
              <p className={styles.heroCardPrice}>
                {heroProduct
                  ? `${parseFloat(heroProduct.priceRange.minVariantPrice.amount).toLocaleString('sr-RS')} RSD`
                  : ''}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust marquee */}
      <div className={styles.marquee}>
        <div className={styles.marqueeTrack}>
          {[...Array(2)].map((_, i) => (
            <div key={i} className={styles.marqueeContent}>
              <span>✦ Besplatna dostava preko 5.000 RSD</span>
              <span>✦ Plaćanje pouzećem</span>
              <span>✦ Dostava 1–3 radna dana</span>
              <span>✦ Garancija zadovoljstva</span>
              <span>✦ Podrška 24/7</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className={styles.categories}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="section-label">Kategorije</span>
            <h2 className="section-title">Pronađite po interesovanju</h2>
          </div>
          <div className={styles.categoryGrid}>
            {categories.map((cat) => (
              <Link key={cat.tag} href={`/products?tag=${cat.tag}`} className={styles.categoryCard}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryLabel}>{cat.label}</span>
                <svg className={styles.categoryArrow} width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {features.map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className={styles.productsSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <span className="section-label">Izdvojeno</span>
              <h2 className="section-title">Popularni proizvodi</h2>
            </div>
            <Link href="/products" className="btn btn-secondary" id="view-all-top-btn">
              Pogledaj sve →
            </Link>
          </div>
          <div className="grid-products">
            {products.map((product: import('@/lib/types').Product, i: number) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Poručite danas, dobijte za 1–3 dana</h2>
              <p className={styles.ctaSubtitle}>
                Plaćanje pouzećem — platite kuriru tek kada paket stigne. Bez rizika, bez brige.
              </p>
            </div>
            <Link href="/products" className="btn btn-primary btn-lg" id="cta-shop-btn">
              Kupuj sada
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
