'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './LandingPage.module.css';

/**
 * Pojavljuje sadrzaj kad dodje u vidno polje (bledo + blagi pomak odozdo).
 *
 * POCINJE VIDLJIVO, kao i LandingStats. Da pocinje skriveno, svako kome
 * JavaScript zakaze ili je ugasen dobio bi praznu stranicu - a to je gore od
 * stranice bez animacije.
 *
 * Sadrzaj koji je PRI UCITAVANJU vec u vidnom polju se ne skriva uopste: tako
 * nema treptaja na prvom kadru, a animaciju ionako niko ne bi video jer se
 * zavrsava pre nego sto korisnik stigne da pogleda.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vidljivo, setVidljivo] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ko je trazio manje pokreta ostaje na gotovom stanju, bez animacije.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const { top } = el.getBoundingClientRect();
    if (top < window.innerHeight) return;

    setVidljivo(false);
    const posmatrac = new IntersectionObserver(
      ([unos]) => {
        if (!unos.isIntersecting) return;
        posmatrac.disconnect();
        setVidljivo(true);
      },
      { threshold: 0.2 }
    );

    posmatrac.observe(el);
    return () => posmatrac.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${className}`.trim()}
      data-vidljivo={vidljivo}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
