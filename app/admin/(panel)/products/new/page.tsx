'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProductForm from '@/components/admin/ProductForm';
import { ProductInput } from '@/lib/types';
import styles from '../../../admin.module.css';

export default function NewProductPage() {
  const router = useRouter();

  const handleSubmit = async (data: ProductInput) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Greška');
    router.push('/admin/products');
    router.refresh();
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/products" className={styles.pageSubtitle} style={{ display: 'block', marginBottom: 8 }}>
            ← Nazad na proizvode
          </Link>
          <h1 className={styles.pageTitle}>Novi proizvod</h1>
          <p className={styles.pageSubtitle}>Dodajte novi artikal u prodavnicu</p>
        </div>
      </div>
      <ProductForm onSubmit={handleSubmit} submitLabel="Kreiraj proizvod" />
    </>
  );
}
