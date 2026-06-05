#!/usr/bin/env node
// PreToolUse(Bash) guard: block `git push` while on main/master so work always
// flows through a feature branch + PR. Exit 2 = blocking error in Claude Code
// hooks (stderr is fed back to Claude and the tool call is denied). Any other
// path exits 0 and lets the command proceed.

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(raw || '{}');
    const cmd = String(event.tool_input?.command || event.input?.command || '');
    if (!/\bgit\s+push\b/.test(cmd)) return; // not a push — allow

    const { execSync } = require('child_process');
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();

    if (branch === 'main' || branch === 'master') {
      console.error(
        `BLOCKED: refusing to push directly to "${branch}". ` +
          `Create a feature branch (e.g. feat/<name> or the issue's sha-<n> branch) ` +
          `and push that instead.`
      );
      process.exit(2);
    }
  } catch {
    // Not a git repo, malformed input, or git unavailable — fail open.
  }
});
