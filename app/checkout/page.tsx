'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Wallet, ShieldCheck, Truck, PackageCheck, PackageOpen } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { OrderForm } from '@/lib/types';
import { FREE_SHIPPING_THRESHOLD, shippingCostFor } from '@/lib/shipping';
import Reveal from '@/components/motion/Reveal';
import styles from './page.module.css';

const INITIAL_FORM: OrderForm = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', postalCode: '', note: '',
  paymentMethod: 'pouzeće',
};

type FormErrors = Partial<Record<keyof OrderForm, string>>;

function validateForm(form: OrderForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.firstName.trim()) errors.firstName = 'Ime je obavezno';
  if (!form.lastName.trim()) errors.lastName = 'Prezime je obavezno';
  if (!form.email.trim()) errors.email = 'Email je obavezan';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email nije ispravan';
  if (!form.phone.trim()) errors.phone = 'Telefon je obavezan';
  if (!form.address.trim()) errors.address = 'Adresa je obavezna';
  if (!form.city.trim()) errors.city = 'Grad je obavezan';
  if (!form.postalCode.trim()) errors.postalCode = 'Poštanski broj je obavezan';
  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();
  const [form, setForm] = useState<OrderForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const shippingCost = shippingCostFor(totalPrice);
  const grandTotal = totalPrice + shippingCost;

  if (totalItems === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon-badge">
              <PackageOpen size={32} strokeWidth={1.5} />
            </div>
            <h3>Korpa je prazna</h3>
            <p>Dodajte artikle pre naručivanja</p>
            <Link href="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Kolekcija</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof OrderForm]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customerInfo: form, totalPrice: grandTotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      router.push(`/orders/${data.orderId}?name=${encodeURIComponent(form.firstName)}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greška pri slanju');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/products" className={styles.back}>← Nazad</Link>
        <h1 className={styles.title}>Plaćanje</h1>
        <p className={styles.subtitle}>Dostava za 1–3 radna dana · Plaćanje pouzećem</p>

        <div className={styles.layout}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Reveal className={styles.section}>
              <h2 className={styles.sectionTitle}><User size={18} /> Podaci</h2>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">Ime</label>
                  <input id="firstName" name="firstName" className={`input ${errors.firstName ? 'error' : ''}`} value={form.firstName} onChange={handleChange} />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Prezime</label>
                  <input id="lastName" name="lastName" className={`input ${errors.lastName ? 'error' : ''}`} value={form.lastName} onChange={handleChange} />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" className={`input ${errors.email ? 'error' : ''}`} value={form.email} onChange={handleChange} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Telefon</label>
                  <input id="phone" name="phone" type="tel" className={`input ${errors.phone ? 'error' : ''}`} value={form.phone} onChange={handleChange} />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08} className={styles.section}>
              <h2 className={styles.sectionTitle}><MapPin size={18} /> Adresa</h2>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="address">Ulica i broj</label>
                <input id="address" name="address" className={`input ${errors.address ? 'error' : ''}`} value={form.address} onChange={handleChange} />
                {errors.address && <span className="form-error">{errors.address}</span>}
              </div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="city">Grad</label>
                  <input id="city" name="city" className={`input ${errors.city ? 'error' : ''}`} value={form.city} onChange={handleChange} />
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="postalCode">Poštanski broj</label>
                  <input id="postalCode" name="postalCode" className={`input ${errors.postalCode ? 'error' : ''}`} value={form.postalCode} onChange={handleChange} />
                  {errors.postalCode && <span className="form-error">{errors.postalCode}</span>}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="note">Napomena</label>
                <textarea id="note" name="note" className="textarea" rows={2} value={form.note} onChange={handleChange} />
              </div>
            </Reveal>

            <Reveal delay={0.16} className={styles.section}>
              <h2 className={styles.sectionTitle}><Wallet size={18} /> Plaćanje</h2>
              <div className={styles.payment}>
                <strong>Plaćanje pouzećem</strong>
                <p>Platite kuriru gotovinom pri preuzimanju paketa.</p>
              </div>
            </Reveal>

            <div className={styles.mobileSummary}>
              <div className={styles.summaryRow}><span>Proizvodi</span><span>{formatPrice(totalPrice)}</span></div>
              <div className={styles.summaryRow}><span>Dostava</span><span>{shippingCost === 0 ? 'Besplatna' : formatPrice(shippingCost)}</span></div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}><span>Ukupno</span><span>{formatPrice(grandTotal)}</span></div>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              className={`btn btn-primary btn-full ${styles.submitBtn}`}
              disabled={submitting}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={submitting ? 'sending' : 'idle'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {submitting ? 'Slanje...' : `Potvrdi · ${formatPrice(grandTotal)}`}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </form>

          <aside className={styles.summary}>
            <Reveal delay={0.1} className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Pregled</h3>
              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.imgWrap}>
                      {item.image ? <img src={item.image.url} alt="" className={styles.summaryImg} /> : <div className={styles.summaryImg} />}
                      <span className={styles.qtyBadge}>{item.quantity}</span>
                    </div>
                    <div className={styles.itemInfo}>
                      <p>{item.title}</p>
                      {item.variantTitle && <p className={styles.itemVariant}>{item.variantTitle}</p>}
                    </div>
                    <span className={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.divider} />
              <div className={styles.summaryRow}><span>Proizvodi</span><span>{formatPrice(totalPrice)}</span></div>
              <div className={styles.summaryRow}>
                <span>Dostava</span>
                <span className={shippingCost === 0 ? styles.free : ''}>{shippingCost === 0 ? 'Besplatna' : formatPrice(shippingCost)}</span>
              </div>
              {shippingCost > 0 && <p className={styles.hint}>Još {formatPrice(FREE_SHIPPING_THRESHOLD - totalPrice)} do besplatne dostave</p>}
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}><span>Ukupno</span><span>{formatPrice(grandTotal)}</span></div>
              <div className={styles.trust}>
                <span><ShieldCheck size={14} /> Sigurna porudžbina</span>
                <span><Truck size={14} /> Dostava 1–3 dana</span>
                <span><PackageCheck size={14} /> Plaćanje pouzećem</span>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </div>
  );
}
