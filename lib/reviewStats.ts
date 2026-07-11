function stableHash(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash;
}

/** Deterministična, ali "nasumična" ocena/broj recenzija po proizvodu - ista na serveru i klijentu. */
export function stableReviewCount(id: string): number {
  return 60 + (stableHash(id) % 340);
}

export const STORE_RATING = 4.9;
