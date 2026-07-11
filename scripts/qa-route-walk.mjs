/**
 * Route walk QA — every public route at mobile + desktop.
 * Captures: page errors, console errors, horizontal scroll, missing root content.
 * Usage: QA_BASE_URL=http://localhost:3000 node scripts/qa-route-walk.mjs
 */
import { chromium } from '@playwright/test';

const BASE = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const ROUTES = [
  '/', '/shop', '/faq', '/contact', '/sign-in', '/track', '/checkout',
  '/account', '/legal/privacy', '/legal/terms', '/legal/cookies',
  '/manage', '/workshop', '/order/confirmation', '/definitely-not-a-page-404',
];

const VIEWPORTS = [['mobile', 390, 844], ['desktop', 1440, 900]];
const IGNORE = [
  /Tailwind CSS/i, /React DevTools/i, /motion\(\) is deprecated/,
  /firebase.*not configured/i, /installations/i, /analytics/i,
  /ERR_BLOCKED_BY_CLIENT/, /favicon/, /Failed to load resource.*40[34]/,
];

const browser = await chromium.launch({ headless: true });
const problems = [];
let checked = 0;

for (const [vpName, width, height] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`PAGEERROR ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.some((re) => re.test(m.text()))) errors.push(`CONSOLE ${m.text().slice(0, 200)}`);
  });

  for (const route of ROUTES) {
    errors.length = 0;
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1200);
      const rootText = await page.evaluate(() => document.getElementById('root')?.innerText?.trim().length || 0);
      const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      if (rootText < 20) problems.push(`[${vpName}] ${route}: page looks empty (${rootText} chars)`);
      if (hScroll) problems.push(`[${vpName}] ${route}: horizontal scroll`);
      for (const e of errors) problems.push(`[${vpName}] ${route}: ${e}`);
      checked++;
    } catch (e) {
      problems.push(`[${vpName}] ${route}: NAVIGATION FAILED ${e.message.slice(0, 120)}`);
    }
  }
  await page.close();
}

await browser.close();
console.log(`Checked ${checked} route×viewport combos on ${BASE}`);
console.log(problems.length ? problems.join('\n') : 'NO PROBLEMS FOUND');
process.exit(0);
