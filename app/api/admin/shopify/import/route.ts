import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { isShopifyConfigured, ShopifyError } from '@/lib/shopify';
import { fetchAllShopifyProducts, mapShopifyProduct, assertCurrencyMatches } from '@/lib/shopifyImport';
import { getAllProducts, saveProductsBulk, type BulkOutcome } from '@/lib/productStore';
import { isTransientBlobError } from '@/lib/blobStore';
import { ProductInput } from '@/lib/types';

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

/**
 * Ponavlja posao koji je pao iz PROLAZNOG razloga.
 *
 * Prava greska (nema naziv, cena je 0, Shopify vraca 401) ponavljanjem ne postaje
 * tacna, pa se propusta odmah. Ponavlja se samo ono sto skladiste oznaci kao
 * prolazno - zastarelo telo posle upisa, sudar oko istog objekta.
 */
async function withRetry<T>(fn: () => Promise<T>, sta: string, pokusaja = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTransientBlobError(err) || attempt >= pokusaja) throw err;
      console.warn(
        `Shopify uvoz: ${sta} - pokusaj ${attempt}/${pokusaja} nije uspeo (` +
          `${err instanceof Error ? err.message : 'nepoznato'}), pokusavam ponovo`
      );
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
}

/**
 * Upisuje seriju, pa ako to ne uspe - proizvod po proizvod.
 *
 * Grupni upis je brz put: jedno citanje, jedan upis za celu seriju. Ali kad
 * padne, ranije je OBARAO svih 10 proizvoda odjednom, iako je problem mozda samo
 * u jednom. Zato se posle njega ide pojedinacno: sto moze da prodje - prolazi, a
 * neuspeh ostane ogranicen na proizvod koji ga je izazvao.
 *
 * Sam sudar (BlobConflictError) se ponavlja jos jednom pre nego sto se ide na
 * pojedinacni put, jer je prolazan - sledece citanje vec vidi noviju verziju.
 */
async function writeBatch(
  pending: { title: string; input: ProductInput }[],
  overwrite: boolean,
  result: ShopifyImportResult,
  offset: number
): Promise<BulkOutcome[]> {
  const BULK_POKUSAJA = 3;

  for (let attempt = 1; attempt <= BULK_POKUSAJA; attempt++) {
    try {
      const outcomes = await saveProductsBulk(pending.map((x) => x.input), { overwrite });

      for (const outcome of outcomes) {
        const title = pending.find((x) => x.input === outcome.input)?.title ?? outcome.product.title;
        if (outcome.action === 'azuriran') {
          result.updated++;
          result.items.push({ title, action: 'azuriran' });
        } else {
          result.created++;
          result.items.push({ title, action: 'kreiran' });
        }
      }
      return outcomes;
    } catch (err) {
      console.error(
        `Shopify uvoz: grupni upis serije ${offset}, pokusaj ${attempt}/${BULK_POKUSAJA} nije uspeo - ` +
          `${err instanceof Error ? err.message : 'nepoznata greška'}`
      );
      // Sudar je samo jedan oblik prolazne greske - zastarelo telo je drugi
      if (isTransientBlobError(err) && attempt < BULK_POKUSAJA) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }
      break;
    }
  }

  // Grupni upis ne prolazi - dalje se ide jedan po jedan, da neuspeh ostane sam
  console.warn(`Shopify uvoz: serija ${offset} prelazi na pojedinacni upis (${pending.length} proizvoda)`);
  const outcomes: BulkOutcome[] = [];

  for (const item of pending) {
    try {
      const single = await withRetry(
        () => saveProductsBulk([item.input], { overwrite }),
        `upis "${item.title}"`
      );
      outcomes.push(...single);

      if (single.length === 0) continue; // preskocen, broji se kasnije
      result[single[0].action === 'azuriran' ? 'updated' : 'created']++;
      result.items.push({ title: item.title, action: single[0].action });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'upis nije uspeo';
      console.error(`Shopify uvoz: "${item.title}" nije upisan - ${reason}`);
      result.failed.push({ title: item.title, reason });
      result.items.push({ title: item.title, action: 'greska', detail: reason });
    }
  }

  return outcomes;
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

    // Citanje kataloga na pocetku serije je bila tacka na kojoj je ceo uvoz
    // stajao: prvo zastarelo telo posle upisa prethodne serije rusilo je zahtev.
    // Stanje se slegne za manje od sekunde, pa se ovde jednostavno saceka.
    const existing = await withRetry(() => getAllProducts(), 'citanje kataloga');

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

    /**
     * Prvo se SVE mapira, pa se cela serija upisuje JEDNIM upisom.
     *
     * Ranije je svaki proizvod isao kroz createProduct/updateProduct, sto je za
     * seriju od 10 znacilo 10 puta "procitaj ceo katalog, dopisi jedan, upisi ceo
     * katalog". Ako je jedno od tih citanja palo, katalog je bio zamenjen demo
     * podacima, a serija bi to i dalje prijavila kao uspeh.
     */
    const pending: { title: string; input: ProductInput }[] = [];

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

        if (dryRun) {
          // Proba ne pise nista, pa se ishod zna odmah iz poklapanja
          if (match) {
            result.updated++;
            result.items.push({ title, action: 'azuriran' });
          } else {
            result.created++;
            result.items.push({ title, action: 'kreiran' });
          }
        } else {
          pending.push({ title, input });
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'nepoznata greška';
        // Greške su ranije završavale samo u odgovoru, pa se u logu nije videlo ništa
        console.error(`Shopify uvoz: "${title}" nije uspeo - ${reason}`);
        result.failed.push({ title, reason });
        result.items.push({ title, action: 'greska', detail: reason });
      }
    }

    if (pending.length > 0) {
      // Upis se CEKA pre nego sto se serija prijavi kao uspesna. Ako padne,
      // nijedan proizvod iz serije se ne broji kao upisan - jer i nije.
      const outcomes = await writeBatch(pending, overwrite, result, offset);

      // Sto je upis preskocio (vec postoji, a overwrite je iskljucen)
      for (const item of pending) {
        if (outcomes.some((o) => o.input === item.input)) continue;
        if (result.items.some((r) => r.title === item.title && r.action === 'greska')) continue;
        result.skipped++;
        result.items.push({ title: item.title, action: 'preskocen', detail: 'već postoji' });
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

    // Prolazno stanje skladista NIJE razlog da ceo uvoz stane. Klijent dobija
    // znak da ponovi BAS OVU seriju - preskakanje bi ostavilo rupu u katalogu,
    // a prekid bi bacio i ono sto je vec proslo.
    if (isTransientBlobError(error)) {
      return NextResponse.json(
        { error: message, retryable: true, offset },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
