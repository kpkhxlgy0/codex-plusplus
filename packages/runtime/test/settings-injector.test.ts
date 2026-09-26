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
function createInjectorFixture(
  wrapper = "",
  layout: "empty" | "modern" | "legacy" = "empty",
  mainWidth = 700,
) {
  const nativeContent = `<div id="native-general" style="display:flex">Native General</div>`;
  const content = layout === "modern"
    ? `<div id="background" aria-hidden="true" style="position:absolute">Decorative PageSurface</div>
       <div id="left-panel"><nav id="sidebar" class="overflow-y-auto vertical-scroll-fade-mask">
         <div><button>General</button><button>Appearance</button><button>Git</button></div>
       </nav></div>
       <main data-app-shell-main-surface="default"><div id="main-content" data-app-shell-focus-area="main">
         ${nativeContent}
       </div></main>`
    : `<nav id="sidebar" class="overflow-y-auto vertical-scroll-fade-mask">
         <div><button>General</button><button>Appearance</button><button>Git</button></div>
       </nav>${layout === "legacy" ? `<div id="main-content">${nativeContent}</div>` : ""}`;
  const dom = new JSDOM(`<!doctype html><html><body>
    <section ${wrapper}>${content}</section>
  </body></html>`, { url: "https://codex.test/settings", runScripts: "outside-only" });
  const { window } = dom;
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    const width = this.id === "background" ? 900 : this.id === "main-content" ? mainWidth :
      this.id === "sidebar" ? 300 : 700;
    return new window.DOMRect(0, 0, width, this.id === "sidebar" ? 640 : 400);
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

test("Config mounts inside the visible main focus area instead of the decorative PageSurface", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    const mainContent = f.window.document.getElementById("main-content")!;
    const nativeGeneral = f.window.document.getElementById("native-general")!;
    const background = f.window.document.getElementById("background")!;
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    const panel = f.window.document.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!;
    assert.equal(panel.parentElement, mainContent);
    assert.equal(nativeGeneral.style.display, "none");
    assert.equal(background.querySelector('[data-codexpp="tweaks-panel"]'), null);
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("all built-in and registered pages reuse the visible host and restore native display", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.registerPage("test", { id: "test", name: "Test", version: "1.0.0" }, {
      id: "test:page", title: "Test page", render: (root: HTMLElement) => { root.textContent = "Test content"; },
    });
    f.injector.startSettingsInjector();
    const mainContent = f.window.document.getElementById("main-content")!;
    const nativeGeneral = f.window.document.getElementById("native-general")!;
    const background = f.window.document.getElementById("background")!;
    const sidebar = f.window.document.getElementById("sidebar")!;
    const activeHandlers = new Set<EventListenerOrEventListenerObject>();
    const add = sidebar.addEventListener.bind(sidebar);
    const remove = sidebar.removeEventListener.bind(sidebar);
    sidebar.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean) => {
      if (type === "click" && options === true) activeHandlers.add(listener);
      add(type, listener, options);
    }) as typeof sidebar.addEventListener;
    sidebar.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean) => {
      if (type === "click" && options === true) activeHandlers.delete(listener);
      remove(type, listener, options);
    }) as typeof sidebar.removeEventListener;

    for (const selector of ["nav-config", "nav-tweaks", "nav-tweak store", "nav-page-test:page", "nav-config"]) {
      f.window.document.querySelector<HTMLButtonElement>(`[data-codexpp="${selector}"]`)!.click();
      const panels = f.window.document.querySelectorAll('[data-codexpp="tweaks-panel"]');
      assert.equal(panels.length, 1);
      assert.equal(panels[0]!.parentElement, mainContent);
      assert.equal(nativeGeneral.style.display, "none");
      assert.equal(background.querySelector('[data-codexpp="tweaks-panel"]'), null);
      assert.equal(activeHandlers.size, 1);
    }
    const restoresBefore = f.logs.filter((line) => line.includes("restore codex view")).length;
    sidebar.querySelector<HTMLButtonElement>("button")!.click();
    assert.equal(nativeGeneral.style.display, "flex");
    assert.equal(mainContent.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!.style.display, "none");
    assert.equal(activeHandlers.size, 0);
    assert.equal(f.logs.filter((line) => line.includes("restore codex view")).length, restoresBefore + 1);
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("modern main focus area can be narrower than 300 pixels", async () => {
  const f = createInjectorFixture("", "modern", 240);
  try {
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]')!.parentElement,
      f.window.document.getElementById("main-content"));
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("legacy settings layout still mounts in its single visible content sibling", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]')!.parentElement,
      f.window.document.getElementById("main-content"));
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("invalid or ambiguous native main areas leave General visible and report the rejection", async () => {
  for (const invalid of ["hidden", "inert", "missing", "ambiguous"] as const) {
    const f = createInjectorFixture("", "modern");
    try {
      const main = f.window.document.getElementById("main-content")!;
      if (invalid === "hidden") main.setAttribute("aria-hidden", "true");
      if (invalid === "inert") main.setAttribute("inert", "");
      if (invalid === "missing") main.removeAttribute("data-app-shell-focus-area");
      if (invalid === "ambiguous") {
        const duplicate = main.cloneNode(true) as HTMLElement;
        duplicate.id = "duplicate-main";
        main.parentElement!.appendChild(duplicate);
      }
      f.injector.startSettingsInjector();
      f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
      assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]'), null, invalid);
      assert.equal(f.window.document.getElementById("native-general")!.style.display, "flex", invalid);
      assert.ok(f.logs.some((line) => line.includes("content area") && line.includes("rejected")), invalid);
    } finally {
      await new Promise<void>((done) => setImmediate(done));
      f.dom.window.close();
    }
  }
});

