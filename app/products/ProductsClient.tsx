'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, PackageSearch, ArrowUpDown, Loader2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import Reveal from '@/components/motion/Reveal';
import { Product } from '@/lib/types';
import styles from './page.module.css';

const POPULAR_TAGS = ['bestseller', 'novo', 'sport', 'fudbal', 'elektronika', 'kuhinja'];

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') ?? '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') ?? '');

  const [products, setProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);

  // Debounce free-text search so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchProducts = useCallback(async () => {
    setRefetching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      let data: Product[] = json.data ?? [];

      if (selectedTag) data = data.filter((p) => p.tags.includes(selectedTag));

      if (sortBy === 'price-asc') {
        data.sort((a, b) => parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount));
      } else if (sortBy === 'price-desc') {
        data.sort((a, b) => parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount));
      } else if (sortBy === 'name') {
        data.sort((a, b) => a.title.localeCompare(b.title, 'sr'));
      }

      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setRefetching(false);
      setInitialLoading(false);
    }
  }, [searchQuery, selectedTag, sortBy]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

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
      <section className={styles.hero}>
        <div className="container">
          <Reveal>
            <span className="section-label">Prodavnica</span>
            <h1 className={styles.heroTitle}>Kolekcija</h1>
            <p className={styles.heroSub}>
              {initialLoading ? 'Učitavanje...' : `${products.length} pažljivo odabranih artikala`}
            </p>
          </Reveal>
        </div>
      </section>

      <div className={styles.toolbar}>
        <div className="container">
          <div className={styles.filters}>
            <form onSubmit={(e) => e.preventDefault()} className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                className={`input ${styles.searchInput}`}
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
                className={`select ${styles.sort}`}
                aria-label="Sortiraj proizvode"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="">Podrazumevano</option>
                <option value="price-asc">Cena ↑</option>
                <option value="price-desc">Cena ↓</option>
                <option value="name">Naziv</option>
              </select>
            </div>
          </div>

          {visibleTags.length > 0 && (
            <div className={styles.tags}>
              <button type="button" className={`tag-pill ${!selectedTag ? 'active' : ''}`} onClick={() => setSelectedTag('')}>Sve</button>
              {visibleTags.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.button
                    type="button"
                    className={styles.resetInline}
                    onClick={resetFilters}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                  >
                    <X size={12} /> Resetuj
                  </motion.button>
                )}
              </AnimatePresence>
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
            </div>
          )}
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
