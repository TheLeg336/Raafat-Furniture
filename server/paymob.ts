/**
 * Paymob (Egypt) hosted-checkout integration.
 * Env: PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID, PAYMOB_HMAC_SECRET.
 * Flow: auth token → register order (amount from OUR database) → payment key →
 * iframe URL. The transaction webhook is HMAC-SHA512 verified before marking paid.
 */
import { Router, type Request, type Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getDb } from './firebaseAdmin';
import { sendOrderConfirmation } from './email';
import { orderToEmail } from './orderEmail';

const BASE = 'https://accept.paymob.com/api';

export const paymobConfigured = () =>
  !!(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID && process.env.PAYMOB_IFRAME_ID);

async function pm(path: string, body: any): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Paymob ${path} → ${res.status}`);
  return res.json();
}

export function paymobRouter(rateLimit: (n: number) => any) {
  const r = Router();

  r.post('/api/paymob/create-payment', rateLimit(10), async (req: Request, res: Response) => {
    if (!paymobConfigured()) return res.status(503).json({ error: 'Paymob is not configured.' });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Ordering is not configured on the server.' });
    try {
      const orderId = String(req.body?.orderId || '');
      const snap = await db.collection('orders').doc(orderId).get();
      if (!snap.exists) return res.status(404).json({ error: 'Order not found' });
      const order = snap.data() as any;
      if (order.paymentStatus === 'paid') return res.status(400).json({ error: 'Order already paid' });

      const amountCents = Math.round(Number(order.total) * 100); // server-side total only
      const { token } = await pm('/auth/tokens', { api_key: process.env.PAYMOB_API_KEY });
      const reg = await pm('/ecommerce/orders', {
        auth_token: token,
        delivery_needed: 'false',
        amount_cents: String(amountCents),
        currency: order.currency || 'EGP',
        merchant_order_id: `${orderId}-${Date.now()}`, // Paymob requires uniqueness across retries
        items: [],
      });
      const [first = '', ...rest] = String(order.contact?.fullName || 'Customer').split(' ');
      const key = await pm('/acceptance/payment_keys', {
        auth_token: token,
        amount_cents: String(amountCents),
        expiration: 3600,
        order_id: reg.id,
        currency: order.currency || 'EGP',
        integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
        billing_data: {
          first_name: first || 'Customer', last_name: rest.join(' ') || 'NA',
          email: order.contact?.email || 'NA', phone_number: order.contact?.phone || 'NA',
          street: order.contact?.line1 || 'NA', city: order.contact?.city || 'NA',
          country: order.contact?.country || 'EG',
          apartment: 'NA', floor: 'NA', building: 'NA', shipping_method: 'NA', postal_code: order.contact?.postalCode || 'NA', state: order.contact?.governorate || 'NA',
        },
      });
      await snap.ref.update({ 'paymobOrderId': reg.id, updatedAt: new Date().toISOString() });
      res.json({ url: `${BASE.replace('/api', '')}/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${key.token}` });
    } catch (e: any) {
      console.error('[paymob] create-payment:', e.message);
      res.status(500).json({ error: 'Could not start card payment.' });
    }
  });

  /** Transaction-processed callback. HMAC per Paymob docs (SHA512 over ordered fields). */
  r.post('/api/paymob/webhook', async (req: Request, res: Response) => {
    const secret = process.env.PAYMOB_HMAC_SECRET || '';
    const obj = req.body?.obj;
    if (!secret || !obj) return res.status(400).json({ error: 'Bad request' });
    const fields = [
      obj.amount_cents, obj.created_at, obj.currency, obj.error_occured, obj.has_parent_transaction,
      obj.id, obj.integration_id, obj.is_3d_secure, obj.is_auth, obj.is_capture, obj.is_refunded,
      obj.is_standalone_payment, obj.is_voided, obj.order?.id, obj.owner, obj.pending,
      obj.source_data?.pan, obj.source_data?.sub_type, obj.source_data?.type, obj.success,
    ].map((v) => String(v)).join('');
    const digest = createHmac('sha512', secret).update(fields).digest('hex');
    const provided = String(req.query.hmac || req.body?.hmac || '');
    // Constant-time compare (both are hex of equal length when valid).
    const ok = provided.length === digest.length &&
      timingSafeEqual(Buffer.from(digest), Buffer.from(provided));
    if (!ok) {
      console.error('[paymob] webhook HMAC mismatch');
      return res.status(401).json({ error: 'Invalid HMAC' });
    }
    if (obj.success === true && obj.pending === false) {
      const db = await getDb();
      const merchantId = String(obj.order?.merchant_order_id || '').split('-')[0];
      if (db && merchantId) {
        const ref = db.collection('orders').doc(merchantId);
        const snap = await ref.get();
        if (snap.exists && (snap.data() as any).paymentStatus !== 'paid') {
          const order = snap.data() as any;
          const now = new Date().toISOString();
          await ref.update({
            paymentStatus: 'paid', status: 'paid',
            statusHistory: [...(order.statusHistory || []), { status: 'paid', at: now, by: 'system', note: 'Paymob payment received' }],
            updatedAt: now,
          });
          if (order.contact?.email) await sendOrderConfirmation(order.contact.email, orderToEmail(order));
        }
      }
    }
    res.json({ received: true });
  });

  return r;
}
