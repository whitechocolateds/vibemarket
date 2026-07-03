'use client';

import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import styles from './order.module.css';

export default function OrderConfirmClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const name = searchParams.get('name') ?? 'korisniče';

  const steps = [
    { icon: '📦', label: 'Paket se pakuje', active: true },
    { icon: '🚛', label: 'Preuzeto od kurira', active: false },
    { icon: '🏠', label: 'Dostavljeno', active: false },
  ];

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.card}>
          {/* Success icon */}
          <div className={styles.successIcon}>
            <div className={styles.checkCircle}>
              <svg width="40" height="40" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles.successRing} />
          </div>

          <h1 className={styles.title}>Hvala, {name}! 🎉</h1>
          <p className={styles.subtitle}>Vaša porudžbina je uspešno primljena i biće obrađena uskoro.</p>

          {/* Order number */}
          <div className={styles.orderInfo}>
            <div className={styles.orderNumberBox}>
              <span className={styles.orderLabel}>Broj porudžbine</span>
              <strong className={styles.orderNumber} id="order-number">#{orderId}</strong>
            </div>
          </div>

          {/* Delivery info */}
          <div className={styles.deliveryCard}>
            <div className={styles.deliveryHeader}>
              <span>🚀</span>
              <div>
                <p className={styles.deliveryTitle}>Očekivano vreme dostave</p>
                <p className={styles.deliveryTime}>1-3 radna dana</p>
              </div>
            </div>
            <div className={styles.deliverySteps}>
              {steps.map((step, i) => (
                <div key={i} className={styles.stepWrapper}>
                  <div className={`${styles.step} ${step.active ? styles.stepActive : ''}`}>
                    <span className={styles.stepIcon}>{step.icon}</span>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`${styles.stepLine} ${step.active ? styles.stepLineActive : ''}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* What's next */}
          <div className={styles.nextSteps}>
            <h3>Šta sledi?</h3>
            <ul className={styles.nextList}>
              <li>
                <span className={styles.nextIcon}>📱</span>
                <span>Pozvaćemo vas radi potvrde porudžbine</span>
              </li>
              <li>
                <span className={styles.nextIcon}>📦</span>
                <span>Paket će biti spreman za slanje u roku od 24h</span>
              </li>
              <li>
                <span className={styles.nextIcon}>🚛</span>
                <span>Kurir će dostaviti paket na vašu adresu</span>
              </li>
              <li>
                <span className={styles.nextIcon}>💳</span>
                <span>Plaćanje kuriru pri preuzimanju (pouzeće)</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/products" className="btn btn-primary btn-lg" id="continue-shopping-btn">
              Nastavi kupovinu
            </Link>
            <Link href="/" className="btn btn-secondary btn-lg" id="go-home-btn">
              Početna stranica
            </Link>
          </div>

          {/* Support */}
          <p className={styles.support}>
            Imate pitanje? Kontaktirajte nas na{' '}
            <a href="mailto:podrska@vibemarket.rs" className={styles.supportLink}>
              podrska@vibemarket.rs
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
