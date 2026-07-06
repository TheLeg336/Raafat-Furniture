/**
 * Shared API app — mounted by server.ts locally and exported as a Vercel
 * serverless function via api/index.ts (previously the Express server never ran
 * on Vercel, so every /api route was dead in production).
 */
import express, { type Request, type Response, type NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { sendOrderConfirmation } from './email';
import { verifyIdToken, getDb } from './firebaseAdmin';
import { orderToEmail } from './orderEmail';
import { ordersRouter } from './ordersApi';
import { paymobRouter } from './paymob';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// gemini-3-flash-preview was decommissioned. gemini-2.5-flash is the current
// free-tier default; override with GEMINI_MODEL (e.g. gemini-2.0-flash) if needed.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const isProd = process.env.NODE_ENV === 'production';

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET,
});

let stripeClient: any = null;
export async function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  if (stripeClient) return stripeClient;
  const { default: Stripe } = await import('stripe');
  stripeClient = new Stripe(STRIPE_SECRET_KEY);
  return stripeClient;
}

// ---- lightweight in-memory rate limiter (per IP, per window) ----
// ponytail: in-memory is per-instance; move to KV if serverless abuse shows up
export function rateLimit(maxPerMinute: number) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now > entry.reset) {
      hits.set(ip, { count: 1, reset: now + 60_000 });
      return next();
    }
    if (entry.count >= maxPerMinute) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
    entry.count++;
    next();
  };
}

async function markOrderPaid(orderId: string, note: string, stripeData?: { sessionId?: string; paymentIntentId?: string }) {
  const db = await getDb();
  if (!db || !orderId) return;
  const now = new Date().toISOString();
  const ref = db.collection('orders').doc(orderId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const order = snap.data() as any;
  if (order.paymentStatus === 'paid') return;
  await ref.update({
    paymentStatus: 'paid',
    status: 'paid',
    ...(stripeData?.sessionId ? { 'stripe.sessionId': stripeData.sessionId } : {}),
    ...(stripeData?.paymentIntentId ? { 'stripe.paymentIntentId': stripeData.paymentIntentId } : {}),
    statusHistory: [...(order.statusHistory || []), { status: 'paid', at: now, by: 'system', note }],
    updatedAt: now,
  });
  if (order.contact?.email) await sendOrderConfirmation(order.contact.email, orderToEmail(order));
}

/** Shared by the dev server raw route and the Vercel webhook function. */
export async function handleStripeEvent(rawBody: Buffer, signature: string): Promise<{ status: number; body: any }> {
  const stripe = await getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return { status: 503, body: { error: 'Stripe webhook not configured' } };
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[stripe] webhook signature verification failed:', err.message);
    return { status: 400, body: `Webhook Error: ${err.message}` };
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await markOrderPaid(session.metadata?.orderId, 'Stripe payment received', {
        sessionId: session.id,
        paymentIntentId: (session.payment_intent as string) || '',
      });
    } catch (e) {
      console.error('[stripe] webhook handling error:', (e as Error).message);
    }
  }
  return { status: 200, body: { received: true } };
}

