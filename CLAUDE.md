# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Arsenal** is a personal Claude Code plugin toolkit for skills, commands, and agents that extend Claude's capabilities for daily development workflows. The plugin is defined in `.claude-plugin/plugin.json` and contributes custom skills and agents.

## Plugin Structure

### Skills
Skills extend Claude Code's available actions and appear as `/skill-name` commands in the editor. Skills are defined in `skills/<skill-name>/SKILL.md`.

**Skill format:**
- Frontmatter with `name`, `description` (when to use the skill — include trigger phrases)
- Instructions for what Claude should do when the skill is invoked
- Keep descriptions specific and action-oriented ("do X", "set up Y", "review Z")

### Agents
Agents are autonomous subagents that can be delegated to for specific tasks. Agents are defined in `agents/<agent-name>.md`.

**Agent format:**
- Frontmatter with `name`, `description`, and `tools` (array of tools the agent has access to)
- System prompt (what the agent's mission is and how it should approach work)
- Description should be specific about when Claude should delegate to this agent

### Hooks
Hooks are event handlers that ship with the plugin and run automatically once it's installed — no user-level `settings.json` edits needed. They live in `hooks/hooks.json` at the plugin root, with their command scripts under `scripts/hooks/`.

**Hook conventions:**
- Reference scripts with `${CLAUDE_PLUGIN_ROOT}` (e.g. `node "${CLAUDE_PLUGIN_ROOT}/scripts/hooks/branch-guard.js"`).
- Hook scripts read their event payload as JSON on **stdin** (`tool_input`, `message`, etc.) — not from env vars.
- Exit codes matter for `PreToolUse`: exit `2` is a **blocking** error (stderr is fed back to Claude, the tool call is denied); any other non-zero is non-blocking. Bookkeeping hooks (`Stop`, `Notification`) should always exit `0` and fail open.
- Runtime artifacts hooks write (e.g. `.claude/current-issue.txt`, `.claude/logs/`) belong in `.gitignore`.

### Plugin Manifest
The plugin configuration is in `.claude-plugin/plugin.json`:
- `name` — plugin identifier
- `version` — semantic version
- `description` — one-line plugin purpose
- `skills` — array of directories containing skill definitions (e.g., `["./"]` includes all skills in root)

## Development Workflow

1. **Create a new skill:**
   - Add a directory `skills/<skill-name>/`
   - Create `skills/<skill-name>/SKILL.md` using the template in `skills/example/SKILL.md`
   - Fill in the frontmatter (`name`, `description`) and implementation instructions
   - The skill is automatically discovered by the plugin

2. **Create a new agent:**
   - Create `agents/<agent-name>.md`
   - Use the template in `agents/example.md` as reference
   - Define the agent's mission and tools in frontmatter
   - Add the system prompt that guides the agent's behavior

3. **Test skills/agents:**
   - Load the plugin in Claude Code with `/update` or by restarting
   - Invoke skills with `/skill-name`
   - Skills are user-triggered via Claude Code's slash commands
   - Agents are invoked by Claude when delegating work via the Agent tool

## Conventions

- **Skill descriptions**: Be specific about trigger phrases (e.g., "Use when the user asks to 'deploy X' or 'set up Y'")
- **Agent descriptions**: Describe when Claude should delegate ("when you need to...", "for tasks involving...")
- **Tool access**: Agents are restricted to the tools listed in frontmatter — don't grant tools they won't use
- **Frontmatter format**: YAML with triple-dash delimiters (`---`)

## Notes for Future Development

- The `.vs/` directory (Visual Studio cache) is in `.gitignore` and can be safely ignored
- Plugin discovery requires the plugin manifest to reference skill/agent directories
- Keep skill and agent names lowercase with hyphens (e.g., `my-skill`, `my-agent`)
