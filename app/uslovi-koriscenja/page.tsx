import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { USLOVI } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Uslovi korišćenja',
  description: 'Uslovi korišćenja internet prodavnice VibeMarket - dozvoljeno korišćenje, privatnost, cene, odgovornost i rešavanje sporova.',
};

export default function Stranica() {
  return <LegalPage stranica={USLOVI} />;
}
