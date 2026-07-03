'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Product, Collection } from '@/lib/types';
import styles from './page.module.css';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') ?? '');
  const [sortBy, setSortBy] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      const res = await fetch(`/api/shopify?${params}`);
      const json = await res.json();
      let data: Product[] = json.data ?? [];

      if (selectedTag) {
        data = data.filter((p) => p.tags.includes(selectedTag));
      }

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
      setLoading(false);
    }
  }, [searchQuery, selectedTag, sortBy]);

  const fetchCollections = useCallback(async () => {
    try {
      const res = await fetch('/api/shopify?type=collections');
      const json = await res.json();
      setCollections(json.data ?? []);
    } catch {
      setCollections([]);
    }
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    router.push(`/products?${params}`);
  };

  const allTags = Array.from(new Set(products.flatMap((p) => p.tags)));

  const popularTags = ['bestseller', 'novo', 'elektronika', 'sport', 'gaming', 'kuhinja'];
  const visibleTags = allTags.filter((t) => popularTags.includes(t));

  return (
    <div className={styles.page}>
      {/* Header */}
      <section className={styles.pageHeader}>
        <div className={styles.headerBg} />
        <div className="container">
          <h1 className={styles.pageTitle}>Svi proizvodi</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Učitavanje...' : `${products.length} proizvoda dostupno`}
          </p>
        </div>
      </section>

      <div className="container">
        {/* Filters bar */}
        <div className={styles.filtersBar}>
          {/* Search */}
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className={`input ${styles.searchInput}`}
                placeholder="Pretraži proizvode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="products-search-input"
              />
            </div>
          </form>

          {/* Sort */}
          <select
            className={`select ${styles.sortSelect}`}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            id="products-sort-select"
          >
            <option value="">Relevantnost</option>
            <option value="price-asc">Cena: od niže</option>
            <option value="price-desc">Cena: od više</option>
            <option value="name">Po imenu</option>
          </select>
        </div>

        {/* Tags */}
        {visibleTags.length > 0 && (
          <div className={styles.tags}>
            <span
              className={`tag-pill ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag('')}
            >
              Sve
            </span>
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </span>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={`skeleton ${styles.skeletonImg}`} />
                <div className={styles.skeletonInfo}>
                  <div className={`skeleton ${styles.skeletonLine}`} />
                  <div className={`skeleton ${styles.skeletonLineShort}`} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>Nema rezultata</h3>
            <p>Pokušajte sa drugačijim pojmom pretrage</p>
          </div>
        ) : (
          <div className="grid-products">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="page-loader"><div className="loader" /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
