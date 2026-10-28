$ErrorActionPreference = "Stop"
# Evaluated online text has no script path, even when its caller is a local script.
$ScriptFile = $PSCommandPath

$Repo = if ($env:CODEX_PLUSPLUS_REPO) { $env:CODEX_PLUSPLUS_REPO } else { "kpkhxlgy0/codex-plusplus" }
$Ref = if ($env:CODEX_PLUSPLUS_REF) { $env:CODEX_PLUSPLUS_REF } else { "master" }
$InstallDir = if ($env:CODEX_PLUSPLUS_SOURCE_DIR) { $env:CODEX_PLUSPLUS_SOURCE_DIR } else { Join-Path $HOME ".codex-plusplus\source" }

function Fail($Message) {
  [Console]::Error.WriteLine("[!] $Message")
  [Console]::Error.WriteLine("    Paste this error into Codex if you need help.")
  exit 1
}

function Require-Command($Command, $Message) {
  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    Fail $Message
  }
}

function Test-SourceRoot([string]$Directory) {
  try {
    $Package = [IO.File]::ReadAllText((Join-Path $Directory "package.json")) | ConvertFrom-Json
    if ($Package.name -cne "codex-plusplus") { return $false }
    foreach ($Entry in @("bin/codexplusplus.js", "packages/installer/src/cli.ts", "packages/runtime/src/main.ts")) {
      if (-not (Test-Path -LiteralPath (Join-Path $Directory $Entry) -PathType Leaf)) { return $false }
    }
    return $true
  } catch { return $false }
}

function Get-PathItem([string]$Path) {
  try { return Get-Item -LiteralPath $Path -Force -ErrorAction Stop }
  catch [System.Management.Automation.ItemNotFoundException] { return $null }
}

