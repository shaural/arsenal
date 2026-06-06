---
name: ship
description: Commit, push, open a PR, and move the Linear issue to In Review. Use
  when the user says "ship", "ship SHA-X", "done with SHA-X", "ready for review",
  "commit push pr and update linear". Wraps commit-push-pr with Linear bookends.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git checkout:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git rev-parse:*), Bash(gh pr create:*), mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__save_issue, mcp__claude_ai_Linear__create_attachment
---

# ship

## Context

- Current branch: !`git branch --show-current`
- Current git status: !`git status`

## Steps

1. Determine the Linear issue ID:
   - If the user passed an ID explicitly, use that.
   - Otherwise infer it from the current branch by matching `sha-(\d+)`
     (case-insensitive) → `SHA-<n>`.
   - If neither yields an ID, ask the user and stop until you have one.

2. Read `skills/commit-push-pr/SKILL.md` and execute every step in it exactly as
   written, with two changes:
   - Prefix the commit subject and PR title scope with the issue identifier.
     Example commit: `feat(sha-6): build v1 Chase CSV import flow`.
     Example PR title: `feat(sha-6): build v1 Chase CSV import flow`.
   - **Include a Linear magic-word line in the PR body** so the issue is auto-moved
     to Done when the PR merges. Add, on its own line near the top of the body:
     `Fixes SHA-<n>` (use the real identifier, e.g. `Fixes SHA-6`). This links the
     PR to the issue and lets Linear's GitHub PR automation complete it on merge.
   If `commit-push-pr` reports there is nothing to commit, stop and say so.

3. Once the PR URL is available:
   a. `mcp__claude_ai_Linear__save_issue` → set `state: "In Review"`.
   b. `mcp__claude_ai_Linear__create_attachment` → attach the PR to the issue
      (`issueId`, `url` = PR URL, `title` = the PR title) so the link shows on the card.

4. Report: commit hash, branch, PR URL, and confirmation that Linear was updated to
   In Review with the PR attached. Tell the user that **when they merge the PR, Linear
   will move the issue to Done automatically** (via the `Fixes SHA-<n>` link). No
   manual step is needed; `/arsenal:land` exists only as a fallback if the Linear↔GitHub
   automation isn't connected.

## Notes

- If the push is denied by the branch guard (you're on `main`/`master`), do not work
  around it — create a feature branch first per `commit-push-pr`, then retry.
- If there is no GitHub remote, stop after the local commit and report; do not touch
  Linear, since there is no PR to attach.
- The automatic merge → Done move requires Linear's GitHub integration to be connected
  and **Pull request automation** enabled for the team (one-time setup in Linear). If
  that isn't configured, the issue stays in In Review after merge — run `/arsenal:land`
  to move it to Done manually.
