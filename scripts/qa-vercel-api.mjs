/** Quick API probe against live Vercel (uses Playwright request context). */
import { chromium } from '@playwright/test';

const BASE = process.env.QA_BASE_URL || 'https://raafat-furniture.vercel.app';

const endpoints = [
  ['GET', '/api/health', null],
  ['GET', '/api/config', null],
  ['POST', '/api/orders/create', {}],
  ['POST', '/api/orders/track', { orderNumber: 'XX000000X0', email: 'test@example.com' }],
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });

console.log(`\n=== Vercel API probe: ${BASE} ===\n`);

for (const [method, path, body] of endpoints) {
  const result = await page.evaluate(async ({ base, method, path, body }) => {
    const res = await fetch(base + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return { status: res.status, body: text.slice(0, 300) };
  }, { base: BASE, method, path, body });

  const ok = result.status < 500;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${method} ${path} → ${result.status}`);
  console.log(`  ${result.body}\n`);
}

await browser.close();
