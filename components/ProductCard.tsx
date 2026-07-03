'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { formatPrice, getProductPrice } from '@/lib/shopify';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { addItem } = useCartStore();
  const { price, compareAtPrice } = getProductPrice(product);

  const discountPercent =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  const isNew = product.tags.includes('novo');
  const isBestseller = product.tags.includes('bestseller');

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

  return (
    <Link
      href={`/products/${product.handle}`}
      className={styles.card}
      style={{ animationDelay: `${index * 50}ms` }}
      id={`product-card-${product.handle}`}
    >
      {/* Image */}
      <div className={styles.imageWrapper}>
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}><span>🛍️</span></div>
        )}

        {/* Badges */}
        <div className={styles.badges}>
          {discountPercent && (
            <span className={`badge badge-dark ${styles.badge}`}>−{discountPercent}%</span>
          )}
          {isNew && !discountPercent && (
            <span className={`badge badge-gold ${styles.badge}`}>Novo</span>
          )}
          {isBestseller && (
            <span className={`badge badge-dark ${styles.badge}`}>★ Popular</span>
          )}
        </div>

        {/* Quick add overlay */}
        <div className={styles.quickAdd}>
          <button
            className={`btn btn-primary btn-sm ${styles.addBtn}`}
            onClick={handleAddToCart}
            disabled={!product.availableForSale}
            id={`add-to-cart-${product.handle}`}
          >
            {product.availableForSale ? 'Dodaj u korpu' : 'Nije dostupno'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <p className={styles.vendor}>{product.vendor || 'VibeMarket'}</p>
        <h3 className={styles.title}>{product.title}</h3>
        <div className={styles.priceRow}>
          <span className="price">{formatPrice(price)}</span>
          {compareAtPrice && (
            <span className="price-compare">{formatPrice(compareAtPrice)}</span>
          )}
        </div>
        {product.availableForSale ? (
          <span className={styles.availability}><span className={styles.dot} />Na stanju</span>
        ) : (
          <span className={styles.unavailable}>Nije dostupno</span>
        )}
      </div>
    </Link>
  );
}
