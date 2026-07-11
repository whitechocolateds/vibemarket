'use client';

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import styles from './ProductComparisonTable.module.css';

interface Props {
  vendor: string;
  title: string;
  points?: string[];
}

function fallbackPoints(title: string, vendor: string): string[] {
  return [
    `Original - ${title}, sa punom garancijom ${vendor}`,
    'Dostava 1-3 radna dana, uz praćenje pošiljke',
    'Plaćanje pouzećem - bez rizika unapred',
    'Podrška dostupna za sva pitanja o proizvodu',
  ];
}

export default function ProductComparisonTable({ vendor, title, points }: Props) {
  const rows = points && points.length > 0 ? points : fallbackPoints(title, vendor);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.row} ${styles.head}`}>
        <span>Karakteristika</span>
        <span>Ovaj proizvod</span>
        <span>Ostali</span>
      </div>
      {rows.map((label, i) => (
        <motion.div
          key={label}
          className={styles.row}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.label}>{label}</span>
          <span className={styles.yes}>
            <span className={styles.checkBadge}><Check size={16} strokeWidth={3} /></span>
          </span>
          <span className={styles.no}>
            <span className={styles.crossBadge}><X size={15} strokeWidth={3} /></span>
          </span>
        </motion.div>
      ))}
    </div>
  );
}
