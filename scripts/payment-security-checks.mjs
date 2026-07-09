/**
 * Payment / order attack-surface checks (run against a running server).
 *
 *   npm run dev
 *   node --experimental-strip-types scripts/payment-security-checks.mjs
 *
 * Expect: every attack returns 4xx/5xx — never creates a cheap paid order.
 */
const BASE = process.env.SITE_URL || 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const results = [];
function ok(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  const cfg = await get('/api/config');
  ok('GET /api/config', cfg.status === 200, `ordersConfigured=${cfg.json.ordersConfigured}`);

  // 1) Client-supplied prices must be rejected
  const priced = await post('/api/orders/create', {
    items: [{ productId: 'fake', quantity: 1, price: 1 }],
    contact: { fullName: 'Attacker', email: 'a@b.co', phone: '', line1: 'x', city: 'y', country: 'EG' },
    fulfillment: 'shipping',
    paymentMethod: 'bank_transfer',
  });
  ok('Reject client price field', priced.status === 400 || priced.status === 503, `status=${priced.status} ${priced.json.error || ''}`);

  // 2) Disabled / invalid payment method
  const badPay = await post('/api/orders/create', {
    items: [{ productId: 'fake', quantity: 1 }],
    contact: { fullName: 'Attacker', email: 'a@b.co', phone: '', line1: 'x', city: 'y', country: 'EG' },
    fulfillment: 'shipping',
    paymentMethod: 'cash_on_pickup',
  });
  ok('Reject cash_on_pickup', badPay.status === 400 || badPay.status === 503, `status=${badPay.status}`);

  // 3) Stripe session without knowing order email
  const stripe = await post('/api/stripe/create-checkout-session', {
    orderId: 'nonexistent',
    email: 'wrong@example.com',
  });
  ok('Stripe session needs valid order+email', stripe.status === 404 || stripe.status === 503, `status=${stripe.status}`);

  // 4) Paymob same
  const paymob = await post('/api/paymob/create-payment', {
    orderId: 'nonexistent',
    email: 'wrong@example.com',
  });
  ok('Paymob session needs valid order+email', paymob.status === 404 || paymob.status === 503, `status=${paymob.status}`);

  // 5) Track without matching email
  const track = await post('/api/orders/track', { orderNumber: 'EG000000XX', email: 'nobody@example.com' });
  ok('Track fails closed', track.status === 404 || track.status === 503, `status=${track.status}`);

  // 6) Payment reference without match
  const pref = await post('/api/orders/payment-reference', {
    orderNumber: 'EG000000XX', email: 'nobody@example.com', reference: 'HACK',
  });
  ok('Payment reference fails closed', pref.status === 404 || pref.status === 503, `status=${pref.status}`);

  // 7) Worker API without auth
  const worker = await get('/api/worker/orders');
  ok('Worker list requires auth', worker.status === 401 || worker.status === 403 || worker.status === 404 || worker.status === 503, `status=${worker.status}`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
