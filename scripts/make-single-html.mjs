// Inlines the Vite build (JS, CSS, fonts) into one self-contained HTML file
// that opens straight from disk: dist-single/clm-academy.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const inlineCss = (cssPath) => {
  let css = readFileSync(join(dist, cssPath), 'utf8');
  // Keep only the woff2 sources; every target browser supports them.
  css = css.replace(/,\s*url\([^)]+\.woff\)\s*format\(["']woff["']\)/g, '');
  return css.replace(/url\(\.?\/?([^)]+?\.woff2)\)/g, (_, p) => {
    const file = join(dist, 'assets', p.replace(/^.*assets\//, ''));
    return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
  });
};

html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, href) => `<style>${inlineCss(href)}</style>`);
html = html.replace(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g, (_, src) => {
  const js = readFileSync(join(dist, src), 'utf8').replace(/<\/script/g, '<\\/script');
  return `<script type="module">${js}</script>`;
});
// Module scripts in <head> run deferred anyway; move them to the end of <body> for clarity.
const scripts = html.match(/<script type="module">[\s\S]*?<\/script>/g) ?? [];
// Function replacers only: the bundle contains "$&" / "$'" sequences that string replacements would expand.
for (const s of scripts) html = html.replace(s, () => '');
html = html.replace('</body>', () => `${scripts.join('\n')}\n</body>`);

if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('Unresolved asset reference left in HTML');

const outDir = join(root, 'dist-single');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, 'clm-academy.html');
writeFileSync(out, html);
console.log(`Wrote ${out} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
