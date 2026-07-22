'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Zap,
  Bot,
  ChevronDown,
  RefreshCw,
  Package,
  Check,
  AlertCircle,
  Info,
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

const MODEL_BADGE_COLOR: Record<string, string> = {
  'gemini-3.6-flash': '#7c3aed',
  'gemini-3.5-flash': '#6d28d9',
  'gemini-3.1-flash-lite': '#0369a1',
  'gemini-2.5-pro': '#b45309',
  'gemini-2.5-flash': '#15803d',
  'gemini-2.0-flash': '#0f766e',
  'gemini-flash-latest': '#1d4ed8',
  'gemini-pro-latest': '#be185d',
};

function getModelBadgeColor(name: string) {
  for (const [key, color] of Object.entries(MODEL_BADGE_COLOR)) {
    if (name.includes(key)) return color;
  }
  return '#475569';
}

interface GeminiModel {
  name: string;
  displayName: string;
}

const GENERATION_STEPS = [
  'Inicijalizacija Gemini AI...',
  'Analiziranje tržišta i kategorije...',
  'Generisanje prodajnog naslova i opisa...',
  'Kreiranje prednosti i FAQ-a...',
  'Priprema cenovne strategije...',
  'Objavljivanje u prodavnici...',
];

export default function GeminiAiStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [createdProduct, setCreatedProduct] = useState<any | null>(null);
  const [generatedData, setGeneratedData] = useState<GeneratedProduct | null>(null);

  // Model selection state
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Load available models from API
  useEffect(() => {
    async function fetchModels() {
      setModelsLoading(true);
      try {
        const res = await fetch('/api/admin/ai/models');
        const json = await res.json();
        if (json.models && json.models.length > 0) {
          setModels(json.models);
        }
      } catch {
        // silently fallback
      } finally {
        setModelsLoading(false);
      }
    }
    fetchModels();
  }, []);

  const selectedModelLabel =
    selectedModel === 'auto'
      ? '⚡ Auto (Pametni Fallback)'
      : (models.find(m => m.name === selectedModel)?.displayName || selectedModel);

  const handleGenerateAndSave = async (ideaPrompt?: string) => {
    const targetPrompt = ideaPrompt || prompt;
    if (!targetPrompt.trim()) return;

    setLoading(true);
    setCreatedProduct(null);
    setGeneratedData(null);
    setStepIndex(0);

    // Animate through steps
    let currentStep = 0;
    const stepInterval = setInterval(() => {
      currentStep++;
      if (currentStep < GENERATION_STEPS.length - 1) {
        setStepIndex(currentStep);
      } else {
        clearInterval(stepInterval);
      }
    }, 1600);

    try {
      const genRes = await fetch('/api/admin/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          model: selectedModel === 'auto' ? undefined : selectedModel,
        }),
      });
      const genJson = await genRes.json();
      clearInterval(stepInterval);
      if (!genRes.ok) throw new Error(genJson.error || 'Greška pri generisanju.');

      const data: GeneratedProduct = genJson.data;
      setGeneratedData(data);
      setStepIndex(GENERATION_STEPS.length - 1);

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
      toast(`✅ Proizvod „${data.title}" je uspešno kreiran i objavljen!`);
      setPrompt('');
    } catch (err: any) {
      clearInterval(stepInterval);
      toast(err.message || 'Greška u AI Studio obradi', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(255, 200, 56, 0.15)', color: '#92400e',
            fontSize: '0.74rem', fontWeight: 800, marginBottom: 10,
            border: '1px solid rgba(255, 200, 56, 0.4)',
            boxShadow: '0 2px 8px rgba(217, 155, 0, 0.12)',
          }}>
            <Sparkles size={13} style={{ color: '#d97706' }} /> GEMINI AI STUDIO — AUTOMATIZACIJA PRODAVNICE
          </div>
          <h1 className={styles.pageTitle}>Gemini AI Product Studio</h1>
          <p className={styles.pageSubtitle}>
            Izaberite Gemini model → unesite ideju → kliknite dugme → proizvod je živeo u prodavnici u sekundi
          </p>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
        padding: '16px 20px', borderRadius: 18,
        background: '#ffffff', border: '1.5px solid #e2e8f0',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        flexWrap: 'wrap',
      }}>
        <Bot size={22} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
            Izabrani Gemini Model
          </div>
          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
            {selectedModelLabel}
          </div>
        </div>

        {/* Model Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            disabled={modelsLoading}
            onClick={() => setModelDropdownOpen(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 12,
              background: 'var(--brand-gradient)', color: '#fff',
              fontSize: '0.88rem', fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22, 82, 190, 0.25)',
            }}
          >
            {modelsLoading
              ? <><Loader2 size={16} className="spin" /> Učitavanje modela...</>
              : <><ChevronDown size={16} /> Promeni Model</>}
          </button>

          {modelDropdownOpen && !modelsLoading && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 100,
              background: '#ffffff', border: '1.5px solid #e2e8f0',
              borderRadius: 16, boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              minWidth: 320, maxHeight: 420, overflowY: 'auto',
              padding: '8px 0',
            }}>
              {/* Auto option */}
              <button
                onClick={() => { setSelectedModel('auto'); setModelDropdownOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px', background: selectedModel === 'auto' ? '#f0f7ff' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', flexShrink: 0, boxShadow: '0 0 6px #16a34a' }} />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>⚡ Auto (Pametni Fallback)</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Automatski bira najbrži dostupni model</div>
                </div>
                {selectedModel === 'auto' && <Check size={15} style={{ color: 'var(--brand)', marginLeft: 'auto' }} />}
              </button>

              <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

              {models.map(m => (
                <button
                  key={m.name}
                  onClick={() => { setSelectedModel(m.name); setModelDropdownOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', background: selectedModel === m.name ? '#f0f7ff' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: getModelBadgeColor(m.name),
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.displayName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>{m.name}</div>
                  </div>
                  {selectedModel === m.name && <Check size={15} style={{ color: 'var(--brand)', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Model count chip */}
        <div style={{
          padding: '6px 14px', borderRadius: 99,
          background: '#f1f5f9', border: '1px solid #e2e8f0',
          fontSize: '0.78rem', fontWeight: 700, color: '#475569',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Info size={13} />
          {modelsLoading ? '...' : `${models.length} modela dostupno`}
        </div>
      </div>

      {/* Main Generator Card */}
      <div style={{
        marginBottom: 24,
        padding: '28px 28px 24px',
        borderRadius: 24,
        background: 'linear-gradient(135deg, #091a38 0%, #0c234a 100%)',
        border: '1.5px solid rgba(255, 200, 56, 0.35)',
        boxShadow: '0 20px 56px rgba(9, 26, 56, 0.28)',
        color: '#ffffff',
      }}>
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0A2A6B', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255, 200, 56, 0.45)', flexShrink: 0,
          }}>
            <Wand2 size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
              Generiši i Objavi Novi Artikal
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.72)', margin: '4px 0 0', lineHeight: 1.55 }}>
              {selectedModel === 'auto'
                ? 'Pametni Auto mod — sistem će izabrati najbrži dostupni Gemini model'
                : `Koristiće se: ${models.find(m => m.name === selectedModel)?.displayName || selectedModel}`}
            </p>
          </div>
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Unesite naziv ili ideju artikla (npr: Bežične slušalice pro sa poništavanjem buke)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleGenerateAndSave(); }
            }}
            style={{
              flex: 1, minWidth: 280, height: 58,
              padding: '0 20px', borderRadius: 16,
              background: 'rgba(255,255,255,0.09)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              color: '#ffffff', fontSize: '1rem', outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => handleGenerateAndSave()}
            disabled={loading || !prompt.trim()}
            style={{
              height: 58, padding: '0 32px', borderRadius: 16,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#0A2A6B', fontSize: '1rem', fontWeight: 800,
              letterSpacing: '0.04em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 28px rgba(217, 155, 0, 0.45)',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              opacity: loading || !prompt.trim() ? 0.65 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {loading
              ? <><Loader2 size={20} className="spin" /> AI obrađuje...</>
              : <><Sparkles size={20} /> Generiši i Objavi</>}
          </button>
        </div>

        {/* Live step progress */}
        {loading && (
          <div style={{
            padding: '14px 18px', borderRadius: 14,
            background: 'rgba(255, 200, 56, 0.12)',
            border: '1px solid rgba(255, 200, 56, 0.3)',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Loader2 size={16} className="spin" style={{ color: '#fbbf24' }} />
              <span style={{ color: '#fde68a', fontSize: '0.88rem', fontWeight: 700 }}>
                {GENERATION_STEPS[stepIndex]}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {GENERATION_STEPS.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 99,
                  background: i <= stepIndex ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                  transition: 'background 0.4s ease',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Quick preset ideas */}
        <div>
          <span style={{
            fontSize: '0.72rem', fontWeight: 800,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 10,
          }}>
            🔥 BRZE IDEJE — KLIKNITE ZA AUTOMATSKO GENERISANJE:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                onClick={() => { setPrompt(idea); handleGenerateAndSave(idea); }}
                disabled={loading}
                style={{
                  padding: '8px 16px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff', fontSize: '0.8rem', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <Zap size={13} style={{ color: '#fbbf24' }} /> {idea}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Card */}
      {createdProduct && (
        <div style={{
          padding: 24, borderRadius: 20, marginBottom: 24,
          border: '2px solid #16a34a',
          background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.07) 0%, #ffffff 100%)',
          boxShadow: '0 8px 24px rgba(22, 163, 74, 0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#16a34a',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 6px 18px rgba(22, 163, 74, 0.35)',
            }}>
              <CheckCircle2 size={30} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                🎉 USPEŠNO OBJAVLJENO U PRODAVNICI
              </span>
              <h3 style={{ fontSize: '1.25rem', margin: '4px 0 4px', color: '#0f172a', fontWeight: 800 }}>
                {createdProduct.title}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0 }}>
                Cena: <strong style={{ color: '#0f172a' }}>{createdProduct.price} RSD</strong>
                {' · '}Status: <span style={{ color: '#16a34a', fontWeight: 700 }}>Aktivno u ponudi</span>
                {selectedModel !== 'auto' && (
                  <span style={{ marginLeft: 8, padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>
                    via {models.find(m => m.name === selectedModel)?.displayName || selectedModel}
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={`/products/${createdProduct.handle}`} target="_blank" className="btn btn-primary btn-sm"
                style={{ background: 'var(--brand-gradient)', height: 44, padding: '0 20px', gap: 8 }}>
                <span>Otvorite u prodavnici</span> <ExternalLink size={15} />
              </Link>
              <Link href={`/admin/products/${createdProduct.id}/edit`} className="btn btn-outline btn-sm"
                style={{ height: 44, padding: '0 20px' }}>
                Izmeni detalje
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Generated Content Preview */}
      {generatedData && (
        <div className={styles.card} style={{ padding: 24, borderRadius: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Package size={20} style={{ color: 'var(--brand)' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Generisani Sadržaj za Prodavnicu
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {/* Description */}
            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--brand)', fontWeight: 800, marginBottom: 10 }}>
                Prodajni Opis:
              </h4>
              <div style={{
                fontSize: '0.9rem', color: '#334155', lineHeight: 1.7,
                background: '#f8fafc', padding: 18, borderRadius: 14,
                border: '1px solid #e2e8f0',
              }}>
                {generatedData.description}
              </div>
            </div>

            {/* Comparison points */}
            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--brand)', fontWeight: 800, marginBottom: 10 }}>
                Ključne Prednosti & Poređenja:
              </h4>
              <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(generatedData.comparisonPoints || []).map((cp: any, i: number) => (
                  <li key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    fontSize: '0.86rem', color: '#334155',
                    background: '#f8fafc', padding: '10px 14px',
                    borderRadius: 12, border: '1px solid #e2e8f0',
                  }}>
                    <Check size={16} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                    <span>{typeof cp === 'string' ? cp : `${cp.us || ''} (naspram: ${cp.competitor || ''})`}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div>
              <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--brand)', fontWeight: 800, marginBottom: 10 }}>
                Tagovi i Kategorija:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(generatedData.tags || []).map((tag: string) => (
                  <span key={tag} style={{
                    padding: '5px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700,
                    background: 'rgba(22, 82, 190, 0.09)', color: 'var(--brand)',
                    border: '1px solid rgba(22, 82, 190, 0.2)',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.86rem', color: '#475569' }}>
                <strong>Cena:</strong> {generatedData.price} RSD
                {generatedData.compareAtPrice && (
                  <span style={{ marginLeft: 8, textDecoration: 'line-through', color: '#94a3b8' }}>
                    {generatedData.compareAtPrice} RSD
                  </span>
                )}
              </div>
            </div>

            {/* FAQs */}
            {generatedData.faqs && generatedData.faqs.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--brand)', fontWeight: 800, marginBottom: 10 }}>
                  Često Postavljana Pitanja (FAQ):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {generatedData.faqs.map((faq: any, i: number) => (
                    <div key={i} style={{
                      background: '#f8fafc', padding: '12px 16px', borderRadius: 12,
                      border: '1px solid #e2e8f0',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a', marginBottom: 4 }}>
                        ❓ {faq.question}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                        {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
