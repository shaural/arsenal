# Arsenal: Linear-Integrated Developer Workflow System

## Context

Build a full dev-loop workflow (orient → plan → start → implement → review → test → ship) on top of the existing `commit-push-pr` skill. The plugin already supports hooks natively via `hooks/hooks.json` — no user-level settings edits needed for the branch guard or issue tracker. Four specialized agents cover the four roles (planner, developer, reviewer, tester); each one lists the arsenal skills it can invoke in its `skills` frontmatter, so the work flows through shared, already-tested logic rather than duplicating it.

---

## Architecture

```
User
  │
  ├─ /arsenal:orient        → read-only daily standup view
  ├─ /arsenal:context       → load issue spec from Linear
  │
  ├─ /arsenal:start         → branch + Linear "In Progress"
  │        │
  │        └─ delegates to ──► planner agent
  │                           (enhance-issue, plan skills)
  │
  ├─ /arsenal:enhance-issue → score + rewrite single issue
  ├─ /arsenal:plan          → decompose into sub-issues (Wave 4)
  │
  ├─ /arsenal:ship          → reads commit-push-pr/SKILL.md
  │                           + Linear "In Review" + PR link
  │
  └─ delegates to:
       ├─► developer agent (worktree, isolation)
       │    uses: start, context skills
       │    commits locally, posts Linear comment, stops
       │
       ├─► reviewer agent (after PR exists)
       │    uses: gh pr diff/review
       │
       └─► tester agent
            uses: context skill, runs test suite
```

---

## Build Order

```
Wave 1 — core loop
  skills/start/SKILL.md
  skills/ship/SKILL.md
  hooks/hooks.json              ← branch guard (PreToolUse)
  scripts/hooks/branch-guard.js

Wave 2 — orientation + tracking
  skills/orient/SKILL.md
  skills/context/SKILL.md
  hooks/hooks.json              ← add Stop + Notification hooks
  scripts/hooks/track-issue.js
  scripts/hooks/log-notify.js

Wave 3 — quality + parallel work
  skills/enhance-issue/SKILL.md
  agents/developer.md           ← isolation: worktree; skills: start, context
  agents/reviewer.md
  agents/tester.md              ← skills: context

Wave 4 — planning (deferred)
  skills/plan/SKILL.md
  agents/planner.md             ← skills: orient, context, enhance-issue, plan
```

---

## Files to Create

### `skills/start/SKILL.md`

```markdown
---
name: start
description: Begin working on a Linear issue. Use when the user says "start SHA-X",
  "begin SHA-X", "work on SHA-X", "pick up SHA-X". Accepts the issue ID as an
  argument or will prompt for it.
allowed-tools: Bash(git checkout:*), Bash(git branch:*)
---

# start

## Steps

1. Accept the issue ID (e.g. SHA-6). If missing, ask for it.
2. Call `mcp__claude_ai_Linear__get_issue` → extract title, description,
   `gitBranchName`, current state.
3. Display a compact brief:
   - **Purpose** — one sentence.
   - **Scope / Assumptions** — key bullets.
   - **Acceptance Criteria** — verbatim list.
4. Check out the branch:
   - `git branch --list <gitBranchName>` to see if it exists.
   - Exists → `git checkout <gitBranchName>`
   - Missing → `git checkout -b <gitBranchName>`
5. `mcp__claude_ai_Linear__save_issue` → set `state: "In Progress"`.
6. Confirm: "On branch `<gitBranchName>`. SHA-X moved to In Progress."
```

---

### `skills/ship/SKILL.md`

```markdown
---
name: ship
description: Commit, push, open a PR, and move the Linear issue to In Review. Use
  when the user says "ship", "ship SHA-X", "done with SHA-X", "ready for review",
  "commit push pr and update linear". Wraps commit-push-pr with Linear bookends.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*),
  Bash(git checkout:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*),
  Bash(gh pr create:*), Bash(git rev-parse:*)
---

# ship

## Context

- Current branch: !`git branch --show-current`
- Current git status: !`git status`

## Steps

1. Infer the Linear issue ID from the current branch by matching `sha-(\d+)`
   (case-insensitive). If the user passed an ID explicitly, use that instead.
   If neither works, ask.

2. Read `skills/commit-push-pr/SKILL.md` and execute every step in it exactly
   as written, with one change to the PR title format: prefix with the issue
   identifier. Example: `feat(sha-6): build v1 Chase CSV import flow`.
   The commit scope should match: `feat(sha-6): ...`.

3. Once the PR URL is available:
   a. `mcp__claude_ai_Linear__save_issue` → set `state: "In Review"`.
   b. Attach the PR URL to the issue (use the attachment/url field per the MCP
      tool schema).

4. Report: commit hash, branch, PR URL, and confirmation that Linear was updated.
```

