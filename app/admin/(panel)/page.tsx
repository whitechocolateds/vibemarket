import Link from 'next/link';
import { getAdminStats } from '@/lib/orderStore';
import { formatPrice } from '@/lib/format';
import StatusBadge from '@/components/admin/StatusBadge';
import styles from '../admin.module.css';

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

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Pregled prodaje</h1>
          <p className={styles.pageSubtitle}>Dobrodošli u VibeMarket admin panel</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          + Novi proizvod
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Ukupan prihod</p>
          <p className={`${styles.statValue} ${styles.statValueAccent}`}>
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Ukupno porudžbina</p>
          <p className={styles.statValue}>{stats.totalOrders}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Na čekanju</p>
          <p className={`${styles.statValue} ${styles.statValueWarning}`}>{stats.pendingOrders}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Današnji prihod</p>
          <p className={`${styles.statValue} ${styles.statValueSuccess}`}>
            {formatPrice(stats.todayRevenue)}
          </p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Današnje porudžbine</p>
          <p className={styles.statValue}>{stats.todayOrders}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Proizvodi u katalogu</p>
          <p className={styles.statValue}>{stats.totalProducts}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Najnovije porudžbine</h2>
          <Link href="/admin/orders" className="btn btn-secondary btn-sm">Sve porudžbine</Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <div className={styles.empty}>Još nema porudžbina</div>
        ) : (
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
        )}
      </div>
    </>
  );
}
