'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Star, Plus, Check } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { formatPrice, getProductPrice } from '@/lib/format';
import SparkleField from './SparkleField';
import styles from '../app/page.module.css';

export default function HeroSpotlight({ product, accent }: { product: Product; accent?: Product | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 22 });

  const { price, compareAtPrice } = getProductPrice(product);
  const discountPercent = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
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
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      className={styles.spotlightWrap}
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className={styles.blobA}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={styles.blobB}
        animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      <SparkleField />

      {accent?.featuredImage && (
        <motion.div
          className={styles.accentCard}
          initial={{ opacity: 0, x: -20, rotate: -14 }}
          animate={{ opacity: 1, x: 0, rotate: -8 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Link href={`/products/${accent.handle}`} className={styles.accentLink}>
              <img src={accent.featuredImage.url} alt={accent.featuredImage.altText ?? accent.title} className={styles.accentImg} />
            </Link>
          </motion.div>
        </motion.div>
      )}

      <Link href={`/products/${product.handle}`} className={styles.stageLink}>
        <motion.div
          ref={ref}
          className={styles.stage}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleLeave}
        >
          {product.featuredImage && (
            <img
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              className={styles.stageImg}
            />
          )}
        </motion.div>
        <div className={styles.stageGround} />
      </Link>

      <motion.div
        className={styles.ratingChip}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className={styles.chipFloat}
        >
          <Star size={13} fill="currentColor" strokeWidth={0} />
          <span>4.9 ocena kupaca</span>
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        className={styles.priceChip}
        onClick={handleQuickAdd}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.05, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className={styles.chipFloat}
        >
          <div className={styles.priceChipInfo}>
            {discountPercent && <span className={styles.priceChipDiscount}>−{discountPercent}%</span>}
            <span className={styles.priceChipPrice}>{formatPrice(price)}</span>
          </div>
          <span className={styles.priceChipBtn}>
            {added ? <Check size={15} /> : <Plus size={15} />}
          </span>
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
