'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PackageCheck, Truck, Home } from 'lucide-react';
import { trackPixel } from '@/lib/metaEvents';
import ConfettiBurst from '@/components/motion/ConfettiBurst';
import styles from './order.module.css';

export default function OrderConfirmClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const name = searchParams.get('name') ?? 'korisniče';
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const value = Number(searchParams.get('value') ?? 0);
    const eventId = searchParams.get('eventId') ?? undefined;
    const contentIds = (searchParams.get('contentIds') ?? '').split(',').filter(Boolean);
    trackPixel('Purchase', { value, currency: 'RSD', content_ids: contentIds }, eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    { icon: PackageCheck, label: 'Pakovanje', active: true },
    { icon: Truck, label: 'Kurir', active: false },
    { icon: Home, label: 'Dostava', active: false },
  ];

  return (
    <div className={styles.page}>
      <ConfettiBurst />
      <div className="container">
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.icon}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <motion.path
                d="M6 14.5L11.5 20L22 8"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              />
            </svg>
          </div>
          <h1 className={styles.title}>Hvala, {name}</h1>
          <p className={styles.subtitle}>Vaša porudžbina je primljena i biće obrađena u najkraćem roku.</p>

          <div className={styles.orderBox}>
            <p className={styles.orderLabel}>Broj porudžbine</p>
            <p className={styles.orderNum}>#{orderId}</p>
          </div>

          <div className={styles.delivery}>
            <h3>Praćenje dostave</h3>
            <div className={styles.steps}>
              {steps.map((s, i) => (
                <div key={i} className={`${styles.step} ${s.active ? styles.stepActive : ''}`}>
                  <span className={styles.stepIcon}><s.icon size={22} strokeWidth={1.5} /></span>
                  {s.label}
                </div>
              ))}
            </div>
            <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--color-success)' }}>
              Očekivano: 1-3 radna dana
            </p>
          </div>

          <div className={styles.next}>
            <h3>Šta sledi</h3>
            <ul>
              <li>Pozvaćemo vas radi potvrde</li>
              <li>Paket se priprema u roku od 24h</li>
              <li>Kurir dostavlja na vašu adresu</li>
              <li>Plaćate pouzećem pri preuzimanju</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <Link href="/products" className="btn btn-primary btn-lg">Nastavi kupovinu</Link>
            <Link href="/" className="btn btn-outline btn-lg">Početna</Link>
          </div>

          <p className={styles.support}>
            Pitanja? <a href="mailto:podrska@vibemarket.rs">podrska@vibemarket.rs</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
