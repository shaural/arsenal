#!/usr/bin/env node
// Notification hook: append Claude Code notifications (e.g. a background agent
// finishing, or a permission prompt) to a log so completions aren't missed while
// the user is away. Notification hooks deliver the text via stdin JSON (`message`),
// not an env var. Always exits 0.

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const event = JSON.parse(raw || '{}');
    const msg = event.message || process.env.CLAUDE_NOTIFICATION_MESSAGE || '';
    if (!msg) return;

    // Prefer the plugin's data dir; fall back to the project's .claude dir.
    const base =
      process.env.CLAUDE_PLUGIN_DATA ||
      path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude');
    const dir = path.join(base, 'logs');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(
      path.join(dir, 'notifications.log'),
      `[${new Date().toISOString()}] ${msg}\n`
    );
  } catch {
    // Logging is best-effort — never disrupt the session.
  }
});
