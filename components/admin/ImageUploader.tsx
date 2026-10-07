'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadPresigned } from '@vercel/blob/client';
import { NASTAVAK_PO_TIPU, jeVideo, uploadPutanja } from '@/lib/uploadPath';
import { Upload, X, Star, ChevronLeft, ChevronRight, Link2, Loader2, AlertCircle } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm';

/**
 * Plafon je ovde zbog poruke korisniku; pravi plafon postavlja dozvola koju
 * izdaje server (MAX_CLIENT_UPLOAD_BYTES u lib/mediaStore.ts). Dva broja se
 * drze odvojeno jer mediaStore koristi `fs` i ne sme u klijentski paket.
 *
 * Bilo je 4 MB dok su bajtovi isli kroz nasu funkciju - Vercel tamo odbija telo
 * zahteva vece od ~4.5 MB. Otkad se otprema pravo u Blob, taj plafon ne vazi, pa
 * prolazi i GIF snimljen sa ekrana.
 */
const MAX_BYTES = 100 * 1024 * 1024;

interface Pending {
  id: string;
  name: string;
  preview: string;
  progress: number;
  error?: string;
  /** Pregled ide kroz <video>, ne <img>. */
  video?: boolean;
}

interface Props {
  value: string[];
  /** Ista signatura kao React setState - funkcionalni update je nužan jer se otpremanja završavaju paralelno. */
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  disabled?: boolean;
}

export default function ImageUploader({ value, onChange, disabled }: Props) {
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // objectURL-ovi se moraju osloboditi da ne cure
  const previewUrls = useRef<Set<string>>(new Set());
  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const uploadOne = useCallback(
    (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const preview = URL.createObjectURL(file);
      previewUrls.current.add(preview);

      const settle = (error?: string) => {
        if (error) {
          setPending((p) => p.map((it) => (it.id === id ? { ...it, error, progress: 100 } : it)));
        } else {
          setPending((p) => p.filter((it) => it.id !== id));
          URL.revokeObjectURL(preview);
          previewUrls.current.delete(preview);
        }
      };

      if (!NASTAVAK_PO_TIPU[file.type]) {
        setPending((p) => [
          ...p,
          { id, name: file.name, preview, video: jeVideo(file.type), progress: 0, error: 'Dozvoljeni su JPG, PNG, WebP, AVIF, GIF, MP4 i WebM' },
        ]);
        return;
      }

      if (file.size > MAX_BYTES) {
        const mb = Math.round(file.size / 1024 / 1024);
        setPending((p) => [
          ...p,
          {
            id,
            name: file.name,
            preview,
            video: jeVideo(file.type),
            progress: 0,
            error: `Fajl je ${mb} MB, a najviše je ${MAX_BYTES / 1024 / 1024} MB`,
          },
        ]);
        return;
      }

      setPending((p) => [...p, { id, name: file.name, preview, video: jeVideo(file.type), progress: 0 }]);

      /*
       * Fajl ide PRAVO u Blob; nasa ruta samo potpise dozvolu. Zato ovde nema
       * ni Vercel-ovog limita od ~4.5 MB na telo zahteva, ni limita na trajanje
       * funkcije - veliki GIF se ne provlaci kroz nas.
       */
      uploadPresigned(uploadPutanja(file.name, file.type), file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload/client',
        contentType: file.type,
        // Veliki fajl se deli na delove koji idu uporedo, uz ponavljanje palog dela.
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => {
          setPending((p) => p.map((it) => (it.id === id ? { ...it, progress: Math.round(percentage) } : it)));
        },
      })
        .then((rezultat) => {
          onChange((prev) => (prev.includes(rezultat.url) ? prev : [...prev, rezultat.url]));
          settle();
        })
        .catch((error: unknown) => {
          settle(error instanceof Error ? error.message : 'Otpremanje nije uspelo.');
        });
    },
    [onChange]
  );

  const handleFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        if (file.type && !NASTAVAK_PO_TIPU[file.type]) continue;
        uploadOne(file);
      }
    },
    [uploadOne]
  );

  const move = (index: number, delta: number) => {
    onChange((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const makeMain = (index: number) => {
    onChange((prev) => {
      if (index === 0 || index >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  };

  const remove = (index: number) => onChange((prev) => prev.filter((_, i) => i !== index));

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    onChange((prev) => (prev.includes(url) ? prev : [...prev, url]));
    setUrlInput('');
  };

  return (
    <div className={styles.uploaderWrap}>
      <div
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
      >
        <Upload size={20} />
        <strong>Prevuci slike ovde ili klikni da izabereš</strong>
        <span>JPG, PNG, WebP, AVIF ili GIF · najviše 4 MB po slici</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {(value.length > 0 || pending.length > 0) && (
        <div className={styles.uploaderGrid}>
          {value.map((url, i) => (
            <figure key={`${url}-${i}`} className={styles.uploaderItem}>
              {jeVideo(url) ? (
                // Petlja se u panelu prikazuje kao sto ce se prikazati i na sajtu.
                <video src={url} className={styles.uploaderThumb} muted loop playsInline autoPlay />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- pregled proizvoljnog URL-a van remotePatterns liste */
                <img src={url} alt={i === 0 ? 'Glavna slika' : `Slika ${i + 1}`} className={styles.uploaderThumb} />
              )}

              {i === 0 && <span className={styles.uploaderMainBadge}>Glavna</span>}

              <div className={styles.uploaderActions}>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Pomeri levo">
                  <ChevronLeft size={13} />
                </button>
                <button type="button" onClick={() => makeMain(i)} disabled={i === 0} title="Postavi kao glavnu">
                  <Star size={13} />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} title="Pomeri desno">
                  <ChevronRight size={13} />
                </button>
              </div>

              <button type="button" className={styles.uploaderRemove} onClick={() => remove(i)} title="Ukloni sliku">
                <X size={13} />
              </button>
            </figure>
          ))}

          {pending.map((item) => (
            <figure key={item.id} className={`${styles.uploaderItem} ${item.error ? styles.uploaderItemError : ''}`}>
              {item.video ? (
                <video src={item.preview} className={styles.uploaderThumb} muted loop playsInline autoPlay />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element -- lokalni objectURL pregled */
                <img src={item.preview} alt={item.name} className={styles.uploaderThumb} />
              )}

              {item.error ? (
                <>
                  <span className={styles.uploaderError} title={item.error}>
                    <AlertCircle size={12} /> {item.error}
                  </span>
                  <button
                    type="button"
                    className={styles.uploaderRemove}
                    onClick={() => setPending((p) => p.filter((it) => it.id !== item.id))}
                    title="Ukloni"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <span className={styles.uploaderProgress}>
                  <Loader2 size={13} className={styles.uploaderSpin} /> {item.progress}%
                </span>
              )}
            </figure>
          ))}
        </div>
      )}

      <div className={styles.uploaderUrlRow}>
        {showUrlInput ? (
          <>
            <input
              className="input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUrl();
                }
              }}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addUrl}>
              Dodaj
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowUrlInput(false)}>
              Zatvori
            </button>
          </>
        ) : (
          <button type="button" className={styles.uploaderUrlToggle} onClick={() => setShowUrlInput(true)}>
            <Link2 size={13} /> Dodaj preko URL-a
          </button>
        )}
      </div>
    </div>
  );
}
