#!/usr/bin/env bash
set -euo pipefail

REPO="${CODEX_PLUSPLUS_REPO:-kpkhxlgy0/codex-plusplus}"
REF="${CODEX_PLUSPLUS_REF:-master}"

fail() {
  echo "[!] $1" >&2
  echo "    Paste this error into Codex if you need help." >&2
  exit 1
}

require_command() {
  local cmd="$1"
  local message="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "$message"
  fi
}

chown_to_sudo_user() {
  local path="$1"
  if [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_UID:-}" ] && [ -n "${SUDO_GID:-}" ]; then
    chown -R "$SUDO_UID:$SUDO_GID" "$path" 2>/dev/null || true
  fi
}

resolve_sudo_home() {
  if [ "$(id -u)" -ne 0 ] || [ -z "${SUDO_USER:-}" ] || [ "$SUDO_USER" = "root" ]; then
    return 0
  fi

  local sudo_home=""
  if command -v dscl >/dev/null 2>&1; then
    sudo_home="$(dscl . -read "/Users/$SUDO_USER" NFSHomeDirectory 2>/dev/null | awk '{print $2}')"
  elif command -v getent >/dev/null 2>&1; then
    sudo_home="$(getent passwd "$SUDO_USER" | cut -d: -f6)"
  fi

  if [ -n "$sudo_home" ] && [ -d "$sudo_home" ]; then
    HOME="$sudo_home"
    export HOME
  fi
}

resolve_sudo_home
INSTALL_DIR="${CODEX_PLUSPLUS_SOURCE_DIR:-$HOME/.codex-plusplus/source}"

if ! command -v node >/dev/null 2>&1; then
  fail "Node.js 20+ is required but node was not found."
fi

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  fail "Node.js 20+ is required; found $(node -v)."
fi

require_command npm "npm is required to build codex-plusplus from source."

# This stays self-contained because the online installer is also piped to Bash.
inspect_source_path() {
  node - "$@" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const [mode, ...paths] = process.argv.slice(2);
const entryFiles = ["bin/codexplusplus.js", "packages/installer/src/cli.ts", "packages/runtime/src/main.ts"];

function isSource(directory) {
  try {
    return JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8")).name === "codex-plusplus"
      && entryFiles.every(entry => fs.lstatSync(path.join(directory, entry)).isFile());
  } catch { return false; }
}

function statIfPresent(target) {
  try { return fs.lstatSync(target); }
  catch (error) { if (error.code === "ENOENT") return undefined; throw error; }
}

function canonicalPath(target) {
  let ancestor = path.resolve(target);
  const missing = [];
  while (!statIfPresent(ancestor)) {
    missing.unshift(path.basename(ancestor));
    const parent = path.dirname(ancestor);
    if (parent === ancestor) throw new Error(`Could not resolve source destination: ${target}`);
    ancestor = parent;
  }
  return path.join(fs.realpathSync(ancestor), ...missing);
}

function rejectSymlinkComponents(target) {
  // Check before path.resolve removes '..', which could hide a traversed link.
  const raw = path.isAbsolute(target) ? target : `${process.cwd()}${path.sep}${target}`;
  const root = path.parse(raw).root;
  const separator = process.platform === "win32" ? /[\\/]/ : /\//;
  let component = root;
  for (const part of raw.slice(root.length).split(separator)) {
    if (!part) continue;
    component += `${separator.test(component.slice(-1)) ? "" : path.sep}${part}`;
    if (statIfPresent(component)?.isSymbolicLink()) throw new Error(`Refusing a symlink path: ${target}`);
  }
}

function checkDestination(target) {
  rejectSymlinkComponents(target);
  const absolute = canonicalPath(target);
  const home = canonicalPath(process.env.HOME || os.homedir());
  if (absolute === path.parse(absolute).root || path.relative(home, absolute) === "") {
    throw new Error(`Refusing to replace filesystem or home root: ${target}`);
  }
  for (let ancestor = absolute; ; ancestor = path.dirname(ancestor)) {
    if (statIfPresent(ancestor)?.isSymbolicLink()) throw new Error(`Refusing a symlink path: ${target}`);
    if (statIfPresent(path.join(ancestor, ".git"))) throw new Error(`Refusing a path inside a Git working tree: ${target}`);
    if (ancestor === path.dirname(ancestor)) break;
  }
  const existing = statIfPresent(absolute);
  if (!existing) return;
  if (!existing.isDirectory()) throw new Error(`Refusing to replace a non-directory: ${target}`);
  const pending = [absolute];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.toLowerCase() === ".git") {
        throw new Error(`Refusing to replace a tree containing Git data: ${target}`);
      }
      // Dirent.isDirectory does not follow symlinks into other trees.
      if (entry.isDirectory()) pending.push(path.join(directory, entry.name));
    }
  }
  if (fs.readdirSync(absolute).length && !isSource(absolute)) {
    throw new Error(`Refusing to replace an unrecognized source directory: ${target}`);
  }
}

