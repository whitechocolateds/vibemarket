'use client';

import { useState } from 'react';
import { Sparkles, Bot, Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

export default function GeminiInsightsWidget() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ai/sales-insights', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Greška pri generisanju.');
      setInsights(json.insights);
    } catch (err: any) {
      setError(err.message || 'Došlo je do greške.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card} style={{ border: '1.5px solid rgba(255, 200, 56, 0.4)', background: 'linear-gradient(135deg, rgba(255, 200, 56, 0.06) 0%, rgba(22, 82, 190, 0.04) 100%)' }}>
      <div className={styles.cardHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#855300', fontSize: '1rem', fontWeight: 800 }}>
          <Sparkles size={18} style={{ color: 'var(--gold-light)' }} /> Gemini AI Izveštaj i Analiza Prodaje
        </h2>
        <button
          type="button"
          onClick={fetchInsights}
          disabled={loading}
          className="btn btn-primary btn-sm"
          style={{ background: 'var(--gold-gradient)', color: '#0A2A6B', height: 36, padding: '0 14px', fontSize: '0.75rem' }}
        >
          {loading ? <Loader2 size={14} className={styles.spin} /> : <><Bot size={14} /> {insights ? 'Osveži analizu' : 'Generiši AI analizu'}</>}
        </button>
      </div>

      {!insights && !loading && !error && (
        <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
          <p>Kliknite na dugme iznad kako bi Gemini AI analizirao vašu trenutnu prodaju i generisao preporuke.</p>
        </div>
      )}

      {loading && (
        <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Loader2 size={20} className={styles.spin} />
          <span>Gemini AI analizira podatke iz baze i priprema savete...</span>
        </div>
      )}

      {error && (
        <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {insights && !loading && (
        <div style={{ padding: '12px 0 0', color: '#1e293b', fontSize: '0.9rem', lineHeight: '1.65', whiteSpace: 'pre-line' }}>
          <div style={{ display: 'flex', gap: 10, padding: 14, borderRadius: 14, background: '#ffffff', border: '1px solid rgba(255, 200, 56, 0.3)' }}>
            <Lightbulb size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
            <div>{insights}</div>
          </div>
        </div>
      )}
    </div>
  );
}
