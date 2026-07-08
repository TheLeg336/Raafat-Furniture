/**
 * Server-authoritative order engine.
 *
 * Everything money-related happens here, never in the browser:
 *   - prices come from the Firestore product catalog
 *   - tax is computed from the destination (Egypt VAT 14%, exports 0%)
 *   - order numbers are unique (reserved via orderNumbers/{n} create())
 *   - payment-method rules are enforced (cash only for Egypt pickup, shipping prepaid)
 *
 * Requires Firebase Admin (FIREBASE_SERVICE_ACCOUNT). Without it these endpoints
 * return 503 — there is deliberately no client-trusting fallback.
 */
import { Router, type Request, type Response } from 'express';
import { getDb, verifyIdToken } from './firebaseAdmin';
import { isBootstrapDeveloperEmail, normalizeStaffRole, type StaffRole } from '../lib/staff';
import { sendOrderConfirmation, sendOrderStatus, sendOrderMessage } from './email';
import { orderToEmail } from './orderEmail';

const STORE_COUNTRY = 'EG';
const EG_VAT_RATE = 0.14;
const ACTIVE_STATUSES = ['paid', 'confirmed', 'in_production'];

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

export function ipCountry(req: Request): string | null {
  const h = (req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry']) as string | undefined;
  return h && /^[A-Z]{2}$/i.test(h) ? h.toUpperCase() : null;
}

/** Normalize a country input to ISO2. Checkout sends ISO2; tolerate legacy names. */
export function toISO2(country?: string): string {
  if (!country) return 'XX';
  const c = country.trim();
  if (/^[A-Za-z]{2}$/.test(c)) return c.toUpperCase();
  const map: Record<string, string> = {
    egypt: 'EG', 'مصر': 'EG', usa: 'US', 'united states': 'US', 'united states of america': 'US',
    america: 'US', uk: 'GB', 'united kingdom': 'GB', uae: 'AE', 'united arab emirates': 'AE',
    'saudi arabia': 'SA', ksa: 'SA', canada: 'CA', france: 'FR', germany: 'DE', italy: 'IT',
    spain: 'ES', australia: 'AU', kuwait: 'KW', qatar: 'QA', bahrain: 'BH', oman: 'OM',
    jordan: 'JO', lebanon: 'LB',
  };
  return map[c.toLowerCase()] || c.slice(0, 2).toUpperCase();
}

/** Egypt VAT is included in retail prices; exports carry no Egyptian VAT. */
export function computeTax(subtotal: number, destination: string) {
  if (destination === STORE_COUNTRY) {
    const tax = round2(subtotal - subtotal / (1 + EG_VAT_RATE));
    return { tax, taxRate: EG_VAT_RATE, taxIncluded: true };
  }
  return { tax: 0, taxRate: 0, taxIncluded: false };
}

/** EG482913KY — country + 6 digits + random letter + customer initial. Never reused. */
async function reserveOrderNumber(db: FirebaseFirestore.Firestore, cc: string, fullName: string): Promise<string> {
  const { randomInt } = await import('node:crypto');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const initialRaw = (fullName.trim()[0] || 'X').toUpperCase();
  const initial = /[A-Z]/.test(initialRaw) ? initialRaw : 'X';
  for (let attempt = 0; attempt < 8; attempt++) {
    const digits = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const num = `${cc}${digits}${letters[randomInt(26)]}${initial}`;
    try {
      // create() throws if the doc exists → uniqueness is atomic.
      await db.collection('orderNumbers').doc(num).create({ reservedAt: new Date().toISOString() });
      return num;
    } catch { /* collision — retry */ }
  }
  throw new Error('Could not allocate an order number');
}

/** Verify Firebase token and role from the admins collection. */
export async function staffFromReq(req: Request): Promise<{ email: string; role: StaffRole } | null> {
  const db = await getDb();
  const decoded = await verifyIdToken(req.headers.authorization);
  if (!decoded?.email) return null;
  const email = decoded.email.toLowerCase();
  if (isBootstrapDeveloperEmail(email, decoded.email_verified === true)) {
    return { email, role: 'developer' };
  }
  if (!db) return null;
  const snap = await db.collection('admins').doc(email).get();
  if (!snap.exists) return null;
  const role = normalizeStaffRole(snap.data()?.role);
  if (!role) return null;
  return { email, role };
}

export const isAdminRole = (r: StaffRole) => r === 'admin' || r === 'developer';

function trackView(o: any, id: string) {
  return {
    id,
    orderNumber: o.orderNumber, createdAt: o.createdAt, updatedAt: o.updatedAt,
    status: o.status, statusHistory: o.statusHistory, paymentStatus: o.paymentStatus,
    paymentMethod: o.paymentMethod, fulfillment: o.fulfillment, items: o.items,
    subtotal: o.subtotal, shipping: o.shipping, tax: o.tax, taxRate: o.taxRate,
    taxIncluded: o.taxIncluded, total: o.total, currency: o.currency,
    destinationCountry: o.destinationCountry, tracking: o.tracking || null,
    contact: { fullName: o.contact?.fullName, email: o.contact?.email },
  };
}

/** Spec-only view for the workshop: no prices, no customer contact — notes OK for production. */
function workerView(o: any, id: string) {
  return {
    id,
    orderNumber: o.orderNumber, createdAt: o.createdAt, status: o.status,
    fulfillment: o.fulfillment, prepared: o.prepared || [], customerNote: o.customerNote || '',
    items: (o.items || []).map((it: any) => ({
      name: it.name, quantity: it.quantity, color: it.color || '',
      material: it.material || '', customDimensions: it.customDimensions || '', imageUrl: it.imageUrl || '',
    })),
  };
}

async function findOrderForGuest(db: FirebaseFirestore.Firestore, orderNumber: string, email: string) {
  if (!orderNumber || !email) return null;
  const q = await db.collection('orders').where('orderNumber', '==', String(orderNumber).toUpperCase().trim()).limit(1).get();
  if (q.empty) return null;
  const doc = q.docs[0];
  const data = doc.data() as any;
  if ((data.contact?.email || '').toLowerCase() !== String(email).toLowerCase().trim()) return null;
  return { doc, data };
}

async function appendStatus(ref: FirebaseFirestore.DocumentReference, current: any, status: string, by: string, note?: string, extra: Record<string, any> = {}) {
  const now = new Date().toISOString();
  await ref.update({
    status,
    statusHistory: [...(current.statusHistory || []), { status, at: now, by, ...(note ? { note } : {}) }],
    updatedAt: now,
    ...extra,
  });
}

// ---------------------------------------------------------------------------
// router
// ---------------------------------------------------------------------------

export function ordersRouter(rateLimit: (n: number) => any) {
  const r = Router();

  /** Client bootstrap: which payment rails are live + geo gate for cash. */
  r.get('/api/config', async (req: Request, res: Response) => {
    const country = ipCountry(req);
    const stripe = !!process.env.STRIPE_SECRET_KEY;
    const paymob = !!(process.env.PAYMOB_API_KEY && process.env.PAYMOB_INTEGRATION_ID && process.env.PAYMOB_IFRAME_ID);
    res.json({
      stripe, paymob,
      cardProvider: paymob && country === 'EG' ? 'paymob' : stripe ? 'stripe' : paymob ? 'paymob' : null,
      ipCountry: country,
      // Cash on pickup is Egypt-only. Outside prod there is no geo header — allow for dev.
      cashPickupAllowed: country === 'EG' || (!country && process.env.NODE_ENV !== 'production'),
      ordersConfigured: !!(await getDb()),
    });
  });

  r.post('/api/orders/create', rateLimit(10), async (req: Request, res: Response) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Ordering is not configured on the server (FIREBASE_SERVICE_ACCOUNT missing).' });
    try {
      const { items, contact, fulfillment, paymentMethod, customerNote, pickupLocationId } = req.body || {};
      const decoded = await verifyIdToken(req.headers.authorization);
      const userId = decoded?.uid ?? null;

      // ---- shape validation ----
      if (!Array.isArray(items) || items.length === 0 || items.length > 50) return res.status(400).json({ error: 'Invalid items' });
      if (!contact?.fullName || String(contact.fullName).length > 120) return res.status(400).json({ error: 'Name is required' });
      if (!/^\S+@\S+\.\S+$/.test(contact?.email || '')) return res.status(400).json({ error: 'Valid email is required' });
      if (!contact?.phone || String(contact.phone).trim().length < 6) return res.status(400).json({ error: 'Phone is required' });
      if (!['pickup', 'shipping', 'custom'].includes(fulfillment)) return res.status(400).json({ error: 'Invalid fulfillment' });
      if (fulfillment === 'pickup' && !pickupLocationId) return res.status(400).json({ error: 'Pickup location is required' });
      if (fulfillment !== 'pickup' && (!contact?.line1 || !contact?.city || !contact?.country)) {
        return res.status(400).json({ error: 'Address (street, city, country) is required' });
      }

      // ---- payment-method rules (no cash — prepaid / transfer only) ----
      const geo = ipCountry(req);
      const allowed = ['stripe', 'paymob', 'instapay', 'bank_transfer'];
      if (!allowed.includes(paymentMethod)) return res.status(400).json({ error: 'Payment method not available for this order' });
      if (paymentMethod === 'stripe' && !process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: 'Card payments are not configured' });
      if (paymentMethod === 'paymob' && !process.env.PAYMOB_API_KEY) return res.status(400).json({ error: 'Card payments are not configured' });
      // InstaPay is Egypt-oriented; still allow if customer chose EG destination/pickup.
      if (paymentMethod === 'instapay') {
        const destPreview = fulfillment === 'shipping' ? toISO2(contact.country) : STORE_COUNTRY;
        if (destPreview !== 'EG' && geo && geo !== 'EG') {
          return res.status(400).json({ error: 'InstaPay is only available for Egypt orders' });
        }
      }

      // Charge currency is locked to the verified destination, not anything the client says.
      const destination = fulfillment === 'shipping' ? toISO2(contact.country) : STORE_COUNTRY;
      const currency = destination === 'EG' ? 'EGP' : 'USD';

      // ---- authoritative pricing from the catalog (per-currency) ----
      const priced = [];
      for (const it of items) {
        if ('price' in it || 'total' in it || 'subtotal' in it) {
          return res.status(400).json({ error: 'Invalid items payload' });
        }
        const qty = Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1)));
        const snap = await db.collection('products').doc(String(it.productId)).get();
        if (!snap.exists) return res.status(400).json({ error: `Product no longer available (${it.productId})` });
        const p = snap.data() as any;
        const raw = currency === 'EGP' ? (p.priceEGP ?? p.price) : (p.priceUSD ?? p.price);
        const price = Number(raw);
        if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: `Item is not available in ${currency} (${it.productId})` });
        priced.push({
          productId: String(it.productId),
          name: p.name || p.nameKey || 'Item',
          imageUrl: p.imageUrl || '',
          price, quantity: qty,
          ...(it.color ? { color: String(it.color).slice(0, 60) } : {}),
          ...(it.material ? { material: String(it.material).slice(0, 60) } : {}),
          ...(it.customDimensions && p.customDimensionsEnabled ? { customDimensions: String(it.customDimensions).slice(0, 120) } : {}),
        });
      }

      const subtotal = round2(priced.reduce((s, it) => s + it.price * it.quantity, 0));
      const shipping = 0; // quoted by the store after order; not charged online yet
      const { tax, taxRate, taxIncluded } = computeTax(subtotal, destination);
      const total = round2(subtotal + shipping + (taxIncluded ? 0 : tax));

      const numberCountry = fulfillment === 'shipping' ? destination : toISO2(contact.country) === 'XX' ? STORE_COUNTRY : toISO2(contact.country);
      const orderNumber = await reserveOrderNumber(db, numberCountry, String(contact.fullName));

      const now = new Date().toISOString();
      const initialStatus =
        paymentMethod === 'stripe' || paymentMethod === 'paymob' ? 'pending_payment'
        : paymentMethod === 'instapay' || paymentMethod === 'bank_transfer' ? 'pending_payment'
        : 'confirmed';

      const order = {
        orderNumber, userId,
        items: priced,
        currency,
        subtotal, shipping, tax, taxRate, taxIncluded, total,
        destinationCountry: destination,
        fulfillment, paymentMethod,
        paymentStatus: 'unpaid',
        status: initialStatus,
        statusHistory: [{ status: initialStatus, at: now, by: 'system' }],
        contact: {
          fullName: String(contact.fullName).slice(0, 120),
          email: String(contact.email).slice(0, 254),
          phone: String(contact.phone).slice(0, 40),
          line1: String(contact.line1).slice(0, 200),
          city: String(contact.city).slice(0, 80),
          governorate: String(contact.governorate || '').slice(0, 80),
          country: toISO2(contact.country),
          postalCode: String(contact.postalCode || '').slice(0, 20),
        },
        customerNote: String(customerNote || '').slice(0, 1000),
        ...(fulfillment === 'pickup' && pickupLocationId ? { pickupLocationId: String(pickupLocationId).slice(0, 40) } : {}),
        adminNotes: '',
        prepared: [],
        messages: [],
        unreadCustomerReplies: 0,
        createdAt: now, updatedAt: now,
        ipCountry: geo || '',
      };

      const ref = await db.collection('orders').add(order);
      await db.collection('orderNumbers').doc(orderNumber).update({ orderId: ref.id });

      // Direct methods get their confirmation immediately (instapay/bank emails show
      // "awaiting payment"); gateway confirmations go out when payment lands.
      if (['instapay', 'bank_transfer'].includes(paymentMethod)) {
        let instapayAddress = '';
        try {
          const paySnap = await db.collection('settings').doc('payments').get();
          if (paySnap.exists) instapayAddress = String(paySnap.data()?.instapayAddress || '');
        } catch { /* optional */ }
        sendOrderConfirmation(order.contact.email, orderToEmail(order, { instapayAddress })).catch(() => {});
      }
      res.json({ order: { id: ref.id, ...order, messages: [], unreadCustomerReplies: 0 } });
    } catch (e: any) {
      console.error('[orders/create]', e.message);
      res.status(500).json({ error: 'Could not place the order. Please try again.' });
    }
  });

  /** Guest-safe order lookup: needs the order number AND the email on the order. */
  r.post('/api/orders/track', rateLimit(15), async (req: Request, res: Response) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Not configured' });
    const found = await findOrderForGuest(db, req.body?.orderNumber, req.body?.email);
    if (!found) return res.status(404).json({ error: 'No order matches that number and email.' });
    res.json({ order: trackView(found.data, found.doc.id) });
  });

  /** Customer submits their Instapay / bank transfer reference. */
  r.post('/api/orders/payment-reference', rateLimit(10), async (req: Request, res: Response) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Not configured' });
    const reference = String(req.body?.reference || '').trim().slice(0, 120);
    if (!reference) return res.status(400).json({ error: 'Reference is required' });
    const found = await findOrderForGuest(db, req.body?.orderNumber, req.body?.email);
    if (!found) return res.status(404).json({ error: 'No order matches that number and email.' });
    const { doc, data } = found;
    if (!['instapay', 'bank_transfer'].includes(data.paymentMethod)) return res.status(400).json({ error: 'This order is not paid by transfer.' });
    if (data.paymentStatus === 'paid') return res.status(400).json({ error: 'This order is already paid.' });
    await appendStatus(doc.ref, data, 'payment_verification', 'customer', `Payment reference: ${reference}`, { 'payment.reference': reference });
    res.json({ ok: true });
  });

  /** Admin: approve a finished order → notify customer (ready) or add tracking (shipped). */
  r.post('/api/admin/orders/:id/notify', rateLimit(30), async (req: Request, res: Response) => {
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await getDb())!;
    const ref = db.collection('orders').doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' });
    const order = snap.data() as any;
    const type = req.body?.type as 'ready' | 'shipped';
    if (type === 'ready') {
      await appendStatus(ref, order, 'ready', staff.email, 'Customer notified: ready for pickup');
      await sendOrderStatus(order.contact.email, order, 'ready');
    } else if (type === 'shipped') {
      const trackingNumber = String(req.body?.trackingNumber || '').trim().slice(0, 80);
      if (!trackingNumber) return res.status(400).json({ error: 'Tracking number is required' });
      const carrier = String(req.body?.carrier || '').trim().slice(0, 60);
      await appendStatus(ref, order, 'shipped', staff.email, `Tracking: ${trackingNumber}`, { tracking: { number: trackingNumber, ...(carrier ? { carrier } : {}) } });
      await sendOrderStatus(order.contact.email, { ...order, tracking: { number: trackingNumber, carrier } }, 'shipped');
    } else {
      return res.status(400).json({ error: 'type must be ready or shipped' });
    }
    res.json({ ok: true });
  });

  /** Admin: email the customer and store the message on the order thread. */
  r.post('/api/admin/orders/:id/message', rateLimit(30), async (req: Request, res: Response) => {
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: 'Unauthorized' });
    const body = String(req.body?.body || '').trim().slice(0, 4000);
    if (!body) return res.status(400).json({ error: 'Message body is required' });
    const db = (await getDb())!;
    const ref = db.collection('orders').doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' });
    const order = snap.data() as any;
    const email = order.contact?.email;
    if (!email) return res.status(400).json({ error: 'Order has no customer email' });
    const now = new Date().toISOString();
    const msg = {
      id: `m_${Date.now().toString(36)}`,
      from: 'admin' as const,
      body,
      at: now,
      by: staff.email,
      emailSent: false,
    };
    const sent = await sendOrderMessage(email, {
      orderNumber: order.orderNumber,
      customerName: order.contact?.fullName || '',
      body,
      orderId: snap.id,
    });
    msg.emailSent = sent;
    await ref.update({
      messages: [...(order.messages || []), msg],
      updatedAt: now,
    });
    res.json({ ok: true, message: msg, emailed: sent });
  });

  /** Admin: clear unread customer-reply badge after opening the thread. */
  r.post('/api/admin/orders/:id/messages/read', rateLimit(60), async (req: Request, res: Response) => {
    const staff = await staffFromReq(req);
    if (!staff || !isAdminRole(staff.role)) return res.status(401).json({ error: 'Unauthorized' });
    const db = (await getDb())!;
    await db.collection('orders').doc(String(req.params.id)).update({
      unreadCustomerReplies: 0,
      updatedAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  });

  /** Workshop list: active orders, specs only — no prices, no customer contact. */
  r.get('/api/worker/orders', rateLimit(60), async (req: Request, res: Response) => {
    const staff = await staffFromReq(req);
    if (!staff) return res.status(401).json({ error: 'Unauthorized' });
    if (staff.role !== 'worker' && !isAdminRole(staff.role)) return res.status(403).json({ error: 'Forbidden' });
    const db = (await getDb())!;
    const q = await db.collection('orders').where('status', 'in', ACTIVE_STATUSES).get();
    const orders = q.docs
      .map((d) => workerView(d.data(), d.id))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // oldest first
    res.json({ orders });
  });

  /** Workshop checklist autosave (workers have no direct Firestore write access). */
  r.post('/api/worker/orders/:id/prepared', rateLimit(120), async (req: Request, res: Response) => {
    const staff = await staffFromReq(req);
    if (!staff) return res.status(401).json({ error: 'Unauthorized' });
    if (staff.role !== 'worker' && !isAdminRole(staff.role)) return res.status(403).json({ error: 'Forbidden' });
    const db = (await getDb())!;
    const ref = db.collection('orders').doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' });
    const order = snap.data() as any;
    if (!ACTIVE_STATUSES.includes(order.status)) {
      return res.status(400).json({ error: 'Order is not in an active workshop status' });
    }
    const itemCount = (order.items || []).length;
    const prepared = Array.isArray(req.body?.prepared)
      ? [...new Set(req.body.prepared.map(Number).filter((n: number) => Number.isInteger(n) && n >= 0 && n < itemCount))]
      : [];
    await ref.update({ prepared, updatedAt: new Date().toISOString() });
    res.json({ ok: true, prepared });
  });

  /** Workshop marks the order fully prepared → awaiting admin approval. */
  r.post('/api/worker/orders/:id/complete', rateLimit(30), async (req: Request, res: Response) => {
    const staff = await staffFromReq(req);
    if (!staff) return res.status(401).json({ error: 'Unauthorized' });
    if (staff.role !== 'worker' && !isAdminRole(staff.role)) return res.status(403).json({ error: 'Forbidden' });
    const db = (await getDb())!;
    const ref = db.collection('orders').doc(String(req.params.id));
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Order not found' });
    const order = snap.data() as any;
    if (!ACTIVE_STATUSES.includes(order.status)) {
      return res.status(400).json({ error: 'Order is not in an active workshop status' });
    }
    const prepared: number[] = order.prepared || [];
    if ((order.items || []).some((_: any, i: number) => !prepared.includes(i))) {
      return res.status(400).json({ error: 'All items must be checked off first.' });
    }
    await appendStatus(ref, order, 'awaiting_approval', staff.email, 'Workshop checklist complete');
    res.json({ ok: true });
  });

  /** Contact form → store inbox. */
  r.post('/api/contact', rateLimit(5), async (req: Request, res: Response) => {
    const { name, email, message } = req.body || {};
    if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || !message) return res.status(400).json({ error: 'Name, valid email and message are required' });
    const { sendPlain } = await import('./email');
    const ok = await sendPlain(
      process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || '',
      `Website contact from ${String(name).slice(0, 80)}`,
      `From: ${String(name).slice(0, 80)} <${String(email).slice(0, 254)}>\n\n${String(message).slice(0, 4000)}`,
      String(email).slice(0, 254),
    );
    res.json({ sent: ok });
  });

  return r;
}
