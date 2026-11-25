#!/usr/bin/env bash
set -euo pipefail

PLUGIN=""
SKIP_LAUNCHER=0
NODE_OVERRIDE=""

usage() {
  cat <<'EOF'
Usage: ./install.sh [options]

Install or update Antigravity Desktop plugins into ~/.gemini/config/plugins/
and create a loopback debug launcher for macOS/Linux.

Options:
  -p, --plugin <name>   Install/update only the specified plugin directory
  --skip-launcher       Skip creating the debug launcher script / macOS .app
  --node <path>         Explicit Node.js binary path to write into installed sidecar.json
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
    --skip-launcher)
      SKIP_LAUNCHER=1
      shift
      ;;
    --node)
      [[ $# -ge 2 ]] || { echo "Error: $1 requires a value." >&2; exit 1; }
      NODE_OVERRIDE="$2"
      shift 2
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
OS_NAME="$(uname -s)"

mkdir -p "$TARGET_ROOT"

resolve_node_bin() {
  if [[ -n "$NODE_OVERRIDE" ]]; then
    if [[ -x "$NODE_OVERRIDE" ]]; then
      printf '%s\n' "$NODE_OVERRIDE"
      return 0
    fi
    echo "Error: Specified --node path is not executable: $NODE_OVERRIDE" >&2
    exit 1
  fi

  local cand=""
  if command -v node >/dev/null 2>&1; then
    cand="$(command -v node)"
  fi

  local candidates=(
    "$cand"
    "/opt/homebrew/bin/node"
    "/usr/local/bin/node"
    "/usr/bin/node"
  )

  # Also check nvm installations if present (pick highest version)
  if [[ -d "$HOME/.nvm/versions/node" ]]; then
    local nvm_latest=""
    nvm_latest="$(ls -d "$HOME/.nvm/versions/node"/v*/bin/node 2>/dev/null | sort -V | tail -n 1 || true)"
    if [[ -n "$nvm_latest" ]]; then
      candidates+=("$nvm_latest")
    fi
  fi

  for p in "${candidates[@]}"; do
    if [[ -n "$p" && -x "$p" ]]; then
      printf '%s\n' "$p"
      return 0
    fi
  done
  return 1
}

NODE_BIN="$(resolve_node_bin || true)"
if [[ -n "$NODE_BIN" ]]; then
  NODE_VER="$("$NODE_BIN" -p "process.versions.node" 2>/dev/null || echo "")"
  NODE_MAJOR="${NODE_VER%%.*}"
  if [[ -n "$NODE_MAJOR" && "$NODE_MAJOR" -lt 22 ]]; then
    echo "Warning: Detected Node.js v$NODE_VER at $NODE_BIN. Sidecars require Node.js >= 22 (for built-in WebSocket)." >&2
  fi
else
  echo "Warning: Node.js not found in PATH or standard locations. Sidecars require Node.js >= 22." >&2
fi

CANDIDATES=()
for dir in "$BASE_DIR"/*/; do
  [[ -d "$dir" ]] || continue
  dir="${dir%/}"
  name="$(basename "$dir")"
  if [[ -f "$dir/plugin.json" ]]; then
    if [[ -z "$PLUGIN" || "$name" == "$PLUGIN" ]]; then
      CANDIDATES+=("$dir")
    fi
  fi
done

if [[ ${#CANDIDATES[@]} -eq 0 ]]; then
  echo "Error: No matching plugin found in $BASE_DIR (Plugin='$PLUGIN')." >&2
  exit 1
fi

echo "[1/2] Installing Antigravity Desktop plugin(s) to $TARGET_ROOT ..."
for src_dir in "${CANDIDATES[@]}"; do
  name="$(basename "$src_dir")"
  dest_dir="$TARGET_ROOT/$name"
  mkdir -p "$dest_dir"

  for item in "$src_dir"/*; do
    [[ -e "$item" ]] || continue
    base="$(basename "$item")"
    [[ "$base" == "README.md" ]] && continue
    if [[ -d "$item" ]]; then
      cp -R "$item" "$dest_dir/"
    else
      cp -f "$item" "$dest_dir/$base"
    fi
  done

  # macOS/Linux GUI apps often inherit a minimal PATH without /opt/homebrew/bin or /usr/local/bin.
  # Patch ONLY the installed sidecar.json copy to point directly at the resolved absolute node binary.
  if [[ -n "$NODE_BIN" ]]; then
    for sidecar_cfg in "$dest_dir"/sidecars/*/sidecar.json; do
      [[ -f "$sidecar_cfg" ]] || continue
      "$NODE_BIN" -e '
        const fs = require("fs");
        const cfgPath = process.argv[1];
        const nodeBin = process.argv[2];
        const data = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
        if (data.command === "node") {
          data.command = nodeBin;
          fs.writeFileSync(cfgPath, JSON.stringify(data, null, 2) + "\n", "utf8");
        }
      ' "$sidecar_cfg" "$NODE_BIN"
    done
  fi

  echo "  Installed: $name"
done

if [[ "$SKIP_LAUNCHER" -eq 0 ]]; then
  echo "[2/2] Creating Antigravity Desktop loopback debug launcher ..."
  LAUNCHER_SH="$TARGET_ROOT/launch-antigravity-debug.sh"

  if [[ "$OS_NAME" == "Darwin" ]]; then
    cat > "$LAUNCHER_SH" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

APP_PATH=""
if [[ -d "/Applications/Antigravity.app" ]]; then
  APP_PATH="/Applications/Antigravity.app"
elif [[ -d "$HOME/Applications/Antigravity.app" ]]; then
  APP_PATH="$HOME/Applications/Antigravity.app"
fi

if [[ -n "$APP_PATH" ]]; then
  exec open -a "$APP_PATH" --args --remote-debugging-port=0 --remote-debugging-address=127.0.0.1
else
  exec open -a "Antigravity" --args --remote-debugging-port=0 --remote-debugging-address=127.0.0.1
fi
EOF
    chmod +x "$LAUNCHER_SH"
    echo "  Created CLI launcher: $LAUNCHER_SH"

    if command -v osacompile >/dev/null 2>&1; then
      APP_LAUNCHER="$HOME/Applications/Antigravity (Debug).app"
      mkdir -p "$HOME/Applications"
      rm -rf "$APP_LAUNCHER"
      osacompile -o "$APP_LAUNCHER" -e "do shell script \"/usr/bin/open -a 'Antigravity' --args --remote-debugging-port=0 --remote-debugging-address=127.0.0.1\""
      echo "  Created macOS launcher app: $APP_LAUNCHER"
    fi

    if [[ ! -d "/Applications/Antigravity.app" && ! -d "$HOME/Applications/Antigravity.app" ]]; then
      echo "  Note: Antigravity.app was not found in /Applications or ~/Applications yet."
      echo "        Install Antigravity Desktop first, then launch it via the debug launcher above."
    fi
  else
    cat > "$LAUNCHER_SH" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec antigravity --remote-debugging-port=0 --remote-debugging-address=127.0.0.1 "$@"
EOF
    chmod +x "$LAUNCHER_SH"
    echo "  Created CLI launcher: $LAUNCHER_SH"
  fi
fi

if [[ "$OS_NAME" == "Darwin" ]]; then
  ACTIVE_PORT_FILE="$HOME/Library/Application Support/Antigravity/DevToolsActivePort"
else
  ACTIVE_PORT_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/Antigravity/DevToolsActivePort"
fi

if [[ -f "$ACTIVE_PORT_FILE" ]]; then
  echo "Done! DevToolsActivePort is active. Toggle the plugin in Customizations (or restart Antigravity Desktop) if updating an already-running plugin."
else
  echo "Done! Please fully quit Antigravity Desktop (Cmd+Q) and launch it with:"
  if [[ "$OS_NAME" == "Darwin" ]]; then
    echo "  open -a 'Antigravity' --args --remote-debugging-port=0 --remote-debugging-address=127.0.0.1"
    echo "or double-click ~/Applications/Antigravity (Debug).app"
  else
    echo "  $TARGET_ROOT/launch-antigravity-debug.sh"
  fi
fi
