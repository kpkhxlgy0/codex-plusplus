import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const script = readFileSync(join(repoRoot, "install.sh"), "utf8");
const bashCandidates = process.platform === "win32"
  ? [join(process.env.USERPROFILE ?? "", "scoop/apps/git/current/bin/bash.exe"), "C:/Program Files/Git/bin/bash.exe", join(process.env.LOCALAPPDATA ?? "", "Programs/Git/bin/bash.exe"), ...(process.env.PATH ?? "").split(delimiter).map((directory) => join(directory, "bash.exe"))]
  : ["bash"];
const bash = bashCandidates.find((candidate) => {
  const result = spawnSync(candidate, ["--version"], { encoding: "utf8" });
  return result.status === 0 && (process.platform !== "win32" || /cygwin|msys/iu.test(result.stdout));
});

type Event = { command: string; cwd: string; args: string[]; marker?: string; effectiveUser?: string };

function bashPath(path: string) {
  return process.platform === "win32" ? path.replace(/\\/gu, "/").replace(/^([A-Za-z]):/u, (_, drive: string) => `/${drive.toLowerCase()}`) : path;
}

function sourceTree(path: string, marker: string, git = false) {
  mkdirSync(join(path, "packages/installer/src"), { recursive: true });
  mkdirSync(join(path, "packages/runtime/src"), { recursive: true });
  mkdirSync(join(path, "bin"), { recursive: true });
  writeFileSync(join(path, "package.json"), JSON.stringify({ name: "codex-plusplus", scripts: { build: "fixture" }, workspaces: ["packages/*"] }));
  writeFileSync(join(path, "packages/installer/package.json"), JSON.stringify({ name: "codex-plusplus" }));
  writeFileSync(join(path, "packages/installer/src/cli.ts"), "// inert fixture entry\n");
  writeFileSync(join(path, "packages/runtime/src/main.ts"), "// inert fixture runtime\n");
  writeFileSync(join(path, "bin/codexplusplus.js"), "// inert fixture entry\n");
  writeFileSync(join(path, "install.sh"), script);
  writeFileSync(join(path, "package-lock.json"), "local lockfile sentinel\n");
  writeFileSync(join(path, "marker.txt"), marker);
  if (git) mkdirSync(join(path, ".git"));
}

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "codex-plusplus-bootstrap-sh-")));
  const local = join(root, "local");
  const home = join(root, "home");
  const cwd = join(root, "elsewhere");
  const bin = join(root, "bin");
  const events = join(root, "events.jsonl");
  const runner = join(root, "runner.cjs");
  const platformOverride = join(root, "platform.cjs");
  for (const path of [home, cwd, bin]) mkdirSync(path);
  sourceTree(local, "local edits", true);
  const payload = join(root, "download/payload");
  sourceTree(payload, "downloaded source");
  const archive = join(root, "source.tar.gz");
  const packed = spawnSync(bash!, ["-c", 'tar -czf "$1" -C "$2" payload', "fixture", bashPath(archive), bashPath(dirname(payload))], { encoding: "utf8" });
  assert.equal(packed.status, 0, packed.stderr);

  // External dependency/app installation, download, and privilege changes are inert.
  // The actual bootstrap, filesystem safety checks, tar extraction, and Node run normally.
  writeFileSync(runner, `
const fs = require("node:fs");
const path = require("node:path");
const [command, ...args] = process.argv.slice(2);
fs.appendFileSync(process.env.FIXTURE_EVENTS, JSON.stringify({ command, args, cwd: process.cwd(), effectiveUser: process.env.FIXTURE_EFFECTIVE_USER }) + "\\n");
if (command === "boundary") {
  for (const arg of args.filter(arg => !arg.startsWith("-"))) {
    const target = path.resolve(arg);
    const relative = path.relative(process.env.FIXTURE_ROOT, target);
    if (relative === ".." || relative.startsWith(".." + path.sep) || path.isAbsolute(relative)) process.exit(98);
  }
} else if (command === "curl") {
  const output = args[args.indexOf("-o") + 1];
  fs.copyFileSync(process.env.FIXTURE_ARCHIVE, output);
  if (process.env.FIXTURE_CHANGE_AFTER_DOWNLOAD) fs.mkdirSync(process.env.FIXTURE_CHANGE_AFTER_DOWNLOAD, { recursive: true });
} else if (command === "npm") {
  if (args[0] === "ci" && process.env.FIXTURE_FAIL_CI === "1") process.exit(19);
  if (args[0] === "run" && args[1] === "build") {
    fs.mkdirSync("packages/installer/dist", { recursive: true });
    const marker = fs.readFileSync("marker.txt", "utf8");
    fs.writeFileSync("packages/installer/dist/cli.js", 'const fs = require("node:fs"); fs.appendFileSync(process.env.FIXTURE_EVENTS, JSON.stringify({ command: "installer", args: process.argv.slice(2), cwd: process.cwd(), effectiveUser: process.env.FIXTURE_EFFECTIVE_USER, marker: ' + JSON.stringify(marker) + ' }) + "\\\\n");');
  }
}
`);
  // Keep native path semantics, but exercise the inline guard's macOS branch.
  writeFileSync(platformOverride, 'require("node:path"); if (process.argv[1] === "-") Object.defineProperty(process, "platform", { value: "darwin" });\n');
  for (const command of ["npm", "curl", "chown"]) {
    writeFileSync(join(bin, command), `#!/usr/bin/env bash\nexec node "$FIXTURE_RUNNER" ${command} "$@"\n`, { mode: 0o755 });
  }
  writeFileSync(join(bin, "id"), '#!/usr/bin/env bash\nif [ "${1:-}" = -u ]; then printf "%s\\n" "${FIXTURE_UID:-1000}"; else command -p id "$@"; fi\n', { mode: 0o755 });
  writeFileSync(join(bin, "dscl"), '#!/usr/bin/env bash\nprintf "NFSHomeDirectory: %s\\n" "$HOME"\n', { mode: 0o755 });
  writeFileSync(join(bin, "getent"), '#!/usr/bin/env bash\nexit 0\n', { mode: 0o755 });
  writeFileSync(join(bin, "sudo"), '#!/usr/bin/env bash\nnode "$FIXTURE_RUNNER" sudo "$@" || exit $?\n[ "$1" = -u ] && [ "$3" = -- ] || exit 96\nexport FIXTURE_EFFECTIVE_USER="$2"\nshift 3\nexec "$@"\n', { mode: 0o755 });
  for (const command of ["rm", "mv"]) {
    writeFileSync(join(bin, command), `#!/usr/bin/env bash\nnode "$FIXTURE_RUNNER" boundary "$@" || exit $?\ncommand -p ${command} "$@"\n`, { mode: 0o755 });
  }
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "PATH")), HOME: home, TMPDIR: bashPath(root), PATH: `${bin}${delimiter}${process.env.PATH}`, FIXTURE_BIN: bashPath(bin), FIXTURE_ROOT: root, FIXTURE_RUNNER: runner, FIXTURE_EVENTS: events, FIXTURE_ARCHIVE: archive, SUDO_USER: "", SUDO_UID: "", SUDO_GID: "", CODEX_PLUSPLUS_REPO: "", CODEX_PLUSPLUS_REF: "" };
  const run = (options: { pipeline?: boolean; cwd?: string; destination?: string; args?: string[]; env?: Record<string, string> } = {}) => {
    const args = options.args ?? [];
    const preflight = 'export PATH="$FIXTURE_BIN:$PATH"; [ "$(command -v curl)" = "$FIXTURE_BIN/curl" ] || exit 97; ';
    return spawnSync(bash!, options.pipeline
      ? ["--noprofile", "--norc", "-c", preflight + 'cat "$1" | "$BASH" -s -- "${@:2}"', "fixture", join(local, "install.sh"), ...args]
      : ["--noprofile", "--norc", "-c", preflight + 'exec "$BASH" "$@"', "fixture", join(local, "install.sh"), ...args], {
      cwd: options.cwd ?? cwd,
      env: { ...env, CODEX_PLUSPLUS_SOURCE_DIR: options.destination ?? join(home, ".codex-plusplus/source"), ...options.env },
      encoding: "utf8",
      timeout: 30_000,
    });
  };
  return {
    root, local, home, cwd, run, platformOverride,
    events: (): Event[] => existsSync(events) ? readFileSync(events, "utf8").trim().split("\n").map((line) => JSON.parse(line)).filter((event) => event.command !== "boundary") : [],
    cleanup: () => {
      assert.ok(root.startsWith(join(realpathSync(tmpdir()), "codex-plusplus-bootstrap-sh-")));
      rmSync(root, { recursive: true, force: true });
    },
  };
}

