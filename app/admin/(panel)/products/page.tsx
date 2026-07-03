'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatPrice } from '@/lib/shopify';
import styles from '../../admin.module.css';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((json) => setProducts(json.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Obrisati proizvod "${title}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Proizvodi</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Učitavanje...' : `${products.length} proizvoda u katalogu`}
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Novi proizvod
        </Link>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.empty}>Učitavanje...</div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <p>Nema proizvoda</p>
            <Link href="/admin/products/new" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
              Dodaj prvi proizvod
            </Link>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Proizvod</th>
                <th>Kategorija</th>
                <th>Cena</th>
                <th>Stanje</th>
                <th>Status</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const price = product.variants[0]?.price.amount ?? product.priceRange.minVariantPrice.amount;
                const qty = product.variants[0]?.quantityAvailable ?? 0;
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
                          <div className={styles.productThumb}>🛍️</div>
                        )}
                        <div>
                          <Link href={`/admin/products/${product.id}/edit`} className={styles.tableLink}>
                            {product.title}
                          </Link>
                          <p style={{ fontSize: '0.72rem', color: 'var(--admin-muted)' }}>/{product.handle}</p>
                        </div>
                      </div>
                    </td>
                    <td>{product.productType}</td>
                    <td>{formatPrice(price)}</td>
                    <td>{qty} kom</td>
                    <td>
                      <span className={`${styles.badge} ${product.availableForSale ? styles.badgeActive : styles.badgeInactive}`}>
                        {product.availableForSale ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/products/${product.handle}`} className={styles.iconBtn} title="Pogledaj u prodavnici" target="_blank">
                          ↗
                        </Link>
                        <Link href={`/admin/products/${product.id}/edit`} className={styles.iconBtn} title="Izmeni">
                          ✎
                        </Link>
                        <button
                          type="button"
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Obriši"
                          disabled={deleting === product.id}
                          onClick={() => handleDelete(product.id, product.title)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
