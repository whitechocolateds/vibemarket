'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Truck, Wallet, ShieldCheck, Check, Heart, Share2, Star, Flame, Eye } from 'lucide-react';
import { Product, ProductVariant } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { useWishlist } from '@/lib/useWishlist';
import { formatPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/lib/shipping';
import { recordRecentlyViewed } from '@/lib/recentlyViewed';
import Accordion from '@/components/motion/Accordion';
import Reveal from '@/components/motion/Reveal';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import styles from './product.module.css';

interface Props {
  product: Product;
  related: Product[];
}

function splitDescriptionSections(html: string): { title: string; content: string }[] {
  const parts = html.split(/<h3>(.*?)<\/h3>/);
  const sections = [{ title: 'O proizvodu', content: parts[0] ?? '' }];
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({ title: parts[i], content: parts[i + 1] ?? '' });
  }
  return sections;
}

function stableHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

function stableReviewCount(id: string): number {
  return 60 + (stableHash(id) % 340);
}

function viewersLabel(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'osobe gledaju';
  return 'osoba gleda';
}

export default function ProductDetailClient({ product, related }: Props) {
  const router = useRouter();
  const { addItem, openCart, closeCart } = useCartStore();
  const { isWished, toggle: toggleWishlist } = useWishlist(product.id);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [copied, setCopied] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { margin: '-100px 0px 0px 0px' });

  const price = parseFloat(selectedVariant.price.amount);
  const compareAtPrice = selectedVariant.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice.amount)
    : null;

  const discountPercent = compareAtPrice && compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : null;

  const images = product.images.length > 0 ? product.images : (product.featuredImage ? [product.featuredImage] : []);
  const reviewCount = stableReviewCount(product.id);
  const lowStock = typeof selectedVariant.quantityAvailable === 'number' && selectedVariant.quantityAvailable > 0 && selectedVariant.quantityAvailable < LOW_STOCK_THRESHOLD;

  useEffect(() => {
    recordRecentlyViewed({
      handle: product.handle,
      title: product.title,
      image: product.featuredImage?.url ?? null,
      price: parseFloat(product.variants[0]?.price.amount ?? '0'),
      compareAtPrice: product.variants[0]?.compareAtPrice
        ? parseFloat(product.variants[0].compareAtPrice.amount)
        : null,
    });
  }, [product]);

  // "Uživo" broj posetilaca — deterministična početna vrednost (SSR-safe), blago osciluje
  const [viewers, setViewers] = useState(() => 5 + (stableHash(product.id) % 14));
  useEffect(() => {
    const id = setInterval(() => {
      setViewers((v) => Math.max(3, Math.min(24, v + (Math.random() < 0.5 ? -1 : 1))));
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const buildCartItem = () => ({
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

  const handleAddToCart = () => {
    addItem(buildCartItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    openCart();
  };

  const handleBuyNow = () => {
    if (!selectedVariant.availableForSale) return;
    addItem(buildCartItem());
    closeCart();
    router.push('/checkout');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable, ignore */
    }
  };

  const optionNames = Array.from(new Set(product.variants.flatMap((v) => v.selectedOptions.map((o) => o.name))));

  const accordionItems = product.descriptionHtml
    ? splitDescriptionSections(product.descriptionHtml).map((s) => ({
        title: s.title,
        content: <div dangerouslySetInnerHTML={{ __html: s.content }} />,
      }))
    : product.description
      ? [{ title: 'O proizvodu', content: <p>{product.description}</p> }]
      : [];

  return (
    <div className={styles.page}>
      <div className="container">
        <nav className={styles.breadcrumb}>
          <Link href="/">Početna</Link>
          <span>·</span>
          <Link href="/products">Kolekcija</Link>
          <span>·</span>
          <span>{product.title}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.gallery}>
            <motion.div
              className={styles.mainImage}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.4 }}
            >
              <AnimatePresence mode="wait">
                {images[selectedImage] ? (
                  <motion.img
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    src={images[selectedImage].url}
                    alt={images[selectedImage].altText ?? product.title}
                    className={styles.mainImg}
                  />
                ) : (
                  <div className={styles.noImage}>◇</div>
                )}
              </AnimatePresence>
              {discountPercent && (
                <span className={`badge badge-gold ${styles.discountBadge}`}>−{discountPercent}%</span>
              )}
              <div className={styles.galleryActions}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  className={`${styles.iconRoundBtn} ${isWished ? styles.iconRoundBtnActive : ''}`}
                  onClick={toggleWishlist}
                  aria-label={isWished ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
                  aria-pressed={isWished}
                >
                  <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  className={styles.iconRoundBtn}
                  onClick={handleShare}
                  aria-label="Kopiraj link ka proizvodu"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copied ? 'ok' : 'share'}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      style={{ display: 'flex' }}
                    >
                      {copied ? <Check size={16} /> : <Share2 size={16} />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.thumb} ${selectedImage === i ? styles.thumbActive : ''}`}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Prikaži sliku ${i + 1}`}
                  >
                    <img src={img.url} alt="" className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <span className={styles.vendor}>{product.vendor}</span>
            <h1 className={styles.title}>{product.title}</h1>

            <div className={styles.ratingRow}>
              <div className={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <span>4.9 · {reviewCount} recenzija</span>
              <span className={styles.viewers}>
                <Eye size={13} /> {viewers} {viewersLabel(viewers)} upravo sada
              </span>
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.price}>{formatPrice(price)}</span>
              {compareAtPrice && <span className="price-compare">{formatPrice(compareAtPrice)}</span>}
              {discountPercent && <span className="price-discount">Ušteda {discountPercent}%</span>}
            </div>

            <div className={styles.stockRow}>
              {selectedVariant.availableForSale ? (
                <span className={styles.available}>● Na stanju</span>
              ) : (
                <span className={styles.unavailable}>Nije dostupno</span>
              )}
              {lowStock && (
                <span className={styles.lowStock}><Flame size={12} /> Još samo {selectedVariant.quantityAvailable} na stanju</span>
              )}
            </div>

            {optionNames.map((optName) => {
              if (optName === 'Title') return null;
              const values = Array.from(new Set(
                product.variants.flatMap((v) => v.selectedOptions.filter((o) => o.name === optName).map((o) => o.value))
              ));
              return (
                <div key={optName} className={styles.optionGroup}>
                  <p className={styles.optionLabel}>{optName}</p>
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
                          type="button"
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

            <div className={styles.qtyRow}>
              <p className={styles.optionLabel}>Količina</p>
              <div className="qty-control">
                <button type="button" className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span className="qty-value">{quantity}</span>
                <button type="button" className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>

            <div className={styles.ctaButtons} ref={ctaRef}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className={`btn btn-primary btn-full ${styles.addBtn}`}
                onClick={handleAddToCart}
                disabled={!selectedVariant.availableForSale}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={added ? 'ok' : 'add'}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    {added && <Check size={16} />}
                    {added ? 'Dodato u korpu' : selectedVariant.availableForSale ? 'Dodaj u korpu' : 'Rasprodato'}
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={handleBuyNow}
                disabled={!selectedVariant.availableForSale}
              >
                Kupi odmah
              </button>
            </div>

            <div className={styles.perks}>
              <div className={styles.perk}><Truck size={18} /><strong>Dostava</strong>1–3 radna dana</div>
              <div className={styles.perk}><Wallet size={18} /><strong>Plaćanje</strong>Pouzećem</div>
              <div className={styles.perk}><ShieldCheck size={18} /><strong>Garancija</strong>Zadovoljstvo</div>
            </div>

            {accordionItems.length > 0 && (
              <Reveal>
                <Accordion items={accordionItems} />
              </Reveal>
            )}

            {product.tags.length > 0 && (
              <div className={styles.tags}>
                {product.tags.map((tag) => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className={styles.relatedSection}>
            <Reveal>
              <span className="section-label">Možda vam se dopada</span>
              <h2 className="section-title">Uz ovaj proizvod</h2>
            </Reveal>
            <div className="grid-products">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.06}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <RecentlyViewed excludeHandle={product.handle} />
      </div>

      <AnimatePresence>
        {!ctaInView && (
          <motion.div
            className={styles.stickyBar}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className={styles.stickyInfo}>
              <span className={styles.stickyTitle}>{product.title}</span>
              <span className={styles.stickyPrice}>{formatPrice(price)}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddToCart}
              disabled={!selectedVariant.availableForSale}
            >
              {selectedVariant.availableForSale ? 'Dodaj u korpu' : 'Rasprodato'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