export function createApiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Stripe webhook needs the RAW body — mount BEFORE express.json (dev/self-host path;
  // on Vercel this route is served by api/stripe-webhook.ts instead).
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const { status, body } = await handleStripeEvent(req.body, req.headers['stripe-signature'] as string);
    res.status(status).send(body);
  });

  app.use(express.json({ limit: '1mb' }));

  app.use(ordersRouter(rateLimit));
  app.use(paymobRouter(rateLimit));

  // ---- Cloudinary delete (admin only) ----
  app.post('/api/cloudinary/delete', rateLimit(30), async (req: Request, res: Response) => {
    const decoded = await verifyIdToken(req.headers.authorization);
    const adminDb = await getDb();
    if (adminDb && !decoded) return res.status(401).json({ error: 'Unauthorized' });

    const { imageUrl } = req.body || {};
    if (!imageUrl || typeof imageUrl !== 'string') return res.status(400).json({ error: 'Image URL is required' });
    try {
      const match = imageUrl.match(/\/v\d+\/([^.]+)\./);
      const publicId = match ? match[1] : null;
      if (!publicId) {
        if (!imageUrl.includes('cloudinary.com')) return res.json({ message: 'Not a Cloudinary URL, skipping' });
        return res.status(400).json({ error: 'Could not extract public_id from URL' });
      }
      const result = await cloudinary.uploader.destroy(publicId);
      res.json({ result });
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  });

  // ---- Stripe: create checkout session (order must already exist; totals from DB only) ----
  app.post('/api/stripe/create-checkout-session', rateLimit(20), async (req: Request, res: Response) => {
    const stripe = await getStripe();
    if (!stripe) return res.status(503).json({ error: 'Payments are not configured yet.' });
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Payments are not configured on the server (FIREBASE_SERVICE_ACCOUNT missing).' });
    try {
      const { orderId, successUrl, cancelUrl } = req.body || {};
      const snap = await db.collection('orders').doc(String(orderId || '')).get();
      if (!snap.exists) return res.status(404).json({ error: 'Order not found' });
      const order = snap.data() as any;
      if (order.paymentStatus === 'paid') return res.status(400).json({ error: 'Order already paid' });

      const cur = String(order.currency || 'usd').toLowerCase();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        // No payment_method_types → Stripe enables card + Apple Pay + Google Pay (+ any
        // wallet methods active on the account) automatically.
        line_items: order.items.map((it: any) => ({
          price_data: {
            currency: cur,
            product_data: { name: String(typeof it.name === 'string' ? it.name : it.name?.en || 'Item').slice(0, 250) },
            unit_amount: Math.round(Number(it.price) * 100),
          },
          quantity: Math.max(1, Math.min(99, Number(it.quantity) || 1)),
        })),
        customer_email: order.contact?.email,
        metadata: { orderId: snap.id },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      await snap.ref.update({ 'stripe.sessionId': session.id, updatedAt: new Date().toISOString() });
      res.json({ url: session.url, id: session.id });
    } catch (e: any) {
      console.error('[stripe] create-checkout-session error:', e.message);
      res.status(500).json({ error: 'Could not start checkout.' });
    }
  });

  // ---- Stripe: reconcile on return from checkout (guest-safe; webhook is primary) ----
  app.post('/api/stripe/sync', rateLimit(10), async (req: Request, res: Response) => {
    const stripe = await getStripe();
    const db = await getDb();
    if (!stripe || !db) return res.status(503).json({ error: 'Not configured' });
    try {
      const { orderNumber, email } = req.body || {};
      const q = await db.collection('orders').where('orderNumber', '==', String(orderNumber || '').toUpperCase().trim()).limit(1).get();
      if (q.empty) return res.status(404).json({ error: 'Order not found' });
      const order = q.docs[0].data() as any;
      if ((order.contact?.email || '').toLowerCase() !== String(email || '').toLowerCase().trim()) return res.status(404).json({ error: 'Order not found' });
      if (order.paymentStatus !== 'paid' && order.stripe?.sessionId) {
        const session = await stripe.checkout.sessions.retrieve(order.stripe.sessionId);
        if (session.payment_status === 'paid') {
          await markOrderPaid(q.docs[0].id, 'Stripe payment confirmed on return', {
            sessionId: session.id,
            paymentIntentId: (session.payment_intent as string) || '',
          });
          return res.json({ paid: true });
        }
      }
      res.json({ paid: order.paymentStatus === 'paid' });
    } catch (e: any) {
      console.error('[stripe] sync error:', e.message);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  // ---- Order confirmation email: server reads the order; the body is never trusted ----
  app.post('/api/email/order-confirmation', rateLimit(10), async (req: Request, res: Response) => {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: 'Not configured' });
    try {
      const { orderNumber, email } = req.body || {};
      const q = await db.collection('orders').where('orderNumber', '==', String(orderNumber || '').toUpperCase().trim()).limit(1).get();
      if (q.empty) return res.status(404).json({ error: 'Order not found' });
      const order = q.docs[0].data() as any;
      if ((order.contact?.email || '').toLowerCase() !== String(email || '').toLowerCase().trim()) return res.status(404).json({ error: 'Order not found' });
      const ok = await sendOrderConfirmation(order.contact.email, orderToEmail(order));
      res.json({ sent: ok });
    } catch (e: any) {
      console.error('[email] endpoint error:', e.message);
      res.status(500).json({ error: 'Could not send email' });
    }
  });

  // ---- Translation proxy (Gemini, server-side key) ----
  app.post('/api/translate', rateLimit(20), async (req: Request, res: Response) => {
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'Translation is not configured.' });
    const adminDb = await getDb();
    if (adminDb) {
      const decoded = await verifyIdToken(req.headers.authorization);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
    }
    const { nameEn = '', nameAr = '', descEn = '', descAr = '' } = req.body || {};
    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt =
        `You are the bilingual copywriter for Raafat Furniture, an upscale Egyptian furniture house that ships worldwide.\n` +
        `Task: complete the missing fields so each product has BOTH an English and an Arabic version of its name and description.\n\n` +
        `Rules:\n` +
        `- Arabic must be natural, warm EGYPTIAN dialect (اللهجة المصرية) as written by a refined Cairo showroom — elegant and premium, never stiff textbook Arabic and never street slang.\n` +
        `- English must read like polished boutique product copy (clean, confident, not flowery).\n` +
        `- Translate MEANING and feel, not word-for-word. Keep it faithful to any field already provided.\n` +
        `- NEVER change a field that already has text — only fill the empty ones. Keep names concise; keep descriptions roughly the same length as their counterpart.\n` +
        `- Keep measurements, materials, and numbers accurate. Do not invent features that aren't described.\n` +
        `- Return ONLY the JSON object, nothing else.\n\n` +
        `Current fields (translate to fill any empty string):\n` +
        JSON.stringify({ nameEn, nameAr, descEn, descAr }, null, 2);
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nameEn: { type: Type.STRING }, nameAr: { type: Type.STRING },
              descEn: { type: Type.STRING }, descAr: { type: Type.STRING },
            },
            required: ['nameEn', 'nameAr', 'descEn', 'descAr'],
          },
        },
      });
      let text = (response.text || '{}').replace(/```json|```/g, '').trim();
      const a = text.indexOf('{'); const b = text.lastIndexOf('}');
      if (a !== -1 && b >= a) text = text.slice(a, b + 1);
      res.json(JSON.parse(text || '{}'));
    } catch (e: any) {
      console.error('[translate] error:', e.message);
      res.status(500).json({ error: 'Translation failed.' });
    }
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  return app;
}
