# Arsenal

A personal [Claude Code](https://claude.com/claude-code) plugin toolkit — skills, commands, and agents that extend Claude's capabilities for daily development workflows.

## Install

Arsenal is distributed as a Claude Code plugin. You don't need to clone the repo — install it directly from GitHub.

### From inside Claude Code (recommended)

Add this repo as a plugin marketplace, then install the plugin:

```
/plugin marketplace add shaural/arsenal
/plugin install arsenal@arsenal
```

That's it. Skills show up as `/arsenal:<skill-name>` and agents become available to Claude automatically. To update later, run `/plugin marketplace update arsenal`.

You can also run `/plugin` with no arguments to open the plugin manager and browse, enable, or disable installed plugins from a menu.

### Try it for one session (no install)

To load the plugin temporarily without installing it, point Claude Code at the repo over the network at startup:

```bash
claude --plugin-url https://github.com/shaural/arsenal/archive/refs/heads/master.zip
```

The plugin is loaded for that session only and isn't persisted.

### Local development

If you *are* working on the plugin locally, load it straight from disk:

```bash
claude --plugin-dir /path/to/arsenal
```

Run `/reload-plugins` after edits to pick up changes without restarting.

## What's inside

| Component | Location | Purpose |
| --- | --- | --- |
| **Skills** | `skills/<name>/SKILL.md` | User-triggered actions invoked as `/arsenal:<skill-name>` |
| **Agents** | `agents/<name>.md` | Autonomous subagents Claude delegates to for focused tasks |
| **Hooks** | `hooks/hooks.json` + `scripts/hooks/` | Event handlers that ship with the plugin (branch guard, issue tracking, notification log) |
| **Scripts** | `scripts/` | Helper scripts (e.g. the custom status line) |

## Linear dev workflow

Arsenal layers a full dev loop — **orient → start → implement → ship → review → merge** — on top of [Linear](https://linear.app) (via the Linear MCP server) and the `commit-push-pr` skill. The issue's `sha-<n>` branch name ties everything together: most skills infer the active issue from the current branch, so you rarely type the ID twice.

The Linear state moves with you: `start` → **In Progress**, `ship` → **In Review** (PR attached). You review and merge the PR yourself, and **merging moves the issue to Done automatically** — `ship` embeds a `Fixes SHA-X` link in the PR body, so Linear's GitHub PR automation completes the issue on merge. No manual "mark done" step. (`land` is kept only as a fallback for when that automation isn't connected.)

> **One-time setup for auto-Done:** connect Linear's [GitHub integration](https://linear.app/docs/github) and enable **Pull request automation** for your team so merged PRs complete their linked issues. Until that's on, run `/arsenal:land` after merging.

### Skills

| Command | What it does |
| --- | --- |
| `/arsenal:orient` | Read-only standup view: Active / Up Next / Pipeline, plus a best-next-issue suggestion. |
| `/arsenal:context [SHA-X]` | Render the full spec for an issue (infers the ID from the branch if omitted). |
| `/arsenal:start SHA-X` | Check out the issue's branch and move it to **In Progress**. |
| `/arsenal:enhance-issue SHA-X` | Score the issue 1–5 and rewrite it to implementation-ready, preserving every existing decision (asks before writing). |
| `/arsenal:ship [SHA-X]` | Run `commit-push-pr` (issue-scoped commit/PR title), then move the issue to **In Review** and attach the PR. |
| `/arsenal:land [SHA-X]` | *Fallback.* Verify the PR is merged and move the issue to **Done** manually — only needed when Linear's auto-Done-on-merge isn't connected. |

### Agents

| Agent | Delegate when you say… | Does |
| --- | --- | --- |
| `developer` | "implement SHA-X in the background / a worktree" | Implements an issue autonomously in an isolated worktree, commits locally, posts a Linear summary. Never pushes or PRs. |
| `reviewer` | "review PR #X" | Focused PR review with inline GitHub comments. Leaves the verdict to you. |
| `tester` | "test SHA-X" | Runs the test suite and maps results to the issue's acceptance criteria. |

### Hooks (automatic, ship with the plugin)

- **branch-guard** — blocks `git push` while on `main`/`master`, so work always flows through a feature branch.
- **track-issue** — records the active issue to `.claude/current-issue.txt` whenever you're on a `sha-<n>` branch. Surface it in a project's `CLAUDE.md` with `Current issue: !cat .claude/current-issue.txt`.
- **log-notify** — appends Claude Code notifications (e.g. a background agent finishing) to `.claude/logs/notifications.log`.

A typical loop:

```
/arsenal:orient            # what should I work on?
/arsenal:start SHA-6       # branch + In Progress
# ...implement, or delegate to the developer agent...
/arsenal:ship              # commit, push, PR (Fixes SHA-6), In Review + PR attached
# ...you review and merge the PR on GitHub -> Linear auto-moves it to Done...
```

## Status line

`scripts/statusline.js` is a zero-dependency Node.js status line for Claude Code. It reads the status JSON from stdin and prints a single colored line showing:

- Current directory (home collapsed to `~`)
- Git branch with a dirty flag (`*`)
- Active model
- Context-window usage (color-coded bar + token count)
- Session cost
- Plan rate-limit usage (5-hour / 7-day)

It replaces an earlier `jq`-based shell script that broke when `jq` wasn't installed.

Set it as your status line command in your Claude Code settings:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /absolute/path/to/arsenal/scripts/statusline.js"
  }
}
```

## Develop

### Add a skill

1. Create `skills/<skill-name>/SKILL.md` (use `skills/example/SKILL.md` as a template).
2. Fill in the frontmatter:
   - `name` — lowercase, hyphenated identifier
   - `description` — *when* Claude should use the skill; include trigger phrases users might say
3. Add the instructions Claude should follow when the skill runs.

### Add an agent

1. Create `agents/<agent-name>.md` (use `agents/example.md` as a template).
2. Fill in the frontmatter:
   - `name`, `description` (when to delegate)
   - `tools` — only the tools the agent actually needs
3. Write the system prompt describing the agent's mission.

### Conventions

- Names are lowercase with hyphens (`my-skill`, `my-agent`).
- Skill/agent descriptions should be specific and action-oriented — they're what Claude matches requests against.
- Grant agents only the tools they use.
- Frontmatter is YAML delimited by triple dashes (`---`).
- Don't put `skills/`, `agents/`, or `hooks/` inside `.claude-plugin/` — only `plugin.json` and `marketplace.json` live there. Everything else sits at the repo root.

## Project structure

```
.
├── .claude-plugin/
│   ├── plugin.json        # Plugin manifest (name, version, skill dirs)
│   └── marketplace.json   # Marketplace entry so the repo is directly installable
├── agents/
│   ├── developer.md       # Implements an issue in an isolated worktree
│   ├── reviewer.md        # Reviews a GitHub PR
│   ├── tester.md          # Validates an implementation against acceptance criteria
│   └── example.md         # Agent template
├── skills/
│   ├── orient/            # Standup view of active/queued work
│   ├── context/           # Load an issue's full spec
│   ├── start/             # Branch + move issue to In Progress
│   ├── enhance-issue/     # Score and rewrite an issue
│   ├── ship/              # commit-push-pr + move issue to In Review
│   ├── land/              # Fallback: verify PR merged + move issue to Done
│   ├── commit-push-pr/    # Commit, push, open a PR
│   └── example/           # Skill template
├── hooks/
│   └── hooks.json         # Registers the plugin's PreToolUse/Stop/Notification hooks
├── scripts/
│   ├── hooks/             # branch-guard, track-issue, log-notify (Node.js, no deps)
│   ├── statusline.js      # Custom status line (Node.js, no deps)
│   └── statusline.sh      # Legacy shell status line
└── CLAUDE.md              # Guidance for Claude Code in this repo
```

## License

Personal project — no license specified.
