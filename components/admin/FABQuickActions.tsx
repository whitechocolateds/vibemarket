'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Plus, X, Sparkles, ShoppingBag, Package, Download } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

const FAB_ITEMS = [
  {
    label: 'AI Studio — Generiši artikal',
    href: '/admin/ai-studio',
    iconBg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    iconColor: '#0A2A6B',
    Icon: Sparkles,
  },
  {
    label: 'Dodaj novi proizvod',
    href: '/admin/products/new',
    iconBg: 'var(--brand-gradient)',
    iconColor: '#ffffff',
    Icon: Package,
  },
  {
    label: 'Pregled porudžbina',
    href: '/admin/orders',
    iconBg: 'linear-gradient(135deg, #16a34a, #15803d)',
    iconColor: '#ffffff',
    Icon: ShoppingBag,
  },
];

export default function FABQuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className={styles.fab} ref={ref}>
      {open && (
        <div className={styles.fabMenu}>
          {FAB_ITEMS.map((item) => {
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.fabItem}
                onClick={() => setOpen(false)}
              >
                <span
                  className={styles.fabItemIcon}
                  style={{ background: item.iconBg, color: item.iconColor }}
                >
                  <Icon size={16} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className={`${styles.fabMain} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Brze akcije"
        title="Brze akcije"
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
