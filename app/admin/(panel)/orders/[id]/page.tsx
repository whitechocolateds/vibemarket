'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Check,
  Clock3,
  PackageCheck,
  Truck,
  Home,
  XCircle,
  Printer,
  Copy,
  Package,
  User,
} from 'lucide-react';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import StatusBadge, { STATUS_LABELS } from '@/components/admin/StatusBadge';
import { toast } from '@/components/admin/Toaster';
import GeminiCustomerMessageBox from '@/components/admin/GeminiCustomerMessageBox';
import styles from '@/app/admin/admin.module.css';

const FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const;

const STEP_ICONS = {
  pending: Clock3,
  confirmed: PackageCheck,
  shipped: Truck,
  delivered: Home,
} as const;

const NEXT_ACTION: Partial<Record<Order['status'], { next: Order['status']; label: string }>> = {
  pending: { next: 'confirmed', label: 'Potvrdi porudžbinu' },
  confirmed: { next: 'shipped', label: 'Označi kao poslato' },
  shipped: { next: 'delivered', label: 'Označi kao dostavljeno' },
};

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
      if (!res.ok) throw new Error(json.error ?? 'Greška');
      setOrder(json.data);
      toast(`Status promenjen u „${STATUS_LABELS[status]}"`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Greška pri promeni statusa', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyAddress = async () => {
    if (!order) return;
    const c = order.customerInfo;
    const text = `${c.firstName} ${c.lastName}\n${c.address}\n${c.postalCode} ${c.city}\n${c.phone}`;
    try {
      await navigator.clipboard.writeText(text);
      toast('Adresa kopirana u clipboard');
    } catch {
      toast('Kopiranje nije uspelo', 'error');
    }
  };

  if (loading) {
    return (
      <div className={styles.card}>
        {[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
      </div>
    );
  }
  if (error) return <div className={styles.empty}>Greška pri učitavanju porudžbine</div>;
  if (!order) return <div className={styles.empty}>Porudžbina nije pronađena</div>;

  const { customerInfo: c } = order;
  const cancelled = order.status === 'cancelled';
  const flowIndex = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  const action = NEXT_ACTION[order.status];
  const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/orders" className={styles.backLink}>
            <ArrowLeft size={14} strokeWidth={2} /> Nazad na porudžbine
          </Link>
          <h1 className={styles.pageTitle}>{order.orderNumber}</h1>
          <p className={styles.pageSubtitle}>{formatDate(order.createdAt)}</p>
        </div>
        <div className={styles.headerActions}>
          <StatusBadge status={order.status} />
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
            <Printer size={14} strokeWidth={2} /> Štampaj
          </button>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: 'var(--space-4)' }}>
        {cancelled ? (
          <div className={styles.cancelledBanner} style={{ margin: 'var(--space-6)' }}>
            <XCircle size={18} strokeWidth={2} />
            Porudžbina je otkazana. Možete je ponovo aktivirati promenom statusa.
          </div>
        ) : (
          <div className={styles.stepper}>
            {FLOW.map((status, i) => {
              const Icon = STEP_ICONS[status];
              const done = i < flowIndex || order.status === 'delivered';
              const active = i === flowIndex && order.status !== 'delivered';
              return (
                <div
                  key={status}
                  className={`${styles.step} ${done ? styles.stepDone : ''} ${active ? styles.stepActive : ''}`}
                >
                  <div className={styles.stepDot}>
                    {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={2} />}
                  </div>
                  <span className={styles.stepLabel}>{STATUS_LABELS[status]}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.quickActions}>
          {action && !cancelled && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={saving}
              onClick={() => updateStatus(action.next)}
            >
              {saving ? 'Čuvanje...' : action.label}
            </button>
          )}
          {!cancelled && order.status !== 'delivered' && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              disabled={saving}
              onClick={() => updateStatus('cancelled')}
            >
              Otkaži porudžbinu
            </button>
          )}
          <select
            className={styles.statusSelect}
            value={order.status}
            onChange={(e) => updateStatus(e.target.value as Order['status'])}
            disabled={saving}
            aria-label="Promeni status"
          >
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </div>

        <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
          <GeminiCustomerMessageBox order={order} />
        </div>
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.card}>
          <div className={styles.detailSection}>
            <h3><Package size={14} strokeWidth={2} /> Stavke porudžbine</h3>
            <div className={styles.itemList}>
              {order.items.map((item) => (
                <div key={item.id} className={styles.orderItem}>
                  {item.image ? (
                    <Image
                      src={item.image.url}
                      alt={item.title}
                      width={52}
                      height={52}
                      className={styles.orderItemImg}
                    />
                  ) : (
                    <div className={styles.orderItemImg}><Package size={18} strokeWidth={1.5} /></div>
                  )}
                  <div className={styles.orderItemBody}>
                    <p className={styles.orderItemTitle}>{item.title}</p>
                    {item.variantTitle && <p className={styles.orderItemMeta}>{item.variantTitle}</p>}
                    <p className={styles.orderItemMeta}>
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <strong>{formatPrice(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className={styles.detailRow} style={{ marginTop: 16 }}>
              <span>Međuzbir</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className={styles.detailRow}>
              <span>Dostava</span>
              <span>Plaćanje pouzećem</span>
            </div>
            <div className={`${styles.detailRow} ${styles.detailTotal}`}>
              <span>Ukupno</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.detailSection}>
            <h3><User size={14} strokeWidth={2} /> Podaci kupca</h3>
            <div className={styles.detailRow}><span>Ime</span><span>{c.firstName} {c.lastName}</span></div>
            <div className={styles.detailRow}>
              <span>Telefon</span>
              <span><a href={`tel:${c.phone}`}>{c.phone}</a></span>
            </div>
            {c.email && (
              <div className={styles.detailRow}>
                <span>Email</span>
                <span><a href={`mailto:${c.email}`}>{c.email}</a></span>
              </div>
            )}
            <div className={styles.detailRow}><span>Adresa</span><span>{c.address}</span></div>
            <div className={styles.detailRow}><span>Grad</span><span>{c.city}, {c.postalCode}</span></div>
            <div className={styles.detailRow}><span>Plaćanje</span><span>Pouzeće</span></div>

            {c.note && (
              <div className={styles.noteBox}>
                <strong>Napomena kupca</strong>
                {c.note}
              </div>
            )}

            <div style={{ marginTop: 'var(--space-5)' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={copyAddress}>
                <Copy size={14} strokeWidth={2} /> Kopiraj adresu za slanje
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
