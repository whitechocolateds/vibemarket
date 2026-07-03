'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/shopify';
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

  if (!isOpen && items.length === 0) return null;

  return (
    <>
      {isOpen && <div className="overlay" onClick={closeCart} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} id="cart-sidebar">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Vaša korpa</h2>
            {totalItems > 0 && (
              <span className="badge badge-gold">{totalItems} stavki</span>
            )}
          </div>
          <button className="btn btn-ghost" onClick={closeCart} aria-label="Zatvori" id="close-cart-btn">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🛒</span>
            <p>Vaša korpa je prazna</p>
            <Link href="/products" className="btn btn-secondary btn-sm" onClick={closeCart}>
              Pogledaj proizvode
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {item.image ? (
                      <Image src={item.image.url} alt={item.title} fill sizes="68px" className={styles.itemImg} />
                    ) : <span>🛍️</span>}
                  </div>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemTitle}>{item.title}</p>
                    {item.variantTitle && <p className={styles.itemVariant}>{item.variantTitle}</p>}
                    <p className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item.id)} aria-label="Ukloni">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.total}>
                <span>Ukupno</span>
                <span className={styles.totalPrice}>{formatPrice(totalPrice)}</span>
              </div>
              <p className={styles.shippingNote}>✓ Dostava 1–3 radna dana · Plaćanje pouzećem</p>
              <Link href="/checkout" className={`btn btn-primary btn-full ${styles.checkoutBtn}`} onClick={closeCart} id="go-to-checkout-btn">
                Nastavi sa narudžbinom
              </Link>
              <button className={`btn btn-ghost btn-full ${styles.continueBtn}`} onClick={closeCart}>
                Nastavi kupovinu
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
