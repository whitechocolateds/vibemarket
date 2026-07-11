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
