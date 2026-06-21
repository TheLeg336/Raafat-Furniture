import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateOrderNumber, STORE_CURRENCY } from './format';
import type {
  Order,
  OrderContact,
  OrderItem,
  OrderStatus,
  FulfillmentType,
  PaymentMethod,
} from '../types';

export const ORDER_STATUSES: OrderStatus[] = [
  'pending_payment',
  'paid',
  'confirmed',
  'in_production',
  'ready',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
];

/** Statuses a customer-facing order moves through, in order, for the timeline UI. */
export const ORDER_FLOW: OrderStatus[] = [
  'paid',
  'confirmed',
  'in_production',
  'ready',
  'shipped',
  'completed',
];

export interface NewOrderInput {
  items: OrderItem[];
  contact: OrderContact;
  fulfillment: FulfillmentType;
  paymentMethod: PaymentMethod;
  userId?: string | null;
  customerNote?: string;
  shipping?: number;
  tax?: number;
  currency?: string;
}

export function computeTotals(items: OrderItem[], shipping = 0, tax = 0) {
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}

/**
 * Creates an order document. Returns the order with its Firestore id + orderNumber.
 * Payment status starts 'unpaid'; the Stripe webhook (or an admin) marks it paid.
 */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  if (!db) throw new Error('Database not configured');
  const now = new Date().toISOString();
  const orderNumber = generateOrderNumber();
  const totals = computeTotals(input.items, input.shipping || 0, input.tax || 0);
  const initialStatus: OrderStatus =
    input.paymentMethod === 'stripe' ? 'pending_payment' : 'confirmed';

  const order: Omit<Order, 'id'> = {
    orderNumber,
    userId: input.userId ?? null,
    items: input.items,
    currency: input.currency || STORE_CURRENCY,
    ...totals,
    fulfillment: input.fulfillment,
    paymentMethod: input.paymentMethod,
    paymentStatus: 'unpaid',
    status: initialStatus,
    statusHistory: [{ status: initialStatus, at: now, by: 'system' }],
    contact: input.contact,
    customerNote: input.customerNote || '',
    adminNotes: '',
    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, 'orders'), order);
  return { ...order, id: ref.id };
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'orders', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
}

/** Look up an order by its human order number (for the confirmation page / guest lookup). */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  if (!db) return null;
  const q = query(collection(db, 'orders'), where('orderNumber', '==', orderNumber));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Order;
}

/** Live subscription to a user's own orders. */
export function subscribeUserOrders(userId: string, cb: (orders: Order[]) => void) {
  if (!db) return () => {};
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))));
}

/** Live subscription to all orders (admin). */
export function subscribeAllOrders(cb: (orders: Order[]) => void) {
  if (!db) return () => {};
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))));
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  by: string,
  note?: string,
  current?: Order,
) {
  if (!db) throw new Error('Database not configured');
  const now = new Date().toISOString();
  const event = { status, at: now, by, ...(note ? { note } : {}) };
  const history = [...(current?.statusHistory || []), event];
  const patch: Record<string, any> = {
    status,
    statusHistory: history,
    updatedAt: now,
  };
  if (status === 'paid' || status === 'completed') patch.paymentStatus = 'paid';
  if (status === 'refunded') patch.paymentStatus = 'refunded';
  await updateDoc(doc(db, 'orders', id), patch);
}

export async function setAdminNotes(id: string, adminNotes: string) {
  if (!db) throw new Error('Database not configured');
  await updateDoc(doc(db, 'orders', id), { adminNotes, updatedAt: new Date().toISOString() });
}

/** CSV export of orders for the admin dashboard. */
export function ordersToCSV(orders: Order[]): string {
  const head = [
    'Order Number',
    'Date',
    'Status',
    'Payment',
    'Fulfillment',
    'Customer',
    'Email',
    'Phone',
    'Items',
    'Total',
    'Currency',
  ];
  const rows = orders.map((o) => [
    o.orderNumber,
    o.createdAt,
    o.status,
    o.paymentStatus,
    o.fulfillment,
    o.contact.fullName,
    o.contact.email,
    o.contact.phone,
    o.items.reduce((n, i) => n + i.quantity, 0).toString(),
    o.total.toFixed(2),
    o.currency,
  ]);
  return [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
