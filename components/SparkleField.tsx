'use client';

import { motion } from 'framer-motion';
import { Sparkle } from 'lucide-react';
import styles from '../app/page.module.css';

const SPARKLES = [
  { top: '2%', left: '48%', size: 16, delay: 0 },
  { top: '38%', left: '-2%', size: 12, delay: 1.1 },
  { top: '78%', left: '92%', size: 14, delay: 2.1 },
  { top: '12%', left: '96%', size: 10, delay: 0.6 },
];

export default function SparkleField() {
  return (
    <>
      {SPARKLES.map((s, i) => (
        <motion.span
          key={i}
          className={styles.sparkle}
          style={{ top: s.top, left: s.left }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 25, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        >
          <Sparkle size={s.size} fill="currentColor" strokeWidth={0} />
        </motion.span>
      ))}
    </>
  );
}
