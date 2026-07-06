/**
 * Extended QA per agent-test.md — run: node scripts/qa-full.mjs
 */
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const OUT = join(process.cwd(), 'qa-output');
mkdirSync(OUT, { recursive: true });
const findings = [];
const add = (s, p, w, a) => findings.push({ s, p, w, a });

async function dismissCookies(page) {
  const btn = page.getByRole('button', { name: /accept all/i });
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) await btn.click();
}

async function testViewport(browser, vp) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('CSP')) errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(BASE + '/');
  await dismissCookies(page);
  await page.waitForTimeout(600);

  // Hero full height on mobile
  if (vp.name === 'mobile') {
    const heroH = await page.locator('#hero > div').first().evaluate((el) => el.getBoundingClientRect().height);
    if (heroH < vp.height * 0.85) add('Major', 'Home', 'Hero too short on mobile', 'Load /', '>=85vh', `${Math.round(heroH)}px`);
  }

  // Category cards visible
  const cards = page.locator('#shop .aspect-\\[4\\/5\\]');
  const cardCount = await cards.count();
  if (cardCount < 2) add('Major', 'Home', 'Featured category cards missing', 'Load /', '>=2 cards', `${cardCount}`);

  // Mobile menu — no page bleed-through
  if (vp.name === 'mobile') {
    const menuBtn = page.getByRole('button', { name: /open menu|فتح القائمة/i });
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(400);
      const bleed = await page.locator('text=Featured Collections').count();
      const menuVisible = await page.getByRole('link', { name: /FAQ/i }).isVisible().catch(() => false);
      if (bleed > 0 && menuVisible) add('Major', 'Header', 'Page content bleeds through mobile menu', 'Open hamburger', 'Menu covers page', 'Featured Collections visible behind menu');
      await page.screenshot({ path: join(OUT, `menu-fixed-${vp.name}.png`) });
      await page.getByRole('button', { name: /close menu|إغلاق/i }).click().catch(() => {});
    }
  }

  // Cart always openable on mobile
  if (vp.name === 'mobile') {
    const cartBtn = page.locator('header').getByLabel(/cart/i);
    if (!(await cartBtn.isVisible().catch(() => false))) add('Major', 'Header', 'Cart icon hidden when empty', 'Empty cart mobile', 'Always visible', 'Hidden');
    else {
      await cartBtn.click();
      await page.waitForTimeout(300);
      if (!(await page.getByText(/cart is empty/i).isVisible().catch(() => false)))
        add('Major', 'Cart', 'Cart drawer did not open', 'Tap cart', 'Drawer opens', 'No drawer');
      await page.keyboard.press('Escape');
    }
  }

  // Nav links
  for (const [name, path] of [['FAQ', '/faq'], ['Contact', '/contact'], ['Track', '/track']]) {
    await page.goto(BASE + path);
    if (!(await page.locator('h1, h2').first().isVisible().catch(() => false)))
      add('Blocker', path, `${name} page empty`, `GET ${path}`, 'Heading visible', 'Missing');
  }

  // Checkout — no custom order card
  await page.goto(BASE + '/shop');
  await page.waitForTimeout(800);
  const addBtn = page.locator('button').filter({ hasText: /add|أضف/i }).first();
  if (await addBtn.isVisible().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(400);
    await page.goto(BASE + '/checkout');
    await page.waitForTimeout(500);
    if (await page.getByText(/^Custom order$/i).isVisible().catch(() => false))
      add('Major', 'Checkout', 'Custom order still in fulfillment', '/checkout', 'Pickup + Delivery only', 'Custom order shown');
    if (!(await page.getByText(/need something custom/i).isVisible().catch(() => false)))
      add('Minor', 'Checkout', 'Custom contact CTA missing', '/checkout', 'Contact CTA', 'Not found');
    await page.screenshot({ path: join(OUT, `checkout-with-cart-${vp.name}.png`) });
  }

  // RTL
  await page.goto(BASE + '/');
  const ar = page.getByText('العربية').first();
  if (await ar.isVisible().catch(() => false)) {
    await ar.click();
    await page.waitForTimeout(400);
    const dir = await page.evaluate(() => document.documentElement.dir);
    if (dir !== 'rtl') add('Major', 'i18n', 'RTL not set', 'Arabic toggle', 'rtl', dir);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    const cw = await page.evaluate(() => document.documentElement.clientWidth);
    if (sw > cw + 2) add('Major', 'RTL', 'Horizontal scroll in Arabic', 'Switch AR', 'No overflow', `${sw}>${cw}`);
  }

  // Legal placeholders
  await page.goto(BASE + '/legal/privacy');
  const body = await page.locator('main, article, .legal').first().textContent().catch(() => '');
  if (body?.includes('[BUSINESS LEGAL NAME]')) add('Blocker', 'Legal', 'Placeholder visible', '/legal/privacy', 'Filled', 'Placeholder shown');

  if (errs.length) add('Minor', vp.name, 'Console errors', 'Browse', 'None', errs.slice(0, 3).join(' | '));

  await ctx.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const vp of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    console.log('Testing', vp.name);
    await testViewport(browser, vp);
  }
  await browser.close();

  const report = findings.length
    ? findings.map((f, i) => `${i + 1}. [${f.s}] ${f.p}: ${f.w}\n   ${f.a}`).join('\n\n')
    : 'All extended checks passed.';
  writeFileSync(join(OUT, 'report-full.txt'), report);
  console.log('\n' + report);
  process.exit(findings.some((f) => f.s === 'Blocker') ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
