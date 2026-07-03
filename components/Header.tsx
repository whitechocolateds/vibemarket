'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import styles from './Header.module.css';

const NAV = [
  { href: '/', label: 'Početna' },
  { href: '/products', label: 'Kolekcija' },
];

export default function Header() {
  const { totalItems, toggleCart } = useCartStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${scrolled || !isHome ? styles.solid : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          Vibe<span>Market</span>
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.open : ''}`}>
          {NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navLink}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
                {active && <motion.span layoutId="nav-underline" className={styles.underline} />}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <button className={styles.cartBtn} onClick={toggleCart} aria-label="Korpa">
            <ShoppingBag size={18} strokeWidth={1.75} />
            <span className={styles.cartLabel}>Korpa</span>
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  className={styles.badge}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)} aria-label="Meni">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
