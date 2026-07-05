'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Banknote, ImageIcon, Tags } from 'lucide-react';
import { Product, ProductInput } from '@/lib/types';
import { slugify } from '@/lib/slugify';
import styles from '@/app/admin/admin.module.css';

interface Props {
  initial?: Product;
  onSubmit: (data: ProductInput) => Promise<void>;
  submitLabel: string;
}

const EMPTY: ProductInput = {
  title: '',
  description: '',
  price: 0,
  compareAtPrice: null,
  imageUrl: '',
  imageUrls: [],
  tags: [],
  vendor: 'VibeMarket',
  productType: 'Ostalo',
  quantity: 10,
  availableForSale: true,
};

function productToInput(p: Product): ProductInput {
  const v = p.variants[0];
  return {
    title: p.title,
    handle: p.handle,
    description: p.description,
    descriptionHtml: p.descriptionHtml,
    price: v ? parseFloat(v.price.amount) : 0,
    compareAtPrice: v?.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : null,
    imageUrl: p.featuredImage?.url ?? '',
    imageUrls: p.images.slice(1).map((i) => i.url),
    tags: p.tags,
    vendor: p.vendor,
    productType: p.productType,
    quantity: v?.quantityAvailable ?? 0,
    availableForSale: p.availableForSale,
  };
}

export default function ProductForm({ initial, onSubmit, submitLabel }: Props) {
  const [form, setForm] = useState<ProductInput>(initial ? productToInput(initial) : EMPTY);
  const [tagsStr, setTagsStr] = useState(initial?.tags.join(', ') ?? '');
  const [extraImages, setExtraImages] = useState(
    initial ? initial.images.slice(1).map((i) => i.url).join('\n') : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'price' || name === 'compareAtPrice' || name === 'quantity') {
      setForm((prev) => ({ ...prev, [name]: value === '' ? 0 : Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const effectiveSlug = form.handle?.trim() || slugify(form.title);

  const discount = useMemo(() => {
    if (!form.compareAtPrice || !form.price || form.compareAtPrice <= form.price) return null;
    return Math.round((1 - form.price / form.compareAtPrice) * 100);
  }, [form.price, form.compareAtPrice]);

  const previewUrls = useMemo(() => {
    const extras = extraImages.split('\n').map((u) => u.trim()).filter(Boolean);
    return [form.imageUrl.trim(), ...extras].filter(Boolean);
  }, [form.imageUrl, extraImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data: ProductInput = {
        ...form,
        handle: effectiveSlug,
        tags: tagsStr.split(',').map((t) => t.trim()).filter(Boolean),
        imageUrls: extraImages.split('\n').map((u) => u.trim()).filter(Boolean),
        compareAtPrice: form.compareAtPrice || null,
      };
      if (!data.title.trim()) throw new Error('Naziv je obavezan');
      if (!data.imageUrl.trim()) throw new Error('Glavna slika je obavezna');
      if (data.price <= 0) throw new Error('Cena mora biti veća od 0');
      if (data.compareAtPrice && data.compareAtPrice <= data.price) {
        throw new Error('Stara cena mora biti veća od trenutne cene');
      }
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.loginError}>{error}</div>}

      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}>
          <FileText size={14} strokeWidth={2} /> Osnovni podaci
        </div>
        <div className={styles.formGrid}>
          <div className={`form-group ${styles.formGridFull}`}>
            <label className="form-label" htmlFor="title">Naziv proizvoda *</label>
            <input id="title" name="title" className="input" value={form.title} onChange={handleChange} required />
            {form.title && (
              <span className={styles.slugPreview}>
                URL u prodavnici: /products/<strong>{effectiveSlug}</strong>
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="handle">URL (handle)</label>
            <input
              id="handle"
              name="handle"
              className="input"
              value={form.handle ?? ''}
              onChange={handleChange}
              placeholder={form.title ? slugify(form.title) : 'auto-generisan iz naziva'}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="vendor">Proizvođač</label>
            <input id="vendor" name="vendor" className="input" value={form.vendor} onChange={handleChange} />
          </div>

          <div className={`form-group ${styles.formGridFull}`}>
            <label className="form-label" htmlFor="description">Opis *</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              rows={4}
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}>
          <Banknote size={14} strokeWidth={2} /> Cena i zalihe
        </div>
        <div className={styles.formGrid3}>
          <div className="form-group">
            <label className="form-label" htmlFor="price">Cena (RSD) *</label>
            <input id="price" name="price" type="number" min="1" className="input" value={form.price || ''} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="compareAtPrice">Stara cena (RSD)</label>
            <input id="compareAtPrice" name="compareAtPrice" type="number" min="0" className="input" value={form.compareAtPrice || ''} onChange={handleChange} />
            {discount !== null ? (
              <span className={styles.discountBadge}>−{discount}% popust na proizvod</span>
            ) : (
              <span className={styles.fieldHint}>Prikazuje se precrtano pored cene</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="quantity">Količina na stanju</label>
            <input id="quantity" name="quantity" type="number" min="0" className="input" value={form.quantity} onChange={handleChange} />
            {form.quantity === 0 && (
              <span className={styles.fieldHint} style={{ color: 'var(--color-error)' }}>
                Proizvod će biti prikazan kao rasprodat
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}>
          <ImageIcon size={14} strokeWidth={2} /> Slike
        </div>
        <div className={styles.formGrid}>
          <div className={`form-group ${styles.formGridFull}`}>
            <label className="form-label" htmlFor="imageUrl">Glavna slika (URL) *</label>
            <input id="imageUrl" name="imageUrl" className="input" value={form.imageUrl} onChange={handleChange} placeholder="https://..." required />
          </div>

          <div className={`form-group ${styles.formGridFull}`}>
            <label className="form-label" htmlFor="extraImages">Dodatne slike (URL, jedna po liniji)</label>
            <textarea id="extraImages" className="textarea" rows={3} value={extraImages} onChange={(e) => setExtraImages(e.target.value)} placeholder={'https://...\nhttps://...'} />
          </div>
        </div>

        {previewUrls.length > 0 && (
          <div className={styles.imagePreviewGrid}>
            {previewUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- pregled proizvoljnog URL-a van remotePatterns liste
              <img
                key={`${url}-${i}`}
                src={url}
                alt={i === 0 ? 'Glavna slika' : `Slika ${i + 1}`}
                className={`${styles.imagePreview} ${i === 0 ? styles.imagePreviewMain : ''}`}
                title={i === 0 ? 'Glavna slika' : `Slika ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}>
          <Tags size={14} strokeWidth={2} /> Organizacija
        </div>
        <div className={styles.formGrid}>
          <div className="form-group">
            <label className="form-label" htmlFor="productType">Kategorija</label>
            <input id="productType" name="productType" className="input" value={form.productType} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tags">Tagovi (odvojeni zarezom)</label>
            <input id="tags" className="input" value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="novo, bestseller, elektronika" />
          </div>
        </div>
      </div>

      <div className={styles.formActions}>
        <label className={styles.switch}>
          <input
            type="checkbox"
            name="availableForSale"
            className={styles.switchInput}
            checked={form.availableForSale}
            onChange={handleChange}
          />
          <span className={styles.switchTrack} />
          <span className={styles.switchLabel}>
            {form.availableForSale ? 'Dostupan za prodaju' : 'Skriven iz prodaje'}
          </span>
        </label>
        <div className={styles.formActionsSpacer} />
        <Link href="/admin/products" className="btn btn-ghost btn-sm">Odustani</Link>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Čuvanje...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