---

### `skills/orient/SKILL.md`

```markdown
---
name: orient
description: Show a prioritized view of active and queued work. Use when the user
  says "orient me", "what's next", "what should I work on", "show my issues",
  "status". Read-only — makes no Linear writes.
---

# orient

## Context

- Current branch: !`git branch --show-current`

## Steps

1. `mcp__claude_ai_Linear__list_issues` filtered to `state: "In Progress"` →
   show as **Active**.
2. `mcp__claude_ai_Linear__list_issues` filtered to `state: "Todo"` →
   show as **Up Next**.
3. `mcp__claude_ai_Linear__list_issues` filtered to `state: "Backlog"`,
   ordered by priority descending → show as **Pipeline** (top 5).
4. Check the current branch. If it matches `sha-(\d+)`, note which issue is
   active in the working tree.
5. Suggest the "best next" issue in one sentence: highest-priority unblocked
   Todo, or top Backlog if Todo is empty.
```

---

### `skills/context/SKILL.md`

```markdown
---
name: context
description: Load the full spec for a Linear issue. Use when the user says "context
  SHA-X", "load context for SHA-X", "what does SHA-X say", "show me the issue",
  "remind me what this issue wants". If no ID is given, infers it from the current
  branch. Read-only.
allowed-tools: Bash(git branch:*)
---

# context

## Context

- Current branch: !`git branch --show-current`

## Steps

1. If no issue ID was given, parse it from the current branch (match `sha-(\d+)`).
   If still none, ask.
2. `mcp__claude_ai_Linear__get_issue` with `includeRelations: true`.
3. Render these sections (skip any absent in the description):
   - **Purpose**
   - **Scope / Assumptions**
   - **Acceptance Criteria**
   - **Non-Goals**
   - **Implementation Notes**
   - **Testing / Verification**
   - **Linked issues** (from relations)
```

---

### `skills/enhance-issue/SKILL.md`

```markdown
---
name: enhance-issue
description: Score and rewrite a Linear issue to be implementation-ready. Use when
  the user says "enhance SHA-X", "improve this issue", "quality check SHA-X", "make
  SHA-X implementation-ready", "clean up SHA-X".
---

# enhance-issue

## Steps

1. Accept issue ID from the user, or parse from branch name.
2. `mcp__claude_ai_Linear__get_issue` → fetch title and description.
3. Score 1–5 against this rubric:
   - **1** — title only
   - **2** — rough intent, no acceptance criteria
   - **3** — purpose + scope, weak AC
   - **4** — Purpose / Scope / Assumptions / AC / Non-Goals / Edge Cases /
             Implementation Notes
   - **5** — level 4 + Testing/Verification + security notes where relevant
4. If score ≥ 4, report the score and stop (no edit needed).
5. Draft an improved description:
   - Preserve every existing decision, link, and constraint verbatim.
   - Add missing sections to reach score 5.
   - Use markdown headers matching the rubric section names.
6. Show a before/after diff in chat. Ask for confirmation before writing.
7. On confirmation: `mcp__claude_ai_Linear__save_issue` with the updated
   description (and title if it was vague).
```

---

### `agents/developer.md`

