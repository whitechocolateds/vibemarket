import { NextRequest, NextResponse, after } from 'next/server';
import { CartItem, OrderForm } from '@/lib/types';
import { saveOrder, setOrderShopifySync } from '@/lib/orderStore';
import { getAllProducts, decrementStock } from '@/lib/productStore';
import { bundleUnitPrice } from '@/lib/bundlePricing';
import { isValidSerbianPhone } from '@/lib/phone';
import { sendCapiEvent } from '@/lib/metaConversionsApi';
import { isOrderPushEnabled, createShopifyOrder } from '@/lib/shopify';

export const runtime = 'nodejs';
/*
 * Posao u `after` tece POSLE odgovora kupcu, ali unutar ovog ogranicenja.
 * Poziv ka Shopify-ju ima sopstveni prekid na 20 s, pa 60 s ostavlja prostora
 * i za upis ishoda na porudzbinu.
 */
export const maxDuration = 60;

interface CreateOrderBody {
  items: CartItem[];
  customerInfo: OrderForm;
  totalPrice: number;
  eventId?: string;
}

const REQUIRED_FIELDS: (keyof OrderForm)[] = [
  'firstName', 'lastName', 'phone', 'address', 'city', 'postalCode',
];

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();
    const { items, customerInfo, eventId } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'Korpa je prazna' }, { status: 400 });
    }

    for (const field of REQUIRED_FIELDS) {
      if (!customerInfo?.[field]?.toString().trim()) {
        return NextResponse.json({ error: 'Popunite sva obavezna polja' }, { status: 400 });
      }
    }
    if (!isValidSerbianPhone(customerInfo.phone)) {
      return NextResponse.json({ error: 'Unesite ispravan broj telefona' }, { status: 400 });
    }
    if (customerInfo.email?.trim() && !/^\S+@\S+\.\S+$/.test(customerInfo.email)) {
      return NextResponse.json({ error: 'Unesite ispravnu email adresu' }, { status: 400 });
    }

    // Cene i zalihe se proveravaju na serveru - iznos iz korpe klijenta se ne koristi
    const products = await getAllProducts();
    const verifiedItems: CartItem[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.id === item.id) ?? product?.variants[0];

      if (!product || !variant) {
        return NextResponse.json(
          { error: `Proizvod "${item.title}" više nije u ponudi. Osvežite korpu.` },
          { status: 409 }
        );
      }
      if (!product.availableForSale || !variant.availableForSale) {
        return NextResponse.json(
          { error: `Proizvod "${product.title}" trenutno nije dostupan za prodaju.` },
          { status: 409 }
        );
      }

      const quantity = Math.max(1, Math.floor(item.quantity));
      const available = variant.quantityAvailable;
      if (typeof available === 'number' && quantity > available) {
        return NextResponse.json(
          { error: `Za "${product.title}" je dostupno još ${available} kom.` },
          { status: 409 }
        );
      }

      verifiedItems.push({
        id: variant.id,
        productId: product.id,
        handle: product.handle,
        title: product.title,
        variantTitle: variant.title === 'Default' ? '' : variant.title,
        // Cena po komadu uključuje količinski popust (2 kom -10%, 3+ kom -15%)
        price: bundleUnitPrice(parseFloat(variant.price.amount), quantity),
        compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : undefined,
        quantity,
        image: product.featuredImage,
        ...(variant.shopifyVariantId ? { shopifyVariantId: variant.shopifyVariantId } : {}),
      });
    }

    const totalPrice = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderNumber = `VM-${Date.now().toString(36).toUpperCase()}`;

    await saveOrder({
      items: verifiedItems,
      customerInfo,
      totalPrice,
      orderNumber,
      // Porudzbina se od prvog trenutka vidi kao "ceka slanje". Ako posao ispod
      // nikada ne stigne do kraja, ostace u tom stanju - a to je vidljivo.
      ...(isOrderPushEnabled()
        ? { shopifySync: { status: 'ceka' as const, at: new Date().toISOString() } }
        : {}),
    });
    await decrementStock(verifiedItems.map((i) => ({ productId: i.productId, quantity: i.quantity })));

    // Server-side Purchase event (Conversions API) - backup kanal za Meta Ads, radi i kad browser blokira Pixel.
    // Isti eventId kao klijentski Pixel Purchase event, radi deduplikacije u Meta Events Manageru.
    sendCapiEvent({
      eventName: 'Purchase',
      eventId,
      eventSourceUrl: req.headers.get('referer') ?? undefined,
      value: totalPrice,
      currency: 'RSD',
      contentIds: verifiedItems.map((i) => i.productId),
      // Bez IP-a Meta odbija event kao "nedovoljno podataka za povezivanje" i
      // Purchase se tiho gubi. x-forwarded-for nije svuda prisutan.
      clientIp:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip')?.trim() ||
        req.headers.get('cf-connecting-ip')?.trim() ||
        null,
      userAgent: req.headers.get('user-agent'),
      fbp: req.cookies.get('_fbp')?.value ?? null,
      fbc: req.cookies.get('_fbc')?.value ?? null,
    }).catch((error) => console.error('CAPI Purchase event failed:', error));

    /*
     * Porudzbina u Shopify - PISE U ZIVI NALOG, zato iza zasebnog prekidaca.
     *
     * Ide kroz `after`, a ne kao "obesena" promisa: bez toga platforma sme da
     * zamrzne funkciju cim posalje odgovor, pa slanje ni ne krene. `after` drzi
     * funkciju u zivotu do isteka maxDuration ove rute.
     *
     * I dalje se NE ceka pre odgovora: ako Shopify padne ili kasni, kupac ne sme
     * da ostane bez potvrde - porudzbina je vec sacuvana kod nas.
     *
     * Ishod se UPISUJE na porudzbinu. Ranije je neuspeh isao samo u console.error,
     * pa je porudzbina koja nikada nije stigla u Shopify izgledala isto kao ona
     * koja jeste - vlasnik nije imao nacina da primeti razliku.
     */
    if (isOrderPushEnabled()) {
      after(async () => {
        try {
          const r = await createShopifyOrder({
            orderNumber,
            totalPrice,
            items: verifiedItems.map((i) => ({
              title: i.title,
              variantTitle: i.variantTitle,
              price: i.price,
              quantity: i.quantity,
              shopifyVariantId: i.shopifyVariantId,
            })),
            customer: {
              firstName: customerInfo.firstName,
              lastName: customerInfo.lastName,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: customerInfo.address,
              city: customerInfo.city,
              postalCode: customerInfo.postalCode,
              note: customerInfo.note,
            },
          });

          console.log(`Porudzbina ${orderNumber} poslata u Shopify kao ${r.shopifyOrderName}`);
          await setOrderShopifySync(orderNumber, {
            status: 'poslato',
            at: new Date().toISOString(),
            shopifyOrderId: r.shopifyOrderId,
            shopifyOrderName: r.shopifyOrderName,
          });
        } catch (error) {
          const razlog = error instanceof Error ? error.message : 'nepoznata greska';
          console.error(`Shopify push za ${orderNumber} nije uspeo: ${razlog}`);

          // Upis ishoda ne sme da padne zajedno sa slanjem - bas taj zapis je
          // jedino sto vlasniku govori da nesto treba da uradi rucno.
          try {
            await setOrderShopifySync(orderNumber, {
              status: 'neuspelo',
              at: new Date().toISOString(),
              error: razlog,
            });
          } catch (upis) {
            console.error(`Neuspeh slanja za ${orderNumber} nije mogao da se zabelezi:`, upis);
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      orderId: orderNumber,
      orderNumber,
      totalPrice,
      eventId,
      message: 'Vaša porudžbina je uspešno primljena!',
      estimatedDelivery: '1-3 radna dana',
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Greška pri kreiranju porudžbine. Pokušajte ponovo.' },
      { status: 500 }
    );
  }
}
