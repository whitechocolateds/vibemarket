'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import styles from './CartSidebar.module.css';

export default function CartSidebar() {
  const { items, totalPrice, totalItems, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="overlay"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className={styles.sidebar}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className={styles.header}>
              <h2 className={styles.title}>Korpa</h2>
              {totalItems > 0 && <span className={styles.count}>{totalItems} artikala</span>}
              <button className="btn btn-ghost btn-sm" onClick={closeCart} aria-label="Zatvori"><X size={18} /></button>
            </div>

            {items.length === 0 ? (
              <div className={styles.empty}>
                <div className="empty-icon-badge">
                  <ShoppingBag size={30} strokeWidth={1.5} />
                </div>
                <p>Korpa je prazna</p>
                <Link href="/products" className="btn btn-outline btn-sm" onClick={closeCart}>
                  Pogledaj kolekciju
                </Link>
              </div>
            ) : (
              <>
                <div className={styles.items}>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        className={styles.item}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {item.image ? (
                          <img src={item.image.url} alt={item.title} className={styles.itemImg} />
                        ) : (
                          <div className={styles.itemImg} />
                        )}
                        <div className={styles.itemInfo}>
                          <h4>{item.title}</h4>
                          {item.variantTitle && <p className={styles.itemVariant}>{item.variantTitle}</p>}
                          <p className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</p>
                        </div>
                        <div className={styles.itemActions}>
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Smanji količinu"><Minus size={13} /></button>
                            <span className="qty-value">{item.quantity}</span>
                            <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Povećaj količinu"><Plus size={13} /></button>
                          </div>
                          <button className={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label="Ukloni">
                            <Trash2 size={13} /> Ukloni
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className={styles.footer}>
                  <div className={styles.total}>
                    <span className={styles.totalLabel}>Ukupno</span>
                    <span className={styles.totalPrice}>{formatPrice(totalPrice)}</span>
                  </div>
                  <p className={styles.note}>Dostava 1–3 dana · Plaćanje pouzećem</p>
                  <Link href="/checkout" className={`btn btn-primary btn-full ${styles.checkoutBtn}`} onClick={closeCart}>
                    Nastavi na plaćanje
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