test("Bash source bootstrap uses its file location, rebuilds local edits, and forwards install arguments", { skip: !bash }, () => {
  const f = fixture();
  try {
    const destination = join(f.root, "unrelated-destination");
    mkdirSync(destination);
    writeFileSync(join(destination, "keep.txt"), "keep destination");
    const result = f.run({ destination, args: ["--app", "an app with spaces", "--verbose"] });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const events = f.events();
    assert.deepEqual(events.map((event) => event.command), ["npm", "npm", "installer"]);
    assert.deepEqual(events[0].args, ["ci", "--workspaces", "--include-workspace-root", "--ignore-scripts"]);
    assert.deepEqual(events[1].args, ["run", "build"]);
    assert.equal(resolve(events[0].cwd), f.local);
    assert.equal(events[2].marker, "local edits");
    assert.deepEqual(events[2].args, ["install", "--app", "an app with spaces", "--verbose"]);
    assert.equal(readFileSync(join(destination, "keep.txt"), "utf8"), "keep destination");
    assert.equal(readFileSync(join(f.local, "package-lock.json"), "utf8"), "local lockfile sentinel\n");
    assert.equal(existsSync(`${f.local}.previous`), false);
  } finally { f.cleanup(); }
});

test("Bash local bootstrap installs dependencies when no lockfile exists", { skip: !bash }, () => {
  const f = fixture();
  try {
    rmSync(join(f.local, "package-lock.json"));
    const result = f.run();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(f.events()[0].args, ["install", "--workspaces", "--include-workspace-root", "--ignore-scripts"]);
  } finally { f.cleanup(); }
});

