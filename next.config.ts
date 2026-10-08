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

  /**
   * Preusmerenja sa starih adresa proizvoda.
   *
   * Handle je adresa stranice. Kad se promeni, svaki vec podeljen link i svaka
   * reklama koja pokazuje na staru adresu padaju na 404 - a to se ne vidi dok
   * neko ne prijavi. Zato se stara adresa ovde zadrzava.
   *
   * `permanent: true` salje 308: pretrazivaci prenose rangiranje na novu
   * adresu i prestaju da traze staru.
   */
  async redirects() {
    return [
      {
        // Proizvod je greskom bio zaveden kao poklon vaucer; zapravo je
        // Snap-On Smile navlaka za zube.
        source: '/products/vibemarket-digitalni-poklon-vaucer',
        destination: '/products/snap-on-smile-navlaka-za-zube',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
