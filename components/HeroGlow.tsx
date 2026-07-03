'use client';

import { useEffect, useRef } from 'react';
import styles from '../app/page.module.css';

export default function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = ref.current?.closest('section');
    if (!section) return;

    const handleMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      section.style.setProperty('--spot-x', `${x}%`);
      section.style.setProperty('--spot-y', `${y}%`);
    };

    section.addEventListener('mousemove', handleMove);
    return () => section.removeEventListener('mousemove', handleMove);
  }, []);

  return <div ref={ref} className={styles.spotGlow} />;
}
