import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import OrderConfirmClient from './OrderConfirmClient';

export const metadata: Metadata = {
  title: 'Porudžbina potvrđena',
  description: 'Vaša porudžbina je uspešno primljena.',
};

export default function OrderConfirmPage() {
  return (
    <Suspense fallback={<div className="page-loader"><div className="loader" /></div>}>
      <OrderConfirmClient />
    </Suspense>
  );
}
