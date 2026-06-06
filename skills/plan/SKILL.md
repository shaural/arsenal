---
name: plan
description: Decompose a parent Linear issue into sub-issues. Use when the user says
  "plan SHA-X", "break down SHA-X", "split SHA-X into sub-issues", "decompose SHA-X",
  "turn SHA-X into a checklist of issues". Accepts the parent issue ID as an argument
  or parses it from the current branch.
allowed-tools: Bash(git branch:*), mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__save_issue
---

# plan

## Context

- Current branch: !`git branch --show-current`

## Steps

1. Determine the parent issue ID from the user's message, or parse it from the
   current branch (`sha-(\d+)` → `SHA-<n>`). If none, ask and stop.
2. `mcp__claude_ai_Linear__get_issue` on the parent → read the title, description,
   `teamId`, and `projectId` (sub-issues inherit the same team and project).
3. Propose a breakdown into sub-issues. For each one draft:
   - **Title** — imperative and specific.
   - **Purpose** — one line on what it delivers.
   - **Size** — a rough estimate (S / M / L).
   - **Blocked by** — which other proposed sub-issues (if any) must land first.
   Aim for vertical slices that each ship value; avoid layer-by-layer splits.
   Keep the set small (typically 3–7) — split further only when justified.
4. Show the full proposed breakdown in chat as a scannable list and **ask for
   confirmation before writing anything**. Let the user add, drop, merge, resize,
   or reorder items. Do not create issues until they approve.
5. On confirmation, create each sub-issue with `mcp__claude_ai_Linear__save_issue`:
   - `parentId` set to the parent issue's ID.
   - `teamId` (and `projectId` when the parent has one) inherited from the parent.
   - `title` from the breakdown.
   - `description` — at minimum the **Purpose**, plus a `> Part of SHA-<parent>`
     line. Use real newlines in the markdown, never literal `\n`.
   - Express any blocking dependency in the description (e.g.
     `> Blocked by: <sibling title>`) — note Linear relations are set after the
     sibling exists and has an ID.
6. Report the created sub-issues (`SHA-X · title`) and confirm they are linked
   under the parent.
