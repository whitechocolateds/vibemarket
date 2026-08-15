'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Truck, Wallet, ShieldCheck, Check, Heart, Share2, Star, Flame, Eye, Clock, MessageCircleHeart, HelpCircle, ListChecks, Home, ChevronRight, Zap, ShoppingCart, CheckCircle2, Tag, Sparkles, Maximize2 } from 'lucide-react';
import { Product, ProductVariant } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { useWishlist } from '@/lib/useWishlist';
import { formatPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import { recordRecentlyViewed } from '@/lib/recentlyViewed';
import { pickTestimonials } from '@/lib/testimonials';
import { stableReviewCount } from '@/lib/reviewStats';
import { bundleUnitPrice } from '@/lib/bundlePricing';
import { trackPixel } from '@/lib/metaEvents';
import Accordion from '@/components/motion/Accordion';
import Reveal from '@/components/motion/Reveal';
import ProductCard from '@/components/ProductCard';
import RecentlyViewed from '@/components/RecentlyViewed';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import ProductComparisonTable from '@/components/ProductComparisonTable';
import ProductFAQ from '@/components/ProductFAQ';
import ImageLightbox from '@/components/ImageLightbox';
import BundlePicker from '@/components/BundlePicker';
import styles from './product.module.css';

const OFFER_CYCLE_MS = 30 * 60 * 1000;

function useOfferCountdown() {
  const [label, setLabel] = useState('30:00');
  useEffect(() => {
    const tick = () => {
      const remainder = OFFER_CYCLE_MS - (Date.now() % OFFER_CYCLE_MS);
      const m = Math.floor(remainder / 60000);
      const s = Math.floor((remainder % 60000) / 1000);
      setLabel(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return label;
}

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

function viewersLabel(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) return 'osobe gledaju';
  return 'osoba gleda';
}

export default function ProductDetailClient({ product, related }: Props) {
  const router = useRouter();
  const { addItem, closeCart } = useCartStore();
  const { isWished, toggle: toggleWishlist } = useWishlist(product.id);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Ram se prilagođava odnosu stranica slike, ali ostaje u razumnim granicama
  // da vrlo široka ili vrlo uska slika ne razvuče stranicu.
  const [frameRatio, setFrameRatio] = useState<number | null>(null);

  const applyFrameRatio = (el: HTMLImageElement) => {
    const { naturalWidth: w, naturalHeight: h } = el;
    if (!w || !h) return;
    // od 3:4 (uspravno) do 4:3 (položeno)
    const ratio = Math.min(4 / 3, Math.max(3 / 4, w / h));
    setFrameRatio((prev) => (prev !== null && Math.abs(prev - ratio) < 0.01 ? prev : ratio));
  };
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { margin: '-100px 0px 0px 0px' });
  const offerCountdown = useOfferCountdown();
  const reviews = pickTestimonials(product.handle).map((r, i) =>
    i < 2 && product.featuredImage ? { ...r, image: product.featuredImage.url } : r
  );

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
  const bundleTotal = bundleUnitPrice(price, quantity) * quantity;

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

  useEffect(() => {
    trackPixel('ViewContent', {
      content_ids: [product.id],
      content_name: product.title,
      content_type: 'product',
      value: price,
      currency: 'RSD',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // "Uživo" broj posetilaca - deterministična početna vrednost (SSR-safe), blago osciluje
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

  const handleBuyNow = () => {
    if (!selectedVariant.availableForSale) return;
    addItem(buildCartItem());
    trackPixel('AddToCart', {
      content_ids: [product.id],
      content_name: product.title,
      content_type: 'product',
      value: bundleTotal,
      currency: 'RSD',
    });
    closeCart();
    router.push('/checkout');
  };

  const handleAddToCart = () => {
    if (!selectedVariant.availableForSale) return;
    addItem(buildCartItem());
    trackPixel('AddToCart', {
      content_ids: [product.id],
      content_name: product.title,
      content_type: 'product',
      value: bundleTotal,
      currency: 'RSD',
    });
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

  const descriptionSections = product.descriptionHtml
    ? splitDescriptionSections(product.descriptionHtml)
    : [];

  // Gornja kartica dobija samo uvod; <h3> sekcije idu u akordeon, da se opis ne
  // renderuje dvaput na istoj stranici.
  const leadHtml = descriptionSections[0]?.content.trim() ?? '';

  const extraSections = descriptionSections.filter(
    (s) => s.title !== 'O proizvodu' && s.content.trim().length > 0
  );

  const accordionItems = extraSections.length > 0
    ? extraSections.map((s) => ({
        title: s.title,
        content: <div dangerouslySetInnerHTML={{ __html: s.content }} />,
      }))
    : [{
        title: 'Specifikacije i pakovanje',
        content: (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>1x Originalni proizvod {product.title}</li>
            <li>1x Uputstvo za upotrebu na srpskom jeziku</li>
            <li>1x Garantni list i deklaracija uvoznika</li>
          </ul>
        ),
      }];

  return (
    <div className={styles.page}>
      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images}
          index={selectedImage}
          onIndexChange={setSelectedImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="container">
        <nav className={styles.breadcrumb} aria-label="Putanja">
          <Link href="/" className={styles.crumb}>
            <Home size={13} strokeWidth={2.2} /> Početna
          </Link>
          <ChevronRight size={13} className={styles.crumbSep} aria-hidden />
          <Link href="/products" className={styles.crumb}>Kolekcija</Link>
          <ChevronRight size={13} className={styles.crumbSep} aria-hidden />
          <span className={styles.crumbCurrent} aria-current="page">{product.title}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.gallery}>
            <motion.div
              className={styles.mainImage}
              style={frameRatio ? { aspectRatio: String(frameRatio) } : undefined}
              transition={{ duration: 0.4 }}
              role="button"
              tabIndex={0}
              aria-label="Otvori sliku preko celog ekrana"
              onClick={() => images[selectedImage] && setLightboxOpen(true)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && images[selectedImage]) {
                  e.preventDefault();
                  setLightboxOpen(true);
                }
              }}
            >
              <AnimatePresence mode="wait">
                {images[selectedImage] ? (
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={styles.mainImgWrap}
                  >
                    {/* Zamućena kopija popunjava ram - inače bi oko slike stajale prazne trake */}
                    <span
                      className={styles.mainImgBackdrop}
                      style={{ backgroundImage: `url(${JSON.stringify(images[selectedImage].url)})` }}
                      aria-hidden="true"
                    />
                    <img
                      src={images[selectedImage].url}
                      alt={images[selectedImage].altText ?? product.title}
                      className={styles.mainImg}
                      onLoad={(e) => applyFrameRatio(e.currentTarget)}
                      // Kad je slika već u kešu, onLoad ne opali - ref hvata taj slučaj
                      ref={(el) => { if (el?.complete) applyFrameRatio(el); }}
                    />
                  </motion.div>
                ) : (
                  <div className={styles.noImage}>◇</div>
                )}
              </AnimatePresence>

              <span className={styles.zoomHint}>
                <Maximize2 size={13} /> Klikni za uvećanje
              </span>
              {discountPercent && (
                <span className={`badge badge-red ${styles.discountBadge}`}>−{discountPercent}%</span>
              )}
              <div className={styles.galleryActions}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  className={`${styles.iconRoundBtn} ${isWished ? styles.iconRoundBtnActive : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(); }}
                  aria-label={isWished ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
                  aria-pressed={isWished}
                >
                  <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  className={styles.iconRoundBtn}
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
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
                    <img
                      src={img.url}
                      alt=""
                      className={styles.thumbImg}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.info}>
            <span className={styles.vendor}>{product.vendor}</span>
            <h1 className={styles.title}>{product.title}</h1>

            <div className={styles.ratingRow}>
              <button
                type="button"
                className={styles.ratingStarsBtn}
                onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                title="Pogledaj sve recenzije kupaca"
              >
                <div className={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <span>4.9 · {reviewCount} recenzija</span>
              </button>
              <span className={styles.viewers}>
                <Eye size={13} /> {viewers} {viewersLabel(viewers)} upravo sada
              </span>
            </div>

            <div className={styles.priceBlock}>
              <span className={styles.price}>{formatPrice(price)}</span>
              {compareAtPrice && <span className="price-compare">{formatPrice(compareAtPrice)}</span>}
              {compareAtPrice && compareAtPrice > price && (
                <span className={styles.savingsAmountBadge}>
                  Ušteda {formatPrice(compareAtPrice - price)} ({discountPercent}%)
                </span>
              )}
            </div>

            <div className={styles.offerTimerBadge}>
              <div className={styles.offerLiveDot} />
              <Flame size={15} className={styles.offerFlameIcon} />
              <span className={styles.offerLabel}>Ponuda ističe za:</span>
              <div className={styles.offerCountdownBox}>
                <Clock size={13} />
                <span>{offerCountdown}</span>
              </div>
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

            <div className={styles.topDescriptionBox}>
              <div className={styles.topDescriptionHeader}>
                <span className={styles.topDescriptionIconWrap}>
                  <Sparkles size={13} className={styles.topDescriptionIcon} />
                </span>
                <span>O PROIZVODU</span>
              </div>
              {leadHtml ? (
                <div
                  className={styles.topDescriptionText}
                  dangerouslySetInnerHTML={{ __html: leadHtml }}
                />
              ) : (
                <div className={styles.topDescriptionText}>
                  <p>
                    {product.description ||
                      'Premium proizvod sa visokim performansama, napravljen od vrhunskih materijala za dugotrajnu upotrebu.'}
                  </p>
                </div>
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

            <div className={styles.bundleSection}>
              <BundlePicker
                basePrice={price}
                compareAtPrice={compareAtPrice}
                value={quantity}
                onChange={setQuantity}
                label="Izaberite paket"
              />
            </div>

            <div className={styles.ctaButtons} ref={ctaRef}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                className={`btn ${styles.buyNowBtn}`}
                onClick={handleBuyNow}
                disabled={!selectedVariant.availableForSale}
              >
                <Zap size={18} fill="currentColor" />
                {selectedVariant.availableForSale ? `KUPI ODMAH · ${formatPrice(bundleTotal)}` : 'Rasprodato'}
              </motion.button>
              {selectedVariant.availableForSale && (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  className={`btn ${styles.cartBtn}`}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart size={18} />
                  DODAJ U KORPU
                </motion.button>
              )}
              <div className={styles.shippingHintBar}>
                {bundleTotal >= FREE_SHIPPING_THRESHOLD ? (
                  <div className={styles.freeShippingActive}>
                    <CheckCircle2 size={15} />
                    <span>Ostvarujete <strong>besplatnu dostavu</strong> za ovu porudžbinu!</span>
                  </div>
                ) : (
                  <div className={styles.freeShippingPending}>
                    <Truck size={15} />
                    <span>Besplatna dostava za porudžbine iznad <strong>{formatPrice(FREE_SHIPPING_THRESHOLD)}</strong></span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.perksGrid}>
              <div className={styles.perkCard}>
                <div className={styles.perkIconWrap}><Truck size={20} /></div>
                <div className={styles.perkText}>
                  <strong>DOSTAVA</strong>
                  <span>1-3 radna dana</span>
                </div>
              </div>
              <div className={styles.perkCard}>
                <div className={styles.perkIconWrap}><Wallet size={20} /></div>
                <div className={styles.perkText}>
                  <strong>PLAĆANJE</strong>
                  <span>Pouzećem</span>
                </div>
              </div>
              <div className={styles.perkCard}>
                <div className={styles.perkIconWrap}><ShieldCheck size={20} /></div>
                <div className={styles.perkText}>
                  <strong>GARANCIJA</strong>
                  <span>100% Zadovoljstvo</span>
                </div>
              </div>
            </div>

            <div className={styles.trustBadgesBar}>
              <div className={styles.trustItem}>
                <ShieldCheck size={14} className={styles.trustIcon} />
                <span>100% Sigurna kupovina</span>
              </div>
              <div className={styles.trustItem}>
                <CheckCircle2 size={14} className={styles.trustIcon} />
                <span>Garancija povraćaja novca</span>
              </div>
              <div className={styles.trustItem}>
                <Truck size={14} className={styles.trustIcon} />
                <span>Brza isporuka na kućnu adresu</span>
              </div>
            </div>

            {accordionItems.length > 0 && (
              <Reveal>
                <Accordion items={accordionItems} />
              </Reveal>
            )}

            {product.tags.length > 0 && (
              <div className={styles.tags}>
                {product.tags.map((tag) => (
                  <span key={tag} className={styles.tagPill}>
                    <Tag size={12} className={styles.tagIcon} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className={styles.infoSection}>
          <div className={styles.compareFaqGrid}>
            <div>
              <Reveal className={styles.infoSectionHeader}>
                <span className="section-label"><ListChecks size={13} style={{ marginRight: 6, verticalAlign: -2 }} />Uporedite sami</span>
                <h2 className="section-title">Zašto baš {product.title}?</h2>
              </Reveal>
              <Reveal delay={0.08}>
                <ProductComparisonTable vendor={product.vendor} title={product.title} points={product.comparisonPoints} />
              </Reveal>
            </div>

            <div>
              <Reveal className={styles.infoSectionHeader}>
                <span className="section-label"><HelpCircle size={13} style={{ marginRight: 6, verticalAlign: -2 }} />Pitanja i odgovori</span>
                <h2 className="section-title">Pitanja o proizvodu</h2>
              </Reveal>
              <Reveal delay={0.08}>
                <ProductFAQ faqs={product.faqs} />
              </Reveal>
            </div>
          </div>
        </section>

        <section className={styles.infoSection} ref={reviewsRef}>
          <Reveal className={styles.infoSectionHeader}>
            <span className="section-label"><MessageCircleHeart size={13} style={{ marginRight: 6, verticalAlign: -2 }} />Iskustva kupaca</span>
            <h2 className="section-title">Šta kažu kupci</h2>
          </Reveal>
          <TestimonialsCarousel items={reviews} />
        </section>

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
            <div className={`container ${styles.stickyInner}`}>
              <div className={styles.stickyProductWrap}>
                {product.featuredImage && (
                  <img src={product.featuredImage.url} alt="" className={styles.stickyThumb} />
                )}
                <div className={styles.stickyInfo}>
                  <span className={styles.stickyTitle}>{product.title}</span>
                  <div className={styles.stickyMeta}>
                    <span className={styles.stickyPrice}>{formatPrice(bundleTotal)}</span>
                    <span className={styles.stickyShippingBadge}>
                      <Truck size={12} /> Free shipping
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.stickyActions}>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  className={`btn ${styles.stickyBuyBtn}`}
                  onClick={handleBuyNow}
                  disabled={!selectedVariant.availableForSale}
                >
                  <Zap size={15} fill="currentColor" />
                  {selectedVariant.availableForSale ? 'KUPI ODMAH' : 'Rasprodato'}
                </motion.button>
                {selectedVariant.availableForSale && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    className={`btn ${styles.stickyCartBtn}`}
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart size={15} />
                    Dodaj
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
