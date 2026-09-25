#!/usr/bin/env node
// Fails (exit 1) if any git-tracked or untracked-but-not-ignored file under
// apps/bouquet is a forbidden path, or contains a secret-shaped string.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const FORBIDDEN_PATH_RE = /(^|\/)node_modules\/|(^|\/)\.dev\.vars(\.|$)|(^|\/)\.wrangler\//;

// Built from parts so this file's own source never literally contains a
// string that would match its own secret pattern.
const SECRET_RE = new RegExp(
  ['re_[A-Za-z0-9]{20,}', 'whsec_[A-Za-z0-9]+', ['EMAIL', 'SECRET'].join('_') + '=', ['COOKIE', 'SECRET'].join('_') + '='].join('|'),
);

function repoRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

function trackedAndUntrackedFiles(root) {
  const out = execFileSync(
    'git',
    ['-C', root, 'ls-files', '-co', '--exclude-standard', 'apps/bouquet'],
    { encoding: 'utf8' },
  );
  return out.split('\n').filter(Boolean);
}

function main() {
  const root = repoRoot();
  const files = trackedAndUntrackedFiles(root);
  const failures = [];

  for (const relPath of files) {
    if (FORBIDDEN_PATH_RE.test(relPath)) {
      failures.push(`forbidden path: ${relPath}`);
      continue;
    }

    const absPath = `${root}/${relPath}`;
    let stat;
    try {
      stat = statSync(absPath);
    } catch {
      continue; // deleted/renamed between ls-files and stat; nothing to check
    }
    if (!stat.isFile()) continue;

    let contents;
    try {
      contents = readFileSync(absPath, 'utf8');
    } catch {
      continue; // binary or unreadable; skip content scan
    }

    if (SECRET_RE.test(contents)) {
      failures.push(`secret-shaped content: ${relPath}`);
    }
  }

  if (failures.length > 0) {
    console.error('check-secrets: FAILED');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('OK');
}

main();
