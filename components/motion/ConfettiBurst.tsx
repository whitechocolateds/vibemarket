'use client';

import { motion } from 'framer-motion';
import { useHydrated } from '@/lib/useHydrated';

const COLORS = ['#F0B00C', '#FFC838', '#1652BE', '#2E6FE6', '#C6890A'];
const COUNT = 28;

/* Deterministički pseudo-random - čist (bez Math.random u renderu), a vizuelno raspršen */
function prand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

interface Piece {
  left: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  size: number;
}

const PIECES: Piece[] = Array.from({ length: COUNT }, (_, i) => {
  const r = (n: number) => prand(i * 7.13 + n);
  return {
    left: r(1) * 100,
    color: COLORS[Math.floor(r(2) * COLORS.length)],
    delay: r(3) * 0.5,
    duration: 2.4 + r(4) * 1.4,
    drift: (r(5) - 0.5) * 120,
    spin: 360 + r(6) * 540,
    size: 7 + r(7) * 5,
  };
});

export default function ConfettiBurst() {
  const hydrated = useHydrated();
  if (!hydrated) return null;

  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
      {PIECES.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -24, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: p.drift, rotate: p.spin, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.4, 0.55, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.5,
            borderRadius: 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
