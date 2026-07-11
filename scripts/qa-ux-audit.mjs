/**
 * Playwright UX audit — screenshots + checks for live Vercel site.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.env.QA_BASE_URL || 'https://raafat-furniture.vercel.app';
const OUT = join(process.cwd(), 'qa-output', 'ux-audit');
mkdirSync(OUT, { recursive: true });

const findings = [];

async function auditViewport(page, name, w, h) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const accept = page.getByRole('button', { name: /accept all/i });
  if (await accept.isVisible().catch(() => false)) await accept.click();

  const branchCards = await page.locator('h3').filter({ hasText: /Cairo Branch|Minya Branch|New Minya/ }).count();
  if (branchCards > 3) findings.push(`[${name}] DUPLICATE locations: ${branchCards} branch headings on home (expected 3)`);

  const visitUs = await page.locator('#visit-us').isVisible();
  const footerContact = await page.locator('footer#footer').isVisible();
  findings.push(`[${name}] #visit-us=${visitUs} footer#footer=${footerContact}`);

  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  if (hScroll) findings.push(`[${name}] Horizontal scroll detected`);

  await page.screenshot({ path: join(OUT, `home-${name}.png`), fullPage: true });

  await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: join(OUT, `shop-${name}.png`), fullPage: false });

  await page.goto(BASE + '/contact', { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: join(OUT, `contact-${name}.png`), fullPage: false });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

for (const [name, w, h] of [['mobile', 375, 812], ['desktop', 1440, 900]]) {
  await auditViewport(page, name, w, h);
}

writeFileSync(join(OUT, 'findings.txt'), findings.join('\n'));
console.log(findings.join('\n'));
await browser.close();
