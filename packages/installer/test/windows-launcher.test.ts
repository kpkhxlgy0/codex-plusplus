import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import test from "node:test";
import { repair } from "../src/commands/repair";
import { readHeaderHash } from "../src/asar";
import { fileURLToPath } from "node:url";
import { windowsManagedLaunchCommand } from "../src/windows-launcher";
import { openCodex } from "../src/alerts";

const windowsOnly = { skip: process.platform !== "win32" };
const packageName = "Test.Codex_1.0.0.0_x64__testpublisher";
const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

function powershell(script: string, executionPolicy?: string) {
  return spawnSync("powershell.exe", [
    "-NoLogo", "-NoProfile", "-NonInteractive", ...(executionPolicy ? ["-ExecutionPolicy", executionPolicy] : []),
    "-EncodedCommand",
    Buffer.from(script, "utf16le").toString("base64"),
  ], { encoding: "utf8", windowsHide: true, timeout: 30_000 });
}

async function withInstall(fn: (fixture: { root: string; appRoot: string; userRoot: string }) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), "codexpp-launcher-"));
  const overrides = {
    CODEX_PLUSPLUS_HOME: join(root, "user data"),
    LOCALAPPDATA: join(root, "local"),
    APPDATA: join(root, "roaming"),
    USERPROFILE: join(root, "home"),
  };
  const previous = Object.fromEntries(Object.keys(overrides).map((key) => [key, process.env[key]]));
  Object.assign(process.env, overrides);
  try {
    const appRoot = join(overrides.LOCALAPPDATA, "codex-plusplus", "store-apps", packageName, "app");
    const source = join(root, "source");
    mkdirSync(source, { recursive: true });
    mkdirSync(join(appRoot, "resources"), { recursive: true });
    mkdirSync(overrides.CODEX_PLUSPLUS_HOME, { recursive: true });
    writeFileSync(join(source, "package.json"), JSON.stringify({ main: "main.js" }));
    writeFileSync(join(source, "main.js"),
      "const services = createServices({buildFlavor:'prod',allowDevtools:false,allowDebugMenu:false," +
      "allowInspectElement:false,globalState:{},preloadPath:'preload.js'});\n");
    const archive = join(appRoot, "resources", "app.asar");
    const packed = spawnSync(process.execPath, ["--input-type=module", "-e",
      "import asar from '@electron/asar'; await asar.createPackage(process.argv[1], process.argv[2]);",
      source, archive], { encoding: "utf8", windowsHide: true, timeout: 10_000 });
    assert.equal(packed.status, 0, packed.stderr);
    writeFileSync(join(appRoot, "ChatGPT.exe"), "test executable");
    writeFileSync(join(appRoot, "chrome.dll"), Buffer.concat([
      Buffer.from("MZdL7pKGdnNz796PbbjQWNKmHXBZaB9tsX"), Buffer.from([1, 8]), Buffer.from("00000000"),
    ]));
    writeFileSync(join(overrides.CODEX_PLUSPLUS_HOME, "state.json"), JSON.stringify({
      appRoot, version: "1.0.3", patchedAsarHash: readHeaderHash(archive).headerHash,
      watcher: "none", fuseFlipped: true, resigned: false,
    }));
    await fn({ root, appRoot, userRoot: overrides.CODEX_PLUSPLUS_HOME });
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    rmSync(root, { recursive: true, force: true });
  }
}

test("repair refreshes the Store launcher even when the asar patch is intact", windowsOnly, async () => {
  await withInstall(async ({ appRoot, userRoot }) => {
    const before = readFileSync(join(appRoot, "resources", "app.asar"));
    await repair({ quiet: true, app: appRoot });
    const launcher = join(userRoot, "bin", "launch-packaged-chatgpt.ps1");
    assert.ok(existsSync(launcher), "intact-patch repair must install the package-aware launcher");
    const first = readFileSync(launcher, "utf8");
    writeFileSync(launcher, "throw 'obsolete launcher'");
    await repair({ quiet: true, app: appRoot });
    assert.equal(readFileSync(launcher, "utf8"), first);
    assert.deepEqual(readFileSync(join(appRoot, "resources", "app.asar")), before);
    const link = join(process.env.USERPROFILE!, "Desktop", "Codex++.lnk");
    const result = powershell(`$s = (New-Object -ComObject WScript.Shell).CreateShortcut(${quote(link)}); ` +
      "@{target=$s.TargetPath; args=$s.Arguments} | ConvertTo-Json -Compress");
    assert.equal(result.status, 0, result.stderr);
    const shortcut = JSON.parse(result.stdout);
    assert.match(shortcut.target, /powershell\.exe$/i);
    assert.ok(shortcut.args.includes(launcher));
  });
});

