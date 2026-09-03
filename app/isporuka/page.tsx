import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';
import { ISPORUKA } from '@/lib/legalContent';

export const metadata: Metadata = {
  title: 'Isporuka i dostava',
  description: 'Rokovi isporuke, troškovi dostave i način preuzimanja pošiljke u VibeMarket prodavnici. Dostava 1-3 radna dana, plaćanje pouzećem.',
};

export default function Stranica() {
  return <LegalPage stranica={ISPORUKA} />;
}
