'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { bundleUnitPrice } from '@/lib/bundlePricing';
import BundlePicker from '@/components/BundlePicker';
import styles from './LandingPage.module.css';

/**
 * Deo za kupovinu na dnu landing stranice.
 *
 * Koristi isti obracun paketa i istu korpu kao standardna stranica - cena se
 * ne racuna ovde, nego u bundlePricing, da se dva mesta ne raziđu.
 */
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

  return (
    <>
      <div className={styles.priceRow}>
        <span className={styles.price}>{formatPrice(total)}</span>
        {compareAtPrice && compareAtPrice > basePrice && (
          <span className={styles.compare}>{formatPrice(compareAtPrice * quantity)}</span>
        )}
        {savings !== null && <span className={styles.save}>−{savings}%</span>}
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
    </>
  );
}
