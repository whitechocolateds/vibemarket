import { NextRequest, NextResponse } from 'next/server';
import { CartItem, OrderForm } from '@/lib/types';
import { saveOrder } from '@/lib/orderStore';
import { getAllProducts, decrementStock } from '@/lib/productStore';
import { bundleUnitPrice } from '@/lib/bundlePricing';
import { isValidSerbianPhone } from '@/lib/phone';
import { sendCapiEvent } from '@/lib/metaConversionsApi';

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
      });
    }

    const totalPrice = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderNumber = `VM-${Date.now().toString(36).toUpperCase()}`;

    await saveOrder({ items: verifiedItems, customerInfo, totalPrice, orderNumber });
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
      clientIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: req.headers.get('user-agent'),
      fbp: req.cookies.get('_fbp')?.value ?? null,
      fbc: req.cookies.get('_fbc')?.value ?? null,
    }).catch((error) => console.error('CAPI Purchase event failed:', error));

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
