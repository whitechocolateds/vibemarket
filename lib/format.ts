import { Product } from './types';

export function formatPrice(amount: string | number, currencyCode = 'RSD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (currencyCode === 'RSD') {
    /*
     * Nerazdvojna razmaknica ( ), ne obicna.
     *
     * Sa obicnom je izmereno da se "1.799 RSD" na 390px lomi na dve linije -
     * "1.799" gore, "RSD" dole - jer pretrazivac tu razmaknicu vidi kao mesto
     * gde sme da prelomi. Popravka je ovde, u izvoru, a ne u CSS-u svake
     * sekcije: isti string se prikazuje na 14 mesta (korpa, checkout, kartice,
     * landing), pa bi inace svako od njih moralo da pamti white-space: nowrap.
     */
    return `${num.toLocaleString('sr-RS')} RSD`;
  }
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: currencyCode,
  }).format(num);
}

/**
 * Trazi samo ona dva polja koja i cita, ne ceo `Product`.
 *
 * Tako radi i nad punim proizvodom i nad lakim oblikom iz liste
 * (`ProductListItem`), bez ijedne kopije funkcije.
 */
export function getProductPrice(
  product: Pick<Product, 'variants' | 'priceRange'>
): { price: number; compareAtPrice: number | null } {
  const variant = product.variants[0];
  if (!variant) {
    return {
      price: parseFloat(product.priceRange.minVariantPrice.amount),
      compareAtPrice: null,
    };
  }
  return {
    price: parseFloat(variant.price.amount),
    compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
  };
}
