#!/bin/bash

# ANSI color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
RESET='\033[0m'
BOLD='\033[1m'

# Read JSON from stdin (Claude Code provides context/token info)
json_input=$(cat)

# Extract context fields from JSON using correct Claude Code schema paths
tokens_used=$(echo "$json_input" | jq -r '.context_window.total_input_tokens // empty' 2>/dev/null)
tokens_limit=$(echo "$json_input" | jq -r '.context_window.context_window_size // empty' 2>/dev/null)
used_pct=$(echo "$json_input" | jq -r '.context_window.used_percentage // empty' 2>/dev/null)

# Get current directory from JSON cwd, fallback to shell PWD
cwd=$(echo "$json_input" | jq -r '.cwd // empty' 2>/dev/null)
if [ -n "$cwd" ]; then
  dir=$(basename "$cwd")
else
  dir=$(basename "$PWD")
fi

# Get git branch (skip optional locks to avoid race conditions)
branch=$(git -c core.useBuiltinFSMonitor=false rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -z "$branch" ]; then
  branch="no-git"
fi

# Get model display name from JSON input
model=$(echo "$json_input" | jq -r '.model.display_name // .model.id // empty' 2>/dev/null)
[ -z "$model" ] && model="unknown"

# Determine color based on context usage percentage
if [ -n "$used_pct" ]; then
  pct_num=$(echo "$used_pct" | cut -d. -f1)
  if [ "$pct_num" -lt 50 ]; then
    pct_color="$GREEN"
    pct_indicator="▁"
  elif [ "$pct_num" -lt 75 ]; then
    pct_color="$YELLOW"
    pct_indicator="▃"
  elif [ "$pct_num" -lt 90 ]; then
    pct_color="$YELLOW"
    pct_indicator="▅"
  else
    pct_color="$RED"
    pct_indicator="▇"
  fi
  pct_display="${pct_color}${pct_indicator} $(printf '%.0f' "$used_pct")%${RESET}"
else
  pct_display="--"
fi

# Format tokens display
if [ -n "$tokens_used" ] && [ -n "$tokens_limit" ]; then
  tokens_display="${CYAN}${tokens_used}${RESET}/${BLUE}${tokens_limit}${RESET}"
else
  tokens_display="--"
fi

# Build the status line
printf "${BOLD}${GREEN}[${RESET}%s${BOLD}${GREEN}]${RESET} ${BOLD}${BLUE}[${RESET}%s${BOLD}${BLUE}]${RESET} ${BOLD}${MAGENTA}[${RESET}%s${BOLD}${MAGENTA}]${RESET} ${BOLD}${CYAN}[${RESET}%s${BOLD}${CYAN}]${RESET} ctx:%s\n" \
  "$dir" \
  "$branch" \
  "$model" \
  "$tokens_display" \
  "$pct_display"
