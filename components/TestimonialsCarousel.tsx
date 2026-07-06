'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import TestimonialCard from './TestimonialCard';
import styles from '../app/page.module.css';

interface Testimonial {
  quote: string;
  name: string;
  city: string;
  time: string;
  likes: number;
}

const INITIAL = 4;

export default function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, INITIAL);

  return (
    <div className={styles.fbFeed}>
      <div className={styles.fbGrid}>
        {visible.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
          >
            <TestimonialCard {...t} />
          </motion.div>
        ))}
      </div>

      {items.length > INITIAL && !expanded && (
        <button type="button" className={styles.fbMore} onClick={() => setExpanded(true)}>
          Prikaži još {items.length - INITIAL} recenzija
        </button>
      )}
    </div>
  );
}
