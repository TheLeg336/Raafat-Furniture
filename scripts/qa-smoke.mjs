/**
 * Automated QA smoke per agent-test.md — run: node scripts/qa-smoke.mjs
 * Requires dev server on http://localhost:3000
 */
import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const OUT = join(process.cwd(), 'qa-output');
mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const findings = [];

function add(severity, page, what, steps, expected, actual) {
  findings.push({ severity, page, what, steps, expected, actual });
}

async function checkHorizontalScroll(page, label) {
  const overflow = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  if (overflow.sw > overflow.cw + 2) {
    add('Major', label, 'Horizontal scroll detected', `Open ${label}`, 'No horizontal overflow', `scrollWidth ${overflow.sw} > clientWidth ${overflow.cw}`);
  }
}

async function consoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function dismissCookies(page) {
  const accept = page.getByRole('button', { name: /accept all/i });
  if (await accept.isVisible({ timeout: 2000 }).catch(() => false)) {
    await accept.click();
  }
}

async function runViewport(browser, vp) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(err.message));

  // Home
  await page.goto(BASE + '/');
  await dismissCookies(page);
  await page.waitForTimeout(800);
  await checkHorizontalScroll(page, `Home (${vp.name})`);
  await page.screenshot({ path: join(OUT, `home-${vp.name}.png`), fullPage: true });

  const hero = page.locator('#hero');
  if (!(await hero.isVisible())) add('Major', 'Home', 'Hero section missing', 'Load /', 'Hero visible', 'Not found');

  // Header nav
  if (vp.name === 'mobile') {
    const menuBtn = page.locator('header button[aria-label]').first();
    const hamburger = page.locator('header').getByRole('button').filter({ hasNot: page.locator('[aria-label*="cart" i]') }).first();
    const buttons = page.locator('header button');
    const count = await buttons.count();
    if (count >= 1) {
      await buttons.nth(count - 1).click().catch(() => {});
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(OUT, `mobile-menu-${vp.name}.png`) });
    }
  }

  // Shop
  await page.goto(BASE + '/shop');
  await checkHorizontalScroll(page, `Shop (${vp.name})`);
  await page.screenshot({ path: join(OUT, `shop-${vp.name}.png`), fullPage: true });

  // FAQ / Contact
  for (const path of ['/faq', '/contact', '/track', '/login']) {
    const res = await page.goto(BASE + path);
    if (res && res.status() >= 400) add('Blocker', path, 'Page returns error', `GET ${path}`, '200', String(res.status()));
    await checkHorizontalScroll(page, `${path} (${vp.name})`);
  }

  // Checkout empty + with custom option check
  await page.goto(BASE + '/checkout');
  await page.screenshot({ path: join(OUT, `checkout-${vp.name}.png`), fullPage: true });
  const customOrder = page.getByText(/custom order/i);
  if (await customOrder.isVisible().catch(() => false)) {
    add('Major', 'Checkout', 'Custom order option at checkout', 'Open /checkout', 'Custom orders via contact only', 'Custom order fulfillment card visible');
  }

  // Arabic RTL
  await page.goto(BASE + '/');
  const arBtn = page.getByRole('button', { name: /العربية|ar/i }).or(page.getByText('العربية'));
  const langToggle = page.locator('header').getByText(/العربية|EN/);
  if (await langToggle.first().isVisible().catch(() => false)) {
    await langToggle.first().click();
    await page.waitForTimeout(500);
    const dir = await page.evaluate(() => document.documentElement.dir);
    if (dir !== 'rtl') add('Major', 'i18n', 'Arabic does not set RTL', 'Click العربية', 'dir=rtl', `dir=${dir}`);
    await checkHorizontalScroll(page, `Home AR (${vp.name})`);
    await page.screenshot({ path: join(OUT, `home-ar-${vp.name}.png`), fullPage: true });
  }

  if (errors.length) {
    add('Major', `Global (${vp.name})`, 'Console errors', 'Browse site', 'No errors', errors.slice(0, 5).join(' | '));
  }

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const vp of viewports) {
    console.log(`Testing ${vp.name}...`);
    await runViewport(browser, vp);
  }
  await browser.close();

  const report = findings.length
    ? findings.map((f, i) => `${i + 1}. [${f.severity}] ${f.page}: ${f.what}\n   Expected: ${f.expected}\n   Actual: ${f.actual}`).join('\n\n')
    : 'No automated issues detected.';
  writeFileSync(join(OUT, 'report.txt'), report);
  console.log('\n=== QA REPORT ===\n');
  console.log(report);
  console.log(`\nScreenshots in ${OUT}`);
  process.exit(findings.some((f) => f.severity === 'Blocker') ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
