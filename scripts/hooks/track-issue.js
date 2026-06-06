#!/usr/bin/env node
// Stop hook: when the working tree is on an `sha-<n>` branch, record the active
// issue to `.claude/current-issue.txt` in the project root. A project's CLAUDE.md
// can then surface it with:  Current issue: !cat .claude/current-issue.txt
// Always exits 0 — this is bookkeeping and must never block the session.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', {
    encoding: 'utf8',
  }).trim();

  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const file = path.join(root, '.claude', 'current-issue.txt');
  const m = branch.match(/sha-(\d+)/i);

  if (m) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `SHA-${m[1]} (branch: ${branch})\n`);
  } else if (fs.existsSync(file)) {
    // No longer on an issue branch — clear the stale pointer.
    fs.rmSync(file);
  }
} catch {
  // Not a git repo or git unavailable — nothing to track.
}
