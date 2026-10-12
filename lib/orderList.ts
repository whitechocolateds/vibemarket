import type { Order } from './types';

/**
 * Citanje odgovora o porudzbinama, sa jednim pravilom: spisak na ekranu sme da
 * se zameni SAMO potvrdjenim, kompletnim spiskom.
 *
 * Postoji zato sto je `setOrders(json.data ?? [])` verovao svemu sto stigne.
 * Odgovor sa statusom 200 ciji oblik nije ocekivan - telo bez `data`, telo koje
 * se ne raspakuje kao JSON, stranica umesto JSON-a - zavrsavao bi kao prazan
 * niz i obrisao sve porudzbine sa ekrana. Provera `res.ok` to ne hvata, jer je
 * takav odgovor formalno uspesan.
 *
 * Prazan niz JESTE validan spisak (moguce je da porudzbina stvarno nema) - zato
 * se odbija samo ono sto nije niz porudzbina, a ne prazan rezultat.
 */
export function spisakIzOdgovora(telo: unknown): Order[] | null {
  const data = (telo as { data?: unknown } | null | undefined)?.data;
  if (!Array.isArray(data)) return null;
  if (!data.every(jePorudzbina)) return null;
  return data as Order[];
}

/** Ista provera za jednu porudzbinu, uz uslov da je bas ona koju smo menjali. */
export function porudzbinaIzOdgovora(telo: unknown, ocekivaniId: string): Order | null {
  const data = (telo as { data?: unknown } | null | undefined)?.data;
  if (!jePorudzbina(data)) return null;
  return data.id === ocekivaniId ? data : null;
}

function jePorudzbina(v: unknown): v is Order {
  if (!v || typeof v !== 'object') return false;
  const o = v as Partial<Order>;
  return typeof o.id === 'string' && typeof o.status === 'string' && Array.isArray(o.items);
}
