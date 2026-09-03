'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Flame, Zap, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { formatPrice, getProductPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/lib/shipping';
import { isOptimizableImageUrl } from '@/lib/imageHost';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  index?: number;
  spotlight?: boolean;
}

export default function ProductCard({ product, spotlight = false }: Props) {
  const router = useRouter();
  const { addItem, closeCart } = useCartStore();
  const { price, compareAtPrice } = getProductPrice(product);
  const [hovered, setHovered] = useState(false);

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const secondImage = product.images?.[1];

  const stockQty = product.variants[0]?.quantityAvailable;
  const lowStock = product.availableForSale && typeof stockQty === 'number' && stockQty > 0 && stockQty < LOW_STOCK_THRESHOLD;

  // Odbrojavanje "ponude dana" do ponoći - samo na istaknutoj kartici sa popustom
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

  const handleBuyNow = (e: React.MouseEvent) => {
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
    closeCart();
    router.push('/checkout');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
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
  };

  const actionButtons = (
    <div className={styles.btnGroup}>
      <button
        className={styles.buyNowBtn}
        onClick={handleBuyNow}
        disabled={!product.availableForSale}
      >
        <Zap size={13} fill="currentColor" />
        <span>{product.availableForSale ? 'KUPI ODMAH' : 'Rasprodato'}</span>
      </button>
      {product.availableForSale && (
        <button
          className={styles.cartBtn}
          onClick={handleAddToCart}
        >
          <ShoppingCart size={13} />
          <span>DODAJ U KORPU</span>
        </button>
      )}
    </div>
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
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              unoptimized={!isOptimizableImageUrl(product.featuredImage.url)}
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
              {actionButtons}
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
              <Image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText ?? product.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"
                unoptimized={!isOptimizableImageUrl(product.featuredImage.url)}
                className={styles.image}
                style={{ opacity: hovered && secondImage ? 0 : 1 }}
              />
              {secondImage && (
                <Image
                  src={secondImage.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"
                  unoptimized={!isOptimizableImageUrl(secondImage.url)}
                  className={styles.image}
                  style={{ position: 'absolute', inset: 0, opacity: hovered ? 1 : 0 }}
                />
              )}
            </>
          ) : (
            <div className={styles.placeholder}>◆</div>
          )}
          <div className={styles.badges}>
            {discountPercent && <span className={styles.discountPill}>−{discountPercent}%</span>}
            {product.tags.includes('novo') && !discountPercent && (
              <span className={styles.newPill}>NOVO</span>
            )}
          </div>
          <div className={styles.quickAdd}>{actionButtons}</div>
        </div>
        <div className={styles.info}>
          <span className={styles.vendor}>{product.vendor}</span>
          <h3 className={styles.title}>{product.title}</h3>
          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(price)}</span>
            {compareAtPrice && <span className={styles.comparePrice}>{formatPrice(compareAtPrice)}</span>}
          </div>
          {product.availableForSale ? (
            lowStock ? (
              <span className={styles.lowStock}><Flame size={12} /> Još samo {stockQty} kom</span>
            ) : (
              <span className={styles.stock}><CheckCircle2 size={12} /> Na stanju</span>
            )
          ) : (
            <span className={styles.unavailable}>Nije dostupno</span>
          )}
          {/*
            Druga kopija dugmadi, za ekrane bez hovera.
            Na dodir nema hovera, pa je traka preko slike stajala stalno i
            prekrivala 43% ploče (sa dva dugmeta i preko 70%). Neaktivna kopija
            se gasi sa display: none, pa je nema ni u pristupačnosti - čitač
            ekrana ne izgovara dugmad dva puta.
          */}
          <div className={styles.touchActions}>{actionButtons}</div>
        </div>
      </Link>
    </motion.div>
  );
}
