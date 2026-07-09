'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Sparkles, Clock, Flame } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { formatPrice, getProductPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/lib/shipping';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  index?: number;
  spotlight?: boolean;
}

export default function ProductCard({ product, spotlight = false }: Props) {
  const { addItem } = useCartStore();
  const { price, compareAtPrice } = getProductPrice(product);
  const [added, setAdded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const secondImage = product.images?.[1];

  const stockQty = product.variants[0]?.quantityAvailable;
  const lowStock = product.availableForSale && typeof stockQty === 'number' && stockQty > 0 && stockQty < LOW_STOCK_THRESHOLD;

  // Odbrojavanje "ponude dana" do ponoći — samo na istaknutoj kartici sa popustom
  const [dealTimeLeft, setDealTimeLeft] = useState<string | null>(null);
  useEffect(() => {
    if (!spotlight || !discountPercent) return;
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor(diff / 60000) % 60;
      const s = Math.floor(diff / 1000) % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      setDealTimeLeft(`${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [spotlight, discountPercent]);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants[0];
    if (!variant) return;
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
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const addButton = (
    <button
      className={`btn btn-primary btn-sm ${styles.addBtn}`}
      onClick={handleAdd}
      disabled={!product.availableForSale}
    >
      <AnimatePresence mode="wait" initial={false}>
        {added ? (
          <motion.span key="ok" className={styles.addBtnInner} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Check size={14} /> Dodato
          </motion.span>
        ) : (
          <motion.span key="add" className={styles.addBtnInner} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
            <Plus size={14} /> {product.availableForSale ? 'Dodaj u korpu' : 'Rasprodato'}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (spotlight) {
    return (
      <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className={styles.spotlightMotion}>
        <Link
          href={`/products/${product.handle}`}
          className={styles.spotlightCard}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {product.featuredImage ? (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              className={styles.spotlightImg}
              style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
            />
          ) : (
            <div className={styles.placeholder}>◆</div>
          )}
          <div className={styles.spotlightScrim} />

          <div className={styles.spotlightTop}>
            <span className={styles.spotlightFeatured}><Sparkles size={12} /> Izdvojeno</span>
            {discountPercent && <span className={styles.spotlightBadge}>−{discountPercent}%</span>}
          </div>

          <div className={styles.spotlightContent}>
            {dealTimeLeft && (
              <span className={styles.spotlightTimer}>
                <Clock size={11} /> Ponuda dana ističe za <strong>{dealTimeLeft}</strong>
              </span>
            )}
            <span className={styles.spotlightVendor}>{product.vendor}</span>
            <h3 className={styles.spotlightTitle}>{product.title}</h3>
            <div className={styles.spotlightBottom}>
              <div className={styles.priceRow}>
                <span className={styles.spotlightPrice}>{formatPrice(price)}</span>
                {compareAtPrice && <span className={styles.spotlightCompare}>{formatPrice(compareAtPrice)}</span>}
              </div>
              {addButton}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{ height: '100%' }}
    >
      <Link
        href={`/products/${product.handle}`}
        className={styles.card}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={styles.imageWrap}>
          {product.featuredImage ? (
            <>
              <img
                src={product.featuredImage.url}
                alt={product.featuredImage.altText ?? product.title}
                className={styles.image}
                loading="lazy"
                style={{ opacity: hovered && secondImage ? 0 : 1 }}
              />
              {secondImage && (
                <img
                  src={secondImage.url}
                  alt=""
                  className={styles.image}
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, opacity: hovered ? 1 : 0 }}
                />
              )}
            </>
          ) : (
            <div className={styles.placeholder}>◆</div>
          )}
          <div className={styles.badges}>
            {discountPercent && <span className="badge badge-gold">−{discountPercent}%</span>}
            {product.tags.includes('novo') && !discountPercent && (
              <span className="badge badge-blue">Novo</span>
            )}
          </div>
          <div className={styles.quickAdd}>{addButton}</div>
        </div>
        <div className={styles.info}>
          <span className={styles.vendor}>{product.vendor}</span>
          <h3 className={styles.title}>{product.title}</h3>
          <div className={styles.priceRow}>
            <span className="price">{formatPrice(price)}</span>
            {compareAtPrice && <span className="price-compare">{formatPrice(compareAtPrice)}</span>}
          </div>
          {product.availableForSale ? (
            lowStock ? (
              <span className={styles.lowStock}><Flame size={11} /> Još samo {stockQty} kom</span>
            ) : (
              <span className={styles.stock}>Na stanju</span>
            )
          ) : (
            <span className={styles.unavailable}>Nije dostupno</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
