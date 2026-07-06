'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, ArrowRight } from 'lucide-react';
import Logo from './Logo';
import styles from './Footer.module.css';

function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M15 3h-2a5 5 0 0 0-5 5v2H6v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.newsletter}`}>
        <div>
          <h3>Budite prvi koji saznaju</h3>
          <p>Novi proizvodi i popusti - bez spama, otkažite kad poželite.</p>
        </div>
        <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
          <input
            type="email"
            className="input"
            placeholder="vasa@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">
            {subscribed ? 'Hvala!' : <>Prijavi se <ArrowRight size={15} /></>}
          </button>
        </form>
      </div>

      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <Logo variant="onDark" size={32} tagline className={styles.logo} />
          <p>Prodavnica sa stavom. Pažljivo odabrani proizvodi, brza dostava, plaćanje pouzećem.</p>
          <div className={styles.social}>
            <a href="#" aria-label="Instagram"><InstagramIcon /></a>
            <a href="#" aria-label="Facebook"><FacebookIcon /></a>
          </div>
        </div>
        <div className={styles.cols}>
          <div>
            <h4>Prodavnica</h4>
            <Link href="/products">Kolekcija</Link>
            <Link href="/products?tag=novo">Noviteti</Link>
            <Link href="/products?tag=bestseller">Bestselleri</Link>
          </div>
          <div>
            <h4>Podrška</h4>
            <Link href="#">Uslovi kupovine</Link>
            <Link href="#">Povrat</Link>
            <Link href="#">Kontakt</Link>
          </div>
          <div>
            <h4>Kontakt</h4>
            <a href="mailto:stupardavid3@gmail.com"><Mail size={13} /> stupardavid3@gmail.com</a>
            <a href="tel:+3816121446605"><Phone size={13} /> +381 61 2144 6605</a>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <div className="container">
          <p>© {new Date().getFullYear()} VibeMarket · Dostava 1–3 dana · Pouzeće</p>
        </div>
      </div>
    </footer>
  );
}
