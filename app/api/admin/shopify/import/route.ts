import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { isShopifyConfigured, ShopifyError } from '@/lib/shopify';
import { fetchAllShopifyProducts, mapShopifyProduct, assertCurrencyMatches } from '@/lib/shopifyImport';
import { getAllProducts, createProduct, updateProduct } from '@/lib/productStore';

// Preuzimanje slika po proizvodu lako pređe podrazumevanih 10 s
export const runtime = 'nodejs';
export const maxDuration = 300;

export interface ShopifyImportResult {
  total: number;
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
      { error: 'Shopify nije podešen. Postavi SHOPIFY_STORE_DOMAIN i SHOPIFY_ADMIN_TOKEN, pa pokreni npm run shopify:check.' },
      { status: 400 }
    );
  }

  let body: { dryRun?: unknown; overwrite?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* prazno telo je u redu */
  }
  // Podrazumevano je proba: pokaže šta bi se desilo, ne menja ništa
  const dryRun = body.dryRun !== false;
  const overwrite = body.overwrite === true;

  try {
    await assertCurrencyMatches();

    const shopifyProducts = await fetchAllShopifyProducts();
    const existing = await getAllProducts();

    const result: ShopifyImportResult = {
      total: shopifyProducts.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: [],
      dryRun,
      items: [],
    };

    for (const sp of shopifyProducts) {
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

        if (!input.title.trim()) {
          result.failed.push({ title, reason: 'nema naziv' });
          result.items.push({ title, action: 'greska', detail: 'nema naziv' });
          continue;
        }
        if (input.price <= 0) {
          result.failed.push({ title, reason: 'cena je 0' });
          result.items.push({ title, action: 'greska', detail: 'cena je 0' });
          continue;
        }

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
        result.failed.push({ title, reason });
        result.items.push({ title, action: 'greska', detail: reason });
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof ShopifyError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
    }
    const message = error instanceof Error ? error.message : 'Uvoz nije uspeo.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
