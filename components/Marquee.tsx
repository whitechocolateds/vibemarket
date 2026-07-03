import { Truck, ShieldCheck, Wallet, Sparkles, PackageCheck, Star } from 'lucide-react';
import styles from './Marquee.module.css';

const ITEMS = [
  { icon: Truck, label: 'Dostava 1–3 radna dana' },
  { icon: Wallet, label: 'Plaćanje pouzećem' },
  { icon: ShieldCheck, label: 'Sigurna kupovina' },
  { icon: Star, label: '4.9/5 prosečna ocena' },
  { icon: PackageCheck, label: 'Pažljivo biran izbor' },
  { icon: Sparkles, label: 'Novo svake nedelje' },
];

export default function Marquee() {
  const track = [...ITEMS, ...ITEMS];
  return (
    <div className={styles.marquee}>
      <div className={`marquee-track ${styles.track}`}>
        {track.map((item, i) => (
          <span className={styles.item} key={i}>
            <item.icon size={15} strokeWidth={1.75} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
