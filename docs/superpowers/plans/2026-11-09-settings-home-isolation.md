# Keep Codex++ navigation inside Settings

Approved behavior: the home page must not receive Codex++ settings groups even when chat titles contain settings
labels. Leaving Settings removes injected navigation/panels and restores native content. Existing Settings pages,
registered Tweak pages, and native selection restoration continue to work.

## Tasks

1. Tighten `settings-dom-heuristics.ts` without changing its exports. Match complete normalized native control labels;
   ignore injected and hidden controls. Reject the main sidebar and its nested chat-list candidates while allowing a
   separate Settings navigation region. Verify real DOM counterexamples before and after the change.
2. Update `settings-injector.ts` lifecycle. Mark Settings visible only after its injection root is accepted. Clear
   stale groups, panels, listeners and registered page resources when that surface is lost; keep native content/style
   restoration intact. Global page text must not keep an absent Settings surface active.
3. Run focused regression tests and the repository suite, build the Runtime, and request independent review. Do not
   publish or restart the running Codex app as part of this fix.

## Review focus

- Main navigation with exact or substring-like Settings titles, including nested and hidden title lists.
- A real Settings nav alongside a separate main sidebar.
- Route changes and DOM reuse after an active built-in or Tweak page.
- Cleanup removes only Codex++ Settings UI and restores native display/selection.
- Unrelated DOM mutations do not cause repeated remounts or update requests.

## Verification

- Focused heuristic/injector tests: 55 passed. The new predicate and lifecycle regressions failed before their fixes.
- `npm test`: 332 tests, 324 passed, 8 platform-related skips, no failures.
- `npm run build --workspace @codex-plusplus/runtime` and `git diff --check` passed.
- Independent review found and verified the fix for a hide-debounce path that checked only the items group instead
  of its rejected outer root. No material findings remained after its transition regression passed.
- Automatic staging of the built preload was initially blocked by tool policy before execution. The user then ran
  the normal local installer and confirmed that the home-page injection problem was fixed. No additional live GUI
  operation was needed for release preparation.
- The user subsequently authorized publishing version 1.0.9. The coordinated manifests, lockfile entries, source
  constants, and generated runtime report 1.0.9. The final full build passed; the final suite had 332 tests, 324
  passed, 8 platform skips, and no failures.
- `npm pack --workspace packages/installer --pack-destination build --json` produced
  `build/codex-plusplus-1.0.9.tgz`. Package version, CLI entry point, loader, and Settings runtime bytes match the
  final build. The tarball is local validation output; the existing GitHub release convention uses source archives.
