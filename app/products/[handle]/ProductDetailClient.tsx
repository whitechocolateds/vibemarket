'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product, ProductVariant } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/shopify';
import styles from './product.module.css';

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const { addItem, openCart } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = parseFloat(selectedVariant.price.amount);
  const compareAtPrice = selectedVariant.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice.amount)
    : null;

  const discountPercent = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : null;

  const images = product.images.length > 0 ? product.images : (product.featuredImage ? [product.featuredImage] : []);

  const handleAddToCart = () => {
    addItem({
      id: selectedVariant.id,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      variantTitle: selectedVariant.title !== 'Default' ? selectedVariant.title : '',
      price,
      compareAtPrice: compareAtPrice ?? undefined,
      image: product.featuredImage,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  // Group options
  const optionNames = Array.from(new Set(product.variants.flatMap((v) => v.selectedOptions.map((o) => o.name))));

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link href="/">Početna</Link>
          <span>/</span>
          <Link href="/products">Proizvodi</Link>
          <span>/</span>
          <span>{product.title}</span>
        </nav>

        <div className={styles.layout}>
          {/* Images */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage].url}
                  alt={images[selectedImage].altText ?? product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={styles.mainImg}
                  priority
                />
              ) : (
                <div className={styles.noImage}>🛍️</div>
              )}
              {discountPercent && (
                <span className={`badge badge-orange ${styles.discountBadge}`}>-{discountPercent}%</span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    className={`${styles.thumb} ${selectedImage === i ? styles.thumbActive : ''}`}
                    onClick={() => setSelectedImage(i)}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText ?? `${product.title} ${i + 1}`}
                      fill
                      sizes="80px"
                      className={styles.thumbImg}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={styles.info}>
            <div className={styles.infoTop}>
              <p className={styles.vendor}>{product.vendor}</p>
              <h1 className={styles.title}>{product.title}</h1>

              {/* Price */}
              <div className={styles.priceBlock}>
                <span className={styles.price}>{formatPrice(price)}</span>
                {compareAtPrice && (
                  <span className="price-compare">{formatPrice(compareAtPrice)}</span>
                )}
                {discountPercent && (
                  <span className="price-discount">Uštedite {discountPercent}%</span>
                )}
              </div>

              {/* Availability */}
              {selectedVariant.availableForSale ? (
                <div className={styles.available}>
                  <span className={styles.availDot} />
                  Na stanju {selectedVariant.quantityAvailable !== undefined && `(${selectedVariant.quantityAvailable} dostupno)`}
                </div>
              ) : (
                <div className={styles.unavailable}>Nije dostupno</div>
              )}
            </div>

            {/* Variants */}
            {optionNames.map((optName) => {
              if (optName === 'Title') return null;
              const values = Array.from(new Set(
                product.variants
                  .flatMap((v) => v.selectedOptions.filter((o) => o.name === optName).map((o) => o.value))
              ));
              return (
                <div key={optName} className={styles.optionGroup}>
                  <p className={styles.optionLabel}>{optName}:</p>
                  <div className={styles.optionValues}>
                    {values.map((val) => {
                      const variant = product.variants.find((v) =>
                        v.selectedOptions.some((o) => o.name === optName && o.value === val)
                      );
                      const isSelected = selectedVariant.selectedOptions.some(
                        (o) => o.name === optName && o.value === val
                      );
                      return (
                        <button
                          key={val}
                          className={`${styles.optionBtn} ${isSelected ? styles.optionSelected : ''} ${!variant?.availableForSale ? styles.optionDisabled : ''}`}
                          onClick={() => variant && setSelectedVariant(variant)}
                          disabled={!variant?.availableForSale}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantity */}
            <div className={styles.qtyRow}>
              <p className={styles.optionLabel}>Količina:</p>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span className="qty-value">{quantity}</span>
                <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className={styles.ctaButtons}>
              <button
                className={`btn btn-primary btn-full ${styles.addBtn}`}
                onClick={handleAddToCart}
                disabled={!selectedVariant.availableForSale}
                id={`add-to-cart-detail-${product.handle}`}
              >
                {added ? (
                  <>✓ Dodato u korpu</>
                ) : selectedVariant.availableForSale ? (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    Dodaj u korpu
                  </>
                ) : (
                  'Nije dostupno'
                )}
              </button>
              <Link href="/checkout" className={`btn btn-secondary btn-full ${styles.buyBtn}`} id="buy-now-btn">
                Kupi odmah →
              </Link>
            </div>

            {/* Perks */}
            <div className={styles.perks}>
              <div className={styles.perk}><span>💳</span> Plaćanje pouzećem</div>
              <div className={styles.perk}><span>🚀</span> Dostava 1-3 radna dana</div>
              <div className={styles.perk}><span>🔒</span> Sigurna kupovina</div>
            </div>

            {/* Description */}
            {product.descriptionHtml ? (
              <div className={styles.description}>
                <h3>Opis proizvoda</h3>
                <div
                  className={styles.descriptionHtml}
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </div>
            ) : product.description ? (
              <div className={styles.description}>
                <h3>Opis proizvoda</h3>
                <p>{product.description}</p>
              </div>
            ) : null}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className={styles.tags}>
                {product.tags.map((tag) => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