test("repeated installs retain a package-aware command and shortcut", windowsOnly, async () => {
  await withInstall(async ({ appRoot, userRoot }) => {
    const runInstall = () => {
      const result = spawnSync(process.execPath, ["--import", "tsx",
        fileURLToPath(new URL("../src/cli.ts", import.meta.url)), "install", "--app", appRoot, "--no-watcher"],
      { encoding: "utf8", windowsHide: true, timeout: 30_000 });
      assert.equal(result.status, 0, result.stderr + result.stdout);
    };
    runInstall();
    const launcher = join(userRoot, "bin", "launch-packaged-chatgpt.ps1");
    const first = readFileSync(launcher, "utf8");
    runInstall();
    assert.equal(readFileSync(launcher, "utf8"), first);
    const launch = windowsManagedLaunchCommand(appRoot);
    assert.ok(launch);
    assert.equal(launch.args.at(-1), launcher);
    assert.equal(windowsManagedLaunchCommand("C:\\Programs\\Codex"), null);
    const probe = join(userRoot, "arguments.json");
    writeFileSync(launcher, `$args | ConvertTo-Json -Compress | Set-Content -LiteralPath ${quote(probe)}`);
    const shim = join(process.env.LOCALAPPDATA!, "Microsoft", "WindowsApps", "codex-plusplus-codex.cmd");
    const result = powershell(`& ${quote(shim)} 'C:\\project with spaces' 'plain'; exit $LASTEXITCODE`, "Restricted");
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(readFileSync(probe, "utf8")), ["C:\\project with spaces", "plain"]);
    writeFileSync(launcher, `Set-Content -LiteralPath ${quote(probe)} -Value 'reopened'`);
    openCodex(appRoot, { detached: true, delayMs: 0 });
    assert.equal(readFileSync(probe, "utf8").trim(), "reopened");
  });
});

test("launcher uses exact registered package and forwards arguments without evaluating them", windowsOnly, async () => {
  await withInstall(async ({ appRoot, userRoot }) => {
    await repair({ quiet: true, app: appRoot });
    const launcher = join(userRoot, "bin", "launch-packaged-chatgpt.ps1");
    assert.ok(existsSync(launcher), "package-aware launcher is missing");
    const args = ["C:\\project with spaces\\", 'a"b', "$(throw 'evaluated')", ""];
    const result = powershell(packageStubs(packageName) +
      `& ${quote(launcher)} ${args.map(quote).join(" ")}`);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      PackageFamilyName: "Test.Codex_testpublisher", AppId: "TestApp",
      Command: join(appRoot, "ChatGPT.exe"),
      Args: '"C:\\project with spaces\\\\" "a\\"b" "$(throw \'evaluated\')" ""',
    });
  });
});

test("an unavailable Desktop does not block repair or the Start Menu launcher", windowsOnly, async () => {
  await withInstall(async ({ appRoot, userRoot }) => {
    mkdirSync(process.env.USERPROFILE!, { recursive: true });
    writeFileSync(join(process.env.USERPROFILE!, "Desktop"), "not a directory");
    await repair({ quiet: true, app: appRoot });
    assert.ok(existsSync(join(userRoot, "bin", "launch-packaged-chatgpt.ps1")));
    assert.ok(existsSync(join(process.env.APPDATA!, "Microsoft", "Windows", "Start Menu", "Programs", "Codex++.lnk")));
  });
});

test("launcher refuses mismatched packages and follows refreshed install state", windowsOnly, async () => {
  await withInstall(async ({ appRoot, userRoot }) => {
    await repair({ quiet: true, app: appRoot });
    const launcher = join(userRoot, "bin", "launch-packaged-chatgpt.ps1");
    assert.ok(existsSync(launcher), "package-aware launcher is missing");
    const newPackage = "Test.Codex_2.0.0.0_x64__testpublisher";
    const mismatch = powershell(packageStubs(newPackage) + `& ${quote(launcher)}`);
    assert.notEqual(mismatch.status, 0);
    assert.match(mismatch.stderr, /repair/i);
    assert.ok(existsSync(join(userRoot, "log", "packaged-launcher.log")));
    const updatedRoot = appRoot.replace(packageName, newPackage);
    mkdirSync(updatedRoot, { recursive: true });
    writeFileSync(join(updatedRoot, "ChatGPT.exe"), "new executable");
    writeFileSync(join(userRoot, "state.json"), JSON.stringify({ appRoot: updatedRoot }));
    const updated = powershell(packageStubs(newPackage) + `& ${quote(launcher)}`);
    assert.equal(updated.status, 0, updated.stderr);
    assert.equal(JSON.parse(updated.stdout).Command, join(updatedRoot, "ChatGPT.exe"));
    writeFileSync(join(userRoot, "state.json"), JSON.stringify({ appRoot: dirname(updatedRoot) }));
    assert.notEqual(powershell(packageStubs(newPackage) + `& ${quote(launcher)}`).status, 0);
  });
});

function packageStubs(fullName: string): string {
  return `$ErrorActionPreference = 'Stop'
function Get-AppxPackage { [PSCustomObject]@{
  Name='Test.Codex'; PackageFullName=${quote(fullName)}; PackageFamilyName='Test.Codex_testpublisher'
} }
function Get-AppxPackageManifest { [xml]'<Package><Applications><Application Id="TestApp" Executable="app/ChatGPT.exe" /></Applications></Package>' }
function Invoke-CommandInDesktopPackage {
  param($PackageFamilyName, $AppId, $Command, $Args)
  $PSBoundParameters | ConvertTo-Json -Compress
}
`;
}
