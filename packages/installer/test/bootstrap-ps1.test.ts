import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync, existsSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test, { type TestContext } from "node:test";

const script = readFileSync(resolve("install.ps1"), "utf8");
const windows = process.platform === "win32";
const shell = "powershell.exe";

function source(root: string): void {
  for (const name of ["bin/codexplusplus.js", "packages/installer/src/cli.ts", "packages/runtime/src/main.ts"]) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), "// inert fixture\n");
  }
  writeFileSync(join(root, "package.json"), '{"name":"codex-plusplus"}\n');
  writeFileSync(join(root, "package-lock.json"), "original lockfile\n");
}

type Call = { kind: string; cwd: string; arguments: string[] };

function fixture(t: TestContext) {
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), "codexpp-bootstrap-ps1-")));
  let expectedTempRoot = realpathSync.native(tmpdir());
  const checkout = join(root, "local source");
  source(checkout);
  mkdirSync(join(checkout, ".git"));
  writeFileSync(join(checkout, "dirty.txt"), "uncommitted work");
  writeFileSync(join(checkout, "install.ps1"), script);
  const harness = join(checkout, "harness.ps1");
  writeFileSync(harness, String.raw`
param([string]$ConfigPath)
$ErrorActionPreference = 'Stop'
$config = [IO.File]::ReadAllText($ConfigPath) | ConvertFrom-Json
$global:bootstrapAllowedRoots = @($config.root)
function Log-Call($kind, $arguments) {
  $record = @{kind=$kind; cwd=(Get-Location).Path; arguments=@($arguments)} | ConvertTo-Json -Compress
  [IO.File]::AppendAllText($config.trace, $record + [Environment]::NewLine)
}
function Check-FixturePath($value) {
  if (-not [IO.Path]::IsPathRooted($value)) { $value = Join-Path (Get-Location) $value }
  $full = [IO.Path]::GetFullPath($value)
  foreach ($root in $global:bootstrapAllowedRoots) {
    if ($full -eq $root -or $full.StartsWith($root.TrimEnd('\') + '\', [StringComparison]::OrdinalIgnoreCase)) { return }
  }
  throw 'Test blocked filesystem mutation outside its own fixture'
}
function global:Move-Item {
  param([string]$Path,[string]$LiteralPath,[string]$Destination,[switch]$Force)
  Check-FixturePath $(if ($LiteralPath) {$LiteralPath} else {$Path})
  Check-FixturePath $Destination
  Microsoft.PowerShell.Management\Move-Item @PSBoundParameters
}
function global:Remove-Item {
  param([string]$Path,[string]$LiteralPath,[switch]$Recurse,[switch]$Force)
  Check-FixturePath $(if ($LiteralPath) {$LiteralPath} else {$Path})
  Microsoft.PowerShell.Management\Remove-Item @PSBoundParameters
}
function global:node {
  if ($args[0] -eq '-p') { $global:LASTEXITCODE=0; '22'; return }
  Log-Call 'node' $args
  $global:LASTEXITCODE=0
}
function global:npm.cmd {
  Log-Call 'npm' $args
  if ($args[0] -eq 'ci' -and $config.failCi) { $global:LASTEXITCODE=1; return }
  if ($args[0] -eq 'run' -and $args[1] -eq 'build') {
    New-Item -ItemType Directory -Path 'packages/installer/dist' -Force | Out-Null
    [IO.File]::WriteAllText((Join-Path (Get-Location) 'packages/installer/dist/cli.js'), '// freshly built')
  }
  $global:LASTEXITCODE=0
}
function global:Invoke-WebRequest {
  param([string]$Uri,[string]$OutFile,[switch]$UseBasicParsing)
  $global:bootstrapAllowedRoots += [IO.Path]::GetFullPath([IO.Path]::GetDirectoryName($OutFile))
  [IO.File]::WriteAllText((Join-Path ([IO.Path]::GetDirectoryName($OutFile)) '.bootstrap-test-owner'), $config.root)
  Log-Call 'download' @($Uri, $OutFile)
  [IO.File]::WriteAllText($OutFile, 'fake archive')
}
function global:Expand-Archive {
  param([string]$Path,[string]$LiteralPath,[string]$DestinationPath,[switch]$Force)
  $root = Join-Path $DestinationPath 'downloaded'
  foreach ($name in @('bin/codexplusplus.js','packages/installer/src/cli.ts','packages/runtime/src/main.ts')) {
    $file = Join-Path $root $name
    New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($file)) -Force | Out-Null
    [IO.File]::WriteAllText($file, '// fixture')
  }
  [IO.File]::WriteAllText((Join-Path $root 'package.json'), '{"name":"codex-plusplus"}')
  [IO.File]::WriteAllText((Join-Path $root 'package-lock.json'), 'downloaded lock')
}
try {
  $installArgs = @($config.arguments)
  if ($config.online) { Invoke-Expression ([IO.File]::ReadAllText($config.script)) }
  else { & $config.script @installArgs }
  exit $LASTEXITCODE
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
}
`);
  const trace = join(root, "trace.jsonl");
  t.after(() => {
    if (existsSync(trace)) for (const line of readFileSync(trace, "utf8").trim().split(/\r?\n/).filter(Boolean)) {
      const call: Call = JSON.parse(line);
      if (call.kind !== "download" || !call.arguments[1]) continue;
      const recordedWork = dirname(call.arguments[1]);
      if (!existsSync(recordedWork)) continue;
      const work = realpathSync.native(recordedWork);
      assert.equal(dirname(work), expectedTempRoot);
      assert.equal(readFileSync(join(work, ".bootstrap-test-owner"), "utf8"), root);
      rmSync(work, { recursive: true, force: true });
    }
    rmSync(root, { recursive: true, force: true });
  });
  return {
    root, checkout,
    run(options: { online?: boolean; target?: string; cwd?: string; failCi?: boolean; arguments?: string[]; tempDir?: string } = {}) {
      if (options.tempDir) {
        expectedTempRoot = realpathSync.native(options.tempDir);
        assert.ok(expectedTempRoot.startsWith(root + "\\"), "temporary override must belong to this fixture");
      }
      const config = join(root, "config.json");
      writeFileSync(config, JSON.stringify({ root, trace, script: join(checkout, "install.ps1"),
        online: options.online ?? false, failCi: options.failCi ?? false, arguments: options.arguments ?? [] }));
      const result = spawnSync(shell, ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", harness, config], {
        cwd: options.cwd ?? root, encoding: "utf8", timeout: 20_000,
        env: { ...process.env, CODEX_PLUSPLUS_SOURCE_DIR: options.target ?? join(root, "installed source"),
          ...(options.tempDir ? { TEMP: options.tempDir, TMP: options.tempDir } : {}) },
      });
      assert.ifError(result.error);
      const calls: Call[] = existsSync(trace) ? readFileSync(trace, "utf8").trim().split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) : [];
      return { ...result, calls };
    },
  };
}

