import { createOrder, type NewOrderInput } from './orders';
import { apiFetch } from './api';
import { localized } from './format';
import { trackEvent } from './analytics';
import type { Order } from '../types';

/**
 * Remember the email used for an order so the confirmation page can look it up
 * through the guest-safe /api/orders/track endpoint after redirects/reloads.
 */
export function rememberOrderEmail(orderNumber: string, email: string) {
  try { sessionStorage.setItem(`rf_order_email_${orderNumber}`, email); } catch { /* private mode */ }
}
export function recallOrderEmail(orderNumber: string): string {
  try { return sessionStorage.getItem(`rf_order_email_${orderNumber}`) || ''; } catch { return ''; }
}

export async function sendConfirmationEmail(order: Order): Promise<boolean> {
  try {
    const json = await apiFetch<{ sent: boolean }>('/api/email/order-confirmation', {
      orderNumber: order.orderNumber,
      email: order.contact.email,
    });
    return !!json.sent;
  } catch {
    return false;
  }
}

/** Ask the server to reconcile a Stripe payment on return from checkout. */
export async function syncStripePayment(orderNumber: string, email: string): Promise<boolean> {
  try {
    const json = await apiFetch<{ paid: boolean }>('/api/stripe/sync', { orderNumber, email });
    return !!json.paid;
  } catch {
    return false;
  }
}

interface PlaceOrderResult {
  order: Order;
  redirected: boolean;
  /** Set when the order was created but the payment gateway could not start. */
  paymentError?: string;
}

/**
 * Place an order (server computes prices/tax/number). Card methods redirect to
 * the gateway; direct methods land on the confirmation page.
 */
export async function placeOrder(input: NewOrderInput): Promise<PlaceOrderResult> {
  const order = await createOrder(input);
  rememberOrderEmail(order.orderNumber, order.contact.email);
  trackEvent('purchase', {
    transaction_id: order.orderNumber,
    value: order.total,
    currency: order.currency,
    items: order.items.map((i) => ({ item_name: typeof i.name === 'string' ? i.name : localized(i.name), quantity: i.quantity, price: i.price })),
  });

  const origin = location.origin;
  const successUrl = `${origin}/order/confirmation?order=${order.orderNumber}&paid=1`;
  const cancelUrl = `${origin}/order/confirmation?order=${order.orderNumber}&cancelled=1`;

  if (input.paymentMethod === 'stripe') {
    try {
      const json = await apiFetch<{ url?: string }>('/api/stripe/create-checkout-session', {
        orderId: order.id, successUrl, cancelUrl,
      });
      if (json.url) {
        window.location.href = json.url;
        return { order, redirected: true };
      }
    } catch (e: any) {
      return { order, redirected: false, paymentError: e?.message || 'Card payment could not start.' };
    }
  }

  if (input.paymentMethod === 'paymob') {
    try {
      const json = await apiFetch<{ url?: string }>('/api/paymob/create-payment', { orderId: order.id });
      if (json.url) {
        window.location.href = json.url;
        return { order, redirected: true };
      }
    } catch (e: any) {
      return { order, redirected: false, paymentError: e?.message || 'Card payment could not start.' };
    }
  }

  return { order, redirected: false };
}
