'use client';

import { useState } from 'react';
import { Sparkles, Bot, Loader2, Wand2 } from 'lucide-react';
import { GeneratedProduct } from '@/lib/gemini';

interface Props {
  onGenerated: (product: GeneratedProduct) => void;
}

export default function GeminiProductGenerator({ onGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Greška pri generisanju.');
      onGenerated(json.data);
      setOpen(false);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do neočekivane greške.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn btn-primary"
        style={{
          background: 'linear-gradient(135deg, #1652be 0%, #0a2a6b 100%)',
          border: '1.5px solid rgba(255, 200, 56, 0.5)',
          boxShadow: '0 4px 16px rgba(22, 82, 190, 0.25)',
          gap: 8,
        }}
      >
        <Sparkles size={16} style={{ color: 'var(--gold-light)' }} />
        <span>Auto-generiši Proizvod pomoću Gemini AI</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 16,
            padding: 20,
            borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(255, 200, 56, 0.08) 0%, rgba(22, 82, 190, 0.04) 100%)',
            border: '1.5px solid rgba(255, 200, 56, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Bot size={20} style={{ color: 'var(--brand)' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: 800 }}>
              Gemini AI Generator Proizvoda
            </h4>
          </div>
          <p style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 16, lineHeight: 1.5 }}>
            Unesite samo naziv ili kratku ideju proizvoda (npr. <em>&bdquo;Bežične slušalice za trčanje, otporne na vodu&ldquo;</em>) i Gemini AI će automatski popuniti naziv, prodajni opis, brend, cenu, tagove, ključne prednosti, komparacije i pitanja.
          </p>

          {/* NIJE <form>: ovo je unutar ProductForm-ove <form>, a ugnjezdene forme
              browser odbaci - dugme bi se vezalo za spoljnu i onSubmit ne bi opalio. */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="customInput"
              placeholder="Unesite naziv ili opis idejnog artikla..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              style={{ flex: 1, minWidth: 260, height: 46, fontSize: '0.9rem' }}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="btn btn-primary"
              style={{ height: 46, padding: '0 20px', background: 'var(--gold-gradient)', color: '#0A2A6B', fontWeight: 800 }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin" /> Generišem...
                </>
              ) : (
                <>
                  <Wand2 size={16} /> Popuni formu
                </>
              )}
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
