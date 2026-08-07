import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { fetchCompetitorSource, ImportError } from '@/lib/competitorImport';
import { buildDescriptionHtml } from '@/lib/productHtml';
import { rewriteCompetitorProduct } from '@/lib/gemini';
import { htmlToPlainText } from '@/lib/sanitizeHtml';
import { createProduct } from '@/lib/productStore';
import { importImageFromUrl } from '@/lib/mediaStore';
import { slugify } from '@/lib/slugify';
import type { ProductInput, ImportSourceMeta } from '@/lib/types';

// fetch + Gemini lako pređe podrazumevanih 10 s
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { url?: unknown; model?: unknown; publish?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Neispravan zahtev.' }, { status: 400 });
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  if (!url) {
    return NextResponse.json({ error: 'Nalepi link proizvoda sa konkurentske prodavnice.' }, { status: 400 });
  }
  const model = typeof body.model === 'string' && body.model !== 'auto' ? body.model : undefined;
  const publish = body.publish === true;

  try {
    const source = await fetchCompetitorSource(url);
    const draft = await rewriteCompetitorProduct(source, model);

    // Slike se PREUZIMAJU u našu prodavnicu umesto da se hotlinkuju: tuđi CDN URL
    // pukne čim ga rotiraju, a i nije u remotePatterns pa bi next/image odustao.
    // Ako preuzimanje ne uspe, pada nazad na originalni URL - bolje išta nego ništa.
    const rehosted = await Promise.all(
      source.images.slice(0, 6).map(async (remote) => {
        try {
          return (await importImageFromUrl(remote)).url;
        } catch (err) {
          console.warn(`Slika ${remote} nije preuzeta:`, err instanceof Error ? err.message : err);
          return remote;
        }
      })
    );

    const descriptionHtml = buildDescriptionHtml(draft);
    const description = htmlToPlainText(descriptionHtml).slice(0, 2000);

    const meta: ImportSourceMeta = {
      sourceUrl: source.sourceUrl,
      platform: source.platform,
      price: source.price,
      compareAtPrice: source.compareAtPrice,
      currency: source.currency,
      images: rehosted,
    };

    const input: ProductInput = {
      title: draft.title,
      handle: slugify(draft.title),
      description,
      descriptionHtml,
      // Cena je PREDLOG - admin je potvrđuje. Vrednost je u valuti izvora, bez konverzije.
      price: source.price ?? 0,
      compareAtPrice: source.compareAtPrice ?? null,
      imageUrl: rehosted[0] ?? '',
      imageUrls: rehosted.slice(1),
      tags: draft.tags,
      vendor: draft.vendor,
      productType: draft.productType,
      quantity: 25,
      availableForSale: true,
      comparisonPoints: draft.comparisonPoints,
      faqs: draft.faqs,
    };

    if (!publish) {
      return NextResponse.json({ success: true, mode: 'draft', draft: input, source: meta });
    }

    if (!input.imageUrl) {
      return NextResponse.json(
        { error: 'Sa te stranice nije preuzeta nijedna slika, pa se proizvod ne može odmah objaviti. Koristi "Uvezi i pregledaj" pa dodaj sliku.' },
        { status: 400 }
      );
    }
    if (input.price <= 0) {
      return NextResponse.json(
        { error: 'Cena nije pročitana sa izvora. Koristi "Uvezi i pregledaj" pa je unesi ručno.' },
        { status: 400 }
      );
    }

    const product = await createProduct(input);
    return NextResponse.json({ success: true, mode: 'published', product, source: meta }, { status: 201 });
  } catch (error) {
    if (error instanceof ImportError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Uvoz nije uspeo.';
    const alreadyExists = /već postoji/i.test(message);
    return NextResponse.json({ error: message }, { status: alreadyExists ? 409 : 500 });
  }
}
