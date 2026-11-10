import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildWindowsMirrorCleanupScript, cleanupOldWindowsMirrors } from "../src/windows-mirror-cleanup";

const native = process.platform === "win32";
const currentName = "OpenAI.Codex_26.1103.7773.0_x64__2p2nqsd0c76g0";
const oldName = "OpenAI.Codex_26.1023.6123.0_x64__2p2nqsd0c76g0";
const olderName = "OpenAI.Codex_26.1023.5000.0_x64__2p2nqsd0c76g0";

interface Result {
  removed: string[];
  retained: string[];
  planned: string[];
  warnings: string[];
}

function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function fixture(prefix = "codex-mirror-cleanup-") {
  const root = mkdtempSync(join(tmpdir(), prefix));
  const localAppData = join(root, "local");
  const managedRoot = join(localAppData, "codex-plusplus", "store-apps");
  const appRoot = join(managedRoot, currentName, "app");
  const stateFile = join(root, "state.json");
  mkdirSync(appRoot, { recursive: true });
  writeFileSync(stateFile, JSON.stringify({ appRoot, version: "1.0.9" }));
  const mirror = (name: string) => {
    const target = join(managedRoot, name);
    mkdirSync(join(target, "app"), { recursive: true });
    writeFileSync(join(target, "app", "sentinel.txt"), name);
    return target;
  };
  const run = (options: { dryRun?: boolean; prelude?: string; appRoot?: string; localAppData?: string } = {}): Result => {
    const script = buildWindowsMirrorCleanupScript({
      appRoot: options.appRoot ?? appRoot,
      stateFile,
      localAppData: options.localAppData ?? localAppData,
      dryRun: options.dryRun,
    });
    const output = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      `${options.prelude ?? "function Get-CimInstance { @() }"}\n${script}`,
    ], { encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024 });
    return JSON.parse(output.trim()) as Result;
  };
  return { root, localAppData, managedRoot, appRoot, stateFile, mirror, run,
    dispose: () => rmSync(root, { recursive: true }) };
}

test("Windows mirror cleanup keeps current, used, newer and unrecognized directories", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const used = f.mirror(olderName);
    const newer = f.mirror("OpenAI.Codex_26.1104.1.0_x64__2p2nqsd0c76g0");
    const foreign = f.mirror("OpenAI.Codex_26.1.1.0_x64__aaaaaaaaaaaaa");
    const arm = f.mirror("OpenAI.Codex_26.1.1.0_arm64__2p2nqsd0c76g0");
    const unknown = f.mirror("backup");
    const result = f.run({ prelude: `function Get-CimInstance {
      [pscustomobject]@{ProcessId=123; Name='Codex.exe'; ExecutablePath=${quote(join(used, "app", "Codex.exe"))}; CommandLine='Codex.exe'}
    }` });
    assert.deepEqual(result.removed, [old]);
    assert.deepEqual(result.planned, []);
    assert.deepEqual(result.warnings, []);
    for (const kept of [join(f.managedRoot, currentName), used, newer, foreign, arm, unknown]) {
      assert.ok(result.retained.includes(kept), `retained ${kept}`);
      assert.ok(existsSync(kept));
    }
    assert.equal(existsSync(old), false);
  } finally { f.dispose(); }
});

test("dry run reports safe old targets while leaving their files intact", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const result = f.run({ dryRun: true });
    assert.deepEqual(result.planned, [old]);
    assert.deepEqual(result.removed, []);
    assert.equal(readFileSync(join(old, "app", "sentinel.txt"), "utf8"), oldName);
  } finally { f.dispose(); }
});

test("command-line references protect a mirror even when the executable is outside it", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const result = f.run({ prelude: `function Get-CimInstance {
      [pscustomobject]@{ProcessId=123; Name='node.exe'; ExecutablePath='C:\\node.exe'; CommandLine=${quote(`node "${join(old, "app", "worker.js")}" --secret=DO-NOT-LOG`)}}
    }` });
    assert.deepEqual(result.removed, []);
    assert.ok(result.retained.includes(old));
    assert.deepEqual(result.warnings, []);
    assert.ok(existsSync(old));
    assert.ok(!JSON.stringify(result).includes("DO-NOT-LOG"));
  } finally { f.dispose(); }
});

