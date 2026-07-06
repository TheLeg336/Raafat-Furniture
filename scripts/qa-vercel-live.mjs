import { chromium } from '@playwright/test';

const BASE = 'https://raafat-furniture.vercel.app';
const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
const hero = await page.locator('#hero').isVisible();
const cards = await page.locator('#shop .aspect-\\[4\\/5\\]').count();
console.log('HOME hero=', hero, 'categoryCards=', cards);

for (const f of ['/llms.txt', '/llms-full.txt', '/robots.txt', '/sitemap.xml']) {
  const res = await page.goto(BASE + f);
  const body = await page.locator('body').innerText();
  console.log(f, res?.status(), 'brand=', body.includes('Raafat'), 'len=', body.length);
}

await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded' });
const products = await page.locator('a[href^="/product/"]').count();
console.log('/shop product links:', products);

await page.goto(BASE);
const cfg = await page.evaluate(async () => {
  const r = await fetch('/api/config');
  return r.json();
});
console.log('/api/config:', JSON.stringify(cfg, null, 2));

await browser.close();
