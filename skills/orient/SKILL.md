---
name: orient
description: Show a prioritized view of active and queued work. Use when the user
  says "orient me", "what's next", "what should I work on", "show my issues",
  "status", "daily standup". Read-only — makes no Linear writes.
allowed-tools: Bash(git branch:*), mcp__claude_ai_Linear__list_issues
---

# orient

## Context

- Current branch: !`git branch --show-current`

## Steps

1. `mcp__claude_ai_Linear__list_issues` filtered to `state: "In Progress"` →
   show as **Active**.
2. `mcp__claude_ai_Linear__list_issues` filtered to `state: "Todo"` →
   show as **Up Next**.
3. `mcp__claude_ai_Linear__list_issues` filtered to `state: "Backlog"`,
   ordered by priority descending → show as **Pipeline** (top 5 only).
4. Check the current branch. If it matches `sha-(\d+)`, call out which issue is
   active in the working tree right now.
5. End with a one-sentence **suggestion** for the best next thing to pick up:
   the highest-priority unblocked Todo, or the top Backlog item if Todo is empty.

Render each section as a short list (`SHA-X · title · priority`). Keep it scannable —
this is a standup view, not a full spec dump. Make no writes to Linear.
