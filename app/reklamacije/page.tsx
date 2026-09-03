import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { REKLAMACIJE } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Reklamacije i povraćaj robe',
  description: 'Pravo na odustanak u roku od 14 dana i postupak reklamacije zbog nesaobraznosti robe u VibeMarket prodavnici.',
};

export default function Stranica() {
  return <LegalPage stranica={REKLAMACIJE} />;
}
