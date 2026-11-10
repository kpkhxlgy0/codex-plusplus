# Windows Store mirror cleanup after successful upgrades

The user explicitly requested automatic cleanup in Codex++ core after successful upgrades, retaining the current
version and directories still in use. They also authorized deleting the four previously identified unused local
mirrors. Work remains in the existing canonical checkout; no new release, push or consumer pin change is requested.

## Behavior

- After successful installation/patching and state persistence, clean obsolete Windows Store mirrors. Successful
  intact-patch/runtime repair also uses this path, so native update and watcher repair cannot bypass cleanup.
- Confine deletion to recognized, strictly older `OpenAI.Codex_<version>_<arch>__<publisher>` immediate children of
  `%LOCALAPPDATA%/codex-plusplus/store-apps`, in the same package family/architecture as the current mirror.
  Keep the current mirror, newer/staged versions, unrelated folders, other families, and standalone installations.
- Verify the persisted state still selects the successful current app. Recheck it before each deletion, protecting
  concurrent updates. The current directory must exist and match the intended managed path.
- Obtain a successful native process snapshot immediately before cleanup. Preserve targets referenced by process
  executable paths or command lines; unknown relevant process locations or query failures skip deletion.
  The protected `codex-windows-sandbox-service.exe` is a narrowly verified exception: a unique running SCM record
  with matching PID/name and an EXE-only path must exactly match the registered OpenAI.Codex Appx binary, outside
  the managed mirror root and without reparse points. Other inaccessible processes remain fail-closed.
- Use native PowerShell filesystem operations end-to-end. Validate canonical absolute target/parent boundaries,
  reject reparse points/unsafe path spellings, and skip trees with reparse descendants. Never stop processes,
  remove runtime/backup/tweaks, widen scope, or retry a refused deletion through another tool.
- Cleanup is best effort: report skipped/error outcomes, preserve the successful upgrade result, and keep partial
  failure visible. Use `Remove-Item -LiteralPath` without `-Force`.
- No retention settings or new user-facing command are needed. A bounded dry-run result is available internally for
  fixture validation and for reviewing the exact local targets before the authorized cleanup.

## Validation

Use test-first coverage for current/in-use/newer/unrecognized/family-mismatched targets, exact path boundaries,
state changes, process-query failures, reparse points and native deletion failure. Integration coverage must prove
successful repair calls cleanup, and failed installation does not remove old mirrors. Native filesystem cases use
OS temporary fixtures only. Run relevant tests, full core suite/build and independent review before real cleanup.
Revalidate the four real targets and running processes immediately before deletion, then verify current app/state,
running processes and retained backup/runtime remain intact. Record removed paths and measured size.