test("Bash source archives without Git metadata are used in place", { skip: !bash }, () => {
  const f = fixture();
  try {
    rmSync(join(f.local, ".git"), { recursive: true });
    const result = f.run();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(f.events()[0]?.command, "npm");
    assert.equal(f.events().at(-1)?.marker, "local edits");
  } finally { f.cleanup(); }
});

for (const invalidSource of ["wrong package", "missing runtime entry"] as const) {
  test(`Bash does not use nearby files with ${invalidSource} as local source`, { skip: !bash }, () => {
    const f = fixture();
    try {
      if (invalidSource === "wrong package") writeFileSync(join(f.local, "package.json"), JSON.stringify({ name: "another-package" }));
      else rmSync(join(f.local, "packages/runtime/src/main.ts"));
      const result = f.run();
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(f.events()[0]?.command, "curl");
      assert.equal(f.events().at(-1)?.marker, "downloaded source");
      assert.equal(readFileSync(join(f.local, "marker.txt"), "utf8"), "local edits");
    } finally { f.cleanup(); }
  });
}

test("Bash local npm ci failure preserves the checkout and lockfile and stops before build", { skip: !bash }, () => {
  const f = fixture();
  try {
    const result = f.run({ destination: f.local, env: { FIXTURE_FAIL_CI: "1" } });
    assert.notEqual(result.status, 0);
    assert.deepEqual(f.events().map((event) => [event.command, event.args[0]]), [["npm", "ci"]]);
    assert.equal(readFileSync(join(f.local, "package-lock.json"), "utf8"), "local lockfile sentinel\n");
    assert.equal(readFileSync(join(f.local, "marker.txt"), "utf8"), "local edits");
    assert.ok(existsSync(join(f.local, ".git")));
    assert.equal(existsSync(`${f.local}.previous`), false);
  } finally { f.cleanup(); }
});

