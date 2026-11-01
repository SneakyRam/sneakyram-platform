#!/usr/bin/env node
// Post-build step for both sites: `node scripts/check-links.mjs <dist>`
// Every internal link and asset in the built HTML must point at a file that exists in dist/.
// External links are not fetched; this keeps CI fast and offline.

import { access, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPosix, walk } from './lib/walk.mjs';

const LINK_ATTR = /\s(?:href|src)\s*=\s*["']([^"']+)["']/gi;
// mailto:, https:, data: and so on; protocol-relative //host; same-page #anchors.
const NOT_INTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/** The URL path a built file is served at: dist/posts/a/index.html -> /posts/a/ */
export function urlPathOf(relFile) {
  const path = `/${toPosix(relFile)}`;
  return path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;
}

/** Internal paths linked from a page, resolved against that page's own URL. */
export function internalLinks(html, pagePath) {
  const paths = new Set();
  for (const [, raw] of html.matchAll(LINK_ATTR)) {
    const value = raw.trim().replaceAll('&amp;', '&');
    if (value === '' || NOT_INTERNAL.test(value)) continue;
    const url = new URL(value, `https://site.invalid${pagePath}`);
    paths.add(decodeURIComponent(url.pathname));
  }
  return [...paths];
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** True if Apache would find a file for this URL path in dist/. */
export async function resolves(dist, urlPath) {
  const candidates = urlPath.endsWith('/')
    ? [join(dist, urlPath, 'index.html')]
    : [join(dist, urlPath), join(dist, urlPath, 'index.html')];
  for (const candidate of candidates) if (await exists(candidate)) return true;
  return false;
}

async function main(dist) {
  const broken = [];
  let pages = 0;
  let links = 0;

  for await (const file of walk(dist)) {
    if (!file.endsWith('.html')) continue;
    pages += 1;
    const pagePath = urlPathOf(relative(dist, file));
    const html = await readFile(file, 'utf8');
    for (const target of internalLinks(html, pagePath)) {
      links += 1;
      if (!(await resolves(dist, target))) broken.push(`${pagePath} -> ${target}`);
    }
  }

  if (broken.length > 0) {
    console.error(`✗ Links: ${broken.length} broken internal link(s):`);
    for (const line of broken) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log(`✓ Links: ${links} internal link(s) on ${pages} page(s) all resolve`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = process.argv[2];
  if (!dist) {
    console.error('usage: node scripts/check-links.mjs <dist directory>');
    process.exit(2);
  }
  await main(dist);
}
