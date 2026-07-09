'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, BadgeCheck } from 'lucide-react';
import { Product } from '@/lib/types';
import styles from './SocialProof.module.css';

const BUYERS = [
  { name: 'Milica R.', city: 'Beograda', verb: 'poručila' },
  { name: 'Nikola T.', city: 'Novog Sada', verb: 'poručio' },
  { name: 'Jovana M.', city: 'Niša', verb: 'poručila' },
  { name: 'Stefan P.', city: 'Kragujevca', verb: 'poručio' },
  { name: 'Ana V.', city: 'Subotice', verb: 'poručila' },
  { name: 'Marko D.', city: 'Novog Pazara', verb: 'poručio' },
  { name: 'Teodora S.', city: 'Zrenjanina', verb: 'poručila' },
  { name: 'Luka J.', city: 'Čačka', verb: 'poručio' },
  { name: 'Ivana K.', city: 'Pančeva', verb: 'poručila' },
  { name: 'Vladimir B.', city: 'Kraljeva', verb: 'poručio' },
];

const FIRST_DELAY = 8000;
const VISIBLE_FOR = 6000;
const GAP_MIN = 16000;
const GAP_JITTER = 14000;

interface Toast {
  buyer: (typeof BUYERS)[number];
  product: Product;
  minsAgo: number;
}

export default function SocialProof() {
  const pathname = usePathname();
  const [toast, setToast] = useState<Toast | null>(null);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem('vm-social-proof-off')) return;
    let alive = true;
    const timers: number[] = [];
    const schedule = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    (async () => {
      let products: Product[] = [];
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        products = (json.data ?? []).filter((p: Product) => p.featuredImage && p.availableForSale);
      } catch {
        return;
      }
      if (!alive || products.length === 0) return;

      const showNext = (delay: number) => {
        schedule(() => {
          if (!alive || dismissedRef.current) return;
          setToast({ buyer: pick(BUYERS), product: pick(products), minsAgo: 2 + Math.floor(Math.random() * 27) });
          schedule(() => {
            if (!alive) return;
            setToast(null);
            showNext(GAP_MIN + Math.random() * GAP_JITTER);
          }, VISIBLE_FOR);
        }, delay);
      };
      showNext(FIRST_DELAY);
    })();

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, []);

  const dismiss = () => {
    dismissedRef.current = true;
    sessionStorage.setItem('vm-social-proof-off', '1');
    setToast(null);
  };

  // Ne ometamo kupca na checkout-u niti admina
  if (pathname.startsWith('/checkout') || pathname.startsWith('/admin')) return null;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          role="status"
        >
          <Link href={`/products/${toast.product.handle}`} className={styles.body} onClick={() => setToast(null)}>
            <img src={toast.product.featuredImage!.url} alt="" className={styles.img} />
            <span className={styles.text}>
              <span className={styles.who}>
                {toast.buyer.name} iz {toast.buyer.city}
              </span>{' '}
              je upravo {toast.buyer.verb}
              <span className={styles.productName}>{toast.product.title}</span>
              <span className={styles.meta}>
                <BadgeCheck size={12} /> Verifikovana kupovina · pre {toast.minsAgo} min
              </span>
            </span>
          </Link>
          <button type="button" className={styles.close} onClick={dismiss} aria-label="Zatvori obaveštenje">
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
