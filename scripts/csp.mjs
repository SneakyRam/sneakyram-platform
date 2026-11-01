#!/usr/bin/env node
// Post-build step for both sites: `node scripts/csp.mjs <dist>`
//
// 1. Finds every inline <script> the build produced and lists its SHA-256 hash in the
//    Content-Security-Policy, so those exact scripts run and nothing else inline can.
// 2. Fails the build if a page contains an inline event handler (onclick=...) or a
//    javascript: URL, because the policy would block them in the browser anyway.
// 3. Gives /_astro/ (file names that change whenever the content does) a one-year cache rule.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPosix, walk } from './lib/walk.mjs';

export const PLACEHOLDER = '__CSP_SCRIPT_HASHES__';

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
// Script types a browser executes. Anything else (JSON-LD, templates) is data, and CSP ignores it.
const EXECUTABLE = new Set(['', 'text/javascript', 'application/javascript', 'module']);

/** Returns the text of every inline script a browser would execute, exactly as written. */
export function inlineScripts(html) {
  const bodies = [];
  for (const [, attrs, body] of html.matchAll(SCRIPT)) {
    if (/(?:^|\s)src\s*=/i.test(attrs)) continue; // external file, covered by 'self'
    const type = (attrs.match(/(?:^|\s)type\s*=\s*["']?([^"'\s>]+)/i)?.[1] ?? '').toLowerCase();
    if (EXECUTABLE.has(type)) bodies.push(body);
  }
  return bodies;
}

/** The CSP source expression for one inline script, e.g. 'sha256-abc...='. */
export function hashSource(body) {
  return `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
}

/** Problems the CSP would block at runtime. Escaped text inside code blocks is not matched. */
export function forbiddenPatterns(html) {
  const problems = [];
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(html)) problems.push('inline event handler such as onclick=');
  if (/<[a-z][^>]*\s(?:href|src|action|formaction)\s*=\s*["']?\s*javascript:/i.test(html)) {
    problems.push('javascript: URL');
  }
  return problems;
}

async function main(dist) {
  const hashes = new Set();
  const problems = [];
  let pages = 0;

  for await (const file of walk(dist)) {
    if (!file.endsWith('.html')) continue;
    pages += 1;
    const html = await readFile(file, 'utf8');
    for (const body of inlineScripts(html)) hashes.add(hashSource(body));
    for (const problem of forbiddenPatterns(html)) problems.push(`${toPosix(relative(dist, file))}: ${problem}`);
  }

  if (problems.length > 0) {
    console.error(`✗ CSP: ${problems.length} page(s) contain code the policy would block:`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  const htaccessPath = join(dist, '.htaccess');
  const htaccess = await readFile(htaccessPath, 'utf8').catch(() => '');
  if (!htaccess.includes(PLACEHOLDER)) {
    console.error(`✗ CSP: ${htaccessPath} is missing or has no ${PLACEHOLDER} placeholder.`);
    console.error('  Without it the site would ship without its Content-Security-Policy.');
    process.exit(1);
  }
  await writeFile(htaccessPath, htaccess.replaceAll(PLACEHOLDER, [...hashes].sort().join(' ')));

  await mkdir(join(dist, '_astro'), { recursive: true });
  await writeFile(
    join(dist, '_astro', '.htaccess'),
    [
      '# Written by scripts/csp.mjs. Files here have a content hash in their name, so a changed',
      '# file always gets a new URL and browsers can keep the old one for a year.',
      '<IfModule mod_headers.c>',
      '  <FilesMatch ".">',
      '    Header set Cache-Control "public, max-age=31536000, immutable"',
      '  </FilesMatch>',
      '</IfModule>',
      '',
    ].join('\n'),
  );

  console.log(`✓ CSP: ${hashes.size} inline script hash(es) from ${pages} page(s) written to .htaccess`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = process.argv[2];
  if (!dist) {
    console.error('usage: node scripts/csp.mjs <dist directory>');
    process.exit(2);
  }
  await main(dist);
}
