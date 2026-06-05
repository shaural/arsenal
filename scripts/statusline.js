#!/usr/bin/env node
"use strict";

// Claude Code status line. Reads the status JSON from stdin and prints a
// single colored line. No external dependencies (replaces a jq-based shell
// script that broke when jq was not installed).

const { execSync } = require("child_process");
const fs = require("fs");

// ANSI colors
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// --- read + parse stdin -----------------------------------------------------
let raw = "";
try {
  raw = fs.readFileSync(0, "utf8");
} catch {
  /* no stdin */
}
let data = {};
try {
  data = JSON.parse(raw);
} catch {
  /* leave data empty; segments fall back gracefully */
}

// --- directory --------------------------------------------------------------
const cwd = data.cwd || (data.workspace && data.workspace.current_dir) || process.cwd();
// Show the full path, with the home directory collapsed to ~ and normalized
// to forward slashes for readability.
const home = (process.env.HOME || process.env.USERPROFILE || "").replace(/[\\/]+$/, "");
let dir = cwd.replace(/[\\/]+$/, "").replace(/\\/g, "/");
if (home) {
  const homeFwd = home.replace(/\\/g, "/");
  if (dir.toLowerCase().startsWith(homeFwd.toLowerCase())) {
    dir = "~" + dir.slice(homeFwd.length);
  }
}

// --- git branch + dirty flag ------------------------------------------------
function git(args) {
  return execSync(`git ${args}`, {
    cwd,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
}
let branch = "";
let dirty = false;
try {
  branch = git("rev-parse --abbrev-ref HEAD");
  dirty = git("status --porcelain") !== "";
} catch {
  /* not a git repo */
}
if (!branch) branch = "no-git";

// --- model ------------------------------------------------------------------
const model =
  (data.model && (data.model.display_name || data.model.id)) || "unknown";

// --- context window ---------------------------------------------------------
const ctx = data.context_window || {};
const pct = ctx.used_percentage;
const used = ctx.total_input_tokens;
const size = ctx.context_window_size;

function fmtTokens(n) {
  if (n == null) return "";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

let ctxSeg = `${c.gray}ctx --${c.reset}`;
if (typeof pct === "number") {
  let col, bar;
  if (pct < 50) [col, bar] = [c.green, "▁"];
  else if (pct < 75) [col, bar] = [c.yellow, "▃"];
  else if (pct < 90) [col, bar] = [c.yellow, "▅"];
  else [col, bar] = [c.red, "▇"];
  const tok =
    used != null && size != null
      ? ` ${c.gray}${fmtTokens(used)}/${fmtTokens(size)}${c.reset}`
      : "";
  ctxSeg = `${col}${bar} ${Math.round(pct)}%${c.reset}${tok}`;
}

// --- session cost -----------------------------------------------------------
const costUsd = data.cost && data.cost.total_cost_usd;
let costSeg = "";
if (typeof costUsd === "number") {
  costSeg = `${c.cyan}$${costUsd.toFixed(2)}${c.reset}`;
}

// --- plan usage (rate limits) ----------------------------------------------
// Colors a percentage green/yellow/red the same way as context.
function usageColor(p) {
  if (p < 50) return c.green;
  if (p < 75) return c.yellow;
  if (p < 90) return c.yellow;
  return c.red;
}
const rl = data.rate_limits || {};
const usageParts = [];
if (rl.five_hour && typeof rl.five_hour.used_percentage === "number") {
  const p = rl.five_hour.used_percentage;
  usageParts.push(`${usageColor(p)}5h ${Math.round(p)}%${c.reset}`);
}
if (rl.seven_day && typeof rl.seven_day.used_percentage === "number") {
  const p = rl.seven_day.used_percentage;
  usageParts.push(`${usageColor(p)}7d ${Math.round(p)}%${c.reset}`);
}
const usageSeg = usageParts.join(` ${c.gray}|${c.reset} `);

// --- assemble ---------------------------------------------------------------
const sep = `  ${c.gray}·${c.reset}  `;
const branchSeg =
  `${c.blue}⎇ ${branch}${c.reset}` + (dirty ? `${c.yellow}*${c.reset}` : "");

const line = [
  `${c.bold}${c.green}${dir}${c.reset}`,
  branchSeg,
  `${c.magenta}${model}${c.reset}`,
  ctxSeg,
  costSeg,
  usageSeg,
]
  .filter(Boolean) // drop segments with no data (cost / rate limits are optional)
  .join(sep);

process.stdout.write(line + "\n");
