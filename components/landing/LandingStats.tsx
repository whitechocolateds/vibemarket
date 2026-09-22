'use client';

import { useEffect, useRef, useState } from 'react';
import { parseStatValue, type LandingStat } from '@/lib/landing';
import styles from './LandingPage.module.css';

const TRAJANJE = 1400;

/**
 * Brojke se odbrojavaju od nule kad sekcija udje u vidno polje, a traka ispod
 * broja se puni istovremeno.
 *
 * Brojevi NIKAD ne dolaze od AI-ja - upisuje ih covek u admin panelu (vidi
 * lib/gemini.ts). Ovde je samo prikaz.
 *
 * Vrednost bez broja ("1-3 dana", "Pouzecem") se ne odbrojava nego se ispise
 * kakva jeste; traka tada odmah stoji puna.
 */
/**
 * `className` postoji zato sto varijanta konverzije ovu mrezu smesta u svoju
 * traku, koja vec ima okvir i podlogu - podrazumevani omotac bi tu udvostrucio
 * ivicu. Logika odbrojavanja se NE duplira.
 */
export default function LandingStats({ stats, className }: { stats: LandingStat[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  /*
   * Pocinje na 1, tj. na KONACNOJ vrednosti - ne na nuli.
   *
   * Server iscrtava ovu komponentu, pa bi sa nulom u HTML-u pisalo "0+
   * zadovoljnih kupaca" svakom kome JavaScript zakaze ili sporo stigne, i
   * pretrazivacima. Na nulu se skace tek kad odbrojavanje stvarno krene.
   */
  const [napredak, setNapredak] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Ko je trazio manje pokreta ostaje na gotovom stanju, bez animacije.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let osigurac = 0;
    const posmatrac = new IntersectionObserver(
      ([unos]) => {
        if (!unos.isIntersecting) return;
        posmatrac.disconnect();

        setNapredak(0);
        const pocetak = performance.now();
        const korak = (sada: number) => {
          const t = Math.min(1, (sada - pocetak) / TRAJANJE);
          // easeOutCubic: brzo krene, mekano stane
          setNapredak(1 - Math.pow(1 - t, 3));
          if (t < 1) raf = requestAnimationFrame(korak);
        };
        raf = requestAnimationFrame(korak);

        /*
         * Osigurac: requestAnimationFrame staje kad kartica ode u pozadinu, a
         * izmereno je da tada odbrojavanje ostane zamrznuto na pola - "94+"
         * umesto "500+". Pogresan broj na kartici sa tvrdnjom je gore nego
         * nikakva animacija, pa se posle isteka vremena vrednost dovodi do kraja.
         */
        osigurac = window.setTimeout(() => {
          cancelAnimationFrame(raf);
          setNapredak(1);
        }, TRAJANJE + 1500);
      },
      { threshold: 0.35 }
    );

    posmatrac.observe(el);
    return () => {
      posmatrac.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(osigurac);
    };
  }, []);

  return (
    <div className={className ?? styles.stats} ref={ref}>
      {stats.map((s, i) => {
        const { broj, prefiks, sufiks } = parseStatValue(s.value);
        const decimale = broj !== null && !Number.isInteger(broj) ? 1 : 0;
        const tekuci = broj === null
          ? s.value
          : `${prefiks}${(broj * napredak).toLocaleString('sr-RS', {
              minimumFractionDigits: decimale,
              maximumFractionDigits: decimale,
            })}${sufiks}`;

        return (
          <div key={i}>
            {/* Citacu ekrana se cita konacna vrednost, ne medjukorak odbrojavanja. */}
            <div className={styles.statValue} aria-label={s.value}>
              <span aria-hidden="true">{tekuci}</span>
            </div>
            <div className={styles.statBar} aria-hidden="true">
              <span className={styles.statBarFill} style={{ transform: `scaleX(${napredak})` }} />
            </div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}
