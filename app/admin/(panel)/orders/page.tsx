'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, ShoppingBag, Download, Phone, Mail, MapPin } from 'lucide-react';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { STATUS_LABELS } from '@/components/admin/StatusBadge';
import { toast } from '@/components/admin/Toaster';
import { downloadXls, XlsColumn } from '@/lib/exportOrders';
import styles from '../../admin.module.css';

type SortKey = 'newest' | 'oldest' | 'amountDesc' | 'amountAsc';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sr-RS', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((json) => { if (active) setOrders(json.data ?? []); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const load = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const updateStatus = async (id: string, status: Order['status']) => {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Greška');
      setOrders((prev) => prev.map((o) => (o.id === id ? json.data : o)));
      toast(`Status promenjen u „${STATUS_LABELS[status]}"`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Greška pri promeni statusa', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const key of Object.keys(STATUS_LABELS)) c[key] = 0;
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
    if (q) {
      list = list.filter((o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        `${o.customerInfo.firstName} ${o.customerInfo.lastName}`.toLowerCase().includes(q) ||
        o.customerInfo.city.toLowerCase().includes(q) ||
        (o.customerInfo.email ?? '').toLowerCase().includes(q) ||
        o.customerInfo.phone.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest': return a.createdAt.localeCompare(b.createdAt);
        case 'amountDesc': return b.totalPrice - a.totalPrice;
        case 'amountAsc': return a.totalPrice - b.totalPrice;
        default: return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [orders, filter, query, sort]);

  const filters = [
    { key: 'all', label: 'Sve' },
    ...Object.entries(STATUS_LABELS).map(([key, label]) => ({ key, label })),
  ];

  const exportXls = () => {
    const columns: XlsColumn[] = [
      { header: 'Broj', width: 110 },
      { header: 'Ime', width: 100 },
      { header: 'Prezime', width: 110 },
      { header: 'Telefon', width: 110, forceText: true },
      { header: 'Email', width: 200 },
      { header: 'Adresa', width: 200 },
      { header: 'Grad', width: 130 },
      { header: 'Poštanski broj', width: 100, forceText: true },
      { header: 'Stavki', width: 60 },
      { header: 'Iznos (RSD)', width: 100 },
      { header: 'Status', width: 110 },
      { header: 'Datum', width: 140 },
    ];
    const rows = filtered.map((o) => [
      o.orderNumber,
      o.customerInfo.firstName,
      o.customerInfo.lastName,
      o.customerInfo.phone,
      o.customerInfo.email ?? '',
      o.customerInfo.address,
      o.customerInfo.city,
      o.customerInfo.postalCode,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.totalPrice,
      STATUS_LABELS[o.status],
      formatDate(o.createdAt),
    ]);
    downloadXls(`porudzbine_${new Date().toISOString().slice(0, 10)}.xls`, columns, rows);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Porudžbine</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Učitavanje...' : `${orders.length} porudžbina · ${formatPrice(orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.totalPrice, 0))} prihoda`}
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportXls} disabled={loading || filtered.length === 0}>
            <Download size={14} strokeWidth={2} /> Izvezi Excel
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} strokeWidth={2} /> Osveži
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} strokeWidth={2} />
          <input
            className={styles.searchInput}
            placeholder="Pretraži po broju, kupcu, gradu, telefonu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sortiranje"
        >
          <option value="newest">Najnovije prvo</option>
          <option value="oldest">Najstarije prvo</option>
          <option value="amountDesc">Iznos: veći prvo</option>
          <option value="amountAsc">Iznos: manji prvo</option>
        </select>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className={styles.filterCount}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div>
            {[...Array(5)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
          </div>
        ) : error ? (
          <div className={styles.empty}>
            Greška pri učitavanju porudžbina
            <button type="button" className="btn btn-secondary btn-sm" onClick={load}>Pokušaj ponovo</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingBag size={32} strokeWidth={1.25} className={styles.emptyIcon} />
            {query || filter !== 'all' ? 'Nema porudžbina za zadate filtere' : 'Još nema porudžbina'}
          </div>
        ) : (
          <div className={styles.tableWrap}>
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
                    <td>
                      <p className={styles.customerName}>{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                      <p className={styles.cellMeta}><Phone size={11} strokeWidth={2} />{order.customerInfo.phone}</p>
                      {order.customerInfo.email && (
                        <p className={styles.cellMeta}><Mail size={11} strokeWidth={2} />{order.customerInfo.email}</p>
                      )}
                    </td>
                    <td>
                      <p className={styles.customerName}>{order.customerInfo.city} {order.customerInfo.postalCode}</p>
                      <p className={styles.cellMeta}><MapPin size={11} strokeWidth={2} />{order.customerInfo.address}</p>
                    </td>
                    <td>{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td><strong>{formatPrice(order.totalPrice)}</strong></td>
                    <td>
                      <select
                        className={`${styles.statusSelect} ${styles[`statusSelect_${order.status}`]}`}
                        value={order.status}
                        disabled={updating === order.id}
                        onChange={(e) => updateStatus(order.id, e.target.value as Order['status'])}
                        aria-label={`Status porudžbine ${order.orderNumber}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.cellMuted}>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
