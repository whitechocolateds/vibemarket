'use client';

import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCartStore } from '@/lib/cart';
import styles from './LandingConversion.module.css';

/**
 * Dugme "naruci odmah" koje se na varijanti 'konverzija' ponavlja tri puta.
 *
 * Uzima JEDAN komad po osnovnoj ceni i vodi na checkout. Izbor paketa namerno
 * nije ovde - on stoji u zavrsnom bloku; kupac koji zna sta hoce ne treba da
 * bira kolicinu da bi krenuo, a ko hoce vise komada spusti se do dna.
 */
export default function LandingCta({ product, label }: { product: Product; label: string }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const closeCart = useCartStore((s) => s.closeCart);

  const variant = product.variants[0];
  const dostupno = product.availableForSale && (variant?.availableForSale ?? false);

  const kupi = () => {
    if (!variant) return;
    addItem({
      id: variant.id,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      variantTitle: variant.title !== 'Default' ? variant.title : '',
      price: Number(product.priceRange.minVariantPrice.amount),
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice.amount) : undefined,
      image: product.featuredImage,
    });
    closeCart();
    router.push('/checkout');
  };

  return (
    <button type="button" className={styles.ctaBtn} onClick={kupi} disabled={!dostupno}>
      <Zap size={18} fill="currentColor" />
      {dostupno ? label : 'RASPRODATO'}
    </button>
  );
}
