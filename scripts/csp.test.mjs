import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { forbiddenPatterns, hashSource, inlineScripts } from './csp.mjs';

describe('inlineScripts', () => {
  it('returns inline script bodies exactly as written, whitespace included', () => {
    const html = '<script>\n  console.log(1);\n</script><script type="module">import "./a.js";</script>';
    assert.deepEqual(inlineScripts(html), ['\n  console.log(1);\n', 'import "./a.js";']);
  });

  it('skips external scripts, which are covered by script-src self', () => {
    assert.deepEqual(inlineScripts('<script src="/_astro/a.js"></script><script type="module" src="/x.js"></script>'), []);
  });

  it('skips data blocks such as JSON-LD, which never execute', () => {
    assert.deepEqual(inlineScripts('<script type="application/ld+json">{"@type":"Person"}</script>'), []);
  });

  it('does not mistake data-src for src', () => {
    assert.deepEqual(inlineScripts('<script data-src="x">run()</script>'), ['run()']);
  });
});

describe('hashSource', () => {
  it('produces the same value a browser computes for the script text', () => {
    const expected = createHash('sha256').update('alert(1)').digest('base64');
    assert.equal(hashSource('alert(1)'), `'sha256-${expected}'`);
  });
});

describe('forbiddenPatterns', () => {
  it('flags inline event handlers', () => {
    assert.equal(forbiddenPatterns('<img src="a.png" onerror="steal()">').length, 1);
  });

  it('flags javascript: URLs', () => {
    assert.equal(forbiddenPatterns('<a href="javascript:alert(1)">x</a>').length, 1);
  });

  it('ignores the same text when it is escaped inside a code block', () => {
    assert.deepEqual(forbiddenPatterns('<pre><code>&lt;img src=x onerror=alert(1)&gt;</code></pre>'), []);
  });
});
