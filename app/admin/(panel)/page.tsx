import Link from 'next/link';
import Image from 'next/image';
import {
  Wallet,
  ShoppingBag,
  Clock3,
  TrendingUp,
  Package,
  Boxes,
  BarChart3,
  Trophy,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { getAdminStats } from '@/lib/orderStore';
import { formatPrice } from '@/lib/format';
import { Order } from '@/lib/types';
import StatusBadge, { STATUS_LABELS } from '@/components/admin/StatusBadge';
import styles from '../admin.module.css';

const STATUS_DOTS: Record<Order['status'], string> = {
  pending: styles.dotPending,
  confirmed: styles.dotConfirmed,
  shipped: styles.dotShipped,
  delivered: styles.dotDelivered,
  cancelled: styles.dotCancelled,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  const maxDayRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue), 1);
  const chartTotal = stats.revenueByDay.reduce((s, d) => s + d.revenue, 0);
  const maxStatusCount = Math.max(...Object.values(stats.statusCounts), 1);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Pregled prodaje</h1>
          <p className={styles.pageSubtitle}>Dobrodošli nazad — evo šta se dešava u prodavnici</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/orders" className="btn btn-secondary btn-sm">Porudžbine</Link>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">+ Novi proizvod</Link>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statCardGold}`}>
          <div className={`${styles.statIcon} ${styles.statIconGold}`}><Wallet size={18} strokeWidth={1.75} /></div>
          <div>
            <p className={styles.statLabel}>Ukupan prihod</p>
            <p className={`${styles.statValue} ${styles.statValueAccent}`}>
              {formatPrice(stats.totalRevenue)}
            </p>
            <p className={styles.statHint}>prosek {formatPrice(stats.avgOrderValue)} po porudžbini</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}><ShoppingBag size={18} strokeWidth={1.75} /></div>
          <div>
            <p className={styles.statLabel}>Porudžbine</p>
            <p className={styles.statValue}>{stats.totalOrders}</p>
            <p className={styles.statHint}>{stats.itemsSold} prodatih artikala</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardWarning}`}>
          <div className={`${styles.statIcon} ${styles.statIconWarning}`}><Clock3 size={18} strokeWidth={1.75} /></div>
          <div>
            <p className={styles.statLabel}>Na čekanju</p>
            <p className={`${styles.statValue} ${styles.statValueWarning}`}>{stats.pendingOrders}</p>
            <p className={styles.statHint}>čeka potvrdu</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
          <div className={`${styles.statIcon} ${styles.statIconSuccess}`}><TrendingUp size={18} strokeWidth={1.75} /></div>
          <div>
            <p className={styles.statLabel}>Danas</p>
            <p className={`${styles.statValue} ${styles.statValueSuccess}`}>
              {formatPrice(stats.todayRevenue)}
            </p>
            <p className={styles.statHint}>{stats.todayOrders} porudžbina danas</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardBlue}`}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}><Boxes size={18} strokeWidth={1.75} /></div>
          <div>
            <p className={styles.statLabel}>Katalog</p>
            <p className={styles.statValue}>{stats.totalProducts}</p>
            <p className={styles.statHint}>{stats.activeProducts} aktivnih proizvoda</p>
          </div>
        </div>
      </div>

      <div className={styles.dashGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><BarChart3 size={16} strokeWidth={1.75} /> Prihod — poslednjih 14 dana</h2>
            <span className={styles.cardHeaderHint}>{formatPrice(chartTotal)} ukupno</span>
          </div>
          <div className={styles.chart}>
            {stats.revenueByDay.map((day) => (
              <div
                key={day.date}
                className={styles.chartCol}
                title={`${day.label} — ${formatPrice(day.revenue)} (${day.orders} porudžbina)`}
              >
                <div
                  className={`${styles.chartBar} ${day.revenue === 0 ? styles.chartBarEmpty : ''}`}
                  style={{ height: `${Math.max((day.revenue / maxDayRevenue) * 100, 2)}%` }}
                />
                <span className={styles.chartLabel}>{day.label.slice(0, 3)}</span>
              </div>
            ))}
          </div>
          <div className={styles.chartLegend}>
            <span>Bez otkazanih porudžbina</span>
            <span>najbolji dan: {formatPrice(Math.max(...stats.revenueByDay.map((d) => d.revenue), 0))}</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Status porudžbina</h2>
          </div>
          <div className={styles.statusList}>
            {(Object.keys(STATUS_LABELS) as Order['status'][]).map((status) => (
              <div key={status} className={styles.statusRow}>
                <span className={`${styles.statusDot} ${STATUS_DOTS[status]}`} />
                <span>{STATUS_LABELS[status]}</span>
                <div className={styles.statusTrack}>
                  <div
                    className={`${styles.statusTrackFill} ${STATUS_DOTS[status]}`}
                    style={{ width: `${(stats.statusCounts[status] / maxStatusCount) * 100}%` }}
                  />
                </div>
                <strong>{stats.statusCounts[status]}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.dashGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Najnovije porudžbine</h2>
            <Link href="/admin/orders" className="btn btn-secondary btn-sm">Sve porudžbine</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={32} strokeWidth={1.25} className={styles.emptyIcon} />
              Još nema porudžbina
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Broj</th>
                    <th>Kupac</th>
                    <th>Iznos</th>
                    <th>Status</th>
                    <th>Datum</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Link href={`/admin/orders/${order.id}`} className={styles.tableLink}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td>{order.customerInfo.firstName} {order.customerInfo.lastName}</td>
                      <td>{formatPrice(order.totalPrice)}</td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className={styles.card} style={{ marginBottom: 'var(--space-4)' }}>
            <div className={styles.cardHeader}>
              <h2><Trophy size={16} strokeWidth={1.75} /> Najprodavaniji</h2>
            </div>
            {stats.topProducts.length === 0 ? (
              <div className={styles.empty}>Još nema prodaje</div>
            ) : (
              <div className={styles.miniList}>
                {stats.topProducts.map((p, i) => (
                  <Link key={p.productId} href={`/products/${p.handle}`} target="_blank" className={styles.miniItem}>
                    <span className={styles.miniRank}>{i + 1}</span>
                    {p.image ? (
                      <Image src={p.image} alt={p.title} width={36} height={36} className={styles.miniThumb} />
                    ) : (
                      <div className={styles.miniThumb}><Package size={15} strokeWidth={1.5} /></div>
                    )}
                    <div className={styles.miniBody}>
                      <p className={styles.miniTitle}>{p.title}</p>
                      <p className={styles.miniMeta}>{p.quantity} kom prodato</p>
                    </div>
                    <span className={styles.miniValue}>{formatPrice(p.revenue)}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {stats.lowStockProducts.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2><AlertTriangle size={16} strokeWidth={1.75} /> Niske zalihe</h2>
                <span className={styles.cardHeaderHint}>≤ 3 kom</span>
              </div>
              <div className={styles.miniList}>
                {stats.lowStockProducts.map((p) => (
                  <Link key={p.id} href={`/admin/products/${p.id}/edit`} className={styles.miniItem}>
                    {p.image ? (
                      <Image src={p.image} alt={p.title} width={36} height={36} className={styles.miniThumb} />
                    ) : (
                      <div className={styles.miniThumb}><Package size={15} strokeWidth={1.5} /></div>
                    )}
                    <div className={styles.miniBody}>
                      <p className={styles.miniTitle}>{p.title}</p>
                      <p className={styles.miniMeta}>
                        {p.quantity === 0 ? 'rasprodato' : `još ${p.quantity} kom`}
                      </p>
                    </div>
                    <span className={`${styles.stockPill} ${p.quantity === 0 ? styles.stockOut : styles.stockLow}`}>
                      {p.quantity} kom <ArrowUpRight size={13} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
