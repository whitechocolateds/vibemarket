import { NextRequest, NextResponse } from 'next/server';
import { CartItem, OrderForm } from '@/lib/types';
import { saveOrder } from '@/lib/orderStore';
import { getAllProducts, decrementStock } from '@/lib/productStore';

interface CreateOrderBody {
  items: CartItem[];
  customerInfo: OrderForm;
  totalPrice: number;
}

const REQUIRED_FIELDS: (keyof OrderForm)[] = [
  'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode',
];

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();
    const { items, customerInfo } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'Korpa je prazna' }, { status: 400 });
    }

    for (const field of REQUIRED_FIELDS) {
      if (!customerInfo?.[field]?.toString().trim()) {
        return NextResponse.json({ error: 'Popunite sva obavezna polja' }, { status: 400 });
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(customerInfo.email)) {
      return NextResponse.json({ error: 'Unesite ispravnu email adresu' }, { status: 400 });
    }

    // Cene i zalihe se proveravaju na serveru — iznos iz korpe klijenta se ne koristi
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
        price: parseFloat(variant.price.amount),
        compareAtPrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : undefined,
        quantity,
        image: product.featuredImage,
      });
    }

    const totalPrice = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderNumber = `VM-${Date.now().toString(36).toUpperCase()}`;

    await saveOrder({ items: verifiedItems, customerInfo, totalPrice, orderNumber });
    await decrementStock(verifiedItems.map((i) => ({ productId: i.productId, quantity: i.quantity })));

    return NextResponse.json({
      success: true,
      orderId: orderNumber,
      orderNumber,
      totalPrice,
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
