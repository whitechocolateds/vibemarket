'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, ShoppingBag, Download, Phone, Mail, MapPin, CheckSquare, Square, ChevronDown, AlertTriangle } from 'lucide-react';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { STATUS_LABELS } from '@/components/admin/StatusBadge';
import ShopifySyncBadge from '@/components/admin/ShopifySyncBadge';
import { toast } from '@/components/admin/Toaster';
import { downloadXls, XlsColumn } from '@/lib/exportOrders';
import styles from '../../admin.module.css';

type SortKey = 'newest' | 'oldest' | 'amountDesc' | 'amountAsc';

const AUTO_REFRESH_SECONDS = 60;

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

  // Bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<Order['status']>('confirmed');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Auto-refresh
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REFRESH_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(false);
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((json) => { setOrders(json.data ?? []); })
      .catch(() => { setError(true); })
      .finally(() => { setLoading(false); });
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  // Auto-refresh countdown
  useEffect(() => {
    setSecondsLeft(AUTO_REFRESH_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchOrders(false);
          return AUTO_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = () => {
    setLoading(true);
    setError(false);
    setSecondsLeft(AUTO_REFRESH_SECONDS);
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

  const handleBulkUpdate = async () => {
    if (selected.size === 0) return;
    setBulkUpdating(true);
    let successCount = 0;
    for (const id of Array.from(selected)) {
      try {
        const res = await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: bulkStatus }),
        });
        const json = await res.json();
        if (res.ok) {
          setOrders((prev) => prev.map((o) => (o.id === id ? json.data : o)));
          successCount++;
        }
      } catch { /* continue */ }
    }
    toast(`${successCount} porudžbina promenjena u „${STATUS_LABELS[bulkStatus]}"`);
    setSelected(new Set());
    setBulkUpdating(false);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((o) => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.totalPrice, 0);

  /*
   * Neposlate se izdvajaju na vrh stranice.
   * Same oznake u tabeli nisu dovoljne - da bi se primetile, treba pregledati
   * svaki red. Ovo je jedina stvar na stranici koja trazi rucnu intervenciju.
   */
  const neposlate = orders.filter((o) => o.shopifySync?.status === 'neuspelo');
  const cekaju = orders.filter((o) => o.shopifySync?.status === 'ceka');

  return (
    <>
      {(neposlate.length > 0 || cekaju.length > 0) && (
        <div className={styles.syncWarning} role="status">
          <AlertTriangle size={17} strokeWidth={2.5} />
          <div>
            {neposlate.length > 0 && (
              <p>
                <strong>
                  {neposlate.length === 1
                    ? '1 porudžbina nije stigla u Shopify'
                    : `${neposlate.length} porudžbina nije stiglo u Shopify`}
                </strong>
                {' — '}
                {neposlate.slice(0, 5).map((o, i) => (
                  <span key={o.id}>
                    {i > 0 && ', '}
                    <Link href={`/admin/orders/${o.id}`} className={styles.tableLink}>{o.orderNumber}</Link>
                  </span>
                ))}
                {neposlate.length > 5 && ` i još ${neposlate.length - 5}`}
                . Treba ih uneti ručno.
              </p>
            )}
            {cekaju.length > 0 && (
              <p className={styles.syncWarningMuted}>
                {cekaju.length === 1 ? '1 porudžbina čeka' : `${cekaju.length} porudžbina čeka`} ishod slanja.
                Ako ovo dugo stoji, slanje je prekinuto pre nego što se ishod upisao.
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Porudžbine</h1>
          <p className={styles.pageSubtitle}>
            {loading
              ? 'Učitavanje...'
              : `${orders.length} porudžbina · ${formatPrice(totalRevenue)} prihoda`}
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          {/* Auto-refresh indicator */}
          <span className={styles.refreshIndicator}>
            <span className={styles.refreshDot} />
            Osveži za {secondsLeft}s
          </span>
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

      {/* Bulk actions toolbar — appears when rows selected */}
      {selected.size > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkBarText}>
            {selected.size} {selected.size === 1 ? 'porudžbina izabrana' : 'porudžbina izabrano'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>→ Promeni status u:</span>
          <select
            className={styles.bulkSelect}
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as Order['status'])}
            aria-label="Bulk status"
          >
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={bulkUpdating}
            onClick={handleBulkUpdate}
            style={{ height: 36, padding: '0 16px', fontSize: '0.82rem' }}
          >
            {bulkUpdating ? 'Ažuriranje...' : 'Primeni na sve'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSelected(new Set())}
            style={{ height: 36, padding: '0 12px', fontSize: '0.82rem', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Poništi
          </button>
        </div>
      )}

      <div className={styles.card}>
        {loading ? (
          <div>{[...Array(5)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}</div>
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
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      className={styles.rowCheckbox}
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      aria-label="Izaberi sve"
                    />
                  </th>
                  <th>Broj</th>
                  <th>Kupac</th>
                  <th>Grad</th>
                  <th>Stavki</th>
                  <th>Iznos</th>
                  <th>Status</th>
                  <th>Shopify</th>
                  <th>Datum</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} style={selected.has(order.id) ? { background: 'rgba(22, 82, 190, 0.05)' } : {}}>
                    <td>
                      <input
                        type="checkbox"
                        className={styles.rowCheckbox}
                        checked={selected.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        aria-label={`Izaberi porudžbinu ${order.orderNumber}`}
                      />
                    </td>
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
                    <td>
                      <ShopifySyncBadge sync={order.shopifySync} />
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
