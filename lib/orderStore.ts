import { readJsonFile, writeJsonFile } from './db';
import { AdminStats, CartItem, Order, OrderForm } from './types';
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

export async function getAdminStats(): Promise<AdminStats> {
  const [orders, products] = await Promise.all([loadOrders(), getAllProducts()]);

  const completedStatuses: Order['status'][] = ['confirmed', 'shipped', 'delivered'];
  const revenueOrders = orders.filter((o) => o.status !== 'cancelled');

  const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const todayOrdersList = orders.filter((o) => isToday(o.createdAt));
  const todayRevenue = todayOrdersList
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  return {
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    todayRevenue,
    todayOrders: todayOrdersList.length,
    totalProducts: products.length,
    recentOrders: orders.slice(0, 8),
  };
}
