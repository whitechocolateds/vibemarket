'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/* true tek posle hidratacije na klijentu - SSR i prvi klijentski render se poklapaju */
export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
