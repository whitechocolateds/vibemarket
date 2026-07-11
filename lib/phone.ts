/** Prihvata srpske brojeve u formatima 06x-xxx-xxxx, +381 6x xxx xxxx, 00381... itd. */
export function isValidSerbianPhone(raw: string): boolean {
  const cleaned = raw.trim().replace(/[\s\-().]/g, '');
  const normalized = cleaned.replace(/^\+381/, '0').replace(/^00381/, '0');
  return /^0\d{7,10}$/.test(normalized);
}
