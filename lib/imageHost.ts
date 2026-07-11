const OPTIMIZABLE_HOSTS = ['images.unsplash.com', 'plastikaonline.rs'];
const OPTIMIZABLE_HOST_SUFFIXES = ['.public.blob.vercel-storage.com'];

/**
 * next/image optimizuje samo hostove iz next.config.ts remotePatterns. Admin panel dozvoljava
 * proizvoljan URL slike, pa za nepoznate hostove tražimo unoptimized (next/image se tada ponaša
 * kao obican <img>, bez greske) umesto da rezerviste na poznate domene.
 */
export function isOptimizableImageUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    if (OPTIMIZABLE_HOSTS.includes(hostname)) return true;
    return OPTIMIZABLE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}
