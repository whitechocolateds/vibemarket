import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { isShopifyConfigured, ShopifyError } from '@/lib/shopify';
import { fetchAllShopifyProducts, mapShopifyProduct, assertCurrencyMatches } from '@/lib/shopifyImport';
import { getAllProducts, createProduct, updateProduct } from '@/lib/productStore';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Uvoz ide u SERIJAMA, a ne odjednom.
 *
 * Izmereno na katalogu od 81 proizvoda: ~3,3 s po proizvodu (preuzimanje slika i
 * upis u Blob), sto je ~270 s za ceo katalog. To probija vremensko ogranicenje
 * funkcije na vecini planova, pa se posao prekida u pola - a klijent pritom moze
 * da dobije 200 sa delimicnim rezultatom i deluje kao da je sve proslo.
 *
 * Zato jedan zahtev obradjuje malu grupu, a klijent ih nizе dok hasMore ne postane
 * false. Svaka serija je zaseban, kratak zahtev koji ne moze da istekne.
 */
const DEFAULT_BATCH = 10;
const MAX_BATCH = 25;

export interface ShopifyImportResult {
  /** Ukupno proizvoda na Shopify-ju. */
  total: number;
  /** Do kog rednog broja je stiglo ukljucujuci ovu seriju. */
  processedTo: number;
  hasMore: boolean;
  created: number;
  updated: number;
  skipped: number;
  failed: { title: string; reason: string }[];
  dryRun: boolean;
  items: { title: string; action: 'kreiran' | 'azuriran' | 'preskocen' | 'greska'; detail?: string }[];
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  if (!isShopifyConfigured()) {
    return NextResponse.json(
      { error: 'Shopify nije podešen. Postavi kredencijale, pa pokreni npm run shopify:check.' },
      { status: 400 }
    );
  }

  let body: { dryRun?: unknown; overwrite?: unknown; offset?: unknown; limit?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* prazno telo je u redu */
  }

  // Podrazumevano je proba: pokaže šta bi se desilo, ne menja ništa
  const dryRun = body.dryRun !== false;
  const overwrite = body.overwrite === true;
  const offset = Math.max(0, Number(body.offset) || 0);
  const limit = Math.min(MAX_BATCH, Math.max(1, Number(body.limit) || DEFAULT_BATCH));

  try {
    await assertCurrencyMatches();

    const all = await fetchAllShopifyProducts();
    const slice = all.slice(offset, offset + limit);
    const existing = await getAllProducts();

    const result: ShopifyImportResult = {
      total: all.length,
      processedTo: Math.min(offset + slice.length, all.length),
      hasMore: offset + slice.length < all.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: [],
      dryRun,
      items: [],
    };

    for (const sp of slice) {
      const title = sp.title ?? '(bez naziva)';
      try {
        // Veza ide preko shopifyProductId, ne preko handle-a - naziv se na
        // Shopify-ju može promeniti, a veza mora da preživi.
        const match =
          existing.find((p) => sp.id && p.shopifyProductId === sp.id) ??
          existing.find((p) => p.handle === sp.handle);

        if (match && !overwrite) {
          result.skipped++;
          result.items.push({ title, action: 'preskocen', detail: 'već postoji' });
          continue;
        }

        // U probi se slike ne preuzimaju - inače bi proba trajala kao pravi uvoz
        const input = await mapShopifyProduct(sp, { rehostImages: !dryRun });

        if (!input.title.trim()) throw new Error('nema naziv');
        if (input.price <= 0) throw new Error('cena je 0');

        if (!dryRun) {
          if (match) await updateProduct(match.id, input);
          else await createProduct(input);
        }

        if (match) {
          result.updated++;
          result.items.push({ title, action: 'azuriran' });
        } else {
          result.created++;
          result.items.push({ title, action: 'kreiran' });
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'nepoznata greška';
        // Greške su ranije završavale samo u odgovoru, pa se u logu nije videlo ništa
        console.error(`Shopify uvoz: "${title}" nije uspeo - ${reason}`);
        result.failed.push({ title, reason });
        result.items.push({ title, action: 'greska', detail: reason });
      }
    }

    console.log(
      `Shopify uvoz${dryRun ? ' (proba)' : ''}: ${offset}-${result.processedTo}/${result.total} · ` +
        `novih ${result.created}, ažuriranih ${result.updated}, preskočenih ${result.skipped}, ` +
        `neuspelih ${result.failed.length}`
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ShopifyError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
    }
    const message = error instanceof Error ? error.message : 'Uvoz nije uspeo.';
    console.error('Shopify uvoz je pukao:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
