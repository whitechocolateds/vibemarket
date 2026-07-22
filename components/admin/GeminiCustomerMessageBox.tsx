'use client';

import { useState } from 'react';
import { Sparkles, Bot, Loader2, Copy, Check, MessageSquare } from 'lucide-react';
import { toast } from '@/components/admin/Toaster';

interface Props {
  order: any;
}

export default function GeminiCustomerMessageBox({ order }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai/customer-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Greška pri kreiranju.');
      setMessage(json.message);
    } catch (err: any) {
      toast(err.message || 'Greška', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!message) return;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast('Poruka kopirana za slanje kupcu!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(22, 82, 190, 0.05) 0%, rgba(255, 200, 56, 0.1) 100%)',
        border: '1.5px solid rgba(22, 82, 190, 0.25)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--gold-light)' }} /> Gemini AI Asistent za Kupce
        </h3>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="btn btn-primary btn-sm"
          style={{ height: 36, fontSize: '0.75rem', background: 'var(--brand-gradient)' }}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <><Bot size={14} /> {message ? 'Regeneriši poruku' : 'Generiši SMS / Email poruku'}</>}
        </button>
      </div>

      {!message && !loading && (
        <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
          Kliknite na dugme iznad da Gemini AI kreira personalizovanu poruku za kupca {order.customerInfo?.firstName} povodom statusa <strong>"{order.status}"</strong>.
        </p>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--brand)', fontSize: '0.86rem' }}>
          <Loader2 size={16} className="spin" />
          <span>Gemini AI sastavlja poruku...</span>
        </div>
      )}

      {message && !loading && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              color: '#0f172a',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {message}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-outline btn-sm"
            style={{ marginTop: 10, height: 36, fontSize: '0.76rem', gap: 6 }}
          >
            {copied ? <><Check size={14} style={{ color: '#16a34a' }} /> Kopirano!</> : <><Copy size={14} /> Kopiraj poruku</>}
          </button>
        </div>
      )}
    </div>
  );
}
