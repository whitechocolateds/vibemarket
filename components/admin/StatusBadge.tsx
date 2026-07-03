import { Order } from '@/lib/types';
import styles from '@/app/admin/admin.module.css';

const LABELS: Record<Order['status'], string> = {
  pending: 'Na čekanju',
  confirmed: 'Potvrđeno',
  shipped: 'Poslato',
  delivered: 'Dostavljeno',
  cancelled: 'Otkazano',
};

const CLASSES: Record<Order['status'], string> = {
  pending: styles.badgePending,
  confirmed: styles.badgeConfirmed,
  shipped: styles.badgeShipped,
  delivered: styles.badgeDelivered,
  cancelled: styles.badgeCancelled,
};

export default function StatusBadge({ status }: { status: Order['status'] }) {
  return (
    <span className={`${styles.badge} ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}

export { LABELS as STATUS_LABELS };
