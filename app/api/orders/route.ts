import { NextRequest, NextResponse } from 'next/server';
import { CartItem, OrderForm } from '@/lib/types';
import { isShopifyConfigured } from '@/lib/shopify';
import { saveOrder } from '@/lib/orderStore';

interface CreateOrderBody {
  items: CartItem[];
  customerInfo: OrderForm;
  totalPrice: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();
    const { items, customerInfo, totalPrice } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'Korpa je prazna' }, { status: 400 });
    }

    const orderNumber = `VM-${Date.now().toString(36).toUpperCase()}`;

    if (isShopifyConfigured()) {
      // Create draft order in Shopify via Admin API
      const adminDomain = process.env.SHOPIFY_STORE_DOMAIN;
      const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;

      if (adminDomain && adminToken) {
        const shopifyOrder = {
          draft_order: {
            line_items: items.map((item) => ({
              variant_id: item.id.replace('gid://shopify/ProductVariant/', ''),
              quantity: item.quantity,
            })),
            customer: {
              first_name: customerInfo.firstName,
              last_name: customerInfo.lastName,
              email: customerInfo.email,
              phone: customerInfo.phone,
            },
            shipping_address: {
              first_name: customerInfo.firstName,
              last_name: customerInfo.lastName,
              address1: customerInfo.address,
              city: customerInfo.city,
              zip: customerInfo.postalCode,
              phone: customerInfo.phone,
              country: 'RS',
            },
            note: `Plaćanje: Pouzeće\n${customerInfo.note ?? ''}`,
            tags: 'pouzeće, vibemarket',
          },
        };

        const response = await fetch(
          `https://${adminDomain}/admin/api/2024-01/draft_orders.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': adminToken,
            },
            body: JSON.stringify(shopifyOrder),
          }
        );

        if (!response.ok) {
          console.error('Shopify draft order creation failed:', await response.text());
        }
      }
    }

    await saveOrder({ items, customerInfo, totalPrice, orderNumber });

    // Always return success to the client
    return NextResponse.json({
      success: true,
      orderId: orderNumber,
      orderNumber,
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
