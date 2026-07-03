'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import StatusBadge, { STATUS_LABELS } from '@/components/admin/StatusBadge';
import styles from '@/app/admin/admin.module.css';

const STATUSES = Object.keys(STATUS_LABELS) as Order['status'][];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sr-RS', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders?id=${id}`)
      .then((r) => r.json())
      .then((json) => setOrder(json.data ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: Order['status']) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (res.ok) setOrder(json.data);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.empty}>Učitavanje...</div>;
  if (error) return <div className={styles.empty}>Greška pri učitavanju porudžbine</div>;
  if (!order) return <div className={styles.empty}>Porudžbina nije pronađena</div>;

  const { customerInfo: c } = order;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/orders" className={styles.pageSubtitle} style={{ display: 'block', marginBottom: 8 }}>
            ← Nazad na porudžbine
          </Link>
          <h1 className={styles.pageTitle}>{order.orderNumber}</h1>
          <p className={styles.pageSubtitle}>{formatDate(order.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={order.status} />
          <select
            className={styles.statusSelect}
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as Order['status'])}
            disabled={saving}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.card}>
          <div className={styles.detailSection}>
            <h3>Stavke porudžbine</h3>
            <div className={styles.itemList}>
              {order.items.map((item) => (
                <div key={item.id} className={styles.orderItem}>
                  {item.image ? (
                    <Image
                      src={item.image.url}
                      alt={item.title}
                      width={48}
                      height={48}
                      className={styles.orderItemImg}
                    />
                  ) : (
                    <div className={styles.orderItemImg}>◆</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.875rem' }}>{item.title}</strong>
                    {item.variantTitle && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--admin-muted)' }}>{item.variantTitle}</p>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--admin-muted)' }}>Količina: {item.quantity}</p>
                  </div>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className={styles.detailRow} style={{ marginTop: 16, fontWeight: 700 }}>
              <span>Ukupno</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.detailSection}>
            <h3>Podaci kupca</h3>
            <div className={styles.detailRow}><span>Ime</span><span>{c.firstName} {c.lastName}</span></div>
            <div className={styles.detailRow}><span>Email</span><span>{c.email}</span></div>
            <div className={styles.detailRow}><span>Telefon</span><span>{c.phone}</span></div>
            <div className={styles.detailRow}><span>Adresa</span><span>{c.address}</span></div>
            <div className={styles.detailRow}><span>Grad</span><span>{c.city}, {c.postalCode}</span></div>
            <div className={styles.detailRow}><span>Plaćanje</span><span>Pouzeće</span></div>
            {c.note && (
              <div className={styles.detailRow}><span>Napomena</span><span>{c.note}</span></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
