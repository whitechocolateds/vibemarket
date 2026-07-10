'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { readRecentlyViewed } from '@/lib/recentlyViewed';
import { useHydrated } from '@/lib/useHydrated';
import styles from './RecentlyViewed.module.css';

interface Props {
  excludeHandle?: string;
}

export default function RecentlyViewed({ excludeHandle }: Props) {
  const hydrated = useHydrated();
  const items = useMemo(
    () => (hydrated ? readRecentlyViewed().filter((r) => r.handle !== excludeHandle) : []),
    [hydrated, excludeHandle]
  );

  if (items.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <span className={styles.eyebrow}><History size={13} /> Vaša istorija</span>
        <h2 className={styles.title}>Nedavno pogledano</h2>
      </div>
      <div className={styles.strip}>
        {items.map((item) => (
          <Link key={item.handle} href={`/products/${item.handle}`} className={styles.card}>
            <span className={styles.imgWrap}>
              {item.image ? (
                <img src={item.image} alt={item.title} className={styles.img} loading="lazy" />
              ) : (
                <span className={styles.noImg}>◆</span>
              )}
            </span>
            <span className={styles.name}>{item.title}</span>
            <span className={styles.priceRow}>
              <span className={styles.price}>{formatPrice(item.price)}</span>
              {item.compareAtPrice && item.compareAtPrice > item.price && (
                <span className={styles.compare}>{formatPrice(item.compareAtPrice)}</span>
              )}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
