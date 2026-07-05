'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import { toast } from '@/components/admin/Toaster';
import { Product, ProductInput } from '@/lib/types';
import styles from '../../../../admin.module.css';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/products?id=${id}`)
      .then((r) => r.json())
      .then((json) => setProduct(json.data ?? null))
      .catch(() => setError(true))
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
    toast(`Izmene za „${data.title}" su sačuvane`);
    router.push('/admin/products');
    router.refresh();
  };

  if (loading) {
    return (
      <div className={styles.card}>
        {[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
      </div>
    );
  }
  if (error) return <div className={styles.empty}>Greška pri učitavanju proizvoda</div>;
  if (!product) return <div className={styles.empty}>Proizvod nije pronađen</div>;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/products" className={styles.backLink}>
            <ArrowLeft size={14} strokeWidth={2} /> Nazad na proizvode
          </Link>
          <h1 className={styles.pageTitle}>Izmeni proizvod</h1>
          <p className={styles.pageSubtitle}>{product.title}</p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/products/${product.handle}`} target="_blank" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} strokeWidth={2} /> Pogledaj u prodavnici
          </Link>
        </div>
      </div>
      <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="Sačuvaj izmene" />
    </>
  );
}
