'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Wand2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Package,
  Flame,
  Lightbulb,
  ExternalLink,
  Zap,
  Tag,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { toast } from '@/components/admin/Toaster';
import { GeneratedProduct } from '@/lib/gemini';
import styles from '../../admin.module.css';

const PRESET_IDEAS = [
  'Bežični Sportski Masažni Pištolj sa 6 Nastavaka',
  'Pametna RGB LED Lampa za Radni Sto sa Bežičnim Punjačem',
  'Prenosivi Sokovnik Blender sa USB Punjenjem 400ml',
  'Vodootporni Bluetooth Zvučnik 30W sa Dubokim Basom',
  'Ergonomska Mehanička Tastatura sa RGB Osvetljenjem',
  'Pametni Sat Sport Pro sa Praćenjem Pulsa i Sna',
];

export default function GeminiAiStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepText, setStepText] = useState('Analiziram ideju...');
  const [createdProduct, setCreatedProduct] = useState<any | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedProduct | null>(null);

  const handleGenerateAndSave = async (ideaPrompt?: string) => {
    const targetPrompt = ideaPrompt || prompt;
    if (!targetPrompt.trim()) return;

    setLoading(true);
    setCreatedProduct(null);
    setGeneratedData(null);
    setStepText('Gemini AI analizira tržište i sastavlja opis...');

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

      setStepText('Čuvam artikal i objavljujem u prodavnici...');

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
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 16px',
              borderRadius: 99,
              background: 'rgba(255, 200, 56, 0.15)',
              color: '#855300',
              fontSize: '0.74rem',
              fontWeight: 800,
              marginBottom: 10,
              border: '1px solid rgba(255, 200, 56, 0.4)',
              boxShadow: '0 2px 8px rgba(217, 155, 0, 0.12)',
            }}
          >
            <Sparkles size={14} style={{ color: '#d97706' }} /> GEMINI 2.0 FLASH AI STUDIO
          </div>
          <h1 className={styles.pageTitle}>Gemini AI Studio za Proizvode</h1>
          <p className={styles.pageSubtitle}>
            Potpuno automatizovano generisanje i instant objavljivanje prodajnih artikala na 1 klik
          </p>
        </div>
      </div>

      {/* Hero Studio Banner */}
      <div
        style={{
          marginBottom: 'var(--space-6)',
          padding: '28px 24px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, #091a38 0%, #0c234a 100%)',
          border: '1.5px solid rgba(255, 200, 56, 0.4)',
          boxShadow: '0 16px 48px rgba(9, 26, 56, 0.25)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--gold-gradient)',
              color: '#0A2A6B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(255, 200, 56, 0.4)',
              flexShrink: 0,
            }}
          >
            <Wand2 size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
              Generiši i Objavi Novi Artikal u Prodavnici
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.78)', margin: '4px 0 0', lineHeight: 1.5 }}>
              Unesite naziv ili zamisao proizvoda — Gemini AI automatski kreira naziv, prodajni opis, cene, tagove, komparativne prednosti i često postavljana pitanja.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Unesite naziv ili ideju artikla (npr: Bežične slušalice pro sa poništavanjem buke)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleGenerateAndSave();
              }
            }}
            style={{
              flex: 1,
              minWidth: 280,
              height: 56,
              padding: '0 20px',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1.5px solid rgba(255, 255, 255, 0.22)',
              color: '#ffffff',
              fontSize: '1rem',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => handleGenerateAndSave()}
            disabled={loading || !prompt.trim()}
            className="btn btn-primary"
            style={{
              height: 56,
              padding: '0 32px',
              background: 'var(--gold-gradient)',
              color: '#0A2A6B',
              fontSize: '0.95rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              boxShadow: '0 8px 24px rgba(217, 155, 0, 0.4)',
              border: 'none',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="spin" /> Gemini AI obrađuje...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Generiši i Objavi Artikal
              </>
            )}
          </button>
        </div>

        {loading && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              background: 'rgba(255, 200, 56, 0.12)',
              border: '1px solid rgba(255, 200, 56, 0.3)',
              color: 'var(--gold-light)',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Loader2 size={16} className="spin" />
            <span>{stepText}</span>
          </div>
        )}

        <div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'block',
              marginBottom: 10,
            }}
          >
            🔥 BRZE IDEJE ZA AUTOMATSKO OBJAVLJIVANJE (KLIKNITE DUGME):
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
                  padding: '8px 16px',
                  borderRadius: 99,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Zap size={13} style={{ color: 'var(--gold-light)' }} /> {idea}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification Card */}
      {createdProduct && (
        <div
          className={styles.card}
          style={{
            border: '2px solid #16a34a',
            background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(255, 255, 255, 1) 100%)',
            marginBottom: 'var(--space-6)',
            padding: 24,
            borderRadius: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: '#16a34a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 6px 18px rgba(22, 163, 74, 0.35)',
              }}
            >
              <CheckCircle2 size={30} />
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#15803d',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                🎉 USPEŠNO OBJAVLJENO U PRODAVNICI
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '4px 0 4px', color: '#0f172a', fontWeight: 800 }}>
                {createdProduct.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                Cena: <strong style={{ color: '#0f172a' }}>{createdProduct.price} RSD</strong> · Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>Aktivno u ponudi</span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link
                href={`/products/${createdProduct.handle}`}
                target="_blank"
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--brand-gradient)', height: 44, padding: '0 20px', gap: 8 }}
              >
                <span>Otvorite proizvod</span> <ExternalLink size={15} />
              </Link>
              <Link
                href={`/admin/products/${createdProduct.id}/edit`}
                className="btn btn-outline btn-sm"
                style={{ height: 44, padding: '0 20px' }}
              >
                Izmeni detalje
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Generated Content Showcase */}
      {generatedData && (
        <div className={styles.card} style={{ padding: 24, borderRadius: 20 }}>
          <div className={styles.cardHeader} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={18} style={{ color: 'var(--brand)' }} /> Generisani Sadržaj za Prodavnicu
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--brand)', fontWeight: 800, marginBottom: 8 }}>
                Prodajni Opis Proizvoda:
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.65, background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #cbd5e1' }}>
                {generatedData.description}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--brand)', fontWeight: 800, marginBottom: 8 }}>
                Ključne Prednosti & Poređenja sa Konkurencijom:
              </h4>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generatedData.comparisonPoints?.map((cp, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      fontSize: '0.86rem',
                      color: '#334155',
                      background: '#f8fafc',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                    <span>{typeof cp === 'string' ? cp : `${(cp as any).us} (naspram: ${(cp as any).competitor})`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
