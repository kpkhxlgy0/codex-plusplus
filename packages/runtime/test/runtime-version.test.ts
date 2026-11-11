import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire, isBuiltin } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";

const expectedVersion = JSON.parse(
  readFileSync(new URL("../../installer/package.json", import.meta.url), "utf8"),
).version;
const require = createRequire(import.meta.url);

test("bundled runtime uses the published package version without repository files", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "codexpp-runtime-version-"));
  const runtimeDir = join(root, "runtime");
  mkdirSync(runtimeDir);
  const app = Object.assign(new EventEmitter(), {
    whenReady: () => new Promise(() => {}),
    isReady: () => false,
  });
  t.after(async () => {
    await Promise.all(app.listeners("will-quit").map((listener) => listener()));
    rmSync(root, { recursive: true, force: true });
  });

  const bundled = await build({
    entryPoints: [fileURLToPath(new URL("../src/main.ts", import.meta.url))],
    bundle: true,
    write: false,
    platform: "node",
    target: "node20",
    format: "cjs",
    external: ["electron"],
  });
  const handlers = new Map<string, (...args: any[]) => any>();
  const ipcMain = Object.assign(new EventEmitter(), {
    handle: (channel: string, listener: (...args: any[]) => any) => handlers.set(channel, listener),
  });
  const requests: Array<{ url: string; userAgent: string }> = [];
  const sandboxProcess = Object.assign(Object.create(process), {
    env: {
      CODEX_PLUSPLUS_USER_ROOT: root,
      CODEX_PLUSPLUS_RUNTIME: runtimeDir,
      CODEX_HOME: join(root, "codex-home"),
    },
    cwd: () => root,
    on: () => {},
  });
  runInNewContext(bundled.outputFiles[0].text, {
    require: (id: string) => {
      if (id === "electron") return { app, ipcMain };
      assert.ok(isBuiltin(id), `runtime bundle requested an external file: ${id}`);
      if (id === "node:os") return { ...require(id), homedir: () => root };
      // Keep the macOS Sparkle hook confined to this VM.
      if (id === "node:module") return { ...require(id), _load: undefined };
      return require(id);
    },
    module: { exports: {} },
    exports: {},
    __dirname: runtimeDir,
    __filename: join(runtimeDir, "main.js"),
    process: sandboxProcess,
    console,
    Buffer,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url: string, options: { headers: Record<string, string> }) => {
      requests.push({ url, userAgent: options.headers["User-Agent"] });
      const body = url.includes("api.github.com")
        ? { tag_name: `v${expectedVersion}`, html_url: "https://example.test/release" }
        : {
          schemaVersion: 1,
          entries: [{
            repo: "example/version-test",
            approvedCommitSha: "a".repeat(40),
            manifest: {
              id: "version-test",
              name: "Version test",
              version: "0.0.1",
              githubRepo: "example/version-test",
              minRuntime: expectedVersion,
            },
          }],
        };
      return { ok: true, status: 200, json: async () => body };
    },
  });

  await t.test("settings reports the canonical version", () => {
    assert.equal(handlers.get("codexpp:get-config")!().version, expectedVersion);
  });
  await t.test("the current release does not appear as an available update", async () => {
    const result = await handlers.get("codexpp:check-codexpp-update")!(null, true);
    assert.equal(result.currentVersion, expectedVersion);
    assert.equal(result.updateAvailable, false);
    assert.equal(requests.at(-1)!.userAgent, `codex-plusplus/${expectedVersion}`);
  });
  await t.test("a tweak requiring this release is compatible", async () => {
    const result = await handlers.get("codexpp:get-tweak-store")!();
    assert.equal(result.entries[0].runtime.current, expectedVersion);
    assert.equal(result.entries[0].runtime.compatible, true);
    assert.equal(requests.at(-1)!.userAgent, `codex-plusplus/${expectedVersion}`);
  });
});
