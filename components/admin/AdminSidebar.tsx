'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from '@/app/admin/admin.module.css';

const links = [
  { href: '/admin', label: 'Pregled', icon: '◆' },
  { href: '/admin/orders', label: 'Porudžbine', icon: '◇' },
  { href: '/admin/products', label: 'Proizvodi', icon: '○' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <Link href="/admin">
          Vibe<span>Market</span>
          <small>Admin panel</small>
        </Link>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const active = link.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${active ? styles.navActive : ''}`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <Link href="/">← Prodavnica</Link>
        <button type="button" onClick={handleLogout}>✕ <span>Odjavi se</span></button>
      </div>
    </aside>
  );
}
