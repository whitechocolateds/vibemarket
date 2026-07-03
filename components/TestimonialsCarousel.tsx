'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TestimonialCard from './TestimonialCard';
import styles from '../app/page.module.css';

interface Testimonial {
  quote: string;
  name: string;
  city: string;
}

const VISIBLE = 3;
const ROTATE_MS = 5500;

export default function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const [start, setStart] = useState(0);
  const visibleCount = Math.min(VISIBLE, items.length);

  useEffect(() => {
    if (items.length <= visibleCount) return;
    const id = setInterval(() => setStart((s) => (s + visibleCount) % items.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [items.length, visibleCount]);

  const visible = Array.from({ length: visibleCount }, (_, i) => items[(start + i) % items.length]);

  return (
    <div className={styles.testimonialViewport}>
      <AnimatePresence mode="wait">
        <motion.div
          key={start}
          className={styles.testimonialGrid}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {visible.map((t) => (
            <TestimonialCard key={t.name} quote={t.quote} name={t.name} city={t.city} />
          ))}
        </motion.div>
      </AnimatePresence>

      {items.length > visibleCount && (
        <div className={styles.testimonialDots}>
          {Array.from({ length: Math.ceil(items.length / visibleCount) }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Prikaži grupu recenzija ${i + 1}`}
              className={`${styles.dot} ${Math.floor(start / visibleCount) === i ? styles.dotActive : ''}`}
              onClick={() => setStart(i * visibleCount)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