for (const [name, prelude] of [
  ["failed process query", "function Get-CimInstance { throw 'DO-NOT-LOG query failure' }"],
  ["unknown Codex executable", "function Get-CimInstance { [pscustomobject]@{ProcessId=123;Name='Codex.exe';ExecutablePath=$null;CommandLine='Codex.exe'} }"],
  ["unknown node command line", "function Get-CimInstance { [pscustomobject]@{ProcessId=123;Name='node.exe';ExecutablePath='C:\\node.exe';CommandLine=$null} }"],
] as const) {
  test(`${name} preserves all old mirrors without exposing process details`, { skip: !native }, () => {
    const f = fixture();
    try {
      const old = f.mirror(oldName);
      const result = f.run({ prelude });
      assert.deepEqual(result.removed, []);
      assert.deepEqual(result.planned, []);
      assert.ok(existsSync(old));
      assert.ok(result.warnings.length > 0);
      assert.ok(!JSON.stringify(result).includes("DO-NOT-LOG"));
    } finally { f.dispose(); }
  });
}

test("mismatched persisted state preserves every mirror", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    writeFileSync(f.stateFile, JSON.stringify({ appRoot: join(f.root, "other-app") }));
    const result = f.run();
    assert.deepEqual(result.removed, []);
    assert.ok(existsSync(old));
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

test("state change during process inspection stops deletion", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const result = f.run({ prelude: `function Get-CimInstance {
      [IO.File]::WriteAllText(${quote(f.stateFile)}, '{"appRoot":"changed"}'); @()
    }` });
    assert.deepEqual(result.removed, []);
    assert.ok(existsSync(old));
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

test("state and process use are checked again before each deletion", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const older = f.mirror(olderName);
    const result = f.run({ prelude: `$script:queries=0
      function Get-CimInstance {
        $script:queries++
        if ($script:queries -gt 1) {
          [pscustomobject]@{ProcessId=123;Name='Codex.exe';ExecutablePath=${quote(join(old, "app", "Codex.exe"))};CommandLine='Codex.exe'}
        }
      }` });
    assert.deepEqual(result.removed, [older]);
    assert.ok(result.retained.includes(old));
    assert.ok(existsSync(old));
    assert.equal(existsSync(older), false);
  } finally { f.dispose(); }
});

test("a native deletion refusal remains visible and does not throw", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const result = f.run({ prelude: `function Get-CimInstance { @() }
      function Remove-Item { param($LiteralPath, [switch]$Recurse, $ErrorAction); throw 'locked' }` });
    assert.deepEqual(result.removed, []);
    assert.ok(result.retained.includes(old));
    assert.ok(existsSync(old));
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

test("a descendant junction preserves its mirror and external files", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const external = join(f.root, "external");
    mkdirSync(external);
    writeFileSync(join(external, "keep.txt"), "external");
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      `New-Item -ItemType Junction -Path ${quote(join(old, "app", "junction"))} -Target ${quote(external)} | Out-Null`,
    ]);
    const result = f.run();
    assert.deepEqual(result.removed, []);
    assert.ok(result.retained.includes(old));
    assert.equal(readFileSync(join(external, "keep.txt"), "utf8"), "external");
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

test("a junction managed root cannot widen cleanup into its destination", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const destination = join(f.root, "redirected");
    const redirectedLocal = join(f.root, "redirected-local");
    mkdirSync(join(redirectedLocal, "codex-plusplus"), { recursive: true });
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      `Move-Item -LiteralPath ${quote(f.managedRoot)} -Destination ${quote(destination)}; New-Item -ItemType Junction -Path ${quote(join(redirectedLocal, "codex-plusplus", "store-apps"))} -Target ${quote(destination)} | Out-Null`,
    ]);
    const redirectedApp = join(redirectedLocal, "codex-plusplus", "store-apps", currentName, "app");
    writeFileSync(f.stateFile, JSON.stringify({ appRoot: redirectedApp }));
    const result = f.run({ localAppData: redirectedLocal, appRoot: redirectedApp });
    assert.deepEqual(result.removed, []);
    assert.ok(existsSync(join(destination, oldName)));
    assert.equal(existsSync(old), false);
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

