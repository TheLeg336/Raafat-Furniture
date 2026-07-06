/**
 * Full site QA — run with dev server: node scripts/qa-browser.mjs
 * Uses Playwright directly (same engine as Playwright MCP).
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.env.QA_BASE_URL || 'https://raafat-furniture.vercel.app';
const OUT = join(process.cwd(), 'qa-output');
mkdirSync(OUT, { recursive: true });

const report = [];

async function testRoute(page, path, checks) {
  const url = BASE + path;
  const res = await page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
  const status = res?.status() ?? 0;
  for (const c of checks) {
    try {
      await c(page, status);
    } catch (e) {
      report.push(`FAIL [${path}] ${e.message}`);
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = { pass: 0, fail: 0 };

  for (const [name, w, h] of [['mobile', 375, 812], ['desktop', 1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error' && !/CSP|firebase-admin/i.test(m.text())) errs.push(m.text()); });

    // Cookie banner
    await page.goto(BASE);
    const accept = page.getByRole('button', { name: /accept all/i });
    if (await accept.isVisible({ timeout: 2000 }).catch(() => false)) await accept.click();

    const routes = [
      ['/', async (p) => {
        await p.locator('#hero').waitFor({ state: 'visible' });
        const cards = await p.locator('#shop .aspect-\\[4\\/5\\]').count();
        if (cards < 2) throw new Error(`Home: expected category cards, got ${cards}`);
      }],
      ['/shop', async (p) => { await p.locator('h1, h2').first().waitFor(); }],
      ['/faq', async (p) => { await p.getByRole('heading', { level: 1 }).waitFor(); }],
      ['/contact', async (p) => { await p.getByRole('heading', { level: 1 }).waitFor(); }],
      ['/track', async (p) => { await p.getByRole('heading', { level: 1 }).waitFor(); }],
      ['/login', async (p) => { await p.getByRole('button').first().waitFor(); }],
      ['/checkout', async (p) => {
        const custom = p.getByRole('button', { name: /^Custom order$/i });
        if (await custom.isVisible().catch(() => false)) throw new Error('Custom order still in checkout');
      }],
      ['/admin/orders', async (p) => {
        const url = p.url();
        if (url.includes('/login')) return; // expected when signed out
        const text = await p.locator('body').innerText();
        if (text.includes('Could not load orders')) report.push(`INFO [${name}] /admin/orders permission/setup issue (see on-screen help)`);
        if (text.includes('No pending orders')) report.push(`INFO [${name}] /admin/orders empty — need FIREBASE_SERVICE_ACCOUNT + test checkout`);
      }],
      ['/staff', async (p) => {
        if (p.url().includes('/login') || p.url() === BASE + '/') return;
        const text = await p.locator('body').innerText();
        if (text.includes('Workshop access')) report.push(`INFO [${name}] /staff needs worker role in admins collection`);
      }],
    ];

    for (const [path, check] of routes) {
      try {
        await testRoute(page, path, [check]);
        results.pass++;
        report.push(`PASS [${name}] ${path}`);
      } catch (e) {
        results.fail++;
        report.push(`FAIL [${name}] ${path}: ${e.message}`);
      }
    }

    // Mobile menu
    if (name === 'mobile') {
      await page.goto(BASE);
      const menu = page.getByRole('button', { name: /open menu/i });
      if (await menu.isVisible()) {
        await menu.click();
        await page.waitForTimeout(400);
        const faq = page.locator('nav a[href="/faq"]').first();
        if (!(await faq.isVisible())) report.push('FAIL [mobile] hamburger menu missing FAQ link');
        else report.push('PASS [mobile] hamburger menu opens with FAQ');
        await page.screenshot({ path: join(OUT, 'mcp-menu-mobile.png') });
      }
    }

    if (errs.length) report.push(`WARN [${name}] console: ${errs.slice(0, 2).join(' | ')}`);
    await ctx.close();
  }

  await browser.close();
  const out = [`Passed: ${results.pass}`, `Failed: ${results.fail}`, '', ...report].join('\n');
  writeFileSync(join(OUT, 'browser-qa.txt'), out);
  console.log(out);
}

main();
