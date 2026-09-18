import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, win32 } from "node:path";
import type { CodexInstall } from "./platform.js";
import { userPaths } from "./paths.js";

export const WINDOWS_MANAGED_LAUNCHER = "launch-packaged-chatgpt.ps1";

export function windowsStoreMirrorPackage(appRoot: string): string | null {
  const normalized = win32.normalize(appRoot);
  const match = normalized.match(/\\codex-plusplus\\store-apps\\([^\\]+)\\app\\?$/i);
  return match?.[1] ?? null;
}

function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function windowsManagedLaunchCommand(appRoot: string): { command: string; args: string[] } | null {
  if (!windowsStoreMirrorPackage(appRoot)) return null;
  return {
    command: join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
    args: ["-NoLogo", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-File",
      join(userPaths().binDir, WINDOWS_MANAGED_LAUNCHER)],
  };
}

export function installWindowsManagedAppLauncher(codex: CodexInstall): { shortcutPaths: string[] } | null {
  if (codex.platform !== "win32") return null;
  const launch = windowsManagedLaunchCommand(codex.appRoot);
  const local = process.env.LOCALAPPDATA;
  if (!launch || !local) return null;
  const paths = userPaths();
  mkdirSync(paths.binDir, { recursive: true });
  writeFileSync(join(paths.binDir, WINDOWS_MANAGED_LAUNCHER),
    buildWindowsManagedLauncher(basename(codex.executable)).replace(/\r?\n/g, "\r\n"), "utf8");

  const shimDir = join(local, "Microsoft", "WindowsApps");
  mkdirSync(shimDir, { recursive: true });
  const commandPath = join(shimDir, "codex-plusplus-codex.cmd");
  const commandLine = [launch.command, ...launch.args].map((arg) => `"${arg.replace(/%/g, "%%")}"`).join(" ");
  writeFileSync(commandPath, `@echo off\r\n${commandLine} %*\r\n`, "utf8");
  const shortcuts = [join(homedir(), "Desktop", "Codex++.lnk")];
  if (process.env.APPDATA) {
    shortcuts.push(join(process.env.APPDATA, "Microsoft", "Windows", "Start Menu", "Programs", "Codex++.lnk"));
  }
  const args = launch.args.map((arg) => `"${arg}"`).join(" ");
  const shortcutPaths = [commandPath];
  for (const shortcutPath of shortcuts) {
    try {
      mkdirSync(dirname(shortcutPath), { recursive: true });
      const script = [
        "$ErrorActionPreference = 'Stop'",
        "$shell = New-Object -ComObject WScript.Shell",
        `$shortcut = $shell.CreateShortcut(${psQuote(shortcutPath)})`,
        `$shortcut.TargetPath = ${psQuote(launch.command)}`,
        `$shortcut.Arguments = ${psQuote(args)}`,
        `$shortcut.WorkingDirectory = ${psQuote(paths.binDir)}`,
        `$shortcut.IconLocation = ${psQuote(`${codex.executable},0`)}`,
        "$shortcut.WindowStyle = 7",
        "$shortcut.Save()",
      ].join("\n");
      execFileSync(launch.command, ["-NoProfile", "-NonInteractive", "-EncodedCommand",
        Buffer.from(script, "utf16le").toString("base64")], { stdio: "pipe", windowsHide: true });
      shortcutPaths.push(shortcutPath);
    } catch {
      // 快捷方式不可写时保留命令行入口，继续尝试其他位置。
    }
  }
  return { shortcutPaths };
}

function buildWindowsManagedLauncher(executableName: string): string {
  return String.raw`$ErrorActionPreference = 'Stop'
$launchArguments = @($args)
$codexDataRoot = Split-Path -Parent $PSScriptRoot
try {
    $state = Get-Content -LiteralPath (Join-Path $codexDataRoot 'state.json') -Raw | ConvertFrom-Json
    $appRoot = [IO.Path]::GetFullPath($state.appRoot)
    $mirrorRoot = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'codex-plusplus\store-apps'))
    if (-not $appRoot.StartsWith($mirrorRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
        (Split-Path -Leaf $appRoot) -ne 'app' -or
        (Split-Path -Parent (Split-Path -Parent $appRoot)) -ne $mirrorRoot) {
        throw 'Invalid Codex++ Store mirror. Run codexplusplus repair.'
    }
    $packageFullName = Split-Path -Leaf (Split-Path -Parent $appRoot)
    $packages = @(Get-AppxPackage | Where-Object { $_.PackageFullName -eq $packageFullName })
    if ($packages.Count -ne 1) {
        throw 'The matching ChatGPT package is no longer installed. Close ChatGPT, then run codexplusplus repair.'
    }
    $package = $packages[0]
    $executableName = ${psQuote(executableName)}
    $executable = Join-Path $appRoot $executableName
    if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) {
        throw 'The Codex++ executable was not found. Run codexplusplus repair.'
    }
    $manifest = Get-AppxPackageManifest -Package $package.PackageFullName
    $apps = @($manifest.Package.Applications.Application | Where-Object {
        ($_.Executable -replace '/', '\') -eq ('app\' + $executableName)
    })
    if ($apps.Count -ne 1) {
        throw 'Cannot identify the matching ChatGPT application in the installed package. Run codexplusplus repair.'
    }
    $quotedArguments = @($launchArguments | ForEach-Object {
        $value = [regex]::Replace([string]$_, '(\\*)"', '$1$1\"')
        '"' + [regex]::Replace($value, '(\\+)$', '$1$1') + '"'
    })
    $parameters = @{
        PackageFamilyName = $package.PackageFamilyName
        AppId = $apps[0].Id
        Command = $executable
    }
    if ($quotedArguments.Count -gt 0) { $parameters.Args = $quotedArguments -join ' ' }
    Invoke-CommandInDesktopPackage @parameters
} catch {
    $logDir = Join-Path $codexDataRoot 'log'
    [void](New-Item -ItemType Directory -Path $logDir -Force -ErrorAction SilentlyContinue)
    Add-Content -LiteralPath (Join-Path $logDir 'packaged-launcher.log') -Encoding UTF8 -ErrorAction SilentlyContinue -Value ('[{0:o}] {1}' -f (Get-Date), $_)
    [Console]::Error.WriteLine($_.ToString())
    exit 1
}
`;
}
