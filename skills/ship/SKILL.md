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
   written, with one change: prefix the commit subject and PR title scope with the
   issue identifier. Example commit: `feat(sha-6): build v1 Chase CSV import flow`.
   Example PR title: `feat(sha-6): build v1 Chase CSV import flow`.
   If `commit-push-pr` reports there is nothing to commit, stop and say so.

3. Once the PR URL is available:
   a. `mcp__claude_ai_Linear__save_issue` → set `state: "In Review"`.
   b. `mcp__claude_ai_Linear__create_attachment` → attach the PR to the issue
      (`issueId`, `url` = PR URL, `title` = the PR title) so the link shows on the card.

4. Report: commit hash, branch, PR URL, and confirmation that Linear was updated to
   In Review with the PR attached. Remind the user that after they review and merge
   the PR, `/arsenal:land` will move the issue to Done.

## Notes

- If the push is denied by the branch guard (you're on `main`/`master`), do not work
  around it — create a feature branch first per `commit-push-pr`, then retry.
- If there is no GitHub remote, stop after the local commit and report; do not touch
  Linear, since there is no PR to attach.
