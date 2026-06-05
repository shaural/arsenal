---
name: commit-push-pr
description: Commit staged/unstaged changes with a Conventional Commits message, push the branch, and open a pull request. Use when the user says "commit and push", "commit push pr", "ship this", "open a PR for these changes", or otherwise asks to turn working-tree changes into a committed, pushed PR.
---

# commit-push-pr

Turn the current working-tree changes into a Conventional Commits-style commit, push the branch, and open a pull request.

## Steps

1. **Inspect the changes.** Run `git status` and `git diff` (and `git diff --staged`) to understand what changed. If nothing has changed, stop and tell the user there's nothing to commit.

2. **Pick a branch.** Run `git rev-parse --abbrev-ref HEAD`. If the current branch is the default branch (`main` or `master`), create a new branch first — never commit feature work straight onto the default branch. Name it after the change using the commit type, e.g. `feat/marketplace-install` or `fix/statusline-crash`. If already on a non-default branch, stay on it.

3. **Stage.** Stage the relevant changes with `git add`. Prefer `git add -A` unless the user wants a subset, in which case stage only those paths.

4. **Write a Conventional Commits message.** Follow the spec in `docs/conventional-commits.md`:
   - Format: `<type>[optional scope]: <description>`
   - `type` is one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - `feat` = new feature (MINOR), `fix` = bug fix (PATCH). Use a scope when it adds clarity, e.g. `feat(skills): ...`.
   - Description is a short, imperative, lowercase summary — no trailing period.
   - For breaking changes, append `!` after the type/scope (e.g. `feat!:`) and/or add a `BREAKING CHANGE:` footer (must be uppercase).
   - Add a body (one blank line after the description) only when the *why* needs explaining; keep it free-form and wrapped.
   - **If the changes span more than one Conventional Commits type, prefer splitting into multiple focused commits** rather than one mixed commit.
   - End the commit message with this footer:
     ```
     Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
     ```

5. **Commit.** On Windows/PowerShell, multi-line messages with backticks or `$` can be mangled by here-strings — write the message to a temp file and use `git commit -F <file>`, then delete the file. This avoids the leading/trailing-character corruption that `-m @'...'@` can introduce.

6. **Push.** Push the branch and set upstream if needed: `git push --set-upstream origin <branch>`.
   - Pushing to the default branch may be blocked by the harness safety classifier. If a push is denied, do **not** try to work around it — stop and tell the user to run the push themselves (e.g. via `!git push ...` in the prompt), then continue.

7. **Open the PR.** Use the `gh` CLI: `gh pr create --title "<conventional title>" --body "<body>"`.
   - Title should follow the same Conventional Commits format as the commit subject.
   - Body should summarize what changed and why, and include a test plan / verification section when relevant.
   - End the PR body with:
     ```
     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```
   - If there's no GitHub remote, or `gh` is unavailable/unauthenticated, report that and stop after the push.

8. **Report.** Print the commit hash, the branch, the push result, and the PR URL.

## Notes

- Only commit/push/PR what the user asked for. Don't sweep in unrelated changes.
- Don't skip hooks (`--no-verify`) or bypass signing unless the user explicitly asks.
- Prefer a new commit over amending an existing one unless the user asks to amend.
