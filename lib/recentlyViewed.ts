'use client';

export interface RecentItem {
  handle: string;
  title: string;
  image: string | null;
  price: number;
  compareAtPrice?: number | null;
}

const KEY = 'vm-recently-viewed';
const MAX_ITEMS = 8;

export function readRecentlyViewed(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(item: RecentItem): void {
  try {
    const rest = readRecentlyViewed().filter((r) => r.handle !== item.handle);
    localStorage.setItem(KEY, JSON.stringify([item, ...rest].slice(0, MAX_ITEMS)));
  } catch {
    /* localStorage nedostupan - preskačemo */
  }
}
