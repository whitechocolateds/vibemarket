import { Product } from './types';

export function formatPrice(amount: string | number, currencyCode = 'RSD'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (currencyCode === 'RSD') {
    return `${num.toLocaleString('sr-RS')} RSD`;
  }
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: currencyCode,
  }).format(num);
}

export function getProductPrice(product: Product): { price: number; compareAtPrice: number | null } {
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
