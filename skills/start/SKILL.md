---
name: start
description: Begin working on a Linear issue. Use when the user says "start SHA-X",
  "begin SHA-X", "work on SHA-X", "pick up SHA-X". Accepts the issue ID as an
  argument or will prompt for it.
allowed-tools: Bash(git checkout:*), Bash(git branch:*), Bash(git rev-parse:*), mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__save_issue
---

# start

## Context

- Current branch: !`git branch --show-current`

## Steps

1. Accept the issue ID (e.g. `SHA-6`) from the user's message. If none was given,
   ask for it and stop until you have one.
2. `mcp__claude_ai_Linear__get_issue` with the ID → extract `title`,
   `description`, `gitBranchName`, and the current `state`.
3. Display a compact brief drawn from the description (skip sections that are absent):
   - **Purpose** — one sentence.
   - **Scope / Assumptions** — key bullets.
   - **Acceptance Criteria** — verbatim list.
4. Check out the branch using `gitBranchName` from the issue:
   - `git branch --list <gitBranchName>` to see whether it already exists locally.
   - Exists → `git checkout <gitBranchName>`
   - Missing → `git checkout -b <gitBranchName>`
   - If `gitBranchName` is empty, fall back to `sha-<n>` (lowercase issue ID).
5. If the issue is not already in an in-progress state, move it:
   `mcp__claude_ai_Linear__save_issue` → set `state: "In Progress"`.
6. Confirm in one line: "On branch `<gitBranchName>`. SHA-X moved to In Progress."
