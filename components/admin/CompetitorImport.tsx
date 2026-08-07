'use client';

import { useEffect, useState } from 'react';
import { Link2, Loader2, Download, AlertCircle } from 'lucide-react';
import type { ProductInput, ImportSourceMeta } from '@/lib/types';
import styles from '@/app/admin/admin.module.css';

interface Props {
  onImported: (draft: ProductInput, source: ImportSourceMeta) => void;
}

const STEPS = ['Preuzimam stranicu…', 'Pišem originalan opis…', 'Preuzimam slike…'];

export default function CompetitorImport({ onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [model, setModel] = useState('auto');
  const [models, setModels] = useState<{ name: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || models.length) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/ai/models');
        if (!res.ok) return;
        const json = await res.json();
        if (active && Array.isArray(json.models)) setModels(json.models);
      } catch {
        /* padamo na "auto" */
      }
    })();
    return () => {
      active = false;
    };
  }, [open, models.length]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;

    setLoading(true);
    setError(null);
    setStep(0);
    // Koraci su gruba procena trajanja, ne stvarni napredak - zato ih ima svega tri
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 4000);

    try {
      const res = await fetch('/api/admin/import-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), model, publish: false }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Uvoz nije uspeo.');

      onImported(json.draft as ProductInput, json.source as ImportSourceMeta);
      setOpen(false);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do neočekivane greške.');
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  };

  return (
    <div className={styles.importWrap}>
      <button type="button" onClick={() => setOpen(!open)} className={styles.importToggle}>
        <Link2 size={16} />
        <span>Uvezi proizvod sa linka</span>
      </button>

      {open && (
        <div className={styles.importPanel}>
          <p className={styles.importLead}>
            Nalepi link proizvoda sa druge prodavnice. Gemini iz njega izvlači <strong>činjenice</strong> (dimenzije,
            snaga, materijal) i piše <strong>potpuno nov</strong> opis na srpskom, sa podnaslovima. Tekst se ne
            prepisuje — doslovna kopija bi nosila i pravni rizik i duplicate-content kaznu na Google-u.
          </p>

          <form onSubmit={handleImport} className={styles.importForm}>
            <input
              type="url"
              className="input"
              placeholder="https://prodavnica.rs/products/naziv-proizvoda"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
            />

            <select
              className="select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
              aria-label="Gemini model"
            >
              <option value="auto">Model: automatski</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.displayName}
                </option>
              ))}
            </select>

            <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()}>
              {loading ? (
                <>
                  <Loader2 size={15} className={styles.uploaderSpin} /> {STEPS[step]}
                </>
              ) : (
                <>
                  <Download size={15} /> Uvezi i pregledaj
                </>
              )}
            </button>
          </form>

          {error && (
            <div className={styles.importError}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
