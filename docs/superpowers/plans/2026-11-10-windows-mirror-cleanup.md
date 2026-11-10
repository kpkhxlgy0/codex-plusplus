# Windows Mirror Cleanup Implementation Plan

> **For agentic workers:** Use test-driven implementation and independent review in the existing user-selected checkout.

**Goal:** Automatically remove unused older Windows Store mirrors after successful Codex++ upgrades and clean the
four user-authorized local mirrors.

**Architecture:** A dedicated installer helper performs bounded Windows path/state/process verification and native
PowerShell deletion. Install and successful repair invoke it after committing their successful state. Update and
watcher flows already converge through repair/install.

**Tech Stack:** TypeScript, native PowerShell/CIM, node:test, existing installer integration fixtures.

**Spec:** `../specs/2026-11-10-windows-mirror-cleanup-design.md`.

## Constraints and review focus

No release/push/version bump/consumer changes. No real install, patch, application restart or GUI operation needed.
Keep active/current directories, backups, runtime and tweaks. Process/state uncertainty preserves files. No Force,
cross-shell deletion, reparse traversal or cleanup before successful state persistence. Use OS Temp for fixtures.

## Tasks

- [x] Worker: add `packages/installer/src/windows-mirror-cleanup.ts` and its focused test file. Write failing tests,
  then implement native-safe cleanup plus an internal dry run. API: `cleanupOldWindowsMirrors({appRoot,stateFile,
  quiet?,dryRun?})`, returning `{removed,retained,planned,warnings}` arrays; it never throws on cleanup failure.
- [x] Primary: integrate after successful state writes in `commands/install.ts` and the intact-patch/runtime paths
  in `commands/repair.ts`; preserve early update-paused/disabled/failure exits. Add directly related integration
  fixture tests and document automatic cleanup.
- [x] Primary/reviewer: build, run focused and full core tests, inspect final diff with independent review, fix any
  confirmed issues and record exact verification results.
- [x] Primary: dry-run the real installed mirror, compare candidates against the four authorized names, recheck
  state/process/path boundaries, execute cleanup, and verify removal and all protected locations.

## Local authorized target baseline

Root: `C:/Users/Admin/AppData/Local/codex-plusplus/store-apps`.
Current: `OpenAI.Codex_26.1103.7773.0_x64__2p2nqsd0c76g0` (keep).
Remove if still unused:

- `OpenAI.Codex_26.1023.6123.0_x64__2p2nqsd0c76g0`
- `OpenAI.Codex_26.1023.6621.0_x64__2p2nqsd0c76g0`
- `OpenAI.Codex_26.1103.3517.0_x64__2p2nqsd0c76g0`
- `OpenAI.Codex_26.1103.4239.0_x64__2p2nqsd0c76g0`

Previous measurement: 9690.62 MiB total file size. All four had no process executable/command-line references;
revalidate rather than relying on this earlier snapshot. Current state points to the kept mirror and core source
`D:/Unity/codex-plusplus/codex-plusplus` at version 1.0.9.

## Completed

Build passed; full suite: 381 tests, 372 passed, 9 platform skips, zero failures. Independent reviewer found no
material issues. All four authorized old mirrors were removed by the built core helper, with no warnings.
Current app archive hash and state bytes were unchanged; runtime, tweaks and backup remained present.
See `../validation/2026-11-10-windows-mirror-cleanup.md`. No commit, release, push or consumer pin update performed.

The user subsequently authorized publication as 1.0.10 and the same cleanup treatment for Claude++.
Release checks include final build/tests/package verification, GitHub CI and public release read-back, then
synchronization of the sgproj and unity-links consumer pins. P4 consumer edits remain pending until submitted.