try {
  if (mode === "local") {
    if (paths[0]) {
      const script = fs.realpathSync(paths[0]);
      if (fs.statSync(script).isFile() && isSource(path.dirname(script))) {
        console.log(path.dirname(script).split(path.sep).join("/"));
      }
    }
  } else if (mode === "source") {
    if (!isSource(paths[0])) throw new Error("The download is not a codex-plusplus source tree.");
  } else {
    paths.forEach(checkDestination);
  }
} catch (error) {
  // A pipeline or unrelated saved script has no local source tree.
  if (mode !== "local") { console.error(`[!] ${error.message}`); process.exit(1); }
}
NODE
}

build_source() {
  local source="$1"
  local downloaded="$2"
  local npm_command=(npm)
  if [ "$downloaded" != true ] && [ "$(id -u)" -eq 0 ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != root ]; then
    require_command sudo "sudo is required to build the local source as $SUDO_USER."
    npm_command=(sudo -u "$SUDO_USER" -- env "PATH=$PATH" "HOME=$HOME" npm)
  fi
  echo "Installing dependencies..."
  (
    cd "$source"
    if [ -f package-lock.json ]; then
      if ! "${npm_command[@]}" ci --workspaces --include-workspace-root --ignore-scripts; then
        if [ "$downloaded" != true ]; then
          fail "npm ci failed; the local source and lockfile have been preserved."
        fi
        echo "npm ci failed; regenerating the downloaded lockfile and installing workspace dependencies." >&2
        rm -f package-lock.json
        "${npm_command[@]}" install --workspaces --include-workspace-root --ignore-scripts ||
          fail "npm install failed while installing codex-plusplus dependencies."
      fi
    else
      "${npm_command[@]}" install --workspaces --include-workspace-root --ignore-scripts ||
        fail "npm install failed while installing codex-plusplus dependencies."
    fi
    echo "Building codex-plusplus..."
    "${npm_command[@]}" run build || fail "codex-plusplus build failed."
  )
}

LOCAL_SOURCE="$(inspect_source_path local "${BASH_SOURCE[0]:-}")"
if [ -n "$LOCAL_SOURCE" ]; then
  echo "Using local codex-plusplus source at: $LOCAL_SOURCE"
  build_source "$LOCAL_SOURCE" false
  echo "Running installer..."
  node "$LOCAL_SOURCE/packages/installer/dist/cli.js" install "$@" ||
    fail "codex-plusplus installer failed."
  exit 0
fi

guard_install_paths() {
  inspect_source_path guard "$INSTALL_DIR" "$INSTALL_DIR.previous" ||
    fail "Choose a source destination that does not replace an existing repository or unrelated files."
}

require_command curl "curl is required to download codex-plusplus from GitHub."
require_command tar "tar is required to unpack the codex-plusplus download."
guard_install_paths

WORK="$(mktemp -d "${TMPDIR:-/tmp}/codex-plusplus.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

ARCHIVE="$WORK/source.tar.gz"
EXTRACT="$WORK/extract"
NEXT="$WORK/source"

echo "Downloading codex-plusplus from https://github.com/$REPO ($REF)..."
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/$REF" -o "$ARCHIVE" ||
  fail "Download failed from https://github.com/$REPO ($REF). Check the repo, branch, and network connection."
mkdir -p "$EXTRACT"
tar -xzf "$ARCHIVE" -C "$EXTRACT" --strip-components 1 ||
  fail "Could not unpack the codex-plusplus download."
mv "$EXTRACT" "$NEXT"
inspect_source_path source "$NEXT" || fail "Could not validate the downloaded source."
build_source "$NEXT" true

guard_install_paths
mkdir -p "$(dirname "$INSTALL_DIR")"
guard_install_paths
rm -rf "$INSTALL_DIR.previous"
if [ -d "$INSTALL_DIR" ]; then
  guard_install_paths
  mv "$INSTALL_DIR" "$INSTALL_DIR.previous"
fi
guard_install_paths
mv "$NEXT" "$INSTALL_DIR"
chown_to_sudo_user "$INSTALL_DIR"

echo "Running installer..."
node "$INSTALL_DIR/packages/installer/dist/cli.js" install "$@" ||
  fail "codex-plusplus installer failed."

echo
echo "codex-plusplus source installed at: $INSTALL_DIR"
