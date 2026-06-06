---
name: create-issue
description: Create a new Linear issue from a rough idea or title. Use when the user
  says "create issue", "new issue", "add issue", "log a ticket", "create a ticket
  for", "add to backlog", or describes a feature/bug they want tracked. Drafts an
  implementation-ready description before saving.
allowed-tools: Bash(git branch:*), mcp__claude_ai_Linear__list_teams, mcp__claude_ai_Linear__save_issue
---

# create-issue

## Context

- Current branch: !`git branch --show-current`

## Steps

1. **Gather inputs** from the user's message:
   - **Title** — required. Extract from the message, or ask if not provided.
   - **Description / notes** — optional rough notes, constraints, or context the user
     supplied. Use verbatim as raw material; do not discard any detail.
   - **Priority** — optional (Urgent / High / Medium / Low). Default: none.
   - **Parent issue** — optional. If the user says "sub-issue of SHA-X" or "under
     SHA-X", capture it as `parentId`.

2. **Determine the team:**
   - If the current branch matches `sha-(\d+)`, the team identifier is the prefix
     (e.g. `SHA`). Use that team name.
   - Otherwise call `mcp__claude_ai_Linear__list_teams` and pick the first/only team,
     or ask the user if there is more than one.

3. **Draft an implementation-ready description** (target: level 5 quality):
   - **Purpose** — what problem this solves and why it matters.
   - **Scope & Assumptions** — what is in scope; what is explicitly not.
   - **Acceptance Criteria** — numbered, testable "Given / When / Then" or bullet
     checklist. At least two items.
   - **Non-Goals** — what this issue deliberately will not do.
   - **Implementation Notes** — approach hints, relevant files/components, known
     constraints.
   - **Testing / Verification** — how to verify the AC is met.
   - Where a detail is genuinely unknown, add a `> TODO:` line rather than inventing
     a decision. Preserve every constraint or detail the user gave verbatim.

4. **Show a preview** in chat:
   - Proposed title (refined if the original was vague).
   - Full drafted description.
   - Priority and parent (if set).
   Ask for confirmation before saving. If the user wants changes, revise and ask again.

5. **On confirmation:** call `mcp__claude_ai_Linear__save_issue` with:
   - `title`, `team`, `description`, `state: "Backlog"`
   - `priority` (map: Urgent→1, High→2, Medium→3, Low→4) if given
   - `parentId` if given

6. **Report:** the new issue identifier (e.g. `SHA-12`), title, and a one-line prompt:
   > Run `/arsenal:start SHA-12` when you're ready to begin work.
