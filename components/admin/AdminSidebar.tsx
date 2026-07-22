'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PlusCircle,
  Store,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import styles from '@/app/admin/admin.module.css';

const links = [
  { href: '/admin', label: 'Pregled', icon: LayoutDashboard },
  { href: '/admin/ai-studio', label: 'Gemini AI Studio', icon: Sparkles },
  { href: '/admin/orders', label: 'Porudžbine', icon: ShoppingBag },
  { href: '/admin/products', label: 'Proizvodi', icon: Package },
  { href: '/admin/products/new', label: 'Novi proizvod', icon: PlusCircle },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((json) => {
        if (active) setPendingCount(json.data?.pendingOrders ?? 0);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={26} />
          <span>
            Vibe<span>Market</span>
            <small>Admin panel</small>
          </span>
        </Link>
      </div>

      <nav className={styles.nav}>
        <span className={styles.navSectionLabel}>Upravljanje</span>
        {links.map((link) => {
          const Icon = link.icon;
          const active = link.href === '/admin'
            ? pathname === '/admin'
            : link.href === '/admin/products/new'
              ? pathname === '/admin/products/new'
              : pathname.startsWith(link.href) && !(link.href === '/admin/products' && pathname === '/admin/products/new');
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${active ? styles.navActive : ''}`}
            >
              <Icon size={17} strokeWidth={1.75} />
              <span className={styles.navLabel}>{link.label}</span>
              {link.href === '/admin/orders' && pendingCount > 0 && (
                <span className={styles.navBadge}>{pendingCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <Link href="/" target="_blank">
          <Store size={16} strokeWidth={1.75} />
          <span>Otvori prodavnicu</span>
        </Link>
        <button type="button" onClick={handleLogout}>
          <LogOut size={16} strokeWidth={1.75} />
          <span>Odjavi se</span>
        </button>
      </div>
    </aside>
  );
}
