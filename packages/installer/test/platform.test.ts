import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { writeFuse } from "../src/fuses";
import { inferCodexChannel, locateCodex, resolveLinuxInstall } from "../src/platform";

test("inferCodexChannel detects stable and beta metadata", () => {
  assert.equal(inferCodexChannel("com.openai.codex", "Codex"), "stable");
  assert.equal(inferCodexChannel("com.openai.codex.beta", "Codex (Beta)"), "beta");
  assert.equal(inferCodexChannel(null, "Codex (Beta)"), "beta");
});

test("locateCodex reads beta bundle metadata from override path on macOS", { skip: process.platform !== "darwin" }, () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-platform-"));
  try {
    const app = join(root, "Codex (Beta).app");
    mkdirSync(join(app, "Contents", "Resources"), { recursive: true });
    mkdirSync(
      join(app, "Contents", "Frameworks", "Electron Framework.framework", "Versions", "A"),
      { recursive: true },
    );
    writeFileSync(join(app, "Contents", "Resources", "app.asar"), "");
    writeFileSync(
      join(app, "Contents", "Info.plist"),
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleDisplayName</key><string>Codex (Beta)</string>
  <key>CFBundleExecutable</key><string>Codex (Beta)</string>
  <key>CFBundleIdentifier</key><string>com.openai.codex.beta</string>
</dict></plist>`,
    );

    const codex = locateCodex(app);
    assert.equal(codex.appName, "Codex (Beta)");
    assert.equal(codex.bundleId, "com.openai.codex.beta");
    assert.equal(codex.channel, "beta");
    assert.equal(codex.executable.endsWith("Contents/MacOS/Codex (Beta)"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("locateCodex separates the Store launch executable from its already-off fuse carrier", { skip: process.platform !== "win32" }, () => {
  withTempDir((root) => {
    writeWindowsApp(root);
    writeFileSync(join(root, "Codex.exe"), "launcher stub");
    writeFileSync(join(root, "ChatGPT.exe"), "application executable");
    const chromeDll = join(root, "chrome.dll");
    writeFuseCarrier(chromeDll, "off");

    const codex = locateCodex(root);
    assert.equal(codex.executable, join(root, "ChatGPT.exe"));
    assert.equal(codex.electronBinary, chromeDll);

    const before = readFileSync(chromeDll);
    assert.deepEqual(
      writeFuse(codex.electronBinary, "EnableEmbeddedAsarIntegrityValidation", "off"),
      { from: "off", to: "off" },
    );
    assert.deepEqual(readFileSync(chromeDll), before);
  });
});

test("locateCodex validates chrome.dll and falls back to an older Electron executable", { skip: process.platform !== "win32" }, () => {
  withTempDir((root) => {
    writeWindowsApp(root);
    const codexExe = join(root, "Codex.exe");
    writeFuseCarrier(codexExe, "on");
    writeFileSync(join(root, "chrome.dll"), "not an Electron fuse carrier");

    const codex = locateCodex(root);
    assert.equal(codex.executable, codexExe);
    assert.equal(codex.electronBinary, codexExe);
  });
});

test("locateCodex requires the integrity fuse wire in a Windows carrier", { skip: process.platform !== "win32" }, () => {
  withTempDir((root) => {
    writeWindowsApp(root);
    const codexExe = join(root, "Codex.exe");
    writeFuseCarrier(codexExe, "on");
    writeFuseWires(join(root, "chrome.dll"), "0000");

    const codex = locateCodex(root);
    assert.equal(codex.electronBinary, codexExe);
  });
});

test("locateCodex rejects unsupported Windows layouts without scanning arbitrary binaries", { skip: process.platform !== "win32" }, () => {
  withTempDir((root) => {
    writeWindowsApp(root);
    writeFileSync(join(root, "Codex.exe"), "launcher stub");
    writeFileSync(join(root, "ChatGPT.exe"), "application executable");
    writeFileSync(join(root, "chrome.dll"), "not an Electron fuse carrier");
    writeFuseCarrier(join(root, "unrelated.dll"), "on");

    assert.throws(
      () => locateCodex(root),
      (error: Error) => {
        assert.match(error.message, /valid Electron fuse carrier/i);
        assert.match(error.message, /chrome\.dll/);
        assert.match(error.message, /Codex\.exe/);
        assert.doesNotMatch(error.message, /unrelated\.dll/);
        return true;
      },
    );
  });
});

test("resolveLinuxInstall supports am-will codex-app install directory", () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-platform-"));
  try {
    const app = join(root, "codex-desktop");
    mkdirSync(join(app, "resources"), { recursive: true });
    writeFileSync(join(app, "resources", "app.asar"), "");
    writeFileSync(join(app, "Codex"), "", { mode: 0o755 });

    const codex = resolveLinuxInstall(app);
    const resolvedApp = realpathSync(app);
    assert.ok(codex);
    assert.equal(codex.appRoot, resolvedApp);
    assert.equal(codex.resourcesDir, join(resolvedApp, "resources"));
    assert.equal(codex.executable, join(resolvedApp, "Codex"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("resolveLinuxInstall accepts a launcher symlink override", { skip: process.platform === "win32" }, () => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-platform-"));
  try {
    const app = join(root, "codex-desktop");
    const bin = join(root, "bin");
    mkdirSync(join(app, "resources"), { recursive: true });
    mkdirSync(bin, { recursive: true });
    writeFileSync(join(app, "resources", "app.asar"), "");
    writeFileSync(join(app, "codex-desktop"), "", { mode: 0o755 });
    symlinkSync(join(app, "codex-desktop"), join(bin, "codex-desktop"));

    const codex = resolveLinuxInstall(join(bin, "codex-desktop"));
    const resolvedApp = realpathSync(app);
    assert.ok(codex);
    assert.equal(codex.appRoot, resolvedApp);
    assert.equal(codex.resourcesDir, join(resolvedApp, "resources"));
    assert.equal(codex.executable, join(resolvedApp, "codex-desktop"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function withTempDir(fn: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "codexpp-platform-"));
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function writeWindowsApp(root: string): void {
  mkdirSync(join(root, "resources"), { recursive: true });
  writeFileSync(join(root, "resources", "app.asar"), "");
}

function writeFuseCarrier(path: string, integrityFuse: "off" | "on"): void {
  const states = Buffer.from(`0000${integrityFuse === "off" ? "0" : "1"}000`, "ascii");
  writeFuseWires(path, states);
}

function writeFuseWires(path: string, states: string | Buffer): void {
  const stateBytes = Buffer.from(states);
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from("MZ", "ascii"),
      Buffer.from("dL7pKGdnNz796PbbjQWNKmHXBZaB9tsX", "ascii"),
      Buffer.from([1, stateBytes.length]),
      stateBytes,
    ]),
  );
}
