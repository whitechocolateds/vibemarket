'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, ExternalLink } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

const ROUTE_MAP: Record<string, { label: string; parent?: string; parentHref?: string }> = {
  '/admin': { label: 'Pregled' },
  '/admin/ai-studio': { label: 'Gemini AI Studio', parent: 'Pregled', parentHref: '/admin' },
  '/admin/orders': { label: 'Porudžbine', parent: 'Pregled', parentHref: '/admin' },
  '/admin/products': { label: 'Proizvodi', parent: 'Pregled', parentHref: '/admin' },
  '/admin/products/new': { label: 'Novi proizvod', parent: 'Proizvodi', parentHref: '/admin/products' },
};

function getRouteInfo(pathname: string) {
  if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname];
  if (pathname.startsWith('/admin/orders/')) return { label: 'Detalji porudžbine', parent: 'Porudžbine', parentHref: '/admin/orders' };
  if (pathname.includes('/edit')) return { label: 'Izmena proizvoda', parent: 'Proizvodi', parentHref: '/admin/products' };
  return { label: 'Admin' };
}

function useClockTick() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function AdminTopBar() {
  const pathname = usePathname();
  const route = getRouteInfo(pathname);
  const time = useClockTick();

  return (
    <div className={styles.topBar}>
      <nav className={styles.breadcrumbs}>
        <Link href="/admin" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
          VibeMarket
        </Link>
        {route.parent && (
          <>
            <span className={styles.breadcrumbSep}>/</span>
            {route.parentHref ? (
              <Link href={route.parentHref} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}>
                {route.parent}
              </Link>
            ) : (
              <span>{route.parent}</span>
            )}
          </>
        )}
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{route.label}</span>
      </nav>
      <div className={styles.topBarRight}>
        {time && <span className={styles.topBarTime}>🕐 {time}</span>}
        <Link
          href="/"
          target="_blank"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.78rem', height: 32, padding: '0 12px', gap: 6 }}
        >
          <Store size={13} /> Prodavnica <ExternalLink size={11} />
        </Link>
      </div>
    </div>
  );
}
