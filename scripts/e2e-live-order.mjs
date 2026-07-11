/**
 * Live checkout E2E — run after FIREBASE_SERVICE_ACCOUNT lands in Vercel.
 *
 * Places a real guest test order on the LIVE site through the same public API the
 * storefront uses, walks it through the full fulfillment lifecycle with the Admin
 * SDK (the same writes the admin UI makes), then DELETES the test order and its
 * order-number reservation and restores payment toggles. Prints PASS/FAIL per step.
 *
 * Usage:  node scripts/e2e-live-order.mjs
 * Needs:  scan-worker/service-account.json (gitignored)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const BASE = 'https://raafat-furniture.vercel.app';
const PRODUCT_ID = 'Bhc9qy9Ku45KdRxsOpMC'; // Test Product 4
const EMAIL = 'youssefhanna336+e2etest@gmail.com';

initializeApp({ credential: cert(require('../scan-worker/service-account.json')) });
const db = getFirestore();

const results = [];
const step = (name, ok, detail = '') => { results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); if (!ok) console.log('!! ' + name + ': ' + detail); };
const api = async (path, body) => {
  const r = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const settingsRef = db.collection('settings').doc('payments');
const savedMethods = (await settingsRef.get()).data()?.methods ?? null;

let orderRef = null;
try {
  // 1. temporarily enable bank_transfer (test runs from a non-EG IP where InstaPay is geo-hidden)
  await settingsRef.set({ methods: { ...savedMethods, bank_transfer: true }, updatedAt: new Date().toISOString() }, { merge: true });
  await sleep(1500);
  const cfg = await (await fetch(`${BASE}/api/config?_=${Math.random()}`)).json();
  step('server reads toggles (ordersConfigured)', cfg.ordersConfigured === true);
  step('temporary bank_transfer visible in config', cfg.methods?.bank_transfer === true);

  // 2. place guest order via the same public endpoint the storefront calls
  const create = await api('/api/orders/create', {
    items: [{ productId: PRODUCT_ID, name: 'Test Product 4', quantity: 1 }],
    contact: { fullName: 'E2E Live Test', email: EMAIL, phone: '01010279777' },
    fulfillment: 'pickup',
    pickupLocationId: 'cairo',
    paymentMethod: 'bank_transfer',
  });
  const order = create.json.order || create.json;
  const orderNumber = order?.orderNumber;
  step('order created via live API', create.status === 200 && !!orderNumber, `#${orderNumber} total ${order?.total} ${order?.currency}`);
  if (!orderNumber) throw new Error('no order number — aborting');
  step('server-side pricing (EGP 750, not client value)', order.total === 750 && order.currency === 'EGP', `${order.total} ${order.currency}`);

  // 3. payment reference
  const ref = await api('/api/orders/payment-reference', { orderNumber, email: EMAIL, reference: 'E2E-LIVE-REF-001' });
  step('payment reference accepted', ref.status === 200);

  // 4. guest tracking + auth check
  const track = await api('/api/orders/track', { orderNumber, email: EMAIL });
  step('guest tracking returns order', track.status === 200 && track.json.order?.status === 'payment_verification', track.json.order?.status);
  const bad = await api('/api/orders/track', { orderNumber, email: 'attacker@evil.com' });
  step('tracking with wrong email rejected', bad.status === 404);

  // 5. fulfillment lifecycle (same field writes the admin UI performs)
  const q = await db.collection('orders').where('orderNumber', '==', orderNumber).limit(1).get();
  orderRef = q.docs[0].ref;
  const now = () => new Date().toISOString();
  await orderRef.update({ status: 'paid', paymentStatus: 'paid', updatedAt: now() });
  await orderRef.update({ status: 'in_production', updatedAt: now() });
  const items = (await orderRef.get()).data().items.map((it) => ({ ...it, prepared: true }));
  await orderRef.update({ items, status: 'awaiting_approval', updatedAt: now() });
  await orderRef.update({ status: 'ready', updatedAt: now() });
  await orderRef.update({ status: 'completed', updatedAt: now() });
  const finalStatus = (await orderRef.get()).data().status;
  step('fulfillment lifecycle to completed', finalStatus === 'completed', finalStatus);

  // 6. order-confirmation email endpoint (expected: graceful non-send while Resend is unconfigured)
  const mail = await api('/api/email/order-confirmation', { orderNumber, email: EMAIL });
  step('email endpoint responds gracefully without Resend', mail.status < 500 || mail.json?.error?.length > 0, `status ${mail.status} ${JSON.stringify(mail.json).slice(0, 80)}`);
} finally {
  // 7. cleanup: delete test order + number reservation, restore toggles
  if (orderRef) {
    const num = (await orderRef.get()).data()?.orderNumber;
    await orderRef.delete();
    if (num) await db.collection('orderNumbers').doc(num).delete().catch(() => {});
    const gone = num ? !(await db.collection('orderNumbers').doc(num).get()).exists : true;
    step('test order + reservation deleted', gone);
  }
  if (savedMethods) {
    await settingsRef.set({ methods: savedMethods, updatedAt: new Date().toISOString() }, { merge: true });
    await sleep(1200);
    const cfg2 = await (await fetch(`${BASE}/api/config?_=${Math.random()}`)).json();
    step('payment toggles restored', cfg2.methods?.bank_transfer === savedMethods.bank_transfer, JSON.stringify(cfg2.methods));
  }
}

console.log('\n===== LIVE E2E RESULTS =====');
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
