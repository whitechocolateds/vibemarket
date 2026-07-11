import { readJsonFile, writeJsonFile } from './db';
import { AdminStats, CartItem, DailyStat, Order, OrderForm, TopProduct } from './types';
import { getAllProducts } from './productStore';

const FILE = 'orders.json';

async function loadOrders(): Promise<Order[]> {
  return readJsonFile<Order[]>(FILE, []);
}

export async function saveOrder(params: {
  items: CartItem[];
  customerInfo: OrderForm;
  totalPrice: number;
  orderNumber: string;
}): Promise<Order> {
  const orders = await loadOrders();
  const order: Order = {
    id: params.orderNumber,
    orderNumber: params.orderNumber,
    createdAt: new Date().toISOString(),
    items: params.items,
    customerInfo: params.customerInfo,
    totalPrice: params.totalPrice,
    status: 'pending',
  };
  orders.unshift(order);
  await writeJsonFile(FILE, orders);
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
  const orders = await loadOrders();
  const index = orders.findIndex((o) => o.id === id || o.orderNumber === id);
  if (index === -1) throw new Error('Porudžbina nije pronađena');
  orders[index] = { ...orders[index], status };
  await writeJsonFile(FILE, orders);
  return orders[index];
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
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.availableForSale).length,
    avgOrderValue: revenueOrders.length ? Math.round(totalRevenue / revenueOrders.length) : 0,
    itemsSold,
    statusCounts,
    revenueByDay: days,
    topProducts,
    lowStockProducts,
    recentOrders: orders.slice(0, 8),
  };
}
