#!/usr/bin/env node
// Local preview that behaves like the real server where it matters for testing:
// `node scripts/serve.mjs <dist> [port]`
//   - sends every `Header always set` line from dist/.htaccess (so the real CSP is enforced)
//   - redirects folder URLs without a trailing slash, serves index.html, falls back to 404.html
//   - refuses dotfiles except /.well-known/, like the .htaccess rule does
// It does not run the .htaccess rewrite rules, which depend on the real hostname.

import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const [distArg = 'dist', portArg = '4321'] = process.argv.slice(2);
const root = resolve(distArg);
const port = Number(portArg);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

async function headersFromHtaccess() {
  const text = await readFile(join(root, '.htaccess'), 'utf8').catch(() => '');
  const headers = {};
  for (const [, name, value] of text.matchAll(/^\s*Header\s+always\s+set\s+([\w-]+)\s+"((?:[^"\\]|\\.)*)"/gim)) {
    headers[name] = value.replaceAll('\\"', '"');
  }
  return headers;
}

const securityHeaders = await headersFromHtaccess();

function send(res, status, file, extra = {}) {
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
    ...extra,
  });
  createReadStream(file).pipe(res);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }

  // Path traversal guard: the resolved file must stay inside dist/.
  let file = resolve(root, `.${pathname}`);
  const blockedDotfile = /(^|\/)\.(?!well-known\/)/.test(pathname.slice(1));
  if ((file !== root && !file.startsWith(root + sep)) || blockedDotfile) {
    res.writeHead(403, securityHeaders).end('Forbidden');
    return;
  }

  try {
    let info = await stat(file);
    if (info.isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { ...securityHeaders, Location: `${pathname}/${url.search}` }).end();
        return;
      }
      file = join(file, 'index.html');
      info = await stat(file);
    }
    send(res, 200, file);
  } catch {
    send(res, 404, join(root, '404.html'));
  }
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port} with ${Object.keys(securityHeaders).length} header(s) from .htaccess`);
});
