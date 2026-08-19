'use client';

import { useState } from 'react';
import { Store, Loader2, AlertCircle, CheckCircle2, Download, Eye } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

interface ImportItem {
  title: string;
  action: 'kreiran' | 'azuriran' | 'preskocen' | 'greska';
  detail?: string;
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  dryRun: boolean;
  items: ImportItem[];
}

const AKCIJA_LABELA: Record<ImportItem['action'], string> = {
  kreiran: 'Nov',
  azuriran: 'Ažuriran',
  preskocen: 'Preskočen',
  greska: 'Greška',
};

export default function ShopifyImport() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'proba' | 'uvoz' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const run = async (dryRun: boolean) => {
    setLoading(dryRun ? 'proba' : 'uvoz');
    setError(null);
    if (dryRun) setResult(null);

    try {
      const res = await fetch('/api/admin/shopify/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, overwrite }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Uvoz nije uspeo.');
      setResult(json as ImportResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do neočekivane greške.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.importWrap}>
      <button type="button" onClick={() => setOpen(!open)} className={styles.importToggle}>
        <Store size={16} />
        <span>Uvezi katalog sa Shopify-ja</span>
      </button>

      {open && (
        <div className={styles.importPanel}>
          <p className={styles.importLead}>
            Povlači <strong>ceo tvoj katalog</strong> sa Shopify naloga — nazive, cene, opise, slike i
            zalihe. Slike se preuzimaju u tvoju prodavnicu, ne hotlinkuju.
            {' '}Shopify se <strong>ne menja</strong>.
          </p>

          <label className={styles.sourceHint} style={{ marginBottom: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={loading !== null}
              style={{ marginRight: 8 }}
            />
            Prepiši i proizvode koji već postoje ovde (inače se preskaču)
          </label>

          <div className={styles.importForm} style={{ gridTemplateColumns: 'auto auto 1fr' }}>
            <button
              type="button"
              onClick={() => run(true)}
              className="btn btn-secondary"
              disabled={loading !== null}
            >
              {loading === 'proba'
                ? <><Loader2 size={15} className={styles.uploaderSpin} /> Proveravam…</>
                : <><Eye size={15} /> Proba (ništa se ne menja)</>}
            </button>

            <button
              type="button"
              onClick={() => run(false)}
              className="btn btn-primary"
              disabled={loading !== null || !result?.dryRun}
              title={!result?.dryRun ? 'Prvo pokreni probu' : undefined}
            >
              {loading === 'uvoz'
                ? <><Loader2 size={15} className={styles.uploaderSpin} /> Uvozim…</>
                : <><Download size={15} /> Uvezi stvarno</>}
            </button>
          </div>

          {error && (
            <div className={styles.importError}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {result && (
            <div className={result.dryRun ? styles.importPanel : styles.importedBanner} style={{ marginTop: 16 }}>
              {!result.dryRun && <CheckCircle2 size={16} />}
              <span style={{ flex: 1 }}>
                <strong>
                  {result.dryRun ? 'Proba: ' : 'Uvezeno: '}
                  {result.total} proizvoda na Shopify-ju
                </strong>
                {' — '}
                {result.created} {result.dryRun ? 'bi bilo novo' : 'novih'},{' '}
                {result.updated} {result.dryRun ? 'bi bilo ažurirano' : 'ažuriranih'},{' '}
                {result.skipped} preskočeno.
                {result.dryRun && result.total > 0 && (
                  <>
                    <br />
                    Slike se u probi <strong>ne preuzimaju</strong>, pa pravi uvoz traje osetno duže.
                  </>
                )}
              </span>
            </div>
          )}

          {result && result.items.length > 0 && (
            <ul className={styles.shopifyList}>
              {result.items.slice(0, 60).map((item, i) => (
                <li key={i} className={item.action === 'greska' ? styles.shopifyItemError : undefined}>
                  <span className={styles.shopifyAction}>{AKCIJA_LABELA[item.action]}</span>
                  <span className={styles.shopifyTitle}>{item.title}</span>
                  {item.detail && <span className={styles.shopifyDetail}>{item.detail}</span>}
                </li>
              ))}
              {result.items.length > 60 && (
                <li className={styles.shopifyDetail}>… i još {result.items.length - 60}</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
