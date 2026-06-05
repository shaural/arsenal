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
| **Scripts** | `scripts/` | Helper scripts (e.g. the custom status line) |

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
│   └── example.md         # Agent template
├── skills/
│   └── example/
│       └── SKILL.md       # Skill template
├── scripts/
│   ├── statusline.js      # Custom status line (Node.js, no deps)
│   └── statusline.sh      # Legacy shell status line
└── CLAUDE.md              # Guidance for Claude Code in this repo
```

## License

Personal project — no license specified.