for (const failCi of [false, true]) {
  test(`Bash local sudo bootstrap builds as the invoking user${failCi ? " and preserves failure" : " while keeping installer elevated"}`, { skip: !bash }, () => {
    const f = fixture();
    try {
      const result = f.run({ env: { FIXTURE_UID: "0", FIXTURE_EFFECTIVE_USER: "root", SUDO_USER: "fixture-user", SUDO_UID: "1001", SUDO_GID: "1002", FIXTURE_FAIL_CI: failCi ? "1" : "0" } });
      assert.equal(result.status === 0, !failCi, result.stdout + result.stderr);
      const events = f.events();
      const npmEvents = events.filter((event) => event.command === "npm");
      assert.deepEqual(npmEvents.map((event) => event.effectiveUser), failCi ? ["fixture-user"] : ["fixture-user", "fixture-user"]);
      assert.deepEqual(events.filter((event) => event.command === "sudo").map((event) => event.args.slice(0, 4)), failCi ? [["-u", "fixture-user", "--", "env"]] : [["-u", "fixture-user", "--", "env"], ["-u", "fixture-user", "--", "env"]]);
      assert.equal(events.some((event) => event.command === "chown"), false, "the existing checkout must not be recursively chowned");
      assert.deepEqual(events.filter((event) => event.command === "installer").map((event) => event.effectiveUser), failCi ? [] : ["root"]);
      assert.equal(readFileSync(join(f.local, "package-lock.json"), "utf8"), "local lockfile sentinel\n");
      assert.equal(readFileSync(join(f.local, "marker.txt"), "utf8"), "local edits");
    } finally { f.cleanup(); }
  });
}

test("Bash pipeline invoked inside a checkout downloads the requested GitHub source", { skip: !bash }, () => {
  const f = fixture();
  try {
    const destination = join(f.root, "online");
    const result = f.run({ pipeline: true, cwd: f.local, destination, args: ["--verbose"], env: { CODEX_PLUSPLUS_REPO: "example/fork", CODEX_PLUSPLUS_REF: "feature/ref" } });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const events = f.events();
    assert.equal(events[0].command, "curl");
    assert.ok(events[0].args.includes("https://codeload.github.com/example/fork/tar.gz/feature/ref"));
    assert.equal(events.at(-1)?.marker, "downloaded source");
    assert.deepEqual(events.at(-1)?.args, ["install", "--verbose"]);
    assert.equal(readFileSync(join(f.local, "marker.txt"), "utf8"), "local edits");
    assert.equal(readFileSync(join(destination, "marker.txt"), "utf8"), "downloaded source");
  } finally { f.cleanup(); }
});

for (const boundary of ["checkout", "checkout child", "nested .git directory", "nested .git file", "nested .GIT directory", "unknown destination", "unknown backup", "Git backup", "nested Git backup", "home", "filesystem root"] as const) {
  test(`Bash online bootstrap refuses ${boundary} before downloading`, { skip: !bash }, () => {
    const f = fixture();
    try {
      let destination = join(f.root, "online");
      if (boundary === "checkout") destination = f.local;
      else if (boundary === "checkout child") destination = join(f.local, "child/source");
      else if (boundary === "home") destination = f.home;
      else if (boundary === "filesystem root") destination = resolve(f.root, "/");
      else if (boundary.includes("backup")) {
        const backup = `${destination}.previous`;
        if (boundary === "unknown backup") {
          mkdirSync(backup);
          writeFileSync(join(backup, "keep.txt"), "backup sentinel");
        } else {
          sourceTree(backup, "backup sentinel", boundary === "Git backup");
          if (boundary === "nested Git backup") {
            mkdirSync(join(backup, "child"));
            writeFileSync(join(backup, "child/.git"), "gitdir: somewhere\n");
          }
        }
      } else {
        sourceTree(destination, "destination sentinel");
        if (boundary.startsWith("nested")) {
          mkdirSync(join(destination, "child"));
          if (boundary.endsWith("directory")) mkdirSync(join(destination, boundary.includes(".GIT") ? "child/.GIT" : "child/.git"));
          else writeFileSync(join(destination, "child/.git"), "gitdir: somewhere\n");
        } else writeFileSync(join(destination, "package.json"), JSON.stringify({ name: "unrelated-project" }));
      }
      const result = f.run({ pipeline: true, destination, env: boundary.includes(".GIT") ? { NODE_OPTIONS: `--require="${f.platformOverride.replace(/\\/gu, "/")}"` } : {} });
      assert.notEqual(result.status, 0, result.stdout + result.stderr);
      assert.deepEqual(f.events(), [], "protected paths must be rejected before download or install");
      assert.equal(readFileSync(join(f.local, "marker.txt"), "utf8"), "local edits");
      if (boundary.includes("backup")) assert.ok(existsSync(`${destination}.previous`));
      if (boundary.toLowerCase().startsWith("nested .git") || boundary === "unknown destination") assert.equal(readFileSync(join(destination, "marker.txt"), "utf8"), "destination sentinel");
    } finally { f.cleanup(); }
  });
}

