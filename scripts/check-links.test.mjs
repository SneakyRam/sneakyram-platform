import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { internalLinks, resolves, urlPathOf } from './check-links.mjs';

describe('urlPathOf', () => {
  it('maps folder pages and plain files to the URL they are served at', () => {
    assert.equal(urlPathOf('index.html'), '/');
    assert.equal(urlPathOf('posts/hello/index.html'), '/posts/hello/');
    assert.equal(urlPathOf('404.html'), '/404.html');
  });
});

describe('internalLinks', () => {
  it('keeps site links and resolves relative ones against the page', () => {
    const html = '<a href="/posts/">a</a><a href="../projects/">b</a><img src="cat.png">';
    assert.deepEqual(internalLinks(html, '/posts/hello/').sort(), ['/posts/', '/posts/hello/cat.png', '/posts/projects/']);
  });

  it('ignores external links, mailto, protocol-relative URLs and anchors', () => {
    const html = '<a href="https://x.dev">a</a><a href="mailto:a@b.c">b</a><a href="//cdn.x">c</a><a href="#top">d</a>';
    assert.deepEqual(internalLinks(html, '/'), []);
  });

  it('drops query strings and fragments', () => {
    assert.deepEqual(internalLinks('<a href="/search/?q=nmap#results">s</a>', '/'), ['/search/']);
  });
});

describe('resolves', () => {
  let dist;

  before(async () => {
    dist = await mkdtemp(join(tmpdir(), 'links-'));
    await mkdir(join(dist, 'posts', 'hello'), { recursive: true });
    await writeFile(join(dist, 'posts', 'hello', 'index.html'), '');
    await writeFile(join(dist, 'favicon.svg'), '');
  });

  after(() => rm(dist, { recursive: true, force: true }));

  it('finds folder pages with or without the trailing slash, and plain files', async () => {
    assert.equal(await resolves(dist, '/posts/hello/'), true);
    assert.equal(await resolves(dist, '/posts/hello'), true);
    assert.equal(await resolves(dist, '/favicon.svg'), true);
  });

  it('reports pages that do not exist', async () => {
    assert.equal(await resolves(dist, '/posts/missing/'), false);
  });
});
