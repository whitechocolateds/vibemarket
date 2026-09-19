import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // NAPOMENA: namerno BEZ images.localPatterns. Podrazumevano su sve lokalne putanje
    // dozvoljene, pa /uploads/** radi samo tako. Čim se localPatterns navede, sve što nije
    // nabrojano prestaje da važi - a to obara /logo-icon.png i ostale asete iz /public.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plastikaonline.rs',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      {
        // Slike proizvoda uvezenih sa Shopify-ja. Drzi usklađeno sa lib/imageHost.ts.
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
