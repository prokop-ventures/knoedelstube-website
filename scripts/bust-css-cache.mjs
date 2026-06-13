#!/usr/bin/env node
// Setzt den Cache-Query von tailwind.css in index.html automatisch auf den
// Inhalts-Hash der gebauten CSS. Läuft als `postbuild:css` nach jedem Build,
// damit eine geänderte tailwind.css live garantiert frisch geladen wird.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = join(root, 'tailwind.css');
const htmlPath = join(root, 'index.html');

const hash = createHash('sha256').update(readFileSync(cssPath)).digest('hex').slice(0, 8);

const html = readFileSync(htmlPath, 'utf8');
const re = /(tailwind\.css\?v=)[^"']*/;
if (!re.test(html)) {
  console.error('bust-css-cache: kein tailwind.css?v=… in index.html gefunden – übersprungen.');
  process.exit(0);
}
const updated = html.replace(re, `$1${hash}`);
if (updated !== html) {
  writeFileSync(htmlPath, updated);
  console.log(`bust-css-cache: tailwind.css?v=${hash} gesetzt.`);
} else {
  console.log(`bust-css-cache: bereits aktuell (v=${hash}).`);
}
