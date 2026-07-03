'use client';

import { motion, type Variants } from 'framer-motion';

interface Props {
  text: string;
  className?: string;
  emphasize?: string;
  delay?: number;
}

const container: Variants = {
  hidden: {},
  visible: (delay: number) => ({
    transition: { staggerChildren: 0.09, delayChildren: delay },
  }),
};

const word: Variants = {
  hidden: { opacity: 0, y: '100%', rotate: 3 },
  visible: {
    opacity: 1,
    y: '0%',
    rotate: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function KineticHeading({ text, className, emphasize, delay = 0 }: Props) {
  const words = text.split(' ');
  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      custom={delay}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            overflow: 'hidden',
            verticalAlign: 'top',
            marginRight: '0.28em',
            paddingBottom: '0.22em',
            marginBottom: '-0.22em',
            paddingTop: '0.06em',
            marginTop: '-0.06em',
          }}
        >
          <motion.span
            style={{ display: 'inline-block' }}
            variants={word}
            data-emphasis={emphasize && w.replace(/[,.]/g, '') === emphasize ? 'true' : undefined}
          >
            {w === emphasize ? <em>{w}</em> : w}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}
