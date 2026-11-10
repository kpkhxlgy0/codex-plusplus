import { execFileSync } from "node:child_process";
import { platform } from "node:os";

export interface WindowsMirrorCleanupResult {
  removed: string[];
  retained: string[];
  planned: string[];
  warnings: string[];
}

interface WindowsMirrorCleanupOptions {
  appRoot: string;
  stateFile: string;
  quiet?: boolean;
  dryRun?: boolean;
}

/** Best effort: an obsolete mirror must never turn a successful upgrade into a failure. */
export function cleanupOldWindowsMirrors(options: WindowsMirrorCleanupOptions): WindowsMirrorCleanupResult {
  let result: WindowsMirrorCleanupResult = { removed: [], retained: [], planned: [], warnings: [] };
  if (platform() !== "win32") return result;

  try {
    const script = buildWindowsMirrorCleanupScript({
      appRoot: options.appRoot,
      stateFile: options.stateFile,
      localAppData: process.env.LOCALAPPDATA,
      dryRun: options.dryRun,
    });
    const output = execFileSync("powershell.exe", [
      "-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64"),
    ], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], windowsHide: true,
      timeout: 60_000, maxBuffer: 1024 * 1024,
    });
    const parsed: unknown = JSON.parse(output.trim());
    if (!isCleanupResult(parsed)) throw new Error("Invalid cleanup result");
    result = parsed;
  } catch {
    result.warnings.push("Windows mirror cleanup could not finish; old mirrors may remain.");
  }
  if (!options.quiet) {
    for (const warning of result.warnings) console.warn(`  ${warning}`);
  }
  return result;
}

function isCleanupResult(value: unknown): value is WindowsMirrorCleanupResult {
  if (!value || typeof value !== "object") return false;
  return ["removed", "retained", "planned", "warnings"].every((key) => {
    const items = (value as Record<string, unknown>)[key];
    return Array.isArray(items) && items.every((item) => typeof item === "string");
  });
}

