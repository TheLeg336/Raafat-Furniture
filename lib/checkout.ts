import { createOrder, type NewOrderInput } from './orders';
import { localized } from './format';
import { trackEvent } from './analytics';
import type { Order } from '../types';

export const STRIPE_PUBLISHABLE_KEY = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) || '';
export const stripeConfigured = () => !!STRIPE_PUBLISHABLE_KEY;

/** Map an Order to the email endpoint payload (matches server OrderEmailData). */
export function orderToEmailPayload(order: Order) {
  return {
    to: order.contact.email,
    orderNumber: order.orderNumber,
    customerName: order.contact.fullName,
    currency: order.currency,
    items: order.items.map((i) => ({
      name: typeof i.name === 'string' ? i.name : localized(i.name),
      quantity: i.quantity,
      price: i.price,
      color: i.color,
      material: i.material,
      customDimensions: i.customDimensions,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    fulfillment: order.fulfillment,
    paymentMethod: order.paymentMethod,
    contact: order.contact,
    storeName: 'Raafat Furniture',
    siteUrl: typeof location !== 'undefined' ? location.origin : '',
    orderUrl:
      typeof location !== 'undefined'
        ? `${location.origin}/order/confirmation?order=${order.orderNumber}`
        : '',
  };
}

export async function sendConfirmationEmail(order: Order): Promise<boolean> {
  try {
    const res = await fetch('/api/email/order-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderToEmailPayload(order)),
    });
    const json = await res.json().catch(() => ({}));
    return !!json.sent;
  } catch {
    return false;
  }
}

interface PlaceOrderResult {
  order: Order;
  redirected: boolean;
}

/**
 * Place an order. For Stripe: creates the order then redirects to Checkout
 * (email is sent by the webhook / confirmation page on return).
 * For direct methods (cash/bank): creates the order and sends the email now.
 */
export async function placeOrder(input: NewOrderInput): Promise<PlaceOrderResult> {
  const order = await createOrder(input);
  trackEvent('purchase', {
    transaction_id: order.orderNumber,
    value: order.total,
    currency: order.currency,
    items: order.items.map((i) => ({ item_name: typeof i.name === 'string' ? i.name : localized(i.name), quantity: i.quantity, price: i.price })),
  });

  if (input.paymentMethod === 'stripe') {
    const origin = location.origin;
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        items: order.items.map((i) => ({ name: typeof i.name === 'string' ? i.name : localized(i.name), price: i.price, quantity: i.quantity })),
        currency: order.currency,
        customerEmail: order.contact.email,
        successUrl: `${origin}/order/confirmation?order=${order.orderNumber}&paid=1`,
        cancelUrl: `${origin}/order/confirmation?order=${order.orderNumber}&cancelled=1`,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (json.url) {
      window.location.href = json.url;
      return { order, redirected: true };
    }
    // Stripe not configured / failed → fall through as an unpaid order with email.
    await sendConfirmationEmail(order);
    return { order, redirected: false };
  }

  await sendConfirmationEmail(order);
  return { order, redirected: false };
}
