'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, ArrowRight, Truck, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import Logo from './Logo';
import styles from './Footer.module.css';

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <div className="container">
        <div className={styles.newsletterCard}>
          <div className={styles.newsletterInfo}>
            <span className={styles.newsletterBadge}>
              <Sparkles size={12} /> EKSKLUZIVNE PONUDE
            </span>
            <h3 className={styles.newsletterTitle}>Budite prvi koji saznaju</h3>
            <p className={styles.newsletterSub}>Saznajte prvi za nove popuste i specijalne akcije - bez spama.</p>
          </div>
          <form onSubmit={handleSubscribe} className={styles.newsletterForm}>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.newsletterInput}
                placeholder="Unesite vašu email adresu..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.subscribeBtn}>
              {subscribed ? 'Prijavljeni ste!' : <>Prijavi se <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <div className={styles.top}>
          <div className={styles.brand}>
            <Logo variant="onDark" size={34} tagline className={styles.logo} />
            <p className={styles.brandDesc}>
              VibeMarket je vaša pouzdana online prodavnica. Pažljivo odabrani premium artikli po najpovoljnijim cenama uz brzu dostavu na kućnu adresu.
            </p>
            <div className={styles.social}>
              <a href="#" aria-label="Instagram" className={styles.socialBtn}>
                <InstagramIcon />
              </a>
              <a href="#" aria-label="Facebook" className={styles.socialBtn}>
                <FacebookIcon />
              </a>
            </div>
          </div>

          <div className={styles.cols}>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Prodavnica</h4>
              <Link href="/products" className={styles.link}>Kolekcija</Link>
              <Link href="/products?tag=novo" className={styles.link}>Noviteti</Link>
              <Link href="/products?tag=bestseller" className={styles.link}>Bestselleri</Link>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Podrška</h4>
              <Link href="#" className={styles.link}>Uslovi kupovine</Link>
              <Link href="#" className={styles.link}>Povrat i reklamacije</Link>
              <Link href="#" className={styles.link}>Često postavljana pitanja</Link>
            </div>
            <div className={styles.col}>
              <h4 className={styles.colTitle}>Kontakt</h4>
              <a href="mailto:stupardavid3@gmail.com" className={styles.contactLink}>
                <div className={styles.contactIconWrap}>
                  <Mail size={13} />
                </div>
                <span>stupardavid3@gmail.com</span>
              </a>
              <a href="tel:+3816121446605" className={styles.contactLink}>
                <div className={styles.contactIconWrap}>
                  <Phone size={13} />
                </div>
                <span>+381 61 2144 6605</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <div className={styles.trustPills}>
            <span className={styles.trustPill}>
              <Truck size={13} /> Brza dostava 1-3 dana
            </span>
            <span className={styles.trustPill}>
              <ShieldCheck size={13} /> Plaćanje pouzećem
            </span>
            <span className={styles.trustPill}>
              <CheckCircle2 size={13} /> 100% Sigurna kupovina
            </span>
          </div>
          <p className={styles.copyright}>© {new Date().getFullYear()} VibeMarket. Sva prava zadržana.</p>
        </div>
      </div>
    </footer>
  );
}
