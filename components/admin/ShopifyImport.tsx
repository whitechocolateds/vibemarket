'use client';

import { useRef, useState } from 'react';
import { Store, Loader2, AlertCircle, CheckCircle2, Download, Eye, XCircle } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

interface ImportItem {
  title: string;
  action: 'kreiran' | 'azuriran' | 'preskocen' | 'greska';
  detail?: string;
}

interface BatchResult {
  total: number;
  processedTo: number;
  hasMore: boolean;
  created: number;
  updated: number;
  skipped: number;
  failed: { title: string; reason: string }[];
  dryRun: boolean;
  items: ImportItem[];
}

interface Totals {
  total: number;
  processedTo: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  dryRun: boolean;
  items: ImportItem[];
}

const AKCIJA_LABELA: Record<ImportItem['action'], string> = {
  kreiran: 'Nov',
  azuriran: 'Ažuriran',
  preskocen: 'Preskočen',
  greska: 'Greška',
};

const BATCH = 10;
/** Koliko puta se ponavlja ISTA serija pre nego sto se odustane. */
const RETRY_SERIJE = 4;

export default function ShopifyImport() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<'proba' | 'uvoz' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [retrying, setRetrying] = useState<{ offset: number; pokusaj: number } | null>(null);
  const cancelRef = useRef(false);

  /**
   * Uvoz ide u serijama: jedan zahtev obradi malu grupu, pa se niže dok
   * hasMore ne postane false. Ceo katalog u jednom zahtevu traje predugo i
   * funkcija bude prekinuta u pola - ranije se to videlo kao "uspeh" sa
   * delimičnim brojem.
   */
  const run = async (dryRun: boolean) => {
    setLoading(dryRun ? 'proba' : 'uvoz');
    setError(null);
    setRetrying(null);
    cancelRef.current = false;

    const acc: Totals = {
      total: 0, processedTo: 0, created: 0, updated: 0, skipped: 0, failed: 0,
      dryRun, items: [],
    };
    setTotals({ ...acc });

    try {
      let offset = 0;
      let pokusaj = 0;

      for (let guard = 0; guard < 500; guard++) {
        if (cancelRef.current) break;

        const res = await fetch('/api/admin/shopify/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dryRun, overwrite, offset, limit: BATCH }),
        });
        const json = await res.json();

        // Prolazno stanje skladista: ponavlja se BAS OVA serija, ne prekida se
        // uvoz. Ranije je prvo takvo citanje obaralo sve - uvoz je stajao na
        // 10/81 iako se stanje sleze za manje od sekunde.
        if (!res.ok && json.retryable && pokusaj < RETRY_SERIJE) {
          pokusaj++;
          setRetrying({ offset, pokusaj });
          await new Promise((r) => setTimeout(r, 1000 * pokusaj));
          continue;
        }

        if (!res.ok) {
          throw new Error(
            json.retryable
              ? `${json.error} (serija od ${offset + 1} nije prošla ni iz ${RETRY_SERIJE} pokušaja)`
              : json.error || 'Uvoz nije uspeo.'
          );
        }

        pokusaj = 0;
        setRetrying(null);
        const batch = json as BatchResult;
        acc.total = batch.total;
        acc.processedTo = batch.processedTo;
        acc.created += batch.created;
        acc.updated += batch.updated;
        acc.skipped += batch.skipped;
        acc.failed += batch.failed.length;
        acc.items.push(...batch.items);
        setTotals({ ...acc, items: [...acc.items] });

        if (!batch.hasMore) break;
        offset = batch.processedTo;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do neočekivane greške.');
    } finally {
      setLoading(null);
      setRetrying(null);
    }
  };

  const pct = totals && totals.total > 0 ? Math.round((totals.processedTo / totals.total) * 100) : 0;
  const done = totals && !loading && totals.processedTo > 0;

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
            {' '}Shopify se <strong>ne menja</strong>. Ide u serijama po {BATCH}, pa velik katalog
            ne prekine vremensko ograničenje.
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
            <button type="button" onClick={() => run(true)} className="btn btn-secondary" disabled={loading !== null}>
              {loading === 'proba'
                ? <><Loader2 size={15} className={styles.uploaderSpin} /> Proveravam…</>
                : <><Eye size={15} /> Proba (ništa se ne menja)</>}
            </button>

            <button
              type="button"
              onClick={() => run(false)}
              className="btn btn-primary"
              disabled={loading !== null || !totals?.dryRun || !done}
              title={!done || !totals?.dryRun ? 'Prvo pokreni probu' : undefined}
            >
              {loading === 'uvoz'
                ? <><Loader2 size={15} className={styles.uploaderSpin} /> Uvozim…</>
                : <><Download size={15} /> Uvezi stvarno</>}
            </button>

            {loading && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { cancelRef.current = true; }}>
                Prekini
              </button>
            )}
          </div>

          {error && (
            <div className={styles.importError}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {retrying && (
            <div className={styles.sourceHint} style={{ marginTop: 12 }}>
              <Loader2 size={14} className={styles.uploaderSpin} />{' '}
              Skladište se sleže — ponavljam seriju od {retrying.offset + 1}.
              {' '}Pokušaj {retrying.pokusaj}/{RETRY_SERIJE}.
            </div>
          )}

          {totals && totals.total > 0 && (
            <div className={styles.shopifyProgress}>
              <div className={styles.shopifyProgressBar}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <span className={styles.shopifyProgressLabel}>
                {totals.processedTo} / {totals.total} ({pct}%)
              </span>
            </div>
          )}

          {totals && totals.processedTo > 0 && (
            <div
              className={totals.failed > 0 ? styles.importError : done ? styles.importedBanner : styles.importPanel}
              style={{ marginTop: 16 }}
            >
              {totals.failed > 0 ? <XCircle size={16} /> : done ? <CheckCircle2 size={16} /> : null}
              <span style={{ flex: 1 }}>
                <strong>{totals.dryRun ? 'Proba' : 'Uvoz'}: {totals.processedTo} od {totals.total}</strong>
                {' — '}
                {totals.created} {totals.dryRun ? 'bi bilo novo' : 'novih'},{' '}
                {totals.updated} {totals.dryRun ? 'bi bilo ažurirano' : 'ažuriranih'},{' '}
                {totals.skipped} preskočeno
                {/* Ranije se broj neuspelih nigde nije prikazivao, pa je delovalo da je sve prošlo */}
                {totals.failed > 0 && (
                  <>, <strong>{totals.failed} NEUSPELO</strong> — vidi listu ispod</>
                )}
                .
                {totals.dryRun && done && (
                  <>
                    <br />
                    Slike se u probi <strong>ne preuzimaju</strong>, pa pravi uvoz traje osetno duže.
                  </>
                )}
              </span>
            </div>
          )}

          {totals && totals.items.length > 0 && (
            <ul className={styles.shopifyList}>
              {/* Neuspeli prvi - njih treba videti */}
              {[...totals.items].sort((a, b) =>
                (a.action === 'greska' ? 0 : 1) - (b.action === 'greska' ? 0 : 1)
              ).slice(0, 80).map((item, i) => (
                <li key={i} className={item.action === 'greska' ? styles.shopifyItemError : undefined}>
                  <span className={styles.shopifyAction}>{AKCIJA_LABELA[item.action]}</span>
                  <span className={styles.shopifyTitle}>{item.title}</span>
                  {item.detail && <span className={styles.shopifyDetail}>{item.detail}</span>}
                </li>
              ))}
              {totals.items.length > 80 && (
                <li className={styles.shopifyDetail}>… i još {totals.items.length - 80}</li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
