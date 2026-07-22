'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, ChevronDown } from 'lucide-react';
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
      <div className={styles.reviewsSummaryBanner}>
        <div className={styles.reviewsScoreBlock}>
          <span className={styles.reviewsScoreNum}>4.9</span>
          <div className={styles.reviewsScoreMetaWrap}>
            <div className={styles.reviewsStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={15} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span className={styles.reviewsScoreLabel}>Prosečna ocena od 120+ kupaca</span>
          </div>
        </div>

        <div className={styles.reviewsRecommendBlock}>
          <span className={styles.reviewsRecommendPercent}>99.4%</span>
          <span className={styles.reviewsRecommendText}>kupaca preporučuje VibeMarket</span>
        </div>

        <div className={styles.reviewsVerifiedPill}>
          <ShieldCheck size={15} className={styles.reviewsShieldIcon} />
          <span>100% Proverene Recenzije</span>
        </div>
      </div>

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
        <button type="button" className={styles.fbMoreBtn} onClick={() => setExpanded(true)}>
          <span>Prikaži još {items.length - INITIAL} recenzija</span>
          <ChevronDown size={14} />
        </button>
      )}
    </div>
  );
}
