import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = 'http://localhost:3000/og-template.html';
const outPath = path.join(__dirname, 'images', 'og-image.jpg');

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle0' });
// extra wait for fonts/images
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: outPath, type: 'jpeg', quality: 90, omitBackground: false });
await browser.close();
console.log('OG-Image gerendert:', outPath);
