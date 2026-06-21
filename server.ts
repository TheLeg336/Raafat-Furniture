import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import compression from 'compression';
import dotenv from 'dotenv';
import { sendOrderConfirmation } from './server/email';
import { verifyIdToken, getDb } from './server/firebaseAdmin';
import type { OrderEmailData } from './server/orderEmail';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
// Server-only Gemini key (no VITE_ prefix → never bundled to the client).
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  // Secret must stay server-side. Prefer the non-VITE name; fall back for back-compat.
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET,
});

let stripeClient: any = null;
async function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  if (stripeClient) return stripeClient;
  const { default: Stripe } = await import('stripe');
  stripeClient = new Stripe(STRIPE_SECRET_KEY);
  return stripeClient;
}

// ---- lightweight in-memory rate limiter (per IP, per window) ----
function rateLimit(maxPerMinute: number) {
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

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(compression()); // gzip/br responses

  // ---- Security headers (CSP is handled by the meta tag in index.html) ----
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self), xr-spatial-tracking=(self)');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups'); // Firebase/Google OAuth popups
    if (isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // ---- Stripe webhook needs the RAW body — mount BEFORE express.json ----
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    const stripe = await getStripe();
    if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Stripe webhook not configured' });
    const sig = req.headers['stripe-signature'] as string;
    let event: any;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('[stripe] webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      try {
        const db = await getDb();
        if (db && orderId) {
          const now = new Date().toISOString();
          const ref = db.collection('orders').doc(orderId);
          const snap = await ref.get();
          if (snap.exists) {
            const order = snap.data() as any;
            await ref.update({
              paymentStatus: 'paid',
              status: 'paid',
              'stripe.sessionId': session.id,
              'stripe.paymentIntentId': session.payment_intent || '',
              statusHistory: [...(order.statusHistory || []), { status: 'paid', at: now, by: 'system', note: 'Stripe payment received' }],
              updatedAt: now,
            });
            // confirmation email
            if (order.contact?.email) {
              await sendOrderConfirmation(order.contact.email, orderToEmail(order));
            }
          }
        } else if (orderId) {
          console.warn('[stripe] webhook received but firebase-admin not configured; order', orderId, 'not auto-updated.');
        }
      } catch (e) {
        console.error('[stripe] webhook handling error:', (e as Error).message);
      }
    }
    res.json({ received: true });
  });

  app.use(express.json({ limit: '1mb' }));

  // ---- Cloudinary delete (admin only when firebase-admin is configured) ----
  app.post('/api/cloudinary/delete', rateLimit(30), async (req: Request, res: Response) => {
    const decoded = await verifyIdToken(req.headers.authorization);
    // If admin verification is available, require a verified user. Otherwise allow (dev).
    const { getDb: _gd } = await import('./server/firebaseAdmin');
    const adminDb = await _gd();
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

  // ---- Stripe: create checkout session ----
  app.post('/api/stripe/create-checkout-session', rateLimit(20), async (req: Request, res: Response) => {
    const stripe = await getStripe();
    if (!stripe) return res.status(503).json({ error: 'Payments are not configured yet.' });
    try {
      const { orderId, items, currency, successUrl, cancelUrl, customerEmail } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });

      // If admin is available, re-read the order and trust its server-side totals.
      let lineItems = items;
      const db = await getDb();
      if (db && orderId) {
        const snap = await db.collection('orders').doc(orderId).get();
        if (snap.exists) {
          const order = snap.data() as any;
          lineItems = order.items.map((it: any) => ({
            name: typeof it.name === 'string' ? it.name : it.name?.en || 'Item',
            price: it.price,
            quantity: it.quantity,
          }));
        }
      }

      const cur = (currency || 'usd').toLowerCase();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems.map((it: any) => ({
          price_data: {
            currency: cur,
            product_data: { name: String(it.name).slice(0, 250) },
            unit_amount: Math.round(Number(it.price) * 100),
          },
          quantity: Math.max(1, Math.min(99, Number(it.quantity) || 1)),
        })),
        customer_email: customerEmail,
        metadata: { orderId: orderId || '' },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      res.json({ url: session.url, id: session.id });
    } catch (e: any) {
      console.error('[stripe] create-checkout-session error:', e.message);
      res.status(500).json({ error: 'Could not start checkout.' });
    }
  });

  // ---- Order confirmation email (works without firebase-admin; reads from request) ----
  app.post('/api/email/order-confirmation', rateLimit(10), async (req: Request, res: Response) => {
    try {
      const data = req.body as OrderEmailData;
      if (!data?.orderNumber || !req.body?.to) return res.status(400).json({ error: 'Missing order data or recipient' });
      const ok = await sendOrderConfirmation(req.body.to, data);
      res.json({ sent: ok });
    } catch (e: any) {
      console.error('[email] endpoint error:', e.message);
      res.status(500).json({ error: 'Could not send email' });
    }
  });

  // ---- Translation proxy (Gemini, server-side key) ----
  app.post('/api/translate', rateLimit(20), async (req: Request, res: Response) => {
    if (!GEMINI_API_KEY) return res.status(503).json({ error: 'Translation is not configured.' });
    // Admin-gate when Firebase Admin is available.
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
        `You are a professional translator for a luxury furniture brand. Fill in any missing fields ` +
        `between English and Arabic, keeping provided fields exactly. Return ONLY JSON.\n` +
        JSON.stringify({ nameEn, nameAr, descEn, descAr }, null, 2);
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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

  // ---- Vite / static ----
  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Long-cache fingerprinted assets; never cache the HTML shell.
    app.use(express.static(distPath, {
      maxAge: '1y',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

function orderToEmail(order: any): OrderEmailData {
  return {
    orderNumber: order.orderNumber,
    customerName: order.contact?.fullName || '',
    currency: order.currency || 'USD',
    items: (order.items || []).map((i: any) => ({
      name: typeof i.name === 'string' ? i.name : i.name?.en || 'Item',
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
    contact: order.contact || {},
    storeName: 'Raafat Furniture',
  };
}

startServer();
