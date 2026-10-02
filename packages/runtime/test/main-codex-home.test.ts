import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(resolve("packages/runtime/src/main.ts"), "utf8");
const configExpression = source.match(/^const CODEX_CONFIG_FILE = (.+);$/m)?.[1];
assert.ok(configExpression, "missing Codex config path expression");

test("runtime uses CODEX_HOME for the managed MCP config", () => {
  const home = resolve("test-user-home");
  const codexHome = resolve("custom-agent-home");

  assert.equal(configPath({ CODEX_HOME: codexHome }, home), join(codexHome, "config.toml"));
});

test("runtime uses the default Codex home when CODEX_HOME is unset", () => {
  const home = resolve("test-user-home");

  assert.equal(configPath({}, home), join(home, ".codex", "config.toml"));
});

test("runtime uses the default Codex home when CODEX_HOME is empty", () => {
  const home = resolve("test-user-home");

  assert.equal(configPath({ CODEX_HOME: "" }, home), join(home, ".codex", "config.toml"));
});

function configPath(env: NodeJS.ProcessEnv, home: string): string {
  return runInNewContext(configExpression!, { join, homedir: () => home, process: { env } });
}
