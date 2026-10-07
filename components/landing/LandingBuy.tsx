'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ShoppingCart, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { bundleUnitPrice } from '@/lib/bundlePricing';
import BundlePicker from '@/components/BundlePicker';
import { freeGiftBadge } from '@/components/FreeGiftBlock';
import giftStyles from '@/components/FreeGiftBlock.module.css';
import styles from './LandingPage.module.css';

/**
 * Deo za kupovinu na dnu landing stranice, PLUS lepljiva traka pri dnu ekrana.
 *
 * Traka je namerno u OVOJ komponenti, a ne zasebna: tako deli isto stanje
 * kolicine, istu cenu i bas onu `kupiOdmah` funkciju koju zove glavno dugme.
 * Da je zasebna, radnja kupovine bi postojala u dva primerka i razisla bi se.
 * Posto je `position: fixed`, mesto u DOM-u joj ne odredjuje prikaz.
 *
 * Koristi isti obracun paketa i istu korpu kao standardna stranica - cena se
 * ne racuna ovde, nego u bundlePricing, da se dva mesta ne raziđu.
 */
/** Koliko pre ulaska glavnog bloka traka nestaje, u pikselima. */
const CTA_RANIJE = 90;

export default function LandingBuy({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const closeCart = useCartStore((s) => s.closeCart);
  const openCart = useCartStore((s) => s.openCart);
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants[0];
  const basePrice = Number(product.priceRange.minVariantPrice.amount);
  const compareAtPrice = variant?.compareAtPrice ? Number(variant.compareAtPrice.amount) : null;
  const unitPrice = bundleUnitPrice(basePrice, quantity);
  const total = unitPrice * quantity;
  const savings = compareAtPrice && compareAtPrice > basePrice
    ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
    : null;

  const dodaj = () => {
    if (!variant) return;
    addItem({
      id: variant.id,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      variantTitle: variant.title !== 'Default' ? variant.title : '',
      price: unitPrice,
      compareAtPrice: compareAtPrice ?? undefined,
      image: product.featuredImage,
      quantity,
    });
  };

  const kupiOdmah = () => {
    if (!variant) return;
    dodaj();
    closeCart();
    router.push('/checkout');
  };

  const uKorpu = () => {
    if (!variant) return;
    dodaj();
    openCart();
  };

  const dostupno = product.availableForSale && (variant?.availableForSale ?? false);
  const gratisBedz = freeGiftBadge(product.freeGift);

  /*
   * Traka se pojavljuje kad korisnik prodje uvodni deo i sakriva kad glavni
   * blok za kupovinu dodje u kadar - inace bi dva dugmeta "KUPI ODMAH" stajala
   * jedno nad drugim.
   *
   * Oba granicnika postavlja LandingPage.tsx: `data-lp-gate` je tanak marker
   * neposredno posle hero/overlay dela, `data-lp-cta` je sam glavni blok. Trazi
   * ih se kroz DOM jer stoje izvan ove komponente, a jedina alternativa bi bila
   * da ceo landing postane klijentska komponenta.
   */
  const [prosaoUvod, setProsaoUvod] = useState(false);
  const [ctaDosegnut, setCtaDosegnut] = useState(false);
  const manjePokreta = useReducedMotion();

  useEffect(() => {
    const posmatraci: IntersectionObserver[] = [];

    const kapija = document.querySelector('[data-lp-gate]');
    if (kapija) {
      /*
       * Prvo stanje se CITA sinhrono, pa se tek onda posmatra.
       *
       * IntersectionObserver javlja prelaze. Ko stranicu otvori vec skrolovanu -
       * vracena pozicija posle osvezavanja, vracanje nazad kroz istoriju, link sa
       * sidrom - nikad nije presao granicu, pa bi bez ovog citanja traka ostala
       * skrivena do prvog prelaza preko markera.
       *
       * Marker je visok 1px, pa je dovoljno sa koje je strane ekrana: iznad
       * (top < 0) znaci da je uvod prescrolovan.
       */
      setProsaoUvod(kapija.getBoundingClientRect().top < 0);

      const o = new IntersectionObserver(
        ([u]) => setProsaoUvod(u.boundingClientRect.top < 0),
        { threshold: 0 }
      );
      o.observe(kapija);
      posmatraci.push(o);
    }

    const cta = document.querySelector('[data-lp-cta]');
    if (cta) {
      /*
       * Gleda se da li je glavni blok DOSEGNUT, ne da li je u kadru.
       *
       * Sa "u kadru" se traka vracala ispod bloka, nad footerom prodavnice, i
       * prekrivala mu donji red - izmereno na 390px. Ovako se sakrije malo pre
       * bloka (da dva "KUPI ODMAH" ne stoje jedno nad drugim) i ostaje skrivena
       * do kraja stranice.
       */
      const dosegnut = (vrh: number) => vrh < window.innerHeight - CTA_RANIJE;
      setCtaDosegnut(dosegnut(cta.getBoundingClientRect().top));

      const o = new IntersectionObserver(([u]) => setCtaDosegnut(dosegnut(u.boundingClientRect.top)), {
        rootMargin: `0px 0px -${CTA_RANIJE}px 0px`,
      });
      o.observe(cta);
      posmatraci.push(o);
    }

    return () => posmatraci.forEach((o) => o.disconnect());
  }, []);

  const trakaVidljiva = dostupno && prosaoUvod && !ctaDosegnut;

  return (
    <>
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatPrice(total)}</span>
        {compareAtPrice && compareAtPrice > basePrice && (
          <span className={styles.compare}>{formatPrice(compareAtPrice * quantity)}</span>
        )}
        {savings !== null && <span className={styles.save}>−{savings}%</span>}
        {gratisBedz && <span className={giftStyles.bedz}>{gratisBedz}</span>}
      </div>

      <div className={styles.bundle}>
        <BundlePicker
          basePrice={basePrice}
          compareAtPrice={compareAtPrice}
          value={quantity}
          onChange={setQuantity}
          ariaLabel="Izaberite paket"
        />
      </div>

      <div className={styles.buttons}>
        <button type="button" className={styles.buyBtn} onClick={kupiOdmah} disabled={!dostupno}>
          <Zap size={18} fill="currentColor" />
          {dostupno ? 'KUPI ODMAH' : 'RASPRODATO'}
        </button>
        {dostupno && (
          <button type="button" className={styles.cartBtn} onClick={uKorpu}>
            <ShoppingCart size={18} />
            Dodaj u korpu
          </button>
        )}
      </div>

      <p className={styles.note}>
        Plaćanje pouzećem · Dostava 1–3 radna dana · Bez avansa
      </p>

      <AnimatePresence>
        {trakaVidljiva && (
          <motion.div
            className={styles.stickyBar}
            initial={manjePokreta ? { opacity: 0 } : { y: 96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={manjePokreta ? { opacity: 0 } : { y: 96, opacity: 0 }}
            transition={
              manjePokreta
                ? { duration: 0.18 }
                : { type: 'spring', stiffness: 320, damping: 32 }
            }
          >
            <div className={styles.stickyInner}>
              <div className={styles.stickyPrices}>
                <span className={styles.stickyPrice}>{formatPrice(total)}</span>
                {compareAtPrice && compareAtPrice > basePrice && (
                  <span className={styles.stickyCompare}>{formatPrice(compareAtPrice * quantity)}</span>
                )}
              </div>
              <button type="button" className={styles.stickyBtn} onClick={kupiOdmah}>
                <Zap size={16} fill="currentColor" />
                KUPI ODMAH
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