test("PowerShell file invocation builds its local source from another working directory", { skip: !windows }, t => {
  const f = fixture(t);
  const target = join(f.root, "untouched target");
  source(target);
  mkdirSync(join(target, ".git"));
  const result = f.run({ target, arguments: ["--quiet", "--app", "C:\\Example App"] });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(result.calls.filter(c => c.kind === "download").length, 0);
  assert.deepEqual(result.calls.filter(c => c.kind === "npm").map(c => c.arguments[0]), ["ci", "run"]);
  assert.ok(result.calls.filter(c => c.kind === "npm").every(c => c.cwd === f.checkout));
  assert.deepEqual(result.calls.find(c => c.kind === "node")?.arguments,
    [join(f.checkout, "packages/installer/dist/cli.js"), "install", "--quiet", "--app", "C:\\Example App"]);
  assert.equal(readFileSync(join(f.checkout, "dirty.txt"), "utf8"), "uncommitted work");
  assert.equal(readFileSync(join(f.checkout, "package-lock.json"), "utf8"), "original lockfile\n");
  assert.ok(existsSync(join(target, ".git")));
  assert.equal(existsSync(target + ".previous"), false);
});

test("PowerShell local installer preserves the caller directory for a relative app override", { skip: !windows }, t => {
  const f = fixture(t);
  const result = f.run({ arguments: ["--app", ".\\CodexPortable"] });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const installer = result.calls.find(c => c.kind === "node");
  assert.equal(installer?.cwd, f.root);
  assert.deepEqual(installer?.arguments.slice(1), ["install", "--app", ".\\CodexPortable"]);
});

test("PowerShell local dependency failure preserves the lockfile and never falls back to downloading", { skip: !windows }, t => {
  const f = fixture(t);
  const result = f.run({ failCi: true });
  assert.notEqual(result.status, 0);
  assert.deepEqual(result.calls.map(c => c.kind), ["npm"]);
  assert.equal(result.calls[0].arguments[0], "ci");
  assert.equal(readFileSync(join(f.checkout, "package-lock.json"), "utf8"), "original lockfile\n");
});

