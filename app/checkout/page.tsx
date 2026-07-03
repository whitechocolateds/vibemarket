'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/shopify';
import { OrderForm } from '@/lib/types';
import styles from './page.module.css';

const INITIAL_FORM: OrderForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  note: '',
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
  else if (!/^[\d\s\+\-\(\)]{6,15}$/.test(form.phone)) errors.phone = 'Telefon nije ispravan';
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

  const shippingCost = totalPrice > 5000 ? 0 : 350;
  const grandTotal = totalPrice + shippingCost;

  if (totalItems === 0) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <h3>Vaša korpa je prazna</h3>
            <p>Dodajte proizvode u korpu pre naručivanja</p>
            <Link href="/products" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Istraži proizvode
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof OrderForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

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
      alert(err instanceof Error ? err.message : 'Greška pri slanju porudžbine');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.pageHeader}>
          <Link href="/products" className={styles.backLink}>
            ← Nazad na kupovinu
          </Link>
          <h1 className={styles.pageTitle}>Naruči</h1>
          <p className={styles.pageSubtitle}>Dostavićemo vašu porudžbinu za 1-3 radna dana</p>
        </div>

        <div className={styles.layout}>
          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form} id="checkout-form">
            {/* Personal Info */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.stepNum}>1</span>
                Lični podaci
              </h2>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">Ime *</label>
                  <input
                    id="firstName" name="firstName" type="text"
                    className={`input ${errors.firstName ? 'error' : ''}`}
                    placeholder="Vaše ime"
                    value={form.firstName} onChange={handleChange}
                  />
                  {errors.firstName && <span className="form-error">{errors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">Prezime *</label>
                  <input
                    id="lastName" name="lastName" type="text"
                    className={`input ${errors.lastName ? 'error' : ''}`}
                    placeholder="Vaše prezime"
                    value={form.lastName} onChange={handleChange}
                  />
                  {errors.lastName && <span className="form-error">{errors.lastName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email *</label>
                  <input
                    id="email" name="email" type="email"
                    className={`input ${errors.email ? 'error' : ''}`}
                    placeholder="vasa@email.com"
                    value={form.email} onChange={handleChange}
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Telefon *</label>
                  <input
                    id="phone" name="phone" type="tel"
                    className={`input ${errors.phone ? 'error' : ''}`}
                    placeholder="+381 60 123 4567"
                    value={form.phone} onChange={handleChange}
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.stepNum}>2</span>
                Adresa dostave
              </h2>
              <div className={styles.formGridFull}>
                <div className="form-group">
                  <label className="form-label" htmlFor="address">Ulica i broj *</label>
                  <input
                    id="address" name="address" type="text"
                    className={`input ${errors.address ? 'error' : ''}`}
                    placeholder="Ulica Ilije Garašanina 1"
                    value={form.address} onChange={handleChange}
                  />
                  {errors.address && <span className="form-error">{errors.address}</span>}
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className="form-group">
                  <label className="form-label" htmlFor="city">Grad *</label>
                  <input
                    id="city" name="city" type="text"
                    className={`input ${errors.city ? 'error' : ''}`}
                    placeholder="Beograd"
                    value={form.city} onChange={handleChange}
                  />
                  {errors.city && <span className="form-error">{errors.city}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="postalCode">Poštanski broj *</label>
                  <input
                    id="postalCode" name="postalCode" type="text"
                    className={`input ${errors.postalCode ? 'error' : ''}`}
                    placeholder="11000"
                    value={form.postalCode} onChange={handleChange}
                  />
                  {errors.postalCode && <span className="form-error">{errors.postalCode}</span>}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="note">Napomena (opciono)</label>
                <textarea
                  id="note" name="note"
                  className="textarea"
                  placeholder="Posebne napomene za dostavu..."
                  value={form.note} onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            {/* Payment */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.stepNum}>3</span>
                Način plaćanja
              </h2>
              <div className={styles.paymentOption}>
                <div className={styles.paymentCheck}>✓</div>
                <div className={styles.paymentInfo}>
                  <strong>💳 Plaćanje pouzećem</strong>
                  <p>Platite kuriru gotovinom pri preuzimanju paketa.</p>
                </div>
              </div>
            </div>

            {/* Mobile Order Summary */}
            <div className={styles.mobileSummary}>
              <div className={styles.summaryRow}>
                <span>Proizvodi ({totalItems})</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Dostava</span>
                <span>{shippingCost === 0 ? '🎉 Besplatna' : formatPrice(shippingCost)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Ukupno:</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full ${styles.submitBtn}`}
              disabled={submitting}
              id="submit-order-btn"
            >
              {submitting ? (
                <><div className="loader" style={{ width: 18, height: 18 }} /> Slanje...</>
              ) : (
                `Potvrdi porudžbinu · ${formatPrice(grandTotal)}`
              )}
            </button>
          </form>

          {/* Order Summary Sidebar */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Pregled porudžbine</h3>

              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <div className={styles.summaryItemImg}>
                      {item.image ? (
                        <Image
                          src={item.image.url}
                          alt={item.title}
                          fill
                          sizes="56px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : <span>🛍️</span>}
                      <span className={styles.itemQtyBadge}>{item.quantity}</span>
                    </div>
                    <div className={styles.summaryItemInfo}>
                      <p>{item.title}</p>
                      {item.variantTitle && <p className={styles.itemVariant}>{item.variantTitle}</p>}
                    </div>
                    <p className={styles.summaryItemPrice}>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className={styles.divider} />

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>Proizvodi</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Dostava</span>
                  <span className={shippingCost === 0 ? styles.free : ''}>
                    {shippingCost === 0 ? '🎉 Besplatna' : formatPrice(shippingCost)}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className={styles.freeShippingHint}>
                    Dodajte još {formatPrice(5000 - totalPrice)} za besplatnu dostavu
                  </p>
                )}
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <strong>Ukupno:</strong>
                  <strong>{formatPrice(grandTotal)}</strong>
                </div>
              </div>

              <div className={styles.trustBadges}>
                <p>🔒 Sigurna porudžbina</p>
                <p>🚀 Dostava 1-3 radna dana</p>
                <p>💳 Plaćanje pouzećem</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