for (const malformed of ["relative\\app", "C:\\..\\app", "\\\\?\\C:\\app", "C:\\safe.\\app", "C:\\safe\\app:stream"]) {
  test(`unsafe current path is rejected: ${malformed}`, { skip: !native }, () => {
    const f = fixture();
    try {
      const old = f.mirror(oldName);
      const result = f.run({ appRoot: malformed });
      assert.deepEqual(result.removed, []);
      assert.ok(existsSync(old));
      assert.ok(result.warnings.length > 0);
    } finally { f.dispose(); }
  });
}

test("standalone installs leave similarly named sibling folders intact", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const appRoot = join(f.root, "standalone", "app");
    mkdirSync(appRoot, { recursive: true });
    writeFileSync(f.stateFile, JSON.stringify({ appRoot }));
    const result = f.run({ appRoot });
    assert.deepEqual(result.removed, []);
    assert.ok(existsSync(old));
  } finally { f.dispose(); }
});

test("public cleanup is a no-op off Windows", { skip: native }, () => {
  assert.deepEqual(cleanupOldWindowsMirrors({ appRoot: "/outside", stateFile: "/missing", quiet: true }), {
    removed: [], retained: [], planned: [], warnings: [],
  });
});


test("state changes after a successful deletion preserve remaining mirrors", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const older = f.mirror(olderName);
    const result = f.run({ prelude: `function Get-CimInstance { @() }
      function Remove-Item {
        param($LiteralPath, [switch]$Recurse, $ErrorAction)
        Microsoft.PowerShell.Management\\Remove-Item -LiteralPath $LiteralPath -Recurse -ErrorAction Stop
        [IO.File]::WriteAllText(${quote(f.stateFile)}, '{"appRoot":"changed"}')
      }` });
    assert.deepEqual(result.removed, [older]);
    assert.ok(result.retained.includes(old));
    assert.ok(existsSync(old));
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

for (const missing of ["state", "current"] as const) {
  test(`missing ${missing} preserves every old mirror`, { skip: !native }, () => {
    const f = fixture();
    try {
      const old = f.mirror(oldName);
      rmSync(missing === "state" ? f.stateFile : f.appRoot, { recursive: true });
      const result = f.run();
      assert.deepEqual(result.removed, []);
      assert.ok(existsSync(old));
      assert.ok(result.warnings.length > 0);
    } finally { f.dispose(); }
  });
}

test("a target junction preserves its external destination", { skip: !native }, () => {
  const f = fixture();
  try {
    const external = join(f.root, "external");
    mkdirSync(external);
    writeFileSync(join(external, "keep.txt"), "external");
    const target = join(f.managedRoot, oldName);
    execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
      `New-Item -ItemType Junction -Path ${quote(target)} -Target ${quote(external)} | Out-Null`,
    ]);
    const result = f.run();
    assert.deepEqual(result.removed, []);
    assert.ok(result.retained.includes(target));
    assert.equal(readFileSync(join(external, "keep.txt"), "utf8"), "external");
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

test("literal paths preserve quoting and wildcard characters without widening deletion", { skip: !native }, () => {
  const f = fixture("codex-mirror-cleanup-'[literal]-");
  try {
    const old = f.mirror(oldName);
    const external = join(f.root, "keep.txt");
    writeFileSync(external, "outside managed root");
    const result = f.run();
    assert.deepEqual(result.removed, [old]);
    assert.deepEqual(result.warnings, []);
    assert.equal(readFileSync(external, "utf8"), "outside managed root");
  } finally { f.dispose(); }
});

test("a junction introduced during process inspection blocks deletion", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const external = join(f.root, "external");
    mkdirSync(external);
    writeFileSync(join(external, "keep.txt"), "external");
    const result = f.run({ prelude: `function Get-CimInstance {
      New-Item -ItemType Junction -Path ${quote(join(old, "app", "junction"))} -Target ${quote(external)} | Out-Null
      @()
    }` });
    assert.deepEqual(result.removed, []);
    assert.ok(result.retained.includes(old));
    assert.equal(readFileSync(join(external, "keep.txt"), "utf8"), "external");
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

test("an unreadable ChatGPT process preserves old mirrors", { skip: !native }, () => {
  const f = fixture();
  try {
    const old = f.mirror(oldName);
    const result = f.run({ prelude: `function Get-CimInstance {
      [pscustomobject]@{ProcessId=123;Name='ChatGPT.exe';ExecutablePath=$null;CommandLine=$null}
    }` });
    assert.deepEqual(result.removed, []);
    assert.ok(existsSync(old));
    assert.ok(result.warnings.length > 0);
  } finally { f.dispose(); }
});

for (const scenario of [
  "valid", "wrong-pid", "wrong-name", "stopped", "arguments", "wrong-path", "wrong-package",
  "wrong-install-location", "service-query-failed", "appx-query-failed", "multiple-services", "missing-binary",
  "inside-managed-root", "reparse-binary-parent", "node-process", "known-image-mismatch", "known-command-mismatch",
] as const) {
  test(`protected sandbox service requires exact SCM and registered package proof: ${scenario}`,
    { skip: !native }, () => {
      const f = fixture();
      try {
        const old = f.mirror(oldName);
        const installLocation = scenario === "inside-managed-root"
          ? join(f.managedRoot, currentName) : join(f.root, "registered", currentName);
        const serviceExe = join(installLocation, "app", "resources", "codex-windows-sandbox-service.exe");
        mkdirSync(join(installLocation, "app", "resources"), { recursive: true });
        if (scenario !== "missing-binary") writeFileSync(serviceExe, "fixture executable");
        if (scenario === "reparse-binary-parent") {
          const resources = join(installLocation, "app", "resources");
          const externalResources = join(f.root, "external-resources");
          execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
            `Move-Item -LiteralPath ${quote(resources)} -Destination ${quote(externalResources)}; ` +
            `New-Item -ItemType Junction -Path ${quote(resources)} -Target ${quote(externalResources)} | Out-Null`,
          ]);
        }
        const service = {
          ProcessId: scenario === "wrong-pid" ? 124 : 123,
          Name: scenario === "wrong-name" ? "other-service" : "CodexSandboxService.OpenAI.Codex",
          State: scenario === "stopped" ? "Stopped" : "Running",
          PathName: `"${scenario === "wrong-path" ? join(old, "app", "service.exe") : serviceExe}"` +
            (scenario === "arguments" ? " --secret=DO-NOT-LOG" : ""),
        };
        const appx = {
          Name: "OpenAI.Codex",
          PackageFullName: scenario === "wrong-package"
            ? "OpenAI.Codex_26.1103.7773.0_x64__aaaaaaaaaaaaa" : currentName,
          InstallLocation: scenario === "wrong-install-location" ? join(f.root, "other") : installLocation,
        };
        const services = scenario === "multiple-services" ? [service, service] : [service];
        const result = f.run({ prelude: `
          $fixtureServices = ${quote(JSON.stringify(services))} | ConvertFrom-Json
          $fixtureAppx = ${quote(JSON.stringify(appx))} | ConvertFrom-Json
          function Get-CimInstance {
            param($ClassName, $Filter, $ErrorAction)
            if ($ClassName -eq 'Win32_Service') {
              ${scenario === "service-query-failed" ? "throw 'DO-NOT-LOG service query failure'" : "@($fixtureServices)"}
            } else {
              [pscustomobject]@{
                ProcessId=123
                Name=${quote(scenario === "node-process" ? "node.exe" : "codex-windows-sandbox-service.exe")}
                ExecutablePath=${scenario === "known-image-mismatch" ? quote("C:\\other.exe") : "$null"}
                CommandLine=${scenario === "known-command-mismatch" ? quote(`"${serviceExe}" --secret=DO-NOT-LOG`) : "$null"}
              }
            }
          }
          function Get-AppxPackage {
            param($Name, $ErrorAction)
            ${scenario === "appx-query-failed" ? "throw 'DO-NOT-LOG Appx query failure'" : "$fixtureAppx"}
          }
        ` });
        if (scenario === "valid") {
          assert.deepEqual(result.removed, [old]);
          assert.deepEqual(result.warnings, []);
        } else {
          assert.deepEqual(result.removed, []);
          assert.ok(result.retained.includes(old));
          assert.ok(existsSync(old));
          assert.ok(result.warnings.length > 0);
        }
        assert.ok(!JSON.stringify(result).includes("DO-NOT-LOG"));
        assert.ok(existsSync(installLocation));
      } finally { f.dispose(); }
    });
}
