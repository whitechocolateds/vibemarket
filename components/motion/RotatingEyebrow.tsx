'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Star, Truck, Wallet, type LucideIcon } from 'lucide-react';

interface Item {
  icon: LucideIcon;
  text: string;
}

const ITEMS: Item[] = [
  { icon: Sparkles, text: 'Novo ove nedelje' },
  { icon: Star, text: '4.9/5 od 2.400+ kupaca' },
  { icon: Truck, text: 'Dostava za 1-3 dana' },
  { icon: Wallet, text: 'Platite tek kad stigne' },
];

export default function RotatingEyebrow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % ITEMS.length), 2800);
    return () => clearInterval(id);
  }, []);

  const current = ITEMS[index];

  return (
    <span className="eyebrow-pill">
      <span style={{ position: 'relative', width: 14, height: 14, display: 'inline-flex' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.35 }}
            style={{ position: 'absolute', inset: 0, display: 'flex' }}
          >
            <current.icon size={14} />
          </motion.span>
        </AnimatePresence>
      </span>
      <span style={{ position: 'relative', display: 'inline-grid' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            style={{ gridArea: '1 / 1' }}
          >
            {current.text}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
