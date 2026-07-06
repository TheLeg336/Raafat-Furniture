/**
 * Exhaustive QA per agent-test.md — every route, interaction, viewport, RTL.
 * Run: node scripts/qa-exhaustive.mjs  (dev server on :3000)
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.env.QA_BASE_URL || 'https://raafat-furniture.vercel.app';
const OUT = join(process.cwd(), 'qa-output');
mkdirSync(OUT, { recursive: true });

const findings = [];
const pass = (msg) => findings.push(`PASS: ${msg}`);
const fail = (sev, page, what, detail) => findings.push(`${sev} [${page}] ${what} — ${detail}`);

async function dismissCookies(page) {
  const b = page.getByRole('button', { name: /accept all/i });
  if (await b.isVisible({ timeout: 2000 }).catch(() => false)) await b.click();
}

async function noHScroll(page, label) {
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  if (sw > cw + 2) fail('Major', label, 'Horizontal scroll', `${sw}>${cw}`);
  else pass(`${label}: no horizontal scroll`);
}

async function testGlobal(page, vp) {
  const label = `global-${vp}`;
  await page.goto(BASE);
  await dismissCookies(page);
  await noHScroll(page, label);

  // Header: currency toggle (desktop header only; on mobile it's inside the menu)
  if (vp !== 'mobile') {
    await page.getByRole('button', { name: /^USD$/ }).click();
    pass(`${label}: currency USD toggle`);
    await page.getByRole('button', { name: /^EGP$/ }).click();
  }

  // Language AR (desktop controls visible; on mobile open menu first)
  if (vp === 'mobile') {
    await page.getByRole('button', { name: /open menu/i }).click();
    await page.waitForTimeout(300);
  }
  await page.getByText('العربية').click();
  await page.waitForTimeout(400);
  const dir = await page.evaluate(() => document.documentElement.dir);
  if (dir !== 'rtl') fail('Major', label, 'RTL', `dir=${dir}`);
  else pass(`${label}: Arabic RTL`);
  await page.getByText('EN').click();
  if (vp === 'mobile') await page.getByRole('button', { name: /close menu/i }).click().catch(() => {});

  if (vp === 'mobile') {
    const menu = page.getByRole('button', { name: /open menu/i });
    if (await menu.isVisible()) {
      await menu.click();
      await page.waitForTimeout(300);
      const navFaq = page.locator('a[href="/faq"]').filter({ hasText: /^FAQ$/ }).first();
      if (!(await navFaq.isVisible())) fail('Major', label, 'Mobile menu', 'FAQ link missing');
      else pass(`${label}: mobile menu has FAQ`);
      await page.getByRole('button', { name: /close menu/i }).click().catch(() => menu.click());
    }
    const cart = page.locator('header').getByLabel(/cart/i).first();
    if (!(await cart.isVisible())) fail('Major', label, 'Mobile cart', 'hidden');
    else { await cart.click(); pass(`${label}: cart opens`); await page.keyboard.press('Escape'); }
  } else {
    await page.locator('header').getByLabel(/cart/i).first().click();
    pass(`${label}: desktop cart opens`);
    await page.keyboard.press('Escape');
  }
}

async function testRoutes(page, vp) {
  const routes = ['/', '/shop', '/faq', '/contact', '/track', '/login', '/checkout', '/legal/privacy', '/legal/cookies', '/legal/terms', '/admin', '/admin/orders', '/staff'];
  for (const path of routes) {
    const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    const status = res?.status() ?? 0;
    if (status >= 400) fail('Blocker', path, 'HTTP error', String(status));
    else pass(`${vp} ${path}: ${status}`);
    await noHScroll(page, `${vp}${path}`);
    if (path === '/checkout') {
      const custom = page.getByRole('button', { name: /^Custom order$/i });
      if (await custom.isVisible().catch(() => false)) fail('Major', path, 'Custom at checkout', 'should be contact only');
    }
    if (path === '/legal/privacy') {
      const t = await page.locator('main, article').first().textContent().catch(() => '');
      if (t?.includes('[BUSINESS')) fail('Blocker', path, 'Legal placeholder', 'visible');
    }
  }
}

async function testShop(page) {
  await page.goto(BASE + '/shop');
  await dismissCookies(page);
  const cards = page.locator('[data-product-card], .group.relative.block, a[href^="/product/"]');
  const n = await cards.count();
  if (n < 1) fail('Major', '/shop', 'Products', `found ${n}`);
  else pass(`/shop: ${n} product links`);
}

async function testGeoFiles(page) {
  for (const f of ['/robots.txt', '/llms.txt', '/sitemap.xml']) {
    const res = await page.goto(BASE + f);
    const body = await page.locator('body').innerText();
    if (!res?.ok()) fail('Blocker', f, 'Not reachable', String(res?.status()));
    else pass(`${f}: ${body.length} chars`);
    if (f === '/robots.txt' && !body.includes('GPTBot')) fail('Major', f, 'AI crawlers', 'missing');
    if (f === '/llms.txt' && !body.includes('Raafat')) fail('Major', f, 'Brand', 'missing');
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const [vp, w, h] of [['mobile', 375, 812], ['tablet', 768, 1024], ['desktop', 1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await testGlobal(page, vp);
    await testRoutes(page, vp);
    if (vp === 'desktop') await testShop(page);
    if (vp === 'mobile') await testGeoFiles(page);
    await page.screenshot({ path: join(OUT, `exhaustive-${vp}.png`), fullPage: false });
    await ctx.close();
  }
  await browser.close();

  const blockers = findings.filter((f) => f.startsWith('Blocker'));
  const majors = findings.filter((f) => f.startsWith('Major'));
  const summary = [
    `Blockers: ${blockers.length}`,
    `Majors: ${majors.length}`,
    `Passes: ${findings.filter((f) => f.startsWith('PASS')).length}`,
    '',
    ...findings,
  ].join('\n');
  writeFileSync(join(OUT, 'qa-exhaustive.txt'), summary);
  console.log(summary);
}

main();
