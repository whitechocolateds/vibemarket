'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, RefreshCw, Package, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { toast } from '@/components/admin/Toaster';
import styles from '../../admin.module.css';

type SortKey = 'newest' | 'title' | 'priceDesc' | 'priceAsc' | 'stockAsc';

function getQty(p: Product): number {
  return p.variants[0]?.quantityAvailable ?? 0;
}

function getPrice(p: Product): number {
  return parseFloat(p.variants[0]?.price.amount ?? p.priceRange.minVariantPrice.amount);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [busy, setBusy] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((json) => { if (active) setProducts(json.data ?? []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const load = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const categories = useMemo(
    () => ['all', ...new Set(products.map((p) => p.productType).filter(Boolean))],
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products;
    if (category !== 'all') list = list.filter((p) => p.productType === category);
    if (q) {
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      );
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'title': return a.title.localeCompare(b.title, 'sr');
        case 'priceDesc': return getPrice(b) - getPrice(a);
        case 'priceAsc': return getPrice(a) - getPrice(b);
        case 'stockAsc': return getQty(a) - getQty(b);
        default: return 0; // API već vraća najnovije prvo
      }
    });
  }, [products, query, category, sort]);

  const toggleAvailability = async (product: Product) => {
    setBusy(product.id);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, availableForSale: !product.availableForSale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Greška');
      setProducts((prev) => prev.map((p) => (p.id === product.id ? json.data : p)));
      toast(json.data.availableForSale
        ? `„${product.title}" je sada aktivan`
        : `„${product.title}" je deaktiviran`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Greška', 'error');
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const product = toDelete;
    setBusy(product.id);
    setToDelete(null);
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Greška');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast(`Proizvod „${product.title}" je obrisan`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Greška pri brisanju', 'error');
    } finally {
      setBusy(null);
    }
  };

  const activeCount = products.filter((p) => p.availableForSale).length;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Proizvodi</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Učitavanje...' : `${products.length} proizvoda · ${activeCount} aktivnih`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} strokeWidth={2} /> Osveži
          </button>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            + Novi proizvod
          </Link>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} strokeWidth={2} />
          <input
            className={styles.searchInput}
            placeholder="Pretraži po nazivu, URL-u, tagu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.sortSelect}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Kategorija"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === 'all' ? 'Sve kategorije' : cat}</option>
          ))}
        </select>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sortiranje"
        >
          <option value="newest">Najnovije prvo</option>
          <option value="title">Naziv (A–Š)</option>
          <option value="priceDesc">Cena: veća prvo</option>
          <option value="priceAsc">Cena: manja prvo</option>
          <option value="stockAsc">Zalihe: najmanje prvo</option>
        </select>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div>
            {[...Array(5)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
          </div>
        ) : error ? (
          <div className={styles.empty}>
            Greška pri učitavanju proizvoda
            <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Pokušaj ponovo</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Package size={32} strokeWidth={1.25} className={styles.emptyIcon} />
            {query || category !== 'all' ? 'Nema proizvoda za zadate filtere' : 'Nema proizvoda'}
            {!query && category === 'all' && (
              <Link href="/admin/products/new" className="btn btn-primary btn-sm">
                Dodaj prvi proizvod
              </Link>
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proizvod</th>
                  <th>Kategorija</th>
                  <th>Cena</th>
                  <th>Zalihe</th>
                  <th>Aktivan</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const price = getPrice(product);
                  const compareAt = product.variants[0]?.compareAtPrice;
                  const qty = getQty(product);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className={styles.productCell}>
                          {product.featuredImage ? (
                            <Image
                              src={product.featuredImage.url}
                              alt={product.title}
                              width={40}
                              height={40}
                              className={styles.productThumb}
                            />
                          ) : (
                            <div className={styles.productThumb}><Package size={16} strokeWidth={1.5} /></div>
                          )}
                          <div>
                            <Link href={`/admin/products/${product.id}/edit`} className={styles.tableLink}>
                              {product.title}
                            </Link>
                            <p className={styles.cellMuted}>/{product.handle}</p>
                          </div>
                        </div>
                      </td>
                      <td>{product.productType}</td>
                      <td>
                        <strong>{formatPrice(price)}</strong>
                        {compareAt && (
                          <p className={styles.cellMuted} style={{ textDecoration: 'line-through' }}>
                            {formatPrice(compareAt.amount)}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.stockPill} ${qty === 0 ? styles.stockOut : qty <= 3 ? styles.stockLow : styles.stockOk}`}>
                          {qty === 0 ? 'Rasprodato' : `${qty} kom`}
                        </span>
                      </td>
                      <td>
                        <label className={styles.switch} aria-label={`Dostupnost: ${product.title}`}>
                          <input
                            type="checkbox"
                            className={styles.switchInput}
                            checked={product.availableForSale}
                            disabled={busy === product.id}
                            onChange={() => toggleAvailability(product)}
                          />
                          <span className={styles.switchTrack} />
                        </label>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link
                            href={`/products/${product.handle}`}
                            className={styles.iconBtn}
                            title="Pogledaj u prodavnici"
                            aria-label="Pogledaj u prodavnici"
                            target="_blank"
                          >
                            <ExternalLink size={14} strokeWidth={2} />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className={styles.iconBtn}
                            title="Izmeni"
                            aria-label="Izmeni proizvod"
                          >
                            <Pencil size={14} strokeWidth={2} />
                          </Link>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Obriši"
                            aria-label="Obriši proizvod"
                            disabled={busy === product.id}
                            onClick={() => setToDelete(product)}
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toDelete && (
        <div className={styles.modalOverlay} onClick={() => setToDelete(null)}>
          <div className={styles.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Obriši proizvod?</h2>
            <p className={styles.modalText}>
              Proizvod <strong>„{toDelete.title}“</strong> će biti trajno uklonjen iz kataloga.
              Ova akcija se ne može opozvati.
            </p>
            <div className={styles.modalActions}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setToDelete(null)}>
                Odustani
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={confirmDelete}>
                <Trash2 size={14} strokeWidth={2} /> Obriši
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
