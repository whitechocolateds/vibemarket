'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, PackageSearch, ArrowUpDown, Loader2,
  LayoutGrid, Flame, Sparkles, Dumbbell, Cpu, UtensilsCrossed, ShoppingBag, Truck, ShieldCheck, CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/motion/Reveal';
import { Product } from '@/lib/types';
import styles from './page.module.css';

const POPULAR_TAGS = ['bestseller', 'novo', 'sport', 'fudbal', 'elektronika', 'kuhinja'];

const TAG_ICONS: Record<string, LucideIcon> = {
  bestseller: Flame,
  novo: Sparkles,
  sport: Dumbbell,
  fudbal: ShoppingBag,
  elektronika: Cpu,
  kuhinja: UtensilsCrossed,
};

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? '');

  // Rezultat poslednjeg završenog fetch-a; "refetching" se izvodi poređenjem ključa filtera
  const [result, setResult] = useState<{ key: string; products: Product[] } | null>(null);

  // Debounce free-text search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filterKey = `${searchQuery}|${selectedTag}|${sortBy}`;

  useEffect(() => {
    let active = true;
    const key = `${searchQuery}|${selectedTag}|${sortBy}`;
    (async () => {
      let data: Product[] = [];
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        const res = await fetch(`/api/products?${params}`);
        const json = await res.json();
        data = json.data ?? [];

        if (selectedTag) data = data.filter((p) => p.tags.includes(selectedTag));

        if (sortBy === 'price-asc') {
          data.sort((a, b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount));
        } else if (sortBy === 'price-desc') {
          data.sort((a, b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount));
        } else if (sortBy === 'name') {
          data.sort((a, b) => a.title.localeCompare(b.title, 'sr'));
        }
      } catch {
        data = [];
      }
      if (active) setResult({ key, products: data });
    })();
    return () => { active = false; };
  }, [searchQuery, selectedTag, sortBy]);

  const initialLoading = result === null;
  const refetching = result !== null && result.key !== filterKey;
  const products = result?.products ?? [];

  // Keep the URL in sync so filters are shareable/bookmarkable, without a full navigation
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) { firstSync.current = false; return; }
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedTag) params.set('tag', selectedTag);
    if (sortBy) params.set('sort', sortBy);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : '/products', { scroll: false });
  }, [searchQuery, selectedTag, sortBy, router]);

  const resetFilters = () => {
    setSearchInput('');
    setSelectedTag('');
    setSortBy('');
  };

  const hasActiveFilters = Boolean(searchQuery || selectedTag);
  const allTags = Array.from(new Set(products.flatMap((p) => p.tags)));
  const visibleTags = allTags.filter((t) => POPULAR_TAGS.includes(t));

  return (
    <div className={styles.page}>
      <div className={styles.heroSection}>
        <div className="container">
          <Reveal>
            <div className={styles.heroCard}>
              <div className={styles.heroGlowAccent} />
              <div className={styles.heroBadge}>
                <Sparkles size={14} className={styles.heroSparkleIcon} />
                <span>EKSKLUZIVNI KATALOG</span>
              </div>
              <h1 className={styles.heroTitle}>
                Svi Proizvodi na <span className={styles.heroTitleHighlight}>Jednom Mestu</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Pregledajte našu pažljivo odabranu kolekciju premium artikala. Brza dostava 1-3 radna dana, garancija kvaliteta i sigurno plaćanje pouzećem.
              </p>
              <div className={styles.heroPillsRow}>
                <div className={styles.heroFeatureChip}>
                  <div className={styles.chipIconWrap}><Truck size={14} /></div>
                  <span>Besplatna dostava od 5.000 RSD</span>
                </div>
                <div className={styles.heroFeatureChip}>
                  <div className={styles.chipIconWrap}><ShieldCheck size={14} /></div>
                  <span>Plaćanje pouzećem pri preuzimanju</span>
                </div>
                <div className={styles.heroFeatureChip}>
                  <div className={styles.chipIconWrap}><CheckCircle2 size={14} /></div>
                  <span>100% Garancija zadovoljstva</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className="container">
          <Reveal>
            <div className={styles.toolbarHead}>
              <div className={styles.titleBlock}>
                <h2 className={styles.pageTitle}>Kolekcija</h2>
                <span className={styles.countBadge}>
                  {initialLoading ? 'Učitavanje...' : `${products.length} artikala`}
                </span>
              </div>

              {visibleTags.length > 0 && (
                <div className={styles.tagsBar}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${!selectedTag ? styles.filterChipActive : ''}`}
                    onClick={() => setSelectedTag('')}
                  >
                    <LayoutGrid size={13} /> Sve
                  </button>
                  {visibleTags.map((tag) => {
                    const Icon = TAG_ICONS[tag];
                    return (
                      <button
                        type="button"
                        key={tag}
                        className={`${styles.filterChip} ${selectedTag === tag ? styles.filterChipActive : ''}`}
                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                      >
                        {Icon && <Icon size={13} />} {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    );
                  })}
                  <AnimatePresence>
                    {hasActiveFilters && (
                      <motion.button
                        type="button"
                        className={styles.resetInline}
                        onClick={resetFilters}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <X size={12} /> Resetuj
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className={styles.filters}>
                <AnimatePresence>
                  {refetching && !initialLoading && (
                    <motion.span
                      className={styles.inlineSpinner}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 size={14} className={styles.spin} />
                    </motion.span>
                  )}
                </AnimatePresence>
                <form onSubmit={(e) => e.preventDefault()} className={styles.searchWrap}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Pretraži proizvode..."
                    aria-label="Pretraži proizvode"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <AnimatePresence>
                    {searchInput && (
                      <motion.button
                        type="button"
                        className={styles.clearBtn}
                        aria-label="Obriši pretragu"
                        onClick={() => setSearchInput('')}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                      >
                        <X size={14} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </form>
                <div className={styles.sortWrap}>
                  <ArrowUpDown size={14} className={styles.sortIcon} />
                  <select
                    className={styles.sortSelect}
                    aria-label="Sortiraj proizvode"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="">Podrazumevano</option>
                    <option value="price-asc">Cena: rastuće ↑</option>
                    <option value="price-desc">Cena: opadajuće ↓</option>
                    <option value="name">Naziv A-Z</option>
                  </select>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="container">
        {initialLoading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <PackageSearch size={40} strokeWidth={1} className="empty-state-icon" style={{ margin: '0 auto var(--space-4)' }} />
            <h3>Nema rezultata</h3>
            <p>Pokušajte sa drugim pojmom ili filterom</p>
            {hasActiveFilters && (
              <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 20 }} onClick={resetFilters}>
                Resetuj filtere
              </button>
            )}
          </div>
        ) : (
          <motion.div className="grid-products" layout style={{ opacity: refetching ? 0.55 : 1, transition: 'opacity 0.2s ease' }}>
            {products.map((product, i) => (
              <Reveal key={product.id} delay={Math.min(i * 0.05, 0.4)}>
                <ProductCard product={product} index={i} />
              </Reveal>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
