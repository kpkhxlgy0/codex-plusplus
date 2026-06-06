import assert from "node:assert/strict";
import test from "node:test";
import { createTweakModuleLoader } from "../src/preload/tweak-module-loader";

test("renderer tweak module loader supports relative CommonJS files and JSON", async () => {
  const files = new Map<string, string>([
    ["/tweaks/example/index.js", `
      const message = require("./src/message");
      const config = require("./config.json");
      module.exports = {
        async start(api) {
          api.log.info(message.text + config.suffix);
        }
      };
    `],
    ["/tweaks/example/src/message.js", `exports.text = "hello";`],
    ["/tweaks/example/config.json", `{"suffix":"!"}`],
  ]);
  const logs: string[] = [];
  const loader = createTweakModuleLoader({
    manifestId: "example",
    entry: "/tweaks/example/index.js",
    dir: "/tweaks/example",
    readSource: readFrom(files),
  });

  const tweak = loader.loadEntry() as { start: (api: unknown) => Promise<void> };
  await tweak.start({ log: { info: (message: string) => logs.push(message) } });

  assert.deepEqual(logs, ["hello!"]);
});

test("renderer tweak module loader supports directory index resolution and module caching", () => {
  const files = new Map<string, string>([
    ["/tweaks/example/index.js", `
      const first = require("./lib");
      const second = require("./lib/index");
      module.exports = { value: first.next() + second.next() };
    `],
    ["/tweaks/example/lib/index.js", `
      let count = 0;
      exports.next = () => {
        count += 1;
        return count;
      };
    `],
  ]);
  const loader = createTweakModuleLoader({
    manifestId: "example",
    entry: "/tweaks/example/index.js",
    dir: "/tweaks/example",
    readSource: readFrom(files),
  });

  assert.deepEqual(loader.loadEntry(), { value: 3 });
});

test("renderer tweak module loader blocks relative traversal outside the tweak", () => {
  const files = new Map<string, string>([
    ["/tweaks/example/index.js", `module.exports = require("../other/secret");`],
    ["/tweaks/other/secret.js", `module.exports = "secret";`],
  ]);
  const loader = createTweakModuleLoader({
    manifestId: "example",
    entry: "/tweaks/example/index.js",
    dir: "/tweaks/example",
    readSource: readFrom(files),
  });

  assert.throws(() => loader.loadEntry(), /path outside tweak dir|path traversal/);
});

test("renderer tweak module loader falls back for non-relative require requests", () => {
  const files = new Map<string, string>([
    ["/tweaks/example/index.js", `module.exports = require("electron");`],
  ]);
  const loader = createTweakModuleLoader({
    manifestId: "example",
    entry: "/tweaks/example/index.js",
    dir: "/tweaks/example",
    readSource: readFrom(files),
    fallbackRequire: (request) => ({ request }),
  });

  assert.deepEqual(loader.loadEntry(), { request: "electron" });
});

function readFrom(files: Map<string, string>): (filename: string) => string {
  return (filename: string) => {
    const normalized = filename.replace(/\\/g, "/");
    const source = files.get(normalized);
    if (source === undefined) throw new Error(`missing file: ${filename}`);
    return source;
  };
}
