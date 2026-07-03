'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'vibemarket_wishlist';

function readWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function useWishlist(productId: string) {
  const [isWished, setIsWished] = useState(false);

  useEffect(() => {
    setIsWished(readWishlist().includes(productId));
  }, [productId]);

  const toggle = useCallback(() => {
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId];
    localStorage.setItem(KEY, JSON.stringify(next));
    setIsWished(next.includes(productId));
  }, [productId]);

  return { isWished, toggle };
}
