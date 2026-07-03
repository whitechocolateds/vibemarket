import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="VibeMarket" width={32} height={32} className={styles.logoImg} />
            <span className={styles.logoText}>Vibe<span>Market</span></span>
          </Link>
          <p className={styles.tagline}>
            Vaša pouzdana online prodavnica. Brza dostava širom Srbije i plaćanje pouzećem.
          </p>
          <div className={styles.badges}>
            <span className={styles.badge}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Sigurno
            </span>
            <span className={styles.badge}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              Pouzeće
            </span>
            <span className={styles.badge}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
              1–3 dana
            </span>
          </div>
        </div>

        <div className={styles.links}>
          <div className={styles.linkCol}>
            <h4>Prodavnica</h4>
            <Link href="/products">Svi proizvodi</Link>
            <Link href="/products?tag=novo">Novo</Link>
            <Link href="/products?tag=bestseller">Bestselleri</Link>
          </div>
          <div className={styles.linkCol}>
            <h4>Informacije</h4>
            <Link href="#">Uslovi kupovine</Link>
            <Link href="#">Povrat robe</Link>
            <Link href="#">Privatnost</Link>
            <Link href="#">Kontakt</Link>
          </div>
          <div className={styles.linkCol}>
            <h4>Kontakt</h4>
            <a href="mailto:podrska@vibemarket.rs">podrska@vibemarket.rs</a>
            <a href="tel:+381601234567">+381 60 123 4567</a>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <p>© {new Date().getFullYear()} VibeMarket · Sva prava zadržana</p>
          <div className={styles.bottomRight}>
            <Link href="#">Uslovi</Link>
            <Link href="#">Privatnost</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
