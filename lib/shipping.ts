export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_COST = 350;

/* Ispod ove količine prikazujemo "još samo X kom" na kartici i detalju proizvoda */
export const LOW_STOCK_THRESHOLD = 10;

export function shippingCostFor(totalPrice: number): number {
  return totalPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
}
