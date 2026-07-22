'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, Truck, PartyPopper, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { formatPrice, getProductPrice } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import { bundleUnitPrice } from '@/lib/bundlePricing';
import { Product } from '@/lib/types';
import styles from './CartSidebar.module.css';

function UpsellList({ title, products, onAdd, onNavigate, className = '' }: {
  title: string;
  products: Product[];
  onAdd: (p: Product) => void;
  onNavigate: () => void;
  className?: string;
}) {
  return (
    <div className={`${styles.upsell} ${className}`}>
      <p className={styles.upsellTitle}>
        <Sparkles size={12} className={styles.upsellSparkle} /> {title}
      </p>
      {products.map((p) => {
        const sp = getProductPrice(p);
        return (
          <div key={p.id} className={styles.upsellItem}>
            <Link href={`/products/${p.handle}`} onClick={onNavigate} className={styles.upsellLink}>
              <img src={p.featuredImage!.url} alt={p.title} className={styles.upsellImg} />
              <span className={styles.upsellInfo}>
                <span className={styles.upsellName}>{p.title}</span>
                <span className={styles.upsellPriceRow}>
                  <span className={styles.upsellPrice}>{formatPrice(sp.price)}</span>
                  {sp.compareAtPrice && sp.compareAtPrice > sp.price && (
                    <span className={styles.upsellCompare}>{formatPrice(sp.compareAtPrice)}</span>
                  )}
                </span>
              </span>
            </Link>
            <button
              type="button"
              className={styles.upsellAdd}
              onClick={() => onAdd(p)}
              aria-label={`Dodaj ${p.title} u korpu`}
            >
              <Plus size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function CartSidebar() {
  const { items, totalItems, isOpen, closeCart, removeItem, updateQuantity, addItem } = useCartStore();
  const [catalog, setCatalog] = useState<Product[]>([]);

  // Cene po stavci uključuju količinski popust (2 kom -10%, 3 kom -15%), isto kao na checkout-u
  const discountedItems = items.map((item) => ({ ...item, unitPrice: bundleUnitPrice(item.price, item.quantity) }));
  const totalPrice = discountedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCart]);

  // Katalog za predloge učitavamo tek kad se korpa prvi put otvori
  useEffect(() => {
    if (!isOpen || catalog.length > 0) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        if (alive) setCatalog((json.data ?? []).filter((p: Product) => p.availableForSale && p.featuredImage && p.variants[0]));
      } catch {
        /* predlozi su opcioni */
      }
    })();
    return () => { alive = false; };
  }, [isOpen, catalog.length]);

  // Predlozi: proizvodi koji nisu u korpi, sa popustom napred, pa jeftiniji (impulsivna dopuna)
  const suggestions = catalog
    .filter((p) => !items.some((i) => i.productId === p.id))
    .sort((a, b) => {
      const aP = getProductPrice(a);
      const bP = getProductPrice(b);
      const aDisc = aP.compareAtPrice && aP.compareAtPrice > aP.price ? 1 : 0;
      const bDisc = bP.compareAtPrice && bP.compareAtPrice > bP.price ? 1 : 0;
      if (aDisc !== bDisc) return bDisc - aDisc;
      return aP.price - bP.price;
    })
    .slice(0, 2);

  const addSuggestion = (product: Product) => {
    const variant = product.variants[0];
    const { price, compareAtPrice } = getProductPrice(product);
    addItem({
      id: variant.id,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      variantTitle: variant.title !== 'Default' ? variant.title : '',
      price,
      compareAtPrice: compareAtPrice ?? undefined,
      image: product.featuredImage,
    });
  };

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

                {suggestions.length > 0 && (
                  <UpsellList
                    title="Popularno ove nedelje"
                    products={suggestions}
                    onAdd={addSuggestion}
                    onNavigate={closeCart}
                    className={styles.upsellEmpty}
                  />
                )}
              </div>
            ) : (
              <>
                <div className={styles.items}>
                  <AnimatePresence initial={false}>
                    {discountedItems.map((item) => (
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
                          <p className={styles.itemPrice}>
                            {item.unitPrice < item.price && (
                              <span className={styles.itemPriceOld}>{formatPrice(item.price * item.quantity)}</span>
                            )}
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                          {item.unitPrice < item.price && (
                            <span className={styles.itemSaveTag}>Popust za {item.quantity} kom</span>
                          )}
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

                  {suggestions.length > 0 && (
                    <UpsellList
                      title="Često se kupuje uz ovo"
                      products={suggestions}
                      onAdd={addSuggestion}
                      onNavigate={closeCart}
                    />
                  )}
                </div>
                <div className={styles.footer}>
                  <div className={styles.shipProgress}>
                    {totalPrice > FREE_SHIPPING_THRESHOLD ? (
                      <p className={`${styles.shipMsg} ${styles.shipFree}`}>
                        <PartyPopper size={14} />
                        <span>Ostvarili ste <strong>besplatnu dostavu</strong>!</span>
                      </p>
                    ) : (
                      <p className={styles.shipMsg}>
                        <Truck size={14} />
                        <span>Još <strong>{formatPrice(FREE_SHIPPING_THRESHOLD - totalPrice)}</strong> do besplatne dostave</span>
                      </p>
                    )}
                    <div className={styles.shipTrack}>
                      <motion.div
                        className={styles.shipFill}
                        initial={false}
                        animate={{ width: `${Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      />
                    </div>
                  </div>
                  <div className={styles.total}>
                    <span className={styles.totalLabel}>Ukupno</span>
                    <span className={styles.totalPrice}>{formatPrice(totalPrice)}</span>
                  </div>
                  <p className={styles.note}>
                    <span><ShieldCheck size={13} /> Plaćanje pouzećem</span>
                    <span><Truck size={13} /> Dostava 1-3 dana</span>
                  </p>
                  <Link href="/checkout" className={`btn btn-primary btn-full ${styles.checkoutBtn}`} onClick={closeCart}>
                    <span>Nastavi na plaćanje</span> <ArrowRight size={18} />
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
