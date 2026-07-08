import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { apiFetch } from './api';
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
  'payment_verification',
  'paid',
  'confirmed',
  'in_production',
  'awaiting_approval',
  'ready',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
];

/** Statuses an order can sit in before it is done. */
export const OPEN_STATUSES: OrderStatus[] = [
  'pending_payment', 'payment_verification', 'paid', 'confirmed', 'in_production', 'awaiting_approval', 'ready', 'shipped',
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
  pickupLocationId?: string;
  shipping?: number;
  tax?: number;
  currency?: string;
}

export function computeTotals(items: OrderItem[], shipping = 0, tax = 0) {
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}

/**
 * Creates an order via the server API. The server is authoritative for prices,
 * tax, totals and the order number — nothing money-related is trusted from here.
 */
export async function createOrder(input: NewOrderInput): Promise<Order> {
  const { order } = await apiFetch<{ order: Order }>('/api/orders/create', {
    items: input.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      color: it.color,
      material: it.material,
      customDimensions: it.customDimensions,
    })),
    contact: input.contact,
    fulfillment: input.fulfillment,
    paymentMethod: input.paymentMethod,
    customerNote: input.customerNote,
    pickupLocationId: input.pickupLocationId,
  });
  return order;
}

/** Guest-safe order lookup through the server (order number + email). */
export async function trackOrder(orderNumber: string, email: string): Promise<Order | null> {
  try {
    const { order } = await apiFetch<{ order: Order }>('/api/orders/track', { orderNumber, email });
    return order;
  } catch {
    return null;
  }
}

/** Submit an Instapay / bank transfer reference for verification. */
export async function submitPaymentReference(orderNumber: string, email: string, reference: string): Promise<void> {
  await apiFetch('/api/orders/payment-reference', { orderNumber, email, reference });
}

/** Admin: approve + notify (ready for pickup, or shipped with tracking). */
export async function notifyOrder(orderId: string, type: 'ready' | 'shipped', trackingNumber?: string, carrier?: string): Promise<void> {
  await apiFetch(`/api/admin/orders/${orderId}/notify`, { type, trackingNumber, carrier });
}

/** Admin: autosave the per-item preparation checklist. */
export async function setPrepared(orderId: string, prepared: number[]): Promise<void> {
  if (!db) throw new Error('Database not configured');
  await updateDoc(doc(db, 'orders', orderId), { prepared, updatedAt: new Date().toISOString() });
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'orders', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null;
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
export function subscribeAllOrders(
  cb: (orders: Order[]) => void,
  onError?: (message: string) => void,
) {
  if (!db) {
    onError?.('Firebase is not configured — add VITE_FIREBASE_* to .env');
    return () => {};
  }
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))),
    (err) => {
      console.error('Admin orders subscription failed:', err);
      const msg = err.code === 'permission-denied'
        ? 'Permission denied — your account must be in the admins collection (Admin → Team, or Firebase Console).'
        : (err.message || 'Could not load orders');
      onError?.(msg);
      cb([]);
    },
  );
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

/** Admin: email the customer and store the message on the order thread. */
export async function sendOrderCustomerMessage(orderId: string, body: string): Promise<{ emailed: boolean }> {
  return apiFetch(`/api/admin/orders/${orderId}/message`, { body });
}

/** Admin: clear unread customer-reply badge. */
export async function markOrderMessagesRead(orderId: string): Promise<void> {
  await apiFetch(`/api/admin/orders/${orderId}/messages/read`, {});
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
