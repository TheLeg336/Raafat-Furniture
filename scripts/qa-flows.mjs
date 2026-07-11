/**
 * Interaction QA — customer flows on the live site (no purchases).
 * Usage: QA_BASE_URL=https://raafat-furniture.vercel.app node scripts/qa-flows.mjs
 */
import { chromium } from '@playwright/test';

const BASE = (process.env.QA_BASE_URL || 'https://raafat-furniture.vercel.app').replace(/\/$/, '');
const out = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));

try {
  // Shop
  await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const accept = page.getByRole('button', { name: /accept all/i });
  if (await accept.isVisible().catch(() => false)) await accept.click();

  // Shop opens in category-browse mode; click a category, then a product card.
  // Cards navigate via onClick (no <a href>).
  const cards = page.locator('div.group.cursor-pointer');
  if (!(await cards.count())) throw new Error('no category tiles on /shop');
  await cards.first().click();
  await page.waitForTimeout(2000);
  const nProducts = await cards.count();
  out.push(`shop: ${nProducts} product cards after opening category`);
  if (!nProducts) throw new Error('no products in category');

  await cards.first().click();
  await page.waitForURL('**/product/**', { timeout: 15000 });
  await page.waitForTimeout(2500);
  out.push(`product: url=${page.url().replace(BASE, '')}`);
  const h1 = (await page.locator('h1').first().textContent().catch(() => '')) || '';
  out.push(`product: h1="${h1.trim().slice(0, 40)}"`);

  const has3d = await page.locator('model-viewer').count();
  out.push(`product: model-viewer elements=${has3d}`);

  // Add to cart
  const addBtn = page.getByRole('button', { name: /add to cart/i }).first();
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(1500);
    const drawerItems = await page.locator('[class*="cart"], aside').getByRole('button', { name: /checkout|proceed/i }).count();
    out.push(`cart: checkout button visible=${drawerItems > 0}`);
  } else {
    out.push('cart: no visible Add to cart button (made-to-order only?)');
  }

  // Checkout page renders
  await page.goto(BASE + '/checkout', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const checkoutText = await page.evaluate(() => document.body.innerText.slice(0, 2000));
  out.push(`checkout: renders=${/checkout|cart|empty|contact/i.test(checkoutText)}`);

  // Track order validation
  await page.goto(BASE + '/track-order', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const trackBtn = page.getByRole('button', { name: /track/i }).first();
  out.push(`track-order: button=${await trackBtn.isVisible().catch(() => false)}`);
} catch (e) {
  out.push('FLOW FAILED: ' + e.message.slice(0, 200));
}

out.push(errors.length ? 'PAGE ERRORS:\n' + errors.join('\n') : 'no page errors');
console.log(out.join('\n'));
await browser.close();
