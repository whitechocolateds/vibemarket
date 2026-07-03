'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { Product, ProductInput } from '@/lib/types';
import styles from '../../../../admin.module.css';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/products?id=${id}`)
      .then((r) => r.json())
      .then((json) => setProduct(json.data ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: ProductInput) => {
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Greška');
    router.push('/admin/products');
    router.refresh();
  };

  if (loading) return <div className={styles.empty}>Učitavanje...</div>;
  if (!product) return <div className={styles.empty}>Proizvod nije pronađen</div>;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/products" className={styles.pageSubtitle} style={{ display: 'block', marginBottom: 8 }}>
            ← Nazad na proizvode
          </Link>
          <h1 className={styles.pageTitle}>Izmeni proizvod</h1>
          <p className={styles.pageSubtitle}>{product.title}</p>
        </div>
      </div>
      <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="Sačuvaj izmene" />
    </>
  );
}
