# Windows mirror cleanup validation

The user authorized automatic post-upgrade cleanup in Codex++ core and removal of four known local old mirrors.
The work was performed in the canonical source checkout at base 85a304d6839e703de0d1f861a5f403df13b022b8.

## Code and tests

- A separate native cleanup helper validates the managed root, current state, package family/architecture/version,
  process references and reparse boundaries. It rechecks state and directory contents after process inspection.
- Install invokes cleanup only after successful state persistence. Intact-patch and runtime repairs also invoke it
  after success; paused/disabled/failing paths preserve old mirrors. Repair persists the actual selected app root.
- Native deletion uses PowerShell end-to-end, `Remove-Item -LiteralPath -Recurse`, without Force or process stops.
- Genuine test-first failures were observed for missing cleanup, inaccessible ChatGPT process metadata and a
  junction inserted during process inspection. These cases are now covered and pass.
- Real CIM omitted the protected Codex sandbox service's image/command line. A limited-process image query was
  denied, so no privilege change was attempted. The narrow exception requires a unique running SCM service with
  matching PID/name, quoted EXE-only configuration, and the exact registered Appx binary outside managed mirrors.
  Tests reject mismatched service/PID/path/package, argument-bearing configuration and reparse-backed binaries.
- Integration tests perform real PowerShell deletions in native Temp fixtures. Only their process-query boundary
  is isolated, to prevent unrelated transient host processes from making successful-fixture tests nondeterministic.
  The separate native helper suite tests unknown/in-use process handling directly.
- An existing watcher fixture required the new helper dependency; it now also asserts persisted state precedes
  cleanup. No production behavior was weakened to satisfy tests.

Validation:

- Helper tests: 42 passed, 1 non-Windows path skip.
- Integration tests: 6 passed, covering four successful repair paths, disabled update and failed preflight.
- Watcher tests: 12 passed.
- `npm run build`: passed.
- `npm test`: 381 total, 372 passed, 9 platform skips, 0 failed/canceled.
- TypeScript check and `git diff --check`: passed.
- Independent review: no material findings in deletion boundaries, state/process checks, the service exception,
  successful-install ordering or test isolation/restoration.

The build's missing macOS native-host notice is expected on Windows. The existing tsx loader emits a Node
`module.register()` deprecation warning; this change does not alter those dependencies.

## Real cleanup

The built installer helper's dry run selected exactly these immediate children under
`C:/Users/Admin/AppData/Local/codex-plusplus/store-apps`:

- `OpenAI.Codex_26.1023.6123.0_x64__2p2nqsd0c76g0`
- `OpenAI.Codex_26.1023.6621.0_x64__2p2nqsd0c76g0`
- `OpenAI.Codex_26.1103.3517.0_x64__2p2nqsd0c76g0`
- `OpenAI.Codex_26.1103.4239.0_x64__2p2nqsd0c76g0`

The actual cleanup removed all four with an empty warnings array. Their earlier measured total file size was
9690.62 MiB (about 9.46 GiB); this is a file-size measure, not an exclusive measurement of free-space change.
`OpenAI.Codex_26.1103.7773.0_x64__2p2nqsd0c76g0` was retained. The current app.asar SHA256 and state.json bytes
matched before/after, and Roaming runtime/tweaks/backup remained present. No real install, patch, restart or GUI
operation was performed.

Cleanup retains the small unavoidable interval between the final state/process/filesystem checks and deletion.
Native errors or the bounded subprocess timeout can leave a partially removed old mirror; they are reported and
do not undo a successful upgrade. The actual authorized cleanup completed without either condition.

No release, Git push or consumer version update was requested or performed. Temporary validation logs and the
one-shot local invocation script are removed after recording these results.
