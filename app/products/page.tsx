import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProductsClient from './ProductsClient';

export const metadata: Metadata = {
  title: 'Kolekcija',
  description: 'Pretražite celu VibeMarket kolekciju - pažljivo birani proizvodi, filtriranje po kategoriji i ceni, dostava 1-3 radna dana.',
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="page-loader"><div className="loader" /></div>}>
      <ProductsClient />
    </Suspense>
  );
}
