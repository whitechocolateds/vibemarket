'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import styles from '../app/page.module.css';

interface Props {
  quote: string;
  name: string;
  city: string;
}

export default function TestimonialCard({ quote, name, city }: Props) {
  return (
    <motion.div
      className={styles.testimonialCard}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Quote size={26} className={styles.testimonialQuoteIcon} />
      <div className={styles.stars}>
        {Array.from({ length: 5 }).map((_, j) => (
          <Star key={j} size={13} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className={styles.testimonialQuote}>{quote}</p>
      <div className={styles.testimonialFooter}>
        <span className={styles.testimonialAvatar}>{name.charAt(0)}</span>
        <p className={styles.testimonialName}>{name} <span>· {city}</span></p>
      </div>
    </motion.div>
  );
}
