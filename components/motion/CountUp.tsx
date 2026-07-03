'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface Props {
  to: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}

function easeOutQuint(t: number) {
  return 1 - Math.pow(1 - t, 5);
}

export default function CountUp({ to, suffix = '', prefix = '', className, decimals = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const duration = 1500;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(to * easeOutQuint(progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}{suffix}
    </span>
  );
}