```markdown
---
name: developer
description: Implement a Linear issue autonomously in an isolated worktree. Delegate
  here when the user says "implement SHA-X in the background", "do SHA-X in a
  worktree", "run SHA-X in parallel", "work on SHA-X while I do something else".
  Always spawned with isolation="worktree" and run_in_background=true.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
  - mcp__claude_ai_Linear__get_issue
  - mcp__claude_ai_Linear__save_comment
skills:
  - start
  - context
---

# developer

You implement a Linear issue autonomously inside an isolated git worktree.

## Mission

1. Extract the issue ID from your prompt (e.g. SHA-10).
2. Call `/arsenal:start SHA-<ID>` — this creates/checks out the branch in the
   worktree and sets Linear to "In Progress".
3. Call `/arsenal:context SHA-<ID>` — loads the full spec.
4. Explore the codebase to understand existing patterns before writing anything.
   Find related files, utilities, and conventions you can reuse.
5. Implement to the Acceptance Criteria. Follow the Implementation Notes.
   Write tests per the Testing/Verification section if present.
6. Commit locally:
   - `git add -A`
   - `git commit -m "<conventional-commit-message>"` (one commit per logical change)
   Do NOT push.
7. Call `mcp__claude_ai_Linear__save_comment` on the issue with a work summary:
   - Files changed (list paths)
   - Approach taken (2–3 sentences)
   - Tests written (if any)
   - Deviations from spec (if any)
   - Local commits (short hashes)
8. Stop. The user will review the worktree and run `/arsenal:ship` when ready.

## If Blocked

Call `mcp__claude_ai_Linear__save_comment` with a clear blocker description,
then stop. Do not guess through ambiguity.
```

---

### `agents/reviewer.md`

```markdown
---
name: reviewer
description: Review a GitHub pull request and post inline comments. Delegate here
  when the user says "review PR #X", "do a code review of PR #X", "review this PR",
  "check the PR for SHA-X". Requires the PR to already exist (run /arsenal:ship first).
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# reviewer

You perform a focused code review on a GitHub pull request.

## Mission

1. Get the PR number from your prompt. If not provided, run
   `gh pr list --state open` and ask the user to confirm which one.
2. Fetch the PR:
   - `gh pr view <number>` — title, description, branch.
   - `gh pr diff <number>` — full diff.
3. Read changed files in full using the Read tool to understand context beyond
   the diff.
4. Review for:
   - **Correctness**: bugs, off-by-one errors, unhandled edge cases.
   - **Security**: injection, auth gaps, exposed secrets, unsafe input handling.
   - **Design**: unnecessary complexity, missed reuse of existing utilities.
   - **Tests**: missing coverage for the changed logic.
5. Post a GitHub review with inline comments:
   `gh pr review <number> --comment --body "<summary>" -F <file-with-comments>`
   or use `gh api` for inline comments per line.
6. Report: how many issues found (critical / suggestions), and a 2-sentence
   summary of overall code quality.
```

---

### `agents/tester.md`

```markdown
---
name: tester
description: Validate that a completed implementation meets its acceptance criteria.
  Delegate here when the user says "test SHA-X", "validate the implementation",
  "run the tests for SHA-X", "does this pass acceptance criteria". Run after the
  developer agent finishes or after the user has implemented manually.
tools:
  - Read
  - Grep
  - Glob
  - Bash
skills:
  - context
---

# tester

You validate that an implementation satisfies a Linear issue's acceptance criteria.

## Mission

1. Get the issue ID from your prompt or the current branch.
2. Call `/arsenal:context SHA-<ID>` to load the Acceptance Criteria and
   Testing/Verification sections.
3. Discover the test suite: look for `package.json` scripts, Makefiles,
   pytest configs, etc.
4. Run the tests: `npm test`, `pytest`, `go test ./...`, or equivalent.
5. For each Acceptance Criterion, verify whether it passes:
   - Check test output for explicit coverage of that criterion.
   - If no automated test covers it, note it as "unverified".
6. Report:
   - ✓ / ✗ status per acceptance criterion
   - Test suite pass/fail with failure output excerpt
   - List of criteria with no automated coverage
```

---

### Wave 4 (deferred — same patterns, create later)

**`skills/plan/SKILL.md`**: Decompose a parent issue into sub-issues.
Steps: `get_issue` → propose breakdown (title, purpose, size, block deps) →
confirm → `save_issue` for each sub-issue with `parentId`.

**`agents/planner.md`**: Project manager. Uses skills: `orient`, `context`,
`enhance-issue`, `plan`. Fetches all backlog issues, scores/enhances each,
proposes sub-issue breakdowns, reorganizes priorities. No code written.

---

## Hooks (in-plugin, `hooks/hooks.json`)

All three hooks are in the arsenal plugin itself — users get them on install,
no manual settings editing required.

