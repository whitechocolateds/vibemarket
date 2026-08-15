'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Wallet, ShieldCheck, Truck, PackageCheck, PackageOpen, CheckCircle2, Lock, ArrowLeft, Phone, Mail, Building2, Hash } from 'lucide-react';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/format';
import { OrderForm } from '@/lib/types';
import { FREE_SHIPPING_THRESHOLD, shippingCostFor } from '@/lib/shipping';
import { bundleUnitPrice } from '@/lib/bundlePricing';
import { isValidSerbianPhone } from '@/lib/phone';
import { trackPixel, newEventId } from '@/lib/metaEvents';
import Reveal from '@/components/motion/Reveal';
import BundlePicker from '@/components/BundlePicker';
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
  if (!form.phone.trim()) errors.phone = 'Telefon je obavezan';
  else if (!isValidSerbianPhone(form.phone)) errors.phone = 'Unesite ispravan broj telefona';
  if (form.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email nije ispravan';
  if (!form.address.trim()) errors.address = 'Adresa je obavezna';
  if (!form.city.trim()) errors.city = 'Grad je obavezan';
  if (!form.postalCode.trim()) errors.postalCode = 'Poštanski broj je obavezan';
  return errors;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalItems, clearCart, updateQuantity } = useCartStore();
  const [form, setForm] = useState<OrderForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  // Isti event id kroz ceo život stranice (Meta dedupe). useState sa lenjim
  // inicijalizatorom umesto ref-a - ref se ne sme čitati tokom rendera.
  const [eventId] = useState(newEventId);

  // Cene po stavci uključuju količinski popust (2 kom -10%, 3 kom -15%)
  const discountedItems = items.map((item) => ({
    ...item,
    unitPrice: bundleUnitPrice(item.price, item.quantity),
  }));
  const totalPrice = discountedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const totalSavings = discountedItems.reduce((sum, i) => sum + (i.price - i.unitPrice) * i.quantity, 0);
  const shippingCost = shippingCostFor(totalPrice);
  const grandTotal = totalPrice + shippingCost;

  useEffect(() => {
    if (totalItems === 0) return;
    trackPixel('InitiateCheckout', {
      content_ids: discountedItems.map((i) => i.productId),
      value: grandTotal,
      currency: 'RSD',
      num_items: totalItems,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        body: JSON.stringify({ items, customerInfo: form, totalPrice: grandTotal, eventId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      clearCart();
      const contentIds = discountedItems.map((i) => i.productId).join(',');
      router.push(
        `/orders/${data.orderId}?name=${encodeURIComponent(form.firstName)}&value=${grandTotal}&eventId=${eventId}&contentIds=${encodeURIComponent(contentIds)}`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greška pri slanju');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.checkoutHeader}>
          <Link href="/products" className={styles.backLink}>
            <ArrowLeft size={14} /> Nazad u prodavnicu
          </Link>
          <div className={styles.stepper}>
            <div className={`${styles.step} ${styles.stepDone}`}>
              <span className={styles.stepNum}><CheckCircle2 size={14} /></span>
              <span className={styles.stepText}>Korpa</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${styles.stepActive}`}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepText}>Podaci & Dostava</span>
            </div>
            <div className={styles.stepLine} />
            <div className={styles.step}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepText}>Potvrda</span>
            </div>
          </div>
        </div>

        <div className={styles.titleWrap}>
          <span className={styles.titleBadge}>
            <ShieldCheck size={13} /> 100% BEZBEDNA PORUDŽBINA
          </span>
          <h1 className={styles.title}>
            Sigurna <span className={styles.titleHighlight}>Kupovina</span>
          </h1>
          <div className={styles.subtitlePill}>
            <Lock size={14} className={styles.lockIcon} />
            <span>256-bit SSL Enkripcija · Plaćanje pouzećem pri preuzimanju paketa</span>
          </div>
        </div>

        <div className={styles.layout}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Reveal className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconWrap}><User size={18} /></div>
                <span>Lični Podaci</span>
              </h2>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">Ime *</label>
                  <div className={styles.inputFieldWrap}>
                    <User size={16} className={styles.fieldIcon} />
                    <input id="firstName" name="firstName" placeholder="npr. Marko" className={`${styles.customInput} ${errors.firstName ? styles.inputError : ''}`} value={form.firstName} onChange={handleChange} />
                  </div>
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Prezime *</label>
                  <div className={styles.inputFieldWrap}>
                    <User size={16} className={styles.fieldIcon} />
                    <input id="lastName" name="lastName" placeholder="npr. Marković" className={`${styles.customInput} ${errors.lastName ? styles.inputError : ''}`} value={form.lastName} onChange={handleChange} />
                  </div>
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Broj telefona (za kurira) *</label>
                  <div className={styles.inputFieldWrap}>
                    <Phone size={16} className={styles.fieldIcon} />
                    <input id="phone" name="phone" type="tel" placeholder="06X xxx xxxx" className={`${styles.customInput} ${errors.phone ? styles.inputError : ''}`} value={form.phone} onChange={handleChange} />
                  </div>
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email adresa (za potvrdu)</label>
                  <div className={styles.inputFieldWrap}>
                    <Mail size={16} className={styles.fieldIcon} />
                    <input id="email" name="email" type="email" placeholder="vas@email.com" className={`${styles.customInput} ${errors.email ? styles.inputError : ''}`} value={form.email} onChange={handleChange} />
                  </div>
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconWrap}><MapPin size={18} /></div>
                <span>Adresa Dostave</span>
              </h2>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label" htmlFor="address">Ulica i kućni broj *</label>
                <div className={styles.inputFieldWrap}>
                  <MapPin size={16} className={styles.fieldIcon} />
                  <input id="address" name="address" placeholder="npr. Bulevar oslobođenja 42, stan 12" className={`${styles.customInput} ${errors.address ? styles.inputError : ''}`} value={form.address} onChange={handleChange} />
                </div>
                {errors.address && <span className="form-error">{errors.address}</span>}
              </div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="city">Grad / Mesto *</label>
                  <div className={styles.inputFieldWrap}>
                    <Building2 size={16} className={styles.fieldIcon} />
                    <input id="city" name="city" placeholder="npr. Beograd" className={`${styles.customInput} ${errors.city ? styles.inputError : ''}`} value={form.city} onChange={handleChange} />
                  </div>
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="postalCode">Poštanski broj *</label>
                  <div className={styles.inputFieldWrap}>
                    <Hash size={16} className={styles.fieldIcon} />
                    <input id="postalCode" name="postalCode" placeholder="npr. 11000" className={`${styles.customInput} ${errors.postalCode ? styles.inputError : ''}`} value={form.postalCode} onChange={handleChange} />
                  </div>
                  {errors.postalCode && <span className="form-error">{errors.postalCode}</span>}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label" htmlFor="note">Napomena za kurira (opciono)</label>
                <textarea id="note" name="note" placeholder="npr. Pozvati pre dolaska, sprat 3..." className={styles.customTextarea} rows={2} value={form.note} onChange={handleChange} />
              </div>
            </Reveal>

            <Reveal delay={0.16} className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <div className={styles.sectionIconWrap}><Wallet size={18} /></div>
                <span>Način Plaćanja</span>
              </h2>
              <div className={styles.paymentCard}>
                <div className={styles.paymentBadge}>
                  <Truck size={18} />
                </div>
                <div className={styles.paymentInfo}>
                  <strong>Plaćanje Pouzećem (Gotovinom)</strong>
                  <p>Platite kuriru gotovinom pri preuzimanju paketa. Bez provizije i dodatnih troškova.</p>
                </div>
                <div className={styles.paymentCheck}>
                  <CheckCircle2 size={20} />
                </div>
              </div>
            </Reveal>

            <div className={styles.mobileSummary}>
              <div className={styles.summaryRow}><span>Proizvodi</span><span>{formatPrice(totalPrice)}</span></div>
              {totalSavings > 0 && (
                <div className={`${styles.summaryRow} ${styles.savingsRow}`}><span>Ušteda</span><span>−{formatPrice(totalSavings)}</span></div>
              )}
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
                  {submitting ? 'Šaljem porudžbinu...' : <>Potvrdi Porudžbinu · {formatPrice(grandTotal)} <ShieldCheck size={18} /></>}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </form>

          <aside className={styles.summary}>
            <Reveal delay={0.1} className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>
                <span>Pregled Porudžbine</span>
                <span className={styles.summaryItemCount}>{totalItems} {totalItems === 1 ? 'artikal' : 'artikla'}</span>
              </h3>
              <div className={styles.summaryItems}>
                {discountedItems.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.itemRow}>
                      <div className={styles.imgWrap}>
                        {item.image ? <img src={item.image.url} alt="" className={styles.summaryImg} /> : <div className={styles.summaryImg} />}
                        <span className={styles.qtyBadge}>{item.quantity}</span>
                      </div>
                      <div className={styles.itemInfo}>
                        <p>{item.title}</p>
                        {item.variantTitle && <p className={styles.itemVariant}>{item.variantTitle}</p>}
                      </div>
                      {/* Precrtana cena je izostavljena namerno - izbor paketa ispod
                          prikazuje i nju i uštedu, pa bi ovde bila duplirana. */}
                      <span className={styles.itemPrice}>
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                    <BundlePicker
                      basePrice={item.price}
                      compareAtPrice={item.compareAtPrice}
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.id, q)}
                      ariaLabel={`Izaberite količinu: ${item.title}`}
                      variant="compact"
                    />
                  </div>
                ))}
              </div>
              <div className={styles.divider} />
              <div className={styles.summaryRow}><span>Proizvodi</span><span>{formatPrice(totalPrice)}</span></div>
              {totalSavings > 0 && (
                <div className={`${styles.summaryRow} ${styles.savingsRow}`}><span>Ušteda popust</span><span>−{formatPrice(totalSavings)}</span></div>
              )}
              <div className={styles.summaryRow}>
                <span>Dostava kurirskom službom</span>
                <span className={shippingCost === 0 ? styles.free : ''}>{shippingCost === 0 ? 'Besplatna' : formatPrice(shippingCost)}</span>
              </div>
              {shippingCost > 0 && (
                <div className={styles.shippingBarWrap}>
                  <div className={styles.shippingBarLabel}>
                    <span>Dostava</span>
                    <span>Još {formatPrice(FREE_SHIPPING_THRESHOLD - totalPrice)} do besplatne dostave!</span>
                  </div>
                  <div className={styles.shippingBarTrack}>
                    <div
                      className={styles.shippingBarFill}
                      style={{ width: `${Math.min(100, Math.round((totalPrice / FREE_SHIPPING_THRESHOLD) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}><span>Ukupno za plaćanje</span><span>{formatPrice(grandTotal)}</span></div>
              <div className={styles.trust}>
                <span><ShieldCheck size={15} /> 100% Sigurna porudžbina</span>
                <span><Truck size={15} /> Dostava za 1-3 radna dana</span>
                <span><PackageCheck size={15} /> Garancija na ispravnost artikla</span>
              </div>
            </Reveal>
          </aside>
        </div>
      </div>
    </div>
  );
}