function Assert-ReplaceablePath([string]$Path) {
  $Full = [IO.Path]::GetFullPath($Path)
  if ($Full.TrimEnd('\', '/') -eq [IO.Path]::GetPathRoot($Full).TrimEnd('\', '/') -or
      $Full.TrimEnd('\', '/') -eq [IO.Path]::GetFullPath($HOME).TrimEnd('\', '/')) {
    Fail "Refusing to replace a filesystem root or home directory: $Full"
  }
  $Cursor = $Full
  while ($Cursor) {
    $Item = Get-PathItem $Cursor
    if ($Item -and ($Item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
      Fail "Refusing to replace a linked installation path: $Full"
    }
    if (Get-PathItem (Join-Path $Cursor ".git")) {
      Fail "Refusing to replace a Git checkout or a directory inside one: $Full"
    }
    $Cursor = Split-Path -Parent $Cursor
  }
  $Item = Get-PathItem $Full
  if (-not $Item) { return }
  if (-not $Item.PSIsContainer) { Fail "Installation destination is not a directory: $Full" }
  $Pending = New-Object 'System.Collections.Generic.Stack[string]'
  $Pending.Push($Full)
  while ($Pending.Count) {
    foreach ($Child in (Get-ChildItem -LiteralPath $Pending.Pop() -Force -ErrorAction Stop)) {
      if ($Child.Name -ieq ".git") { Fail "Refusing to replace a directory containing a Git checkout: $Full" }
      if ($Child.PSIsContainer -and -not ($Child.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        $Pending.Push($Child.FullName)
      }
    }
  }
  if (@(Get-ChildItem -LiteralPath $Full -Force -ErrorAction Stop).Count -gt 0 -and -not (Test-SourceRoot $Full)) {
    Fail "Refusing to replace a nonempty directory that is not a codex-plusplus source installation: $Full"
  }
}

function Install-Dependencies([string]$Source, [bool]$Downloaded) {
  Write-Host "Installing dependencies..."
  Push-Location -LiteralPath $Source
  try {
    if (Test-Path -LiteralPath "package-lock.json") {
      & npm.cmd ci --workspaces --include-workspace-root --ignore-scripts
      if ($LASTEXITCODE -eq 0) { return }
      if (-not $Downloaded) { Fail "npm ci failed. The local lockfile has been preserved; fix the dependency error and retry." }
      [Console]::Error.WriteLine("npm ci failed; regenerating the downloaded lockfile and installing workspace dependencies.")
      Remove-Item -LiteralPath (Join-Path $Source "package-lock.json")
    }
    & npm.cmd install --workspaces --include-workspace-root --ignore-scripts
    if ($LASTEXITCODE -ne 0) { Fail "npm install failed while installing codex-plusplus dependencies." }
  } finally { Pop-Location }
}

function Build-Source([string]$Source) {
  Write-Host "Building codex-plusplus..."
  Push-Location -LiteralPath $Source
  try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { Fail "codex-plusplus build failed." }
  } finally { Pop-Location }
}

Require-Command node "Node.js 20+ is required but node was not found."
Require-Command npm.cmd "npm is required to build codex-plusplus."

$NodeMajorText = & node -p "Number(process.versions.node.split('.')[0])"
$NodeMajor = [int]$NodeMajorText
if ($NodeMajor -lt 20) {
  $NodeVersion = & node -v
  Fail "Node.js 20+ is required; found $NodeVersion."
}

$LocalSource = if ($ScriptFile) { Split-Path -Parent ([IO.Path]::GetFullPath($ScriptFile)) } else { $null }
if ($LocalSource -and (Test-SourceRoot $LocalSource)) {
  Write-Host "Using local codex-plusplus source: $LocalSource"
  Install-Dependencies $LocalSource $false
  Build-Source $LocalSource
  Write-Host "Running installer..."
  & node (Join-Path $LocalSource "packages\installer\dist\cli.js") install @args
  if ($LASTEXITCODE -ne 0) { Fail "codex-plusplus installer failed." }
  Write-Host "codex-plusplus installed from local source: $LocalSource"
  return
}

$InstallDir = [IO.Path]::GetFullPath($ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($InstallDir))
$Previous = "$InstallDir.previous"
Assert-ReplaceablePath $InstallDir
Assert-ReplaceablePath $Previous

$Work = Join-Path ([System.IO.Path]::GetTempPath()) ("codex-plusplus." + [System.Guid]::NewGuid().ToString("N"))
$Archive = Join-Path $Work "source.zip"
$Extract = Join-Path $Work "extract"
$Next = Join-Path $Work "source"

try {
  New-Item -ItemType Directory -Force -Path $Work, $Extract | Out-Null

  $Url = "https://codeload.github.com/$Repo/zip/$Ref"
  Write-Host "Downloading codex-plusplus from https://github.com/$Repo ($Ref)..."
  try {
    Invoke-WebRequest -Uri $Url -OutFile $Archive -UseBasicParsing
  } catch {
    Fail "Download failed from https://github.com/$Repo ($Ref). Check the repo, branch, and network connection."
  }

  try {
    Expand-Archive -Path $Archive -DestinationPath $Extract -Force
    $ExtractedRoot = Get-ChildItem -Path $Extract -Directory | Select-Object -First 1
    if (-not $ExtractedRoot) {
      Fail "Could not unpack the codex-plusplus download."
    }
    Move-Item -LiteralPath $ExtractedRoot.FullName -Destination $Next
  } catch {
    Fail "Could not unpack the codex-plusplus download."
  }

  Install-Dependencies $Next $true
  Build-Source $Next

  # Recheck after the download/build, before moving or removing either tree.
  Assert-ReplaceablePath $InstallDir
  Assert-ReplaceablePath $Previous
  $InstallParent = Split-Path -Parent $InstallDir
  New-Item -ItemType Directory -Force -Path $InstallParent | Out-Null
  if (Get-PathItem $Previous) {
    Remove-Item -LiteralPath $Previous -Recurse
  }
  if (Get-PathItem $InstallDir) {
    Move-Item -LiteralPath $InstallDir -Destination $Previous
  }
  Move-Item -LiteralPath $Next -Destination $InstallDir

  Write-Host "Finalizing workspace links..."
  Push-Location -LiteralPath $InstallDir
  try {
    & npm.cmd install --workspaces --include-workspace-root --ignore-scripts
    if ($LASTEXITCODE -ne 0) {
      Fail "npm install failed while finalizing codex-plusplus workspace links."
    }
  } finally {
    Pop-Location
  }

  Write-Host "Running installer..."
  & node (Join-Path $InstallDir "packages\installer\dist\cli.js") install @args
  if ($LASTEXITCODE -ne 0) {
    Fail "codex-plusplus installer failed."
  }

  Write-Host ""
  Write-Host "codex-plusplus source installed at: $InstallDir"
} finally {
  if (Test-Path -LiteralPath $Work) {
    $ResolvedWork = (Resolve-Path -LiteralPath $Work).ProviderPath
    $TempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\', '/')
    if ($ResolvedWork -ne [IO.Path]::GetFullPath($Work) -or
        [IO.Path]::GetDirectoryName($ResolvedWork) -ne $TempRoot -or
        ((Get-Item -LiteralPath $ResolvedWork -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
      throw "Refusing to clean an unexpected temporary path: $Work"
    }
    Remove-Item -LiteralPath $ResolvedWork -Recurse
  }
}
