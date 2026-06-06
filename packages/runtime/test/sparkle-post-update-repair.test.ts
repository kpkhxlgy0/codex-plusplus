import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

function functionBody(name: string): string {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1);
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

test("Sparkle update prep starts a Codex-owned post-update repair monitor", () => {
  const monitor = functionBody("startPostUpdateRepairMonitor");

  assert.match(source, /const CODEX_PLUSPLUS_CLI_SHIM = join\(userRoot, "bin"/);
  assert.match(source, /writeFileSync\(UPDATE_MODE_FILE, JSON\.stringify\(mode, null, 2\)\);\n\s+startPostUpdateRepairMonitor\(\);/);
  assert.match(monitor, /spawn\("\/bin\/sh", \["-c", `\$\{postUpdateRepairScript\(\)\}/);
  assert.doesNotMatch(monitor, /launchctl/);
});

test("post-update repair monitor retries quiet local repair until doctor passes", () => {
  const script = functionBody("postUpdateRepairScript");

  assert.match(script, /"CODEX_PLUSPLUS_WATCHER=1"/);
  assert.match(script, /"repair",\n\s+"--watcher",\n\s+"--quiet",\n\s+"--local"/);
  assert.match(script, /doctor >\/dev\/null 2>&1/);
  assert.match(script, /deadline=\$\(\( \$\(date \+%s\) \+ 900 \)\)/);
  assert.match(script, /Codex\+\+ post-update repair completed/);
});
