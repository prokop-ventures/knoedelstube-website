import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 200));

const info = await page.evaluate(() => {
  const wisp = document.querySelector('.wisp');
  const r = wisp.getBoundingClientRect();
  const wrap = document.querySelector('.steam-wrap');
  const wr = wrap.getBoundingClientRect();
  return {
    wisp: { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height },
    wrap: { top: wr.top, left: wr.left, bottom: wr.bottom, width: wr.width, height: wr.height },
    wispComputed: {
      opacity: getComputedStyle(wisp).opacity,
      transform: getComputedStyle(wisp).transform,
      bottom: getComputedStyle(wisp).bottom,
      left: getComputedStyle(wisp).left,
    }
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