/** Internal script boundary also lets native tests use isolated OS temporary fixtures. */
export function buildWindowsMirrorCleanupScript(input: {
  appRoot: string;
  stateFile: string;
  localAppData?: string;
  dryRun?: boolean;
}): string {
  const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;
  return `$cleanupAppRoot = ${quote(input.appRoot)}\n` +
    `$cleanupStateFile = ${quote(input.stateFile)}\n` +
    `$cleanupLocalAppData = ${quote(input.localAppData ?? "")}\n` +
    `$cleanupDryRun = $${input.dryRun ? "true" : "false"}\n` + String.raw`
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$cleanupResult = @{ removed = @(); retained = @(); planned = @(); warnings = @() }

function Get-CleanupAbsolutePath([object] $Value) {
  if ($Value -isnot [string] -or [string]::IsNullOrWhiteSpace($Value) -or $Value -ne $Value.Trim()) {
    throw 'Unsafe path'
  }
  $path = $Value.Replace('/', '\')
  if ($path -notmatch '^[a-zA-Z]:\\' -or $path.Substring(2) -match '[:\x00-\x1f<>"|?*]' -or
      $path.Substring(3) -match '\\\\') { throw 'Unsafe path' }
  foreach ($part in $path.Substring(3).TrimEnd('\').Split('\')) {
    if (!$part -or $part -match '(^\.{1,2}$|[. ]$|~[0-9])' -or
        $part -match '^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)') { throw 'Unsafe path' }
  }
  $full = [IO.Path]::GetFullPath($path).TrimEnd('\')
  if ($full -ne $path.TrimEnd('\')) { throw 'Noncanonical path' }
  return $full
}

function Get-CleanupItem([string] $Path, [bool] $Directory) {
  $safe = Get-CleanupAbsolutePath $Path
  $item = Get-Item -LiteralPath $safe -Force -ErrorAction Stop
  if ($item.PSIsContainer -ne $Directory -or $item.FullName.TrimEnd('\') -ne $safe) { throw 'Wrong item' }
  $ancestor = $item
  while ($null -ne $ancestor) {
    if (($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse point' }
    if ($ancestor -is [IO.DirectoryInfo]) { $ancestor = $ancestor.Parent }
    else { $ancestor = $ancestor.Directory }
  }
  return $item
}

function Get-CleanupPackage([string] $Name) {
  if ($Name -notmatch '^OpenAI\.Codex_(\d+\.\d+\.\d+\.\d+)_(x64|x86|arm64)__([a-z0-9]{13})$') {
    return $null
  }
  $number = $null
  if (![version]::TryParse($Matches[1], [ref] $number)) { return $null }
  if ($number.Major -gt 65535 -or $number.Minor -gt 65535 -or
      $number.Build -gt 65535 -or $number.Revision -gt 65535) { return $null }
  return @{ Version = $number; Arch = $Matches[2]; Publisher = $Matches[3] }
}

function Assert-CleanupState {
  $null = Get-CleanupItem $cleanupStateFile $false
  $text = [IO.File]::ReadAllText($cleanupStateFile)
  if ($text -cne $script:cleanupInitialState) { throw 'State changed' }
  $state = $text | ConvertFrom-Json -ErrorAction Stop
  if ((Get-CleanupAbsolutePath $state.appRoot) -ne $script:cleanupCurrentApp) { throw 'State mismatch' }
  $null = Get-CleanupItem $script:cleanupManagedRoot $true
  $null = Get-CleanupItem $script:cleanupCurrentApp $true
}

function Assert-CleanupTree([string] $Target) {
  $item = Get-CleanupItem $Target $true
  if ($item.Parent.FullName -ne $script:cleanupManagedRoot) { throw 'Wrong parent' }
  $pending = New-Object 'System.Collections.Generic.Stack[System.IO.DirectoryInfo]'
  $pending.Push($item)
  while ($pending.Count -gt 0) {
    $directory = $pending.Pop()
    foreach ($child in @(Get-ChildItem -LiteralPath $directory.FullName -Force -ErrorAction Stop)) {
      $null = Get-CleanupAbsolutePath $child.FullName
      if (($child.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse descendant' }
      if ($child.PSIsContainer) { $pending.Push($child) }
    }
  }
}

function Assert-CleanupPackagedSandboxService([object] $Process) {
  if ($Process.Name -ne 'codex-windows-sandbox-service.exe' -or $Process.ProcessId -le 0) {
    throw 'Unknown relevant process location'
  }
  $services = @(Get-CimInstance -ClassName Win32_Service -Filter "ProcessId = $($Process.ProcessId)" -ErrorAction Stop)
  if ($services.Count -ne 1 -or $services[0].ProcessId -ne $Process.ProcessId -or
      $services[0].Name -ne 'CodexSandboxService.OpenAI.Codex' -or $services[0].State -ne 'Running' -or
      $services[0].PathName -notmatch '^"([^"]+)"$') { throw 'Unknown sandbox service' }
  $servicePath = Get-CleanupAbsolutePath $Matches[1]
  $packages = @(Get-AppxPackage -Name OpenAI.Codex -ErrorAction Stop)
  if ($packages.Count -ne 1 -or $packages[0].Name -ne 'OpenAI.Codex') { throw 'Unknown registered package' }
  $package = Get-CleanupPackage $packages[0].PackageFullName
  if ($null -eq $package -or $package.Arch -ne $script:cleanupCurrentPackage.Arch -or
      $package.Publisher -ne $script:cleanupCurrentPackage.Publisher) { throw 'Wrong registered package' }
  $location = Get-CleanupAbsolutePath $packages[0].InstallLocation
  if ([IO.Path]::GetFileName($location) -ne $packages[0].PackageFullName -or
      $location -eq $script:cleanupManagedRoot -or
      $location.StartsWith($script:cleanupManagedRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Unsafe registered package location'
  }
  $expected = Get-CleanupAbsolutePath (Join-Path $location 'app\resources\codex-windows-sandbox-service.exe')
  if ($servicePath -ne $expected) { throw 'Wrong sandbox service image' }
  $null = Get-CleanupItem $expected $false
  if (![string]::IsNullOrEmpty([string] $Process.ExecutablePath) -and
      (Get-CleanupAbsolutePath $Process.ExecutablePath) -ne $expected) { throw 'Sandbox image mismatch' }
  if (![string]::IsNullOrEmpty([string] $Process.CommandLine) -and
      $Process.CommandLine -ne $services[0].PathName) { throw 'Sandbox command mismatch' }
}

function Test-CleanupInUse([string] $Target) {
  $processes = @(Get-CimInstance -ClassName Win32_Process -ErrorAction Stop)
  $inUse = $false
  foreach ($process in $processes) {
    if ($process.ProcessId -eq $PID) { continue }
    $executable = [string] $process.ExecutablePath
    $command = [string] $process.CommandLine
    $relevant = ([string] $process.Name) -match '^(codex.*|chatgpt|node(js)?|electron)(\.exe)?$' -or
      $executable.IndexOf($script:cleanupManagedRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0 -or
      $command.Replace('/', '\').IndexOf($script:cleanupManagedRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0
    if ($relevant) {
      if ([string]::IsNullOrWhiteSpace($executable) -or [string]::IsNullOrWhiteSpace($command)) {
        Assert-CleanupPackagedSandboxService $process
        continue
      }
      $null = Get-CleanupAbsolutePath $executable
      if ($command -match '~[0-9]') { throw 'Unknown relevant process location' }
    }
    if ($executable.Replace('/', '\').IndexOf($Target, [StringComparison]::OrdinalIgnoreCase) -ge 0 -or
        $command.Replace('/', '\').IndexOf($Target, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
      $inUse = $true
    }
  }
  return $inUse
}

function Invoke-MirrorCleanup {
  $stage = 'current mirror or managed root validation failed'
  try {
    $local = Get-CleanupAbsolutePath $cleanupLocalAppData
    $script:cleanupManagedRoot = Get-CleanupAbsolutePath (Join-Path $local 'codex-plusplus\store-apps')
    $script:cleanupCurrentApp = Get-CleanupAbsolutePath $cleanupAppRoot
    $packageRoot = [IO.Path]::GetDirectoryName($script:cleanupCurrentApp)
    if ([IO.Path]::GetFileName($script:cleanupCurrentApp) -ne 'app' -or
        [IO.Path]::GetDirectoryName($packageRoot) -ne $script:cleanupManagedRoot) { return }
    $currentPackage = Get-CleanupPackage ([IO.Path]::GetFileName($packageRoot))
    if ($null -eq $currentPackage) { throw 'Unrecognized current package' }
    $script:cleanupCurrentPackage = $currentPackage
    $null = Get-CleanupItem $script:cleanupManagedRoot $true
    $null = Get-CleanupItem $script:cleanupCurrentApp $true
    $stage = 'persisted state validation failed'
    $null = Get-CleanupItem $cleanupStateFile $false
    $script:cleanupInitialState = [IO.File]::ReadAllText($cleanupStateFile)
    Assert-CleanupState
    $stage = 'managed mirror enumeration failed'
    $entries = @(Get-ChildItem -LiteralPath $script:cleanupManagedRoot -Force -ErrorAction Stop | Sort-Object Name)
    foreach ($entry in $entries) {
      $target = $entry.FullName
      $package = Get-CleanupPackage $entry.Name
      if (!$entry.PSIsContainer -or $null -eq $package -or $target -eq $packageRoot -or
          $package.Arch -ne $currentPackage.Arch -or $package.Publisher -ne $currentPackage.Publisher -or
          $package.Version -ge $currentPackage.Version) {
        $cleanupResult.retained += $target
        continue
      }
      $reason = 'state or path validation failed'
      try {
        Assert-CleanupState
        Assert-CleanupTree $target
        $reason = 'process inspection failed or a relevant process location was unavailable'
        $inUse = Test-CleanupInUse $target
        $reason = 'state or path changed during inspection'
        Assert-CleanupState
        Assert-CleanupTree $target
        Assert-CleanupState
        $targetItem = Get-CleanupItem $target $true
        if ($targetItem.Parent.FullName -ne $script:cleanupManagedRoot) { throw 'Wrong parent' }
        if ($inUse) {
          $cleanupResult.retained += $target
          continue
        }
        if ($cleanupDryRun) {
          $cleanupResult.planned += $target
          continue
        }
        $reason = 'native deletion failed'
        Remove-Item -LiteralPath $target -Recurse -ErrorAction Stop
        if (Test-Path -LiteralPath $target -ErrorAction Stop) { throw 'Directory remains' }
        $cleanupResult.removed += $target
      } catch {
        $cleanupResult.retained += $target
        $cleanupResult.warnings += "Skipped mirror '$target': $reason."
      }
    }
  } catch {
    $cleanupResult.warnings += "Windows mirror cleanup skipped: $stage."
  }
}

Invoke-MirrorCleanup
ConvertTo-Json -InputObject $cleanupResult -Compress -Depth 4
`;
}