test("PowerShell online invocation downloads even when the current directory is a checkout", { skip: !windows }, t => {
  const f = fixture(t);
  const result = f.run({ online: true, cwd: f.checkout });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(result.calls.filter(c => c.kind === "download").length, 1);
  assert.equal(readFileSync(join(f.checkout, "dirty.txt"), "utf8"), "uncommitted work");
  assert.equal(result.calls.find(c => c.kind === "node")?.arguments[0], join(f.root, "installed source/packages/installer/dist/cli.js"));
});

test("PowerShell online installation cleans its work directory when native Temp uses an 8.3 alias", { skip: !windows }, t => {
  const f = fixture(t);
  const tempRoot = join(f.root, "native temporary directory with short alias");
  mkdirSync(tempRoot);
  const aliasResult = spawnSync(shell, ["-NoProfile", "-NonInteractive", "-Command",
    "$fso = New-Object -ComObject Scripting.FileSystemObject; $fso.GetFolder($env:BOOTSTRAP_ALIAS_TEMP).ShortPath"], {
    encoding: "utf8", timeout: 20_000, env: { ...process.env, BOOTSTRAP_ALIAS_TEMP: tempRoot },
  });
  assert.ifError(aliasResult.error);
  assert.equal(aliasResult.status, 0, aliasResult.stderr);
  const alias = aliasResult.stdout.trim();
  if (!alias || alias.toLowerCase() === tempRoot.toLowerCase()) {
    t.skip("filesystem does not provide a short alias for the temporary directory");
    return;
  }
  assert.equal(realpathSync.native(alias), tempRoot);
  const result = f.run({ online: true, tempDir: alias });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const download = result.calls.find(call => call.kind === "download");
  assert.ok(download);
  assert.equal(existsSync(dirname(download.arguments[1])), false, "installer must remove its own temporary work directory");
  assert.deepEqual(readdirSync(tempRoot), []);
});

for (const mode of ["checkout", "checkout child", "nested checkout", "git-file", "backup checkout", "unknown backup"]) {
  test(`PowerShell online installation preserves ${mode}`, { skip: !windows }, t => {
    const f = fixture(t);
    let target = join(f.root, "protected");
    if (mode === "checkout") target = f.checkout;
    else if (mode === "checkout child") target = join(f.checkout, "nested destination");
    else if (mode === "nested checkout") {
      source(target); mkdirSync(join(target, "nested/.git"), { recursive: true });
    } else if (mode === "git-file") {
      source(target); writeFileSync(join(target, ".git"), "gitdir: elsewhere");
    } else {
      source(target);
      const previous = target + ".previous";
      if (mode === "backup checkout") { source(previous); mkdirSync(join(previous, ".git")); }
      else mkdirSync(previous);
      writeFileSync(join(previous, "keep.txt"), "keep backup");
    }
    const result = f.run({ online: true, target });
    assert.notEqual(result.status, 0, result.stdout);
    assert.equal(result.calls.length, 0, "unsafe destinations must fail before network or dependency operations");
    assert.ok(existsSync(join(f.checkout, ".git")));
    if (mode.includes("backup")) assert.equal(readFileSync(join(target + ".previous", "keep.txt"), "utf8"), "keep backup");
  });
}

test("PowerShell online installation can replace a prior source archive without Git metadata", { skip: !windows }, t => {
  const f = fixture(t), target = join(f.root, "archive");
  source(target);
  writeFileSync(join(target, "old.txt"), "previous installation");
  const result = f.run({ online: true, target });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  assert.equal(readFileSync(join(target + ".previous", "old.txt"), "utf8"), "previous installation");
  assert.ok(existsSync(join(target, "packages/installer/dist/cli.js")));
});

test("PowerShell backup cleanup preserves a repository behind a nested junction", { skip: !windows }, t => {
  const f = fixture(t), target = join(f.root, "archive"), previous = target + ".previous";
  source(target);
  source(previous);
  symlinkSync(f.checkout, join(previous, "linked-repo"), "junction");
  const result = f.run({ online: true, target });
  assert.equal(readFileSync(join(f.checkout, "dirty.txt"), "utf8"), "uncommitted work");
  assert.ok(existsSync(join(f.checkout, ".git")));
  assert.equal(result.status, 0, result.stderr + result.stdout);
});
