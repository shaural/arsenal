---
name: context
description: Load the full spec for a Linear issue. Use when the user says "context
  SHA-X", "load context for SHA-X", "what does SHA-X say", "show me the issue",
  "remind me what this issue wants". If no ID is given, infers it from the current
  branch. Read-only.
allowed-tools: Bash(git branch:*), mcp__claude_ai_Linear__get_issue
---

# context

## Context

- Current branch: !`git branch --show-current`

## Steps

1. Determine the issue ID:
   - Use the ID the user gave, if any.
   - Otherwise parse it from the current branch (match `sha-(\d+)` → `SHA-<n>`).
   - If still none, ask the user and stop.
2. `mcp__claude_ai_Linear__get_issue` with `includeRelations: true`.
3. Render these sections, skipping any that are absent from the description:
   - **Purpose**
   - **Scope / Assumptions**
   - **Acceptance Criteria**
   - **Non-Goals**
   - **Implementation Notes**
   - **Testing / Verification**
   - **Linked issues** (from relations — show ID, title, and relation type)
4. Read-only: make no Linear writes.
