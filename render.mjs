import puppeteer from 'puppeteer-core';
import fs from 'fs';
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.split('=')));
const url = `http://127.0.0.1:${args.port || 5311}/?render=1`;
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--window-size=1920,1080', '--hide-scrollbars', '--force-device-scale-factor=1'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 }, protocolTimeout: 600000 });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(url, { waitUntil: 'networkidle0' });
await page.evaluate(() => window.ready);
const dir = args.dir || '/workspace/kite-cards/frames'; fs.mkdirSync(dir, { recursive: true });
const frames = args.stills ? args.stills.split(',').map(Number) : null;
const N = Math.round((await page.evaluate(() => window.duration)) * 30);
const list = frames || [...Array(N).keys()];
for (const f of list) {
  await page.evaluate((f) => window.renderAt(f), f);
  fs.writeFileSync(`${dir}/f${String(f).padStart(5, '0')}.jpg`, await page.screenshot({ type: 'jpeg', quality: 93 }));
  if (f % 60 === 0) console.log('frame', f);
}
await browser.close();
