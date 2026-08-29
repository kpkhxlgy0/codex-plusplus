import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

test("active canonical bootstrap and update references use master", () => {
  const expectedByFile = new Map<string, string[]>([
    ["README.md", [
      "https://raw.githubusercontent.com/kpkhxlgy0/codex-plusplus/master/install.sh",
      "https://raw.githubusercontent.com/kpkhxlgy0/codex-plusplus/master/install.ps1",
    ]],
    ["packages/installer/README.md", [
      "https://raw.githubusercontent.com/kpkhxlgy0/codex-plusplus/master/install.sh",
    ]],
    ["docs/releases/0.1.3.md", [
      "https://raw.githubusercontent.com/kpkhxlgy0/codex-plusplus/master/install.sh",
    ]],
    ["install.sh", ['REF="${CODEX_PLUSPLUS_REF:-master}"']],
    ["install.ps1", ['$Ref = if ($env:CODEX_PLUSPLUS_REF) { $env:CODEX_PLUSPLUS_REF } else { "master" }']],
    ["update.sh", [
      "https://raw.githubusercontent.com/kpkhxlgy0/codex-plusplus/master/install.sh",
    ]],
    ["update.ps1", [
      "https://raw.githubusercontent.com/kpkhxlgy0/codex-plusplus/master/install.ps1",
    ]],
    ["packages/runtime/src/preload/settings-injector.ts", [
      'window.prompt("Git ref", config.updateRef || "master")',
    ]],
    ["packages/installer/assets/runtime/preload.js", [
      'window.prompt("Git ref", config.updateRef || "master")',
    ]],
    ["packages/installer/assets/runtime/preload/settings-injector.js", [
      'window.prompt("Git ref", config.updateRef || "master")',
    ]],
    [".github/workflows/ci.yml", ["      - master"]],
  ]);

  for (const [file, expectedReferences] of expectedByFile) {
    const source = readFileSync(resolve(repoRoot, file), "utf8");
    for (const expected of expectedReferences) {
      assert.ok(source.includes(expected), `${file} is missing ${expected}`);
    }
    assert.ok(
      !source.includes("raw.githubusercontent.com/kpkhxlgy0/codex-plusplus/main"),
      `${file} still references the non-canonical main branch`,
    );
  }

  const installSh = readFileSync(resolve(repoRoot, "install.sh"), "utf8");
  assert.ok(!installSh.includes('CODEX_PLUSPLUS_REF:-main'));
  const installPs1 = readFileSync(resolve(repoRoot, "install.ps1"), "utf8");
  assert.ok(!installPs1.includes('else { "main" }'));
  const settingsSource = readFileSync(
    resolve(repoRoot, "packages/runtime/src/preload/settings-injector.ts"),
    "utf8",
  );
  assert.ok(!settingsSource.includes('config.updateRef || "main"'));
  const workflow = readFileSync(resolve(repoRoot, ".github/workflows/ci.yml"), "utf8");
  assert.ok(!/^\s+- main$/mu.test(workflow));
});
