'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Bot, Wand2, Loader2, CheckCircle2, ArrowRight, Package, Flame, Lightbulb, ExternalLink } from 'lucide-react';
import { toast } from '@/components/admin/Toaster';
import { GeneratedProduct } from '@/lib/gemini';
import styles from '../../admin.module.css';

const PRESET_IDEAS = [
  'Bežični Sportski Masažni Pištolj sa 6 Nastavaka',
  'Pametna RGB LED Lampa za Radni Sto sa Bežičnim Punjačem',
  'Prenosivi Sokovnik Blender sa USB Punjenjem',
  'Vodootporni Bluetooth Zvučnik 30W sa Basom',
  'Ergonomska Mehanička Tastatura sa RGB Osvetljenjem',
];

export default function GeminiAiStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedProduct | null>(null);

  const handleGenerateAndSave = async (ideaPrompt?: string) => {
    const targetPrompt = ideaPrompt || prompt;
    if (!targetPrompt.trim()) return;

    setLoading(true);
    setCreatedProduct(null);
    setGeneratedData(null);

    try {
      // 1. Generate product via Gemini AI
      const genRes = await fetch('/api/admin/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: targetPrompt }),
      });
      const genJson = await genRes.json();
      if (!genRes.ok) throw new Error(genJson.error || 'Greška pri generisanju.');

      const data: GeneratedProduct = genJson.data;
      setGeneratedData(data);

      // 2. Save directly into Product Store
      const saveRes = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          price: data.price,
          compareAtPrice: data.compareAtPrice || null,
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
          imageUrls: [],
          tags: data.tags || ['novo', 'bestseller'],
          vendor: data.vendor || 'VibeMarket',
          productType: data.productType || 'Elektronika',
          quantity: 25,
          availableForSale: true,
          comparisonPoints: data.comparisonPoints || [],
          faqs: data.faqs || [],
        }),
      });

      const saveJson = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveJson.error || 'Greška pri čuvanju proizvoda.');

      setCreatedProduct(saveJson.data);
      toast(`Proizvod „${data.title}" je uspešno kreiran i objavljen!`);
      setPrompt('');
    } catch (err: any) {
      toast(err.message || 'Greška u AI Studio obradi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, background: 'rgba(255, 200, 56, 0.15)', color: '#855300', fontSize: '0.72rem', fontWeight: 800, marginBottom: 8, border: '1px solid rgba(255, 200, 56, 0.4)' }}>
            <Sparkles size={13} /> GEMINI AI AUTOMATIZACIJA
          </div>
          <h1 className={styles.pageTitle}>Gemini AI Product Studio</h1>
          <p className={styles.pageSubtitle}>Automatski generišite i objavite kompletne premium proizvode jednim klikom</p>
        </div>
      </div>

      <div className={styles.card} style={{ marginBottom: 'var(--space-6)', border: '1.5px solid rgba(22, 82, 190, 0.3)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 248, 252, 0.98) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--brand-gradient)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(22, 82, 190, 0.3)' }}>
            <Wand2 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              AI Generator Proizvoda na 1 Klik
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
              Napišite naziv ili ideju proizvoda i Gemini AI će sam napisati prodajni tekst, cene, tagove, poređenja i FAQ i odmah objaviti proizvod u prodavnici!
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            type="text"
            className="customInput"
            placeholder="Npr: Bežične slušalice pro sa poništavanjem buke..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            style={{ flex: 1, minWidth: 280, height: 50, fontSize: '0.95rem' }}
          />
          <button
            type="button"
            onClick={() => handleGenerateAndSave()}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary"
            style={{ height: 50, padding: '0 28px', background: 'var(--brand-gradient)', fontWeight: 800, letterSpacing: '0.04em' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Gemini kreira i objavljuje...
              </>
            ) : (
              <>
                <Sparkles size={18} style={{ color: 'var(--gold-light)' }} /> Generiši i Objavi Artikal
              </>
            )}
          </button>
        </div>

        <div>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: 8 }}>
            💡 Brze ideje na 1 klik:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => {
                  setPrompt(idea);
                  handleGenerateAndSave(idea);
                }}
                disabled={loading}
                style={{
                  padding: '6px 14px',
                  borderRadius: 99,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Flame size={12} style={{ color: '#d97706' }} /> {idea}
              </button>
            ))}
          </div>
        </div>
      </div>

      {createdProduct && (
        <div className={styles.card} style={{ border: '2px solid #16a34a', background: 'rgba(22, 163, 74, 0.04)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={28} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                🎉 USPEŠNO OBJAVLJENO U PRODAVNICI
              </span>
              <h3 style={{ fontSize: '1.2rem', margin: '2px 0 4px', color: '#0f172a' }}>
                {createdProduct.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}>
                Cena: <strong>{createdProduct.price} RSD</strong> · Status: <strong>Aktivno</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href={`/products/${createdProduct.handle}`}
                target="_blank"
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--brand-gradient)', height: 42, padding: '0 18px', gap: 6 }}
              >
                <span>Pogledaj u prodavnici</span> <ExternalLink size={14} />
              </Link>
              <Link
                href={`/admin/products/${createdProduct.id}/edit`}
                className="btn btn-outline btn-sm"
                style={{ height: 42, padding: '0 18px' }}
              >
                Izmeni detalje
              </Link>
            </div>
          </div>
        </div>
      )}

      {generatedData && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><Package size={16} /> Pregled Generisanog Sadržaja</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>
                Prodajni Opis:
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #cbd5e1' }}>
                {generatedData.description}
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brand)' }}>
                Ključne Prednosti i Poređenja:
              </h4>
              <ul style={{ paddingLeft: 18, fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                {generatedData.comparisonPoints?.map((cp, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{cp}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
