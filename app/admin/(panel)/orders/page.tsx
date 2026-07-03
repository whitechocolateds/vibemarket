'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/shopify';
import StatusBadge, { STATUS_LABELS } from '@/components/admin/StatusBadge';
import styles from '../../admin.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sr-RS', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((json) => setOrders(json.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? orders
    : orders.filter((o) => o.status === filter);

  const filters = [
    { key: 'all', label: 'Sve' },
    ...Object.entries(STATUS_LABELS).map(([key, label]) => ({ key, label })),
  ];

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Porudžbine</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Učitavanje...' : `${orders.length} porudžbina ukupno`}
          </p>
        </div>
      </div>

      <div className={styles.filters}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        {loading ? (
          <div className={styles.empty}>Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>Nema porudžbina</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Broj</th>
                <th>Kupac</th>
                <th>Grad</th>
                <th>Stavki</th>
                <th>Iznos</th>
                <th>Status</th>
                <th>Datum</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link href={`/admin/orders/${order.id}`} className={styles.tableLink}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td>{order.customerInfo.firstName} {order.customerInfo.lastName}</td>
                  <td>{order.customerInfo.city}</td>
                  <td>{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>{formatPrice(order.totalPrice)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
