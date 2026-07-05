'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'vibemarket_wishlist';
const CHANGE_EVENT = 'vibemarket:wishlist-change';

function readWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useWishlist(productId: string) {
  const isWished = useSyncExternalStore(
    subscribe,
    () => readWishlist().includes(productId),
    () => false
  );

  const toggle = useCallback(() => {
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [productId]);

  return { isWished, toggle };
}
