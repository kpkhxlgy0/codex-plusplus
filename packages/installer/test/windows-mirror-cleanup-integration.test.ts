import assert from "node:assert/strict";
import asar from "@electron/asar";
import childProcess from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { syncBuiltinESMExports } from "node:module";
import test, { mock } from "node:test";
import { readHeaderHash } from "../src/asar";
import { install } from "../src/commands/install";
import { repair } from "../src/commands/repair";
import { CODEX_PLUSPLUS_VERSION } from "../src/version";

const windowsOnly = { skip: process.platform !== "win32" };
const currentPackage = "OpenAI.Codex_26.1103.7773.0_x64__2p2nqsd0c76g0";
const oldPackage = "OpenAI.Codex_26.1103.4239.0_x64__2p2nqsd0c76g0";

async function fixture(fn: (value: {
  appRoot: string; oldRoot: string; userRoot: string; stateFile: string; archive: string;
}) => Promise<void>) {
  const root = mkdtempSync(join(tmpdir(), "codexpp-prune-integration-"));
  const overrides = { CODEX_PLUSPLUS_HOME: join(root, "user data"), LOCALAPPDATA: join(root, "local"),
    APPDATA: join(root, "roaming"), USERPROFILE: join(root, "home") };
  const previous = Object.fromEntries(Object.keys(overrides).map(key => [key, process.env[key]]));
  Object.assign(process.env, overrides);
  const nativeExec = childProcess.execFileSync;
  const processQuery = mock.method(childProcess, "execFileSync", ((...args: unknown[]) => {
    const command = args[1];
    if (args[0] === "powershell.exe" && Array.isArray(command)) {
      const position = command.indexOf("-EncodedCommand") + 1;
      if (position > 0 && typeof command[position] === "string") {
        const script = Buffer.from(command[position], "base64").toString("utf16le");
        if (script.includes("function Invoke-MirrorCleanup {")) {
          // 只隔离进程清单；成功路径仍通过原生 PowerShell 删除真实临时镜像。
          const inventory = "function Get-CimInstance { param([string] $ClassName) "
            + "if ($ClassName -eq 'Win32_Process') { return @() }; throw 'Unexpected query' }\n";
          const isolated = [...command];
          isolated[position] = Buffer.from(inventory + script, "utf16le").toString("base64");
          args[1] = isolated;
        }
      }
    }
    return Reflect.apply(nativeExec, childProcess, args);
  }) as typeof childProcess.execFileSync);
  syncBuiltinESMExports();
  try {
    const storeRoot = join(overrides.LOCALAPPDATA, "codex-plusplus", "store-apps");
    const appRoot = join(storeRoot, currentPackage, "app"), oldRoot = join(storeRoot, oldPackage);
    const userRoot = overrides.CODEX_PLUSPLUS_HOME, stateFile = join(userRoot, "state.json");
    const source = join(root, "asar source"), archive = join(appRoot, "resources", "app.asar");
    mkdirSync(dirname(archive), { recursive: true });
    mkdirSync(join(oldRoot, "app"), { recursive: true });
    mkdirSync(userRoot, { recursive: true });
    mkdirSync(source);
    writeFileSync(join(source, "package.json"), JSON.stringify({ main: "main.js" }));
    writeFileSync(join(source, "main.js"), "module.exports = {};\n");
    await asar.createPackage(source, archive);
    writeFileSync(join(appRoot, "ChatGPT.exe"), "fixture executable");
    writeFileSync(join(appRoot, "chrome.dll"), Buffer.concat([
      Buffer.from("MZdL7pKGdnNz796PbbjQWNKmHXBZaB9tsX"), Buffer.from([1, 8]), Buffer.from("00000000"),
    ]));
    writeFileSync(join(oldRoot, "app", "keep.txt"), "old mirror");
    writeFileSync(stateFile, JSON.stringify({ appRoot, version: CODEX_PLUSPLUS_VERSION,
      patchedAsarHash: readHeaderHash(archive).headerHash, watcher: "none", fuseFlipped: false, resigned: false }));
    await fn({ appRoot, oldRoot, userRoot, stateFile, archive });
  } finally {
    processQuery.mock.restore();
    syncBuiltinESMExports();
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    rmSync(root, { recursive: true, force: true });
  }
}

for (const mode of ["intact", "runtime", "version-upgrade", "moved-current"])
test(`successful ${mode} repair cleans older mirrors after persisting the selected app`, windowsOnly, async () => {
  await fixture(async ({ appRoot, oldRoot, stateFile, archive }) => {
    const state = JSON.parse(readFileSync(stateFile, "utf8"));
    if (mode === "version-upgrade") state.version = "0.0.1";
    if (mode === "moved-current") state.appRoot = join(oldRoot, "app");
    writeFileSync(stateFile, JSON.stringify(state));
    const before = readFileSync(archive);
    await repair({ app: appRoot, quiet: true, runtime: mode === "runtime" });
    assert.equal(existsSync(oldRoot), false, "successful repair should remove the unused old mirror");
    assert.ok(existsSync(appRoot));
    assert.deepEqual(readFileSync(archive), before, "cleanup must not modify the current app");
    assert.equal(JSON.parse(readFileSync(stateFile, "utf8")).appRoot, appRoot);
  });
});

test("disabled runtime upgrade preserves old mirrors without a successful state transition", windowsOnly, async () => {
  await fixture(async ({ appRoot, oldRoot, userRoot, stateFile }) => {
    const state = JSON.parse(readFileSync(stateFile, "utf8"));
    state.version = "0.0.1";
    writeFileSync(stateFile, JSON.stringify(state));
    writeFileSync(join(userRoot, "config.json"), JSON.stringify({ codexPlusPlus: { autoUpdate: false } }));
    await repair({ app: appRoot, quiet: true });
    assert.equal(readFileSync(join(oldRoot, "app", "keep.txt"), "utf8"), "old mirror");
    assert.deepEqual(JSON.parse(readFileSync(stateFile, "utf8")), state);
  });
});

test("failed install preflight preserves old mirrors and the previous state", windowsOnly, async () => {
  await fixture(async ({ appRoot, oldRoot, stateFile, archive }) => {
    const before = readFileSync(stateFile);
    unlinkSync(archive);
    mkdirSync(archive);
    await assert.rejects(install({ app: appRoot, fuse: false, resign: false, quiet: true }));
    assert.equal(readFileSync(join(oldRoot, "app", "keep.txt"), "utf8"), "old mirror");
    assert.deepEqual(readFileSync(stateFile), before);
  });
});
