import type { Metadata } from 'next';
import './globals.css';
import StoreChrome from '@/components/StoreChrome';
import MetaPixel from '@/components/MetaPixel';

export const metadata: Metadata = {
  title: {
    default: 'VibeMarket - Prodavnica sa stavom',
    template: '%s · VibeMarket',
  },
  description: 'Pažljivo odabrani proizvodi. Dostava 1-3 radna dana širom Srbije. Plaćanje pouzećem.',
  keywords: ['online kupovina', 'prodavnica', 'pouzeće', 'srbija', 'dostava'],
  openGraph: {
    title: 'VibeMarket - Online prodavnica',
    description: 'Brza dostava i plaćanje pouzećem. Dostava 1-3 radna dana.',
    type: 'website',
    locale: 'sr_RS',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" data-scroll-behavior="smooth">
      <body>
        <MetaPixel />
        <StoreChrome>{children}</StoreChrome>
      </body>
    </html>
  );
}
