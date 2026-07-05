'use client';

import { create } from 'zustand';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import styles from '@/app/admin/admin.module.css';

type ToastType = 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (message: string, type: ToastType) => void;
  remove: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, type) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastType = 'success') {
  useToastStore.getState().push(message, type);
}

export default function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <div className={styles.toaster} aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`${styles.toast} ${t.type === 'error' ? styles.toastError : ''}`}
          onClick={() => remove(t.id)}
        >
          {t.type === 'error'
            ? <AlertCircle size={16} strokeWidth={2} />
            : <CheckCircle2 size={16} strokeWidth={2} />}
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
