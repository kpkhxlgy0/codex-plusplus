import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  chooseRestorePlan,
  cleanupRuntimeAndState,
  purgeUserData,
  restorePartialBackup,
} from "../src/commands/uninstall";
import type { CodexInstall } from "../src/platform";
import type { InstallerState } from "../src/state";
import { backupFuseCarrier } from "../src/fuse-backup";

test(
  "uninstall explains runtime cleanup permission failures",
  { skip: process.platform === "win32" || process.getuid?.() === 0 },
  () => {
    const root = mkdtempSync(join(tmpdir(), "codexpp-uninstall-"));
    const runtime = join(root, "runtime");
    const stateFile = join(root, "state.json");
    mkdirSync(runtime);
    writeFileSync(join(runtime, "loader.js"), "");
    writeFileSync(stateFile, "{}");
    chmodSync(runtime, 0o555);

    try {
      assert.throws(
        () => cleanupRuntimeAndState({ runtime, stateFile }),
        /previous sudo install or repair/,
      );
    } finally {
      chmodSync(runtime, 0o755);
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test("uninstall skips app restore when the current app no longer looks patched", () => {
  const plan = chooseRestorePlan({
    state: {
      version: "0.1.7",
      installedAt: "2026-05-01T00:00:00.000Z",
      appRoot: "/Applications/Codex.app",
      originalAsarHash: "original",
      patchedAsarHash: "patched",
      codexVersion: "26.519.1",
      fuseFlipped: true,
      resigned: true,
      originalEntryPoint: "main.js",
      watcher: "launchd",
    },
    currentAsarHash: "new-official-build",
    currentCodexVersion: "26.520.1",
    hasPatchMarker: false,
    fullAppBackup: "/does/not/matter/Codex.app",
    partialAsarBackup: "/does/not/matter/app.asar",
  });

  assert.equal(plan.kind, "skip");
  assert.match(plan.reason, /does not appear/);
});

test("purge removes all Codex++ user data", () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-uninstall-"));
  mkdirSync(join(root, "tweaks", "example"), { recursive: true });
  mkdirSync(join(root, "backup"), { recursive: true });
  writeFileSync(join(root, "config.json"), "{}");
  writeFileSync(join(root, "tweaks", "example", "manifest.json"), "{}");
  writeFileSync(join(root, "backup", "app.asar"), "");

  purgeUserData({ root });

  assert.equal(existsSync(root), false);
});

test("uninstall prefers a full app backup for a patched macOS app", () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-uninstall-"));
  try {
    const backup = join(root, "Codex.app");
    mkdirSync(join(backup, "Contents", "Resources"), { recursive: true });
    writeFileSync(join(backup, "Contents", "Info.plist"), "");
    writeFileSync(join(backup, "Contents", "Resources", "app.asar"), "");

    const plan = chooseRestorePlan({
      state: {
        version: "0.1.7",
        installedAt: "2026-05-01T00:00:00.000Z",
        appRoot: "/Applications/Codex.app",
        originalAsarHash: "original",
        patchedAsarHash: "patched",
        codexVersion: "26.519.1",
        fuseFlipped: true,
        resigned: true,
        originalEntryPoint: "main.js",
        watcher: "launchd",
      },
      currentAsarHash: "patched",
      currentCodexVersion: "26.519.1",
      hasPatchMarker: true,
      fullAppBackup: backup,
      partialAsarBackup: join(root, "app.asar"),
    });

    assert.deepEqual(plan, { kind: "full-app", backupPath: backup });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("uninstall refuses partial restore after a Codex version change", () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-uninstall-"));
  try {
    const partial = join(root, "app.asar");
    writeFileSync(partial, "");

    assert.throws(
      () =>
        chooseRestorePlan({
          state: {
            version: "0.1.7",
            installedAt: "2026-05-01T00:00:00.000Z",
            appRoot: "/Applications/Codex.app",
            originalAsarHash: "original",
            patchedAsarHash: "patched",
            codexVersion: "26.519.1",
            fuseFlipped: true,
            resigned: true,
            originalEntryPoint: "main.js",
            watcher: "launchd",
          },
          currentAsarHash: "patched",
          currentCodexVersion: "26.520.1",
          hasPatchMarker: true,
          fullAppBackup: null,
          partialAsarBackup: partial,
        }),
      /Codex changed since Codex\+\+ was installed/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("uninstall does not restore a legacy Codex.exe backup over chrome.dll", () => {
  withWindowsPartialRestore((root, codex, opts) => {
    opts.state.electronBinaryPath = "chrome.dll";
    writeFuseCarrier(codex.electronBinary, "chrome carrier", "off");
    writeFuseCarrier(opts.backupFramework, "legacy Codex executable", "on");
    const before = readFileSync(codex.electronBinary);

    restorePartialBackup(codex, opts);

    assert.deepEqual(readFileSync(codex.electronBinary), before);
  });
});

test("uninstall restores a matching legacy executable fuse backup", () => {
  withWindowsPartialRestore((root, codex, opts) => {
    const codexExe = join(root, "app", "Codex.exe");
    codex.executable = codexExe;
    codex.electronBinary = codexExe;
    writeFuseCarrier(codexExe, "legacy Codex executable", "off");
    writeFuseCarrier(opts.backupFramework, "legacy Codex executable", "on");
    const original = readFileSync(opts.backupFramework);

    restorePartialBackup(codex, opts);

    assert.deepEqual(readFileSync(codexExe), original);
  });
});

test("install migrates a matching generic fuse backup into carrier-specific storage", () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-install-fuse-"));
  try {
    const appRoot = join(root, "app");
    const backupDir = join(root, "backup");
    mkdirSync(appRoot, { recursive: true });
    mkdirSync(backupDir, { recursive: true });
    const chromeDll = join(appRoot, "chrome.dll");
    const legacyBackup = join(backupDir, "Electron Framework");
    writeFuseCarrier(chromeDll, "chrome carrier", "off");
    writeFuseCarrier(legacyBackup, "chrome carrier", "on");

    const backupPath = backupFuseCarrier(appRoot, chromeDll, backupDir, legacyBackup);

    assert.equal(backupPath, join(backupDir, "electron", "chrome.dll"));
    assert.deepEqual(readFileSync(backupPath), readFileSync(legacyBackup));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("install rejects a mismatched generic backup when creating carrier-specific storage", () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-install-fuse-"));
  try {
    const appRoot = join(root, "app");
    const backupDir = join(root, "backup");
    mkdirSync(appRoot, { recursive: true });
    mkdirSync(backupDir, { recursive: true });
    const chromeDll = join(appRoot, "chrome.dll");
    const legacyBackup = join(backupDir, "Electron Framework");
    writeFuseCarrier(chromeDll, "chrome carrier", "off");
    writeFuseCarrier(legacyBackup, "legacy Codex executable", "on");
    const currentCarrier = readFileSync(chromeDll);

    const backupPath = backupFuseCarrier(appRoot, chromeDll, backupDir, legacyBackup);

    assert.equal(backupPath, join(backupDir, "electron", "chrome.dll"));
    assert.deepEqual(readFileSync(backupPath), currentCarrier);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function withWindowsPartialRestore(
  fn: (
    root: string,
    codex: CodexInstall,
    opts: {
      backupAsar: string;
      backupAsarUnpacked: string;
      backupPlist: null;
      backupFramework: string;
      state: InstallerState;
    },
  ) => void,
): void {
  const root = mkdtempSync(join(tmpdir(), "codexpp-uninstall-fuse-"));
  try {
    const appRoot = join(root, "app");
    const resourcesDir = join(appRoot, "resources");
    const backupDir = join(root, "backup");
    mkdirSync(resourcesDir, { recursive: true });
    mkdirSync(backupDir, { recursive: true });
    const asarPath = join(resourcesDir, "app.asar");
    const backupAsar = join(backupDir, "app.asar");
    writeFileSync(asarPath, "patched asar");
    writeFileSync(backupAsar, "original asar");
    const codex: CodexInstall = {
      appRoot,
      resourcesDir,
      asarPath,
      metaPath: null,
      electronBinary: join(appRoot, "chrome.dll"),
      executable: join(appRoot, "ChatGPT.exe"),
      appName: "Codex",
      bundleId: null,
      channel: "stable",
      platform: "win32",
    };
    fn(root, codex, {
      backupAsar,
      backupAsarUnpacked: join(backupDir, "app.asar.unpacked"),
      backupPlist: null,
      backupFramework: join(backupDir, "Electron Framework"),
      state: legacyWindowsState(appRoot),
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function legacyWindowsState(appRoot: string): InstallerState {
  return {
    version: "1.0.1",
    installedAt: "2026-08-29T00:00:00.000Z",
    appRoot,
    originalAsarHash: "original",
    patchedAsarHash: "patched",
    codexVersion: null,
    fuseFlipped: true,
    resigned: false,
    originalEntryPoint: "main.js",
    watcher: "scheduled-task",
  };
}

function writeFuseCarrier(path: string, label: string, integrityFuse: "off" | "on"): void {
  const states = Buffer.from(`0000${integrityFuse === "off" ? "0" : "1"}000`, "ascii");
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from(`${label}\0`, "utf8"),
      Buffer.from("dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX", "ascii"),
      Buffer.from([1, states.length]),
      states,
      Buffer.from("payload", "ascii"),
    ]),
  );
}
