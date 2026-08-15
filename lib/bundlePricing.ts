/** Količinski popust: 1 kom bez popusta, 2 kom -10%, 3+ kom -15%. */
export const BUNDLE_TIERS = [
  { quantity: 1, discountPercent: 0 },
  { quantity: 2, discountPercent: 10 },
  { quantity: 3, discountPercent: 15 },
] as const;

export function bundleDiscountPercent(quantity: number): number {
  if (quantity >= 3) return 15;
  if (quantity === 2) return 10;
  return 0;
}

export function bundleMultiplier(quantity: number): number {
  return 1 - bundleDiscountPercent(quantity) / 100;
}

export function bundleUnitPrice(basePrice: number, quantity: number): number {
  return Math.round(basePrice * bundleMultiplier(quantity));
}

/** Oznake na paketima. Drži ih na jednom mestu da proizvod i checkout prikazuju isto. */
export const BUNDLE_BADGES: Record<number, string> = {
  2: 'Najpopularnije',
  3: 'Najveća ušteda',
};

export interface BundleTierPricing {
  quantity: number;
  discountPercent: number;
  unitPrice: number;
  total: number;
  /** Precrtana cena; null znači da nema šta da se precrta. */
  strikeTotal: number | null;
  /** Uvek >= 0; nula znači da se red "Uštedi" ne prikazuje. */
  savings: number;
}

/**
 * Ušteda se meri od STARE cene kad ona postoji, inače od redovne.
 * Jedno pravilo pokriva oba slučaja, pa prikaz nema grananja - samo gleda
 * `savings > 0` i `strikeTotal !== null`.
 *
 * Provera `compareAtPrice > basePrice` je nosiva: formu validira ProductForm,
 * ali uvoz sa konkurentskog linka i stavke iz localStorage korpe ne prolaze kroz
 * nju. Bez provere bi loš podatak dao negativnu uštedu i precrtanu cenu NIŽU od
 * stvarne.
 *
 * Zaokruživanje ide PO KOMADU (unitPrice * quantity), isto kao sažetak porudžbine
 * u app/checkout/page.tsx. Računanje preko `Math.round(base * qty * mult)` bi
 * napravilo razliku od par dinara između izbora paketa i naplaćenog iznosa.
 */
export function bundleTierPricing(
  basePrice: number,
  quantity: number,
  compareAtPrice?: number | null
): BundleTierPricing {
  const unitPrice = bundleUnitPrice(basePrice, quantity);
  const total = unitPrice * quantity;

  const hasCompare = typeof compareAtPrice === 'number' && compareAtPrice > basePrice;
  const reference = (hasCompare ? compareAtPrice : basePrice) * quantity;

  const savings = Math.max(0, reference - total);

  return {
    quantity,
    discountPercent: bundleDiscountPercent(quantity),
    unitPrice,
    total,
    strikeTotal: savings > 0 ? reference : null,
    savings,
  };
}

export function bundleTierPricings(
  basePrice: number,
  compareAtPrice?: number | null
): BundleTierPricing[] {
  return BUNDLE_TIERS.map((tier) => bundleTierPricing(basePrice, tier.quantity, compareAtPrice));
}
