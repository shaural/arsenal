---
name: enhance-issue
description: Score and rewrite a Linear issue to be implementation-ready. Use when
  the user says "enhance SHA-X", "improve this issue", "quality check SHA-X", "make
  SHA-X implementation-ready", "clean up SHA-X".
allowed-tools: Bash(git branch:*), mcp__claude_ai_Linear__get_issue, mcp__claude_ai_Linear__save_issue
---

# enhance-issue

## Steps

1. Determine the issue ID from the user's message, or parse it from the current
   branch (`sha-(\d+)`). If none, ask and stop.
2. `mcp__claude_ai_Linear__get_issue` → fetch the title and description.
3. Score the current quality 1–5 against this rubric:
   - **1** — title only.
   - **2** — rough intent, no acceptance criteria.
   - **3** — purpose + scope, weak acceptance criteria.
   - **4** — Purpose / Scope / Assumptions / Acceptance Criteria / Non-Goals /
     Edge Cases / Implementation Notes.
   - **5** — level 4 plus Testing/Verification and security notes where relevant.
4. If the score is **≥ 4**, report the score and stop — no edit needed.
5. Otherwise draft an improved description:
   - Preserve **every** existing decision, link, and constraint verbatim.
   - Add the missing sections to reach level 5.
   - Use markdown headers matching the rubric section names.
   - Do not invent product decisions; where a detail is genuinely unknown, add a
     `> TODO:` line rather than guessing.
6. Show a concise **before / after** in chat (current score → target score, plus
   the new description). Ask for confirmation before writing.
7. On confirmation: `mcp__claude_ai_Linear__save_issue` with the updated
   description (and a sharper title if the original was vague). Report the new score.
