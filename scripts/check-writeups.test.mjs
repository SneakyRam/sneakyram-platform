import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkWriteup, platformProblems, secretProblems } from './check-writeups.mjs';

const today = new Date('2026-11-02');

const writeup = (frontMatter, body = 'Body text.') => `---\n${frontMatter}\n---\n\n${body}\n`;

describe('Hack The Box publishing rules', () => {
  it('accepts a retired machine', () => {
    const raw = writeup('title: Lame\nplatform: htb\nkind: machine\nretired: 2017-05-26');
    assert.deepEqual(checkWriteup('htb/machines/lame.md', raw, today), []);
  });

  it('refuses a machine with no retirement date', () => {
    const problems = platformProblems('htb/machines/new.md', { platform: 'htb', kind: 'machine' }, today);
    assert.match(problems[0], /needs a "retired" date/);
  });

  it('refuses a retirement date in the future', () => {
    const data = { platform: 'htb', kind: 'machine', retired: new Date('2026-12-01') };
    assert.match(platformProblems('htb/machines/new.md', data, today)[0], /in the future/);
  });

  it('allows Starting Point and Tier 0 Academy without a retirement date', () => {
    for (const kind of ['starting-point', 'academy-tier-0']) {
      assert.deepEqual(platformProblems('htb/sp/meow.md', { platform: 'htb', kind }, today), []);
    }
  });

  it('refuses kinds HTB never allows publicly, such as Pro Labs', () => {
    const problems = platformProblems('htb/prolabs/x.md', { platform: 'htb', kind: 'prolab' }, today);
    assert.match(problems[0], /doesn't allow public write-ups/);
  });

  it('requires platform: htb for files in the htb folder', () => {
    const problems = platformProblems('htb/machines/x.md', { kind: 'machine', retired: '2020-01-01' }, today);
    assert.match(problems[0], /platform: htb/);
  });

  it('applies the rules to an HTB write-up stored outside the htb folder', () => {
    const problems = platformProblems('misc/x.md', { platform: 'htb', kind: 'machine' }, today);
    assert.equal(problems.length, 1);
  });

  it('lets overview pages through without a kind', () => {
    assert.deepEqual(platformProblems('htb/index.md', { title: 'Hack The Box' }, today), []);
  });

  it('ignores drafts entirely', () => {
    const raw = writeup('platform: htb\nkind: machine\ndraft: true', 'root.txt: 0123456789abcdef0123456789abcdef');
    assert.deepEqual(checkWriteup('htb/machines/wip.md', raw, today), []);
  });
});

describe('secret scan', () => {
  it('finds an HTB flag and reports its line', () => {
    const problems = secretProblems('line one\nflag: HTB{s0m3_r34l_fl4g}\n');
    assert.equal(problems.length, 1);
    assert.equal(problems[0].line, 2);
  });

  it('finds a 32-character hex flag or hash', () => {
    assert.equal(secretProblems('root.txt -> 9f86d081884c7d659a2feaa0c55ad015').length, 1);
  });

  it('finds TryHackMe flags', () => {
    assert.equal(secretProblems('THM{hidden_value}').length, 1);
  });

  it('accepts redacted flags', () => {
    assert.deepEqual(secretProblems('HTB{REDACTED} and THM{...} and HTB{xxxx}'), []);
  });

  it('skips lines marked secret-scan: allow', () => {
    const line = 'Example hash format: 5f4dcc3b5aa765d61d8327deb882cf99 <!-- secret-scan: allow -->';
    assert.deepEqual(secretProblems(line), []);
  });

  it('does not flag shorter or longer hex strings', () => {
    assert.deepEqual(secretProblems('commit 3d3c42e and sha256 ' + 'a'.repeat(64)), []);
  });
});
