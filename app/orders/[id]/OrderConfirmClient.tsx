'use client';

import { useEffect, useRef, useState } from 'react';
import { KONTAKT } from '@/lib/legalContent';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { PackageCheck, Truck, Home, CheckCircle2, ShoppingBag, Sparkles, Phone, Mail, Copy, Check, Clock, ShieldCheck } from 'lucide-react';
import { trackPixel } from '@/lib/metaEvents';
import ConfettiBurst from '@/components/motion/ConfettiBurst';
import styles from './order.module.css';

export default function OrderConfirmClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const name = searchParams.get('name') ?? 'kupče';
  const firedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    const value = Number(searchParams.get('value') ?? 0);
    const eventId = searchParams.get('eventId') ?? undefined;
    const contentIds = (searchParams.get('contentIds') ?? '').split(',').filter(Boolean);
    trackPixel('Purchase', { value, currency: 'RSD', content_ids: contentIds }, eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    { icon: PackageCheck, title: 'Pakovanje i Priprema', desc: 'U toku', active: true },
    { icon: Truck, title: 'Preuzimanje Kurira', desc: 'Uskoro', active: false },
    { icon: Home, title: 'Dostava na Vrata', desc: '1-3 radna dana', active: false },
  ];

  return (
    <div className={styles.page}>
      <ConfettiBurst />
      <div className="container">
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={styles.successBadgeWrap}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={44} strokeWidth={2.2} />
            </div>
          </div>

          <span className={styles.celebrationTag}>
            <Sparkles size={13} /> PORUDŽBINA USPEŠNO POTVRĐENA
          </span>

          <h1 className={styles.title}>Hvala na poverenju, {name}!</h1>
          <p className={styles.subtitle}>
            Vaša porudžbina je primljena i naš tim priprema paket za slanje.
          </p>

          <div className={styles.orderBox}>
            <div className={styles.orderBoxLeft}>
              <span className={styles.orderLabel}>Broj porudžbine</span>
              <p className={styles.orderNum}>#{orderId}</p>
            </div>
            <button type="button" onClick={handleCopyOrder} className={styles.copyBtn}>
              {copied ? <><Check size={14} /> Kopirano</> : <><Copy size={14} /> Kopiraj broj</>}
            </button>
          </div>

          {/*
            Dugmad idu ODMAH ispod potvrde, pre informativnih sekcija.
            Ranije su bile na dnu, ispod pracenja dostave i sledecih koraka - kupac
            je morao da skroluje da bi nastavio kupovinu.
          */}
          <div className={styles.actions}>
            <Link href="/products" className={`btn btn-primary btn-lg ${styles.primaryBtn}`}>
              <ShoppingBag size={18} /> Nastavi kupovinu
            </Link>
            <Link href="/" className={`btn btn-outline btn-lg ${styles.secondaryBtn}`}>
              Vrati se na početnu
            </Link>
          </div>

          <div className={styles.deliveryCard}>
            <h3 className={styles.sectionTitle}>
              <Clock size={16} /> Status Praćenja Dostave
            </h3>
            <div className={styles.steps}>
              {steps.map((s, i) => (
                <div key={i} className={`${styles.step} ${s.active ? styles.stepActive : ''}`}>
                  <div className={styles.stepIconWrap}>
                    <s.icon size={20} strokeWidth={2} />
                  </div>
                  <span className={styles.stepTitle}>{s.title}</span>
                  <span className={styles.stepDesc}>{s.desc}</span>
                </div>
              ))}
            </div>
            <div className={styles.estimateBadge}>
              <Truck size={15} />
              <span>Očekivana isporuka: <strong>1 - 3 radna dana</strong> (Plaćanje gotovinom kuriru pri preuzimanju)</span>
            </div>
          </div>

          <div className={styles.nextCard}>
            <h3 className={styles.sectionTitle}>
              <ShieldCheck size={16} /> Šta sledi u narednim koracima?
            </h3>
            <ul className={styles.checklist}>
              <li>
                <div className={styles.checkIcon}><CheckCircle2 size={16} /></div>
                <div>
                  <strong>Telefonska ili SMS potvrda:</strong> Naša služba će vas pozvati ukoliko bude potrebna dodatna provera adrese.
                </div>
              </li>
              <li>
                <div className={styles.checkIcon}><CheckCircle2 size={16} /></div>
                <div>
                  <strong>Brzo pakovanje:</strong> Proizvod se pažljivo pakuje i šalje kurirskom službom u roku od 24h.
                </div>
              </li>
              <li>
                <div className={styles.checkIcon}><CheckCircle2 size={16} /></div>
                <div>
                  <strong>Plaćanje pouzećem:</strong> Nema rizika ni avansnog plaćanja — platite kuriru gotovinom tek kad preuzmete paket.
                </div>
              </li>
            </ul>
          </div>

          <div className={styles.support}>
            <span>Imate pitanje u vezi porudžbine?</span>
            <div className={styles.supportLinks}>
              <a href={`mailto:${KONTAKT.email}`}><Mail size={13} /> {KONTAKT.email}</a>
              <a href={`tel:${KONTAKT.telefonHref}`}><Phone size={13} /> {KONTAKT.telefon}</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