for (const link of ["destination", "ancestor", "ancestor with parent traversal", "backup"] as const) {
  test(`Bash online bootstrap refuses a symlink ${link}`, { skip: !bash }, (t) => {
    const f = fixture();
    try {
      const target = join(f.root, "symlink-target");
      sourceTree(target, "symlink sentinel");
      const destination = link === "ancestor" ? join(f.root, "linked/source")
        : link === "ancestor with parent traversal" ? `${join(f.root, "linked")}/../owned` : join(f.root, "online");
      const linkPath = link.startsWith("ancestor") ? join(f.root, "linked") : link === "backup" ? `${destination}.previous` : destination;
      if (link === "ancestor with parent traversal") sourceTree(join(f.root, "owned"), "owned source");
      try { symlinkSync(target, linkPath, process.platform === "win32" ? "junction" : "dir"); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EPERM") { t.skip("Creating symlinks is unavailable"); return; }
        throw error;
      }
      const result = f.run({ pipeline: true, destination });
      assert.notEqual(result.status, 0, result.stdout + result.stderr);
      assert.deepEqual(f.events(), []);
      assert.equal(readFileSync(join(target, "marker.txt"), "utf8"), "symlink sentinel");
    } finally { f.cleanup(); }
  });
}

for (const changedPath of ["destination", "backup"] as const) {
  test(`Bash online bootstrap rechecks the ${changedPath} before replacing an owned archive`, { skip: !bash }, () => {
    const f = fixture();
    try {
      const destination = join(f.root, "online");
      sourceTree(destination, "existing source");
      sourceTree(`${destination}.previous`, "previous source");
      const result = f.run({ pipeline: true, destination, env: { FIXTURE_CHANGE_AFTER_DOWNLOAD: join(changedPath === "backup" ? `${destination}.previous` : destination, "child/.git") } });
      assert.notEqual(result.status, 0, result.stdout + result.stderr);
      assert.equal(f.events()[0]?.command, "curl", "the initial path check should allow the owned archive");
      assert.equal(readFileSync(join(destination, "marker.txt"), "utf8"), "existing source");
      assert.equal(readFileSync(join(`${destination}.previous`, "marker.txt"), "utf8"), "previous source");
      assert.equal(f.events().some((event) => event.command === "installer"), false);
    } finally { f.cleanup(); }
  });
}

test("Bash online bootstrap updates owned source archives using the canonical default branch", { skip: !bash }, () => {
  const f = fixture();
  try {
    const destination = join(f.root, "online");
    sourceTree(destination, "existing source");
    sourceTree(`${destination}.previous`, "previous source");
    const result = f.run({ pipeline: true, destination });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(f.events()[0].args.includes("https://codeload.github.com/kpkhxlgy0/codex-plusplus/tar.gz/master"));
    assert.equal(readFileSync(join(destination, "marker.txt"), "utf8"), "downloaded source");
    assert.equal(readFileSync(join(`${destination}.previous`, "marker.txt"), "utf8"), "existing source");
    assert.equal(f.events().at(-1)?.marker, "downloaded source");
  } finally { f.cleanup(); }
});
