import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import type { InstallerState } from "../src/state";
import type { WatcherKind } from "../src/watcher";

const src = resolve(dirname(fileURLToPath(import.meta.url)), "../src");
const realRequire = createRequire(import.meta.url);
type ModuleMocks = Record<string, unknown>;

// Evaluate production modules with their external boundaries replaced. No app
// files, user settings, processes, or scheduled tasks are touched by this suite.
function loadModule(file: string, mocks: ModuleMocks, argv: string[] = []): any {
  const filename = resolve(src, file);
  const compiled = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    transformers: {
      before: [context => {
        const visit: ts.Visitor = node => {
          if (ts.isPropertyAccessExpression(node) && ts.isMetaProperty(node.expression) && node.name.text === "url") {
            return ts.factory.createStringLiteral(pathToFileURL(filename).href);
          }
          return ts.visitEachChild(node, visit, context);
        };
        return root => ts.visitNode(root, visit) as ts.SourceFile;
      }],
    },
  }).outputText.replace(/^#![^\n]*\n/, "");
  const module = { exports: {} };
  const require = (name: string) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (["sade", "kleur", "node:path", "node:url"].includes(name)) return realRequire(name);
    throw new Error(`Unexpected dependency in watcher fixture: ${name}`);
  };
  const fixtureProcess = {
    argv: [process.execPath, "codex-plusplus", ...argv], platform: "linux", env: {},
    exit(code: number) { throw new Error(`Unexpected CLI exit: ${code}`); },
  };
  new Function("require", "module", "exports", "process", compiled)(require, module, module.exports, fixtureProcess);
  return module.exports;
}

function installerFixture(previousWatcher?: WatcherKind) {
  const appRoot = "/fixture/Codex";
  const scheduled: string[] = [];
  let removals = 0;
  let saved: InstallerState | undefined;
  const codex = {
    appRoot, resourcesDir: `${appRoot}/resources`, asarPath: `${appRoot}/resources/app.asar`,
    metaPath: null, electronBinary: `${appRoot}/Codex`, executable: `${appRoot}/Codex`,
    appName: "Codex", bundleId: null, channel: "stable", platform: "linux",
  };
  const paths = {
    root: "/fixture/data", backup: "/fixture/data/backup", runtime: "/fixture/data/runtime",
    binDir: "/fixture/data/bin", stateFile: "/fixture/data/state.json", tweaks: "/fixture/data/tweaks",
    logDir: "/fixture/data/logs", configFile: "/fixture/data/config.json", updateModeFile: "/fixture/data/update-mode.json",
  };
  const priorState: InstallerState | null = previousWatcher === undefined ? null : {
    version: "1.0.7", installedAt: "2026-10-01T00:00:00Z", appRoot,
    originalAsarHash: "original", patchedAsarHash: "patched", codexVersion: null,
    fuseFlipped: false, resigned: false, originalEntryPoint: "main.js", watcher: previousWatcher,
  };
  const noOp = () => {};
  const watcher = {
    installWatcher(root: string) { scheduled.push(root); return "systemd"; },
    uninstallWatcher() { removals += 1; },
  };
  const common: ModuleMocks = {
    "../platform.js": { locateCodex: () => codex },
    "../paths.js": { ensureUserPaths: () => paths },
    "../state.js": { readState: () => priorState, writeState: (_file: string, state: InstallerState) => { saved = state; } },
    "../watcher.js": watcher,
    "../version.js": { CODEX_PLUSPLUS_VERSION: "1.0.8" },
    "../source-root.js": { findSourceRoot: () => "/fixture/source" },
    "../windows-launcher.js": { installWindowsManagedAppLauncher: () => null },
  };
  const installer = loadModule("commands/install.ts", {
    ...common,
    "node:child_process": {},
    "node:fs": {
      existsSync: (target: string) => target.endsWith("assets/runtime") || target.endsWith("assets\\runtime"),
      cpSync: noOp, mkdirSync: noOp, openSync: () => 1, closeSync: noOp, copyFileSync: noOp, unlinkSync: noOp,
    },
    "../asar.js": { backupOnce: noOp, patchAsar: async () => {}, readHeaderHash: () => ({ headerHash: "fixture-hash" }) },
    "../integrity.js": {}, "../fuses.js": {}, "../fuse-backup.js": {}, "../codesign.js": {}, "../plist.js": {},
    "../cli-shim.js": { installCliShims: noOp, formatCliShimResult: () => "CLI ready" },
    "../codex-window-services.js": {}, "../ownership.js": { chownForTargetUser: noOp },
    "./debug.js": { getOpenReport: () => ({ status: "closed" }) }, "../alerts.js": {},
  });
  const repair = loadModule("commands/repair.ts", {
    ...common, "./install.js": installer, "node:fs": {}, "node:os": { platform: () => "linux" },
    "node:timers/promises": {}, "../asar.js": {},
    "../update-mode.js": { readUpdateMode: () => null },
    "../alerts.js": { isCodexRunning: () => false },
  }).repair as (options: Record<string, unknown>) => Promise<void>;
  return { install: installer.install as (options?: Record<string, unknown>) => Promise<void>, repair, appRoot,
    scheduled, removals: () => removals, saved: () => saved };
}

