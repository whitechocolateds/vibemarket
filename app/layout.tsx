import type { Metadata } from 'next';
import './globals.css';
import StoreChrome from '@/components/StoreChrome';

export const metadata: Metadata = {
  title: {
    default: 'VibeMarket — Online Prodavnica',
    template: '%s | VibeMarket',
  },
  description: 'Pronađite proizvode koji vam trebaju uz brzu dostavu i plaćanje pouzećem. Dostava 1-3 radna dana širom Srbije.',
  keywords: ['online kupovina', 'prodavnica', 'pouzeće', 'srbija', 'dostava'],
  openGraph: {
    title: 'VibeMarket — Online Prodavnica',
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
    <html lang="sr">
      <body>
        <StoreChrome>{children}</StoreChrome>
      </body>
    </html>
  );
}
