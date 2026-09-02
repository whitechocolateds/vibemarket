import { readJsonFileResult, updateJsonFile } from './db';
import { AdminStats, CartItem, DailyStat, Order, OrderForm, TopProduct } from './types';
import { getAllProducts } from './productStore';

const FILE = 'orders.json';

/**
 * Neuspelo citanje se NE svodi na praznu listu.
 *
 * Prazna lista bi u admin panelu izgledala kao "nema porudzbina", a upis nad
 * njom bi obrisao sve dosadasnje. Porudzbine su podaci kupaca - bolje je da
 * stranica pukne nego da tiho nestanu.
 */
async function loadOrders(): Promise<Order[]> {
  const res = await readJsonFileResult<Order[]>(FILE);
  if (res.status === 'ok') return Array.isArray(res.data) ? res.data : [];
  if (res.status === 'missing') return [];
  throw new Error(
    'Porudzbine nisu procitane iz skladista. ' +
      `Uzrok: ${res.error instanceof Error ? res.error.message : String(res.error)}`
  );
}

/**
 * Svaka izmena porudzbina ide odavde - procitaj, izmeni, uslovno upisi.
 *
 * Bez ovoga dve porudzbine u istom trenutku znace da jedna nestane: obe procitaju
 * istu listu, obe je upisu nazad, druga pregazi prvu. Kupac dobije potvrdu za
 * porudzbinu koje u skladistu nema.
 */
async function mutateOrders(mutate: (orders: Order[]) => boolean): Promise<void> {
  await updateJsonFile<Order[]>(FILE, (current) => {
    const orders = Array.isArray(current) ? current : [];
    return mutate(orders) ? orders : null;
  });
}

export async function saveOrder(params: {
  items: CartItem[];
  customerInfo: OrderForm;
  totalPrice: number;
  orderNumber: string;
}): Promise<Order> {
  const order: Order = {
    id: params.orderNumber,
    orderNumber: params.orderNumber,
    createdAt: new Date().toISOString(),
    items: params.items,
    customerInfo: params.customerInfo,
    totalPrice: params.totalPrice,
    status: 'pending',
  };
  await mutateOrders((orders) => {
    orders.unshift(order);
    return true;
  });

  return order;
}

export async function getAllOrders(): Promise<Order[]> {
  return loadOrders();
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await loadOrders();
  return orders.find((o) => o.id === id || o.orderNumber === id) ?? null;
}

export async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<Order> {
  let updated: Order | null = null;

  await mutateOrders((orders) => {
    const index = orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (index === -1) throw new Error('Porudžbina nije pronađena');
    updated = { ...orders[index], status };
    orders[index] = updated;
    return true;
  });

  return updated!;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [orders, products] = await Promise.all([loadOrders(), getAllProducts()]);

  const revenueOrders = orders.filter((o) => o.status !== 'cancelled');

  // Yesterday stats for trend calculation
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = (iso: string) => {
    const d = new Date(iso);
    return d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  };
  const yesterdayOrdersList = orders.filter((o) => isYesterday(o.createdAt));
  const yesterdayRevenue = yesterdayOrdersList.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalPrice, 0);

  const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const todayOrdersList = orders.filter((o) => isToday(o.createdAt));
  const todayRevenue = todayOrdersList
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const statusCounts: Record<Order['status'], number> = {
    pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0,
  };
  for (const o of orders) statusCounts[o.status] += 1;

  // Prihod po danu - poslednjih 14 dana uključujući danas
  const days: DailyStat[] = [];
  const byDay = new Map<string, DailyStat>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const stat: DailyStat = {
      date: localDateKey(d),
      label: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`,
      revenue: 0,
      orders: 0,
    };
    days.push(stat);
    byDay.set(stat.date, stat);
  }
  for (const o of revenueOrders) {
    const stat = byDay.get(localDateKey(new Date(o.createdAt)));
    if (stat) {
      stat.revenue += o.totalPrice;
      stat.orders += 1;
    }
  }

  // Najprodavaniji proizvodi (bez otkazanih porudžbina)
  const productTotals = new Map<string, TopProduct>();
  let itemsSold = 0;
  for (const o of revenueOrders) {
    for (const item of o.items) {
      itemsSold += item.quantity;
      const existing = productTotals.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        productTotals.set(item.productId, {
          productId: item.productId,
          title: item.title,
          handle: item.handle,
          image: item.image?.url ?? null,
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    }
  }
  const topProducts = [...productTotals.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const lowStockProducts = products
    .map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.featuredImage?.url ?? null,
      quantity: p.variants[0]?.quantityAvailable ?? 0,
    }))
    .filter((p) => p.quantity <= 3)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 6);

  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders: statusCounts.pending,
    todayRevenue,
    todayOrders: todayOrdersList.length,
    yesterdayRevenue,
    yesterdayOrders: yesterdayOrdersList.length,
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.availableForSale).length,
    avgOrderValue: revenueOrders.length ? Math.round(totalRevenue / revenueOrders.length) : 0,
    itemsSold,
    statusCounts,
    revenueByDay: days,
    topProducts,
    lowStockProducts,
    lowStockCount: lowStockProducts.length,
    recentOrders: orders.slice(0, 8),
  };
}
