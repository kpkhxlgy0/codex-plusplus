import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, parse, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test, { type TestContext } from "node:test";
import { create as createTar } from "tar";
import { assertSafeSourceReplacement } from "../src/source-replacement";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
type Event = { kind: string; args?: string[]; url?: string; marker?: string };

function sourceTree(root: string, marker: string): void {
  for (const file of ["bin/codexplusplus.js", "packages/installer/src/cli.ts", "packages/runtime/src/main.ts"]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), "// inert source fixture\n");
  }
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "codex-plusplus", version: "999.0.0", workspaces: ["packages/*"] }));
  writeFileSync(join(root, "marker.txt"), marker);
  mkdirSync(join(root, "packages/installer/dist"), { recursive: true });
  writeFileSync(join(root, "packages/installer/dist/cli.js"), `
const fs = require("node:fs");
fs.appendFileSync(process.env.FIXTURE_EVENTS, JSON.stringify({ kind: "repair", args: process.argv.slice(2), marker: ${JSON.stringify(marker)} }) + "\\n");
if (process.env.FIXTURE_CHANGE_DURING_REPAIR) {
  fs.mkdirSync(process.env.FIXTURE_CHANGE_DURING_REPAIR, { recursive: true });
  fs.writeFileSync(require("node:path").join(process.env.FIXTURE_CHANGE_DURING_REPAIR, "keep.txt"), "keep changed backup");
}
if (process.env.FIXTURE_FAIL_REPAIR === "1") process.exit(23);
`);
}

async function fixture(t: TestContext) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "codexpp-self-update-safety-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, "source");
  const home = join(root, "home");
  const userData = join(root, "user-data");
  const eventsFile = join(root, "events.jsonl");
  sourceTree(source, "local edits");
  mkdirSync(home);
  // Link production code into an inert source fixture. --preserve-symlinks makes
  // the real findSourceRoot locate this fixture, never the developer checkout.
  rmSync(join(source, "packages/installer/src"), { recursive: true });
  symlinkSync(join(repoRoot, "packages/installer/src"), join(source, "packages/installer/src"), "junction");
  symlinkSync(join(repoRoot, "node_modules"), join(root, "node_modules"), "junction");
  const payload = join(root, "download/payload");
  sourceTree(payload, "downloaded source");
  const archive = join(root, "source.tar.gz");
  await createTar({ gzip: true, file: archive, cwd: dirname(payload) }, ["payload"]);
  const harness = join(root, "run.mjs");
  writeFileSync(harness, `
import fs from "node:fs";
import childProcess from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
const record = event => fs.appendFileSync(process.env.FIXTURE_EVENTS, JSON.stringify(event) + "\\n");
const realSpawnSync = childProcess.spawnSync;
// Only package installation/build and remote HTTP are faked. Filesystem
// replacement, source discovery, archive extraction, state, and repair are real.
childProcess.spawnSync = (command, args, options) => {
  if (command === "npm" || command === "npm.cmd") {
    record({ kind: "npm", args });
    return { status: 0, signal: null, stdout: "", stderr: "" };
  }
  return realSpawnSync(command, args, options);
};
syncBuiltinESMExports();
globalThis.fetch = async url => {
  record({ kind: "fetch", url: String(url) });
  if (String(url).includes("api.github.com")) return new Response(JSON.stringify({ tag_name: "v999.0.0", html_url: "https://example.test/release", draft: false, prerelease: false }));
  if (process.env.FIXTURE_CHANGE_AFTER_DOWNLOAD) fs.mkdirSync(process.env.FIXTURE_CHANGE_AFTER_DOWNLOAD, { recursive: true });
  return new Response(fs.readFileSync(process.env.FIXTURE_ARCHIVE));
};
try {
  const { selfUpdate } = await import(process.env.FIXTURE_MODULE);
  await selfUpdate(JSON.parse(process.env.FIXTURE_OPTIONS));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
`);
  const run = (options: Record<string, unknown> = {}, env: Record<string, string> = {}) => spawnSync(process.execPath, ["--preserve-symlinks", "--import", "tsx", harness], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 30_000,
    env: {
      ...process.env, HOME: home, USERPROFILE: home, SUDO_USER: "", SUDO_UID: "", SUDO_GID: "",
      CODEX_PLUSPLUS_HOME: userData, CODEX_PLUSPLUS_REPO: "example/fixture", CODEX_PLUSPLUS_REF: "",
      FIXTURE_EVENTS: eventsFile, FIXTURE_ARCHIVE: archive,
      FIXTURE_MODULE: pathToFileURL(join(source, "packages/installer/src/commands/self-update.ts")).href,
      FIXTURE_OPTIONS: JSON.stringify({ quiet: true, ...options }), ...env,
    },
  });
  return {
    root, source, home, userData, run,
    events: (): Event[] => existsSync(eventsFile) ? readFileSync(eventsFile, "utf8").trim().split("\n").map(line => JSON.parse(line)) : [],
    state: () => JSON.parse(readFileSync(join(userData, "self-update-state.json"), "utf8")),
  };
}

