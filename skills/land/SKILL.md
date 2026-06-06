---
name: land
description: Move a Linear issue to Done after its PR is merged. Use when the user
  says "land SHA-X", "mark SHA-X done", "SHA-X is merged", "close out SHA-X", "finish
  SHA-X", "I merged the PR". Verifies the PR is actually merged before flipping the
  issue to Done, then optionally tidies up the merged branch.
allowed-tools: Bash(git branch:*), Bash(git rev-parse:*), Bash(git checkout:*), Bash(git pull:*), Bash(git fetch:*), Bash(gh pr view:*), Bash(gh pr list:*), mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__save_issue
---

# land

Closes the loop after a PR is merged: this is the only step that moves a Linear
issue to **Done**. `ship` stops at **In Review** so the user can review and merge
manually; `land` is run afterward.

## Context

- Current branch: !`git branch --show-current`

## Steps

1. Determine the Linear issue ID:
   - Use the ID the user gave, if any.
   - Otherwise infer it from the current branch by matching `sha-(\d+)`
     (case-insensitive) → `SHA-<n>`.
   - If neither yields an ID, ask the user and stop.

2. **Verify the PR is merged before touching Linear.** Find the issue's PR and check
   its state:
   - If on the issue's branch: `gh pr view --json state,url,number,headRefName`.
   - Otherwise look it up: `gh pr list --state all --search "sha-<n>"` (or
     `gh pr view <branch>`), and match the issue's branch.
   - If the PR state is **not** `MERGED` (it's still `OPEN`, or `CLOSED` without
     merge), **stop** and report the actual state. Do not move the issue to Done.
     Only override this if the user explicitly insists there is no PR / it was merged
     outside GitHub.

3. `mcp__claude_ai_Linear__get_issue` → check the current state. If it's already
   **Done**, say so and skip the write.

4. `mcp__claude_ai_Linear__save_issue` → set `state: "Done"`.

5. **Offer to tidy up** (only when currently on the merged branch). Ask before doing
   any of this — it changes the working tree:
   - `git checkout master` (or the repo's default branch)
   - `git pull` to fast-forward the merge commit
   - delete the merged local branch (`git branch -d <branch>`)

6. Report: the issue moved to Done, the merged PR URL, and whether the branch was
   tidied.

## Notes

- This step is intentionally separate from `ship` and gated on a real merge, so an
  issue is never marked Done while its PR is still open or under review.
