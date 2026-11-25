#!/usr/bin/env bash
set -euo pipefail

PLUGIN=""
REMOVE_LAUNCHER=0

usage() {
  cat <<'EOF'
Usage: ./uninstall.sh [options]

Uninstall Antigravity Desktop plugins managed by this repository from
~/.gemini/config/plugins/.

Options:
  -p, --plugin <name>   Uninstall only the specified plugin directory
  --remove-launcher     Also remove the macOS/Linux debug launcher script and .app
  -h, --help            Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--plugin)
      [[ $# -ge 2 ]] || { echo "Error: $1 requires a value." >&2; exit 1; }
      PLUGIN="$2"
      shift 2
      ;;
    --remove-launcher)
      REMOVE_LAUNCHER=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_ROOT="$HOME/.gemini/config/plugins"

FOUND=0
for dir in "$BASE_DIR"/*/; do
  [[ -d "$dir" ]] || continue
  dir="${dir%/}"
  name="$(basename "$dir")"
  if [[ -f "$dir/plugin.json" ]]; then
    if [[ -z "$PLUGIN" || "$name" == "$PLUGIN" ]]; then
      FOUND=1
      dest_dir="$TARGET_ROOT/$name"
      if [[ -d "$dest_dir" ]]; then
        rm -rf "$dest_dir"
        echo "Removed plugin: $name"
      else
        echo "Not installed: $name"
      fi
    fi
  fi
done

if [[ "$FOUND" -eq 0 ]]; then
  echo "Error: No matching plugin found in $BASE_DIR (Plugin='$PLUGIN')." >&2
  exit 1
fi

if [[ "$REMOVE_LAUNCHER" -eq 1 ]]; then
  LAUNCHER_SH="$TARGET_ROOT/launch-antigravity-debug.sh"
  APP_LAUNCHER="$HOME/Applications/Antigravity (Debug).app"
  if [[ -f "$LAUNCHER_SH" ]]; then
    rm -f "$LAUNCHER_SH"
    echo "Removed launcher script: $LAUNCHER_SH"
  fi
  if [[ -d "$APP_LAUNCHER" ]]; then
    rm -rf "$APP_LAUNCHER"
    echo "Removed macOS launcher app: $APP_LAUNCHER"
  fi
fi

echo "Uninstall complete."