for (const git of [".git directory", ".git file", ".GIT directory", "nested .git file", "checkout ancestor", "uppercase checkout ancestor"] as const) {
  test(`manual self-update preserves a source with ${git} before network access`, async t => {
    const f = await fixture(t);
    const gitPath = git.endsWith("checkout ancestor") ? join(f.root, git.startsWith("uppercase") ? ".GIT" : ".git")
      : git.startsWith("nested") ? join(f.source, "nested/.git")
      : join(f.source, git.startsWith(".GIT") ? ".GIT" : ".git");
    mkdirSync(dirname(gitPath), { recursive: true });
    if (git.endsWith("file")) writeFileSync(gitPath, "gitdir: elsewhere\n");
    else mkdirSync(gitPath);
    const result = f.run({ force: true });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /Git[\s\S]*install/i);
    assert.equal(readFileSync(join(f.source, "marker.txt"), "utf8"), "local edits");
    assert.equal(existsSync(`${f.source}.previous`), false);
    assert.deepEqual(f.events(), []);
    assert.equal(f.state().status, "failed");
  });
}

for (const force of [false, true]) {
  test(`watcher preserves a local checkout and still repairs with force=${force}`, async t => {
    const f = await fixture(t);
    mkdirSync(join(f.source, ".git"));
    const result = f.run({ watcher: true, force });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.deepEqual(f.events(), [{ kind: "repair", args: ["repair", "--watcher", "--quiet"], marker: "local edits" }]);
    assert.equal(f.state().status, "disabled");
    assert.match(f.state().error, /Git[\s\S]*install/i);
    assert.equal(readFileSync(join(f.source, "marker.txt"), "utf8"), "local edits");
  });
}

test("autoUpdate=false continues repair without a release check", async t => {
  const f = await fixture(t);
  mkdirSync(f.userData);
  writeFileSync(join(f.userData, "config.json"), JSON.stringify({ codexPlusPlus: { autoUpdate: false } }));
  const result = f.run({ watcher: true });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(f.events(), [{ kind: "repair", args: ["repair", "--watcher", "--quiet"], marker: "local edits" }]);
  assert.equal(f.state().status, "disabled");
});

for (const backup of ["unrelated", "Git", "nested Git", "failed rollback"] as const) {
  test(`self-update preserves a ${backup} backup before network access`, async t => {
    const f = await fixture(t);
    const backupPath = `${f.source}.${backup === "failed rollback" ? "failed" : "previous"}`;
    if (backup === "Git" || backup === "nested Git") sourceTree(backupPath, "backup source");
    else mkdirSync(backupPath);
    writeFileSync(join(backupPath, "keep.txt"), "keep backup");
    if (backup === "Git") mkdirSync(join(backupPath, ".git"));
    if (backup === "nested Git") mkdirSync(join(backupPath, "nested/.GIT"), { recursive: true });
    const result = f.run({ force: true });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(readFileSync(join(backupPath, "keep.txt"), "utf8"), "keep backup");
    assert.deepEqual(f.events(), []);
  });
}

for (const backups of ["absent", "empty", "recognized"] as const) {
  test(`self-update replaces downloaded source with ${backups} backups`, async t => {
    const f = await fixture(t);
    for (const suffix of ["previous", "failed"]) {
      if (backups === "recognized") sourceTree(`${f.source}.${suffix}`, "older downloaded source");
      if (backups === "empty") mkdirSync(`${f.source}.${suffix}`);
    }
    const result = f.run();
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(readFileSync(join(f.source, "marker.txt"), "utf8"), "downloaded source");
    assert.equal(readFileSync(join(`${f.source}.previous`, "marker.txt"), "utf8"), "local edits");
    assert.equal(f.state().status, "updated");
    assert.deepEqual(f.events().map(event => event.kind), ["fetch", "fetch", "npm", "npm", ...(process.platform === "win32" ? ["npm"] : []), "repair"]);
  });
}

