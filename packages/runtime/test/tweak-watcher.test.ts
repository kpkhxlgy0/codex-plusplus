import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import chokidar, { type FSWatcher } from "chokidar";
import ts from "typescript";

// Exercise the actual main-process watcher options without bootstrapping Electron.
const source = ts.createSourceFile(
  "main.ts",
  readFileSync(resolve("packages/runtime/src/main.ts"), "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
let optionsExpression: string | undefined;
function findWatcher(node: ts.Node): void {
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.expression.getText(source) === "chokidar" &&
    node.expression.name.text === "watch"
  ) {
    optionsExpression = node.arguments[1]?.getText(source);
  }
  ts.forEachChild(node, findWatcher);
}
findWatcher(source);
assert.ok(optionsExpression, "missing main-process watcher options");

type WatcherOptions = NonNullable<Parameters<typeof chokidar.watch>[1]> & {
  ignored: (path: string) => boolean;
};

function watcherOptions(tweaksDir: string): WatcherOptions {
  return runInNewContext(`(${optionsExpression})`, { TWEAKS_DIR: tweaksDir });
}

test("tweak watcher ignores only complete Git and dependency path segments on either platform", () => {
  const options = watcherOptions("C:\\Users\\example\\tweaks");
  for (const path of [
    "C:/Users/example/tweaks/linked/.git",
    "C:/Users/example/tweaks/linked/.git/index",
    "C:/Users/example/tweaks/linked/node_modules",
    "C:/Users/example/tweaks/linked/node_modules/pkg/index.js",
    "C:\\Users\\example\\tweaks\\linked\\.git\\index",
    "C:\\Users\\example\\tweaks\\linked\\node_modules\\pkg\\index.js",
    "/home/example/tweaks/linked/.git/index",
    "/home/example/tweaks/linked/node_modules/pkg/index.js",
    ".git",
    "node_modules",
  ]) {
    assert.equal(options.ignored(path), true, path);
  }
  for (const path of [
    "C:/Users/example/tweaks/linked/manifest.json",
    "C:\\Users\\example\\tweaks\\linked\\src\\index.js",
    "/home/example/tweaks/linked/.gitignore",
    "/home/example/tweaks/linked/.github/workflow.yml",
    "/home/example/tweaks/linked/git/index.js",
    "/home/example/tweaks/linked/node_modules-extra/index.js",
    "/home/example/tweaks/linked/my_node_modules/index.js",
    "/home/example/tweaks/linked/dist/index.js",
    "/home/example/tweaks/linked/.output/index.js",
  ]) {
    assert.equal(options.ignored(path), false, path);
  }
});

test("development links suppress Git and dependency changes and prune their directories", async () => {
  await withDevelopmentWatcher(async ({ watcher, sourceDir, linkDir, changes }) => {
    writeFileSync(join(sourceDir, ".git/index"), "refreshed index");
    writeFileSync(join(sourceDir, "node_modules/pkg/index.js"), "updated dependency");
    mkdirSync(join(sourceDir, "src/.git"));
    writeFileSync(join(sourceDir, "src/.git/index"), "new nested index");
    await changeFile(watcher, sourceDir, linkDir, "src/index.js");
    // Allow pending awaitWriteFinish events to surface after the observed source change.
    await delay(400);

    assert.deepEqual(changes, ["src/index.js"]);
    const watchedDirectories = Object.keys(watcher.getWatched()).map((path) =>
      relative(linkDir, path).replace(/\\/g, "/"),
    );
    assert.equal(watchedDirectories.includes(".git"), false);
    assert.equal(watchedDirectories.includes("node_modules"), false);
    assert.equal(watchedDirectories.includes("src/.git"), false);
  });
});

test("development links still report manifests, sources, dot directories, and build outputs", async () => {
  await withDevelopmentWatcher(async ({ watcher, sourceDir, linkDir, changes }) => {
    const paths = [
      "manifest.json",
      "src/index.js",
      ".gitignore",
      ".github/workflow.yml",
      "node_modules-extra/index.js",
      "dist/index.js",
      ".output/index.js",
    ];
    for (const path of paths) {
      await changeFile(watcher, sourceDir, linkDir, path);
    }

    assert.deepEqual(changes, paths);
  });
});

async function withDevelopmentWatcher(
  fn: (fixture: {
    watcher: FSWatcher;
    sourceDir: string;
    linkDir: string;
    changes: string[];
  }) => Promise<void>,
): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), "codexpp-tweak-watcher-"));
  let watcher: FSWatcher | undefined;
  try {
    const sourceDir = join(root, "source");
    const tweaksDir = join(root, "tweaks");
    const linkDir = join(tweaksDir, "linked");
    const paths = [
      ".git/index", "node_modules/pkg/index.js", "manifest.json", "src/index.js",
      ".gitignore", ".github/workflow.yml", "node_modules-extra/index.js",
      "dist/index.js", ".output/index.js",
    ];
    for (const path of paths) {
      const filename = join(sourceDir, path);
      mkdirSync(dirname(filename), { recursive: true });
      writeFileSync(filename, "initial");
    }
    mkdirSync(tweaksDir);
    symlinkSync(sourceDir, linkDir, process.platform === "win32" ? "junction" : "dir");
    const changes: string[] = [];
    watcher = chokidar.watch(tweaksDir, watcherOptions(tweaksDir));
    watcher.on("all", (_event, path) => changes.push(relative(linkDir, path).replace(/\\/g, "/")));
    await once(watcher, "ready", { signal: AbortSignal.timeout(3_000) });
    await fn({ watcher, sourceDir, linkDir, changes });
  } finally {
    await watcher?.close();
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}

async function changeFile(
  watcher: FSWatcher,
  sourceDir: string,
  linkDir: string,
  path: string,
): Promise<void> {
  await new Promise<void>((resolveChange, reject) => {
    const onChange = (_event: string, changedPath: string) => {
      if (relative(linkDir, changedPath).replace(/\\/g, "/") !== path) return;
      cleanup();
      resolveChange();
    };
    const onError = (error: unknown) => {
      cleanup();
      reject(error);
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`watcher did not report ${path}`));
    }, 3_000);
    function cleanup(): void {
      clearTimeout(timeout);
      watcher.off("all", onChange);
      watcher.off("error", onError);
    }
    watcher.on("all", onChange);
    watcher.on("error", onError);
    try {
      writeFileSync(join(sourceDir, path), "changed source");
    } catch (error) {
      onError(error);
    }
  });
}
