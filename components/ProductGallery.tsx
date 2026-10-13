'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import ImageLightbox from '@/components/ImageLightbox';
import type { ProductImage } from '@/lib/types';
import { listanjeRadi, sledeciIndeks, trajanjeZaSliku } from '@/lib/galerija';
import styles from './ProductGallery.module.css';

/**
 * Galerija proizvoda: velika slika, slicice ispod, uvecan prikaz na klik.
 *
 * Samostalna je i vazi za SVE proizvode sa vise slika - nema podesavanja po
 * proizvodu. Stranica ubacuje samo ono sto stoji preko slike (`badges`,
 * `actions`), da galerija ne mora da zna za popuste, poklone ni omiljene.
 */

interface Props {
  images: ProductImage[];
  title: string;
  /** Stoji preko slike, gore levo (popust, poklon). */
  badges?: React.ReactNode;
  /** Stoji preko slike, gore desno (omiljeno, deljenje). */
  actions?: React.ReactNode;
}

export default function ProductGallery({ images, title, badges, actions }: Props) {
  const [izabrana, setIzabrana] = useState(0);
  const [uvecano, setUvecano] = useState(false);
  const manjePokreta = useReducedMotion();

  /*
   * Ram se prilagodjava odnosu stranica PRVE slike i tu ostaje.
   * Ranije se racunao iz svake ucitane slike, pa je galerija sa slikama raznih
   * odnosa menjala visinu rama na svaku promenu - sa automatskim listanjem to
   * bi znacilo da se stranica pomera na svakih nekoliko sekundi.
   */
  const [odnosRama, setOdnosRama] = useState<number | null>(null);
  const odnosPostavljen = useRef(false);
  const postaviOdnos = (el: HTMLImageElement) => {
    if (odnosPostavljen.current) return;
    const { naturalWidth: w, naturalHeight: h } = el;
    if (!w || !h) return;
    odnosPostavljen.current = true;
    // od 3:4 (uspravno) do 4:3 (polozeno)
    setOdnosRama(Math.min(4 / 3, Math.max(3 / 4, w / h)));
  };

  /*
   * Rucni izbor trajno gasi automatsko listanje.
   *
   * Namerno se NE vraca posle mirovanja: kupac koji je sam otvorio odredjenu
   * sliku gleda bas nju, a slika koja mu posle deset sekundi odleti ispod pogleda
   * smeta vise nego sto listanje pomaze. Listanje postoji da pokaze da slika ima
   * jos - cim je kupac to primetio i uzeo stvar u svoje ruke, odradilo je svoje.
   */
  const [rucno, setRucno] = useState(false);
  const [mis, setMis] = useState(false);
  const [sakriveno, setSakriveno] = useState(false);

  const vise = images.length > 1;
  const listaRadi = listanjeRadi({
    brojSlika: images.length,
    rucnoIzabrano: rucno,
    misIznad: mis,
    karticaSakrivena: sakriveno,
    manjePokreta: Boolean(manjePokreta),
    uvecanPrikaz: uvecano,
  });

  // Kartica u pozadini: bez ovoga bi se po povratku preskocilo vise slika odjednom.
  useEffect(() => {
    const osvezi = () => setSakriveno(document.hidden);
    osvezi();
    document.addEventListener('visibilitychange', osvezi);
    return () => document.removeEventListener('visibilitychange', osvezi);
  }, []);

  // Samo listanje.
  useEffect(() => {
    if (!listaRadi) return;
    const trajanje = trajanjeZaSliku(images[izabrana]?.url ?? '');
    const id = setTimeout(() => setIzabrana((i) => sledeciIndeks(i, images.length)), trajanje);
    return () => clearTimeout(id);
  }, [listaRadi, izabrana, images]);

  /*
   * Sledeca slika se ucitava unapred.
   * Bez toga prva promena ka slici koja jos nije u kesu pokaze prazan ram dok
   * stigne - prelaz zbog toga blesne.
   */
  useEffect(() => {
    if (!vise) return;
    const sledeca = images[sledeciIndeks(izabrana, images.length)];
    if (!sledeca) return;
    const im = new Image();
    im.src = sledeca.url;
  }, [izabrana, images, vise]);

  /*
   * Aktivna slicica se uvek dovlaci u vidno polje trake.
   *
   * Pomera se iskljucivo traka, ne i stranica - zato ne `scrollIntoView`, koji
   * ume da povuce i ceo dokument.
   *
   * Racuna se iz `getBoundingClientRect`, a NE iz `offsetLeft`: `offsetLeft` je
   * u odnosu na najblizeg pozicioniranog pretka, a to ovde nije traka (slicica
   * je `position: relative`, traka nije pozicionirana). Izmereno sa offsetLeft:
   * `scrollLeft` je ostajao na 0 i cetvrta slicica nikad nije ulazila u kadar.
   */
  const trakaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const traka = trakaRef.current;
    const dugme = traka?.children[izabrana] as HTMLElement | undefined;
    if (!traka || !dugme) return;
    const t = traka.getBoundingClientRect();
    const d = dugme.getBoundingClientRect();
    const zazor = 12;
    const ponasanje: ScrollBehavior = manjePokreta ? 'auto' : 'smooth';
    if (d.left < t.left) traka.scrollBy({ left: d.left - t.left - zazor, behavior: ponasanje });
    else if (d.right > t.right) traka.scrollBy({ left: d.right - t.right + zazor, behavior: ponasanje });
  }, [izabrana, manjePokreta]);

  const izaberiRucno = (i: number) => {
    setRucno(true);
    setIzabrana(i);
  };

  const otvoriUvecano = () => {
    if (!images[izabrana]) return;
    setRucno(true);
    setUvecano(true);
  };

  const slika = images[izabrana];

  return (
    <div className={styles.gallery}>
      {uvecano && images.length > 0 && (
        <ImageLightbox
          images={images}
          index={izabrana}
          onIndexChange={setIzabrana}
          onClose={() => setUvecano(false)}
        />
      )}

      <div
        className={styles.mainImage}
        style={odnosRama ? { aspectRatio: String(odnosRama) } : undefined}
        role="button"
        tabIndex={0}
        aria-label="Otvori sliku preko celog ekrana"
        onClick={otvoriUvecano}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            otvoriUvecano();
          }
        }}
        onMouseEnter={() => setMis(true)}
        onMouseLeave={() => setMis(false)}
        // Prevlacenje prstom je takodje rucni izbor - dalje listanje bi smetalo.
        onTouchStart={() => setRucno(true)}
      >
        {/*
          `mode="sync"` umesto `wait`: stara i nova slika se preklapaju, pa je
          prelaz pravi crossfade. Sa `wait` se prvo ugasi stara pa tek onda pali
          nova, i na trenutak se vidi prazan ram.
        */}
        <AnimatePresence mode="sync" initial={false}>
          {slika ? (
            <motion.div
              key={slika.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: manjePokreta ? 0 : 0.35 }}
              className={styles.mainImgWrap}
            >
              {/* Zamućena kopija popunjava ram - inače bi oko slike stajale prazne trake */}
              <span
                className={styles.mainImgBackdrop}
                style={{ backgroundImage: `url(${JSON.stringify(slika.url)})` }}
                aria-hidden="true"
              />
              <img
                src={slika.url}
                alt={slika.altText ?? title}
                className={styles.mainImg}
                onLoad={(e) => postaviOdnos(e.currentTarget)}
                // Kad je slika već u kešu, onLoad ne opali - ref hvata taj slučaj
                ref={(el) => { if (el?.complete) postaviOdnos(el); }}
              />
            </motion.div>
          ) : (
            <div className={styles.noImage}>◇</div>
          )}
        </AnimatePresence>

        <span className={styles.zoomHint}>
          <Maximize2 size={13} /> Klikni za uvećanje
        </span>
        {badges}
        {actions && <div className={styles.galleryActions}>{actions}</div>}
      </div>

      {vise && (
        <div className={styles.thumbnails} ref={trakaRef}>
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              className={`${styles.thumb} ${izabrana === i ? styles.thumbActive : ''}`}
              onClick={() => izaberiRucno(i)}
              aria-label={`Prikaži sliku ${i + 1}`}
              aria-current={izabrana === i ? 'true' : undefined}
            >
              <img src={img.url} alt="" className={styles.thumbImg} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
