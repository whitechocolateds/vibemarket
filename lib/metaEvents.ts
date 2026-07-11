'use client';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function isPixelConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
}

/** Isti event_id se šalje i preko Pixel-a (klijent) i preko Conversions API-ja (server) radi deduplikacije u Meta Events Manageru. */
export function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function trackPixel(event: string, params?: Record<string, unknown>, eventId?: string): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  if (eventId) window.fbq('track', event, params ?? {}, { eventID: eventId });
  else window.fbq('track', event, params ?? {});
}