for (const { flags, expected } of [
  { flags: [], expected: false },
  { flags: ["--no-watcher"], expected: false },
  { flags: ["--watcher"], expected: true },
]) {
  test(`install CLI forwards watcher=${expected} for ${flags.join(" ") || "no watcher flag"}`, async () => {
    let received: Record<string, unknown> | undefined;
    const mocks: ModuleMocks = {
      "./commands/install.js": { install: async (options: Record<string, unknown>) => { received = options; } },
      "./version.js": { CODEX_PLUSPLUS_VERSION: "1.0.8" },
      "./alerts.js": {}, "./logging.js": { capKnownLogFiles: () => {} },
    };
    for (const command of ["uninstall", "repair", "update-codex", "self-update", "status", "debug", "browser-ui", "doctor", "safe-mode"]) {
      mocks[`./commands/${command}.js`] = {};
    }
    loadModule("cli.ts", mocks, ["install", ...flags]);
    await Promise.resolve();
    assert.ok(received, "CLI must invoke the install boundary");
    assert.equal(received.watcher, expected);
  });
}

for (const options of [{}, { watcher: false }]) {
  test(`install does not schedule a watcher with ${JSON.stringify(options)}`, async () => {
    const fixture = installerFixture();
    await fixture.install({ ...options, quiet: true });
    assert.deepEqual(fixture.scheduled, []);
    assert.equal(fixture.removals(), 0);
    assert.equal(fixture.saved()?.watcher, "none");
  });
}

test("install explicitly schedules the watcher and persists its installed kind", async () => {
  const fixture = installerFixture();
  await fixture.install({ watcher: true, quiet: true });
  assert.deepEqual(fixture.scheduled, [fixture.appRoot]);
  assert.equal(fixture.saved()?.watcher, "systemd");
});

test("install preserves a repair-provided watcher kind without scheduling or removing it", async () => {
  const fixture = installerFixture("launchd");
  await fixture.install({ watcher: false, watcherKind: "launchd", quiet: true });
  assert.deepEqual(fixture.scheduled, []);
  assert.equal(fixture.removals(), 0);
  assert.equal(fixture.saved()?.watcher, "launchd");
});

for (const options of [{}, { watcher: false }]) {
  test(`reinstall disables a previously configured watcher with ${JSON.stringify(options)}`, async () => {
    const fixture = installerFixture("launchd");
    await fixture.install({ ...options, quiet: true });
    assert.deepEqual(fixture.scheduled, []);
    assert.equal(fixture.removals(), 1);
    assert.equal(fixture.saved()?.watcher, "none");
  });
}

for (const prior of [undefined, "none", "systemd"] as const) {
  test(`repair ${prior === undefined ? "without prior state defaults off" : `preserves ${prior} watcher configuration`}`, async () => {
    const fixture = installerFixture(prior);
    await fixture.repair({ force: true, quiet: true });
    assert.deepEqual(fixture.scheduled, prior === "systemd" ? [fixture.appRoot] : []);
    assert.equal(fixture.removals(), 0);
    assert.equal(fixture.saved()?.watcher, prior === "systemd" ? "systemd" : "none");
  });
}