### `hooks/hooks.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/branch-guard.js\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/track-issue.js\""
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/log-notify.js\""
          }
        ]
      }
    ]
  }
}
```

### `scripts/hooks/branch-guard.js`

Reads the Bash tool input from stdin and blocks `git push` when on `main`/`master`.

```js
let raw = '';
process.stdin.on('data', d => raw += d);
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(raw);
    const cmd = (event.tool_input?.command || event.input?.command || '');
    if (!String(cmd).includes('git push')) return;
    const { execSync } = require('child_process');
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    if (branch === 'main' || branch === 'master') {
      console.error(`BLOCKED: Cannot push directly to ${branch}. Create a feature branch first.`);
      process.exit(1);
    }
  } catch { /* allow on any error */ }
});
```

### `scripts/hooks/track-issue.js`

Writes `.claude/current-issue.txt` in the project root when on an `sha-*` branch.

```js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
try {
  const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const m = branch.match(/sha-(\d+)/i);
  if (m) {
    const dir = path.join(process.env.CLAUDE_PROJECT_DIR || '.', '.claude');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'current-issue.txt'), `SHA-${m[1]} (branch: ${branch})`);
  }
} catch { /* not in git repo, skip */ }
```

To surface this in a project's CLAUDE.md:
```markdown
Current issue: !cat .claude/current-issue.txt
```

### `scripts/hooks/log-notify.js`

Appends agent completion notifications to `${CLAUDE_PLUGIN_DATA}/notifications.log`.

```js
const fs = require('fs'), path = require('path');
const msg = process.env.CLAUDE_NOTIFICATION_MESSAGE || '';
if (msg) {
  const dir = path.join(process.env.CLAUDE_PLUGIN_DATA || '/tmp', 'logs');
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(path.join(dir, 'notifications.log'),
    `[${new Date().toISOString()}] ${msg}\n`);
}
```

---

## Full File List

| Path | Wave |
|---|---|
| `skills/start/SKILL.md` | 1 |
| `skills/ship/SKILL.md` | 1 |
| `hooks/hooks.json` | 1 (extended in Wave 2) |
| `scripts/hooks/branch-guard.js` | 1 |
| `skills/orient/SKILL.md` | 2 |
| `skills/context/SKILL.md` | 2 |
| `scripts/hooks/track-issue.js` | 2 |
| `scripts/hooks/log-notify.js` | 2 |
| `skills/enhance-issue/SKILL.md` | 3 |
| `agents/developer.md` | 3 |
| `agents/reviewer.md` | 3 |
| `agents/tester.md` | 3 |
| `skills/plan/SKILL.md` | 4 (deferred) |
| `agents/planner.md` | 4 (deferred) |

---

## How Skills Flow Through Agents

| Agent | Calls These Skills | Does NOT Do |
|---|---|---|
| `developer` | `start` (branch + Linear In Progress), `context` (load spec) | push, PR, Linear status changes |
| `tester` | `context` (load AC) | write code, commit |
| `reviewer` | _(none — uses gh directly)_ | write code, merge |
| `planner` *(Wave 4)* | `orient`, `context`, `enhance-issue`, `plan` | write code |

`ship` skill reads `skills/commit-push-pr/SKILL.md` at runtime and adds Linear steps on top — no duplication, stays in sync automatically.

---

## Verification

**Wave 1:**
1. `/arsenal:start SHA-6` → confirm branch created, Linear = In Progress.
2. Make a change → `/arsenal:ship` → confirm PR title has `sha-6`, Linear = In Review, PR link on card.
3. While on `main`, attempt push → hook blocks it with a clear message.

**Wave 2:**
4. `/arsenal:orient` → shows In Progress / Todo / Backlog with suggestion.
5. `/arsenal:context` (no arg, on sha-6 branch) → infers ID, renders all spec sections.

**Wave 3:**
6. "Implement SHA-10 in parallel" → developer agent spawns in worktree, main session uninterrupted, Linear comment appears on SHA-10 when done.
7. `/arsenal:enhance-issue SHA-8` → scores, shows diff preview, waits for confirmation.
8. "Review PR #5" → reviewer agent posts inline GitHub review comments.
9. "Test SHA-6" → tester agent runs suite, reports ✓/✗ per acceptance criterion.