import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";
import { runInContext } from "node:vm";
import { buildSync } from "esbuild";
import { JSDOM } from "jsdom";

const injectorCode = buildSync({
  entryPoints: [resolve("packages/runtime/src/preload/settings-injector.ts")],
  bundle: true,
  write: false,
  platform: "browser",
  format: "cjs",
  external: ["electron"],
}).outputFiles[0].text;

// Real DOM queries and MutationObservers; only layout, animation frames and
// Electron IPC need substitutes in Node. Each fixture gets a fresh module state.
function createInjectorFixture(wrapper = "") {
  const dom = new JSDOM(`<!doctype html><html><body>
    <section ${wrapper}>
      <nav id="sidebar" class="overflow-y-auto vertical-scroll-fade-mask">
        <div><button>General</button><button>Appearance</button><button>Git</button></div>
      </nav>
    </section>
  </body></html>`, { url: "https://codex.test/settings", runScripts: "outside-only" });
  const { window } = dom;
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return new window.DOMRect(0, 0, 300, this.id === "sidebar" ? 640 : 160);
  };
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  window.requestAnimationFrame = (callback) => { frames.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = (id) => { frames.delete(id); };
  // The initial startup poll is independent of mutation-driven reinjection.
  window.setInterval = (() => 0) as typeof window.setInterval;
  const logs: string[] = [];
  const ipcRenderer = {
    send: (_channel: string, _level: string, message: string) => logs.push(message),
    invoke: async (channel: string) => {
      if (channel === "codexpp:get-tweak-store") return { entries: [] };
      if (channel === "codexpp:check-codexpp-update") return null;
      throw new Error(`Unexpected IPC: ${channel}`);
    },
  };
  const context = dom.getInternalVMContext();
  context.module = { exports: {} };
  context.exports = context.module.exports;
  context.require = (id: string) => {
    assert.equal(id, "electron");
    return { ipcRenderer };
  };
  runInContext(injectorCode, context);
  const injector = context.module.exports;

  async function settle() {
    for (let i = 0; i < 8; i++) {
      await new Promise<void>((done) => setImmediate(done));
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback(window.performance.now());
    }
    await new Promise<void>((done) => setImmediate(done));
  }
  return { dom, window, injector, frames, logs, settle };
}

test("settings injection settles without replacing groups in a fade-mask settings scroller", async () => {
  const f = createInjectorFixture();
  try {
    const handle = f.injector.registerPage("test", { id: "test", name: "Test", version: "1.0.0" }, {
      id: "test:page", title: "Test page", render: () => {},
    });
    f.injector.startSettingsInjector();
    const nav = f.window.document.querySelector('[data-codexpp="nav-group"]');
    const pages = f.window.document.querySelector('[data-codexpp="pages-group"]');
    assert.ok(nav);
    assert.ok(pages);
    await f.settle();
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), nav);
    assert.equal(f.window.document.querySelector('[data-codexpp="pages-group"]'), pages);
    assert.equal(f.frames.size, 0, "own mutations must settle instead of scheduling an infinite loop");
    assert.equal(f.logs.filter((line) => line.includes("nav group injected")).length, 1);

    // Unrelated app mutations must preserve existing navigation.
    f.window.document.body.appendChild(f.window.document.createElement("div"));
    await f.settle();
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), nav);
    handle.unregister();
    await f.settle();
    assert.equal(f.window.document.querySelector('[data-codexpp="pages-group"]'), null);
    assert.equal(f.frames.size, 0);

    // A real native remount still needs exactly one fresh injection.
    f.window.document.getElementById("sidebar")!.innerHTML =
      "<div><button>General</button><button>Appearance</button><button>Git</button></div>";
    await f.settle();
    const remounted = f.window.document.querySelector('[data-codexpp="nav-group"]');
    assert.ok(remounted);
    assert.notEqual(remounted, nav);
    assert.equal(f.logs.filter((line) => line.includes("nav group injected")).length, 2);
    assert.equal(f.frames.size, 0);
  } catch (error) {
    throw new Error(String(error), { cause: error });
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("settings-like controls inside a composer overlay never receive injected groups", async () => {
  const f = createInjectorFixture('data-composer-overlay-floating-ui="true"');
  try {
    f.injector.startSettingsInjector();
    await f.settle();
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), null);
    assert.equal(f.frames.size, 0);
    assert.equal(f.logs.filter((line) => line.includes("nav group injected")).length, 0);
  } catch (error) {
    throw new Error(String(error), { cause: error });
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});
