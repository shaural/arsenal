---
name: commit-push-pr
description: Commit staged/unstaged changes with a Conventional Commits message, push the branch, and open a pull request. Use when the user says "commit and push", "commit push pr", "ship this", "open a PR for these changes", or otherwise asks to turn working-tree changes into a committed, pushed PR.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git checkout:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(gh pr create:*)
---

# commit-push-pr

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged): !`git diff HEAD`
- Current branch: !`git branch --show-current`

## Your task

Based on the changes above, do all of the following. Prefer to issue the
git/gh commands directly with minimal extra commentary.

1. If there are no changes, stop and say there's nothing to commit.
2. If the current branch is `main` or `master`, create a new branch named after
   the change (e.g. `feat/<short-name>` or `fix/<short-name>`). Otherwise stay on
   the current branch.
3. Stage the changes (`git add -A`, or a subset if the user specified one).
4. Create a single commit with a **Conventional Commits** message:
   - Format: `<type>[optional scope]: <description>` — e.g. `feat(skills): add commit-push-pr skill`.
   - `type` ∈ `feat | fix | docs | style | refactor | perf | test | build | ci | chore | revert`.
     `feat` = new feature, `fix` = bug fix. Add a scope when it clarifies the area.
   - Description: short, imperative, lowercase, no trailing period.
   - Breaking change: append `!` after the type/scope (e.g. `feat!:`) and/or add a
     `BREAKING CHANGE:` footer (uppercase).
   - If the diff spans multiple types, it's fine to make more than one focused commit.
   - Pass the message with **multiple `-m` flags** (subject, then body if needed, then
     the footer) to avoid shell-quoting issues — do **not** use a here-string. End with:
     `-m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"`
5. Push the branch: `git push --set-upstream origin <branch>`. If the push is denied
   by the harness (e.g. pushing to the default branch), stop and ask the user to run
   it themselves — do not work around the denial.
6. Open a PR with `gh pr create`:
   - `--title` follows the same Conventional Commits format as the commit subject.
   - `--body` summarizes what changed and why; end it with:
     `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
   - If there's no GitHub remote or `gh` is unavailable, report that and stop after the push.
7. Report the commit hash, branch, and PR URL.