test("source replacement rejects home and filesystem roots without touching them", () => {
  assert.throws(() => assertSafeSourceReplacement(homedir()), /home root/);
  assert.throws(() => assertSafeSourceReplacement(parse(homedir()).root), /filesystem/);
});

for (const link of ["source", "ancestor", "previous", "failed", "ancestor before dot-dot"] as const) {
  test(`source replacement rejects a symlink ${link}`, async t => {
    const f = await fixture(t);
    const destination = join(f.root, "link");
    symlinkSync(f.source, destination, "junction");
    const target = link === "source" ? destination
      : link === "ancestor" ? join(destination, "child")
      : link === "ancestor before dot-dot" ? `${destination}/../other`
      : `${f.source}.${link}`;
    if (link === "previous" || link === "failed") symlinkSync(f.source, target, "junction");
    assert.throws(() => assertSafeSourceReplacement(target), /symlink/);
    assert.equal(readFileSync(join(f.source, "marker.txt"), "utf8"), "local edits");
  });
}

test("self-update rejects a symlink source before network access", async t => {
  const f = await fixture(t);
  const actual = `${f.source}-real`;
  renameSync(f.source, actual);
  symlinkSync(actual, f.source, "junction");
  const result = f.run({ force: true });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /symlink/);
  assert.deepEqual(f.events(), []);
  assert.equal(readFileSync(join(actual, "marker.txt"), "utf8"), "local edits");
});

test("watcher honors no-repair while preserving a local checkout", async t => {
  const f = await fixture(t);
  mkdirSync(join(f.source, ".git"));
  const result = f.run({ watcher: true, repair: false, force: true });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(f.state().status, "disabled");
  assert.deepEqual(f.events(), []);
});

for (const changed of ["source", "previous", "failed"] as const) {
  test(`self-update rechecks ${changed} before replacing source`, async t => {
    const f = await fixture(t);
    const changedPath = changed === "source" ? f.source : `${f.source}.${changed}`;
    if (changed !== "source") sourceTree(changedPath, "backup source");
    const git = join(changedPath, "nested/.git");
    const result = f.run({ force: true }, { FIXTURE_CHANGE_AFTER_DOWNLOAD: git });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /Git/);
    assert.equal(readFileSync(join(f.source, "marker.txt"), "utf8"), "local edits");
    assert.ok(existsSync(git));
    assert.equal(f.state().status, "failed");
    assert.ok(f.events().some(event => event.kind === "fetch"));
    assert.equal(f.events().some(event => event.kind === "repair"), false);
  });
}

test("repair failure rolls back a downloaded source update", async t => {
  const f = await fixture(t);
  sourceTree(`${f.source}.failed`, "older failed source");
  const result = f.run({}, { FIXTURE_FAIL_REPAIR: "1" });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.equal(readFileSync(join(f.source, "marker.txt"), "utf8"), "local edits");
  assert.equal(readFileSync(join(`${f.source}.failed`, "marker.txt"), "utf8"), "downloaded source");
  assert.equal(existsSync(`${f.source}.previous`), false);
  assert.equal(f.state().status, "failed");
});

test("rollback preserves a Git backup introduced by repair", async t => {
  const f = await fixture(t);
  const git = `${f.source}.failed/.git`;
  const result = f.run({}, { FIXTURE_FAIL_REPAIR: "1", FIXTURE_CHANGE_DURING_REPAIR: git });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /Git/);
  assert.equal(readFileSync(join(git, "keep.txt"), "utf8"), "keep changed backup");
  assert.equal(readFileSync(join(f.source, "marker.txt"), "utf8"), "downloaded source");
  assert.equal(readFileSync(join(`${f.source}.previous`, "marker.txt"), "utf8"), "local edits");
  assert.equal(f.state().status, "failed");
});

test("native macOS temporary aliases remain usable for archive installs", { skip: process.platform !== "darwin" }, t => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-self-update-native-temp-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  sourceTree(root, "source archive");
  assert.doesNotThrow(() => assertSafeSourceReplacement(root));
  // A missing backup beneath the native /tmp alias needs no scratch directory.
  assert.doesNotThrow(() => assertSafeSourceReplacement(`/tmp/${root.split("/").pop()}-missing-backup`));
});
