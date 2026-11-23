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

// Real DOM queries and MutationObservers; each fixture gets a fresh module state.
function createInjectorFixture(
  wrapper = "",
  layout: "empty" | "modern" | "legacy" | "dialog" = "empty",
  mainWidth = 700,
  invokeOverride?: (channel: string, ...args: unknown[]) => Promise<unknown>,
) {
  const nativeContent = `<div id="native-general" style="display:flex">Native General</div>`;
  const sidebarButtons = layout === "modern" || layout === "dialog"
    ? `<button id="native-general-nav" class="sidebar-item bg-primary-ghost-hover" aria-current="page">
         <div class="text-emphasis"><span class="text-codex-icon-active"></span><span>General</span></div>
       </button>
       <button class="sidebar-item hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover">
         <div class="text-default"><span></span><span>Appearance</span></div>
       </button><button>Git</button>`
    : `<button>General</button><button>Appearance</button><button>Git</button>`;
  const content = layout === "modern"
    ? `<div id="background" aria-hidden="true" style="position:absolute">Decorative PageSurface</div>
       <div id="left-panel"><nav id="sidebar" class="overflow-y-auto vertical-scroll-fade-mask">
         <div>${sidebarButtons}</div>
       </nav></div>
       <main data-app-shell-main-surface="default"><div id="main-content" data-app-shell-focus-area="main">
         ${nativeContent}
       </div></main>`
    : layout === "dialog"
      ? `<div class="flex min-h-0 flex-1">
         <div class="settings-dialog-sidebar"><nav aria-label="Settings"><div class="flex flex-col">
           <header>Settings</header>
           <div id="sidebar" class="settings-dialog-nav-list overflow-y-auto" data-settings-nav-scroll-container>
             <div>${sidebarButtons}</div>
             <div class="text-token-text-secondary">Integrations</div>
           </div>
         </div></nav></div>
         <div id="main-content" data-settings-panel>
           <div id="native-general" class="settings-dialog-content" style="display:flex">Native General</div>
         </div>
       </div>`
      : `<nav id="sidebar" class="overflow-y-auto vertical-scroll-fade-mask">
         <div>${sidebarButtons}</div>
       </nav>${layout === "legacy" ? `<div id="main-content">${nativeContent}</div>` : ""}`;
  const dom = new JSDOM(`<!doctype html><html><head><style>
    .sidebar-item { background-color: transparent; }
    .bg-primary-ghost-hover { background-color: rgb(20, 40, 60); }
    .text-default { color: rgb(40, 40, 40); }
    .text-emphasis { color: rgb(255, 255, 255); }
    .text-codex-icon-active { color: rgb(0, 120, 255); }
    .bg-chart-blue { background-color: rgb(0, 100, 255); }
    [class~="bg-text/10"] { background-color: rgba(40, 40, 40, 0.1); }
    .bg-control-thumb-on-accent { background-color: rgb(255, 255, 255); }
    .border-control-thumb-on-accent { border-color: rgb(255, 255, 255); }
    .h-5 { height: 20px; } .w-8 { width: 32px; }
    .h-4 { height: 16px; } .w-4 { width: 16px; }
  </style></head><body>
    ${layout === "dialog" ? `<div id="root"><section data-app-shell-workspace-row="true">
      <nav><button>New chat</button><button>Search</button></nav>
      <main data-app-shell-main-surface="default"><div id="home-content" data-app-shell-focus-area="main"
        data-settings-panel><div class="settings-dialog-content" style="display:grid">Home</div></div></main>
    </section></div><div class="contents"><div class="pointer-events-none fixed contain-layout">
      <div class="isolate"><div class="settings-dialog-backdrop"></div>` : ""}
    <section ${layout === "modern" ? 'data-app-shell-workspace-row="true"' : ""}
      ${layout === "dialog" ? 'class="settings-dialog" role="dialog" aria-label="Settings"' : ""}
      ${wrapper}>${content}</section>
    ${layout === "dialog" ? "</div></div></div>" : ""}
  </body></html>`, {
    url: layout === "dialog" ? "https://codex.test/" : "https://codex.test/settings",
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    const width = this.id === "background" ? 900 : this.id === "narrow-native" ? 240 :
      this.id === "main-content" ? mainWidth :
      this.closest(".settings-dialog-sidebar") ? 280 : this.id === "sidebar" ? 300 : 700;
    return new window.DOMRect(0, 0, width, this.id === "sidebar" ? 640 : 400);
  };
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  window.requestAnimationFrame = (callback) => { frames.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = (id) => { frames.delete(id); };
  const intervals = new Map<number, () => void>();
  let intervalId = 0;
  window.setInterval = ((callback: () => void) => {
    intervals.set(++intervalId, callback);
    return intervalId;
  }) as typeof window.setInterval;
  window.clearInterval = (id) => { if (id !== undefined) intervals.delete(id); };
  function tickIntervals() {
    for (const callback of intervals.values()) callback();
  }
  const logs: string[] = [];
  const ipcRenderer = {
    send: (_channel: string, _level: string, message: string) => logs.push(message),
    invoke: async (channel: string, ...args: unknown[]) => {
      if (invokeOverride) return invokeOverride(channel, ...args);
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
  return { dom, window, injector, frames, logs, settle, tickIntervals };
}

const quietSettingsDomWork = { documentQueries: [], layoutReads: 0, observerCallbacks: 0 };

function watchSettingsDomWork(window: JSDOM["window"]) {
  const { document } = window;
  const querySelector = document.querySelector.bind(document);
  const querySelectorAll = document.querySelectorAll.bind(document);
  const getComputedStyle = window.getComputedStyle.bind(window);
  const getBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;
  const Observer = window.MutationObserver;
  let documentQueries: string[] = [];
  let layoutReads = 0;
  let observerCallbacks = 0;
  document.querySelector = ((selectors: string) => {
    documentQueries.push(selectors);
    return querySelector(selectors);
  }) as typeof document.querySelector;
  document.querySelectorAll = ((selectors: string) => {
    documentQueries.push(selectors);
    return querySelectorAll(selectors);
  }) as typeof document.querySelectorAll;
  window.MutationObserver = class extends Observer {
    constructor(callback: MutationCallback) {
      super((records, observer) => {
        observerCallbacks++;
        callback(records, observer);
      });
    }
  };
  window.getComputedStyle = (element, pseudoElement) => {
    layoutReads++;
    return getComputedStyle(element, pseudoElement);
  };
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    layoutReads++;
    return getBoundingClientRect.call(this);
  };
  return () => {
    const reads = { documentQueries, layoutReads, observerCallbacks };
    documentQueries = [];
    layoutReads = 0;
    observerCallbacks = 0;
    return reads;
  };
}

function controlTimeouts(window: JSDOM["window"]) {
  const pending = new Map<number, () => void>();
  let nextId = 0;
  window.setTimeout = ((callback: () => void) => {
    pending.set(++nextId, callback);
    return nextId;
  }) as typeof window.setTimeout;
  window.clearTimeout = (id) => { if (id !== undefined) pending.delete(id); };
  return () => {
    for (const [id, callback] of [...pending]) {
      if (pending.delete(id)) callback();
    }
  };
}

test("nested chat updates trigger no Settings DOM work, including with a dialog open", async () => {
  const f = createInjectorFixture("", "dialog");
  try {
    const { document } = f.window;
    const portal = document.querySelector("body > .contents")!;
    const overlay = portal.firstElementChild!;
    overlay.remove();
    const chat = document.getElementById("home-content")!;
    const takeReads = watchSettingsDomWork(f.window);
    const tickTimeouts = controlTimeouts(f.window);
    f.injector.startSettingsInjector();
    await f.settle();
    const startup = takeReads();

    chat.insertAdjacentHTML("beforeend", '<article><div><button>Copy</button></div></article>');
    await f.settle();
    const messageInserted = takeReads();

    chat.querySelector("article")!.setAttribute("aria-busy", "true");
    await f.settle();
    const messageUpdated = takeReads();

    f.tickIntervals();
    tickTimeouts();
    await f.settle();
    const startupRetry = takeReads();

    portal.appendChild(overlay);
    await f.settle();
    assert.ok(overlay.querySelector('[data-codexpp="nav-config"]'));
    takeReads();
    chat.querySelector("article div")!.appendChild(document.createElement("span"));
    chat.querySelector("article")!.classList.add("streaming");
    await f.settle();

    assert.deepEqual({ startup, messageInserted, messageUpdated, startupRetry, modalOpen: takeReads() }, {
      startup: { ...quietSettingsDomWork, documentQueries: ["[data-settings-nav-scroll-container]"] },
      messageInserted: quietSettingsDomWork,
      messageUpdated: quietSettingsDomWork,
      startupRetry: quietSettingsDomWork,
      modalOpen: quietSettingsDomWork,
    });
  } finally {
    f.dom.window.close();
  }
});

test("a Store response after closing Settings only updates the badge on the next open", async () => {
  let resolveStore!: (store: unknown) => void;
  const pending = new Promise((resolve) => { resolveStore = resolve; });
  const f = createInjectorFixture("", "dialog", 700, async (channel) =>
    channel === "codexpp:get-tweak-store" ? pending : null);
  try {
    const portal = f.window.document.querySelector("body > .contents")!;
    const reopened = portal.cloneNode(true) as HTMLElement;
    const takeReads = watchSettingsDomWork(f.window);
    f.injector.startSettingsInjector();
    portal.remove();
    await f.settle();
    takeReads();
    resolveStore({ entries: [{ installed: { version: "1" }, manifest: { version: "2" } }] });
    await f.settle();
    assert.deepEqual(takeReads(), quietSettingsDomWork);
    f.window.document.body.appendChild(reopened);
    await f.settle();
    assert.equal(reopened.querySelector("[data-codexpp-store-update-badge]")?.textContent, "1");
  } finally {
    f.dom.window.close();
  }
});

test("a chat link named Settings cannot start Settings detection", async () => {
  const f = createInjectorFixture("", "dialog");
  try {
    const { document } = f.window;
    document.querySelector("body > .contents")!.replaceChildren();
    const link = document.createElement("a");
    link.href = "/threads/user-message";
    link.textContent = "Settings";
    link.addEventListener("click", (event) => event.preventDefault());
    document.getElementById("home-content")!.appendChild(link);
    const takeReads = watchSettingsDomWork(f.window);
    const tickTimeouts = controlTimeouts(f.window);
    f.injector.startSettingsInjector();
    await f.settle();
    takeReads();

    link.click();
    await f.settle();
    tickTimeouts();
    await f.settle();
    assert.deepEqual(takeReads(), quietSettingsDomWork);
  } finally {
    f.dom.window.close();
  }
});

test("modern Config selection visibly replaces General and same-General click restores native styling", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    const native = f.window.document.getElementById("native-general-nav") as HTMLButtonElement;
    const config = f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!;
    const originalColor = f.window.getComputedStyle(native).backgroundColor;
    assert.equal(originalColor, "rgb(20, 40, 60)");
    config.click();
    assert.equal(f.window.getComputedStyle(native).backgroundColor, "rgba(0, 0, 0, 0)");
    assert.equal(f.window.getComputedStyle(config).backgroundColor, originalColor);
    assert.equal(native.getAttribute("aria-current"), null);
    assert.equal(native.firstElementChild!.classList.contains("text-default"), true);
    assert.equal(native.querySelector("span")!.classList.contains("text-codex-icon-active"), false);
    assert.equal(config.getAttribute("aria-current"), "page");
    assert.equal(config.firstElementChild!.classList.contains("text-emphasis"), true);
    assert.equal(config.querySelector("svg")!.classList.contains("text-codex-icon-active"), true);
    native.click();
    assert.equal(f.window.getComputedStyle(native).backgroundColor, originalColor);
    assert.equal(native.getAttribute("aria-current"), "page");
    assert.equal(native.firstElementChild!.classList.contains("text-emphasis"), true);
    assert.equal(native.querySelector("span")!.classList.contains("text-codex-icon-active"), true);
    assert.equal(config.getAttribute("aria-current"), null);
    assert.equal(f.window.document.getElementById("native-general")!.style.display, "flex");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("modern native General rerender stays muted across custom page switches", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    const sidebar = f.window.document.getElementById("sidebar")!;
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    const native = f.window.document.getElementById("native-general-nav")!;
    const replacement = native.cloneNode(true) as HTMLButtonElement;
    replacement.classList.add("bg-primary-ghost-hover");
    replacement.setAttribute("aria-current", "page");
    replacement.firstElementChild!.classList.add("text-emphasis");
    replacement.querySelector("span")!.classList.add("text-codex-icon-active");
    native.replaceWith(replacement);
    await f.settle();
    assert.equal(f.window.getComputedStyle(replacement).backgroundColor, "rgba(0, 0, 0, 0)");
    for (const selection of ["nav-tweaks", "nav-tweak store", "nav-config"]) {
      const selected = f.window.document.querySelector<HTMLButtonElement>(`[data-codexpp="${selection}"]`)!;
      selected.click();
      assert.equal(f.window.getComputedStyle(selected).backgroundColor, "rgb(20, 40, 60)");
      assert.equal(f.window.getComputedStyle(replacement).backgroundColor, "rgba(0, 0, 0, 0)");
    }
    sidebar.querySelector<HTMLButtonElement>("#native-general-nav")!.click();
    assert.equal(f.window.getComputedStyle(replacement).backgroundColor, "rgb(20, 40, 60)");
    assert.equal(f.window.document.getElementById("native-general")!.style.display, "flex");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("legacy native selection classes return after a custom page", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    const native = f.window.document.querySelector<HTMLButtonElement>("#sidebar button")!;
    native.classList.add("bg-token-list-hover-background");
    native.setAttribute("aria-current", "page");
    native.innerHTML = `<div class="text-token-list-active-selection-foreground">
      <span class="text-token-list-active-selection-icon-foreground"></span><span>General</span>
    </div>`;
    f.injector.startSettingsInjector();
    const config = f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!;
    config.click();
    assert.equal(native.classList.contains("bg-token-list-hover-background"), false);
    assert.equal(native.classList.contains("hover:bg-token-list-hover-background"), true);
    assert.equal(native.firstElementChild!.classList.contains("text-token-list-active-selection-foreground"), false);
    assert.equal(native.querySelector("span")!.classList.contains("text-token-list-active-selection-icon-foreground"), false);
    assert.equal(config.classList.contains("bg-token-list-hover-background"), true);
    assert.equal(config.firstElementChild!.classList.contains("text-token-list-active-selection-foreground"), true);
    native.click();
    assert.equal(native.classList.contains("bg-token-list-hover-background"), true);
    assert.equal(native.classList.contains("hover:bg-token-list-hover-background"), false);
    assert.equal(native.firstElementChild!.classList.contains("text-token-list-active-selection-foreground"), true);
    assert.equal(native.querySelector("span")!.classList.contains("text-token-list-active-selection-icon-foreground"), true);
    assert.equal(native.getAttribute("aria-current"), "page");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("Config switch shows the native track and thumb in both states while saving one click at a time", async () => {
  const saved: boolean[] = [];
  let finishFirstSave: () => void = () => {};
  const firstSave = new Promise<void>((resolve) => { finishFirstSave = resolve; });
  const f = createInjectorFixture("", "modern", 700, async (channel, ...args) => {
    if (channel === "codexpp:get-tweak-store") return { entries: [] };
    if (channel === "codexpp:get-config") return {
      version: "1.0.4", autoUpdate: true, updateChannel: "stable", updateRepo: "", updateRef: "",
      updateCheck: null, selfUpdate: null, installationSource: { label: "Local", detail: "Test" },
    };
    if (channel === "codexpp:set-auto-update") {
      saved.push(args[0] as boolean);
      if (saved.length === 1) await firstSave;
      return null;
    }
    throw new Error(`Unexpected IPC: ${channel}`);
  });
  try {
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    await f.settle();
    const control = f.window.document.querySelector<HTMLButtonElement>(
      '[data-codexpp-config-card] button[role="switch"]',
    )!;
    const track = control.firstElementChild as HTMLElement;
    const thumb = track.firstElementChild as HTMLElement;
    assert.equal(control.getAttribute("aria-checked"), "true");
    assert.equal(f.window.getComputedStyle(track).backgroundColor, "rgb(0, 100, 255)");
    assert.equal(f.window.getComputedStyle(track).width, "32px");
    assert.equal(f.window.getComputedStyle(track).height, "20px");
    assert.equal(f.window.getComputedStyle(thumb).backgroundColor, "rgb(255, 255, 255)");
    assert.equal(f.window.getComputedStyle(thumb).borderColor, "rgb(255, 255, 255)");
    assert.equal(track.getAttribute("aria-hidden"), "true");
    assert.equal(thumb.style.transform, "translateX(14px)");
    control.click();
    assert.deepEqual(saved, [false]);
    assert.equal(control.disabled, true);
    assert.equal(control.getAttribute("aria-checked"), "false");
    assert.equal(f.window.getComputedStyle(track).backgroundColor, "rgba(40, 40, 40, 0.1)");
    assert.equal(f.window.getComputedStyle(thumb).backgroundColor, "rgb(255, 255, 255)");
    assert.equal(thumb.style.transform, "translateX(2px)");
    control.click();
    assert.deepEqual(saved, [false]);
    finishFirstSave();
    await f.settle();
    assert.equal(control.disabled, false);
    control.click();
    await f.settle();
    assert.deepEqual(saved, [false, true]);
    assert.equal(control.getAttribute("aria-checked"), "true");
    assert.equal(f.window.getComputedStyle(track).backgroundColor, "rgb(0, 100, 255)");
    assert.equal(thumb.style.transform, "translateX(14px)");
  } finally {
    finishFirstSave();
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("off tweak switch uses the same track and sends the enabled state", async () => {
  const saved: unknown[][] = [];
  const f = createInjectorFixture("", "modern", 700, async (channel, ...args) => {
    if (channel === "codexpp:get-tweak-store") return { entries: [] };
    if (channel === "codexpp:set-tweak-enabled") { saved.push(args); return null; }
    throw new Error(`Unexpected IPC: ${channel}`);
  });
  try {
    f.injector.setListedTweaks([{
      manifest: { id: "demo", name: "Demo", version: "1.0" }, entry: "", dir: "",
      entryExists: true, enabled: false, update: null,
    }]);
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-tweaks"]')!.click();
    const control = f.window.document.querySelector<HTMLButtonElement>('button[role="switch"]')!;
    const track = control.firstElementChild as HTMLElement;
    const thumb = track.firstElementChild as HTMLElement;
    assert.equal(control.getAttribute("aria-checked"), "false");
    assert.equal(f.window.getComputedStyle(track).backgroundColor, "rgba(40, 40, 40, 0.1)");
    assert.equal(f.window.getComputedStyle(thumb).backgroundColor, "rgb(255, 255, 255)");
    control.click();
    await f.settle();
    assert.deepEqual(saved, [["demo", true]]);
    assert.equal(control.getAttribute("aria-checked"), "true");
    assert.equal(f.window.getComputedStyle(track).backgroundColor, "rgb(0, 100, 255)");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

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

test("settings dialog mounts each Codex++ page in its own native panel and restores General", async () => {
  const f = createInjectorFixture("", "dialog");
  try {
    f.injector.registerPage("test", { id: "test", name: "Test", version: "1.0.0" }, {
      id: "test:page", title: "Test page", render: (root: HTMLElement) => { root.textContent = "Test content"; },
    });
    f.injector.startSettingsInjector();
    const dialog = f.window.document.querySelector('[role="dialog"]')!;
    const content = dialog.querySelector("[data-settings-panel]")!;
    const native = dialog.querySelector<HTMLElement>("#native-general")!;
    const general = dialog.querySelector<HTMLButtonElement>("#native-general-nav")!;
    const home = f.window.document.getElementById("home-content")!;
    const homeMarkup = home.innerHTML;

    for (const [selector, visibleText] of [
      ["nav-config", "Codex++ Updates"],
      ["nav-tweaks", "Installed Tweaks"],
      ["nav-tweak store", "Publish Tweak"],
      ["nav-page-test:page", "Test content"],
    ]) {
      const button = dialog.querySelector<HTMLButtonElement>(`[data-codexpp="${selector}"]`);
      assert.ok(button, selector);
      button.click();
      await f.settle();
      const panels = f.window.document.querySelectorAll<HTMLElement>('[data-codexpp="tweaks-panel"]');
      assert.equal(panels.length, 1, selector);
      assert.equal(panels[0]!.parentElement, content, selector);
      assert.equal(panels[0]!.style.display, "block", selector);
      assert.ok(panels[0]!.textContent?.includes(visibleText), selector);
      assert.equal(native.style.display, "none");
      assert.equal(button.getAttribute("aria-current"), "page");
      assert.equal(general.getAttribute("aria-current"), null);
      assert.equal(home.innerHTML, homeMarkup);
    }

    general.click();
    assert.equal(native.style.display, "flex");
    assert.equal(general.getAttribute("aria-current"), "page");
    assert.equal(content.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!.style.display, "none");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("the home portal mounts Settings, clears its active page on close, and handles late navigation on reopen", async () => {
  const f = createInjectorFixture("", "dialog");
  try {
    let disposed = 0;
    f.injector.registerPage("test", { id: "test", name: "Test", version: "1.0.0" }, {
      id: "test:page", title: "Test page", render: (root: HTMLElement) => {
        root.textContent = "Test content";
        return () => { disposed++; };
      },
    });
    const document = f.window.document;
    const dialog = document.querySelector('[role="dialog"]')!;
    const portal = document.querySelector("body > .contents")!;
    const overlay = portal.firstElementChild!;
    const reopened = overlay.cloneNode(true) as HTMLElement;
    const reopenedSidebar = reopened.querySelector("#sidebar")!;
    const lateNav = reopenedSidebar.firstElementChild!;
    lateNav.remove();
    overlay.remove();
    const home = document.getElementById("home-content")!;
    const homeMarkup = home.innerHTML;
    const native = dialog.querySelector<HTMLElement>("#native-general")!;
    const registeredPage = '[data-codexpp="nav-page-test:page"]';
    const panel = '[data-codexpp="tweaks-panel"]';
    const takeReads = watchSettingsDomWork(f.window);
    const tickTimeouts = controlTimeouts(f.window);
    f.injector.startSettingsInjector();
    await f.settle();
    assert.equal(document.querySelector(registeredPage), null);
    portal.appendChild(overlay);
    await f.settle();
    dialog.querySelector<HTMLButtonElement>(registeredPage)!.click();
    assert.equal(native.style.display, "none");
    assert.ok(dialog.querySelector(panel)?.textContent?.includes("Test content"));

    overlay.remove();
    await f.settle();
    assert.equal(native.style.display, "flex");
    assert.equal(dialog.querySelector(panel), null);
    assert.equal(disposed, 1);
    assert.equal(document.querySelector('[data-codexpp="nav-group"]'), null);
    assert.equal(home.innerHTML, homeMarkup);

    takeReads();
    home.insertAdjacentHTML("beforeend", '<article><div><button>Copy</button></div></article>');
    await f.settle();
    home.querySelector("article")!.classList.add("streaming");
    f.tickIntervals();
    tickTimeouts();
    await f.settle();
    const postCloseReads = takeReads();
    const updatedHomeMarkup = home.innerHTML;

    portal.appendChild(reopened);
    await f.settle();
    assert.equal(reopened.querySelector(registeredPage), null);
    reopenedSidebar.prepend(lateNav);
    await f.settle();
    const page = reopened.querySelector<HTMLButtonElement>(registeredPage);
    assert.ok(page);
    assert.equal(page.getAttribute("aria-current"), null);
    assert.equal(reopened.querySelector(panel), null);
    assert.equal(reopened.querySelector<HTMLElement>("#native-general")!.style.display, "flex");
    page.click();
    assert.ok(reopened.querySelector(panel)?.textContent?.includes("Test content"));
    assert.equal(disposed, 1);
    assert.equal(home.innerHTML, updatedHomeMarkup);
    assert.equal(f.window.location.pathname, "/");
    assert.deepEqual(postCloseReads, quietSettingsDomWork);
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("settings dialog rejects invalid content without mounting in another dialog or the background", async () => {
  for (const invalid of ["hidden", "inert", "missing", "ambiguous", "nested-sidebar"] as const) {
    const f = createInjectorFixture("", "dialog");
    try {
      const document = f.window.document;
      const dialog = document.querySelector('[role="dialog"]')!;
      const content = document.getElementById("main-content")!;
      const home = document.getElementById("home-content")!;
      dialog.insertAdjacentHTML("beforeend", `<div class="settings-dialog" role="dialog" aria-label="Other dialog">
        <div data-settings-panel><div class="settings-dialog-content" style="display:grid">Other dialog</div></div>
      </div>`);
      const otherDialog = dialog.querySelector('[aria-label="Other dialog"]')!;
      const outsideMarkup = [home.innerHTML, otherDialog.innerHTML];
      if (invalid === "hidden") content.hidden = true;
      if (invalid === "inert") content.setAttribute("inert", "");
      if (invalid === "missing") content.removeAttribute("data-settings-panel");
      if (invalid === "ambiguous") {
        content.insertAdjacentHTML("afterend", '<div data-settings-panel><div>Another panel</div></div>');
      }
      if (invalid === "nested-sidebar") {
        const sidebar = document.getElementById("sidebar")!;
        const nestedDialog = document.createElement("div");
        nestedDialog.setAttribute("role", "dialog");
        sidebar.before(nestedDialog);
        nestedDialog.appendChild(sidebar);
      }

      f.injector.startSettingsInjector();
      dialog.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
      await f.settle();
      assert.equal(document.querySelector('[data-codexpp="tweaks-panel"]'), null, invalid);
      assert.equal(document.getElementById("native-general")!.style.display, "flex", invalid);
      assert.deepEqual([home.innerHTML, otherDialog.innerHTML], outsideMarkup, invalid);
      assert.ok(f.logs.some((line) => line.includes("content area rejected")), invalid);
    } finally {
      await new Promise<void>((done) => setImmediate(done));
      f.dom.window.close();
    }
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

test("an explicit Settings route supports a div-based sidebar in a workspace row", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    const { document } = f.window;
    const leftPanel = document.getElementById("left-panel")!;
    const nativeItems = document.getElementById("sidebar")!.innerHTML;
    leftPanel.innerHTML = `<div id="sidebar">${nativeItems}</div>`;
    leftPanel.getBoundingClientRect = () => new f.window.DOMRect(0, 0, 340, 640);

    f.injector.startSettingsInjector();
    await f.settle();
    const config = leftPanel.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]');
    assert.ok(config);
    config.click();
    assert.equal(document.querySelector('[data-codexpp="tweaks-panel"]')!.parentElement,
      document.getElementById("main-content"));
    assert.equal(document.getElementById("native-general")!.style.display, "none");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("declining Back to app preserves Settings until navigation commits", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    const { document } = f.window;
    const back = document.createElement("a");
    back.href = "/";
    back.textContent = "Back to app";
    let leaveAllowed = false;
    back.addEventListener("click", (event) => {
      event.preventDefault();
      if (leaveAllowed) f.window.history.pushState({}, "", "/");
    });
    document.getElementById("sidebar")!.prepend(back);
    const tickTimeouts = controlTimeouts(f.window);
    f.injector.startSettingsInjector();
    const config = document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!;
    const native = document.getElementById("native-general")!;
    config.click();
    await f.settle();
    const panel = document.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!;
    assert.equal(panel.style.display, "block");

    back.click();
    tickTimeouts();
    await f.settle();
    const afterDecline = {
      path: f.window.location.pathname,
      settingsVisible: document.documentElement.dataset.codexppSettingsSurface,
      configMounted: config.isConnected,
      panelVisible: panel.isConnected && panel.style.display === "block",
      nativeDisplay: native.style.display,
    };

    leaveAllowed = true;
    back.click();
    await f.settle();
    assert.equal(f.window.location.pathname, "/");
    assert.equal(config.isConnected, false);
    assert.equal(panel.isConnected, false);
    assert.equal(native.style.display, "flex");
    assert.deepEqual(afterDecline, {
      path: "/settings", settingsVisible: "true", configMounted: true, panelVisible: true, nativeDisplay: "none",
    });
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

for (const replacementTiming of ["immediate", "asynchronous"] as const) {
  test(`memory-routed legacy Settings follows an ${replacementTiming} row replacement`, async () => {
    const f = createInjectorFixture("", "legacy");
    try {
      const { document } = f.window;
      f.window.history.replaceState({}, "", "/");
      const first = document.querySelector("section")!;
      const replacement = first.cloneNode(true) as HTMLElement;
      const root = document.createElement("div");
      root.id = "root";
      first.replaceWith(root);
      root.appendChild(first);
      const tickTimeouts = controlTimeouts(f.window);
      const config = '[data-codexpp="nav-config"]';
      const panel = '[data-codexpp="tweaks-panel"]';

      f.injector.startSettingsInjector();
      f.injector.onSettingsNavigation("/settings/general");
      await f.settle();
      assert.equal(first.querySelectorAll(config).length, 1);

      f.injector.onSettingsNavigation("/settings/appearance");
      assert.equal(first.isConnected, true);
      if (replacementTiming === "immediate") {
        first.replaceWith(replacement);
      } else {
        await f.settle();
        first.remove();
        await f.settle();
        tickTimeouts();
        root.appendChild(replacement);
      }
      await f.settle();
      tickTimeouts();
      await f.settle();

      assert.equal(first.querySelector(config), null);
      assert.equal(replacement.querySelectorAll(config).length, 1);
      replacement.querySelector<HTMLButtonElement>(config)!.click();
      assert.equal(replacement.querySelectorAll(panel).length, 1);
      assert.equal(replacement.querySelector(panel)!.parentElement, replacement.querySelector("#main-content"));
      assert.equal(f.window.location.pathname, "/");
    } finally {
      await new Promise<void>((done) => setImmediate(done));
      f.dom.window.close();
    }
  });
}

test("native back after an in-place memory-routed Settings update leaves chat silent", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    const { document } = f.window;
    f.window.history.replaceState({}, "", "/");
    const settings = document.querySelector("section")!;
    const root = document.createElement("div");
    root.id = "root";
    settings.replaceWith(root);
    root.appendChild(settings);
    const takeReads = watchSettingsDomWork(f.window);
    const tickTimeouts = controlTimeouts(f.window);
    const config = '[data-codexpp="nav-config"]';
    f.injector.startSettingsInjector();
    f.injector.onSettingsNavigation("/settings/general");
    await f.settle();
    assert.equal(settings.querySelectorAll(config).length, 1);

    f.injector.onSettingsNavigation("/settings/appearance");
    await f.settle();
    settings.querySelector("#main-content")!.innerHTML = '<div><h2>Appearance</h2><button>Theme</button></div>';
    const appearance = Array.from(settings.querySelectorAll("nav button"))
      .find((button) => button.textContent === "Appearance")!;
    appearance.setAttribute("aria-current", "page");
    await f.settle();
    assert.equal(settings.querySelectorAll(config).length, 1);
    takeReads();

    const chat = document.createElement("section");
    chat.innerHTML = `<nav id="sidebar"><button>New chat</button><button>Search</button></nav>
      <main><article><p>Conversation</p></article></main>`;
    settings.replaceWith(chat);
    await f.settle();
    const { documentQueries, layoutReads } = takeReads();
    assert.equal(settings.querySelector(config), null);
    assert.equal(root.querySelector(config), null);
    assert.equal(f.window.location.pathname, "/");

    const message = chat.querySelector("article")!;
    message.appendChild(document.createElement("p"));
    message.setAttribute("aria-busy", "true");
    for (let tick = 0; tick < 3; tick++) {
      tickTimeouts();
      await f.settle();
    }
    assert.deepEqual({ closing: { documentQueries, layoutReads }, afterClose: takeReads() }, {
      closing: { documentQueries: [], layoutReads: 0 },
      afterClose: quietSettingsDomWork,
    });
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("a chat route cancels pending memory-routed Settings and leaves chat updates silent", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    const { document } = f.window;
    f.window.history.replaceState({}, "", "/");
    const delayedSettings = document.querySelector("section")!;
    const root = document.createElement("div");
    root.id = "root";
    root.innerHTML = "<main><article></article></main>";
    delayedSettings.replaceWith(root);
    const takeReads = watchSettingsDomWork(f.window);
    const tickTimeouts = controlTimeouts(f.window);
    f.injector.startSettingsInjector();
    f.injector.onSettingsNavigation("/settings/general");
    await f.settle();
    f.injector.onSettingsNavigation("/threads/next");
    await f.settle();
    takeReads();

    root.appendChild(delayedSettings);
    root.querySelector("article")!.appendChild(document.createElement("p"));
    await f.settle();
    tickTimeouts();
    await f.settle();
    assert.deepEqual(takeReads(), quietSettingsDomWork);
    assert.equal(root.querySelector('[data-codexpp="nav-config"]'), null);
    assert.equal(f.window.location.pathname, "/");
  } finally {
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

test("modern settings row without its main surface cannot mount in an outer app main", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    const row = f.window.document.querySelector("section")!;
    const app = f.window.document.createElement("div");
    row.parentElement!.appendChild(app);
    app.appendChild(row);
    const outer = f.window.document.createElement("main");
    outer.id = "outer-main";
    outer.dataset.appShellMainSurface = "default";
    outer.innerHTML = '<div data-app-shell-focus-area="main"><div id="foreign-general" style="display:grid">Other page</div></div>';
    app.appendChild(outer);
    row.querySelector<HTMLElement>('[data-app-shell-main-surface="default"]')!
      .removeAttribute("data-app-shell-main-surface");
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]'), null);
    assert.equal(f.window.document.getElementById("native-general")!.style.display, "flex");
    assert.equal(f.window.document.getElementById("foreign-general")!.style.display, "grid");
    assert.ok(f.logs.some((line) => line.includes("content area rejected")));
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("legacy settings row without a usable content sibling cannot mount in outer app content", async () => {
  const f = createInjectorFixture("", "legacy");
  try {
    const row = f.window.document.querySelector("section")!;
    const app = f.window.document.createElement("div");
    row.parentElement!.appendChild(app);
    app.appendChild(row);
    const outer = f.window.document.createElement("div");
    outer.id = "outer-main";
    outer.innerHTML = '<div id="foreign-general" style="display:grid">Other page</div>';
    app.appendChild(outer);
    f.window.document.getElementById("main-content")!.id = "narrow-native";
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]'), null);
    assert.equal(f.window.document.getElementById("native-general")!.style.display, "flex");
    assert.equal(f.window.document.getElementById("foreign-general")!.style.display, "grid");
    assert.ok(f.logs.some((line) => line.includes("content area rejected")));
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

test("native children added or replaced in an active host stay hidden and recover their display", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    let renders = 0;
    f.injector.registerPage("test", { id: "test", name: "Test", version: "1.0.0" }, {
      id: "test:page", title: "Test page", render: () => { renders++; },
    });
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-page-test:page"]')!.click();
    const content = f.window.document.getElementById("main-content")!;
    const newGeneral = f.window.document.createElement("div");
    newGeneral.style.display = "grid";
    content.appendChild(newGeneral);
    await f.settle();
    assert.equal(newGeneral.style.display, "none");
    assert.equal(content.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!.style.display, "block");
    const replacement = f.window.document.createElement("div");
    replacement.style.display = "inline-flex";
    newGeneral.replaceWith(replacement);
    await f.settle();
    assert.equal(replacement.style.display, "none");
    assert.equal(renders, 1, "native mutations must not rerender a registered page");
    f.window.document.getElementById("sidebar")!.querySelector<HTMLButtonElement>("button")!.click();
    assert.equal(newGeneral.style.display, "grid");
    assert.equal(replacement.style.display, "inline-flex");
    assert.equal(f.frames.size, 0);
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("removing the active panel from the same host falls back to native settings", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    const content = f.window.document.getElementById("main-content")!;
    const newGeneral = f.window.document.createElement("div");
    newGeneral.style.display = "grid";
    content.replaceChildren(newGeneral);
    await f.settle();
    assert.equal(newGeneral.style.display, "grid");
    assert.equal(content.querySelector('[data-codexpp="tweaks-panel"]'), null);
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-config"]')!.getAttribute("aria-current"), null);
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(newGeneral.style.display, "none");
    f.window.document.getElementById("sidebar")!.querySelector<HTMLButtonElement>("button")!.click();
    assert.equal(newGeneral.style.display, "grid");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("nav group remount alone restores native content before another Config to General cycle", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    const nativeGeneral = f.window.document.getElementById("native-general")!;
    const panel = f.window.document.querySelector<HTMLElement>('[data-codexpp="tweaks-panel"]')!;
    f.window.document.querySelector('[data-codexpp="nav-group"]')!.remove();
    await f.settle();
    assert.equal(nativeGeneral.style.display, "flex");
    assert.equal(panel.style.display, "none");
    assert.ok(f.window.document.querySelector('[data-codexpp="nav-group"]'));
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-config"]')!.click();
    assert.equal(nativeGeneral.style.display, "none");
    f.window.document.getElementById("sidebar")!.querySelector<HTMLButtonElement>("button")!.click();
    assert.equal(nativeGeneral.style.display, "flex");
    assert.equal(f.frames.size, 0);
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

test("home navigation and nested chat titles never receive Settings groups", async () => {
  for (const titles of ["General discussion|Configuration guide|Git notes", "General|Appearance|Git"]) {
    const f = createInjectorFixture("", "modern");
    try {
      const sidebar = f.window.document.getElementById("sidebar")!;
      sidebar.innerHTML = '<button>New chat</button><button>Search</button><div id="chat-list"></div>';
      for (const title of titles.split("|")) {
        const link = f.window.document.createElement("a");
        link.textContent = title;
        sidebar.querySelector("#chat-list")!.appendChild(link);
      }
      (sidebar.querySelector("#chat-list") as HTMLElement).getBoundingClientRect = () =>
        new f.window.DOMRect(0, 80, 300, 500);
      f.injector.startSettingsInjector();
      await f.settle();
      assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), null, titles);
      assert.notEqual(f.window.document.documentElement.dataset.codexppSettingsSurface, "true", titles);
    } finally {
      await new Promise<void>((done) => setImmediate(done));
      f.dom.window.close();
    }
  }
});

test("a rejected outer injection root never marks the page as Settings", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.window.document.getElementById("sidebar")!.classList.remove("overflow-y-auto");
    f.injector.startSettingsInjector();
    await f.settle();
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), null);
    assert.notEqual(f.window.document.documentElement.dataset.codexppSettingsSurface, "true");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("returning home with reused Settings DOM removes its UI and disposes the registered page", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    let disposed = 0;
    f.injector.registerPage("test", { id: "test", name: "Test", version: "1.0.0" }, {
      id: "test:page", title: "Test page", render: () => () => { disposed++; },
    });
    f.injector.startSettingsInjector();
    const sidebar = f.window.document.getElementById("sidebar")!;
    f.window.document.querySelector<HTMLButtonElement>('[data-codexpp="nav-page-test:page"]')!.click();
    const native = f.window.document.getElementById("native-general")!;
    const sentinel = f.window.document.createElement("div");
    sentinel.dataset.codexpp = "unrelated-tweak";
    f.window.document.body.appendChild(sentinel);
    sidebar.firstElementChild!.innerHTML = '<button>New chat</button><button>Search</button>';
    f.window.history.pushState({}, "", "/");
    await f.settle();
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), null);
    assert.equal(f.window.document.querySelector('[data-codexpp="pages-group"]'), null);
    assert.equal(f.window.document.querySelector('[data-codexpp="native-nav-header"]'), null);
    assert.equal(f.window.document.querySelector('[data-codexpp="tweaks-panel"]'), null);
    assert.equal(native.style.display, "flex");
    assert.equal(disposed, 1);
    assert.equal(f.window.document.documentElement.dataset.codexppSettingsSurface, "false");
    assert.equal(sentinel.isConnected, true);
    const restores = f.logs.filter((line) => line.includes("restore codex view")).length;
    sidebar.querySelector<HTMLButtonElement>("button")!.click();
    await f.settle();
    assert.equal(f.logs.filter((line) => line.includes("restore codex view")).length, restores);
    assert.equal(disposed, 1);
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("page text cannot keep a missing Settings surface active", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    f.window.document.getElementById("sidebar")!.replaceChildren();
    f.window.document.getElementById("main-content")!.innerHTML =
      "<button>General</button><button>Appearance</button><button>Git</button>";
    await f.settle();
    await new Promise<void>((done) => f.window.setTimeout(done, 1600));
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), null);
    assert.equal(f.window.document.documentElement.dataset.codexppSettingsSurface, "false");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});

test("an outer root rejected after mounting cannot keep Settings visible through the hide debounce", async () => {
  const f = createInjectorFixture("", "modern");
  try {
    f.injector.startSettingsInjector();
    const sidebar = f.window.document.getElementById("sidebar")!;
    sidebar.classList.remove("overflow-y-auto");
    sidebar.appendChild(f.window.document.createElement("div"));
    await f.settle();
    assert.equal(f.window.document.querySelector('[data-codexpp="nav-group"]'), null);
    await new Promise<void>((done) => f.window.setTimeout(done, 1600));
    assert.equal(f.window.document.documentElement.dataset.codexppSettingsSurface, "false");
  } finally {
    await new Promise<void>((done) => setImmediate(done));
    f.dom.window.close();
  }
});
