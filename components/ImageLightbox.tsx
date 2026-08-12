'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ImageLightbox.module.css';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

export interface LightboxImage {
  url: string;
  altText?: string | null;
}

interface Props {
  images: LightboxImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export default function ImageLightbox({ images, index, onIndexChange, onClose }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  // Zasebno stanje jer se čita u renderu (isključuje CSS prelaz dok traje gest)
  const [pinching, setPinching] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  // Aktivni pokazivači - dva istovremeno znače pinch
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  /**
   * Nova slika kreće od nule. Podešavanje tokom rendera umesto u efektu -
   * efekat bi napravio suvišan prolaz kroz render sa starim zumom.
   */
  const [renderedIndex, setRenderedIndex] = useState(index);
  if (renderedIndex !== index) {
    setRenderedIndex(index);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  // Pozadina ne sme da skroluje dok je lightbox otvoren
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [images.length, index, onIndexChange]
  );

  const zoomBy = useCallback((factor: number) => {
    setScale((s) => {
      const next = clamp(s * factor, MIN_SCALE, MAX_SCALE);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === '+' || e.key === '=') zoomBy(1.4);
      else if (e.key === '-' || e.key === '_') zoomBy(1 / 1.4);
      else if (e.key === '0') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose, reset, zoomBy]);

  // Wheel mora non-passive da bi preventDefault zaustavio skrol stranice
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomBy]);

  const distanceBetweenPointers = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      pinchStart.current = { dist: distanceBetweenPointers(), scale };
      dragStart.current = null;
      setDragging(false);
      setPinching(true);
    } else if (scale > 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      setDragging(true);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const ratio = distanceBetweenPointers() / pinchStart.current.dist;
      setScale(clamp(pinchStart.current.scale * ratio, MIN_SCALE, MAX_SCALE));
      return;
    }

    if (dragStart.current) {
      setOffset({
        x: dragStart.current.ox + (e.clientX - dragStart.current.x),
        y: dragStart.current.oy + (e.clientY - dragStart.current.y),
      });
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      pinchStart.current = null;
      setPinching(false);
    }
    if (pointers.current.size === 0) {
      dragStart.current = null;
      setDragging(false);
      if (scale <= 1) setOffset({ x: 0, y: 0 });
    }
  };

  const current = images[index];
  if (!current) return null;

  const cursorClass = scale > 1 ? (dragging ? styles.grabbing : styles.grabbable) : styles.zoomable;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Pregled slike"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.bar}>
        {images.length > 1 && (
          <span className={styles.counter}>{index + 1} / {images.length}</span>
        )}
        <span className={styles.spacer} />

        <button type="button" className={styles.barBtn} onClick={() => zoomBy(1 / 1.4)}
          disabled={scale <= MIN_SCALE} title="Umanji (−)" aria-label="Umanji">
          <ZoomOut size={17} />
        </button>
        <span className={styles.zoomLevel}>{Math.round(scale * 100)}%</span>
        <button type="button" className={styles.barBtn} onClick={() => zoomBy(1.4)}
          disabled={scale >= MAX_SCALE} title="Uvećaj (+)" aria-label="Uvećaj">
          <ZoomIn size={17} />
        </button>
        <button type="button" className={styles.barBtn} onClick={reset}
          disabled={scale === 1 && offset.x === 0 && offset.y === 0} title="Cela slika (0)" aria-label="Prikaži celu sliku">
          <Maximize2 size={16} />
        </button>
        <button type="button" className={styles.barBtn} onClick={onClose} title="Zatvori (Esc)" aria-label="Zatvori">
          <X size={17} />
        </button>
      </div>

      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(DOUBLE_TAP_SCALE))}
      >
        {images.length > 1 && (
          <>
            <button type="button" className={`${styles.nav} ${styles.navPrev}`}
              onClick={() => go(-1)} aria-label="Prethodna slika">
              <ChevronLeft size={22} />
            </button>
            <button type="button" className={`${styles.nav} ${styles.navNext}`}
              onClick={() => go(1)} aria-label="Sledeća slika">
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element -- proizvoljan URL van remotePatterns liste */}
        <img
          src={current.url}
          alt={current.altText ?? ''}
          className={`${styles.image} ${cursorClass}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragging || pinching ? 'none' : 'transform 0.18s ease-out',
          }}
          draggable={false}
        />
      </div>

      {images.length > 1 && (
        <div className={styles.filmstrip}>
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.filmThumb} ${i === index ? styles.filmThumbActive : ''}`}
              onClick={() => onIndexChange(i)}
              aria-label={`Slika ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- proizvoljan URL van remotePatterns liste */}
              <img src={img.url} alt="" />
            </button>
          ))}
        </div>
      )}

      <p className={styles.hint}>
        Točkić miša ili dvoklik za zum · prevlačenje pomera · strelice menjaju sliku · Esc zatvara
      </p>
    </div>
  );
}
