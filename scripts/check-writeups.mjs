#!/usr/bin/env node
// Publishing guard for docs.sneakyram.in: `node scripts/check-writeups.mjs <content dir>`
//
// Fails CI before anything is built when a write-up would:
//   - break Hack The Box's rules (only retired machines, challenges, Sherlocks and Endgames,
//     Starting Point machines and Tier 0 Academy modules may be published), or
//   - leak a flag or a hash (HTB{...}, THM{...}, or any 32-character hex string).
// A line containing "secret-scan: allow" is skipped by the secret scan, for the rare case where a
// hash is the lesson (put the marker in a comment next to it and explain why in the text).

import { readFile } from 'node:fs/promises';
import { basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { toPosix, walk } from './lib/walk.mjs';

const HTB_RETIRED_ONLY = new Set(['machine', 'challenge', 'sherlock', 'endgame']);
const HTB_ALWAYS_ALLOWED = new Set(['starting-point', 'academy-tier-0']);

const SECRETS = [
  { label: 'an HTB flag', pattern: /HTB\{([^}\n]*)\}/g },
  { label: 'a TryHackMe flag', pattern: /THM\{([^}\n]*)\}/g },
  { label: 'a 32-character hex string (a user/root flag, or an MD5 or NTLM hash)', pattern: /\b[a-f0-9]{32}\b/gi },
];
const REDACTED = /^(?:\.\.\.|…|\[?redacted\]?|<redacted>|x+|\*+)$/i;
const ALLOW_MARKER = 'secret-scan: allow';

const isOverviewPage = (file) => /^index\.mdx?$/.test(basename(file));

function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return undefined;
}

/** Rules about what may be published. `file` is relative to the content folder, e.g. htb/machines/lame.md */
export function platformProblems(file, data, today = new Date()) {
  const problems = [];
  const underHtb = file.startsWith('htb/');
  if (!underHtb && data.platform !== 'htb') return problems;
  if (isOverviewPage(file) && !data.kind) return problems;

  if (data.platform !== 'htb') problems.push('pages under htb/ need "platform: htb"');
  if (!data.kind) {
    problems.push('HTB write-ups need a "kind" (machine, challenge, sherlock, endgame, starting-point or academy-tier-0)');
    return problems;
  }
  if (HTB_ALWAYS_ALLOWED.has(data.kind)) return problems;
  if (!HTB_RETIRED_ONLY.has(data.kind)) {
    problems.push(`HTB doesn't allow public write-ups for "${data.kind}" content`);
    return problems;
  }

  const retired = toDate(data.retired);
  if (!retired || Number.isNaN(retired.valueOf())) {
    problems.push(`a ${data.kind} write-up needs a "retired" date; HTB only allows write-ups for retired content`);
  } else if (retired > today) {
    problems.push(`"retired" is ${retired.toISOString().slice(0, 10)}, which is in the future; publish after it retires`);
  }
  return problems;
}

/** Flags and hashes that should have been redacted, with 1-based line numbers. */
export function secretProblems(raw) {
  const problems = [];
  raw.split(/\r?\n/).forEach((line, index) => {
    if (line.includes(ALLOW_MARKER)) return;
    for (const { label, pattern } of SECRETS) {
      for (const match of line.matchAll(pattern)) {
        const inner = match[1];
        if (inner !== undefined && REDACTED.test(inner.trim())) continue;
        problems.push({ line: index + 1, message: `contains ${label}; replace it with [REDACTED]` });
      }
    }
  });
  return problems;
}

/** Everything wrong with one file. Drafts are skipped because they are never published. */
export function checkWriteup(file, raw, today = new Date()) {
  const { data } = matter(raw);
  if (data.draft === true) return [];
  return [
    ...platformProblems(file, data, today).map((message) => ({ message })),
    ...secretProblems(raw),
  ];
}

async function main(root) {
  let checked = 0;
  let failures = 0;
  for await (const path of walk(root)) {
    if (!/\.mdx?$/.test(path)) continue;
    const file = toPosix(relative(root, path));
    if (file.split('/').some((part) => part.startsWith('_'))) continue; // templates are never published
    checked += 1;
    for (const problem of checkWriteup(file, await readFile(path, 'utf8'))) {
      failures += 1;
      console.error(`✗ ${file}${problem.line ? `:${problem.line}` : ''}  ${problem.message}`);
    }
  }
  if (failures > 0) {
    console.error(`\n${failures} problem(s). Fix them, or set "draft: true" until the write-up can be published.`);
    process.exit(1);
  }
  console.log(`✓ Write-ups: ${checked} file(s) follow the publishing rules`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.argv[2];
  if (!root) {
    console.error('usage: node scripts/check-writeups.mjs <content directory>');
    process.exit(2);
  }
  await main(root);
}
