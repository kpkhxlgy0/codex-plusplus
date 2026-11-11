import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";
import { CODEX_PLUSPLUS_VERSION } from "../src/version";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const rootPackage = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const canonicalPackage = JSON.parse(readFileSync(join(repoRoot, "packages/installer/package.json"), "utf8"));
const workspaceNames = readdirSync(join(repoRoot, "packages"))
  .filter((name) => existsSync(join(repoRoot, "packages", name, "package.json")));

function tempDir(t: TestContext): string {
  const root = mkdtempSync(join(tmpdir(), "codexpp-package-version-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test("installer source version matches the published package metadata", () => {
  assert.equal(CODEX_PLUSPLUS_VERSION, canonicalPackage.version);
});

test("published installer reads its own package version outside the repository", async (t) => {
  const root = tempDir(t);
  const expectedVersion = `${canonicalPackage.version}-metadata-test`;
  writeFileSync(join(root, "package.json"), JSON.stringify({ type: "module", version: expectedVersion }));
  mkdirSync(join(root, "dist"));
  const compiled = await transform(readFileSync(join(repoRoot, "packages/installer/src/version.ts"), "utf8"), {
    loader: "ts",
    format: "esm",
    target: "node20",
  });
  const versionFile = join(root, "dist/version.js");
  writeFileSync(versionFile, compiled.code);
  const result = spawnSync(process.execPath, [
    "--input-type=module", "--eval",
    `import(${JSON.stringify(pathToFileURL(versionFile).href)}).then(m => console.log(m.CODEX_PLUSPLUS_VERSION))`,
  ], { cwd: tmpdir(), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), expectedVersion);
});

test("root build stops before workspace builds when package versions drift", (t) => {
  const root = tempDir(t);
  const driftedVersion = `${canonicalPackage.version}-drift`;
  writeFileSync(join(root, "package.json"), JSON.stringify({
    ...rootPackage,
    version: driftedVersion,
    scripts: { build: rootPackage.scripts.build },
  }));
  for (const name of workspaceNames) {
    const packageDir = join(root, "packages", name);
    mkdirSync(packageDir, { recursive: true });
    const metadata = JSON.parse(readFileSync(join(repoRoot, "packages", name, "package.json"), "utf8"));
    writeFileSync(join(packageDir, "package.json"), JSON.stringify({
      name: metadata.name,
      version: name === "installer" ? canonicalPackage.version : driftedVersion,
      scripts: { build: 'node -e "console.log(\'WORKSPACE_BUILD_STARTED\')"' },
    }));
  }
  const checker = join(repoRoot, "scripts/check-versions.mjs");
  if (existsSync(checker)) {
    mkdirSync(join(root, "scripts"));
    cpSync(checker, join(root, "scripts/check-versions.mjs"));
  }
  // These are inert manifest fixtures, with no app code or dependency tree.
  const options = { cwd: root, encoding: "utf8" as const };
  const result = process.platform === "win32"
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm run build"], options)
    : spawnSync("npm", ["run", "build"], options);
  const output = result.stdout + result.stderr;
  assert.notEqual(result.status, 0, "build accepted inconsistent package versions");
  for (const file of ["package.json", ...workspaceNames
    .filter((name) => name !== "installer")
    .map((name) => `packages/${name}/package.json`)]) {
    assert.ok(output.includes(`${file} version`), output);
  }
  assert.ok(output.includes(canonicalPackage.version), output);
  assert.doesNotMatch(output, /WORKSPACE_BUILD_STARTED/);
});
