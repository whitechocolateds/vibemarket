'use client';

import { useState } from 'react';
import { ThumbsUp, Star } from 'lucide-react';
import styles from '../app/page.module.css';

interface Props {
  quote: string;
  name: string;
  city: string;
  time: string;
  likes: number;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #2E6FE6, #0F3E9A)',
  'linear-gradient(135deg, #F5A524, #C6890A)',
  'linear-gradient(135deg, #E0457B, #A81E57)',
  'linear-gradient(135deg, #16A085, #0E6B58)',
  'linear-gradient(135deg, #7C4DE0, #4B2A93)',
  'linear-gradient(135deg, #2E9BE6, #0F5C9A)',
];

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

function FbBadge() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2" aria-label="Facebook recenzija">
      <path d="M24 12c0-6.63-5.37-12-12-12S0 5.37 0 12c0 5.99 4.39 10.95 10.13 11.85v-8.38H7.08V12h3.05V9.36c0-3.01 1.79-4.68 4.53-4.68 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87V12h3.33l-.53 3.47h-2.8v8.38C19.61 22.95 24 17.99 24 12z" />
    </svg>
  );
}

export default function TestimonialCard({ quote, name, city, time, likes }: Props) {
  const [liked, setLiked] = useState(false);
  const count = likes + (liked ? 1 : 0);

  return (
    <div className={styles.fbCard}>
      <div className={styles.fbHead}>
        <span className={styles.fbAvatar} style={{ background: colorFor(name) }}>
          {initials(name)}
        </span>
        <div className={styles.fbMeta}>
          <span className={styles.fbName}>{name}</span>
          <span className={styles.fbSub}>{city} · {time}</span>
        </div>
        <FbBadge />
      </div>

      <div className={styles.fbBubble}>
        <div className={styles.fbStars}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        <p className={styles.fbText}>{quote}</p>
      </div>

      <div className={styles.fbActions}>
        <button
          type="button"
          className={`${styles.fbBtn} ${liked ? styles.fbBtnLiked : ''}`}
          onClick={() => setLiked((v) => !v)}
        >
          <ThumbsUp size={14} strokeWidth={2} fill={liked ? 'currentColor' : 'none'} />
          Sviđa mi se
        </button>
        <button type="button" className={styles.fbBtn}>Odgovori</button>
        <span className={styles.fbReactCount}>
          <span className={styles.fbThumbChip}><ThumbsUp size={9} strokeWidth={0} fill="#fff" /></span>
          {count}
        </span>
      </div>
    </div>
  );
}
