'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { trackPixel } from '@/lib/metaEvents';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function PixelRouteTracker() {
  const pathname = usePathname();
  const firstRun = useRef(true);

  useEffect(() => {
    // Prvi PageView već šalje inicijalni fbq('init') + fbq('track','PageView') iz skripte ispod
    if (firstRun.current) { firstRun.current = false; return; }
    trackPixel('PageView');
  }, [pathname]);

  return null;
}

/*
 * Admin panel se NE meri.
 *
 * Komponenta stoji u korenom layout-u, pa je pixel do sada radio i na
 * /admin stranicama - sopstvene posete vlasnika ulazile su u statistiku
 * kampanja. Provera je ovde, a ne u layout-u, da bi ostala uz pixel.
 *
 * Posledica: posle povratka sa /admin na prodavnicu, prvi PageView se
 * preskace (tracker se iznova montira). Kupci ne prolaze kroz admin, pa to
 * ne utice na merenje reklama.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  if (!PIXEL_ID || pathname?.startsWith('/admin')) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta pixel noscript fallback, mora biti obican <img> */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <PixelRouteTracker />
    </>
  );
}