test("a host that becomes invalid during an active page immediately restores native settings", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    const main = f.window.document.getElementById("main-content")!;
    const nativeGeneral = f.window.document.getElementById("native-general")!;
    main.setAttribute("inert", "");
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-tweaks"]')!.click();
    assert.equal(nativeGeneral.style.display, "flex");
    assert.equal(main.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!.style.display, "none");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("an ambiguous legacy row never hides native settings", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    const second = f.window.document.createElement("div");
    second.id = "second-content";
    f.window.document.querySelector("section")!.appendChild(second);
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]'), null);
    assert.equal(f.window.document.getElementById("native-general")!.style.display, "flex");
    assert.ok(f.logs.some((line) => line.includes("ambiguous legacy siblings")));
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("legacy fallback does not escape a settings row with only decorative content", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    const row = f.window.document.querySelector("section")!;
    const app = f.window.document.createElement("div");
    app.id = "app-shell";
    row.parentElement!.appendChild(app);
    app.appendChild(row);
    const unrelated = f.window.document.createElement("div");
    unrelated.id = "unrelated-app-content";
    app.appendChild(unrelated);
    const main = f.window.document.getElementById("main-content")!;
    main.setAttribute("aria-hidden", "true");
    main.style.position = "absolute";
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]'), null);
    assert.equal(f.window.document.getElementById("native-general")!.style.display, "flex");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("closing and reopening settings clears stale panel and restore listener", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    const row = f.window.document.querySelector("section")!;
    const cleanMarkup = row.innerHTML;
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    const oldGeneral = f.window.document.getElementById("native-general")!;
    const oldPanel = f.window.document.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!;
    row.innerHTML = cleanMarkup;
    await f.settle();
    assert.equal(oldGeneral.style.display, "flex");
    assert.equal(oldPanel.style.display, "none");
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]'), null);
    const newGeneral = f.window.document.getElementById("native-general")!;
    assert.equal(newGeneral.style.display, "flex");
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(f.window.document.querySelectorAll('[data-codexpp="tweaks-panel"]').length, 1);
    const restoresBefore = f.logs.filter((line) => line.includes("restore codex view")).length;
    f.window.document.getElementById("sidebar")!.querySelector<HTMLButtonElement>("button")!.click();
    assert.equal(newGeneral.style.display, "flex");
    assert.equal(f.logs.filter((line) => line.includes("restore codex view")).length, restoresBefore + 1);
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("replacing the native content host restores the old display and allows one new panel", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    const oldMain = f.window.document.getElementById("main-content")!;
    const oldGeneral = f.window.document.getElementById("native-general")!;
    const replacement = oldMain.cloneNode(false) as HTMLElement;
    replacement.id = "main-content";
    replacement.innerHTML = '<div id="new-general" style="display:grid">New General</div>';
    oldMain.replaceWith(replacement);
    await f.settle();
    assert.equal(oldGeneral.style.display, "flex");
    assert.equal(replacement.querySelector('[data-codexpp="tweaks-panel"]'), null);
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-tweaks"]')!.click();
    assert.equal(replacement.querySelectorAll('[data-codexpp="tweaks-panel"]').length, 1);
    f.window.document.getElementById("sidebar")!.querySelector<HTMLButtonElement>("button")!.click();
    assert.equal(f.window.document.getElementById("new-general")!.style.display, "grid");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

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
