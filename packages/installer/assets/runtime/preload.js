"use strict";

// src/preload/index.ts
var import_electron4 = require("electron");

// src/preload/react-hook.ts
function installReactHook() {
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) return;
  const renderers = /* @__PURE__ */ new Map();
  let nextId = 1;
  const listeners = /* @__PURE__ */ new Map();
  const hook = {
    supportsFiber: true,
    renderers,
    inject(renderer) {
      const id = nextId++;
      renderers.set(id, renderer);
      console.debug(
        "[codex-plusplus] React renderer attached:",
        renderer.rendererPackageName,
        renderer.version
      );
      return id;
    },
    on(event, fn) {
      let s = listeners.get(event);
      if (!s) listeners.set(event, s = /* @__PURE__ */ new Set());
      s.add(fn);
    },
    off(event, fn) {
      listeners.get(event)?.delete(fn);
    },
    emit(event, ...args) {
      listeners.get(event)?.forEach((fn) => fn(...args));
    },
    onCommitFiberRoot() {
    },
    onCommitFiberUnmount() {
    },
    onScheduleFiberRoot() {
    },
    checkDCE() {
    }
  };
  Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
    configurable: true,
    enumerable: false,
    writable: true,
    // allow real DevTools to overwrite if user installs it
    value: hook
  });
  window.__codexpp__ = { hook, renderers };
}
function fiberForNode(node) {
  const renderers = window.__codexpp__?.renderers;
  if (renderers) {
    for (const r of renderers.values()) {
      const f = r.findFiberByHostInstance?.(node);
      if (f) return f;
    }
  }
  for (const k of Object.keys(node)) {
    if (k.startsWith("__reactFiber")) return node[k];
  }
  return null;
}

// src/preload/settings-injector.ts
var import_electron = require("electron");

// src/tweak-store.ts
var TWEAK_STORE_REVIEW_ISSUE_URL = "https://github.com/kpkhxlgy0/codex-plusplus/issues/new";
var GITHUB_REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
var FULL_SHA_RE = /^[a-f0-9]{40}$/i;
function normalizeGitHubRepo(input) {
  const raw = input.trim();
  if (!raw) throw new Error("GitHub repo is required");
  const ssh = /^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i.exec(raw);
  if (ssh) return normalizeRepoPart(ssh[1]);
  if (/^https?:\/\//i.test(raw)) {
    const url = new URL(raw);
    if (url.hostname !== "github.com") throw new Error("Only github.com repositories are supported");
    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length < 2) throw new Error("GitHub repo URL must include owner and repository");
    return normalizeRepoPart(`${parts[0]}/${parts[1]}`);
  }
  return normalizeRepoPart(raw);
}
function buildTweakPublishIssueUrl(submission) {
  const repo = normalizeGitHubRepo(submission.repo);
  if (!isFullCommitSha(submission.commitSha)) {
    throw new Error("Submission must include the full commit SHA to review");
  }
  const title = `Tweak store review: ${repo}`;
  const body = [
    "## Tweak repo",
    `https://github.com/${repo}`,
    "",
    "## Commit to review",
    submission.commitSha,
    submission.commitUrl,
    "",
    "Do not approve a different commit. If the author pushes changes, ask them to resubmit.",
    "",
    "## Manifest",
    `- id: ${submission.manifest?.id ?? "(not detected)"}`,
    `- name: ${submission.manifest?.name ?? "(not detected)"}`,
    `- version: ${submission.manifest?.version ?? "(not detected)"}`,
    `- description: ${submission.manifest?.description ?? "(not detected)"}`,
    `- iconUrl: ${submission.manifest?.iconUrl ?? "(not detected)"}`,
    "",
    "## Admin checklist",
    "- [ ] manifest.json is valid",
    "- [ ] manifest.iconUrl is usable as the store icon",
    "- [ ] source was reviewed at the exact commit above",
    "- [ ] `store/index.json` entry pins `approvedCommitSha` to the exact commit above"
  ].join("\n");
  const url = new URL(TWEAK_STORE_REVIEW_ISSUE_URL);
  url.searchParams.set("template", "tweak-store-review.md");
  url.searchParams.set("title", title);
  url.searchParams.set("body", body);
  return url.toString();
}
function isFullCommitSha(value) {
  return FULL_SHA_RE.test(value);
}
function normalizeRepoPart(value) {
  const repo = value.trim().replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
  if (!GITHUB_REPO_RE.test(repo)) throw new Error("GitHub repo must be in owner/repo form");
  return repo;
}

// src/preload/settings-dom-heuristics.ts
function compactSettingsText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}
function hasNativeSettingsSectionHeaders(root) {
  const headings = /* @__PURE__ */ new Set(["Personal", "Integrations", "Coding", "Archived"]);
  return Array.from(root.querySelectorAll("div,span")).some((el) => {
    if (el.dataset.codexpp) return false;
    if (!headings.has(compactSettingsText(el.textContent || ""))) return false;
    return el.classList.contains("text-token-input-placeholder-foreground") || el.classList.contains("text-token-text-secondary") || el.className.includes("text-token");
  });
}
function normalizeCodexPpSettingsLabel(value) {
  return compactSettingsText(value).toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim();
}
var CODEXPP_CORE_SETTINGS_LABELS = [
  "General",
  "\u5E38\u89C4",
  "\u901A\u7528",
  "Appearance",
  "\u5916\u89C2",
  "Configuration",
  "\u914D\u7F6E",
  "\u9ED8\u8BA4\u6743\u9650",
  "Personalization",
  "\u4E2A\u6027\u5316"
].map(normalizeCodexPpSettingsLabel);
var CODEXPP_EXTENDED_SETTINGS_LABELS = [
  "Account",
  "\u8D26\u6237",
  "\u8D26\u53F7",
  "General",
  "\u5E38\u89C4",
  "\u901A\u7528",
  "Appearance",
  "\u5916\u89C2",
  "Configuration",
  "\u914D\u7F6E",
  "\u9ED8\u8BA4\u6743\u9650",
  "Personalization",
  "\u4E2A\u6027\u5316",
  "Keyboard shortcuts",
  "Archived chats",
  "Usage",
  "Computer use",
  "Browser use",
  "MCP servers",
  "MCP Servers",
  "MCP \u670D\u52A1\u5668",
  "Git",
  "Environments",
  "\u73AF\u5883",
  "Cloud Environments",
  "Worktrees",
  "Connections",
  "Plugins",
  "Skills"
].map(normalizeCodexPpSettingsLabel);
var CODEXPP_SETTINGS_ONLY_LABELS = [
  "General",
  "\u5E38\u89C4",
  "\u901A\u7528",
  "Appearance",
  "\u5916\u89C2",
  "Configuration",
  "\u914D\u7F6E",
  "\u9ED8\u8BA4\u6743\u9650",
  "Personalization",
  "\u4E2A\u6027\u5316",
  "Keyboard shortcuts",
  "Archived chats",
  "Usage",
  "Computer use",
  "Browser use",
  "MCP servers",
  "MCP Servers",
  "MCP \u670D\u52A1\u5668",
  "Git",
  "Environments",
  "\u73AF\u5883",
  "Cloud Environments",
  "Worktrees",
  "Connections"
].map(normalizeCodexPpSettingsLabel);
var CODEXPP_MAIN_APP_NAV_LABELS = [
  "New chat",
  "Quick chat",
  "\u5FEB\u901F\u5BF9\u8BDD",
  "Search",
  "\u641C\u7D22",
  "Plugins",
  "\u63D2\u4EF6",
  "Automations",
  "Automation",
  "\u81EA\u52A8\u5316",
  "Chats",
  "Chat",
  "\u5BF9\u8BDD",
  "Projects",
  "\u9879\u76EE",
  "Pinned",
  "Settings",
  "\u8BBE\u7F6E",
  "Work locally"
].map(normalizeCodexPpSettingsLabel);
function codexPpControlLabel(el) {
  return normalizeCodexPpSettingsLabel(
    el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || ""
  );
}
function codexPpSettingsLabelsFrom(root) {
  const controls = Array.from(
    root.querySelectorAll("button,a,[role='button'],[role='link']")
  );
  return [
    ...new Set(
      controls.map(codexPpControlLabel).filter(Boolean)
    )
  ];
}
function codexPpSettingsLabelScore(labels) {
  const core = /* @__PURE__ */ new Set();
  const total = /* @__PURE__ */ new Set();
  for (const label of labels) {
    for (const marker of CODEXPP_CORE_SETTINGS_LABELS) {
      if (codexPpLabelMatchesMarker(label, marker)) core.add(marker);
    }
    for (const marker of CODEXPP_EXTENDED_SETTINGS_LABELS) {
      if (codexPpLabelMatchesMarker(label, marker)) total.add(marker);
    }
  }
  return { core: core.size, total: total.size };
}
function codexPpLabelMatchesMarker(label, marker) {
  return label === marker || label.includes(marker);
}
function codexPpMarkerCount(labels, markers) {
  const matched = /* @__PURE__ */ new Set();
  for (const label of labels) {
    for (const marker of markers) {
      if (codexPpLabelMatchesMarker(label, marker)) matched.add(marker);
    }
  }
  return matched.size;
}
function hasCodexPpSettingsOnlySignal(labels) {
  return codexPpMarkerCount(labels, CODEXPP_SETTINGS_ONLY_LABELS) > 0;
}
function hasMainAppSidebarSignals(labels) {
  return codexPpMarkerCount(labels, CODEXPP_MAIN_APP_NAV_LABELS) >= 2;
}
function isCodexPpSettingsLabelSet(labels) {
  const score = codexPpSettingsLabelScore(labels);
  return score.core >= 2 && score.total >= 3;
}
function codexPpVisibleBox(el) {
  if (!el.isConnected) return null;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}
var FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR = [
  "[data-composer-overlay-floating-ui='true']",
  "[data-codexpp-slash-menu='true']",
  "[data-codexpp-overlay-noise='true']",
  ".composer-home-top-menu",
  ".vertical-scroll-fade-mask",
  "[class*='[container-name:home-main-content]']"
].join(",");
function isForbiddenSettingsSidebarSurface(node) {
  if (!node) return false;
  const el = node instanceof HTMLElement ? node : node.parentElement;
  if (!el) return false;
  if (el.closest(FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR)) return true;
  if (el.querySelector("[data-list-navigation-item='true'], [cmdk-item]")) return true;
  return false;
}
function isSettingsSidebarCandidate(el) {
  const rect = codexPpVisibleBox(el);
  if (!rect) return false;
  if (rect.width < 120 || rect.width > 620) return false;
  if (rect.height < 80) return false;
  if (rect.left > window.innerWidth * 0.65) return false;
  const labels = codexPpSettingsLabelsFrom(el);
  if (hasMainAppSidebarSignals(labels) && !hasCodexPpSettingsOnlySignal(labels)) {
    return false;
  }
  return isCodexPpSettingsLabelSet(labels);
}

// src/preload/settings-icons.ts
function configIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M3 5h9M15 5h2M3 10h2M8 10h9M3 15h11M17 15h0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="13" cy="5" r="1.6" fill="currentColor"/><circle cx="6" cy="10" r="1.6" fill="currentColor"/><circle cx="15" cy="15" r="1.6" fill="currentColor"/></svg>`;
}
function tweaksIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M10 2.5 L11.4 8.6 L17.5 10 L11.4 11.4 L10 17.5 L8.6 11.4 L2.5 10 L8.6 8.6 Z" fill="currentColor"/><path d="M15.5 3 L16 5 L18 5.5 L16 6 L15.5 8 L15 6 L13 5.5 L15 5 Z" fill="currentColor" opacity="0.7"/></svg>`;
}
function storeIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M4 8.2 5.1 4.5A1.5 1.5 0 0 1 6.55 3.4h6.9a1.5 1.5 0 0 1 1.45 1.1L16 8.2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4.5 8h11v7.5A1.5 1.5 0 0 1 14 17H6a1.5 1.5 0 0 1-1.5-1.5V8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7.5 8v1a2.5 2.5 0 0 0 5 0V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
function defaultPageIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-sm inline-block align-middle" aria-hidden="true"><path d="M5 3h7l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 3v3a1 1 0 0 0 1 1h2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 11h6M7 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}
function refreshIconSvg() {
  return `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" class="icon-xs" aria-hidden="true"><path d="M4.4 9.35A5.65 5.65 0 0 1 14 5.3L15.75 7M15.75 3.75V7h-3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.6 10.65A5.65 5.65 0 0 1 6 14.7L4.25 13M4.25 16.25V13H7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

// src/preload/settings-svg.ts
function appendSvgHtml(parent, svg) {
  const el = svgElement(svg);
  if (el) parent.appendChild(el);
}
function svgElement(svg) {
  const template = document.createElement("template");
  template.innerHTML = svg.trim();
  const el = template.content.firstElementChild;
  if (!el || el.tagName.toLowerCase() !== "svg") return null;
  return el;
}

// src/preload/settings-injector.ts
var CODEX_PLUSPLUS_RELEASES_URL = "https://github.com/kpkhxlgy0/codex-plusplus/releases";
var state = {
  sections: /* @__PURE__ */ new Map(),
  pages: /* @__PURE__ */ new Map(),
  listedTweaks: [],
  outerWrapper: null,
  nativeNavHeader: null,
  navGroup: null,
  navButtons: null,
  codexPlusPlusUpdateButton: null,
  pagesGroup: null,
  pagesGroupKey: null,
  panelHost: null,
  observer: null,
  fingerprint: null,
  sidebarDumped: false,
  activePage: null,
  sidebarRoot: null,
  sidebarRestoreHandler: null,
  settingsSurfaceVisible: false,
  settingsSurfaceHideTimer: null,
  tweakStore: null,
  tweakStorePromise: null,
  tweakStoreError: null
};
var scheduledInjectFrame = null;
var lastSidebarMissingLogAt = 0;
function plog(msg, extra) {
  import_electron.ipcRenderer.send(
    "codexpp:preload-log",
    "info",
    `[settings-injector] ${msg}${extra === void 0 ? "" : " " + safeStringify(extra)}`
  );
}
function safeStringify(v) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}
function startSettingsInjector() {
  if (state.observer) return;
  const obs = new MutationObserver(() => {
    scheduleInject();
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  state.observer = obs;
  window.addEventListener("popstate", onNav);
  window.addEventListener("hashchange", onNav);
  document.addEventListener("click", onDocumentClick, true);
  for (const m of ["pushState", "replaceState"]) {
    const orig = history[m];
    history[m] = function(...args) {
      const r = orig.apply(this, args);
      window.dispatchEvent(new Event(`codexpp-${m}`));
      return r;
    };
    window.addEventListener(`codexpp-${m}`, onNav);
  }
  runInjectAndDump();
  let ticks = 0;
  const interval = setInterval(() => {
    ticks++;
    scheduleInject();
    if (ticks > 60) clearInterval(interval);
  }, 500);
}
function onNav() {
  state.fingerprint = null;
  runInjectAndDump();
}
function runInjectAndDump() {
  if (scheduledInjectFrame !== null) {
    cancelAnimationFrame(scheduledInjectFrame);
    scheduledInjectFrame = null;
  }
  tryInject();
  maybeDumpDom();
}
function scheduleInject() {
  if (scheduledInjectFrame !== null) return;
  scheduledInjectFrame = requestAnimationFrame(() => {
    scheduledInjectFrame = null;
    tryInject();
  });
}
function onDocumentClick(e) {
  const target = e.target instanceof Element ? e.target : null;
  const control = target?.closest("[role='link'],button,a");
  if (!(control instanceof HTMLElement)) return;
  if (compactSettingsText(control.textContent || "") !== "Back to app") return;
  setTimeout(() => {
    setSettingsSurfaceVisible(false, "back-to-app");
  }, 0);
}
function registerSection(section) {
  state.sections.set(section.id, section);
  if (state.activePage?.kind === "tweaks") rerender();
  return {
    unregister: () => {
      state.sections.delete(section.id);
      if (state.activePage?.kind === "tweaks") rerender();
    }
  };
}
function clearSections() {
  state.sections.clear();
  for (const p of state.pages.values()) {
    try {
      p.teardown?.();
    } catch (e) {
      plog("page teardown failed", { id: p.id, err: String(e) });
    }
  }
  state.pages.clear();
  syncPagesGroup();
  if (state.activePage?.kind === "registered" && !state.pages.has(state.activePage.id)) {
    restoreCodexView();
  } else if (state.activePage?.kind === "tweaks") {
    rerender();
  }
}
function registerPage(tweakId, manifest, page) {
  const id = page.id;
  const entry = { id, tweakId, manifest, page };
  state.pages.set(id, entry);
  plog("registerPage", { id, title: page.title, tweakId });
  syncPagesGroup();
  if (state.activePage?.kind === "registered" && state.activePage.id === id) {
    rerender();
  }
  return {
    unregister: () => {
      const e = state.pages.get(id);
      if (!e) return;
      try {
        e.teardown?.();
      } catch {
      }
      state.pages.delete(id);
      syncPagesGroup();
      if (state.activePage?.kind === "registered" && state.activePage.id === id) {
        restoreCodexView();
      }
    }
  };
}
function setListedTweaks(list) {
  state.listedTweaks = list;
  if (state.activePage?.kind === "tweaks") rerender();
}
function tryInject() {
  removeMisplacedSettingsGroups();
  const itemsGroup = findSidebarItemsGroup();
  if (!itemsGroup) {
    scheduleSettingsSurfaceHidden();
    logSidebarMissing();
    return;
  }
  lastSidebarMissingLogAt = 0;
  if (state.settingsSurfaceHideTimer) {
    clearTimeout(state.settingsSurfaceHideTimer);
    state.settingsSurfaceHideTimer = null;
  }
  setSettingsSurfaceVisible(true, "sidebar-found");
  const outer = findSidebarInjectionRoot(itemsGroup);
  if (!isSettingsSidebarCandidate(itemsGroup) || !isSettingsSidebarCandidate(outer)) {
    scheduleSettingsSurfaceHidden();
    plog("rejected non-settings sidebar candidate", {
      itemsGroup: describe(itemsGroup),
      outer: describe(outer)
    });
    return;
  }
  state.sidebarRoot = outer;
  removeSettingsGroupsOutsideRoot(outer);
  syncNativeSettingsHeader(itemsGroup, outer);
  if (state.navGroup && outer.contains(state.navGroup)) {
    syncPagesGroup();
    if (state.activePage !== null) syncCodexNativeNavActive(true);
    return;
  }
  if (state.activePage !== null || state.panelHost !== null) {
    plog("sidebar re-mount detected; clearing stale active state", {
      prevActive: state.activePage
    });
    state.activePage = null;
    state.panelHost = null;
  }
  const existingCodexPpNavGroup = outer.querySelector(':scope > [data-codexpp="nav-group"]') ?? outer.querySelector('[data-codexpp="nav-group"]');
  if (existingCodexPpNavGroup) {
    state.navGroup = existingCodexPpNavGroup;
    state.codexPlusPlusUpdateButton = existingCodexPpNavGroup.querySelector(
      "[data-codexpp-sidebar-update]"
    );
    state.sidebarRoot = outer;
    syncPagesGroup();
    refreshSidebarCodexPlusPlusUpdateButton();
    if (state.activePage !== null) syncCodexNativeNavActive(true);
    return;
  }
  const group = document.createElement("div");
  group.dataset.codexpp = "nav-group";
  group.className = "flex flex-col gap-1";
  const updateButton = sidebarUpdatePillButton();
  state.codexPlusPlusUpdateButton = updateButton;
  group.appendChild(sidebarGroupHeader("Codex++", updateButton));
  refreshSidebarCodexPlusPlusUpdateButton();
  const configBtn = makeSidebarItem("Config", configIconSvg());
  const tweaksBtn = makeSidebarItem("Tweaks", tweaksIconSvg());
  const storeBtn = makeSidebarItem("Tweak Store", storeIconSvg());
  appendSidebarStoreUpdateBadge(storeBtn);
  configBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "config" });
  });
  tweaksBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "tweaks" });
  });
  storeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    activatePage({ kind: "store" });
  });
  const items = sidebarGroupItems();
  items.appendChild(configBtn);
  items.appendChild(tweaksBtn);
  items.appendChild(storeBtn);
  group.appendChild(items);
  outer.appendChild(group);
  state.navGroup = group;
  state.navButtons = { config: configBtn, tweaks: tweaksBtn, store: storeBtn };
  plog("nav group injected", { outerTag: outer.tagName });
  syncPagesGroup();
}
function logSidebarMissing() {
  const now = Date.now();
  if (now - lastSidebarMissingLogAt < 5e3) return;
  lastSidebarMissingLogAt = now;
  plog("sidebar not found");
}
function syncNativeSettingsHeader(itemsGroup, outer) {
  if (state.nativeNavHeader && outer.contains(state.nativeNavHeader)) return;
  if (outer === itemsGroup) return;
  if (hasNativeSettingsSectionHeaders(outer)) return;
  const header = sidebarGroupHeader("General");
  header.dataset.codexpp = "native-nav-header";
  outer.insertBefore(header, itemsGroup);
  state.nativeNavHeader = header;
}
function findSidebarInjectionRoot(itemsGroup) {
  const ownScrollable = smallestSettingsScrollable([itemsGroup]);
  if (ownScrollable) return ownScrollable;
  const descendantScrollable = smallestSettingsScrollable(
    Array.from(itemsGroup.querySelectorAll("div,nav,aside"))
  );
  if (descendantScrollable) return descendantScrollable;
  const ancestors = [];
  let node = itemsGroup.parentElement;
  for (let depth = 0; node && depth < 5; depth++) {
    ancestors.push(node);
    node = node.parentElement;
  }
  const ancestorScrollable = smallestSettingsScrollable(ancestors);
  if (ancestorScrollable) return ancestorScrollable;
  return itemsGroup.parentElement ?? itemsGroup;
}
function smallestSettingsScrollable(nodes) {
  let best = null;
  let bestArea = Number.POSITIVE_INFINITY;
  for (const node of nodes) {
    if (!node.classList.contains("overflow-y-auto")) continue;
    if (!isSettingsSidebarCandidate(node)) continue;
    const rect = node.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area < bestArea) {
      best = node;
      bestArea = area;
    }
  }
  return best;
}
function removeSettingsGroupsOutsideRoot(root) {
  const groups = document.querySelectorAll(
    "[data-codexpp='nav-group'], [data-codexpp='pages-group'], [data-codexpp='native-nav-header']"
  );
  for (const group of Array.from(groups)) {
    if (group.parentElement === root) continue;
    resetCodexPpInjectedSettingsGroupState(group);
    group.remove();
  }
}
function sidebarGroupHeader(text, trailing) {
  const header = document.createElement("div");
  header.className = "flex items-center justify-between gap-2 pr-0.5 pl-2 select-none";
  const label = document.createElement("span");
  label.className = "min-w-0 flex-1 truncate text-base text-token-input-placeholder-foreground opacity-75";
  label.textContent = text;
  header.appendChild(label);
  if (trailing) {
    const trailingWrap = document.createElement("div");
    trailingWrap.className = "shrink-0";
    trailingWrap.appendChild(trailing);
    header.appendChild(trailingWrap);
  }
  return header;
}
function sidebarGroupItems() {
  const items = document.createElement("div");
  items.dataset.codexpp = "group-items";
  items.className = "flex flex-col gap-px";
  return items;
}
function scheduleSettingsSurfaceHidden() {
  if (!state.settingsSurfaceVisible || state.settingsSurfaceHideTimer) return;
  state.settingsSurfaceHideTimer = setTimeout(() => {
    state.settingsSurfaceHideTimer = null;
    const sidebar = findSidebarItemsGroup();
    if (sidebar && isSettingsSidebarCandidate(sidebar)) return;
    if (isSettingsTextVisible()) return;
    setSettingsSurfaceVisible(false, "sidebar-not-found");
  }, 1500);
}
function isSettingsTextVisible() {
  return isCodexPpSettingsLabelSet(codexPpSettingsLabelsFrom(document));
}
function setSettingsSurfaceVisible(visible, reason) {
  if (state.settingsSurfaceVisible === visible) return;
  state.settingsSurfaceVisible = visible;
  if (visible) warmTweakStore();
  try {
    window.__codexppSettingsSurfaceVisible = visible;
    document.documentElement.dataset.codexppSettingsSurface = visible ? "true" : "false";
    window.dispatchEvent(
      new CustomEvent("codexpp:settings-surface", {
        detail: { visible, reason }
      })
    );
  } catch {
  }
  plog("settings surface", { visible, reason, url: location.href });
}
function syncPagesGroup() {
  const outer = state.sidebarRoot;
  if (!outer) return;
  if (!isSettingsSidebarCandidate(outer)) {
    state.sidebarRoot = null;
    state.pagesGroup = null;
    state.pagesGroupKey = null;
    for (const p of state.pages.values()) p.navButton = null;
    return;
  }
  const pages = [...state.pages.values()];
  const desiredKey = pages.length === 0 ? "EMPTY" : pages.map((p) => `${p.id}|${p.page.title}|${p.page.iconSvg ?? ""}`).join("\n");
  const groupAttached = !!state.pagesGroup && outer.contains(state.pagesGroup);
  if (state.pagesGroupKey === desiredKey && (pages.length === 0 ? !groupAttached : groupAttached)) {
    return;
  }
  if (pages.length === 0) {
    if (state.pagesGroup) {
      state.pagesGroup.remove();
      state.pagesGroup = null;
    }
    for (const p of state.pages.values()) p.navButton = null;
    state.pagesGroupKey = desiredKey;
    return;
  }
  let group = state.pagesGroup;
  if (!group || !outer.contains(group)) {
    group = document.createElement("div");
    group.dataset.codexpp = "pages-group";
    group.className = "flex flex-col gap-1";
    group.appendChild(sidebarGroupHeader("Tweaks"));
    group.appendChild(sidebarGroupItems());
    outer.appendChild(group);
    state.pagesGroup = group;
  }
  let items = group.querySelector(':scope > [data-codexpp="group-items"]');
  if (!items) {
    items = sidebarGroupItems();
    while (group.children.length > 1) items.appendChild(group.children[1]);
    group.appendChild(items);
  }
  items.replaceChildren();
  for (const p of pages) {
    const icon = p.page.iconSvg ?? defaultPageIconSvg();
    const btn = makeSidebarItem(p.page.title, icon);
    btn.dataset.codexpp = `nav-page-${p.id}`;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      activatePage({ kind: "registered", id: p.id });
    });
    p.navButton = btn;
    items.appendChild(btn);
  }
  state.pagesGroupKey = desiredKey;
  plog("pages group synced", {
    count: pages.length,
    ids: pages.map((p) => p.id)
  });
  setNavActive(state.activePage);
}
function makeSidebarItem(label, iconSvg) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.codexpp = `nav-${label.toLowerCase()}`;
  btn.setAttribute("aria-label", label);
  btn.className = "focus-visible:outline-token-border relative px-row-x py-row-y cursor-interaction shrink-0 items-center overflow-hidden rounded-lg text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 gap-2 flex w-full hover:bg-token-list-hover-background font-normal";
  const inner = document.createElement("div");
  inner.className = "flex min-w-0 items-center text-base gap-2 flex-1 text-token-foreground";
  appendSvgHtml(inner, iconSvg);
  const text = document.createElement("span");
  text.className = "truncate";
  text.textContent = label;
  inner.appendChild(text);
  btn.appendChild(inner);
  return btn;
}
function appendSidebarStoreUpdateBadge(btn) {
  const inner = btn.firstElementChild;
  if (!inner) return;
  const badge = document.createElement("span");
  badge.dataset.codexppStoreUpdateBadge = "true";
  badge.hidden = true;
  badge.title = "Installed tweaks with approved updates";
  badge.className = "inline-flex shrink-0 items-center justify-center";
  Object.assign(badge.style, {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: "1"
  });
  applyStoreUpdateBadgeStyle(badge, null);
  btn.appendChild(badge);
}
function setNavActive(active) {
  if (state.navButtons) {
    const builtin = active?.kind === "config" ? "config" : active?.kind === "tweaks" ? "tweaks" : active?.kind === "store" ? "store" : null;
    for (const [key, btn] of Object.entries(state.navButtons)) {
      applyNavActive(btn, key === builtin);
    }
  }
  for (const p of state.pages.values()) {
    if (!p.navButton) continue;
    const isActive = active?.kind === "registered" && active.id === p.id;
    applyNavActive(p.navButton, isActive);
  }
  syncCodexNativeNavActive(active !== null);
}
function syncCodexNativeNavActive(mute) {
  if (!mute) return;
  const root = state.sidebarRoot;
  if (!root) return;
  const buttons = Array.from(root.querySelectorAll("button"));
  for (const btn of buttons) {
    if (btn.dataset.codexpp) continue;
    if (btn.getAttribute("aria-current") === "page") {
      btn.removeAttribute("aria-current");
    }
    if (btn.classList.contains("bg-token-list-hover-background")) {
      btn.classList.remove("bg-token-list-hover-background");
      btn.classList.add("hover:bg-token-list-hover-background");
    }
  }
}
function applyNavActive(btn, active) {
  const inner = btn.firstElementChild;
  if (active) {
    btn.classList.remove("hover:bg-token-list-hover-background", "font-normal");
    btn.classList.add("bg-token-list-hover-background");
    btn.setAttribute("aria-current", "page");
    if (inner) {
      inner.classList.remove("text-token-foreground");
      inner.classList.add("text-token-list-active-selection-foreground");
      inner.querySelector("svg")?.classList.add("text-token-list-active-selection-icon-foreground");
    }
  } else {
    btn.classList.add("hover:bg-token-list-hover-background", "font-normal");
    btn.classList.remove("bg-token-list-hover-background");
    btn.removeAttribute("aria-current");
    if (inner) {
      inner.classList.add("text-token-foreground");
      inner.classList.remove("text-token-list-active-selection-foreground");
      inner.querySelector("svg")?.classList.remove("text-token-list-active-selection-icon-foreground");
    }
  }
}
function activatePage(page) {
  const content = findContentArea();
  if (!content) {
    plog("activate: content area not found");
    return;
  }
  state.activePage = page;
  plog("activate", { page });
  for (const child of Array.from(content.children)) {
    if (child.dataset.codexpp === "tweaks-panel") continue;
    if (child.dataset.codexppHidden === void 0) {
      child.dataset.codexppHidden = child.style.display || "";
    }
    child.style.display = "none";
  }
  let panel = content.querySelector('[data-codexpp="tweaks-panel"]');
  if (!panel) {
    panel = document.createElement("div");
    panel.dataset.codexpp = "tweaks-panel";
    panel.style.cssText = "width:100%;height:100%;overflow:auto;";
    content.appendChild(panel);
  }
  panel.style.display = "block";
  state.panelHost = panel;
  rerender();
  setNavActive(page);
  const sidebar = state.sidebarRoot;
  if (sidebar) {
    if (state.sidebarRestoreHandler) {
      sidebar.removeEventListener("click", state.sidebarRestoreHandler, true);
    }
    const handler = (e) => {
      const target = e.target;
      if (!target) return;
      if (state.navGroup?.contains(target)) return;
      if (state.pagesGroup?.contains(target)) return;
      if (target.closest("[data-codexpp-settings-search]")) return;
      restoreCodexView();
    };
    state.sidebarRestoreHandler = handler;
    sidebar.addEventListener("click", handler, true);
  }
}
function restoreCodexView() {
  plog("restore codex view");
  const content = findContentArea();
  if (!content) return;
  if (state.panelHost) state.panelHost.style.display = "none";
  for (const child of Array.from(content.children)) {
    if (child === state.panelHost) continue;
    if (child.dataset.codexppHidden !== void 0) {
      child.style.display = child.dataset.codexppHidden;
      delete child.dataset.codexppHidden;
    }
  }
  state.activePage = null;
  setNavActive(null);
  if (state.sidebarRoot && state.sidebarRestoreHandler) {
    state.sidebarRoot.removeEventListener(
      "click",
      state.sidebarRestoreHandler,
      true
    );
    state.sidebarRestoreHandler = null;
  }
}
function rerender() {
  if (!state.activePage) return;
  const host = state.panelHost;
  if (!host) return;
  host.replaceChildren();
  const ap = state.activePage;
  if (ap.kind === "registered") {
    const entry = state.pages.get(ap.id);
    if (!entry) {
      restoreCodexView();
      return;
    }
    const root2 = panelShell(entry.page.title, entry.page.description);
    host.appendChild(root2.outer);
    try {
      try {
        entry.teardown?.();
      } catch {
      }
      entry.teardown = null;
      const ret = entry.page.render(root2.sectionsWrap);
      if (typeof ret === "function") entry.teardown = ret;
    } catch (e) {
      const err = document.createElement("div");
      err.className = "text-token-charts-red text-sm";
      err.textContent = `Error rendering page: ${e.message}`;
      root2.sectionsWrap.appendChild(err);
    }
    return;
  }
  const title = ap.kind === "tweaks" ? "Tweaks" : ap.kind === "store" ? "Tweak Store" : "Codex++";
  const subtitle = ap.kind === "tweaks" ? "Manage your installed Codex++ tweaks." : ap.kind === "store" ? "Install reviewed tweaks pinned to approved GitHub commits." : "Checking installed Codex++ version.";
  const root = panelShell(title, subtitle);
  host.appendChild(root.outer);
  if (ap.kind === "tweaks") renderTweaksPage(root.sectionsWrap);
  else if (ap.kind === "store") renderTweakStorePage(root.sectionsWrap, root.headerActions);
  else renderConfigPage(root.sectionsWrap, root.subtitle);
}
function renderConfigPage(sectionsWrap, subtitle) {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-2";
  section.appendChild(sectionTitle("Codex++ Updates"));
  const card = roundedCard();
  card.dataset.codexppConfigCard = "true";
  const loading = rowSimple("Loading update settings", "Checking current Codex++ configuration.");
  card.appendChild(loading);
  section.appendChild(card);
  sectionsWrap.appendChild(section);
  void import_electron.ipcRenderer.invoke("codexpp:get-config").then((config) => {
    if (subtitle) {
      subtitle.textContent = `You have Codex++ ${config.version} installed.`;
    }
    card.textContent = "";
    renderCodexPlusPlusConfig(card, config);
  }).catch((e) => {
    if (subtitle) subtitle.textContent = "Could not load installed Codex++ version.";
    card.textContent = "";
    card.appendChild(rowSimple("Could not load update settings", String(e)));
  });
  const watcher = document.createElement("section");
  watcher.className = "flex flex-col gap-2";
  watcher.appendChild(sectionTitle("Auto-Repair Watcher"));
  const watcherCard = roundedCard();
  watcherCard.appendChild(rowSimple("Checking watcher", "Verifying the updater repair service."));
  watcher.appendChild(watcherCard);
  sectionsWrap.appendChild(watcher);
  renderWatcherHealthCard(watcherCard);
  const maintenance = document.createElement("section");
  maintenance.className = "flex flex-col gap-2";
  maintenance.appendChild(sectionTitle("Maintenance"));
  const maintenanceCard = roundedCard();
  maintenanceCard.appendChild(uninstallRow());
  maintenanceCard.appendChild(reportBugRow());
  maintenance.appendChild(maintenanceCard);
  sectionsWrap.appendChild(maintenance);
}
function renderCodexPlusPlusConfig(card, config) {
  setSidebarCodexPlusPlusUpdateButton(config.updateCheck);
  card.appendChild(autoUpdateRow(config));
  card.appendChild(updateChannelRow(config));
  card.appendChild(installationSourceRow(config.installationSource));
  card.appendChild(selfUpdateStatusRow(config.selfUpdate));
  card.appendChild(checkForUpdatesRow(config));
  if (config.updateCheck) card.appendChild(releaseNotesRow(config.updateCheck));
}
function autoUpdateRow(config) {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = "Automatically refresh Codex++";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = `Installed version v${config.version}. The watcher checks hourly and can refresh the Codex++ runtime automatically.`;
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  row.appendChild(
    switchControl(config.autoUpdate, async (next) => {
      await import_electron.ipcRenderer.invoke("codexpp:set-auto-update", next);
    })
  );
  return row;
}
function updateChannelRow(config) {
  const row = actionRow("Release channel", updateChannelSummary(config));
  const action = row.querySelector("[data-codexpp-row-actions]");
  const select = document.createElement("select");
  select.className = "h-8 rounded-lg border border-token-border bg-transparent px-2 text-sm text-token-text-primary focus:outline-none";
  for (const [value, label] of [
    ["stable", "Stable"],
    ["prerelease", "Prerelease"],
    ["custom", "Custom"]
  ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = config.updateChannel === value;
    select.appendChild(option);
  }
  select.addEventListener("change", () => {
    void import_electron.ipcRenderer.invoke("codexpp:set-update-config", { updateChannel: select.value }).then(() => refreshConfigCard(row)).catch((e) => plog("set update channel failed", String(e)));
  });
  action?.appendChild(select);
  if (config.updateChannel === "custom") {
    action?.appendChild(
      compactButton("Edit", () => {
        const repo = window.prompt("GitHub repo", config.updateRepo || "kpkhxlgy0/codex-plusplus");
        if (repo === null) return;
        const ref = window.prompt("Git ref", config.updateRef || "main");
        if (ref === null) return;
        void import_electron.ipcRenderer.invoke("codexpp:set-update-config", {
          updateChannel: "custom",
          updateRepo: repo,
          updateRef: ref
        }).then(() => refreshConfigCard(row)).catch((e) => plog("set custom update source failed", String(e)));
      })
    );
  }
  return row;
}
function installationSourceRow(source) {
  return rowSimple("Installation source", `${source.label}: ${source.detail}`);
}
function selfUpdateStatusRow(state2) {
  const row = rowSimple("Last Codex++ update", selfUpdateSummary(state2));
  const left = row.firstElementChild;
  if (left && state2) left.prepend(statusBadge(selfUpdateStatusTone(state2.status), selfUpdateStatusLabel(state2.status)));
  return row;
}
function checkForUpdatesRow(config) {
  const check = config.updateCheck;
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = check?.updateAvailable ? "Codex++ update available" : "Check for Codex++ updates";
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = updateSummary(check);
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-2";
  if (check?.releaseUrl) {
    actions.appendChild(
      compactButton("Release Notes", () => {
        void import_electron.ipcRenderer.invoke("codexpp:open-external", check.releaseUrl);
      })
    );
  }
  actions.appendChild(
    compactButton("Check Now", () => {
      row.style.opacity = "0.65";
      void import_electron.ipcRenderer.invoke("codexpp:check-codexpp-update", true).then((check2) => {
        setSidebarCodexPlusPlusUpdateButton(check2);
        refreshConfigCard(row);
      }).catch((e) => plog("Codex++ release check failed", String(e))).finally(() => {
        row.style.opacity = "";
      });
    })
  );
  actions.appendChild(
    compactButton("Download Update", () => {
      row.style.opacity = "0.65";
      const buttons = actions.querySelectorAll("button");
      buttons.forEach((button2) => button2.disabled = true);
      void import_electron.ipcRenderer.invoke("codexpp:run-codexpp-update").then(() => {
        refreshSidebarCodexPlusPlusUpdateButton(true);
        refreshConfigCard(row);
      }).catch((e) => {
        plog("Codex++ self-update failed", String(e));
        void refreshConfigCard(row);
      }).finally(() => {
        row.style.opacity = "";
        buttons.forEach((button2) => button2.disabled = false);
      });
    })
  );
  row.appendChild(actions);
  return row;
}
function releaseNotesRow(check) {
  const row = document.createElement("div");
  row.className = "flex flex-col gap-2 p-3";
  const title = document.createElement("div");
  title.className = "text-sm text-token-text-primary";
  title.textContent = "Latest release notes";
  row.appendChild(title);
  const body = document.createElement("div");
  body.className = "max-h-60 overflow-auto rounded-md border border-token-border bg-token-foreground/5 p-3 text-sm text-token-text-secondary";
  body.appendChild(renderReleaseNotesMarkdown(check.releaseNotes?.trim() || check.error || "No release notes available."));
  row.appendChild(body);
  return row;
}
function renderReleaseNotesMarkdown(markdown) {
  const root = document.createElement("div");
  root.className = "flex flex-col gap-2";
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let paragraph = [];
  let list = null;
  let codeLines = null;
  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const p = document.createElement("p");
    p.className = "m-0 leading-5";
    appendInlineMarkdown(p, paragraph.join(" ").trim());
    root.appendChild(p);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    root.appendChild(list);
    list = null;
  };
  const flushCode = () => {
    if (!codeLines) return;
    const pre = document.createElement("pre");
    pre.className = "m-0 overflow-auto rounded-md border border-token-border bg-token-foreground/10 p-2 text-xs text-token-text-primary";
    const code = document.createElement("code");
    code.textContent = codeLines.join("\n");
    pre.appendChild(code);
    root.appendChild(pre);
    codeLines = null;
  };
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (codeLines) flushCode();
      else {
        flushParagraph();
        flushList();
        codeLines = [];
      }
      continue;
    }
    if (codeLines) {
      codeLines.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList();
      const h = document.createElement(heading[1].length === 1 ? "h3" : "h4");
      h.className = "m-0 text-sm font-medium text-token-text-primary";
      appendInlineMarkdown(h, heading[2]);
      root.appendChild(h);
      continue;
    }
    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (unordered || ordered) {
      flushParagraph();
      const wantOrdered = Boolean(ordered);
      if (!list || wantOrdered && list.tagName !== "OL" || !wantOrdered && list.tagName !== "UL") {
        flushList();
        list = document.createElement(wantOrdered ? "ol" : "ul");
        list.className = wantOrdered ? "m-0 list-decimal space-y-1 pl-5 leading-5" : "m-0 list-disc space-y-1 pl-5 leading-5";
      }
      const li = document.createElement("li");
      appendInlineMarkdown(li, (unordered ?? ordered)?.[1] ?? "");
      list.appendChild(li);
      continue;
    }
    const quote = /^>\s?(.+)$/.exec(trimmed);
    if (quote) {
      flushParagraph();
      flushList();
      const blockquote = document.createElement("blockquote");
      blockquote.className = "m-0 border-l-2 border-token-border pl-3 leading-5";
      appendInlineMarkdown(blockquote, quote[1]);
      root.appendChild(blockquote);
      continue;
    }
    paragraph.push(trimmed);
  }
  flushParagraph();
  flushList();
  flushCode();
  return root;
}
function appendInlineMarkdown(parent, text) {
  const pattern = /(`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index === void 0) continue;
    appendText(parent, text.slice(lastIndex, match.index));
    if (match[2] !== void 0) {
      const code = document.createElement("code");
      code.className = "rounded border border-token-border bg-token-foreground/10 px-1 py-0.5 text-xs text-token-text-primary";
      code.textContent = match[2];
      parent.appendChild(code);
    } else if (match[3] !== void 0 && match[4] !== void 0) {
      const a = document.createElement("a");
      a.className = "text-token-text-primary underline underline-offset-2";
      a.href = match[4];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = match[3];
      parent.appendChild(a);
    } else if (match[5] !== void 0) {
      const strong = document.createElement("strong");
      strong.className = "font-medium text-token-text-primary";
      strong.textContent = match[5];
      parent.appendChild(strong);
    } else if (match[6] !== void 0) {
      const em = document.createElement("em");
      em.textContent = match[6];
      parent.appendChild(em);
    }
    lastIndex = match.index + match[0].length;
  }
  appendText(parent, text.slice(lastIndex));
}
function appendText(parent, text) {
  if (text) parent.appendChild(document.createTextNode(text));
}
function renderWatcherHealthCard(card) {
  void import_electron.ipcRenderer.invoke("codexpp:get-watcher-health").then((health) => {
    card.textContent = "";
    renderWatcherHealth(card, health);
  }).catch((e) => {
    card.textContent = "";
    card.appendChild(rowSimple("Could not check watcher", String(e)));
  });
}
function renderWatcherHealth(card, health) {
  card.appendChild(watcherSummaryRow(health));
  for (const check of health.checks) {
    if (check.status === "ok") continue;
    card.appendChild(watcherCheckRow(check));
  }
}
function watcherSummaryRow(health) {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 items-start gap-3";
  left.appendChild(statusBadge(health.status, health.watcher));
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = health.title;
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = `${health.summary} Checked ${new Date(health.checkedAt).toLocaleString()}.`;
  stack.appendChild(title);
  stack.appendChild(desc);
  left.appendChild(stack);
  row.appendChild(left);
  const action = document.createElement("div");
  action.className = "flex shrink-0 items-center gap-2";
  action.appendChild(
    compactButton("Check Now", () => {
      const card = row.parentElement;
      if (!card) return;
      card.textContent = "";
      card.appendChild(rowSimple("Checking watcher", "Verifying the updater repair service."));
      renderWatcherHealthCard(card);
    })
  );
  row.appendChild(action);
  return row;
}
function watcherCheckRow(check) {
  const row = rowSimple(check.name, check.detail);
  const left = row.firstElementChild;
  if (left) left.prepend(statusBadge(check.status));
  return row;
}
function statusBadge(status, label) {
  const badge = document.createElement("span");
  const tone = status === "ok" ? "border-token-charts-green text-token-charts-green" : status === "warn" ? "border-token-charts-yellow text-token-charts-yellow" : "border-token-charts-red text-token-charts-red";
  badge.className = `inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`;
  badge.textContent = label || (status === "ok" ? "OK" : status === "warn" ? "Review" : "Error");
  return badge;
}
function updateSummary(check) {
  if (!check) return "No update check has run yet.";
  const latest = check.latestVersion ? `Latest v${check.latestVersion}. ` : "";
  const checked = `Checked ${new Date(check.checkedAt).toLocaleString()}.`;
  if (check.error) return `${latest}${checked} ${check.error}`;
  return `${latest}${checked}`;
}
function updateChannelSummary(config) {
  if (config.updateChannel === "custom") {
    return `${config.updateRepo || "kpkhxlgy0/codex-plusplus"} ${config.updateRef || "(no ref set)"}`;
  }
  if (config.updateChannel === "prerelease") {
    return "Use the newest published GitHub release, including prereleases.";
  }
  return "Use the latest stable GitHub release.";
}
function selfUpdateSummary(state2) {
  if (!state2) return "No automatic Codex++ update has run yet.";
  const checked = new Date(state2.completedAt ?? state2.checkedAt).toLocaleString();
  const target = state2.latestVersion ? ` Target v${state2.latestVersion}.` : state2.targetRef ? ` Target ${state2.targetRef}.` : "";
  const source = state2.installationSource?.label ?? "unknown source";
  if (state2.status === "failed") return `Failed ${checked}.${target} ${state2.error ?? "Unknown error"}`;
  if (state2.status === "updated") return `Updated ${checked}.${target} Source: ${source}.`;
  if (state2.status === "up-to-date") return `Up to date ${checked}.${target} Source: ${source}.`;
  if (state2.status === "disabled") return `Skipped ${checked}; automatic refresh is disabled.`;
  return `Checking for updates. Source: ${source}.`;
}
function selfUpdateStatusTone(status) {
  if (status === "failed") return "error";
  if (status === "disabled" || status === "checking") return "warn";
  return "ok";
}
function selfUpdateStatusLabel(status) {
  if (status === "up-to-date") return "Up to date";
  if (status === "updated") return "Updated";
  if (status === "failed") return "Failed";
  if (status === "disabled") return "Disabled";
  return "Checking";
}
function refreshConfigCard(row) {
  const card = row.closest("[data-codexpp-config-card]");
  if (!card) return;
  card.textContent = "";
  card.appendChild(rowSimple("Refreshing", "Loading current Codex++ update status."));
  void import_electron.ipcRenderer.invoke("codexpp:get-config").then((config) => {
    card.textContent = "";
    renderCodexPlusPlusConfig(card, config);
  }).catch((e) => {
    card.textContent = "";
    card.appendChild(rowSimple("Could not refresh update settings", String(e)));
  });
}
function uninstallRow() {
  const row = actionRow(
    "Uninstall Codex++",
    "Copies the uninstall command. Run it from a terminal after quitting Codex."
  );
  const action = row.querySelector("[data-codexpp-row-actions]");
  action?.appendChild(
    compactButton("Copy Command", () => {
      void import_electron.ipcRenderer.invoke("codexpp:copy-text", "node ~/.codex-plusplus/source/packages/installer/dist/cli.js uninstall").catch((e) => plog("copy uninstall command failed", String(e)));
    })
  );
  return row;
}
function reportBugRow() {
  const row = actionRow(
    "Report a bug",
    "Open a GitHub issue with runtime, installer, or tweak-manager details."
  );
  const action = row.querySelector("[data-codexpp-row-actions]");
  action?.appendChild(
    compactButton("Open Issue", () => {
      const title = encodeURIComponent("[Bug]: ");
      const body = encodeURIComponent(
        [
          "## What happened?",
          "",
          "## Steps to reproduce",
          "1. ",
          "",
          "## Environment",
          "- Codex++ version: ",
          "- Codex app version: ",
          "- OS: ",
          "",
          "## Logs",
          "Attach relevant lines from the Codex++ log directory."
        ].join("\n")
      );
      void import_electron.ipcRenderer.invoke(
        "codexpp:open-external",
        `https://github.com/kpkhxlgy0/codex-plusplus/issues/new?title=${title}&body=${body}`
      );
    })
  );
  return row;
}
function actionRow(titleText, description) {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "min-w-0 text-sm text-token-text-primary";
  title.textContent = titleText;
  const desc = document.createElement("div");
  desc.className = "text-token-text-secondary min-w-0 text-sm";
  desc.textContent = description;
  left.appendChild(title);
  left.appendChild(desc);
  row.appendChild(left);
  const actions = document.createElement("div");
  actions.dataset.codexppRowActions = "true";
  actions.className = "flex shrink-0 items-center gap-2";
  row.appendChild(actions);
  return row;
}
function renderTweakStorePage(sectionsWrap, headerActions) {
  const section = document.createElement("section");
  section.className = "flex flex-col gap-4";
  const source = document.createElement("span");
  source.hidden = true;
  source.dataset.codexppStoreSource = "true";
  source.textContent = "Loading live registry";
  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-2";
  const refreshBtn = storeIconButton(refreshIconSvg(), "Refresh tweak store", () => {
    refreshBtn.disabled = true;
    updateStoreUpdateBadge(null);
    grid.textContent = "";
    renderTweakStoreGhostGrid(grid);
    refreshTweakStoreGrid(grid, source, refreshBtn, true);
  });
  actions.appendChild(refreshBtn);
  actions.appendChild(storeToolbarButton("Publish Tweak", openPublishTweakDialog, "primary"));
  if (headerActions) {
    headerActions.replaceChildren(actions);
  }
  const grid = document.createElement("div");
  grid.dataset.codexppStoreGrid = "true";
  grid.className = "grid gap-4";
  if (state.tweakStore) {
    grid.dataset.codexppStore = JSON.stringify(state.tweakStore);
    renderTweakStoreGrid(grid, source);
  } else {
    renderTweakStoreGhostGrid(grid);
  }
  section.appendChild(source);
  section.appendChild(grid);
  sectionsWrap.appendChild(section);
  refreshTweakStoreGrid(grid, source, refreshBtn);
}
function refreshTweakStoreGrid(grid, source, refreshBtn, force = false) {
  void getTweakStore(force).then((store) => {
    grid.dataset.codexppStore = JSON.stringify(store);
    renderTweakStoreGrid(grid, source);
  }).catch((e) => {
    grid.dataset.codexppStore = "";
    grid.removeAttribute("aria-busy");
    source.textContent = "Live registry unavailable";
    updateStoreUpdateBadge(null);
    grid.textContent = "";
    grid.appendChild(storeMessageCard("Could not load tweak store", String(e)));
  }).finally(() => {
    if (refreshBtn) refreshBtn.disabled = false;
  });
}
function warmTweakStore() {
  if (state.tweakStore || state.tweakStorePromise) return;
  void getTweakStore().then((store) => {
    updateStoreUpdateBadge(outdatedInstalledStoreCount(store.entries));
  });
}
function getTweakStore(force = false) {
  if (!force) {
    if (state.tweakStore) return Promise.resolve(state.tweakStore);
    if (state.tweakStorePromise) return state.tweakStorePromise;
  }
  state.tweakStoreError = null;
  const promise = import_electron.ipcRenderer.invoke("codexpp:get-tweak-store").then((store) => {
    state.tweakStore = store;
    return state.tweakStore;
  }).catch((e) => {
    state.tweakStoreError = e;
    throw e;
  }).finally(() => {
    if (state.tweakStorePromise === promise) state.tweakStorePromise = null;
  });
  state.tweakStorePromise = promise;
  return promise;
}
function renderTweakStoreGrid(grid, source) {
  const store = parseStoreDataset(grid);
  if (!store) return;
  const entries = store.entries;
  grid.removeAttribute("aria-busy");
  source.textContent = `Refreshed ${new Date(store.fetchedAt).toLocaleString()}`;
  updateStoreUpdateBadge(outdatedInstalledStoreCount(entries));
  grid.textContent = "";
  if (store.entries.length === 0) {
    grid.appendChild(storeMessageCard("No tweaks yet", "Use Publish Tweak to submit the first one."));
    return;
  }
  for (const entry of entries) grid.appendChild(tweakStoreCard(entry));
}
function parseStoreDataset(grid) {
  const raw = grid.dataset.codexppStore;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function tweakStoreCard(entry) {
  const shell = tweakStoreCardShell();
  const { card, left, stack, versions, actions } = shell;
  left.insertBefore(storeAvatar(entry), stack);
  const titleRow = tweakStoreTitleRow();
  const title = document.createElement("div");
  title.className = "min-w-0 text-lg font-semibold leading-7 text-token-foreground";
  title.textContent = entry.manifest.name;
  titleRow.appendChild(title);
  titleRow.appendChild(verifiedSafeBadge());
  stack.appendChild(titleRow);
  if (entry.manifest.description) {
    const desc = tweakStoreDescription();
    desc.textContent = entry.manifest.description;
    stack.appendChild(desc);
  }
  stack.appendChild(tweakStoreReadMoreButton(entry.repo));
  versions.appendChild(tweakStoreVersionBadge(entry));
  if (entry.releaseUrl) {
    actions.appendChild(
      compactButton("Release", () => {
        void import_electron.ipcRenderer.invoke("codexpp:open-external", entry.releaseUrl);
      })
    );
  }
  const hasUpdate = !!entry.installed && entry.installed.version !== entry.manifest.version;
  if (entry.installed && !hasUpdate) {
    actions.appendChild(storeStatusPill("Installed"));
  } else if (entry.platform && !entry.platform.compatible) {
    card.classList.add("opacity-70");
    actions.appendChild(storeStatusPill(platformLockedLabel(entry.platform)));
  } else if (entry.runtime && !entry.runtime.compatible) {
    card.classList.add("opacity-70");
    actions.appendChild(storeStatusPill(runtimeLockedLabel(entry.runtime)));
  } else {
    const installLabel = entry.installed ? "Update" : "Install";
    if (hasUpdate) actions.appendChild(storeStatusPill("Update available", "info"));
    const installButton = storeInstallButton(installLabel, (button2) => {
      const grid = card.closest("[data-codexpp-store-grid]");
      const source = grid?.parentElement?.querySelector("[data-codexpp-store-source]");
      showStoreButtonLoading(button2, entry.installed ? "Updating" : "Installing");
      actions.querySelectorAll("button").forEach((button3) => button3.disabled = true);
      void import_electron.ipcRenderer.invoke("codexpp:install-store-tweak", entry.id).then(() => {
        showStoreToast(`${entry.manifest.name} installed.`);
        showStoreButtonInstalled(button2);
        versions.replaceChildren(tweakStoreVersionBadge(entry, entry.manifest.version));
        updateStoreUpdateBadge(Math.max(0, currentStoreUpdateBadgeCount() - 1));
        setTimeout(() => {
          actions.replaceChildren(storeStatusPill("Installed"));
          if (grid && source) refreshTweakStoreGrid(grid, source, void 0, true);
        }, 900);
      }).catch((e) => {
        resetStoreInstallButton(button2, installLabel);
        actions.querySelectorAll("button").forEach((button3) => button3.disabled = false);
        showStoreCardMessage(card, String(e.message ?? e));
      });
    });
    actions.appendChild(installButton);
  }
  return card;
}
function platformLockedLabel(platform) {
  const supported = platform.supported ?? [];
  if (supported.includes("win32")) return "Windows only";
  if (supported.includes("darwin")) return "macOS only";
  if (supported.includes("linux")) return "Linux only";
  return "Unavailable";
}
function runtimeLockedLabel(runtime) {
  return runtime.required ? `Requires Codex++ ${runtime.required}` : "Requires newer Codex++";
}
function showStoreCardMessage(card, message) {
  card.querySelector("[data-codexpp-store-card-message]")?.remove();
  const notice = document.createElement("div");
  notice.dataset.codexppStoreCardMessage = "true";
  notice.className = "rounded-lg border border-token-border/50 bg-token-foreground/5 px-3 py-2 text-sm leading-5 text-token-description-foreground";
  notice.textContent = message;
  const actions = card.lastElementChild;
  if (actions) card.insertBefore(notice, actions);
  else card.appendChild(notice);
}
function tweakStoreCardShell() {
  const card = document.createElement("div");
  card.className = "border-token-border/40 flex min-h-[190px] flex-col justify-between gap-4 rounded-2xl border p-4 transition-colors hover:bg-token-foreground/5";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-1 items-start gap-3";
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-1 flex-col gap-2";
  left.appendChild(stack);
  card.appendChild(left);
  const footer = document.createElement("div");
  footer.className = "mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2";
  const versions = document.createElement("div");
  versions.className = "flex min-w-0 flex-1 items-center gap-2";
  footer.appendChild(versions);
  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center justify-end gap-2";
  footer.appendChild(actions);
  card.appendChild(footer);
  return { card, left, stack, versions, actions };
}
function tweakStoreTitleRow() {
  const titleRow = document.createElement("div");
  titleRow.className = "flex min-w-0 items-start justify-between gap-3";
  return titleRow;
}
function tweakStoreDescription() {
  const desc = document.createElement("div");
  desc.className = "line-clamp-3 min-w-0 text-sm leading-5 text-token-text-secondary";
  return desc;
}
function tweakStoreReadMoreButton(repo) {
  const readMore = document.createElement("button");
  readMore.type = "button";
  readMore.className = "inline-flex w-fit items-center gap-1 text-sm font-medium text-token-text-link-foreground hover:underline";
  readMore.textContent = "Read More";
  appendSvgHtml(
    readMore,
    `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3.5h6.5V10M12.25 3.75 4 12" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );
  readMore.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void import_electron.ipcRenderer.invoke("codexpp:open-external", `https://github.com/${repo}`);
  });
  return readMore;
}
function renderTweakStoreGhostGrid(grid) {
  grid.setAttribute("aria-busy", "true");
  grid.textContent = "";
  grid.appendChild(tweakStoreGhostCard());
}
function tweakStoreGhostCard() {
  const { card, left, stack, versions, actions } = tweakStoreCardShell();
  card.classList.add("pointer-events-none");
  card.setAttribute("aria-hidden", "true");
  left.insertBefore(storeAvatarGhost(), stack);
  const titleRow = tweakStoreTitleRow();
  const title = document.createElement("div");
  title.className = "min-w-0 text-lg font-semibold leading-7 text-token-foreground";
  title.appendChild(ghostBlock("my-1 h-5 w-44 rounded-md"));
  titleRow.appendChild(title);
  titleRow.appendChild(verifiedSafeGhostBadge());
  stack.appendChild(titleRow);
  const desc = tweakStoreDescription();
  desc.appendChild(ghostBlock("mt-1 h-3 w-full rounded"));
  desc.appendChild(ghostBlock("mt-2 h-3 w-11/12 rounded"));
  desc.appendChild(ghostBlock("mt-2 h-3 w-7/12 rounded"));
  stack.appendChild(desc);
  const readMore = tweakStoreReadMoreButton("");
  readMore.replaceChildren(ghostBlock("h-5 w-24 rounded"));
  stack.appendChild(readMore);
  versions.appendChild(storeVersionGhostBadge());
  actions.appendChild(storeStatusGhostPill());
  return card;
}
function storeAvatarGhost() {
  const avatar = document.createElement("div");
  avatar.className = "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-token-border-default bg-transparent text-token-description-foreground";
  avatar.appendChild(ghostBlock("h-full w-full"));
  return avatar;
}
function verifiedSafeGhostBadge() {
  const badge = verifiedSafeBadge();
  badge.replaceChildren(ghostBlock("h-[13px] w-[13px] rounded-sm"), ghostBlock("h-3 w-20 rounded"));
  return badge;
}
function storeStatusGhostPill() {
  const pill = storeStatusPill("Installed");
  pill.classList.add("animate-pulse");
  pill.style.color = "transparent";
  return pill;
}
function storeVersionGhostBadge() {
  const badge = storeVersionBadgeShell(false);
  badge.appendChild(ghostBlock("h-3 w-36 rounded"));
  return badge;
}
function ghostBlock(className) {
  const block = document.createElement("div");
  block.className = `animate-pulse bg-token-foreground/10 ${className}`;
  block.setAttribute("aria-hidden", "true");
  return block;
}
function storeAvatar(entry) {
  const avatar = document.createElement("div");
  avatar.className = "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-token-border-default bg-transparent text-token-description-foreground";
  const initial = (entry.manifest.name?.[0] ?? "?").toUpperCase();
  const fallback = document.createElement("span");
  fallback.textContent = initial;
  avatar.appendChild(fallback);
  const iconUrl = storeEntryIconUrl(entry);
  if (iconUrl) {
    const img = document.createElement("img");
    img.alt = "";
    img.className = "h-full w-full object-cover";
    img.style.display = "none";
    img.addEventListener("load", () => {
      fallback.remove();
      img.style.display = "";
    });
    img.addEventListener("error", () => {
      img.remove();
    });
    img.src = iconUrl;
    avatar.appendChild(img);
  }
  return avatar;
}
function storeEntryIconUrl(entry) {
  const iconUrl = entry.manifest.iconUrl?.trim();
  if (!iconUrl) return null;
  if (/^(https?:|data:)/i.test(iconUrl)) return iconUrl;
  const rel = iconUrl.replace(/^\.?\//, "");
  if (!rel || rel.startsWith("../")) return null;
  return `https://raw.githubusercontent.com/${entry.repo}/${entry.approvedCommitSha}/${rel}`;
}
function sidebarUpdatePillButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.dataset.codexppSidebarUpdate = "true";
  btn.className = "user-select-none no-drag cursor-interaction inline-flex shrink-0 items-center justify-center whitespace-nowrap";
  Object.assign(btn.style, {
    display: "none",
    height: "20px",
    borderRadius: "9999px",
    border: "0",
    background: "#0A84FF",
    color: "#FFFFFF",
    padding: "0 8px",
    fontSize: "10px",
    fontWeight: "700",
    lineHeight: "20px",
    letterSpacing: "0",
    textTransform: "none",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18)"
  });
  btn.textContent = "Update";
  btn.title = "Open Codex++ update";
  btn.addEventListener("mouseenter", () => {
    btn.style.background = "#0071E3";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.background = "#0A84FF";
  });
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void import_electron.ipcRenderer.invoke("codexpp:open-external", btn.dataset.codexppReleaseUrl || CODEX_PLUSPLUS_RELEASES_URL);
  });
  return btn;
}
function refreshSidebarCodexPlusPlusUpdateButton(force = false) {
  const btn = state.codexPlusPlusUpdateButton;
  if (!btn) return;
  void import_electron.ipcRenderer.invoke("codexpp:check-codexpp-update", force).then((check) => setSidebarCodexPlusPlusUpdateButton(check)).catch((e) => {
    plog("Codex++ sidebar release check failed", String(e));
    setSidebarCodexPlusPlusUpdateButton(null);
  });
}
function setSidebarCodexPlusPlusUpdateButton(check) {
  const btn = state.codexPlusPlusUpdateButton;
  if (!btn) return;
  const updateAvailable = check?.updateAvailable === true;
  btn.style.display = updateAvailable ? "inline-flex" : "none";
  btn.hidden = !updateAvailable;
  btn.dataset.codexppReleaseUrl = check?.releaseUrl || CODEX_PLUSPLUS_RELEASES_URL;
  btn.title = updateAvailable && check?.latestVersion ? `Open Codex++ ${check.latestVersion} update` : "Open Codex++ update";
}
function updateStoreUpdateBadge(count) {
  const badge = document.querySelector("[data-codexpp-store-update-badge]");
  if (!badge) return;
  badge.dataset.codexppStoreUpdateCount = count === null ? "" : String(count);
  applyStoreUpdateBadgeStyle(badge, count);
  badge.hidden = count === null || count <= 0;
  badge.textContent = count && count > 0 ? String(count) : "";
  badge.title = count && count > 0 ? `${count} installed tweak${count === 1 ? "" : "s"} can be updated` : "Installed tweaks are up to date";
}
function applyStoreUpdateBadgeStyle(badge, count) {
  const hasUpdates = !!count && count > 0;
  Object.assign(badge.style, {
    minWidth: "24px",
    height: "20px",
    borderRadius: "9999px",
    border: "0",
    background: hasUpdates ? "#0A84FF" : "transparent",
    color: "#FFFFFF",
    padding: "0 7px",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "20px",
    letterSpacing: "0",
    boxShadow: hasUpdates ? "0 1px 2px rgba(0, 0, 0, 0.22)" : "none"
  });
}
function currentStoreUpdateBadgeCount() {
  const badge = document.querySelector("[data-codexpp-store-update-badge]");
  const raw = badge?.dataset.codexppStoreUpdateCount;
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}
function outdatedInstalledStoreCount(entries) {
  return entries.filter((entry) => !!entry.installed && entry.installed.version !== entry.manifest.version).length;
}
function storeToolbarButton(label, onClick, variant = "secondary") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = variant === "primary" ? "border-token-border user-select-none no-drag cursor-interaction flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border border-token-border bg-token-bg-fog px-2 py-0 text-sm text-token-button-tertiary-foreground enabled:hover:bg-token-list-hover-background disabled:cursor-not-allowed disabled:opacity-40" : "border-token-border user-select-none no-drag cursor-interaction flex h-8 items-center gap-1 whitespace-nowrap rounded-lg border border-transparent bg-token-foreground/5 px-2 py-0 text-sm text-token-foreground enabled:hover:bg-token-foreground/10 disabled:cursor-not-allowed disabled:opacity-40";
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}
function storeIconButton(iconSvg, label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "border-token-border user-select-none no-drag cursor-interaction flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-token-foreground/5 p-0 text-token-foreground enabled:hover:bg-token-foreground/10 disabled:cursor-not-allowed disabled:opacity-40";
  appendSvgHtml(btn, iconSvg);
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}
function verifiedSafeBadge() {
  const badge = document.createElement("span");
  badge.className = "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md border border-token-border/30 bg-transparent px-2 text-xs font-medium text-token-description-foreground";
  appendSvgHtml(
    badge,
    `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" class="text-blue-500" aria-hidden="true"><path d="M7 1.75 11.25 3.4v3.2c0 2.6-1.65 4.25-4.25 5.4-2.6-1.15-4.25-2.8-4.25-5.4V3.4L7 1.75Z" stroke="currentColor" stroke-width="1.15" stroke-linejoin="round"/><path d="M4.85 7.05 6.3 8.45l2.85-3.05" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );
  const text = document.createElement("span");
  text.textContent = "Verified as safe";
  badge.appendChild(text);
  return badge;
}
function tweakStoreVersionBadge(entry, installedOverride) {
  const installed = installedOverride ?? entry.installed?.version ?? null;
  const latest = entry.manifest.version;
  const hasUpdate = !!installed && installed !== latest;
  const badge = storeVersionBadgeShell(hasUpdate);
  const label = document.createElement("span");
  label.className = "truncate";
  label.textContent = installed ? `Installed v${installed} \xB7 Latest v${latest}` : `Latest v${latest}`;
  badge.title = installed ? `Installed version ${installed}. Latest approved version ${latest}.` : `Latest approved version ${latest}.`;
  badge.appendChild(label);
  return badge;
}
function storeVersionBadgeShell(hasUpdate) {
  const badge = document.createElement("span");
  badge.className = [
    "inline-flex h-8 min-w-0 max-w-full items-center rounded-lg border px-2.5 text-xs font-medium",
    hasUpdate ? "border-blue-500/30 bg-blue-500/10 text-token-foreground" : "border-token-border/40 bg-token-foreground/5 text-token-description-foreground"
  ].join(" ");
  return badge;
}
function storeStatusPill(label, tone = "neutral") {
  const pill = document.createElement("span");
  pill.className = [
    "inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium",
    tone === "info" ? "border border-blue-500/30 bg-blue-500/10 text-token-foreground" : "bg-token-foreground/5 text-token-description-foreground"
  ].join(" ");
  pill.textContent = label;
  return pill;
}
function storeInstallButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = storeInstallButtonClass();
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(btn);
  });
  return btn;
}
function storeInstallButtonClass(extra = "") {
  return [
    "border-token-border user-select-none no-drag cursor-interaction flex h-8 min-w-[82px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-500/40 bg-blue-500 px-3 py-0 text-sm font-medium text-token-foreground shadow-sm transition-colors enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-80",
    extra
  ].filter(Boolean).join(" ");
}
function showStoreButtonLoading(button2, label) {
  button2.className = storeInstallButtonClass();
  button2.disabled = true;
  button2.setAttribute("aria-busy", "true");
  button2.replaceChildren();
  appendSvgHtml(
    button2,
    `<svg class="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="2" opacity=".25"/><path d="M13.5 8A5.5 5.5 0 0 0 8 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
  );
  const text = document.createElement("span");
  text.textContent = label;
  button2.appendChild(text);
}
function showStoreButtonInstalled(button2) {
  button2.className = storeInstallButtonClass("border-blue-500 bg-blue-500");
  button2.disabled = true;
  button2.removeAttribute("aria-busy");
  button2.replaceChildren();
  appendSvgHtml(
    button2,
    `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.75 8.15 6.65 11 12.25 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  );
  const text = document.createElement("span");
  text.textContent = "Installed";
  button2.appendChild(text);
}
function resetStoreInstallButton(button2, label) {
  button2.className = storeInstallButtonClass();
  button2.disabled = false;
  button2.removeAttribute("aria-busy");
  button2.textContent = label;
}
function showStoreToast(message) {
  let host = document.querySelector("[data-codexpp-store-toast-host]");
  if (!host) {
    host = document.createElement("div");
    host.dataset.codexppStoreToastHost = "true";
    host.className = "pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-2";
    document.body.appendChild(host);
  }
  const toast = document.createElement("div");
  toast.className = "translate-y-2 rounded-xl border border-token-border/50 bg-token-main-surface-primary px-3 py-2 text-sm font-medium text-token-foreground opacity-0 shadow-lg transition-all duration-200";
  toast.textContent = message;
  host.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });
  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => {
      toast.remove();
      if (host && host.childElementCount === 0) host.remove();
    }, 220);
  }, 2600);
}
function storeMessageCard(title, description) {
  const card = document.createElement("div");
  card.className = "border-token-border/40 flex min-h-[84px] flex-col justify-center gap-1 rounded-2xl border p-4 text-sm";
  const t = document.createElement("div");
  t.className = "font-medium text-token-text-primary";
  t.textContent = title;
  card.appendChild(t);
  if (description) {
    const d = document.createElement("div");
    d.className = "text-token-text-secondary";
    d.textContent = description;
    card.appendChild(d);
  }
  return card;
}
function renderTweaksPage(sectionsWrap) {
  const openBtn = openInPlaceButton("Open Tweaks Folder", () => {
    void import_electron.ipcRenderer.invoke("codexpp:reveal", tweaksPath());
  });
  const reloadBtn = openInPlaceButton("Force Reload", () => {
    void import_electron.ipcRenderer.invoke("codexpp:reload-tweaks").catch((e) => plog("force reload (main) failed", String(e))).finally(() => {
      location.reload();
    });
  });
  const reloadSvg = reloadBtn.querySelector("svg");
  if (reloadSvg) {
    const icon = svgElement(
      `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-2xs" aria-hidden="true"><path d="M4 10a6 6 0 0 1 10.24-4.24L16 7.5M16 4v3.5h-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10a6 6 0 0 1-10.24 4.24L4 12.5M4 16v-3.5h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    );
    if (icon) reloadSvg.replaceWith(icon);
  }
  const trailing = document.createElement("div");
  trailing.className = "flex items-center gap-2";
  trailing.appendChild(reloadBtn);
  trailing.appendChild(openBtn);
  if (state.listedTweaks.length === 0) {
    const section = document.createElement("section");
    section.className = "flex flex-col gap-2";
    section.appendChild(sectionTitle("Installed Tweaks", trailing));
    const card2 = roundedCard();
    card2.appendChild(
      rowSimple(
        "No tweaks installed",
        `Drop a tweak folder into ${tweaksPath()} and reload.`
      )
    );
    section.appendChild(card2);
    sectionsWrap.appendChild(section);
    return;
  }
  const sectionsByTweak = /* @__PURE__ */ new Map();
  for (const s of state.sections.values()) {
    const tweakId = s.id.split(":")[0];
    if (!sectionsByTweak.has(tweakId)) sectionsByTweak.set(tweakId, []);
    sectionsByTweak.get(tweakId).push(s);
  }
  const pagesByTweak = /* @__PURE__ */ new Map();
  for (const p of state.pages.values()) {
    if (!pagesByTweak.has(p.tweakId)) pagesByTweak.set(p.tweakId, []);
    pagesByTweak.get(p.tweakId).push(p);
  }
  const wrap = document.createElement("section");
  wrap.className = "flex flex-col gap-2";
  wrap.appendChild(sectionTitle("Installed Tweaks", trailing));
  const card = roundedCard();
  for (const t of state.listedTweaks) {
    card.appendChild(
      tweakRow(
        t,
        sectionsByTweak.get(t.manifest.id) ?? [],
        pagesByTweak.get(t.manifest.id) ?? []
      )
    );
  }
  wrap.appendChild(card);
  sectionsWrap.appendChild(wrap);
}
function tweakRow(t, sections, pages) {
  const m = t.manifest;
  const cell = document.createElement("div");
  cell.className = "flex flex-col";
  if (!t.enabled) cell.style.opacity = "0.7";
  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 flex-1 items-start gap-3";
  const avatar = document.createElement("div");
  avatar.className = "flex shrink-0 items-center justify-center rounded-md border border-token-border overflow-hidden text-token-text-secondary";
  avatar.style.width = "56px";
  avatar.style.height = "56px";
  avatar.style.backgroundColor = "var(--color-token-bg-fog, transparent)";
  if (m.iconUrl) {
    const img = document.createElement("img");
    img.alt = "";
    img.className = "size-full object-contain";
    const initial = (m.name?.[0] ?? "?").toUpperCase();
    const fallback = document.createElement("span");
    fallback.className = "text-xl font-medium";
    fallback.textContent = initial;
    avatar.appendChild(fallback);
    img.style.display = "none";
    img.addEventListener("load", () => {
      fallback.remove();
      img.style.display = "";
    });
    img.addEventListener("error", () => {
      img.remove();
    });
    void resolveIconUrl(m.iconUrl, t.dir).then((url) => {
      if (url) img.src = url;
      else img.remove();
    });
    avatar.appendChild(img);
  } else {
    const initial = (m.name?.[0] ?? "?").toUpperCase();
    const span = document.createElement("span");
    span.className = "text-xl font-medium";
    span.textContent = initial;
    avatar.appendChild(span);
  }
  left.appendChild(avatar);
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-col gap-0.5";
  const titleRow = document.createElement("div");
  titleRow.className = "flex items-center gap-2";
  const name = document.createElement("div");
  name.className = "min-w-0 text-sm font-medium text-token-text-primary";
  name.textContent = m.name;
  titleRow.appendChild(name);
  if (m.version) {
    const ver = document.createElement("span");
    ver.className = "text-token-text-secondary text-xs font-normal tabular-nums";
    ver.textContent = `v${m.version}`;
    titleRow.appendChild(ver);
  }
  if (t.update?.updateAvailable) {
    const badge = document.createElement("span");
    badge.className = "rounded-full border border-token-border bg-token-foreground/5 px-2 py-0.5 text-[11px] font-medium text-token-text-primary";
    badge.textContent = "Update Available";
    titleRow.appendChild(badge);
  }
  stack.appendChild(titleRow);
  if (m.description) {
    const desc = document.createElement("div");
    desc.className = "text-token-text-secondary min-w-0 text-sm";
    desc.textContent = m.description;
    stack.appendChild(desc);
  }
  const meta = document.createElement("div");
  meta.className = "flex items-center gap-2 text-xs text-token-text-secondary";
  const authorEl = renderAuthor(m.author);
  if (authorEl) meta.appendChild(authorEl);
  if (m.githubRepo) {
    if (meta.children.length > 0) meta.appendChild(dot());
    const repo = document.createElement("button");
    repo.type = "button";
    repo.className = "inline-flex text-token-text-link-foreground hover:underline";
    repo.textContent = m.githubRepo;
    repo.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void import_electron.ipcRenderer.invoke("codexpp:open-external", `https://github.com/${m.githubRepo}`);
    });
    meta.appendChild(repo);
  }
  if (m.homepage) {
    if (meta.children.length > 0) meta.appendChild(dot());
    const link = document.createElement("a");
    link.href = m.homepage;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "inline-flex text-token-text-link-foreground hover:underline";
    link.textContent = "Homepage";
    meta.appendChild(link);
  }
  if (meta.children.length > 0) stack.appendChild(meta);
  if (m.tags && m.tags.length > 0) {
    const tagsRow = document.createElement("div");
    tagsRow.className = "flex flex-wrap items-center gap-1 pt-0.5";
    for (const tag of m.tags) {
      const pill = document.createElement("span");
      pill.className = "rounded-full border border-token-border bg-token-foreground/5 px-2 py-0.5 text-[11px] text-token-text-secondary";
      pill.textContent = tag;
      tagsRow.appendChild(pill);
    }
    stack.appendChild(tagsRow);
  }
  left.appendChild(stack);
  header.appendChild(left);
  const right = document.createElement("div");
  right.className = "flex shrink-0 items-center gap-2 pt-0.5";
  if (t.enabled && pages.length > 0) {
    const configureBtn = compactButton("Configure", () => {
      activatePage({ kind: "registered", id: pages[0].id });
    });
    configureBtn.title = pages.length === 1 ? `Open ${pages[0].page.title}` : `Open ${pages.map((p) => p.page.title).join(", ")}`;
    right.appendChild(configureBtn);
  }
  if (t.update?.updateAvailable && t.update.releaseUrl) {
    right.appendChild(
      compactButton("Review Release", () => {
        void import_electron.ipcRenderer.invoke("codexpp:open-external", t.update.releaseUrl);
      })
    );
  }
  right.appendChild(
    switchControl(t.enabled, async (next) => {
      await import_electron.ipcRenderer.invoke("codexpp:set-tweak-enabled", m.id, next);
    })
  );
  header.appendChild(right);
  cell.appendChild(header);
  if (t.enabled && sections.length > 0) {
    const nested = document.createElement("div");
    nested.className = "flex flex-col divide-y-[0.5px] divide-token-border border-t-[0.5px] border-token-border";
    for (const s of sections) {
      const body = document.createElement("div");
      body.className = "p-3";
      try {
        s.render(body);
      } catch (e) {
        body.textContent = `Error rendering tweak section: ${e.message}`;
      }
      nested.appendChild(body);
    }
    cell.appendChild(nested);
  }
  return cell;
}
function renderAuthor(author) {
  if (!author) return null;
  const wrap = document.createElement("span");
  wrap.className = "inline-flex items-center gap-1";
  if (typeof author === "string") {
    wrap.textContent = `by ${author}`;
    return wrap;
  }
  wrap.appendChild(document.createTextNode("by "));
  if (author.url) {
    const a = document.createElement("a");
    a.href = author.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.className = "inline-flex text-token-text-link-foreground hover:underline";
    a.textContent = author.name;
    wrap.appendChild(a);
  } else {
    const span = document.createElement("span");
    span.textContent = author.name;
    wrap.appendChild(span);
  }
  return wrap;
}
function openPublishTweakDialog() {
  const existing = document.querySelector("[data-codexpp-publish-dialog]");
  existing?.remove();
  const overlay = document.createElement("div");
  overlay.dataset.codexppPublishDialog = "true";
  overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4";
  const dialog = document.createElement("div");
  dialog.className = "flex w-full max-w-xl flex-col gap-4 rounded-lg border border-token-border bg-token-main-surface-primary p-4 shadow-xl";
  overlay.appendChild(dialog);
  const header = document.createElement("div");
  header.className = "flex items-start justify-between gap-3";
  const titleStack = document.createElement("div");
  titleStack.className = "flex min-w-0 flex-col gap-1";
  const title = document.createElement("div");
  title.className = "text-base font-medium text-token-text-primary";
  title.textContent = "Publish Tweak";
  const subtitle = document.createElement("div");
  subtitle.className = "text-sm text-token-text-secondary";
  subtitle.textContent = "Submit a GitHub repo for admin review. Codex++ records the exact commit admins must review and pin.";
  titleStack.appendChild(title);
  titleStack.appendChild(subtitle);
  header.appendChild(titleStack);
  header.appendChild(compactButton("Dismiss", () => overlay.remove()));
  dialog.appendChild(header);
  const repoInput = document.createElement("input");
  repoInput.type = "text";
  repoInput.placeholder = "owner/repo or https://github.com/owner/repo";
  repoInput.className = "h-10 rounded-lg border border-token-border bg-transparent px-3 text-sm text-token-text-primary focus:outline-none";
  dialog.appendChild(repoInput);
  const status = document.createElement("div");
  status.className = "min-h-5 text-sm text-token-text-secondary";
  status.textContent = "The manifest should include an iconUrl suitable for the store.";
  dialog.appendChild(status);
  const actions = document.createElement("div");
  actions.className = "flex items-center justify-end gap-2";
  const submit = compactButton("Open Review Issue", () => {
    void submitPublishTweak(repoInput, status);
  });
  actions.appendChild(submit);
  dialog.appendChild(actions);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  repoInput.focus();
}
async function submitPublishTweak(repoInput, status) {
  status.className = "min-h-5 text-sm text-token-text-secondary";
  status.textContent = "Resolving the repo commit to review.";
  try {
    const submission = await import_electron.ipcRenderer.invoke(
      "codexpp:prepare-tweak-store-submission",
      repoInput.value
    );
    const url = buildTweakPublishIssueUrl(submission);
    await import_electron.ipcRenderer.invoke("codexpp:open-external", url);
    status.textContent = `GitHub review issue opened for ${submission.commitSha.slice(0, 7)}.`;
  } catch (e) {
    status.className = "min-h-5 text-sm text-token-charts-red";
    status.textContent = String(e.message ?? e);
  }
}
function panelShell(title, subtitle, options) {
  const outer = document.createElement("div");
  outer.className = "main-surface flex h-full min-h-0 flex-col";
  const toolbar = document.createElement("div");
  toolbar.className = "draggable flex items-center px-panel electron:h-toolbar extension:h-toolbar-sm";
  outer.appendChild(toolbar);
  const scroll = document.createElement("div");
  scroll.className = "flex-1 overflow-y-auto p-panel";
  outer.appendChild(scroll);
  const inner = document.createElement("div");
  inner.className = options?.wide ? "mx-auto flex w-full max-w-5xl flex-col electron:min-w-[calc(320px*var(--codex-window-zoom))]" : "mx-auto flex w-full flex-col max-w-2xl electron:min-w-[calc(320px*var(--codex-window-zoom))]";
  scroll.appendChild(inner);
  const headerWrap = document.createElement("div");
  headerWrap.className = "flex items-center justify-between gap-3 pb-panel";
  const headerInner = document.createElement("div");
  headerInner.className = "flex min-w-0 flex-1 flex-col gap-1.5 pb-panel";
  const titleLine = document.createElement("div");
  titleLine.className = "flex min-w-0 items-center gap-2";
  const heading = document.createElement("div");
  heading.className = "electron:heading-lg heading-base truncate";
  heading.textContent = title;
  titleLine.appendChild(heading);
  const headerTitleActions = document.createElement("div");
  headerTitleActions.className = "flex shrink-0 items-center gap-2";
  titleLine.appendChild(headerTitleActions);
  headerInner.appendChild(titleLine);
  let subtitleElement;
  if (subtitle) {
    const sub = document.createElement("div");
    sub.className = "text-token-text-secondary text-sm";
    sub.textContent = subtitle;
    headerInner.appendChild(sub);
    subtitleElement = sub;
  }
  headerWrap.appendChild(headerInner);
  const headerActions = document.createElement("div");
  headerActions.className = "flex shrink-0 items-center gap-2";
  headerWrap.appendChild(headerActions);
  inner.appendChild(headerWrap);
  const sectionsWrap = document.createElement("div");
  sectionsWrap.className = "flex flex-col gap-[var(--padding-panel)]";
  inner.appendChild(sectionsWrap);
  return { outer, sectionsWrap, subtitle: subtitleElement, headerActions, headerTitleActions };
}
function sectionTitle(text, trailing) {
  const titleRow = document.createElement("div");
  titleRow.className = "flex h-toolbar items-center justify-between gap-2 px-0 py-0";
  const titleInner = document.createElement("div");
  titleInner.className = "flex min-w-0 flex-1 flex-col gap-1";
  const t = document.createElement("div");
  t.className = "text-base font-medium text-token-text-primary";
  t.textContent = text;
  titleInner.appendChild(t);
  titleRow.appendChild(titleInner);
  if (trailing) {
    const right = document.createElement("div");
    right.className = "flex items-center gap-2";
    right.appendChild(trailing);
    titleRow.appendChild(right);
  }
  return titleRow;
}
function openInPlaceButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "border-token-border user-select-none no-drag cursor-interaction flex items-center gap-1 border whitespace-nowrap focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 rounded-lg text-token-description-foreground enabled:hover:bg-token-list-hover-background data-[state=open]:bg-token-list-hover-background border-transparent h-token-button-composer px-2 py-0 text-base leading-[18px]";
  btn.textContent = label;
  appendSvgHtml(
    btn,
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon-2xs" aria-hidden="true"><path d="M14.3349 13.3301V6.60645L5.47065 15.4707C5.21095 15.7304 4.78895 15.7304 4.52925 15.4707C4.26955 15.211 4.26955 14.789 4.52925 14.5293L13.3935 5.66504H6.66011C6.29284 5.66504 5.99507 5.36727 5.99507 5C5.99507 4.63273 6.29284 4.33496 6.66011 4.33496H14.9999L15.1337 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V13.3301C15.6649 13.6973 15.3672 13.9951 14.9999 13.9951C14.6327 13.9951 14.335 13.6973 14.3349 13.3301Z" fill="currentColor"></path></svg>`
  );
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}
function compactButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "border-token-border user-select-none no-drag cursor-interaction inline-flex h-8 items-center whitespace-nowrap rounded-lg border px-2 text-sm text-token-text-primary enabled:hover:bg-token-list-hover-background disabled:cursor-not-allowed disabled:opacity-40";
  btn.textContent = label;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  });
  return btn;
}
function roundedCard() {
  const card = document.createElement("div");
  card.className = "border-token-border flex flex-col divide-y-[0.5px] divide-token-border rounded-lg border";
  card.setAttribute(
    "style",
    "background-color: var(--color-background-panel, var(--color-token-bg-fog));"
  );
  return card;
}
function rowSimple(title, description) {
  const row = document.createElement("div");
  row.className = "flex items-center justify-between gap-4 p-3";
  const left = document.createElement("div");
  left.className = "flex min-w-0 items-center gap-3";
  const stack = document.createElement("div");
  stack.className = "flex min-w-0 flex-col gap-1";
  if (title) {
    const t = document.createElement("div");
    t.className = "min-w-0 text-sm text-token-text-primary";
    t.textContent = title;
    stack.appendChild(t);
  }
  if (description) {
    const d = document.createElement("div");
    d.className = "text-token-text-secondary min-w-0 text-sm";
    d.textContent = description;
    stack.appendChild(d);
  }
  left.appendChild(stack);
  row.appendChild(left);
  return row;
}
function switchControl(initial, onChange) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("role", "switch");
  const pill = document.createElement("span");
  const knob = document.createElement("span");
  knob.className = "rounded-full border border-[color:var(--gray-0)] bg-[color:var(--gray-0)] shadow-sm transition-transform duration-200 ease-out h-4 w-4";
  pill.appendChild(knob);
  const apply = (on) => {
    btn.setAttribute("aria-checked", String(on));
    btn.dataset.state = on ? "checked" : "unchecked";
    btn.className = "inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-token-focus-border focus-visible:rounded-full cursor-interaction";
    pill.className = `relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-out h-5 w-8 ${on ? "bg-token-charts-blue" : "bg-token-foreground/20"}`;
    pill.dataset.state = on ? "checked" : "unchecked";
    knob.dataset.state = on ? "checked" : "unchecked";
    knob.style.transform = on ? "translateX(14px)" : "translateX(2px)";
  };
  apply(initial);
  btn.appendChild(pill);
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const next = btn.getAttribute("aria-checked") !== "true";
    apply(next);
    btn.disabled = true;
    try {
      await onChange(next);
    } finally {
      btn.disabled = false;
    }
  });
  return btn;
}
function dot() {
  const s = document.createElement("span");
  s.className = "text-token-description-foreground";
  s.textContent = "\xB7";
  return s;
}
async function resolveIconUrl(url, tweakDir) {
  if (/^(https?:|data:)/.test(url)) return url;
  const rel = url.startsWith("./") ? url.slice(2) : url;
  try {
    return await import_electron.ipcRenderer.invoke(
      "codexpp:read-tweak-asset",
      tweakDir,
      rel
    );
  } catch (e) {
    plog("icon load failed", { url, tweakDir, err: String(e) });
    return null;
  }
}
function findSidebarItemsGroup() {
  const cached = cachedSidebarItemsGroup();
  if (cached) return cached;
  const candidates = Array.from(
    document.querySelectorAll("aside,nav,[role='navigation'],div")
  );
  let best = null;
  let bestScore = -1;
  let bestArea = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    if (candidate.dataset.codexpp) continue;
    if (!isSettingsSidebarCandidate(candidate)) continue;
    const labels = codexPpSettingsLabelsFrom(candidate);
    const score = codexPpSettingsLabelScore(labels);
    const rect = candidate.getBoundingClientRect();
    const area = rect.width * rect.height;
    const weighted = score.core * 100 + score.total;
    if (weighted > bestScore || weighted === bestScore && area < bestArea) {
      best = candidate;
      bestScore = weighted;
      bestArea = area;
    }
  }
  return best;
}
function cachedSidebarItemsGroup() {
  const candidates = [
    state.sidebarRoot,
    state.navGroup?.parentElement ?? null,
    state.pagesGroup?.parentElement ?? null
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (!candidate.isConnected) continue;
    if (isSettingsSidebarCandidate(candidate)) return candidate;
  }
  return null;
}
function removeMisplacedSettingsGroups() {
  const groups = document.querySelectorAll(
    "[data-codexpp='nav-group'], [data-codexpp='pages-group'], [data-codexpp='native-nav-header']"
  );
  for (const group of Array.from(groups)) {
    if (isCodexPpInjectedSettingsGroupPlacementValid(group)) continue;
    resetCodexPpInjectedSettingsGroupState(group);
    group.remove();
  }
}
function isCodexPpInjectedSettingsGroupPlacementValid(group) {
  if (isForbiddenSettingsSidebarSurface(group)) return false;
  let node = group.parentElement;
  for (let depth = 0; node && depth < 4; depth++) {
    if (isForbiddenSettingsSidebarSurface(node)) return false;
    if (isSettingsSidebarCandidate(node)) return true;
    node = node.parentElement;
  }
  return false;
}
function resetCodexPpInjectedSettingsGroupState(group) {
  if (state.navGroup === group || state.navGroup && group.contains(state.navGroup)) {
    state.navGroup = null;
    state.navButtons = null;
    state.codexPlusPlusUpdateButton = null;
  }
  if (state.pagesGroup === group || state.pagesGroup && group.contains(state.pagesGroup)) {
    state.pagesGroup = null;
    state.pagesGroupKey = null;
    for (const p of state.pages.values()) p.navButton = null;
  }
  if (state.nativeNavHeader === group || state.nativeNavHeader && group.contains(state.nativeNavHeader)) {
    state.nativeNavHeader = null;
  }
  if (state.sidebarRoot && state.sidebarRoot.contains(group)) {
    state.sidebarRoot = null;
  }
}
function findContentArea() {
  const sidebar = findSidebarItemsGroup();
  if (!sidebar) return null;
  let parent = sidebar.parentElement;
  while (parent) {
    for (const child of Array.from(parent.children)) {
      if (child === sidebar || child.contains(sidebar)) continue;
      const r = child.getBoundingClientRect();
      if (r.width > 300 && r.height > 200) return child;
    }
    parent = parent.parentElement;
  }
  return null;
}
function maybeDumpDom() {
  try {
    const sidebar = findSidebarItemsGroup();
    if (sidebar && !state.sidebarDumped) {
      state.sidebarDumped = true;
      if (isSettingsDomDumpEnabled()) {
        const sbRoot = sidebar.parentElement ?? sidebar;
        plog(`codex sidebar HTML`, sbRoot.outerHTML.slice(0, 32e3));
      }
    }
    const content = findContentArea();
    if (!content) {
      if (state.fingerprint !== location.href) {
        state.fingerprint = location.href;
        plog("dom probe (no content)", {
          url: location.href,
          sidebar: sidebar ? describe(sidebar) : null
        });
      }
      return;
    }
    let panel = null;
    for (const child of Array.from(content.children)) {
      if (child.dataset.codexpp === "tweaks-panel") continue;
      if (child.style.display === "none") continue;
      panel = child;
      break;
    }
    const activeNav = sidebar ? Array.from(sidebar.querySelectorAll("button, a")).find(
      (b) => b.getAttribute("aria-current") === "page" || b.getAttribute("data-active") === "true" || b.getAttribute("aria-selected") === "true" || b.classList.contains("active")
    ) : null;
    const heading = panel?.querySelector(
      "h1, h2, h3, [class*='heading']"
    );
    const fingerprint = `${activeNav?.textContent ?? ""}|${heading?.textContent ?? ""}|${panel?.children.length ?? 0}`;
    if (state.fingerprint === fingerprint) return;
    state.fingerprint = fingerprint;
    plog("dom probe", {
      url: location.href,
      activeNav: activeNav?.textContent?.trim() ?? null,
      heading: heading?.textContent?.trim() ?? null,
      content: describe(content)
    });
    if (panel && isSettingsDomDumpEnabled()) {
      const html = panel.outerHTML;
      plog(
        `codex panel HTML (${activeNav?.textContent?.trim() ?? "?"})`,
        html.slice(0, 32e3)
      );
    }
  } catch (e) {
    plog("dom probe failed", String(e));
  }
}
function isSettingsDomDumpEnabled() {
  return window.__codexppDumpSettingsDom === true;
}
function describe(el) {
  return {
    tag: el.tagName,
    cls: el.className.slice(0, 120),
    id: el.id || void 0,
    children: el.children.length,
    rect: (() => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    })()
  };
}
function tweaksPath() {
  return window.__codexpp_tweaks_dir__ ?? "<user dir>/tweaks";
}

// src/preload/tweak-host.ts
var import_electron2 = require("electron");

// src/preload/element-waiter.ts
var elementWaiters = /* @__PURE__ */ new Set();
var observer = null;
var frame = null;
function waitForElement(selector, timeoutMs = 5e3) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    const waiter = {
      selector,
      resolve,
      reject,
      timer: setTimeout(() => {
        elementWaiters.delete(waiter);
        reject(new Error(`timeout waiting for ${selector}`));
        disconnectIfIdle();
      }, Math.max(0, timeoutMs))
    };
    elementWaiters.add(waiter);
    ensureObserver();
  });
}
function cancelAllElementWaiters(reason) {
  for (const waiter of Array.from(elementWaiters)) {
    clearTimeout(waiter.timer);
    elementWaiters.delete(waiter);
    waiter.reject(new Error(`${reason}: ${waiter.selector}`));
  }
  disconnectIfIdle();
}
function ensureObserver() {
  if (observer) return;
  observer = new MutationObserver(() => {
    scheduleCheck();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
function scheduleCheck() {
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    checkWaiters();
  });
}
function checkWaiters() {
  for (const waiter of Array.from(elementWaiters)) {
    const el = document.querySelector(waiter.selector);
    if (!el) continue;
    clearTimeout(waiter.timer);
    elementWaiters.delete(waiter);
    waiter.resolve(el);
  }
  disconnectIfIdle();
}
function disconnectIfIdle() {
  if (elementWaiters.size > 0) return;
  if (frame !== null) {
    cancelAnimationFrame(frame);
    frame = null;
  }
  observer?.disconnect();
  observer = null;
}

// src/preload/tweak-module-loader.ts
var MODULE_FILE_EXTENSIONS = [".js", ".cjs", ".json"];
var MODULE_INDEX_FILES = ["index.js", "index.cjs", "index.json"];
function createTweakModuleLoader(options) {
  const tweakDir = normalizeAbsolutePath(options.dir);
  const entry = normalizeAbsolutePath(options.entry);
  const moduleCache = /* @__PURE__ */ new Map();
  assertInsideTweakDir(tweakDir, entry);
  const loadModule = (filename, sourceOverride) => {
    const resolved = normalizeAbsolutePath(filename);
    assertInsideTweakDir(tweakDir, resolved);
    const existing = moduleCache.get(resolved);
    if (existing) return existing.exports;
    if (resolved.endsWith(".json")) {
      const source2 = sourceOverride ?? options.readSource(resolved);
      const module3 = createModuleRecord(resolved, JSON.parse(source2));
      module3.loaded = true;
      moduleCache.set(resolved, module3);
      return module3.exports;
    }
    const module2 = createModuleRecord(resolved, {});
    moduleCache.set(resolved, module2);
    const source = sourceOverride ?? options.readSource(resolved);
    const localRequire = makeRequire(resolved);
    try {
      const fn = new Function(
        "module",
        "exports",
        "require",
        "__filename",
        "__dirname",
        "console",
        `${source}
//# sourceURL=${sourceUrl(options.manifestId, resolved)}`
      );
      fn(module2, module2.exports, localRequire, resolved, module2.dirname, options.console ?? console);
      module2.loaded = true;
      return module2.exports;
    } catch (error) {
      moduleCache.delete(resolved);
      throw error;
    }
  };
  const resolveModule = (request, parentFilename) => {
    if (!isRelativeRequest(request)) {
      if (options.fallbackRequire) return request;
      throw new Error(
        `Renderer tweak require only supports relative files; bundle dependency "${request}" into the tweak entry`
      );
    }
    const base = dirnamePath(parentFilename);
    const target = normalizeAbsolutePath(joinPath(base, request));
    assertInsideTweakDir(tweakDir, target);
    for (const candidate of moduleCandidates(target)) {
      try {
        options.readSource(candidate);
        return candidate;
      } catch {
      }
    }
    throw new Error(`Cannot find module "${request}" from ${parentFilename}`);
  };
  const makeRequire = (parentFilename) => {
    const requireFn = ((request) => {
      if (!isRelativeRequest(request)) {
        if (options.fallbackRequire) return options.fallbackRequire(request);
        throw new Error(
          `Renderer tweak require only supports relative files; bundle dependency "${request}" into the tweak entry`
        );
      }
      const filename = resolveModule(request, parentFilename);
      return loadModule(filename);
    });
    requireFn.resolve = (request) => resolveModule(request, parentFilename);
    return requireFn;
  };
  return {
    loadEntry(sourceOverride) {
      return loadModule(entry, sourceOverride);
    },
    resolve(request, parentFilename = entry) {
      return resolveModule(request, parentFilename);
    }
  };
}
function createModuleRecord(filename, exports2) {
  return {
    id: filename,
    filename,
    dirname: dirnamePath(filename),
    exports: exports2,
    loaded: false
  };
}
function moduleCandidates(target) {
  const ext = extensionOf(target);
  if (ext) return [target];
  return [
    target,
    ...MODULE_FILE_EXTENSIONS.map((extension) => `${target}${extension}`),
    ...MODULE_INDEX_FILES.map((file) => `${target}/${file}`)
  ];
}
function isRelativeRequest(request) {
  return request === "." || request === ".." || request.startsWith("./") || request.startsWith("../");
}
function sourceUrl(manifestId, filename) {
  return `codexpp-tweak://${encodeURIComponent(manifestId)}/${encodeURIComponent(filename)}`;
}
function assertInsideTweakDir(tweakDir, filename) {
  if (!isPathInsideOrEqual(tweakDir, filename)) {
    throw new Error("path outside tweak dir");
  }
}
function isPathInsideOrEqual(parent, child) {
  const parentPath = normalizeForCompare(parent);
  const childPath = normalizeForCompare(child);
  return childPath === parentPath || childPath.startsWith(`${parentPath}/`);
}
function normalizeForCompare(value) {
  const normalized = normalizeAbsolutePath(value).replace(/\/+$/, "");
  return /^[A-Za-z]:\//.test(normalized) ? normalized.toLowerCase() : normalized;
}
function normalizeAbsolutePath(input) {
  const normalized = String(input || "").replace(/\\/g, "/");
  let prefix = "";
  let rest = normalized;
  const driveMatch = rest.match(/^([A-Za-z]:)(?:\/|$)/);
  if (driveMatch) {
    prefix = driveMatch[1] ?? "";
    rest = rest.slice(prefix.length);
  } else if (rest.startsWith("/")) {
    prefix = "/";
    rest = rest.slice(1);
  }
  const parts = [];
  for (const part of rest.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (parts.length > 0) parts.pop();
      else throw new Error("path traversal");
      continue;
    }
    parts.push(part);
  }
  if (prefix === "/") return `/${parts.join("/")}`;
  if (prefix) return `${prefix}/${parts.join("/")}`.replace(/\/$/, "/");
  return parts.join("/");
}
function joinPath(base, request) {
  return `${base.replace(/\/+$/, "")}/${request}`;
}
function dirnamePath(filename) {
  const normalized = normalizeAbsolutePath(filename);
  const index = normalized.lastIndexOf("/");
  if (index <= 0) return normalized.startsWith("/") ? "/" : ".";
  return normalized.slice(0, index);
}
function extensionOf(filename) {
  const basename = filename.slice(filename.lastIndexOf("/") + 1);
  const index = basename.lastIndexOf(".");
  return index > 0 ? basename.slice(index) : "";
}

// src/preload/main-sidebar-actions.ts
var MAIN_SIDEBAR_ACTION_LABELS = [
  "New chat",
  "Quick chat",
  "Search",
  "Plugins",
  "Automations",
  "Automation"
].map(normalizeLabel);
var records = /* @__PURE__ */ new Map();
var mutedNativeActiveElements = /* @__PURE__ */ new Map();
var observer2 = null;
var delegatedEventsInstalled = false;
var refreshTimer = null;
function rendererSidebarApi(tweakId) {
  return {
    registerAction(options) {
      return registerSidebarAction(tweakId, options);
    }
  };
}
function disposeSidebarActionsForTweak(tweakId) {
  for (const record of Array.from(records.values())) {
    if (record.tweakId === tweakId) disposeRecord(record);
  }
  stopObserverIfIdle();
}
function registerSidebarAction(tweakId, options) {
  const normalized = normalizeOptions(options);
  const key = `${tweakId}:${normalized.id}`;
  const existing = records.get(key);
  if (existing) {
    existing.options = normalized;
    renderRecord(existing);
    syncNativeSidebarActiveState();
    return actionRef(existing);
  }
  const record = {
    tweakId,
    id: normalized.id,
    key,
    options: normalized,
    node: null,
    listener: null
  };
  records.set(key, record);
  ensureObserver2();
  scheduleSidebarRefresh();
  return actionRef(record);
}
function actionRef(record) {
  return {
    id: record.id,
    update(update) {
      const merged = normalizeOptions({ ...record.options, ...update, id: record.id });
      record.options = merged;
      renderRecord(record);
      syncNativeSidebarActiveState();
      scheduleSidebarRefresh();
    },
    setActive(active) {
      record.options = { ...record.options, active };
      renderRecord(record);
      syncNativeSidebarActiveState();
    },
    dispose() {
      disposeRecord(record);
      stopObserverIfIdle();
    }
  };
}
function normalizeOptions(options) {
  const id = cleanString(options.id);
  const label = cleanString(options.label);
  if (!id) throw new Error("sidebar action id is required");
  if (!label) throw new Error("sidebar action label is required");
  return {
    id,
    label,
    tooltip: cleanString(options.tooltip) || label,
    placement: options.placement === "start" ? "start" : "end",
    order: Number.isFinite(options.order) ? Number(options.order) : 50,
    active: options.active === true,
    iconSvg: cleanString(options.iconSvg) || void 0,
    onClick: options.onClick
  };
}
function ensureObserver2() {
  if (observer2 || typeof document === "undefined") return;
  observer2 = new MutationObserver(() => scheduleSidebarRefresh());
  observer2.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleSidebarRefresh, { passive: true });
  ensureDelegatedSidebarEvents();
}
function stopObserverIfIdle() {
  if (records.size > 0) return;
  observer2?.disconnect();
  observer2 = null;
  window.removeEventListener("resize", scheduleSidebarRefresh);
  removeDelegatedSidebarEvents();
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}
function ensureDelegatedSidebarEvents() {
  if (delegatedEventsInstalled || typeof document === "undefined") return;
  delegatedEventsInstalled = true;
  document.addEventListener("click", onDelegatedSidebarActionClick, true);
  document.addEventListener("keydown", onDelegatedSidebarActionKeydown, true);
}
function removeDelegatedSidebarEvents() {
  if (!delegatedEventsInstalled || typeof document === "undefined") return;
  delegatedEventsInstalled = false;
  document.removeEventListener("click", onDelegatedSidebarActionClick, true);
  document.removeEventListener("keydown", onDelegatedSidebarActionKeydown, true);
}
function onDelegatedSidebarActionClick(event) {
  const action = sidebarActionNodeForEvent(event);
  if (!action) return;
  const record = records.get(action.dataset.codexppSidebarAction || "");
  if (!record) return;
  event.preventDefault();
  event.stopPropagation();
  void record.options.onClick?.(event);
}
function onDelegatedSidebarActionKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const action = sidebarActionNodeForEvent(event);
  if (!action) return;
  event.preventDefault();
  event.stopPropagation();
  interactiveTarget(action).click();
}
function sidebarActionNodeForEvent(event) {
  const target = eventTargetElement(event);
  const action = target?.closest("[data-codexpp-sidebar-action]");
  return domElement(action);
}
function eventTargetElement(event) {
  return domElement(event.target);
}
function domElement(value) {
  if (!value || typeof value !== "object") return null;
  const element = value;
  if (typeof element.closest !== "function") return null;
  if (typeof element.getAttribute !== "function") return null;
  return element;
}
function scheduleSidebarRefresh() {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refreshSidebarActions();
  }, 120);
}
function refreshSidebarActions() {
  if (!records.size) return;
  const slot = findMainSidebarActionSlot();
  if (!slot) return;
  const sorted = sortedRecords();
  for (const record of sorted) {
    if (!record.node || !record.node.isConnected || record.node.parentElement !== slot.container) {
      record.node?.remove();
      record.node = createActionNode(slot.template, record);
    }
    renderRecord(record);
  }
  for (const record of sorted) {
    if (record.node?.parentElement === slot.container) record.node.remove();
  }
  let anchor = slot.insertAfter;
  for (const record of sorted.filter((item) => item.options.placement === "start")) {
    if (!record.node) continue;
    slot.container.insertBefore(record.node, anchor ? anchor.nextSibling : slot.container.firstChild);
    anchor = record.node;
  }
  for (const record of sorted.filter((item) => item.options.placement === "end")) {
    if (!record.node) continue;
    slot.container.insertBefore(record.node, anchor ? anchor.nextSibling : slot.container.firstChild);
    anchor = record.node;
  }
  syncNativeSidebarActiveState();
}
function sortedRecords() {
  return Array.from(records.values()).sort(
    (a, b) => a.options.order - b.options.order || a.key.localeCompare(b.key)
  );
}
function createActionNode(template, record) {
  const node = template.cloneNode(true);
  sanitizeActionNode(node);
  node.dataset.codexppSidebarAction = record.key;
  return node;
}
function renderRecord(record) {
  const node = record.node;
  if (!node) return;
  const target = interactiveTarget(node);
  node.dataset.codexppSidebarAction = record.key;
  node.dataset.codexppSidebarActionActive = record.options.active ? "true" : "false";
  if (target !== node) target.dataset.codexppSidebarActionActive = record.options.active ? "true" : "false";
  applyPlacementStyle(node, record);
  target.setAttribute("aria-label", record.options.label);
  target.setAttribute("title", record.options.tooltip);
  target.setAttribute("role", "button");
  target.setAttribute("tabindex", "0");
  setActiveAttributes(node, record.options.active);
  if (target !== node) setActiveAttributes(target, record.options.active);
  applyNativeLikeActiveStyle(target, record.options.active);
  replaceActionIcon(node, record.options.iconSvg);
  replaceActionLabel(node, record.options.label);
  applyNativeLikeActiveStyle(target, record.options.active);
}
function disposeRecord(record) {
  record.node?.remove();
  record.node = null;
  records.delete(record.key);
  syncNativeSidebarActiveState();
}
function applyPlacementStyle(node, record) {
  if (record.options.placement === "start") {
    node.style.order = String(-1e4 + record.options.order);
  } else {
    node.style.removeProperty("order");
  }
}
function findMainSidebarActionSlot(root = document) {
  const aside = Array.from(root.querySelectorAll?.("aside") ?? []).find((candidate) => candidate instanceof HTMLElement && !!visibleBox(candidate));
  if (!aside) return null;
  const controls = visibleControls(aside).map((control) => ({ control, label: normalizeLabel(controlLabel(control)) })).filter((item) => MAIN_SIDEBAR_ACTION_LABELS.some((marker) => labelMatches(item.label, marker)));
  if (!controls.length) return null;
  const sortedControls = controls.map((item) => item.control).sort(compareDocumentPosition);
  const templateControl = sortedControls[0];
  if (!templateControl) return null;
  const group = actionGroupFor(aside, sortedControls);
  const template = rowInGroup(group, templateControl);
  const rows = sortedControls.map((control) => rowInGroup(group, control)).filter(Boolean);
  const sortedRows = rows.sort(compareDocumentPosition);
  const insertBefore = sortedRows[0] ?? template;
  const insertAfter = sortedRows.at(-1) ?? template;
  return { container: group, template, insertBefore, insertAfter };
}
function visibleControls(root) {
  return Array.from(root.querySelectorAll("button,a,[role='button'],[role='link']")).filter((control) => {
    if (control.closest("[data-codexpp-sidebar-action]")) return false;
    const label = controlLabel(control);
    if (!label) return false;
    const box = visibleBox(control);
    return !!box;
  });
}
function actionGroupFor(aside, controls) {
  const first = controls[0];
  if (!first) return aside;
  let node = first.parentElement;
  while (node && node !== aside) {
    const childRows = controls.map((control) => childInContainer(node, control)).filter(Boolean);
    if (new Set(childRows).size >= Math.min(2, controls.length)) return node;
    node = node.parentElement;
  }
  return first.parentElement || aside;
}
function rowInGroup(group, control) {
  let node = control;
  while (node.parentElement && node.parentElement !== group) node = node.parentElement;
  return node;
}
function childInContainer(container, control) {
  let node = control;
  while (node.parentElement && node.parentElement !== container) node = node.parentElement;
  return node.parentElement === container ? node : null;
}
function sanitizeActionNode(node) {
  const all = [node, ...Array.from(node.querySelectorAll("*"))];
  for (const el of all) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("data-app-action")) el.removeAttribute(attr.name);
      if (attr.name === "href" || attr.name === "aria-current") el.removeAttribute(attr.name);
    }
    if (el instanceof HTMLButtonElement) el.type = "button";
  }
}
function interactiveTarget(node) {
  if (matchesControl(node)) return node;
  return node.querySelector("button,a,[role='button'],[role='link']") || node;
}
function matchesControl(node) {
  return node.matches("button,a,[role='button'],[role='link']");
}
function setActiveAttributes(node, active) {
  if (active) {
    node.setAttribute("aria-current", "page");
    node.setAttribute("aria-selected", "true");
    node.setAttribute("data-state", "active");
    node.setAttribute("data-active", "true");
    node.setAttribute("data-selected", "true");
  } else {
    node.removeAttribute("aria-current");
    node.removeAttribute("aria-selected");
    node.removeAttribute("data-state");
    node.removeAttribute("data-active");
    node.removeAttribute("data-selected");
  }
}
function applyNativeLikeActiveStyle(target, active) {
  const content = activeContentElement(target);
  const icon = target.querySelector("svg");
  if (active) {
    target.classList.remove("hover:bg-token-list-hover-background", "font-normal");
    target.classList.add("bg-token-list-hover-background");
    content?.classList.remove("text-token-foreground");
    content?.classList.add("text-token-list-active-selection-foreground");
    icon?.classList.add("text-token-list-active-selection-icon-foreground");
  } else {
    target.classList.add("hover:bg-token-list-hover-background", "font-normal");
    target.classList.remove("bg-token-list-hover-background");
    content?.classList.add("text-token-foreground");
    content?.classList.remove("text-token-list-active-selection-foreground");
    icon?.classList.remove("text-token-list-active-selection-icon-foreground");
  }
}
function activeContentElement(target) {
  const tokenElement = target.querySelector(
    ".text-token-foreground,.text-token-list-active-selection-foreground"
  );
  if (tokenElement) return tokenElement;
  return target.firstElementChild instanceof HTMLElement ? target.firstElementChild : target;
}
function syncNativeSidebarActiveState() {
  if (hasActiveRecord()) muteNativeSidebarActiveState();
  else restoreNativeSidebarActiveState();
}
function hasActiveRecord() {
  return Array.from(records.values()).some((record) => record.options.active && record.node?.isConnected);
}
function muteNativeSidebarActiveState(root = document) {
  const aside = Array.from(root.querySelectorAll?.("aside") ?? []).find((candidate) => candidate instanceof HTMLElement && !!visibleBox(candidate));
  if (!aside) return;
  const controls = Array.from(
    aside.querySelectorAll("button,a,[role='button'],[role='link']")
  );
  for (const control of controls) {
    if (control.closest("[data-codexpp-sidebar-action]")) continue;
    if (!isNativeActiveControl(control)) continue;
    muteNativeActiveElement(control);
    for (const child of activeSelectionDescendants(control)) muteNativeActiveElement(child);
  }
}
function restoreNativeSidebarActiveState() {
  for (const [element, state2] of Array.from(mutedNativeActiveElements.entries())) {
    if (element.isConnected) {
      element.className = state2.className;
      restoreNullableAttribute(element, "aria-current", state2.ariaCurrent);
      restoreNullableAttribute(element, "aria-selected", state2.ariaSelected);
      restoreNullableAttribute(element, "data-state", state2.dataState);
      restoreNullableAttribute(element, "data-active", state2.dataActive);
      restoreNullableAttribute(element, "data-selected", state2.dataSelected);
    }
    mutedNativeActiveElements.delete(element);
  }
}
function muteNativeActiveElement(element) {
  if (!mutedNativeActiveElements.has(element)) {
    mutedNativeActiveElements.set(element, {
      className: element.className,
      ariaCurrent: element.getAttribute("aria-current"),
      ariaSelected: element.getAttribute("aria-selected"),
      dataState: element.getAttribute("data-state"),
      dataActive: element.getAttribute("data-active"),
      dataSelected: element.getAttribute("data-selected")
    });
  }
  element.removeAttribute("aria-current");
  element.removeAttribute("aria-selected");
  element.removeAttribute("data-state");
  element.removeAttribute("data-active");
  element.removeAttribute("data-selected");
  element.classList.remove(
    "active",
    "bg-token-list-hover-background",
    "text-token-list-active-selection-foreground",
    "text-token-list-active-selection-icon-foreground"
  );
  if (matchesControl(element)) element.classList.add("hover:bg-token-list-hover-background", "font-normal");
}
function activeSelectionDescendants(control) {
  return Array.from(
    control.querySelectorAll(
      ".bg-token-list-hover-background,.text-token-list-active-selection-foreground,.text-token-list-active-selection-icon-foreground"
    )
  );
}
function isNativeActiveControl(control) {
  return control.getAttribute("aria-current") === "page" || control.getAttribute("aria-selected") === "true" || control.getAttribute("data-state") === "active" || control.getAttribute("data-active") === "true" || control.getAttribute("data-selected") === "true" || control.classList.contains("active") || control.classList.contains("bg-token-list-hover-background") || activeSelectionDescendants(control).length > 0;
}
function restoreNullableAttribute(element, name, value) {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}
function replaceActionIcon(node, iconSvg) {
  const svg = parseSvg(iconSvg || defaultSidebarIconSvg());
  const current = node.querySelector("svg");
  if (current && svg) {
    copyIconPresentation(current, svg);
    current.replaceWith(svg);
    return;
  }
  if (svg) node.prepend(svg);
}
function copyIconPresentation(from, to) {
  for (const attr of ["class", "style", "width", "height"]) {
    const value = from.getAttribute(attr);
    if (value) to.setAttribute(attr, value);
  }
  if (!to.getAttribute("width") && !to.getAttribute("class")) to.setAttribute("width", "16");
  if (!to.getAttribute("height") && !to.getAttribute("class")) to.setAttribute("height", "16");
}
function replaceActionLabel(node, label) {
  const textNodes = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const current = walker.currentNode;
    if (current instanceof Text && cleanString(current.textContent)) textNodes.push(current);
  }
  if (textNodes.length) {
    textNodes[0].textContent = label;
    for (const extra of textNodes.slice(1)) removeAccessoryTextNode(extra, node);
    return;
  }
  const span = document.createElement("span");
  span.textContent = label;
  node.appendChild(span);
}
function removeAccessoryTextNode(text, root) {
  const original = cleanString(text.textContent);
  let node = text.parentElement;
  while (node && node !== root) {
    const content = cleanString(node.textContent);
    const hasGraphic = !!node.querySelector("svg,img");
    if (content === original && !hasGraphic) {
      node.remove();
      return;
    }
    node = node.parentElement;
  }
  text.textContent = "";
}
function parseSvg(svgText) {
  const template = document.createElement("template");
  template.innerHTML = svgText.trim();
  const svg = template.content.querySelector("svg");
  if (!(svg instanceof SVGElement)) return null;
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}
function defaultSidebarIconSvg() {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5"></path><path d="M6 10.5V20h12v-9.5"></path><path d="M10 20v-5h4v5"></path></svg>';
}
function controlLabel(el) {
  return cleanString(el.getAttribute("aria-label")) || cleanString(el.getAttribute("title")) || cleanString(el.textContent);
}
function labelMatches(label, marker) {
  return label === marker || label.includes(marker);
}
function normalizeLabel(value) {
  return cleanString(value).toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’‘`´]/g, "'").replace(/\s+/g, " ");
}
function cleanString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
function visibleBox(el) {
  if (!el.isConnected) return null;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}
function compareDocumentPosition(a, b) {
  if (a === b) return 0;
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

// src/preload/tweak-host.ts
var loaded = /* @__PURE__ */ new Map();
var messageFromViewTransformers = /* @__PURE__ */ new Set();
installBridgeHooks();
async function startTweakHost() {
  const tweaks = await import_electron2.ipcRenderer.invoke("codexpp:list-tweaks");
  const paths = await import_electron2.ipcRenderer.invoke("codexpp:user-paths");
  setListedTweaks(tweaks);
  window.__codexpp_tweaks_dir__ = paths.tweaksDir;
  for (const t of tweaks) {
    if (t.manifest.scope === "main") continue;
    if (!t.entryExists) continue;
    if (!t.enabled) continue;
    try {
      await loadTweak(t, paths);
    } catch (e) {
      console.error("[codex-plusplus] tweak load failed:", t.manifest.id, e);
      try {
        import_electron2.ipcRenderer.send(
          "codexpp:preload-log",
          "error",
          "tweak load failed: " + t.manifest.id + ": " + String(e?.stack ?? e)
        );
      } catch {
      }
    }
  }
  console.info(
    `[codex-plusplus] renderer host loaded ${loaded.size} tweak(s):`,
    [...loaded.keys()].join(", ") || "(none)"
  );
  import_electron2.ipcRenderer.send(
    "codexpp:preload-log",
    "info",
    `renderer host loaded ${loaded.size} tweak(s): ${[...loaded.keys()].join(", ") || "(none)"}`
  );
}
function teardownTweakHost() {
  for (const [id, t] of loaded) {
    try {
      t.stop?.();
    } catch (e) {
      console.warn("[codex-plusplus] tweak stop failed:", id, e);
    } finally {
      void import_electron2.ipcRenderer.invoke("codexpp:codex-view-dispose-tweak", id).catch(() => {
      });
      void import_electron2.ipcRenderer.invoke("codexpp:native-dispose-tweak", id).catch(() => {
      });
      disposeSidebarActionsForTweak(id);
    }
  }
  loaded.clear();
  cancelAllElementWaiters("tweak host teardown");
  clearSections();
}
async function loadTweak(t, paths) {
  const source = await import_electron2.ipcRenderer.invoke(
    "codexpp:read-tweak-source",
    t.entry
  );
  const loader = createTweakModuleLoader({
    manifestId: t.manifest.id,
    entry: t.entry,
    dir: t.dir,
    readSource: readTweakSourceSync,
    fallbackRequire: rendererFallbackRequire,
    console
  });
  const mod = loader.loadEntry(source);
  const tweak = mod.default ?? mod;
  if (typeof tweak?.start !== "function") {
    throw new Error(`tweak ${t.manifest.id} has no start()`);
  }
  const api = makeRendererApi(t.manifest, paths);
  await tweak.start(api);
  loaded.set(t.manifest.id, { stop: tweak.stop?.bind(tweak) });
}
function readTweakSourceSync(entryPath) {
  const result = import_electron2.ipcRenderer.sendSync("codexpp:read-tweak-source-sync", entryPath);
  if (result?.ok === true) return result.source;
  throw new Error(result?.error || `Unable to read tweak source: ${entryPath}`);
}
function rendererFallbackRequire(request) {
  const fallback = globalThis.require;
  if (typeof fallback === "function") return fallback(request);
  throw new Error(
    `Renderer tweak require only supports relative files; bundle dependency "${request}" into the tweak entry`
  );
}
function makeRendererApi(manifest, paths) {
  const id = manifest.id;
  const log = (level, ...a) => {
    const consoleFn = level === "debug" ? console.debug : level === "warn" ? console.warn : level === "error" ? console.error : console.log;
    consoleFn(`[codex-plusplus][${id}]`, ...a);
    try {
      const parts = a.map((v) => {
        if (typeof v === "string") return v;
        if (v instanceof Error) return `${v.name}: ${v.message}`;
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      });
      import_electron2.ipcRenderer.send(
        "codexpp:preload-log",
        level,
        `[tweak ${id}] ${parts.join(" ")}`
      );
    } catch {
    }
  };
  return {
    manifest,
    process: "renderer",
    log: {
      debug: (...a) => log("debug", ...a),
      info: (...a) => log("info", ...a),
      warn: (...a) => log("warn", ...a),
      error: (...a) => log("error", ...a)
    },
    storage: rendererStorage(id),
    settings: {
      register: (s) => registerSection({ ...s, id: `${id}:${s.id}` }),
      registerPage: (p) => registerPage(id, manifest, { ...p, id: `${id}:${p.id}` })
    },
    react: {
      getFiber: (n) => fiberForNode(n),
      findOwnerByName: (n, name) => {
        let f = fiberForNode(n);
        while (f) {
          const t = f.type;
          if (t && (t.displayName === name || t.name === name)) return f;
          f = f.return;
        }
        return null;
      },
      waitForElement
    },
    bridge: {
      addMessageFromViewTransformer: (transformer) => {
        messageFromViewTransformers.add(transformer);
        return {
          unregister: () => {
            messageFromViewTransformers.delete(transformer);
          }
        };
      }
    },
    ipc: {
      on: (c, h) => {
        const wrapped = (_e, ...args) => h(...args);
        import_electron2.ipcRenderer.on(`codexpp:${id}:${c}`, wrapped);
        return () => import_electron2.ipcRenderer.removeListener(`codexpp:${id}:${c}`, wrapped);
      },
      send: (c, ...args) => import_electron2.ipcRenderer.send(`codexpp:${id}:${c}`, ...args),
      invoke: (c, ...args) => import_electron2.ipcRenderer.invoke(`codexpp:${id}:${c}`, ...args)
    },
    fs: rendererFs(id, paths),
    model: rendererModelApi(id),
    codex: rendererCodexApi(id)
  };
}
function installBridgeHooks() {
  const hooks = {
    addMessageFromViewTransformer(transformer) {
      messageFromViewTransformers.add(transformer);
      return () => messageFromViewTransformers.delete(transformer);
    },
    transformMessageFromView(message) {
      let current = message;
      for (const transformer of Array.from(messageFromViewTransformers)) {
        try {
          const next = transformer(current);
          if (next !== void 0) current = next;
        } catch (error) {
          console.warn("[codex-plusplus] message-from-view transformer failed", error);
          try {
            import_electron2.ipcRenderer.send(
              "codexpp:preload-log",
              "warn",
              "message-from-view transformer failed: " + String(error?.stack ?? error)
            );
          } catch {
          }
        }
      }
      return current;
    }
  };
  const target = window;
  target.__codexPlusPlusBridgeHooks = hooks;
  target.__codexppBridgeHooks = hooks;
}
function rendererCodexApi(tweakId) {
  return {
    runtime: {
      getInfo: async () => {
        const info = await import_electron2.ipcRenderer.invoke("codexpp:codex-runtime-info");
        const bridge = rendererElectronBridge();
        return {
          ...info,
          buildFlavor: bridge?.getBuildFlavor?.() ?? info.buildFlavor,
          usesOwlAppShell: bridge?.usesOwlAppShell?.() ?? info.usesOwlAppShell
        };
      },
      getCapabilities: () => import_electron2.ipcRenderer.invoke("codexpp:codex-runtime-capabilities")
    },
    sidebar: rendererSidebarApi(tweakId),
    windows: {
      create: (options) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-create", options),
      getPrimary: () => import_electron2.ipcRenderer.invoke("codexpp:codex-window-primary"),
      focus: (windowId) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-focus", windowId),
      show: (windowId) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-show", windowId)
    },
    views: {
      create: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:codex-view-create",
          tweakId,
          options
        );
        return rendererCodexViewRef(tweakId, ref.id, ref.webContentsId, ref.parentWindowId);
      }
    },
    cdp: {
      getStatus: () => import_electron2.ipcRenderer.invoke("codexpp:codex-cdp-status"),
      listTargets: () => import_electron2.ipcRenderer.invoke("codexpp:codex-cdp-targets")
    },
    native: {
      loadModule: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-load-module",
          tweakId,
          options
        );
        return rendererNativeModuleRef(tweakId, ref.id, ref.kind);
      },
      createPanel: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-create-panel",
          tweakId,
          options
        );
        return rendererNativePanelRef(tweakId, ref.id, ref.windowId);
      },
      attachView: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-attach-view",
          tweakId,
          options
        );
        return rendererNativeViewRef(tweakId, ref.id);
      },
      launchHelper: async (options) => {
        const ref = await import_electron2.ipcRenderer.invoke(
          "codexpp:native-launch-helper",
          tweakId,
          options
        );
        return rendererNativeHelperRef(tweakId, ref.id, ref.pid);
      }
    },
    createBrowserView: (_options) => {
      throw new Error("api.codex.createBrowserView is main-only; use a main-scoped tweak");
    },
    createWindow: (options) => import_electron2.ipcRenderer.invoke("codexpp:codex-window-create", options)
  };
}
function rendererModelApi(tweakId) {
  return {
    generateText: (options) => import_electron2.ipcRenderer.invoke(
      "codexpp:model-generate-text",
      tweakId,
      options
    ),
    generateObject: (options) => import_electron2.ipcRenderer.invoke(
      "codexpp:model-generate-object",
      tweakId,
      options
    )
  };
}
function rendererCodexViewRef(tweakId, id, webContentsId, parentWindowId) {
  return {
    id,
    webContentsId,
    parentWindowId,
    setBounds: (bounds) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "setBounds", bounds),
    setVisible: (visible) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "setVisible", visible),
    bringToFront: () => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "bringToFront"),
    loadRoute: (route, hostId) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "loadRoute", route, hostId),
    loadUrl: (url) => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "loadUrl", url),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:codex-view-call", tweakId, id, "dispose")
  };
}
function rendererNativeModuleRef(tweakId, id, kind) {
  return {
    id,
    kind,
    request: (method, payload, timeoutMs) => import_electron2.ipcRenderer.invoke(
      "codexpp:native-module-request",
      tweakId,
      id,
      method,
      payload,
      timeoutMs
    ),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:native-module-dispose", tweakId, id)
  };
}
function rendererNativePanelRef(tweakId, id, windowId) {
  return {
    id,
    windowId,
    setBounds: (bounds) => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "setBounds", bounds),
    show: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "show"),
    hide: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "hide"),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "panel", id, "dispose")
  };
}
function rendererNativeViewRef(tweakId, id) {
  return {
    id,
    setBounds: (bounds) => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "view", id, "setBounds", bounds),
    setVisible: (visible) => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "view", id, "setVisible", visible),
    dispose: () => import_electron2.ipcRenderer.invoke("codexpp:native-instance-call", tweakId, "view", id, "dispose")
  };
}
function rendererNativeHelperRef(tweakId, id, pid) {
  return {
    id,
    pid,
    send: (message) => import_electron2.ipcRenderer.invoke("codexpp:native-helper-call", tweakId, id, "send", message),
    request: (message, timeoutMs) => import_electron2.ipcRenderer.invoke(
      "codexpp:native-helper-call",
      tweakId,
      id,
      "request",
      message,
      timeoutMs
    ),
    stop: () => import_electron2.ipcRenderer.invoke("codexpp:native-helper-call", tweakId, id, "stop")
  };
}
function rendererElectronBridge() {
  const value = window.electronBridge;
  return value && typeof value === "object" ? value : null;
}
function rendererStorage(id) {
  const key = `codexpp:storage:${id}`;
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "{}");
    } catch {
      return {};
    }
  };
  const write = (v) => localStorage.setItem(key, JSON.stringify(v));
  return {
    get: (k, d) => k in read() ? read()[k] : d,
    set: (k, v) => {
      const o = read();
      o[k] = v;
      write(o);
    },
    delete: (k) => {
      const o = read();
      delete o[k];
      write(o);
    },
    all: () => read()
  };
}
function rendererFs(id, _paths) {
  return {
    dataDir: `<remote>/tweak-data/${id}`,
    read: (p) => import_electron2.ipcRenderer.invoke("codexpp:tweak-fs", "read", id, p),
    write: (p, c) => import_electron2.ipcRenderer.invoke("codexpp:tweak-fs", "write", id, p, c),
    exists: (p) => import_electron2.ipcRenderer.invoke("codexpp:tweak-fs", "exists", id, p)
  };
}

// src/preload/manager.ts
var import_electron3 = require("electron");
async function mountManager() {
  const tweaks = await import_electron3.ipcRenderer.invoke("codexpp:list-tweaks");
  const paths = await import_electron3.ipcRenderer.invoke("codexpp:user-paths");
  registerSection({
    id: "codex-plusplus:manager",
    title: "Tweak Manager",
    description: `${tweaks.length} tweak(s) installed. User dir: ${paths.userRoot}`,
    render(root) {
      root.style.cssText = "display:flex;flex-direction:column;gap:8px;";
      const actions = document.createElement("div");
      actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;";
      actions.appendChild(
        button(
          "Open tweaks folder",
          () => import_electron3.ipcRenderer.invoke("codexpp:reveal", paths.tweaksDir).catch(() => {
          })
        )
      );
      actions.appendChild(
        button(
          "Open logs",
          () => import_electron3.ipcRenderer.invoke("codexpp:reveal", paths.logDir).catch(() => {
          })
        )
      );
      actions.appendChild(
        button("Reload window", () => location.reload())
      );
      root.appendChild(actions);
      if (tweaks.length === 0) {
        const empty = document.createElement("p");
        empty.style.cssText = "color:#888;font:13px system-ui;margin:8px 0;";
        empty.textContent = "No user tweaks yet. Drop a folder with manifest.json + index.js into the tweaks dir, then reload.";
        root.appendChild(empty);
        return;
      }
      const list = document.createElement("ul");
      list.style.cssText = "list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;";
      for (const t of tweaks) {
        const li = document.createElement("li");
        li.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border:1px solid var(--border,#2a2a2a);border-radius:6px;";
        const left = tweakSummary(t);
        const right = document.createElement("div");
        right.style.cssText = "color:#888;font:12px system-ui;";
        right.textContent = t.entryExists ? "loaded" : "missing entry";
        li.append(left, right);
        list.append(li);
      }
      root.append(list);
    }
  });
}
function button(label, onclick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  b.style.cssText = "padding:6px 10px;border:1px solid var(--border,#333);border-radius:6px;background:transparent;color:inherit;font:12px system-ui;cursor:pointer;";
  b.addEventListener("click", onclick);
  return b;
}
function tweakSummary(tweak) {
  const left = document.createElement("div");
  const title = document.createElement("div");
  title.style.cssText = "font:600 13px system-ui;";
  title.append(document.createTextNode(tweak.manifest.name + " "));
  const version = document.createElement("span");
  version.style.cssText = "color:#888;font-weight:400;";
  version.textContent = `v${tweak.manifest.version}`;
  title.appendChild(version);
  const description = document.createElement("div");
  description.style.cssText = "color:#888;font:12px system-ui;";
  description.textContent = tweak.manifest.description ?? tweak.manifest.id;
  left.append(title, description);
  return left;
}

// src/preload/index.ts
var BROWSER_UI_CONNECT_PORT = "codexpp:browser-ui-connect-app-host";
var BROWSER_UI_BRIDGE_REQUEST = "codexpp:browser-ui-bridge-request";
var BROWSER_UI_BRIDGE_RESPONSE = "codexpp:browser-ui-bridge-response";
var BROWSER_UI_MESSAGE_FOR_VIEW = "codexpp:browser-ui-message-for-view";
var BROWSER_UI_WORKER_MESSAGE = "codexpp:browser-ui-worker-message";
var BROWSER_UI_SYSTEM_THEME = "codexpp:browser-ui-system-theme";
var DESKTOP_MESSAGE_FROM_VIEW = "codex_desktop:message-from-view";
var DESKTOP_MESSAGE_FOR_VIEW = "codex_desktop:message-for-view";
var DESKTOP_SHOW_CONTEXT_MENU = "codex_desktop:show-context-menu";
var DESKTOP_SHOW_APPLICATION_MENU = "codex_desktop:show-application-menu";
var DESKTOP_GET_SENTRY_INIT_OPTIONS = "codex_desktop:get-sentry-init-options";
var DESKTOP_GET_BUILD_FLAVOR = "codex_desktop:get-build-flavor";
var DESKTOP_GET_USES_OWL_APP_SHELL = "codex_desktop:get-uses-owl-app-shell";
var DESKTOP_GET_SYSTEM_THEME_VARIANT = "codex_desktop:get-system-theme-variant";
var DESKTOP_GET_SHARED_OBJECT_SNAPSHOT = "codex_desktop:get-shared-object-snapshot";
var DESKTOP_GET_FAST_MODE_ROLLOUT_METRICS = "codex_desktop:get-fast-mode-rollout-metrics";
var DESKTOP_SYSTEM_THEME_UPDATED = "codex_desktop:system-theme-variant-updated";
var DESKTOP_TRIGGER_SENTRY_TEST = "codex_desktop:trigger-sentry-test";
function desktopWorkerFromViewChannel(workerId) {
  return `codex_desktop:worker:${workerId}:from-view`;
}
function desktopWorkerForViewChannel(workerId) {
  return `codex_desktop:worker:${workerId}:for-view`;
}
function fileLog(stage, extra) {
  const msg = `[codex-plusplus preload] ${stage}${extra === void 0 ? "" : " " + safeStringify2(extra)}`;
  try {
    if (stage.includes("FAILED")) console.error(msg);
    else console.info(msg);
  } catch {
  }
  try {
    import_electron4.ipcRenderer.send("codexpp:preload-log", "info", msg);
  } catch {
  }
}
function safeStringify2(v) {
  try {
    return typeof v === "string" ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}
fileLog("preload entry", { url: location.href });
try {
  installBrowserUiHostBridge();
  fileLog("browser UI host bridge installed");
} catch (e) {
  fileLog("browser UI host bridge FAILED", String(e));
}
try {
  installReactHook();
  fileLog("react hook installed");
} catch (e) {
  fileLog("react hook FAILED", String(e));
}
queueMicrotask(() => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
});
async function boot() {
  fileLog("boot start", { readyState: document.readyState });
  try {
    startSettingsInjector();
    fileLog("settings injector started");
    await startTweakHost();
    fileLog("tweak host started");
    await mountManager();
    fileLog("manager mounted");
    subscribeReload();
    fileLog("boot complete");
  } catch (e) {
    fileLog("boot FAILED", String(e?.stack ?? e));
    console.error("[codex-plusplus] preload boot failed:", e);
  }
}
var reloading = null;
function subscribeReload() {
  import_electron4.ipcRenderer.on("codexpp:tweaks-changed", () => {
    if (reloading) return;
    reloading = (async () => {
      try {
        console.info("[codex-plusplus] hot-reloading tweaks");
        teardownTweakHost();
        await startTweakHost();
        await mountManager();
      } catch (e) {
        console.error("[codex-plusplus] hot reload failed:", e);
      } finally {
        reloading = null;
      }
    })();
  });
}
function installBrowserUiHostBridge() {
  const workerListeners = /* @__PURE__ */ new Map();
  import_electron4.ipcRenderer.on(BROWSER_UI_CONNECT_PORT, (event) => {
    const [port] = event.ports;
    if (!port) return;
    window.postMessage({ type: "connect-app-host", port }, "*", [port]);
  });
  import_electron4.ipcRenderer.on(BROWSER_UI_BRIDGE_REQUEST, async (_event, payload) => {
    const request = payload && typeof payload === "object" ? payload : {};
    const id = typeof request.id === "string" ? request.id : "";
    const method = typeof request.method === "string" ? request.method : "";
    const args = Array.isArray(request.args) ? request.args : [];
    try {
      const value = await runBrowserUiBridgeMethod(method, args, workerListeners);
      import_electron4.ipcRenderer.send(BROWSER_UI_BRIDGE_RESPONSE, { id, ok: true, value });
    } catch (e) {
      import_electron4.ipcRenderer.send(BROWSER_UI_BRIDGE_RESPONSE, {
        id,
        ok: false,
        error: e instanceof Error ? e.message : String(e)
      });
    }
  });
  import_electron4.ipcRenderer.on(DESKTOP_MESSAGE_FOR_VIEW, (_event, message) => {
    import_electron4.ipcRenderer.send(BROWSER_UI_MESSAGE_FOR_VIEW, message);
  });
  import_electron4.ipcRenderer.on(DESKTOP_SYSTEM_THEME_UPDATED, (_event, value) => {
    import_electron4.ipcRenderer.send(BROWSER_UI_SYSTEM_THEME, value);
  });
}
async function runBrowserUiBridgeMethod(method, args, workerListeners) {
  switch (method) {
    case "snapshot":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_SHARED_OBJECT_SNAPSHOT) ?? {};
    case "systemTheme":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_SYSTEM_THEME_VARIANT);
    case "sentryOptions":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_SENTRY_INIT_OPTIONS);
    case "buildFlavor":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_BUILD_FLAVOR);
    case "usesOwlAppShell":
      return import_electron4.ipcRenderer.sendSync(DESKTOP_GET_USES_OWL_APP_SHELL) === true;
    case "sendMessageFromView":
      return import_electron4.ipcRenderer.invoke(DESKTOP_MESSAGE_FROM_VIEW, transformMessageFromView(args[0]));
    case "sendWorkerMessageFromView":
      return import_electron4.ipcRenderer.invoke(desktopWorkerFromViewChannel(String(args[0])), args[1]);
    case "subscribeWorkerMessages":
      return subscribeBrowserUiWorkerMessages(String(args[0]), workerListeners);
    case "unsubscribeWorkerMessages":
      return unsubscribeBrowserUiWorkerMessages(String(args[0]), workerListeners);
    case "showContextMenu":
      return import_electron4.ipcRenderer.invoke(DESKTOP_SHOW_CONTEXT_MENU, args[0]);
    case "showApplicationMenu":
      return import_electron4.ipcRenderer.invoke(DESKTOP_SHOW_APPLICATION_MENU, {
        menuId: args[0],
        x: args[1],
        y: args[2]
      });
    case "getFastModeRolloutMetrics":
      return import_electron4.ipcRenderer.invoke(DESKTOP_GET_FAST_MODE_ROLLOUT_METRICS, args[0]);
    case "triggerSentryTestError":
      return import_electron4.ipcRenderer.invoke(DESKTOP_TRIGGER_SENTRY_TEST);
    default:
      throw new Error(`Unknown Codex++ browser UI bridge method: ${method}`);
  }
}
function transformMessageFromView(message) {
  try {
    const hooks = globalThis.__codexPlusPlusBridgeHooks ?? globalThis.__codexppBridgeHooks;
    if (typeof hooks?.transformMessageFromView !== "function") return message;
    const transformed = hooks.transformMessageFromView(message);
    return transformed === void 0 ? message : transformed;
  } catch (error) {
    fileLog("message-from-view transform FAILED", String(error?.stack ?? error));
    return message;
  }
}
function subscribeBrowserUiWorkerMessages(workerId, workerListeners) {
  if (!/^[a-zA-Z0-9._:-]+$/.test(workerId)) throw new Error("invalid worker id");
  if (workerListeners.has(workerId)) return true;
  const listener = (_event, message) => {
    import_electron4.ipcRenderer.send(BROWSER_UI_WORKER_MESSAGE, workerId, message);
  };
  workerListeners.set(workerId, listener);
  import_electron4.ipcRenderer.on(desktopWorkerForViewChannel(workerId), listener);
  return true;
}
function unsubscribeBrowserUiWorkerMessages(workerId, workerListeners) {
  const listener = workerListeners.get(workerId);
  if (!listener) return true;
  workerListeners.delete(workerId);
  import_electron4.ipcRenderer.removeListener(desktopWorkerForViewChannel(workerId), listener);
  return true;
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ByZWxvYWQvaW5kZXgudHMiLCAiLi4vc3JjL3ByZWxvYWQvcmVhY3QtaG9vay50cyIsICIuLi9zcmMvcHJlbG9hZC9zZXR0aW5ncy1pbmplY3Rvci50cyIsICIuLi9zcmMvdHdlYWstc3RvcmUudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3MtZG9tLWhldXJpc3RpY3MudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3MtaWNvbnMudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3Mtc3ZnLnRzIiwgIi4uL3NyYy9wcmVsb2FkL3R3ZWFrLWhvc3QudHMiLCAiLi4vc3JjL3ByZWxvYWQvZWxlbWVudC13YWl0ZXIudHMiLCAiLi4vc3JjL3ByZWxvYWQvdHdlYWstbW9kdWxlLWxvYWRlci50cyIsICIuLi9zcmMvcHJlbG9hZC9tYWluLXNpZGViYXItYWN0aW9ucy50cyIsICIuLi9zcmMvcHJlbG9hZC9tYW5hZ2VyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIFJlbmRlcmVyIHByZWxvYWQgZW50cnkuIFJ1bnMgaW4gYW4gaXNvbGF0ZWQgd29ybGQgYmVmb3JlIENvZGV4J3MgcGFnZSBKUy5cbiAqIFJlc3BvbnNpYmlsaXRpZXM6XG4gKiAgIDEuIEluc3RhbGwgYSBSZWFjdCBEZXZUb29scy1zaGFwZWQgZ2xvYmFsIGhvb2sgdG8gY2FwdHVyZSB0aGUgcmVuZGVyZXJcbiAqICAgICAgcmVmZXJlbmNlIHdoZW4gUmVhY3QgbW91bnRzLiBXZSB1c2UgdGhpcyBmb3IgZmliZXIgd2Fsa2luZy5cbiAqICAgMi4gQWZ0ZXIgRE9NQ29udGVudExvYWRlZCwga2ljayBvZmYgc2V0dGluZ3MtaW5qZWN0aW9uIGxvZ2ljLlxuICogICAzLiBEaXNjb3ZlciByZW5kZXJlci1zY29wZWQgdHdlYWtzICh2aWEgSVBDIHRvIG1haW4pIGFuZCBzdGFydCB0aGVtLlxuICogICA0LiBMaXN0ZW4gZm9yIGBjb2RleHBwOnR3ZWFrcy1jaGFuZ2VkYCBmcm9tIG1haW4gKGZpbGVzeXN0ZW0gd2F0Y2hlcikgYW5kXG4gKiAgICAgIGhvdC1yZWxvYWQgdHdlYWtzIHdpdGhvdXQgZHJvcHBpbmcgdGhlIHBhZ2UuXG4gKi9cblxuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGluc3RhbGxSZWFjdEhvb2sgfSBmcm9tIFwiLi9yZWFjdC1ob29rXCI7XG5pbXBvcnQgeyBzdGFydFNldHRpbmdzSW5qZWN0b3IgfSBmcm9tIFwiLi9zZXR0aW5ncy1pbmplY3RvclwiO1xuaW1wb3J0IHsgc3RhcnRUd2Vha0hvc3QsIHRlYXJkb3duVHdlYWtIb3N0IH0gZnJvbSBcIi4vdHdlYWstaG9zdFwiO1xuaW1wb3J0IHsgbW91bnRNYW5hZ2VyIH0gZnJvbSBcIi4vbWFuYWdlclwiO1xuXG5jb25zdCBCUk9XU0VSX1VJX0NPTk5FQ1RfUE9SVCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWNvbm5lY3QtYXBwLWhvc3RcIjtcbmNvbnN0IEJST1dTRVJfVUlfQlJJREdFX1JFUVVFU1QgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVxdWVzdFwiO1xuY29uc3QgQlJPV1NFUl9VSV9CUklER0VfUkVTUE9OU0UgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVzcG9uc2VcIjtcbmNvbnN0IEJST1dTRVJfVUlfTUVTU0FHRV9GT1JfVklFVyA9IFwiY29kZXhwcDpicm93c2VyLXVpLW1lc3NhZ2UtZm9yLXZpZXdcIjtcbmNvbnN0IEJST1dTRVJfVUlfV09SS0VSX01FU1NBR0UgPSBcImNvZGV4cHA6YnJvd3Nlci11aS13b3JrZXItbWVzc2FnZVwiO1xuY29uc3QgQlJPV1NFUl9VSV9TWVNURU1fVEhFTUUgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1zeXN0ZW0tdGhlbWVcIjtcblxuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVyA9IFwiY29kZXhfZGVza3RvcDptZXNzYWdlLWZyb20tdmlld1wiO1xuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZPUl9WSUVXID0gXCJjb2RleF9kZXNrdG9wOm1lc3NhZ2UtZm9yLXZpZXdcIjtcbmNvbnN0IERFU0tUT1BfU0hPV19DT05URVhUX01FTlUgPSBcImNvZGV4X2Rlc2t0b3A6c2hvdy1jb250ZXh0LW1lbnVcIjtcbmNvbnN0IERFU0tUT1BfU0hPV19BUFBMSUNBVElPTl9NRU5VID0gXCJjb2RleF9kZXNrdG9wOnNob3ctYXBwbGljYXRpb24tbWVudVwiO1xuY29uc3QgREVTS1RPUF9HRVRfU0VOVFJZX0lOSVRfT1BUSU9OUyA9IFwiY29kZXhfZGVza3RvcDpnZXQtc2VudHJ5LWluaXQtb3B0aW9uc1wiO1xuY29uc3QgREVTS1RPUF9HRVRfQlVJTERfRkxBVk9SID0gXCJjb2RleF9kZXNrdG9wOmdldC1idWlsZC1mbGF2b3JcIjtcbmNvbnN0IERFU0tUT1BfR0VUX1VTRVNfT1dMX0FQUF9TSEVMTCA9IFwiY29kZXhfZGVza3RvcDpnZXQtdXNlcy1vd2wtYXBwLXNoZWxsXCI7XG5jb25zdCBERVNLVE9QX0dFVF9TWVNURU1fVEhFTUVfVkFSSUFOVCA9IFwiY29kZXhfZGVza3RvcDpnZXQtc3lzdGVtLXRoZW1lLXZhcmlhbnRcIjtcbmNvbnN0IERFU0tUT1BfR0VUX1NIQVJFRF9PQkpFQ1RfU05BUFNIT1QgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LXNoYXJlZC1vYmplY3Qtc25hcHNob3RcIjtcbmNvbnN0IERFU0tUT1BfR0VUX0ZBU1RfTU9ERV9ST0xMT1VUX01FVFJJQ1MgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LWZhc3QtbW9kZS1yb2xsb3V0LW1ldHJpY3NcIjtcbmNvbnN0IERFU0tUT1BfU1lTVEVNX1RIRU1FX1VQREFURUQgPSBcImNvZGV4X2Rlc2t0b3A6c3lzdGVtLXRoZW1lLXZhcmlhbnQtdXBkYXRlZFwiO1xuY29uc3QgREVTS1RPUF9UUklHR0VSX1NFTlRSWV9URVNUID0gXCJjb2RleF9kZXNrdG9wOnRyaWdnZXItc2VudHJ5LXRlc3RcIjtcblxudHlwZSBNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lciA9IChtZXNzYWdlOiB1bmtub3duKSA9PiB1bmtub3duO1xuXG50eXBlIENvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcyA9IHtcbiAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI/OiAodHJhbnNmb3JtZXI6IE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyKSA9PiAoKSA9PiB2b2lkO1xuICB0cmFuc2Zvcm1NZXNzYWdlRnJvbVZpZXc/OiAobWVzc2FnZTogdW5rbm93bikgPT4gdW5rbm93bjtcbn07XG5cbmZ1bmN0aW9uIGRlc2t0b3BXb3JrZXJGcm9tVmlld0NoYW5uZWwod29ya2VySWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgY29kZXhfZGVza3RvcDp3b3JrZXI6JHt3b3JrZXJJZH06ZnJvbS12aWV3YDtcbn1cblxuZnVuY3Rpb24gZGVza3RvcFdvcmtlckZvclZpZXdDaGFubmVsKHdvcmtlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYGNvZGV4X2Rlc2t0b3A6d29ya2VyOiR7d29ya2VySWR9OmZvci12aWV3YDtcbn1cblxuLy8gRmlsZS1sb2cgcHJlbG9hZCBwcm9ncmVzcyBzbyB3ZSBjYW4gZGlhZ25vc2Ugd2l0aG91dCBEZXZUb29scy4gQmVzdC1lZmZvcnQ6XG4vLyBmYWlsdXJlcyBoZXJlIG11c3QgbmV2ZXIgdGhyb3cgYmVjYXVzZSB3ZSdkIHRha2UgdGhlIHBhZ2UgZG93biB3aXRoIHVzLlxuLy9cbi8vIENvZGV4J3MgcmVuZGVyZXIgaXMgc2FuZGJveGVkIChzYW5kYm94OiB0cnVlKSwgc28gYHJlcXVpcmUoXCJub2RlOmZzXCIpYCBpc1xuLy8gdW5hdmFpbGFibGUuIFdlIGZvcndhcmQgbG9nIGxpbmVzIHRvIG1haW4gdmlhIElQQzsgbWFpbiB3cml0ZXMgdGhlIGZpbGUuXG5mdW5jdGlvbiBmaWxlTG9nKHN0YWdlOiBzdHJpbmcsIGV4dHJhPzogdW5rbm93bik6IHZvaWQge1xuICBjb25zdCBtc2cgPSBgW2NvZGV4LXBsdXNwbHVzIHByZWxvYWRdICR7c3RhZ2V9JHtcbiAgICBleHRyYSA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IFwiIFwiICsgc2FmZVN0cmluZ2lmeShleHRyYSlcbiAgfWA7XG4gIHRyeSB7XG4gICAgaWYgKHN0YWdlLmluY2x1ZGVzKFwiRkFJTEVEXCIpKSBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgZWxzZSBjb25zb2xlLmluZm8obXNnKTtcbiAgfSBjYXRjaCB7fVxuICB0cnkge1xuICAgIGlwY1JlbmRlcmVyLnNlbmQoXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsIFwiaW5mb1wiLCBtc2cpO1xuICB9IGNhdGNoIHt9XG59XG5mdW5jdGlvbiBzYWZlU3RyaW5naWZ5KHY6IHVua25vd24pOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFN0cmluZyh2KTtcbiAgfVxufVxuXG5maWxlTG9nKFwicHJlbG9hZCBlbnRyeVwiLCB7IHVybDogbG9jYXRpb24uaHJlZiB9KTtcblxudHJ5IHtcbiAgaW5zdGFsbEJyb3dzZXJVaUhvc3RCcmlkZ2UoKTtcbiAgZmlsZUxvZyhcImJyb3dzZXIgVUkgaG9zdCBicmlkZ2UgaW5zdGFsbGVkXCIpO1xufSBjYXRjaCAoZSkge1xuICBmaWxlTG9nKFwiYnJvd3NlciBVSSBob3N0IGJyaWRnZSBGQUlMRURcIiwgU3RyaW5nKGUpKTtcbn1cblxuLy8gUmVhY3QgaG9vayBtdXN0IGJlIGluc3RhbGxlZCAqYmVmb3JlKiBDb2RleCdzIGJ1bmRsZSBydW5zLlxudHJ5IHtcbiAgaW5zdGFsbFJlYWN0SG9vaygpO1xuICBmaWxlTG9nKFwicmVhY3QgaG9vayBpbnN0YWxsZWRcIik7XG59IGNhdGNoIChlKSB7XG4gIGZpbGVMb2coXCJyZWFjdCBob29rIEZBSUxFRFwiLCBTdHJpbmcoZSkpO1xufVxuXG5xdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGJvb3QsIHsgb25jZTogdHJ1ZSB9KTtcbiAgfSBlbHNlIHtcbiAgICBib290KCk7XG4gIH1cbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICBmaWxlTG9nKFwiYm9vdCBzdGFydFwiLCB7IHJlYWR5U3RhdGU6IGRvY3VtZW50LnJlYWR5U3RhdGUgfSk7XG4gIHRyeSB7XG4gICAgc3RhcnRTZXR0aW5nc0luamVjdG9yKCk7XG4gICAgZmlsZUxvZyhcInNldHRpbmdzIGluamVjdG9yIHN0YXJ0ZWRcIik7XG4gICAgYXdhaXQgc3RhcnRUd2Vha0hvc3QoKTtcbiAgICBmaWxlTG9nKFwidHdlYWsgaG9zdCBzdGFydGVkXCIpO1xuICAgIGF3YWl0IG1vdW50TWFuYWdlcigpO1xuICAgIGZpbGVMb2coXCJtYW5hZ2VyIG1vdW50ZWRcIik7XG4gICAgc3Vic2NyaWJlUmVsb2FkKCk7XG4gICAgZmlsZUxvZyhcImJvb3QgY29tcGxldGVcIik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBmaWxlTG9nKFwiYm9vdCBGQUlMRURcIiwgU3RyaW5nKChlIGFzIEVycm9yKT8uc3RhY2sgPz8gZSkpO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHByZWxvYWQgYm9vdCBmYWlsZWQ6XCIsIGUpO1xuICB9XG59XG5cbi8vIEhvdCByZWxvYWQ6IGdhdGVkIGJlaGluZCBhIHNtYWxsIGluLWZsaWdodCBsb2NrIHNvIGEgZmx1cnJ5IG9mIGZzIGV2ZW50c1xuLy8gZG9lc24ndCByZWVudHJhbnRseSB0ZWFyIGRvd24gdGhlIGhvc3QgbWlkLWxvYWQuXG5sZXQgcmVsb2FkaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XG5mdW5jdGlvbiBzdWJzY3JpYmVSZWxvYWQoKTogdm9pZCB7XG4gIGlwY1JlbmRlcmVyLm9uKFwiY29kZXhwcDp0d2Vha3MtY2hhbmdlZFwiLCAoKSA9PiB7XG4gICAgaWYgKHJlbG9hZGluZykgcmV0dXJuO1xuICAgIHJlbG9hZGluZyA9IChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmluZm8oXCJbY29kZXgtcGx1c3BsdXNdIGhvdC1yZWxvYWRpbmcgdHdlYWtzXCIpO1xuICAgICAgICB0ZWFyZG93blR3ZWFrSG9zdCgpO1xuICAgICAgICBhd2FpdCBzdGFydFR3ZWFrSG9zdCgpO1xuICAgICAgICBhd2FpdCBtb3VudE1hbmFnZXIoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIltjb2RleC1wbHVzcGx1c10gaG90IHJlbG9hZCBmYWlsZWQ6XCIsIGUpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgcmVsb2FkaW5nID0gbnVsbDtcbiAgICAgIH1cbiAgICB9KSgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbEJyb3dzZXJVaUhvc3RCcmlkZ2UoKTogdm9pZCB7XG4gIGNvbnN0IHdvcmtlckxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkPigpO1xuXG4gIGlwY1JlbmRlcmVyLm9uKEJST1dTRVJfVUlfQ09OTkVDVF9QT1JULCAoZXZlbnQpID0+IHtcbiAgICBjb25zdCBbcG9ydF0gPSBldmVudC5wb3J0cztcbiAgICBpZiAoIXBvcnQpIHJldHVybjtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNvbm5lY3QtYXBwLWhvc3RcIiwgcG9ydCB9LCBcIipcIiwgW3BvcnRdKTtcbiAgfSk7XG5cbiAgaXBjUmVuZGVyZXIub24oQlJPV1NFUl9VSV9CUklER0VfUkVRVUVTVCwgYXN5bmMgKF9ldmVudCwgcGF5bG9hZCkgPT4ge1xuICAgIGNvbnN0IHJlcXVlc3QgPSBwYXlsb2FkICYmIHR5cGVvZiBwYXlsb2FkID09PSBcIm9iamVjdFwiXG4gICAgICA/IHBheWxvYWQgYXMgeyBpZD86IHVua25vd247IG1ldGhvZD86IHVua25vd247IGFyZ3M/OiB1bmtub3duIH1cbiAgICAgIDoge307XG4gICAgY29uc3QgaWQgPSB0eXBlb2YgcmVxdWVzdC5pZCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QuaWQgOiBcIlwiO1xuICAgIGNvbnN0IG1ldGhvZCA9IHR5cGVvZiByZXF1ZXN0Lm1ldGhvZCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QubWV0aG9kIDogXCJcIjtcbiAgICBjb25zdCBhcmdzID0gQXJyYXkuaXNBcnJheShyZXF1ZXN0LmFyZ3MpID8gcmVxdWVzdC5hcmdzIDogW107XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcnVuQnJvd3NlclVpQnJpZGdlTWV0aG9kKG1ldGhvZCwgYXJncywgd29ya2VyTGlzdGVuZXJzKTtcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9CUklER0VfUkVTUE9OU0UsIHsgaWQsIG9rOiB0cnVlLCB2YWx1ZSB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfQlJJREdFX1JFU1BPTlNFLCB7XG4gICAgICAgIGlkLFxuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGlwY1JlbmRlcmVyLm9uKERFU0tUT1BfTUVTU0FHRV9GT1JfVklFVywgKF9ldmVudCwgbWVzc2FnZSkgPT4ge1xuICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9NRVNTQUdFX0ZPUl9WSUVXLCBtZXNzYWdlKTtcbiAgfSk7XG5cbiAgaXBjUmVuZGVyZXIub24oREVTS1RPUF9TWVNURU1fVEhFTUVfVVBEQVRFRCwgKF9ldmVudCwgdmFsdWUpID0+IHtcbiAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfU1lTVEVNX1RIRU1FLCB2YWx1ZSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Ccm93c2VyVWlCcmlkZ2VNZXRob2QoXG4gIG1ldGhvZDogc3RyaW5nLFxuICBhcmdzOiB1bmtub3duW10sXG4gIHdvcmtlckxpc3RlbmVyczogTWFwPHN0cmluZywgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZD4sXG4pOiBQcm9taXNlPHVua25vd24+IHtcbiAgc3dpdGNoIChtZXRob2QpIHtcbiAgICBjYXNlIFwic25hcHNob3RcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TSEFSRURfT0JKRUNUX1NOQVBTSE9UKSA/PyB7fTtcbiAgICBjYXNlIFwic3lzdGVtVGhlbWVcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TWVNURU1fVEhFTUVfVkFSSUFOVCk7XG4gICAgY2FzZSBcInNlbnRyeU9wdGlvbnNcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TRU5UUllfSU5JVF9PUFRJT05TKTtcbiAgICBjYXNlIFwiYnVpbGRGbGF2b3JcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9CVUlMRF9GTEFWT1IpO1xuICAgIGNhc2UgXCJ1c2VzT3dsQXBwU2hlbGxcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9VU0VTX09XTF9BUFBfU0hFTEwpID09PSB0cnVlO1xuICAgIGNhc2UgXCJzZW5kTWVzc2FnZUZyb21WaWV3XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfTUVTU0FHRV9GUk9NX1ZJRVcsIHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhhcmdzWzBdKSk7XG4gICAgY2FzZSBcInNlbmRXb3JrZXJNZXNzYWdlRnJvbVZpZXdcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5pbnZva2UoZGVza3RvcFdvcmtlckZyb21WaWV3Q2hhbm5lbChTdHJpbmcoYXJnc1swXSkpLCBhcmdzWzFdKTtcbiAgICBjYXNlIFwic3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIjpcbiAgICAgIHJldHVybiBzdWJzY3JpYmVCcm93c2VyVWlXb3JrZXJNZXNzYWdlcyhTdHJpbmcoYXJnc1swXSksIHdvcmtlckxpc3RlbmVycyk7XG4gICAgY2FzZSBcInVuc3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIjpcbiAgICAgIHJldHVybiB1bnN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFN0cmluZyhhcmdzWzBdKSwgd29ya2VyTGlzdGVuZXJzKTtcbiAgICBjYXNlIFwic2hvd0NvbnRleHRNZW51XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfU0hPV19DT05URVhUX01FTlUsIGFyZ3NbMF0pO1xuICAgIGNhc2UgXCJzaG93QXBwbGljYXRpb25NZW51XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfU0hPV19BUFBMSUNBVElPTl9NRU5VLCB7XG4gICAgICAgIG1lbnVJZDogYXJnc1swXSxcbiAgICAgICAgeDogYXJnc1sxXSxcbiAgICAgICAgeTogYXJnc1syXSxcbiAgICAgIH0pO1xuICAgIGNhc2UgXCJnZXRGYXN0TW9kZVJvbGxvdXRNZXRyaWNzXCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfR0VUX0ZBU1RfTU9ERV9ST0xMT1VUX01FVFJJQ1MsIGFyZ3NbMF0pO1xuICAgIGNhc2UgXCJ0cmlnZ2VyU2VudHJ5VGVzdEVycm9yXCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfVFJJR0dFUl9TRU5UUllfVEVTVCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBDb2RleCsrIGJyb3dzZXIgVUkgYnJpZGdlIG1ldGhvZDogJHttZXRob2R9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2U6IHVua25vd24pOiB1bmtub3duIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBob29rcyA9IChnbG9iYWxUaGlzIGFzIHR5cGVvZiBnbG9iYWxUaGlzICYge1xuICAgICAgX19jb2RleFBsdXNQbHVzQnJpZGdlSG9va3M/OiBDb2RleFBsdXNQbHVzQnJpZGdlSG9va3M7XG4gICAgICBfX2NvZGV4cHBCcmlkZ2VIb29rcz86IENvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcztcbiAgICB9KS5fX2NvZGV4UGx1c1BsdXNCcmlkZ2VIb29rc1xuICAgICAgPz8gKGdsb2JhbFRoaXMgYXMgdHlwZW9mIGdsb2JhbFRoaXMgJiB7XG4gICAgICAgIF9fY29kZXhwcEJyaWRnZUhvb2tzPzogQ29kZXhQbHVzUGx1c0JyaWRnZUhvb2tzO1xuICAgICAgfSkuX19jb2RleHBwQnJpZGdlSG9va3M7XG4gICAgaWYgKHR5cGVvZiBob29rcz8udHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3ICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBtZXNzYWdlO1xuICAgIGNvbnN0IHRyYW5zZm9ybWVkID0gaG9va3MudHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2UpO1xuICAgIHJldHVybiB0cmFuc2Zvcm1lZCA9PT0gdW5kZWZpbmVkID8gbWVzc2FnZSA6IHRyYW5zZm9ybWVkO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGZpbGVMb2coXCJtZXNzYWdlLWZyb20tdmlldyB0cmFuc2Zvcm0gRkFJTEVEXCIsIFN0cmluZygoZXJyb3IgYXMgRXJyb3IpPy5zdGFjayA/PyBlcnJvcikpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFxuICB3b3JrZXJJZDogc3RyaW5nLFxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxuKTogYm9vbGVhbiB7XG4gIGlmICghL15bYS16QS1aMC05Ll86LV0rJC8udGVzdCh3b3JrZXJJZCkpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgd29ya2VyIGlkXCIpO1xuICBpZiAod29ya2VyTGlzdGVuZXJzLmhhcyh3b3JrZXJJZCkpIHJldHVybiB0cnVlO1xuICBjb25zdCBsaXN0ZW5lciA9IChfZXZlbnQ6IHVua25vd24sIG1lc3NhZ2U6IHVua25vd24pID0+IHtcbiAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfV09SS0VSX01FU1NBR0UsIHdvcmtlcklkLCBtZXNzYWdlKTtcbiAgfTtcbiAgd29ya2VyTGlzdGVuZXJzLnNldCh3b3JrZXJJZCwgbGlzdGVuZXIpO1xuICBpcGNSZW5kZXJlci5vbihkZXNrdG9wV29ya2VyRm9yVmlld0NoYW5uZWwod29ya2VySWQpLCBsaXN0ZW5lcik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB1bnN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFxuICB3b3JrZXJJZDogc3RyaW5nLFxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxpc3RlbmVyID0gd29ya2VyTGlzdGVuZXJzLmdldCh3b3JrZXJJZCk7XG4gIGlmICghbGlzdGVuZXIpIHJldHVybiB0cnVlO1xuICB3b3JrZXJMaXN0ZW5lcnMuZGVsZXRlKHdvcmtlcklkKTtcbiAgaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoZGVza3RvcFdvcmtlckZvclZpZXdDaGFubmVsKHdvcmtlcklkKSwgbGlzdGVuZXIpO1xuICByZXR1cm4gdHJ1ZTtcbn1cbiIsICIvKipcbiAqIEluc3RhbGwgYSBtaW5pbWFsIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy4gUmVhY3QgY2FsbHNcbiAqIGBob29rLmluamVjdChyZW5kZXJlckludGVybmFscylgIGR1cmluZyBgY3JlYXRlUm9vdGAvYGh5ZHJhdGVSb290YC4gVGhlXG4gKiBcImludGVybmFsc1wiIG9iamVjdCBleHBvc2VzIGZpbmRGaWJlckJ5SG9zdEluc3RhbmNlLCB3aGljaCBsZXRzIHVzIHR1cm4gYVxuICogRE9NIG5vZGUgaW50byBhIFJlYWN0IGZpYmVyIFx1MjAxNCBuZWNlc3NhcnkgZm9yIG91ciBTZXR0aW5ncyBpbmplY3Rvci5cbiAqXG4gKiBXZSBkb24ndCB3YW50IHRvIGJyZWFrIHJlYWwgUmVhY3QgRGV2VG9vbHMgaWYgdGhlIHVzZXIgb3BlbnMgaXQ7IHdlIGluc3RhbGxcbiAqIG9ubHkgaWYgbm8gaG9vayBleGlzdHMgeWV0LCBhbmQgd2UgZm9yd2FyZCBjYWxscyB0byBhIGRvd25zdHJlYW0gaG9vayBpZlxuICogb25lIGlzIGxhdGVyIGFzc2lnbmVkLlxuICovXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXz86IFJlYWN0RGV2dG9vbHNIb29rO1xuICAgIF9fY29kZXhwcF9fPzoge1xuICAgICAgaG9vazogUmVhY3REZXZ0b29sc0hvb2s7XG4gICAgICByZW5kZXJlcnM6IE1hcDxudW1iZXIsIFJlbmRlcmVySW50ZXJuYWxzPjtcbiAgICB9O1xuICB9XG59XG5cbmludGVyZmFjZSBSZW5kZXJlckludGVybmFscyB7XG4gIGZpbmRGaWJlckJ5SG9zdEluc3RhbmNlPzogKG46IE5vZGUpID0+IHVua25vd247XG4gIHZlcnNpb24/OiBzdHJpbmc7XG4gIGJ1bmRsZVR5cGU/OiBudW1iZXI7XG4gIHJlbmRlcmVyUGFja2FnZU5hbWU/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBSZWFjdERldnRvb2xzSG9vayB7XG4gIHN1cHBvcnRzRmliZXI6IHRydWU7XG4gIHJlbmRlcmVyczogTWFwPG51bWJlciwgUmVuZGVyZXJJbnRlcm5hbHM+O1xuICBvbihldmVudDogc3RyaW5nLCBmbjogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCk6IHZvaWQ7XG4gIG9mZihldmVudDogc3RyaW5nLCBmbjogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCk6IHZvaWQ7XG4gIGVtaXQoZXZlbnQ6IHN0cmluZywgLi4uYTogdW5rbm93bltdKTogdm9pZDtcbiAgaW5qZWN0KHJlbmRlcmVyOiBSZW5kZXJlckludGVybmFscyk6IG51bWJlcjtcbiAgb25TY2hlZHVsZUZpYmVyUm9vdD8oKTogdm9pZDtcbiAgb25Db21taXRGaWJlclJvb3Q/KCk6IHZvaWQ7XG4gIG9uQ29tbWl0RmliZXJVbm1vdW50PygpOiB2b2lkO1xuICBjaGVja0RDRT8oKTogdm9pZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxSZWFjdEhvb2soKTogdm9pZCB7XG4gIGlmICh3aW5kb3cuX19SRUFDVF9ERVZUT09MU19HTE9CQUxfSE9PS19fKSByZXR1cm47XG4gIGNvbnN0IHJlbmRlcmVycyA9IG5ldyBNYXA8bnVtYmVyLCBSZW5kZXJlckludGVybmFscz4oKTtcbiAgbGV0IG5leHRJZCA9IDE7XG4gIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8KC4uLmE6IHVua25vd25bXSkgPT4gdm9pZD4+KCk7XG5cbiAgY29uc3QgaG9vazogUmVhY3REZXZ0b29sc0hvb2sgPSB7XG4gICAgc3VwcG9ydHNGaWJlcjogdHJ1ZSxcbiAgICByZW5kZXJlcnMsXG4gICAgaW5qZWN0KHJlbmRlcmVyKSB7XG4gICAgICBjb25zdCBpZCA9IG5leHRJZCsrO1xuICAgICAgcmVuZGVyZXJzLnNldChpZCwgcmVuZGVyZXIpO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIFwiW2NvZGV4LXBsdXNwbHVzXSBSZWFjdCByZW5kZXJlciBhdHRhY2hlZDpcIixcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyZXJQYWNrYWdlTmFtZSxcbiAgICAgICAgcmVuZGVyZXIudmVyc2lvbixcbiAgICAgICk7XG4gICAgICByZXR1cm4gaWQ7XG4gICAgfSxcbiAgICBvbihldmVudCwgZm4pIHtcbiAgICAgIGxldCBzID0gbGlzdGVuZXJzLmdldChldmVudCk7XG4gICAgICBpZiAoIXMpIGxpc3RlbmVycy5zZXQoZXZlbnQsIChzID0gbmV3IFNldCgpKSk7XG4gICAgICBzLmFkZChmbik7XG4gICAgfSxcbiAgICBvZmYoZXZlbnQsIGZuKSB7XG4gICAgICBsaXN0ZW5lcnMuZ2V0KGV2ZW50KT8uZGVsZXRlKGZuKTtcbiAgICB9LFxuICAgIGVtaXQoZXZlbnQsIC4uLmFyZ3MpIHtcbiAgICAgIGxpc3RlbmVycy5nZXQoZXZlbnQpPy5mb3JFYWNoKChmbikgPT4gZm4oLi4uYXJncykpO1xuICAgIH0sXG4gICAgb25Db21taXRGaWJlclJvb3QoKSB7fSxcbiAgICBvbkNvbW1pdEZpYmVyVW5tb3VudCgpIHt9LFxuICAgIG9uU2NoZWR1bGVGaWJlclJvb3QoKSB7fSxcbiAgICBjaGVja0RDRSgpIHt9LFxuICB9O1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3csIFwiX19SRUFDVF9ERVZUT09MU19HTE9CQUxfSE9PS19fXCIsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWUsIC8vIGFsbG93IHJlYWwgRGV2VG9vbHMgdG8gb3ZlcndyaXRlIGlmIHVzZXIgaW5zdGFsbHMgaXRcbiAgICB2YWx1ZTogaG9vayxcbiAgfSk7XG5cbiAgd2luZG93Ll9fY29kZXhwcF9fID0geyBob29rLCByZW5kZXJlcnMgfTtcbn1cblxuLyoqIFJlc29sdmUgdGhlIFJlYWN0IGZpYmVyIGZvciBhIERPTSBub2RlLCBpZiBhbnkgcmVuZGVyZXIgaGFzIG9uZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWJlckZvck5vZGUobm9kZTogTm9kZSk6IHVua25vd24gfCBudWxsIHtcbiAgY29uc3QgcmVuZGVyZXJzID0gd2luZG93Ll9fY29kZXhwcF9fPy5yZW5kZXJlcnM7XG4gIGlmIChyZW5kZXJlcnMpIHtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVuZGVyZXJzLnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBmID0gci5maW5kRmliZXJCeUhvc3RJbnN0YW5jZT8uKG5vZGUpO1xuICAgICAgaWYgKGYpIHJldHVybiBmO1xuICAgIH1cbiAgfVxuICAvLyBGYWxsYmFjazogcmVhZCB0aGUgUmVhY3QgaW50ZXJuYWwgcHJvcGVydHkgZGlyZWN0bHkgZnJvbSB0aGUgRE9NIG5vZGUuXG4gIC8vIFJlYWN0IHN0b3JlcyBmaWJlcnMgYXMgYSBwcm9wZXJ0eSB3aG9zZSBrZXkgc3RhcnRzIHdpdGggXCJfX3JlYWN0RmliZXJcIi5cbiAgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKG5vZGUpKSB7XG4gICAgaWYgKGsuc3RhcnRzV2l0aChcIl9fcmVhY3RGaWJlclwiKSkgcmV0dXJuIChub2RlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgIi8qKlxuICogU2V0dGluZ3MgaW5qZWN0b3IgZm9yIENvZGV4J3MgU2V0dGluZ3MgcGFnZS5cbiAqXG4gKiBDb2RleCdzIHNldHRpbmdzIGlzIGEgcm91dGVkIHBhZ2UgKFVSTCBzdGF5cyBhdCBgL2luZGV4Lmh0bWw/aG9zdElkPWxvY2FsYClcbiAqIE5PVCBhIG1vZGFsIGRpYWxvZy4gVGhlIHNpZGViYXIgaXMgYSBncm91cGVkIHNldHRpbmdzIG5hdiAoUGVyc29uYWwsXG4gKiBJbnRlZ3JhdGlvbnMsIENvZGluZywgQXJjaGl2ZWQpIHdpdGggbmF0aXZlIHNlY3Rpb24gaGVhZGVycyBhYm92ZSBzdGFja3Mgb2ZcbiAqIGJ1dHRvbnMuIFRoZXJlIGFyZSBubyBzdGFibGUgYHJvbGVgIC8gYGFyaWEtbGFiZWxgIC8gYGRhdGEtdGVzdGlkYCBob29rcyBvblxuICogdGhlIHNoZWxsIHNvIHdlIGlkZW50aWZ5IHRoZSBzaWRlYmFyIGJ5IHRleHQtY29udGVudCBtYXRjaCBhZ2FpbnN0IGtub3duIGl0ZW1cbiAqIGxhYmVscyAoR2VuZXJhbCwgQXBwZWFyYW5jZSwgQ29uZmlndXJhdGlvbiwgXHUyMDI2KS5cbiAqXG4gKiBMYXlvdXQgd2UgaW5qZWN0OlxuICpcbiAqICAgUGVyc29uYWwgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBDb2RleCBncm91cCBsYWJlbClcbiAqICAgW0NvZGV4J3MgZXhpc3RpbmcgaXRlbXMgZ3JvdXBdXG4gKiAgIENvZGV4KysgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUgQ29kZXggZ3JvdXAgbGFiZWwpXG4gKiAgIFx1MjREOCBDb25maWdcbiAqICAgXHUyNjMwIFR3ZWFrc1xuICogICBcdTI1QzcgVHdlYWsgU3RvcmVcbiAqXG4gKiBDbGlja2luZyBDb25maWcgLyBUd2Vha3MgLyBUd2VhayBTdG9yZSBoaWRlcyBDb2RleCdzIGNvbnRlbnQgcGFuZWwgY2hpbGRyZW4gYW5kIHJlbmRlcnNcbiAqIG91ciBvd24gYG1haW4tc3VyZmFjZWAgcGFuZWwgaW4gdGhlaXIgcGxhY2UuIENsaWNraW5nIGFueSBvZiBDb2RleCdzXG4gKiBzaWRlYmFyIGl0ZW1zIHJlc3RvcmVzIHRoZSBvcmlnaW5hbCB2aWV3LlxuICovXG5cbmltcG9ydCB7IGlwY1JlbmRlcmVyIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgdHlwZSB7XG4gIFNldHRpbmdzU2VjdGlvbixcbiAgU2V0dGluZ3NQYWdlLFxuICBTZXR0aW5nc0hhbmRsZSxcbiAgVHdlYWtNYW5pZmVzdCxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcbmltcG9ydCB7XG4gIGJ1aWxkVHdlYWtQdWJsaXNoSXNzdWVVcmwsXG4gIHR5cGUgVHdlYWtTdG9yZUVudHJ5LFxuICB0eXBlIFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbixcbn0gZnJvbSBcIi4uL3R3ZWFrLXN0b3JlXCI7XG5pbXBvcnQge1xuICBjb2RleFBwU2V0dGluZ3NMYWJlbHNGcm9tLFxuICBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlLFxuICBjb21wYWN0U2V0dGluZ3NUZXh0LFxuICBoYXNOYXRpdmVTZXR0aW5nc1NlY3Rpb25IZWFkZXJzLFxuICBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0LFxuICBpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2UsXG4gIGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlLFxufSBmcm9tIFwiLi9zZXR0aW5ncy1kb20taGV1cmlzdGljc1wiO1xuaW1wb3J0IHtcbiAgY29uZmlnSWNvblN2ZyxcbiAgZGVmYXVsdFBhZ2VJY29uU3ZnLFxuICByZWZyZXNoSWNvblN2ZyxcbiAgc3RvcmVJY29uU3ZnLFxuICB0d2Vha3NJY29uU3ZnLFxufSBmcm9tIFwiLi9zZXR0aW5ncy1pY29uc1wiO1xuaW1wb3J0IHsgYXBwZW5kU3ZnSHRtbCwgc3ZnRWxlbWVudCB9IGZyb20gXCIuL3NldHRpbmdzLXN2Z1wiO1xuXG5jb25zdCBDT0RFWF9QTFVTUExVU19SRUxFQVNFU19VUkwgPSBcImh0dHBzOi8vZ2l0aHViLmNvbS9rcGtoeGxneTAvY29kZXgtcGx1c3BsdXMvcmVsZWFzZXNcIjtcblxuLy8gTWlycm9ycyB0aGUgcnVudGltZSdzIG1haW4tc2lkZSBMaXN0ZWRUd2VhayBzaGFwZSAoa2VwdCBpbiBzeW5jIG1hbnVhbGx5KS5cbmludGVyZmFjZSBMaXN0ZWRUd2VhayB7XG4gIG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0O1xuICBlbnRyeTogc3RyaW5nO1xuICBkaXI6IHN0cmluZztcbiAgZW50cnlFeGlzdHM6IGJvb2xlYW47XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZTogVHdlYWtVcGRhdGVDaGVjayB8IG51bGw7XG59XG5cbmludGVyZmFjZSBUd2Vha1VwZGF0ZUNoZWNrIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHJlcG86IHN0cmluZztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgbGF0ZXN0VGFnOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQ29kZXhQbHVzUGx1c0NvbmZpZyB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgYXV0b1VwZGF0ZTogYm9vbGVhbjtcbiAgdXBkYXRlQ2hhbm5lbDogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gIHVwZGF0ZVJlcG86IHN0cmluZztcbiAgdXBkYXRlUmVmOiBzdHJpbmc7XG4gIHVwZGF0ZUNoZWNrOiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sgfCBudWxsO1xuICBzZWxmVXBkYXRlOiBTZWxmVXBkYXRlU3RhdGUgfCBudWxsO1xuICBpbnN0YWxsYXRpb25Tb3VyY2U6IEluc3RhbGxhdGlvblNvdXJjZTtcbn1cblxuaW50ZXJmYWNlIENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB7XG4gIGNoZWNrZWRBdDogc3RyaW5nO1xuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nO1xuICBsYXRlc3RWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlTm90ZXM6IHN0cmluZyB8IG51bGw7XG4gIHVwZGF0ZUF2YWlsYWJsZTogYm9vbGVhbjtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbnR5cGUgU2VsZlVwZGF0ZUNoYW5uZWwgPSBcInN0YWJsZVwiIHwgXCJwcmVyZWxlYXNlXCIgfCBcImN1c3RvbVwiO1xudHlwZSBTZWxmVXBkYXRlU3RhdHVzID0gXCJjaGVja2luZ1wiIHwgXCJ1cC10by1kYXRlXCIgfCBcInVwZGF0ZWRcIiB8IFwiZmFpbGVkXCIgfCBcImRpc2FibGVkXCI7XG5cbmludGVyZmFjZSBTZWxmVXBkYXRlU3RhdGUge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7XG4gIHN0YXR1czogU2VsZlVwZGF0ZVN0YXR1cztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgdGFyZ2V0UmVmOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZXBvOiBzdHJpbmc7XG4gIGNoYW5uZWw6IFNlbGZVcGRhdGVDaGFubmVsO1xuICBzb3VyY2VSb290OiBzdHJpbmc7XG4gIGluc3RhbGxhdGlvblNvdXJjZT86IEluc3RhbGxhdGlvblNvdXJjZTtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJbnN0YWxsYXRpb25Tb3VyY2Uge1xuICBraW5kOiBcImdpdGh1Yi1zb3VyY2VcIiB8IFwiaG9tZWJyZXdcIiB8IFwibG9jYWwtZGV2XCIgfCBcInNvdXJjZS1hcmNoaXZlXCIgfCBcInVua25vd25cIjtcbiAgbGFiZWw6IHN0cmluZztcbiAgZGV0YWlsOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBXYXRjaGVySGVhbHRoIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHN0YXR1czogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgd2F0Y2hlcjogc3RyaW5nO1xuICBjaGVja3M6IFdhdGNoZXJIZWFsdGhDaGVja1tdO1xufVxuXG5pbnRlcmZhY2UgV2F0Y2hlckhlYWx0aENoZWNrIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzdGF0dXM6IFwib2tcIiB8IFwid2FyblwiIHwgXCJlcnJvclwiO1xuICBkZXRhaWw6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXcge1xuICBzY2hlbWFWZXJzaW9uOiAxO1xuICBnZW5lcmF0ZWRBdD86IHN0cmluZztcbiAgc291cmNlVXJsOiBzdHJpbmc7XG4gIGZldGNoZWRBdDogc3RyaW5nO1xuICBlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlWaWV3W107XG59XG5cbmludGVyZmFjZSBUd2Vha1N0b3JlRW50cnlWaWV3IGV4dGVuZHMgVHdlYWtTdG9yZUVudHJ5IHtcbiAgaW5zdGFsbGVkOiB7XG4gICAgdmVyc2lvbjogc3RyaW5nO1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gIH0gfCBudWxsO1xuICBwbGF0Zm9ybT86IHtcbiAgICBjdXJyZW50OiBzdHJpbmc7XG4gICAgc3VwcG9ydGVkOiBzdHJpbmdbXSB8IG51bGw7XG4gICAgY29tcGF0aWJsZTogYm9vbGVhbjtcbiAgICByZWFzb246IHN0cmluZyB8IG51bGw7XG4gIH07XG4gIHJ1bnRpbWU/OiB7XG4gICAgY3VycmVudDogc3RyaW5nO1xuICAgIHJlcXVpcmVkOiBzdHJpbmcgfCBudWxsO1xuICAgIGNvbXBhdGlibGU6IGJvb2xlYW47XG4gICAgcmVhc29uOiBzdHJpbmcgfCBudWxsO1xuICB9O1xufVxuXG4vKipcbiAqIEEgdHdlYWstcmVnaXN0ZXJlZCBwYWdlLiBXZSBjYXJyeSB0aGUgb3duaW5nIHR3ZWFrJ3MgbWFuaWZlc3Qgc28gd2UgY2FuXG4gKiByZXNvbHZlIHJlbGF0aXZlIGljb25VcmxzIGFuZCBzaG93IGF1dGhvcnNoaXAgaW4gdGhlIHBhZ2UgaGVhZGVyLlxuICovXG5pbnRlcmZhY2UgUmVnaXN0ZXJlZFBhZ2Uge1xuICAvKiogRnVsbHktcXVhbGlmaWVkIGlkOiBgPHR3ZWFrSWQ+OjxwYWdlSWQ+YC4gKi9cbiAgaWQ6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgcGFnZTogU2V0dGluZ3NQYWdlO1xuICAvKiogUGVyLXBhZ2UgRE9NIHRlYXJkb3duIHJldHVybmVkIGJ5IGBwYWdlLnJlbmRlcmAsIGlmIGFueS4gKi9cbiAgdGVhcmRvd24/OiAoKCkgPT4gdm9pZCkgfCBudWxsO1xuICAvKiogVGhlIGluamVjdGVkIHNpZGViYXIgYnV0dG9uIChzbyB3ZSBjYW4gdXBkYXRlIGl0cyBhY3RpdmUgc3RhdGUpLiAqL1xuICBuYXZCdXR0b24/OiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG59XG5cbi8qKiBXaGF0IHBhZ2UgaXMgY3VycmVudGx5IHNlbGVjdGVkIGluIG91ciBpbmplY3RlZCBuYXYuICovXG50eXBlIEFjdGl2ZVBhZ2UgPVxuICB8IHsga2luZDogXCJjb25maWdcIiB9XG4gIHwgeyBraW5kOiBcInN0b3JlXCIgfVxuICB8IHsga2luZDogXCJ0d2Vha3NcIiB9XG4gIHwgeyBraW5kOiBcInJlZ2lzdGVyZWRcIjsgaWQ6IHN0cmluZyB9O1xuXG5pbnRlcmZhY2UgSW5qZWN0b3JTdGF0ZSB7XG4gIHNlY3Rpb25zOiBNYXA8c3RyaW5nLCBTZXR0aW5nc1NlY3Rpb24+O1xuICBwYWdlczogTWFwPHN0cmluZywgUmVnaXN0ZXJlZFBhZ2U+O1xuICBsaXN0ZWRUd2Vha3M6IExpc3RlZFR3ZWFrW107XG4gIC8qKiBPdXRlciB3cmFwcGVyIHRoYXQgaG9sZHMgQ29kZXgncyBpdGVtcyBncm91cCArIG91ciBpbmplY3RlZCBncm91cHMuICovXG4gIG91dGVyV3JhcHBlcjogSFRNTEVsZW1lbnQgfCBudWxsO1xuICAvKiogT3VyIFwiR2VuZXJhbFwiIGxhYmVsIGZvciBDb2RleCdzIG5hdGl2ZSBzZXR0aW5ncyBncm91cC4gKi9cbiAgbmF0aXZlTmF2SGVhZGVyOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIC8qKiBPdXIgXCJDb2RleCsrXCIgbmF2IGdyb3VwIChDb25maWcvVHdlYWtzKS4gKi9cbiAgbmF2R3JvdXA6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgbmF2QnV0dG9uczogeyBjb25maWc6IEhUTUxCdXR0b25FbGVtZW50OyB0d2Vha3M6IEhUTUxCdXR0b25FbGVtZW50OyBzdG9yZTogSFRNTEJ1dHRvbkVsZW1lbnQgfSB8IG51bGw7XG4gIC8qKiBTaWRlYmFyIHVwZGF0ZSBwaWxsIHNob3duIG9ubHkgd2hlbiBHaXRIdWIgaGFzIGEgbmV3ZXIgQ29kZXgrKyByZWxlYXNlLiAqL1xuICBjb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIC8qKiBPdXIgXCJUd2Vha3NcIiBuYXYgZ3JvdXAgKHBlci10d2VhayBwYWdlcykuIENyZWF0ZWQgbGF6aWx5LiAqL1xuICBwYWdlc0dyb3VwOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIHBhZ2VzR3JvdXBLZXk6IHN0cmluZyB8IG51bGw7XG4gIHBhbmVsSG9zdDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGw7XG4gIGZpbmdlcnByaW50OiBzdHJpbmcgfCBudWxsO1xuICBzaWRlYmFyRHVtcGVkOiBib29sZWFuO1xuICBhY3RpdmVQYWdlOiBBY3RpdmVQYWdlIHwgbnVsbDtcbiAgc2lkZWJhclJvb3Q6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgc2lkZWJhclJlc3RvcmVIYW5kbGVyOiAoKGU6IEV2ZW50KSA9PiB2b2lkKSB8IG51bGw7XG4gIHNldHRpbmdzU3VyZmFjZVZpc2libGU6IGJvb2xlYW47XG4gIHNldHRpbmdzU3VyZmFjZUhpZGVUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsO1xuICB0d2Vha1N0b3JlOiBUd2Vha1N0b3JlUmVnaXN0cnlWaWV3IHwgbnVsbDtcbiAgdHdlYWtTdG9yZVByb21pc2U6IFByb21pc2U8VHdlYWtTdG9yZVJlZ2lzdHJ5Vmlldz4gfCBudWxsO1xuICB0d2Vha1N0b3JlRXJyb3I6IHVua25vd247XG59XG5cbmNvbnN0IHN0YXRlOiBJbmplY3RvclN0YXRlID0ge1xuICBzZWN0aW9uczogbmV3IE1hcCgpLFxuICBwYWdlczogbmV3IE1hcCgpLFxuICBsaXN0ZWRUd2Vha3M6IFtdLFxuICBvdXRlcldyYXBwZXI6IG51bGwsXG4gIG5hdGl2ZU5hdkhlYWRlcjogbnVsbCxcbiAgbmF2R3JvdXA6IG51bGwsXG4gIG5hdkJ1dHRvbnM6IG51bGwsXG4gIGNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b246IG51bGwsXG4gIHBhZ2VzR3JvdXA6IG51bGwsXG4gIHBhZ2VzR3JvdXBLZXk6IG51bGwsXG4gIHBhbmVsSG9zdDogbnVsbCxcbiAgb2JzZXJ2ZXI6IG51bGwsXG4gIGZpbmdlcnByaW50OiBudWxsLFxuICBzaWRlYmFyRHVtcGVkOiBmYWxzZSxcbiAgYWN0aXZlUGFnZTogbnVsbCxcbiAgc2lkZWJhclJvb3Q6IG51bGwsXG4gIHNpZGViYXJSZXN0b3JlSGFuZGxlcjogbnVsbCxcbiAgc2V0dGluZ3NTdXJmYWNlVmlzaWJsZTogZmFsc2UsXG4gIHNldHRpbmdzU3VyZmFjZUhpZGVUaW1lcjogbnVsbCxcbiAgdHdlYWtTdG9yZTogbnVsbCxcbiAgdHdlYWtTdG9yZVByb21pc2U6IG51bGwsXG4gIHR3ZWFrU3RvcmVFcnJvcjogbnVsbCxcbn07XG5cbmxldCBzY2hlZHVsZWRJbmplY3RGcmFtZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5sZXQgbGFzdFNpZGViYXJNaXNzaW5nTG9nQXQgPSAwO1xuXG5mdW5jdGlvbiBwbG9nKG1zZzogc3RyaW5nLCBleHRyYT86IHVua25vd24pOiB2b2lkIHtcbiAgaXBjUmVuZGVyZXIuc2VuZChcbiAgICBcImNvZGV4cHA6cHJlbG9hZC1sb2dcIixcbiAgICBcImluZm9cIixcbiAgICBgW3NldHRpbmdzLWluamVjdG9yXSAke21zZ30ke2V4dHJhID09PSB1bmRlZmluZWQgPyBcIlwiIDogXCIgXCIgKyBzYWZlU3RyaW5naWZ5KGV4dHJhKX1gLFxuICApO1xufVxuZnVuY3Rpb24gc2FmZVN0cmluZ2lmeSh2OiB1bmtub3duKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gdHlwZW9mIHYgPT09IFwic3RyaW5nXCIgPyB2IDogSlNPTi5zdHJpbmdpZnkodik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBTdHJpbmcodik7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIHB1YmxpYyBBUEkgXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFNldHRpbmdzSW5qZWN0b3IoKTogdm9pZCB7XG4gIGlmIChzdGF0ZS5vYnNlcnZlcikgcmV0dXJuO1xuXG4gIGNvbnN0IG9icyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICBzY2hlZHVsZUluamVjdCgpO1xuICB9KTtcbiAgb2JzLm9ic2VydmUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgc3RhdGUub2JzZXJ2ZXIgPSBvYnM7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJwb3BzdGF0ZVwiLCBvbk5hdik7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiaGFzaGNoYW5nZVwiLCBvbk5hdik7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkRvY3VtZW50Q2xpY2ssIHRydWUpO1xuICBmb3IgKGNvbnN0IG0gb2YgW1wicHVzaFN0YXRlXCIsIFwicmVwbGFjZVN0YXRlXCJdIGFzIGNvbnN0KSB7XG4gICAgY29uc3Qgb3JpZyA9IGhpc3RvcnlbbV07XG4gICAgaGlzdG9yeVttXSA9IGZ1bmN0aW9uICh0aGlzOiBIaXN0b3J5LCAuLi5hcmdzOiBQYXJhbWV0ZXJzPHR5cGVvZiBvcmlnPikge1xuICAgICAgY29uc3QgciA9IG9yaWcuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoYGNvZGV4cHAtJHttfWApKTtcbiAgICAgIHJldHVybiByO1xuICAgIH0gYXMgdHlwZW9mIG9yaWc7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoYGNvZGV4cHAtJHttfWAsIG9uTmF2KTtcbiAgfVxuXG4gIHJ1bkluamVjdEFuZER1bXAoKTtcbiAgbGV0IHRpY2tzID0gMDtcbiAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgdGlja3MrKztcbiAgICBzY2hlZHVsZUluamVjdCgpO1xuICAgIGlmICh0aWNrcyA+IDYwKSBjbGVhckludGVydmFsKGludGVydmFsKTtcbiAgfSwgNTAwKTtcbn1cblxuZnVuY3Rpb24gb25OYXYoKTogdm9pZCB7XG4gIHN0YXRlLmZpbmdlcnByaW50ID0gbnVsbDtcbiAgcnVuSW5qZWN0QW5kRHVtcCgpO1xufVxuXG5mdW5jdGlvbiBydW5JbmplY3RBbmREdW1wKCk6IHZvaWQge1xuICBpZiAoc2NoZWR1bGVkSW5qZWN0RnJhbWUgIT09IG51bGwpIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZShzY2hlZHVsZWRJbmplY3RGcmFtZSk7XG4gICAgc2NoZWR1bGVkSW5qZWN0RnJhbWUgPSBudWxsO1xuICB9XG4gIHRyeUluamVjdCgpO1xuICBtYXliZUR1bXBEb20oKTtcbn1cblxuZnVuY3Rpb24gc2NoZWR1bGVJbmplY3QoKTogdm9pZCB7XG4gIGlmIChzY2hlZHVsZWRJbmplY3RGcmFtZSAhPT0gbnVsbCkgcmV0dXJuO1xuICBzY2hlZHVsZWRJbmplY3RGcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgc2NoZWR1bGVkSW5qZWN0RnJhbWUgPSBudWxsO1xuICAgIHRyeUluamVjdCgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gb25Eb2N1bWVudENsaWNrKGU6IE1vdXNlRXZlbnQpOiB2b2lkIHtcbiAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgaW5zdGFuY2VvZiBFbGVtZW50ID8gZS50YXJnZXQgOiBudWxsO1xuICBjb25zdCBjb250cm9sID0gdGFyZ2V0Py5jbG9zZXN0KFwiW3JvbGU9J2xpbmsnXSxidXR0b24sYVwiKTtcbiAgaWYgKCEoY29udHJvbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgcmV0dXJuO1xuICBpZiAoY29tcGFjdFNldHRpbmdzVGV4dChjb250cm9sLnRleHRDb250ZW50IHx8IFwiXCIpICE9PSBcIkJhY2sgdG8gYXBwXCIpIHJldHVybjtcbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgc2V0U2V0dGluZ3NTdXJmYWNlVmlzaWJsZShmYWxzZSwgXCJiYWNrLXRvLWFwcFwiKTtcbiAgfSwgMCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclNlY3Rpb24oc2VjdGlvbjogU2V0dGluZ3NTZWN0aW9uKTogU2V0dGluZ3NIYW5kbGUge1xuICBzdGF0ZS5zZWN0aW9ucy5zZXQoc2VjdGlvbi5pZCwgc2VjdGlvbik7XG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInR3ZWFrc1wiKSByZXJlbmRlcigpO1xuICByZXR1cm4ge1xuICAgIHVucmVnaXN0ZXI6ICgpID0+IHtcbiAgICAgIHN0YXRlLnNlY3Rpb25zLmRlbGV0ZShzZWN0aW9uLmlkKTtcbiAgICAgIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInR3ZWFrc1wiKSByZXJlbmRlcigpO1xuICAgIH0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhclNlY3Rpb25zKCk6IHZvaWQge1xuICBzdGF0ZS5zZWN0aW9ucy5jbGVhcigpO1xuICAvLyBEcm9wIHJlZ2lzdGVyZWQgcGFnZXMgdG9vIFx1MjAxNCB0aGV5J3JlIG93bmVkIGJ5IHR3ZWFrcyB0aGF0IGp1c3QgZ290XG4gIC8vIHRvcm4gZG93biBieSB0aGUgaG9zdC4gUnVuIGFueSB0ZWFyZG93bnMgYmVmb3JlIGZvcmdldHRpbmcgdGhlbS5cbiAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHAudGVhcmRvd24/LigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHBsb2coXCJwYWdlIHRlYXJkb3duIGZhaWxlZFwiLCB7IGlkOiBwLmlkLCBlcnI6IFN0cmluZyhlKSB9KTtcbiAgICB9XG4gIH1cbiAgc3RhdGUucGFnZXMuY2xlYXIoKTtcbiAgc3luY1BhZ2VzR3JvdXAoKTtcbiAgLy8gSWYgd2Ugd2VyZSBvbiBhIHJlZ2lzdGVyZWQgcGFnZSB0aGF0IG5vIGxvbmdlciBleGlzdHMsIGZhbGwgYmFjayB0b1xuICAvLyByZXN0b3JpbmcgQ29kZXgncyB2aWV3LlxuICBpZiAoXG4gICAgc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJyZWdpc3RlcmVkXCIgJiZcbiAgICAhc3RhdGUucGFnZXMuaGFzKHN0YXRlLmFjdGl2ZVBhZ2UuaWQpXG4gICkge1xuICAgIHJlc3RvcmVDb2RleFZpZXcoKTtcbiAgfSBlbHNlIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInR3ZWFrc1wiKSB7XG4gICAgcmVyZW5kZXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVyIGEgdHdlYWstb3duZWQgc2V0dGluZ3MgcGFnZS4gVGhlIHJ1bnRpbWUgaW5qZWN0cyBhIHNpZGViYXIgZW50cnlcbiAqIHVuZGVyIGEgXCJUV0VBS1NcIiBncm91cCBoZWFkZXIgKHdoaWNoIGFwcGVhcnMgb25seSB3aGVuIGF0IGxlYXN0IG9uZSBwYWdlXG4gKiBpcyByZWdpc3RlcmVkKSBhbmQgcm91dGVzIGNsaWNrcyB0byB0aGUgcGFnZSdzIGByZW5kZXIocm9vdClgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQYWdlKFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0LFxuICBwYWdlOiBTZXR0aW5nc1BhZ2UsXG4pOiBTZXR0aW5nc0hhbmRsZSB7XG4gIGNvbnN0IGlkID0gcGFnZS5pZDsgLy8gYWxyZWFkeSBuYW1lc3BhY2VkIGJ5IHR3ZWFrLWhvc3QgYXMgYCR7dHdlYWtJZH06JHtwYWdlLmlkfWBcbiAgY29uc3QgZW50cnk6IFJlZ2lzdGVyZWRQYWdlID0geyBpZCwgdHdlYWtJZCwgbWFuaWZlc3QsIHBhZ2UgfTtcbiAgc3RhdGUucGFnZXMuc2V0KGlkLCBlbnRyeSk7XG4gIHBsb2coXCJyZWdpc3RlclBhZ2VcIiwgeyBpZCwgdGl0bGU6IHBhZ2UudGl0bGUsIHR3ZWFrSWQgfSk7XG4gIHN5bmNQYWdlc0dyb3VwKCk7XG4gIC8vIElmIHRoZSB1c2VyIHdhcyBhbHJlYWR5IG9uIHRoaXMgcGFnZSAoaG90IHJlbG9hZCksIHJlLW1vdW50IGl0cyBib2R5LlxuICBpZiAoc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJyZWdpc3RlcmVkXCIgJiYgc3RhdGUuYWN0aXZlUGFnZS5pZCA9PT0gaWQpIHtcbiAgICByZXJlbmRlcigpO1xuICB9XG4gIHJldHVybiB7XG4gICAgdW5yZWdpc3RlcjogKCkgPT4ge1xuICAgICAgY29uc3QgZSA9IHN0YXRlLnBhZ2VzLmdldChpZCk7XG4gICAgICBpZiAoIWUpIHJldHVybjtcbiAgICAgIHRyeSB7XG4gICAgICAgIGUudGVhcmRvd24/LigpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgICAgc3RhdGUucGFnZXMuZGVsZXRlKGlkKTtcbiAgICAgIHN5bmNQYWdlc0dyb3VwKCk7XG4gICAgICBpZiAoc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJyZWdpc3RlcmVkXCIgJiYgc3RhdGUuYWN0aXZlUGFnZS5pZCA9PT0gaWQpIHtcbiAgICAgICAgcmVzdG9yZUNvZGV4VmlldygpO1xuICAgICAgfVxuICAgIH0sXG4gIH07XG59XG5cbi8qKiBDYWxsZWQgYnkgdGhlIHR3ZWFrIGhvc3QgYWZ0ZXIgZmV0Y2hpbmcgdGhlIHR3ZWFrIGxpc3QgZnJvbSBtYWluLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldExpc3RlZFR3ZWFrcyhsaXN0OiBMaXN0ZWRUd2Vha1tdKTogdm9pZCB7XG4gIHN0YXRlLmxpc3RlZFR3ZWFrcyA9IGxpc3Q7XG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInR3ZWFrc1wiKSByZXJlbmRlcigpO1xufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgaW5qZWN0aW9uIFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiB0cnlJbmplY3QoKTogdm9pZCB7XG4gIHJlbW92ZU1pc3BsYWNlZFNldHRpbmdzR3JvdXBzKCk7XG5cbiAgY29uc3QgaXRlbXNHcm91cCA9IGZpbmRTaWRlYmFySXRlbXNHcm91cCgpO1xuICBpZiAoIWl0ZW1zR3JvdXApIHtcbiAgICBzY2hlZHVsZVNldHRpbmdzU3VyZmFjZUhpZGRlbigpO1xuICAgIGxvZ1NpZGViYXJNaXNzaW5nKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxhc3RTaWRlYmFyTWlzc2luZ0xvZ0F0ID0gMDtcbiAgaWYgKHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lcikge1xuICAgIGNsZWFyVGltZW91dChzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIpO1xuICAgIHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lciA9IG51bGw7XG4gIH1cbiAgc2V0U2V0dGluZ3NTdXJmYWNlVmlzaWJsZSh0cnVlLCBcInNpZGViYXItZm91bmRcIik7XG4gIC8vIENvZGV4J3MgbmF0aXZlIHNldHRpbmdzIGdyb3VwcyBsaXZlIGluc2lkZSB0aGUgc2Nyb2xsYWJsZSBuYXYgc3RhY2suIElmIHdlXG4gIC8vIGFwcGVuZCBvdXRzaWRlIHRoYXQgc3RhY2ssIHRoZSBmbGV4LTEgc2Nyb2xsZXIgcHVzaGVzIENvZGV4KysgdG8gdGhlIGJvdHRvbVxuICAvLyBvZiB0aGUgc2lkZWJhciBhbmQgY3JlYXRlcyBhIGxhcmdlIHZpc3VhbCBnYXAgYWZ0ZXIgdGhlIGxhc3QgbmF0aXZlIGdyb3VwLlxuICBjb25zdCBvdXRlciA9IGZpbmRTaWRlYmFySW5qZWN0aW9uUm9vdChpdGVtc0dyb3VwKTtcbiAgaWYgKCFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShpdGVtc0dyb3VwKSB8fCAhaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUob3V0ZXIpKSB7XG4gICAgc2NoZWR1bGVTZXR0aW5nc1N1cmZhY2VIaWRkZW4oKTtcbiAgICBwbG9nKFwicmVqZWN0ZWQgbm9uLXNldHRpbmdzIHNpZGViYXIgY2FuZGlkYXRlXCIsIHtcbiAgICAgIGl0ZW1zR3JvdXA6IGRlc2NyaWJlKGl0ZW1zR3JvdXApLFxuICAgICAgb3V0ZXI6IGRlc2NyaWJlKG91dGVyKSxcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cbiAgc3RhdGUuc2lkZWJhclJvb3QgPSBvdXRlcjtcbiAgcmVtb3ZlU2V0dGluZ3NHcm91cHNPdXRzaWRlUm9vdChvdXRlcik7XG4gIHN5bmNOYXRpdmVTZXR0aW5nc0hlYWRlcihpdGVtc0dyb3VwLCBvdXRlcik7XG5cbiAgaWYgKHN0YXRlLm5hdkdyb3VwICYmIG91dGVyLmNvbnRhaW5zKHN0YXRlLm5hdkdyb3VwKSkge1xuICAgIHN5bmNQYWdlc0dyb3VwKCk7XG4gICAgLy8gQ29kZXggcmUtcmVuZGVycyBpdHMgbmF0aXZlIHNpZGViYXIgYnV0dG9ucyBvbiBpdHMgb3duIHN0YXRlIGNoYW5nZXMuXG4gICAgLy8gSWYgb25lIG9mIG91ciBwYWdlcyBpcyBhY3RpdmUsIHJlLXN0cmlwIENvZGV4J3MgYWN0aXZlIHN0eWxpbmcgc29cbiAgICAvLyBHZW5lcmFsIGRvZXNuJ3QgcmVhcHBlYXIgYXMgc2VsZWN0ZWQuXG4gICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2UgIT09IG51bGwpIHN5bmNDb2RleE5hdGl2ZU5hdkFjdGl2ZSh0cnVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBTaWRlYmFyIHdhcyBlaXRoZXIgZnJlc2hseSBtb3VudGVkIChTZXR0aW5ncyBqdXN0IG9wZW5lZCkgb3IgcmUtbW91bnRlZFxuICAvLyAoY2xvc2VkIGFuZCByZS1vcGVuZWQsIG9yIG5hdmlnYXRlZCBhd2F5IGFuZCBiYWNrKS4gSW4gYWxsIG9mIHRob3NlXG4gIC8vIGNhc2VzIENvZGV4IHJlc2V0cyB0byBpdHMgZGVmYXVsdCBwYWdlIChHZW5lcmFsKSwgYnV0IG91ciBpbi1tZW1vcnlcbiAgLy8gYGFjdGl2ZVBhZ2VgIG1heSBzdGlsbCByZWZlcmVuY2UgdGhlIGxhc3QgdHdlYWsvcGFnZSB0aGUgdXNlciBoYWQgb3BlblxuICAvLyBcdTIwMTQgd2hpY2ggd291bGQgY2F1c2UgdGhhdCBuYXYgYnV0dG9uIHRvIHJlbmRlciB3aXRoIHRoZSBhY3RpdmUgc3R5bGluZ1xuICAvLyBldmVuIHRob3VnaCBDb2RleCBpcyBzaG93aW5nIEdlbmVyYWwuIENsZWFyIGl0IHNvIGBzeW5jUGFnZXNHcm91cGAgL1xuICAvLyBgc2V0TmF2QWN0aXZlYCBzdGFydCBmcm9tIGEgbmV1dHJhbCBzdGF0ZS4gVGhlIHBhbmVsSG9zdCByZWZlcmVuY2UgaXNcbiAgLy8gYWxzbyBzdGFsZSAoaXRzIERPTSB3YXMgZGlzY2FyZGVkIHdpdGggdGhlIHByZXZpb3VzIGNvbnRlbnQgYXJlYSkuXG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlICE9PSBudWxsIHx8IHN0YXRlLnBhbmVsSG9zdCAhPT0gbnVsbCkge1xuICAgIHBsb2coXCJzaWRlYmFyIHJlLW1vdW50IGRldGVjdGVkOyBjbGVhcmluZyBzdGFsZSBhY3RpdmUgc3RhdGVcIiwge1xuICAgICAgcHJldkFjdGl2ZTogc3RhdGUuYWN0aXZlUGFnZSxcbiAgICB9KTtcbiAgICBzdGF0ZS5hY3RpdmVQYWdlID0gbnVsbDtcbiAgICBzdGF0ZS5wYW5lbEhvc3QgPSBudWxsO1xuICB9XG5cbiAgY29uc3QgZXhpc3RpbmdDb2RleFBwTmF2R3JvdXAgPVxuICAgIG91dGVyLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCc6c2NvcGUgPiBbZGF0YS1jb2RleHBwPVwibmF2LWdyb3VwXCJdJykgPz9cbiAgICBvdXRlci5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignW2RhdGEtY29kZXhwcD1cIm5hdi1ncm91cFwiXScpO1xuXG4gIGlmIChleGlzdGluZ0NvZGV4UHBOYXZHcm91cCkge1xuICAgIHN0YXRlLm5hdkdyb3VwID0gZXhpc3RpbmdDb2RleFBwTmF2R3JvdXA7XG4gICAgc3RhdGUuY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbiA9IGV4aXN0aW5nQ29kZXhQcE5hdkdyb3VwLnF1ZXJ5U2VsZWN0b3I8SFRNTEJ1dHRvbkVsZW1lbnQ+KFxuICAgICAgXCJbZGF0YS1jb2RleHBwLXNpZGViYXItdXBkYXRlXVwiLFxuICAgICk7XG4gICAgc3RhdGUuc2lkZWJhclJvb3QgPSBvdXRlcjtcbiAgICBzeW5jUGFnZXNHcm91cCgpO1xuICAgIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbigpO1xuICAgIGlmIChzdGF0ZS5hY3RpdmVQYWdlICE9PSBudWxsKSBzeW5jQ29kZXhOYXRpdmVOYXZBY3RpdmUodHJ1ZSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEdyb3VwIGNvbnRhaW5lciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgZ3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBncm91cC5kYXRhc2V0LmNvZGV4cHAgPSBcIm5hdi1ncm91cFwiO1xuICBncm91cC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTFcIjtcblxuICBjb25zdCB1cGRhdGVCdXR0b24gPSBzaWRlYmFyVXBkYXRlUGlsbEJ1dHRvbigpO1xuICBzdGF0ZS5jb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uID0gdXBkYXRlQnV0dG9uO1xuICBncm91cC5hcHBlbmRDaGlsZChzaWRlYmFyR3JvdXBIZWFkZXIoXCJDb2RleCsrXCIsIHVwZGF0ZUJ1dHRvbikpO1xuICByZWZyZXNoU2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgU2lkZWJhciBpdGVtcyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgY29uZmlnQnRuID0gbWFrZVNpZGViYXJJdGVtKFwiQ29uZmlnXCIsIGNvbmZpZ0ljb25TdmcoKSk7XG4gIGNvbnN0IHR3ZWFrc0J0biA9IG1ha2VTaWRlYmFySXRlbShcIlR3ZWFrc1wiLCB0d2Vha3NJY29uU3ZnKCkpO1xuICBjb25zdCBzdG9yZUJ0biA9IG1ha2VTaWRlYmFySXRlbShcIlR3ZWFrIFN0b3JlXCIsIHN0b3JlSWNvblN2ZygpKTtcbiAgYXBwZW5kU2lkZWJhclN0b3JlVXBkYXRlQmFkZ2Uoc3RvcmVCdG4pO1xuXG4gIGNvbmZpZ0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcImNvbmZpZ1wiIH0pO1xuICB9KTtcbiAgdHdlYWtzQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGFjdGl2YXRlUGFnZSh7IGtpbmQ6IFwidHdlYWtzXCIgfSk7XG4gIH0pO1xuICBzdG9yZUJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcInN0b3JlXCIgfSk7XG4gIH0pO1xuXG4gIGNvbnN0IGl0ZW1zID0gc2lkZWJhckdyb3VwSXRlbXMoKTtcbiAgaXRlbXMuYXBwZW5kQ2hpbGQoY29uZmlnQnRuKTtcbiAgaXRlbXMuYXBwZW5kQ2hpbGQodHdlYWtzQnRuKTtcbiAgaXRlbXMuYXBwZW5kQ2hpbGQoc3RvcmVCdG4pO1xuICBncm91cC5hcHBlbmRDaGlsZChpdGVtcyk7XG4gIG91dGVyLmFwcGVuZENoaWxkKGdyb3VwKTtcblxuICBzdGF0ZS5uYXZHcm91cCA9IGdyb3VwO1xuICBzdGF0ZS5uYXZCdXR0b25zID0geyBjb25maWc6IGNvbmZpZ0J0biwgdHdlYWtzOiB0d2Vha3NCdG4sIHN0b3JlOiBzdG9yZUJ0biB9O1xuICBwbG9nKFwibmF2IGdyb3VwIGluamVjdGVkXCIsIHsgb3V0ZXJUYWc6IG91dGVyLnRhZ05hbWUgfSk7XG4gIHN5bmNQYWdlc0dyb3VwKCk7XG59XG5cbmZ1bmN0aW9uIGxvZ1NpZGViYXJNaXNzaW5nKCk6IHZvaWQge1xuICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICBpZiAobm93IC0gbGFzdFNpZGViYXJNaXNzaW5nTG9nQXQgPCA1MDAwKSByZXR1cm47XG4gIGxhc3RTaWRlYmFyTWlzc2luZ0xvZ0F0ID0gbm93O1xuICBwbG9nKFwic2lkZWJhciBub3QgZm91bmRcIik7XG59XG5cbmZ1bmN0aW9uIHN5bmNOYXRpdmVTZXR0aW5nc0hlYWRlcihpdGVtc0dyb3VwOiBIVE1MRWxlbWVudCwgb3V0ZXI6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGlmIChzdGF0ZS5uYXRpdmVOYXZIZWFkZXIgJiYgb3V0ZXIuY29udGFpbnMoc3RhdGUubmF0aXZlTmF2SGVhZGVyKSkgcmV0dXJuO1xuICBpZiAob3V0ZXIgPT09IGl0ZW1zR3JvdXApIHJldHVybjtcbiAgaWYgKGhhc05hdGl2ZVNldHRpbmdzU2VjdGlvbkhlYWRlcnMob3V0ZXIpKSByZXR1cm47XG5cbiAgY29uc3QgaGVhZGVyID0gc2lkZWJhckdyb3VwSGVhZGVyKFwiR2VuZXJhbFwiKTtcbiAgaGVhZGVyLmRhdGFzZXQuY29kZXhwcCA9IFwibmF0aXZlLW5hdi1oZWFkZXJcIjtcbiAgb3V0ZXIuaW5zZXJ0QmVmb3JlKGhlYWRlciwgaXRlbXNHcm91cCk7XG4gIHN0YXRlLm5hdGl2ZU5hdkhlYWRlciA9IGhlYWRlcjtcbn1cblxuZnVuY3Rpb24gZmluZFNpZGViYXJJbmplY3Rpb25Sb290KGl0ZW1zR3JvdXA6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBvd25TY3JvbGxhYmxlID0gc21hbGxlc3RTZXR0aW5nc1Njcm9sbGFibGUoW2l0ZW1zR3JvdXBdKTtcbiAgaWYgKG93blNjcm9sbGFibGUpIHJldHVybiBvd25TY3JvbGxhYmxlO1xuXG4gIGNvbnN0IGRlc2NlbmRhbnRTY3JvbGxhYmxlID0gc21hbGxlc3RTZXR0aW5nc1Njcm9sbGFibGUoXG4gICAgQXJyYXkuZnJvbShpdGVtc0dyb3VwLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiZGl2LG5hdixhc2lkZVwiKSksXG4gICk7XG4gIGlmIChkZXNjZW5kYW50U2Nyb2xsYWJsZSkgcmV0dXJuIGRlc2NlbmRhbnRTY3JvbGxhYmxlO1xuXG4gIGNvbnN0IGFuY2VzdG9yczogSFRNTEVsZW1lbnRbXSA9IFtdO1xuICBsZXQgbm9kZSA9IGl0ZW1zR3JvdXAucGFyZW50RWxlbWVudDtcbiAgZm9yIChsZXQgZGVwdGggPSAwOyBub2RlICYmIGRlcHRoIDwgNTsgZGVwdGgrKykge1xuICAgIGFuY2VzdG9ycy5wdXNoKG5vZGUpO1xuICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gIH1cbiAgY29uc3QgYW5jZXN0b3JTY3JvbGxhYmxlID0gc21hbGxlc3RTZXR0aW5nc1Njcm9sbGFibGUoYW5jZXN0b3JzKTtcbiAgaWYgKGFuY2VzdG9yU2Nyb2xsYWJsZSkgcmV0dXJuIGFuY2VzdG9yU2Nyb2xsYWJsZTtcblxuICByZXR1cm4gaXRlbXNHcm91cC5wYXJlbnRFbGVtZW50ID8/IGl0ZW1zR3JvdXA7XG59XG5cbmZ1bmN0aW9uIHNtYWxsZXN0U2V0dGluZ3NTY3JvbGxhYmxlKG5vZGVzOiBIVE1MRWxlbWVudFtdKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgbGV0IGJlc3Q6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIGxldCBiZXN0QXJlYSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcblxuICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICBpZiAoIW5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKFwib3ZlcmZsb3cteS1hdXRvXCIpKSBjb250aW51ZTtcbiAgICBpZiAoIWlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKG5vZGUpKSBjb250aW51ZTtcbiAgICBjb25zdCByZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBhcmVhID0gcmVjdC53aWR0aCAqIHJlY3QuaGVpZ2h0O1xuICAgIGlmIChhcmVhIDwgYmVzdEFyZWEpIHtcbiAgICAgIGJlc3QgPSBub2RlO1xuICAgICAgYmVzdEFyZWEgPSBhcmVhO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBiZXN0O1xufVxuXG5mdW5jdGlvbiByZW1vdmVTZXR0aW5nc0dyb3Vwc091dHNpZGVSb290KHJvb3Q6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGdyb3VwcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFxuICAgIFwiW2RhdGEtY29kZXhwcD0nbmF2LWdyb3VwJ10sIFtkYXRhLWNvZGV4cHA9J3BhZ2VzLWdyb3VwJ10sIFtkYXRhLWNvZGV4cHA9J25hdGl2ZS1uYXYtaGVhZGVyJ11cIixcbiAgKTtcbiAgZm9yIChjb25zdCBncm91cCBvZiBBcnJheS5mcm9tKGdyb3VwcykpIHtcbiAgICBpZiAoZ3JvdXAucGFyZW50RWxlbWVudCA9PT0gcm9vdCkgY29udGludWU7XG4gICAgcmVzZXRDb2RleFBwSW5qZWN0ZWRTZXR0aW5nc0dyb3VwU3RhdGUoZ3JvdXApO1xuICAgIGdyb3VwLnJlbW92ZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNpZGViYXJHcm91cEhlYWRlcih0ZXh0OiBzdHJpbmcsIHRyYWlsaW5nPzogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRlci5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwci0wLjUgcGwtMiBzZWxlY3Qtbm9uZVwiO1xuICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBsYWJlbC5jbGFzc05hbWUgPSBcIm1pbi13LTAgZmxleC0xIHRydW5jYXRlIHRleHQtYmFzZSB0ZXh0LXRva2VuLWlucHV0LXBsYWNlaG9sZGVyLWZvcmVncm91bmQgb3BhY2l0eS03NVwiO1xuICBsYWJlbC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIGhlYWRlci5hcHBlbmRDaGlsZChsYWJlbCk7XG4gIGlmICh0cmFpbGluZykge1xuICAgIGNvbnN0IHRyYWlsaW5nV3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgdHJhaWxpbmdXcmFwLmNsYXNzTmFtZSA9IFwic2hyaW5rLTBcIjtcbiAgICB0cmFpbGluZ1dyYXAuYXBwZW5kQ2hpbGQodHJhaWxpbmcpO1xuICAgIGhlYWRlci5hcHBlbmRDaGlsZCh0cmFpbGluZ1dyYXApO1xuICB9XG4gIHJldHVybiBoZWFkZXI7XG59XG5cbmZ1bmN0aW9uIHNpZGViYXJHcm91cEl0ZW1zKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgaXRlbXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBpdGVtcy5kYXRhc2V0LmNvZGV4cHAgPSBcImdyb3VwLWl0ZW1zXCI7XG4gIGl0ZW1zLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtcHhcIjtcbiAgcmV0dXJuIGl0ZW1zO1xufVxuXG5mdW5jdGlvbiBzY2hlZHVsZVNldHRpbmdzU3VyZmFjZUhpZGRlbigpOiB2b2lkIHtcbiAgaWYgKCFzdGF0ZS5zZXR0aW5nc1N1cmZhY2VWaXNpYmxlIHx8IHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lcikgcmV0dXJuO1xuICBzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIgPSBudWxsO1xuICAgIGNvbnN0IHNpZGViYXIgPSBmaW5kU2lkZWJhckl0ZW1zR3JvdXAoKTtcbiAgICBpZiAoc2lkZWJhciAmJiBpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShzaWRlYmFyKSkgcmV0dXJuO1xuICAgIGlmIChpc1NldHRpbmdzVGV4dFZpc2libGUoKSkgcmV0dXJuO1xuICAgIHNldFNldHRpbmdzU3VyZmFjZVZpc2libGUoZmFsc2UsIFwic2lkZWJhci1ub3QtZm91bmRcIik7XG4gIH0sIDE1MDApO1xufVxuXG5mdW5jdGlvbiBpc1NldHRpbmdzVGV4dFZpc2libGUoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0KGNvZGV4UHBTZXR0aW5nc0xhYmVsc0Zyb20oZG9jdW1lbnQpKTtcbn1cblxuZnVuY3Rpb24gc2V0U2V0dGluZ3NTdXJmYWNlVmlzaWJsZSh2aXNpYmxlOiBib29sZWFuLCByZWFzb246IHN0cmluZyk6IHZvaWQge1xuICBpZiAoc3RhdGUuc2V0dGluZ3NTdXJmYWNlVmlzaWJsZSA9PT0gdmlzaWJsZSkgcmV0dXJuO1xuICBzdGF0ZS5zZXR0aW5nc1N1cmZhY2VWaXNpYmxlID0gdmlzaWJsZTtcbiAgaWYgKHZpc2libGUpIHdhcm1Ud2Vha1N0b3JlKCk7XG4gIHRyeSB7XG4gICAgKHdpbmRvdyBhcyBXaW5kb3cgJiB7IF9fY29kZXhwcFNldHRpbmdzU3VyZmFjZVZpc2libGU/OiBib29sZWFuIH0pLl9fY29kZXhwcFNldHRpbmdzU3VyZmFjZVZpc2libGUgPSB2aXNpYmxlO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmNvZGV4cHBTZXR0aW5nc1N1cmZhY2UgPSB2aXNpYmxlID8gXCJ0cnVlXCIgOiBcImZhbHNlXCI7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQoXG4gICAgICBuZXcgQ3VzdG9tRXZlbnQoXCJjb2RleHBwOnNldHRpbmdzLXN1cmZhY2VcIiwge1xuICAgICAgICBkZXRhaWw6IHsgdmlzaWJsZSwgcmVhc29uIH0sXG4gICAgICB9KSxcbiAgICApO1xuICB9IGNhdGNoIHt9XG4gIHBsb2coXCJzZXR0aW5ncyBzdXJmYWNlXCIsIHsgdmlzaWJsZSwgcmVhc29uLCB1cmw6IGxvY2F0aW9uLmhyZWYgfSk7XG59XG5cbi8qKlxuICogUmVuZGVyIChvciByZS1yZW5kZXIpIHRoZSBzZWNvbmQgc2lkZWJhciBncm91cCBvZiBwZXItdHdlYWsgcGFnZXMuIFRoZVxuICogZ3JvdXAgaXMgY3JlYXRlZCBsYXppbHkgYW5kIHJlbW92ZWQgd2hlbiB0aGUgbGFzdCBwYWdlIHVucmVnaXN0ZXJzLCBzb1xuICogdXNlcnMgd2l0aCBubyBwYWdlLXJlZ2lzdGVyaW5nIHR3ZWFrcyBuZXZlciBzZWUgYW4gZW1wdHkgXCJUd2Vha3NcIiBoZWFkZXIuXG4gKi9cbmZ1bmN0aW9uIHN5bmNQYWdlc0dyb3VwKCk6IHZvaWQge1xuICBjb25zdCBvdXRlciA9IHN0YXRlLnNpZGViYXJSb290O1xuICBpZiAoIW91dGVyKSByZXR1cm47XG4gIGlmICghaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUob3V0ZXIpKSB7XG4gICAgc3RhdGUuc2lkZWJhclJvb3QgPSBudWxsO1xuICAgIHN0YXRlLnBhZ2VzR3JvdXAgPSBudWxsO1xuICAgIHN0YXRlLnBhZ2VzR3JvdXBLZXkgPSBudWxsO1xuICAgIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkgcC5uYXZCdXR0b24gPSBudWxsO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBwYWdlcyA9IFsuLi5zdGF0ZS5wYWdlcy52YWx1ZXMoKV07XG5cbiAgLy8gQnVpbGQgYSBkZXRlcm1pbmlzdGljIGZpbmdlcnByaW50IG9mIHRoZSBkZXNpcmVkIGdyb3VwIHN0YXRlLiBJZiB0aGVcbiAgLy8gY3VycmVudCBET00gZ3JvdXAgYWxyZWFkeSBtYXRjaGVzLCB0aGlzIGlzIGEgbm8tb3AgXHUyMDE0IGNyaXRpY2FsLCBiZWNhdXNlXG4gIC8vIHN5bmNQYWdlc0dyb3VwIGlzIGNhbGxlZCBvbiBldmVyeSBNdXRhdGlvbk9ic2VydmVyIHRpY2sgYW5kIGFueSBET01cbiAgLy8gd3JpdGUgd291bGQgcmUtdHJpZ2dlciB0aGF0IG9ic2VydmVyIChpbmZpbml0ZSBsb29wLCBhcHAgZnJlZXplKS5cbiAgY29uc3QgZGVzaXJlZEtleSA9IHBhZ2VzLmxlbmd0aCA9PT0gMFxuICAgID8gXCJFTVBUWVwiXG4gICAgOiBwYWdlcy5tYXAoKHApID0+IGAke3AuaWR9fCR7cC5wYWdlLnRpdGxlfXwke3AucGFnZS5pY29uU3ZnID8/IFwiXCJ9YCkuam9pbihcIlxcblwiKTtcbiAgY29uc3QgZ3JvdXBBdHRhY2hlZCA9ICEhc3RhdGUucGFnZXNHcm91cCAmJiBvdXRlci5jb250YWlucyhzdGF0ZS5wYWdlc0dyb3VwKTtcbiAgaWYgKHN0YXRlLnBhZ2VzR3JvdXBLZXkgPT09IGRlc2lyZWRLZXkgJiYgKHBhZ2VzLmxlbmd0aCA9PT0gMCA/ICFncm91cEF0dGFjaGVkIDogZ3JvdXBBdHRhY2hlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAocGFnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKHN0YXRlLnBhZ2VzR3JvdXApIHtcbiAgICAgIHN0YXRlLnBhZ2VzR3JvdXAucmVtb3ZlKCk7XG4gICAgICBzdGF0ZS5wYWdlc0dyb3VwID0gbnVsbDtcbiAgICB9XG4gICAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSBwLm5hdkJ1dHRvbiA9IG51bGw7XG4gICAgc3RhdGUucGFnZXNHcm91cEtleSA9IGRlc2lyZWRLZXk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IGdyb3VwID0gc3RhdGUucGFnZXNHcm91cDtcbiAgaWYgKCFncm91cCB8fCAhb3V0ZXIuY29udGFpbnMoZ3JvdXApKSB7XG4gICAgZ3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGdyb3VwLmRhdGFzZXQuY29kZXhwcCA9IFwicGFnZXMtZ3JvdXBcIjtcbiAgICBncm91cC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTFcIjtcbiAgICBncm91cC5hcHBlbmRDaGlsZChzaWRlYmFyR3JvdXBIZWFkZXIoXCJUd2Vha3NcIikpO1xuICAgIGdyb3VwLmFwcGVuZENoaWxkKHNpZGViYXJHcm91cEl0ZW1zKCkpO1xuICAgIG91dGVyLmFwcGVuZENoaWxkKGdyb3VwKTtcbiAgICBzdGF0ZS5wYWdlc0dyb3VwID0gZ3JvdXA7XG4gIH1cblxuICBsZXQgaXRlbXMgPSBncm91cC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignOnNjb3BlID4gW2RhdGEtY29kZXhwcD1cImdyb3VwLWl0ZW1zXCJdJyk7XG4gIGlmICghaXRlbXMpIHtcbiAgICBpdGVtcyA9IHNpZGViYXJHcm91cEl0ZW1zKCk7XG4gICAgd2hpbGUgKGdyb3VwLmNoaWxkcmVuLmxlbmd0aCA+IDEpIGl0ZW1zLmFwcGVuZENoaWxkKGdyb3VwLmNoaWxkcmVuWzFdKTtcbiAgICBncm91cC5hcHBlbmRDaGlsZChpdGVtcyk7XG4gIH1cbiAgaXRlbXMucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgZm9yIChjb25zdCBwIG9mIHBhZ2VzKSB7XG4gICAgY29uc3QgaWNvbiA9IHAucGFnZS5pY29uU3ZnID8/IGRlZmF1bHRQYWdlSWNvblN2ZygpO1xuICAgIGNvbnN0IGJ0biA9IG1ha2VTaWRlYmFySXRlbShwLnBhZ2UudGl0bGUsIGljb24pO1xuICAgIGJ0bi5kYXRhc2V0LmNvZGV4cHAgPSBgbmF2LXBhZ2UtJHtwLmlkfWA7XG4gICAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGFjdGl2YXRlUGFnZSh7IGtpbmQ6IFwicmVnaXN0ZXJlZFwiLCBpZDogcC5pZCB9KTtcbiAgICB9KTtcbiAgICBwLm5hdkJ1dHRvbiA9IGJ0bjtcbiAgICBpdGVtcy5hcHBlbmRDaGlsZChidG4pO1xuICB9XG4gIHN0YXRlLnBhZ2VzR3JvdXBLZXkgPSBkZXNpcmVkS2V5O1xuICBwbG9nKFwicGFnZXMgZ3JvdXAgc3luY2VkXCIsIHtcbiAgICBjb3VudDogcGFnZXMubGVuZ3RoLFxuICAgIGlkczogcGFnZXMubWFwKChwKSA9PiBwLmlkKSxcbiAgfSk7XG4gIC8vIFJlZmxlY3QgY3VycmVudCBhY3RpdmUgc3RhdGUgYWNyb3NzIHRoZSByZWJ1aWx0IGJ1dHRvbnMuXG4gIHNldE5hdkFjdGl2ZShzdGF0ZS5hY3RpdmVQYWdlKTtcbn1cblxuZnVuY3Rpb24gbWFrZVNpZGViYXJJdGVtKGxhYmVsOiBzdHJpbmcsIGljb25Tdmc6IHN0cmluZyk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgLy8gQ2xhc3Mgc3RyaW5nIGNvcGllZCB2ZXJiYXRpbSBmcm9tIENvZGV4J3Mgc2lkZWJhciBidXR0b25zIChHZW5lcmFsIGV0YykuXG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmRhdGFzZXQuY29kZXhwcCA9IGBuYXYtJHtsYWJlbC50b0xvd2VyQ2FzZSgpfWA7XG4gIGJ0bi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIGxhYmVsKTtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgXCJmb2N1cy12aXNpYmxlOm91dGxpbmUtdG9rZW4tYm9yZGVyIHJlbGF0aXZlIHB4LXJvdy14IHB5LXJvdy15IGN1cnNvci1pbnRlcmFjdGlvbiBzaHJpbmstMCBpdGVtcy1jZW50ZXIgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtbGcgdGV4dC1sZWZ0IHRleHQtc20gZm9jdXMtdmlzaWJsZTpvdXRsaW5lIGZvY3VzLXZpc2libGU6b3V0bGluZS0yIGZvY3VzLXZpc2libGU6b3V0bGluZS1vZmZzZXQtMiBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS01MCBnYXAtMiBmbGV4IHctZnVsbCBob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgZm9udC1ub3JtYWxcIjtcblxuICBjb25zdCBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGlubmVyLmNsYXNzTmFtZSA9XG4gICAgXCJmbGV4IG1pbi13LTAgaXRlbXMtY2VudGVyIHRleHQtYmFzZSBnYXAtMiBmbGV4LTEgdGV4dC10b2tlbi1mb3JlZ3JvdW5kXCI7XG4gIGFwcGVuZFN2Z0h0bWwoaW5uZXIsIGljb25TdmcpO1xuICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHRleHQuY2xhc3NOYW1lID0gXCJ0cnVuY2F0ZVwiO1xuICB0ZXh0LnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGlubmVyLmFwcGVuZENoaWxkKHRleHQpO1xuICBidG4uYXBwZW5kQ2hpbGQoaW5uZXIpO1xuICByZXR1cm4gYnRuO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRTaWRlYmFyU3RvcmVVcGRhdGVCYWRnZShidG46IEhUTUxCdXR0b25FbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGlubmVyID0gYnRuLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKCFpbm5lcikgcmV0dXJuO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBiYWRnZS5kYXRhc2V0LmNvZGV4cHBTdG9yZVVwZGF0ZUJhZGdlID0gXCJ0cnVlXCI7XG4gIGJhZGdlLmhpZGRlbiA9IHRydWU7XG4gIGJhZGdlLnRpdGxlID0gXCJJbnN0YWxsZWQgdHdlYWtzIHdpdGggYXBwcm92ZWQgdXBkYXRlc1wiO1xuICBiYWRnZS5jbGFzc05hbWUgPSBcImlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiO1xuICBPYmplY3QuYXNzaWduKGJhZGdlLnN0eWxlLCB7XG4gICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcbiAgICByaWdodDogXCIxMnB4XCIsXG4gICAgdG9wOiBcIjUwJVwiLFxuICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKC01MCUpXCIsXG4gICAgekluZGV4OiBcIjFcIixcbiAgfSk7XG4gIGFwcGx5U3RvcmVVcGRhdGVCYWRnZVN0eWxlKGJhZGdlLCBudWxsKTtcbiAgYnRuLmFwcGVuZENoaWxkKGJhZGdlKTtcbn1cblxuLyoqIEludGVybmFsIGtleSBmb3IgdGhlIGJ1aWx0LWluIG5hdiBidXR0b25zLiAqL1xudHlwZSBCdWlsdGluUGFnZSA9IFwiY29uZmlnXCIgfCBcInR3ZWFrc1wiIHwgXCJzdG9yZVwiO1xuXG5mdW5jdGlvbiBzZXROYXZBY3RpdmUoYWN0aXZlOiBBY3RpdmVQYWdlIHwgbnVsbCk6IHZvaWQge1xuICAvLyBCdWlsdC1pbiAoQ29uZmlnL1R3ZWFrcykgYnV0dG9ucy5cbiAgaWYgKHN0YXRlLm5hdkJ1dHRvbnMpIHtcbiAgICBjb25zdCBidWlsdGluOiBCdWlsdGluUGFnZSB8IG51bGwgPVxuICAgICAgYWN0aXZlPy5raW5kID09PSBcImNvbmZpZ1wiID8gXCJjb25maWdcIiA6XG4gICAgICBhY3RpdmU/LmtpbmQgPT09IFwidHdlYWtzXCIgPyBcInR3ZWFrc1wiIDpcbiAgICAgIGFjdGl2ZT8ua2luZCA9PT0gXCJzdG9yZVwiID8gXCJzdG9yZVwiIDogbnVsbDtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGJ0bl0gb2YgT2JqZWN0LmVudHJpZXMoc3RhdGUubmF2QnV0dG9ucykgYXMgW0J1aWx0aW5QYWdlLCBIVE1MQnV0dG9uRWxlbWVudF1bXSkge1xuICAgICAgYXBwbHlOYXZBY3RpdmUoYnRuLCBrZXkgPT09IGJ1aWx0aW4pO1xuICAgIH1cbiAgfVxuICAvLyBQZXItcGFnZSByZWdpc3RlcmVkIGJ1dHRvbnMuXG4gIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkge1xuICAgIGlmICghcC5uYXZCdXR0b24pIGNvbnRpbnVlO1xuICAgIGNvbnN0IGlzQWN0aXZlID0gYWN0aXZlPy5raW5kID09PSBcInJlZ2lzdGVyZWRcIiAmJiBhY3RpdmUuaWQgPT09IHAuaWQ7XG4gICAgYXBwbHlOYXZBY3RpdmUocC5uYXZCdXR0b24sIGlzQWN0aXZlKTtcbiAgfVxuICAvLyBDb2RleCdzIG93biBzaWRlYmFyIGJ1dHRvbnMgKEdlbmVyYWwsIEFwcGVhcmFuY2UsIGV0YykuIFdoZW4gb25lIG9mXG4gIC8vIG91ciBwYWdlcyBpcyBhY3RpdmUsIENvZGV4IHN0aWxsIGhhcyBhcmlhLWN1cnJlbnQ9XCJwYWdlXCIgYW5kIHRoZVxuICAvLyBhY3RpdmUtYmcgY2xhc3Mgb24gd2hpY2hldmVyIGl0ZW0gaXQgY29uc2lkZXJlZCB0aGUgcm91dGUgXHUyMDE0IHR5cGljYWxseVxuICAvLyBHZW5lcmFsLiBUaGF0IG1ha2VzIGJvdGggYnV0dG9ucyBsb29rIHNlbGVjdGVkLiBTdHJpcCBDb2RleCdzIGFjdGl2ZVxuICAvLyBzdHlsaW5nIHdoaWxlIG9uZSBvZiBvdXJzIGlzIGFjdGl2ZTsgcmVzdG9yZSBpdCB3aGVuIG5vbmUgaXMuXG4gIHN5bmNDb2RleE5hdGl2ZU5hdkFjdGl2ZShhY3RpdmUgIT09IG51bGwpO1xufVxuXG4vKipcbiAqIE11dGUgQ29kZXgncyBvd24gYWN0aXZlLXN0YXRlIHN0eWxpbmcgb24gaXRzIHNpZGViYXIgYnV0dG9ucy4gV2UgZG9uJ3RcbiAqIHRvdWNoIENvZGV4J3MgUmVhY3Qgc3RhdGUgXHUyMDE0IHdoZW4gdGhlIHVzZXIgY2xpY2tzIGEgbmF0aXZlIGl0ZW0sIENvZGV4XG4gKiByZS1yZW5kZXJzIHRoZSBidXR0b25zIGFuZCByZS1hcHBsaWVzIGl0cyBvd24gY29ycmVjdCBzdGF0ZSwgdGhlbiBvdXJcbiAqIHNpZGViYXItY2xpY2sgbGlzdGVuZXIgZmlyZXMgYHJlc3RvcmVDb2RleFZpZXdgICh3aGljaCBjYWxscyBiYWNrIGludG9cbiAqIGBzZXROYXZBY3RpdmUobnVsbClgIGFuZCBsZXRzIENvZGV4J3Mgc3R5bGluZyBzdGFuZCkuXG4gKlxuICogYG11dGU9dHJ1ZWAgIFx1MjE5MiBzdHJpcCBhcmlhLWN1cnJlbnQgYW5kIHN3YXAgYWN0aXZlIGJnIFx1MjE5MiBob3ZlciBiZ1xuICogYG11dGU9ZmFsc2VgIFx1MjE5MiBuby1vcCAoQ29kZXgncyBvd24gcmUtcmVuZGVyIGFscmVhZHkgcmVzdG9yZWQgdGhpbmdzKVxuICovXG5mdW5jdGlvbiBzeW5jQ29kZXhOYXRpdmVOYXZBY3RpdmUobXV0ZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoIW11dGUpIHJldHVybjtcbiAgY29uc3Qgcm9vdCA9IHN0YXRlLnNpZGViYXJSb290O1xuICBpZiAoIXJvb3QpIHJldHVybjtcbiAgY29uc3QgYnV0dG9ucyA9IEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxCdXR0b25FbGVtZW50PihcImJ1dHRvblwiKSk7XG4gIGZvciAoY29uc3QgYnRuIG9mIGJ1dHRvbnMpIHtcbiAgICAvLyBTa2lwIG91ciBvd24gYnV0dG9ucy5cbiAgICBpZiAoYnRuLmRhdGFzZXQuY29kZXhwcCkgY29udGludWU7XG4gICAgaWYgKGJ0bi5nZXRBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIikgPT09IFwicGFnZVwiKSB7XG4gICAgICBidG4ucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIpO1xuICAgIH1cbiAgICBpZiAoYnRuLmNsYXNzTGlzdC5jb250YWlucyhcImJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiKSkge1xuICAgICAgYnRuLmNsYXNzTGlzdC5yZW1vdmUoXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIik7XG4gICAgICBidG4uY2xhc3NMaXN0LmFkZChcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlOYXZBY3RpdmUoYnRuOiBIVE1MQnV0dG9uRWxlbWVudCwgYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGlubmVyID0gYnRuLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGFjdGl2ZSkge1xuICAgICAgYnRuLmNsYXNzTGlzdC5yZW1vdmUoXCJob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIiwgXCJmb250LW5vcm1hbFwiKTtcbiAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiLCBcInBhZ2VcIik7XG4gICAgICBpZiAoaW5uZXIpIHtcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tZm9yZWdyb3VuZFwiKTtcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgICAgIGlubmVyXG4gICAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIilcbiAgICAgICAgICA/LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1pY29uLWZvcmVncm91bmRcIik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIsIFwiZm9udC1ub3JtYWxcIik7XG4gICAgICBidG4uY2xhc3NMaXN0LnJlbW92ZShcImJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiKTtcbiAgICAgIGJ0bi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIik7XG4gICAgICBpZiAoaW5uZXIpIHtcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tZm9yZWdyb3VuZFwiKTtcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgICAgIGlubmVyXG4gICAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIilcbiAgICAgICAgICA/LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1pY29uLWZvcmVncm91bmRcIik7XG4gICAgICB9XG4gICAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgYWN0aXZhdGlvbiBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gYWN0aXZhdGVQYWdlKHBhZ2U6IEFjdGl2ZVBhZ2UpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudCA9IGZpbmRDb250ZW50QXJlYSgpO1xuICBpZiAoIWNvbnRlbnQpIHtcbiAgICBwbG9nKFwiYWN0aXZhdGU6IGNvbnRlbnQgYXJlYSBub3QgZm91bmRcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIHN0YXRlLmFjdGl2ZVBhZ2UgPSBwYWdlO1xuICBwbG9nKFwiYWN0aXZhdGVcIiwgeyBwYWdlIH0pO1xuXG4gIC8vIEhpZGUgQ29kZXgncyBjb250ZW50IGNoaWxkcmVuLCBzaG93IG91cnMuXG4gIGZvciAoY29uc3QgY2hpbGQgb2YgQXJyYXkuZnJvbShjb250ZW50LmNoaWxkcmVuKSBhcyBIVE1MRWxlbWVudFtdKSB7XG4gICAgaWYgKGNoaWxkLmRhdGFzZXQuY29kZXhwcCA9PT0gXCJ0d2Vha3MtcGFuZWxcIikgY29udGludWU7XG4gICAgaWYgKGNoaWxkLmRhdGFzZXQuY29kZXhwcEhpZGRlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjaGlsZC5kYXRhc2V0LmNvZGV4cHBIaWRkZW4gPSBjaGlsZC5zdHlsZS5kaXNwbGF5IHx8IFwiXCI7XG4gICAgfVxuICAgIGNoaWxkLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgfVxuICBsZXQgcGFuZWwgPSBjb250ZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCdbZGF0YS1jb2RleHBwPVwidHdlYWtzLXBhbmVsXCJdJyk7XG4gIGlmICghcGFuZWwpIHtcbiAgICBwYW5lbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgcGFuZWwuZGF0YXNldC5jb2RleHBwID0gXCJ0d2Vha3MtcGFuZWxcIjtcbiAgICBwYW5lbC5zdHlsZS5jc3NUZXh0ID0gXCJ3aWR0aDoxMDAlO2hlaWdodDoxMDAlO292ZXJmbG93OmF1dG87XCI7XG4gICAgY29udGVudC5hcHBlbmRDaGlsZChwYW5lbCk7XG4gIH1cbiAgcGFuZWwuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgc3RhdGUucGFuZWxIb3N0ID0gcGFuZWw7XG4gIHJlcmVuZGVyKCk7XG4gIHNldE5hdkFjdGl2ZShwYWdlKTtcbiAgLy8gcmVzdG9yZSBDb2RleCdzIHZpZXcuIFJlLXJlZ2lzdGVyIGlmIG5lZWRlZC5cbiAgY29uc3Qgc2lkZWJhciA9IHN0YXRlLnNpZGViYXJSb290O1xuICBpZiAoc2lkZWJhcikge1xuICAgIGlmIChzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIpIHtcbiAgICAgIHNpZGViYXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlciwgdHJ1ZSk7XG4gICAgfVxuICAgIGNvbnN0IGhhbmRsZXIgPSAoZTogRXZlbnQpID0+IHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgIGlmICghdGFyZ2V0KSByZXR1cm47XG4gICAgICBpZiAoc3RhdGUubmF2R3JvdXA/LmNvbnRhaW5zKHRhcmdldCkpIHJldHVybjsgLy8gb3VyIGJ1dHRvbnNcbiAgICAgIGlmIChzdGF0ZS5wYWdlc0dyb3VwPy5jb250YWlucyh0YXJnZXQpKSByZXR1cm47IC8vIG91ciBwYWdlIGJ1dHRvbnNcbiAgICAgIGlmICh0YXJnZXQuY2xvc2VzdChcIltkYXRhLWNvZGV4cHAtc2V0dGluZ3Mtc2VhcmNoXVwiKSkgcmV0dXJuO1xuICAgICAgcmVzdG9yZUNvZGV4VmlldygpO1xuICAgIH07XG4gICAgc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyID0gaGFuZGxlcjtcbiAgICBzaWRlYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBoYW5kbGVyLCB0cnVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXN0b3JlQ29kZXhWaWV3KCk6IHZvaWQge1xuICBwbG9nKFwicmVzdG9yZSBjb2RleCB2aWV3XCIpO1xuICBjb25zdCBjb250ZW50ID0gZmluZENvbnRlbnRBcmVhKCk7XG4gIGlmICghY29udGVudCkgcmV0dXJuO1xuICBpZiAoc3RhdGUucGFuZWxIb3N0KSBzdGF0ZS5wYW5lbEhvc3Quc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICBmb3IgKGNvbnN0IGNoaWxkIG9mIEFycmF5LmZyb20oY29udGVudC5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSkge1xuICAgIGlmIChjaGlsZCA9PT0gc3RhdGUucGFuZWxIb3N0KSBjb250aW51ZTtcbiAgICBpZiAoY2hpbGQuZGF0YXNldC5jb2RleHBwSGlkZGVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNoaWxkLnN0eWxlLmRpc3BsYXkgPSBjaGlsZC5kYXRhc2V0LmNvZGV4cHBIaWRkZW47XG4gICAgICBkZWxldGUgY2hpbGQuZGF0YXNldC5jb2RleHBwSGlkZGVuO1xuICAgIH1cbiAgfVxuICBzdGF0ZS5hY3RpdmVQYWdlID0gbnVsbDtcbiAgc2V0TmF2QWN0aXZlKG51bGwpO1xuICBpZiAoc3RhdGUuc2lkZWJhclJvb3QgJiYgc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyKSB7XG4gICAgc3RhdGUuc2lkZWJhclJvb3QucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgIFwiY2xpY2tcIixcbiAgICAgIHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlcixcbiAgICAgIHRydWUsXG4gICAgKTtcbiAgICBzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIgPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcmVuZGVyKCk6IHZvaWQge1xuICBpZiAoIXN0YXRlLmFjdGl2ZVBhZ2UpIHJldHVybjtcbiAgY29uc3QgaG9zdCA9IHN0YXRlLnBhbmVsSG9zdDtcbiAgaWYgKCFob3N0KSByZXR1cm47XG4gIGhvc3QucmVwbGFjZUNoaWxkcmVuKCk7XG5cbiAgY29uc3QgYXAgPSBzdGF0ZS5hY3RpdmVQYWdlO1xuICBpZiAoYXAua2luZCA9PT0gXCJyZWdpc3RlcmVkXCIpIHtcbiAgICBjb25zdCBlbnRyeSA9IHN0YXRlLnBhZ2VzLmdldChhcC5pZCk7XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgcmVzdG9yZUNvZGV4VmlldygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByb290ID0gcGFuZWxTaGVsbChlbnRyeS5wYWdlLnRpdGxlLCBlbnRyeS5wYWdlLmRlc2NyaXB0aW9uKTtcbiAgICBob3N0LmFwcGVuZENoaWxkKHJvb3Qub3V0ZXIpO1xuICAgIHRyeSB7XG4gICAgICAvLyBUZWFyIGRvd24gYW55IHByaW9yIHJlbmRlciBiZWZvcmUgcmUtcmVuZGVyaW5nIChob3QgcmVsb2FkKS5cbiAgICAgIHRyeSB7IGVudHJ5LnRlYXJkb3duPy4oKTsgfSBjYXRjaCB7fVxuICAgICAgZW50cnkudGVhcmRvd24gPSBudWxsO1xuICAgICAgY29uc3QgcmV0ID0gZW50cnkucGFnZS5yZW5kZXIocm9vdC5zZWN0aW9uc1dyYXApO1xuICAgICAgaWYgKHR5cGVvZiByZXQgPT09IFwiZnVuY3Rpb25cIikgZW50cnkudGVhcmRvd24gPSByZXQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc3QgZXJyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGVyci5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tY2hhcnRzLXJlZCB0ZXh0LXNtXCI7XG4gICAgICBlcnIudGV4dENvbnRlbnQgPSBgRXJyb3IgcmVuZGVyaW5nIHBhZ2U6ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YDtcbiAgICAgIHJvb3Quc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKGVycik7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHRpdGxlID1cbiAgICBhcC5raW5kID09PSBcInR3ZWFrc1wiID8gXCJUd2Vha3NcIiA6XG4gICAgYXAua2luZCA9PT0gXCJzdG9yZVwiID8gXCJUd2VhayBTdG9yZVwiIDogXCJDb2RleCsrXCI7XG4gIGNvbnN0IHN1YnRpdGxlID1cbiAgICBhcC5raW5kID09PSBcInR3ZWFrc1wiXG4gICAgICA/IFwiTWFuYWdlIHlvdXIgaW5zdGFsbGVkIENvZGV4KysgdHdlYWtzLlwiXG4gICAgICA6IGFwLmtpbmQgPT09IFwic3RvcmVcIlxuICAgICAgICA/IFwiSW5zdGFsbCByZXZpZXdlZCB0d2Vha3MgcGlubmVkIHRvIGFwcHJvdmVkIEdpdEh1YiBjb21taXRzLlwiXG4gICAgICAgIDogXCJDaGVja2luZyBpbnN0YWxsZWQgQ29kZXgrKyB2ZXJzaW9uLlwiO1xuICBjb25zdCByb290ID0gcGFuZWxTaGVsbCh0aXRsZSwgc3VidGl0bGUpO1xuICBob3N0LmFwcGVuZENoaWxkKHJvb3Qub3V0ZXIpO1xuICBpZiAoYXAua2luZCA9PT0gXCJ0d2Vha3NcIikgcmVuZGVyVHdlYWtzUGFnZShyb290LnNlY3Rpb25zV3JhcCk7XG4gIGVsc2UgaWYgKGFwLmtpbmQgPT09IFwic3RvcmVcIikgcmVuZGVyVHdlYWtTdG9yZVBhZ2Uocm9vdC5zZWN0aW9uc1dyYXAsIHJvb3QuaGVhZGVyQWN0aW9ucyk7XG4gIGVsc2UgcmVuZGVyQ29uZmlnUGFnZShyb290LnNlY3Rpb25zV3JhcCwgcm9vdC5zdWJ0aXRsZSk7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBwYWdlcyBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gcmVuZGVyQ29uZmlnUGFnZShcbiAgc2VjdGlvbnNXcmFwOiBIVE1MRWxlbWVudCxcbiAgc3VidGl0bGU/OiBIVE1MRWxlbWVudCxcbik6IHZvaWQge1xuICBjb25zdCBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gIHNlY3Rpb24uY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yXCI7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoc2VjdGlvblRpdGxlKFwiQ29kZXgrKyBVcGRhdGVzXCIpKTtcbiAgY29uc3QgY2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIGNhcmQuZGF0YXNldC5jb2RleHBwQ29uZmlnQ2FyZCA9IFwidHJ1ZVwiO1xuICBjb25zdCBsb2FkaW5nID0gcm93U2ltcGxlKFwiTG9hZGluZyB1cGRhdGUgc2V0dGluZ3NcIiwgXCJDaGVja2luZyBjdXJyZW50IENvZGV4KysgY29uZmlndXJhdGlvbi5cIik7XG4gIGNhcmQuYXBwZW5kQ2hpbGQobG9hZGluZyk7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY2FyZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZChzZWN0aW9uKTtcblxuICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LWNvbmZpZ1wiKVxuICAgIC50aGVuKChjb25maWcpID0+IHtcbiAgICAgIGlmIChzdWJ0aXRsZSkge1xuICAgICAgICBzdWJ0aXRsZS50ZXh0Q29udGVudCA9IGBZb3UgaGF2ZSBDb2RleCsrICR7KGNvbmZpZyBhcyBDb2RleFBsdXNQbHVzQ29uZmlnKS52ZXJzaW9ufSBpbnN0YWxsZWQuYDtcbiAgICAgIH1cbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgcmVuZGVyQ29kZXhQbHVzUGx1c0NvbmZpZyhjYXJkLCBjb25maWcgYXMgQ29kZXhQbHVzUGx1c0NvbmZpZyk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIGlmIChzdWJ0aXRsZSkgc3VidGl0bGUudGV4dENvbnRlbnQgPSBcIkNvdWxkIG5vdCBsb2FkIGluc3RhbGxlZCBDb2RleCsrIHZlcnNpb24uXCI7XG4gICAgICBjYXJkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgIGNhcmQuYXBwZW5kQ2hpbGQocm93U2ltcGxlKFwiQ291bGQgbm90IGxvYWQgdXBkYXRlIHNldHRpbmdzXCIsIFN0cmluZyhlKSkpO1xuICAgIH0pO1xuXG4gIGNvbnN0IHdhdGNoZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgd2F0Y2hlci5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgd2F0Y2hlci5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJBdXRvLVJlcGFpciBXYXRjaGVyXCIpKTtcbiAgY29uc3Qgd2F0Y2hlckNhcmQgPSByb3VuZGVkQ2FyZCgpO1xuICB3YXRjaGVyQ2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDaGVja2luZyB3YXRjaGVyXCIsIFwiVmVyaWZ5aW5nIHRoZSB1cGRhdGVyIHJlcGFpciBzZXJ2aWNlLlwiKSk7XG4gIHdhdGNoZXIuYXBwZW5kQ2hpbGQod2F0Y2hlckNhcmQpO1xuICBzZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQod2F0Y2hlcik7XG4gIHJlbmRlcldhdGNoZXJIZWFsdGhDYXJkKHdhdGNoZXJDYXJkKTtcblxuICBjb25zdCBtYWludGVuYW5jZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpO1xuICBtYWludGVuYW5jZS5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgbWFpbnRlbmFuY2UuYXBwZW5kQ2hpbGQoc2VjdGlvblRpdGxlKFwiTWFpbnRlbmFuY2VcIikpO1xuICBjb25zdCBtYWludGVuYW5jZUNhcmQgPSByb3VuZGVkQ2FyZCgpO1xuICBtYWludGVuYW5jZUNhcmQuYXBwZW5kQ2hpbGQodW5pbnN0YWxsUm93KCkpO1xuICBtYWludGVuYW5jZUNhcmQuYXBwZW5kQ2hpbGQocmVwb3J0QnVnUm93KCkpO1xuICBtYWludGVuYW5jZS5hcHBlbmRDaGlsZChtYWludGVuYW5jZUNhcmQpO1xuICBzZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQobWFpbnRlbmFuY2UpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDb2RleFBsdXNQbHVzQ29uZmlnKGNhcmQ6IEhUTUxFbGVtZW50LCBjb25maWc6IENvZGV4UGx1c1BsdXNDb25maWcpOiB2b2lkIHtcbiAgc2V0U2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oY29uZmlnLnVwZGF0ZUNoZWNrKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChhdXRvVXBkYXRlUm93KGNvbmZpZykpO1xuICBjYXJkLmFwcGVuZENoaWxkKHVwZGF0ZUNoYW5uZWxSb3coY29uZmlnKSk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoaW5zdGFsbGF0aW9uU291cmNlUm93KGNvbmZpZy5pbnN0YWxsYXRpb25Tb3VyY2UpKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChzZWxmVXBkYXRlU3RhdHVzUm93KGNvbmZpZy5zZWxmVXBkYXRlKSk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQoY2hlY2tGb3JVcGRhdGVzUm93KGNvbmZpZykpO1xuICBpZiAoY29uZmlnLnVwZGF0ZUNoZWNrKSBjYXJkLmFwcGVuZENoaWxkKHJlbGVhc2VOb3Rlc1Jvdyhjb25maWcudXBkYXRlQ2hlY2spKTtcbn1cblxuZnVuY3Rpb24gYXV0b1VwZGF0ZVJvdyhjb25maWc6IENvZGV4UGx1c1BsdXNDb25maWcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IFwiQXV0b21hdGljYWxseSByZWZyZXNoIENvZGV4KytcIjtcbiAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICBkZXNjLnRleHRDb250ZW50ID0gYEluc3RhbGxlZCB2ZXJzaW9uIHYke2NvbmZpZy52ZXJzaW9ufS4gVGhlIHdhdGNoZXIgY2hlY2tzIGhvdXJseSBhbmQgY2FuIHJlZnJlc2ggdGhlIENvZGV4KysgcnVudGltZSBhdXRvbWF0aWNhbGx5LmA7XG4gIGxlZnQuYXBwZW5kQ2hpbGQodGl0bGUpO1xuICBsZWZ0LmFwcGVuZENoaWxkKGRlc2MpO1xuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XG4gIHJvdy5hcHBlbmRDaGlsZChcbiAgICBzd2l0Y2hDb250cm9sKGNvbmZpZy5hdXRvVXBkYXRlLCBhc3luYyAobmV4dCkgPT4ge1xuICAgICAgYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpzZXQtYXV0by11cGRhdGVcIiwgbmV4dCk7XG4gICAgfSksXG4gICk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNoYW5uZWxSb3coY29uZmlnOiBDb2RleFBsdXNQbHVzQ29uZmlnKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSBhY3Rpb25Sb3coXCJSZWxlYXNlIGNoYW5uZWxcIiwgdXBkYXRlQ2hhbm5lbFN1bW1hcnkoY29uZmlnKSk7XG4gIGNvbnN0IGFjdGlvbiA9IHJvdy5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtcm93LWFjdGlvbnNdXCIpO1xuICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VsZWN0XCIpO1xuICBzZWxlY3QuY2xhc3NOYW1lID1cbiAgICBcImgtOCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRyYW5zcGFyZW50IHB4LTIgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmVcIjtcbiAgZm9yIChjb25zdCBbdmFsdWUsIGxhYmVsXSBvZiBbXG4gICAgW1wic3RhYmxlXCIsIFwiU3RhYmxlXCJdLFxuICAgIFtcInByZXJlbGVhc2VcIiwgXCJQcmVyZWxlYXNlXCJdLFxuICAgIFtcImN1c3RvbVwiLCBcIkN1c3RvbVwiXSxcbiAgXSBhcyBjb25zdCkge1xuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XG4gICAgb3B0aW9uLnZhbHVlID0gdmFsdWU7XG4gICAgb3B0aW9uLnRleHRDb250ZW50ID0gbGFiZWw7XG4gICAgb3B0aW9uLnNlbGVjdGVkID0gY29uZmlnLnVwZGF0ZUNoYW5uZWwgPT09IHZhbHVlO1xuICAgIHNlbGVjdC5hcHBlbmRDaGlsZChvcHRpb24pO1xuICB9XG4gIHNlbGVjdC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHtcbiAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAuaW52b2tlKFwiY29kZXhwcDpzZXQtdXBkYXRlLWNvbmZpZ1wiLCB7IHVwZGF0ZUNoYW5uZWw6IHNlbGVjdC52YWx1ZSB9KVxuICAgICAgLnRoZW4oKCkgPT4gcmVmcmVzaENvbmZpZ0NhcmQocm93KSlcbiAgICAgIC5jYXRjaCgoZSkgPT4gcGxvZyhcInNldCB1cGRhdGUgY2hhbm5lbCBmYWlsZWRcIiwgU3RyaW5nKGUpKSk7XG4gIH0pO1xuICBhY3Rpb24/LmFwcGVuZENoaWxkKHNlbGVjdCk7XG4gIGlmIChjb25maWcudXBkYXRlQ2hhbm5lbCA9PT0gXCJjdXN0b21cIikge1xuICAgIGFjdGlvbj8uYXBwZW5kQ2hpbGQoXG4gICAgICBjb21wYWN0QnV0dG9uKFwiRWRpdFwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcG8gPSB3aW5kb3cucHJvbXB0KFwiR2l0SHViIHJlcG9cIiwgY29uZmlnLnVwZGF0ZVJlcG8gfHwgXCJrcGtoeGxneTAvY29kZXgtcGx1c3BsdXNcIik7XG4gICAgICAgIGlmIChyZXBvID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIGNvbnN0IHJlZiA9IHdpbmRvdy5wcm9tcHQoXCJHaXQgcmVmXCIsIGNvbmZpZy51cGRhdGVSZWYgfHwgXCJtYWluXCIpO1xuICAgICAgICBpZiAocmVmID09PSBudWxsKSByZXR1cm47XG4gICAgICAgIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpzZXQtdXBkYXRlLWNvbmZpZ1wiLCB7XG4gICAgICAgICAgICB1cGRhdGVDaGFubmVsOiBcImN1c3RvbVwiLFxuICAgICAgICAgICAgdXBkYXRlUmVwbzogcmVwbyxcbiAgICAgICAgICAgIHVwZGF0ZVJlZjogcmVmLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oKCkgPT4gcmVmcmVzaENvbmZpZ0NhcmQocm93KSlcbiAgICAgICAgICAuY2F0Y2goKGUpID0+IHBsb2coXCJzZXQgY3VzdG9tIHVwZGF0ZSBzb3VyY2UgZmFpbGVkXCIsIFN0cmluZyhlKSkpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsYXRpb25Tb3VyY2VSb3coc291cmNlOiBJbnN0YWxsYXRpb25Tb3VyY2UpOiBIVE1MRWxlbWVudCB7XG4gIHJldHVybiByb3dTaW1wbGUoXCJJbnN0YWxsYXRpb24gc291cmNlXCIsIGAke3NvdXJjZS5sYWJlbH06ICR7c291cmNlLmRldGFpbH1gKTtcbn1cblxuZnVuY3Rpb24gc2VsZlVwZGF0ZVN0YXR1c1JvdyhzdGF0ZTogU2VsZlVwZGF0ZVN0YXRlIHwgbnVsbCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gcm93U2ltcGxlKFwiTGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzZWxmVXBkYXRlU3VtbWFyeShzdGF0ZSkpO1xuICBjb25zdCBsZWZ0ID0gcm93LmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGxlZnQgJiYgc3RhdGUpIGxlZnQucHJlcGVuZChzdGF0dXNCYWRnZShzZWxmVXBkYXRlU3RhdHVzVG9uZShzdGF0ZS5zdGF0dXMpLCBzZWxmVXBkYXRlU3RhdHVzTGFiZWwoc3RhdGUuc3RhdHVzKSkpO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiBjaGVja0ZvclVwZGF0ZXNSb3coY29uZmlnOiBDb2RleFBsdXNQbHVzQ29uZmlnKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBjaGVjayA9IGNvbmZpZy51cGRhdGVDaGVjaztcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gY2hlY2s/LnVwZGF0ZUF2YWlsYWJsZSA/IFwiQ29kZXgrKyB1cGRhdGUgYXZhaWxhYmxlXCIgOiBcIkNoZWNrIGZvciBDb2RleCsrIHVwZGF0ZXNcIjtcbiAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICBkZXNjLnRleHRDb250ZW50ID0gdXBkYXRlU3VtbWFyeShjaGVjayk7XG4gIGxlZnQuYXBwZW5kQ2hpbGQodGl0bGUpO1xuICBsZWZ0LmFwcGVuZENoaWxkKGRlc2MpO1xuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XG5cbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBpZiAoY2hlY2s/LnJlbGVhc2VVcmwpIHtcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKFxuICAgICAgY29tcGFjdEJ1dHRvbihcIlJlbGVhc2UgTm90ZXNcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCBjaGVjay5yZWxlYXNlVXJsKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICBjb21wYWN0QnV0dG9uKFwiQ2hlY2sgTm93XCIsICgpID0+IHtcbiAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCIwLjY1XCI7XG4gICAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAgIC5pbnZva2UoXCJjb2RleHBwOmNoZWNrLWNvZGV4cHAtdXBkYXRlXCIsIHRydWUpXG4gICAgICAgIC50aGVuKChjaGVjaykgPT4ge1xuICAgICAgICAgIHNldFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKGNoZWNrIGFzIENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayk7XG4gICAgICAgICAgcmVmcmVzaENvbmZpZ0NhcmQocm93KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwiQ29kZXgrKyByZWxlYXNlIGNoZWNrIGZhaWxlZFwiLCBTdHJpbmcoZSkpKVxuICAgICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgICAgcm93LnN0eWxlLm9wYWNpdHkgPSBcIlwiO1xuICAgICAgICB9KTtcbiAgICB9KSxcbiAgKTtcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICBjb21wYWN0QnV0dG9uKFwiRG93bmxvYWQgVXBkYXRlXCIsICgpID0+IHtcbiAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCIwLjY1XCI7XG4gICAgICBjb25zdCBidXR0b25zID0gYWN0aW9ucy5xdWVyeVNlbGVjdG9yQWxsKFwiYnV0dG9uXCIpO1xuICAgICAgYnV0dG9ucy5mb3JFYWNoKChidXR0b24pID0+IChidXR0b24uZGlzYWJsZWQgPSB0cnVlKSk7XG4gICAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAgIC5pbnZva2UoXCJjb2RleHBwOnJ1bi1jb2RleHBwLXVwZGF0ZVwiKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmVmcmVzaFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKHRydWUpO1xuICAgICAgICAgIHJlZnJlc2hDb25maWdDYXJkKHJvdyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIHBsb2coXCJDb2RleCsrIHNlbGYtdXBkYXRlIGZhaWxlZFwiLCBTdHJpbmcoZSkpO1xuICAgICAgICAgIHZvaWQgcmVmcmVzaENvbmZpZ0NhcmQocm93KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCJcIjtcbiAgICAgICAgICBidXR0b25zLmZvckVhY2goKGJ1dHRvbikgPT4gKGJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlKSk7XG4gICAgICAgIH0pO1xuICAgIH0pLFxuICApO1xuICByb3cuYXBwZW5kQ2hpbGQoYWN0aW9ucyk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHJlbGVhc2VOb3Rlc1JvdyhjaGVjazogQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICByb3cuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yIHAtM1wiO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwidGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IFwiTGF0ZXN0IHJlbGVhc2Ugbm90ZXNcIjtcbiAgcm93LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGJvZHkuY2xhc3NOYW1lID1cbiAgICBcIm1heC1oLTYwIG92ZXJmbG93LWF1dG8gcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcC0zIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBib2R5LmFwcGVuZENoaWxkKHJlbmRlclJlbGVhc2VOb3Rlc01hcmtkb3duKGNoZWNrLnJlbGVhc2VOb3Rlcz8udHJpbSgpIHx8IGNoZWNrLmVycm9yIHx8IFwiTm8gcmVsZWFzZSBub3RlcyBhdmFpbGFibGUuXCIpKTtcbiAgcm93LmFwcGVuZENoaWxkKGJvZHkpO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiByZW5kZXJSZWxlYXNlTm90ZXNNYXJrZG93bihtYXJrZG93bjogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm9vdC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgY29uc3QgbGluZXMgPSBtYXJrZG93bi5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpLnNwbGl0KFwiXFxuXCIpO1xuICBsZXQgcGFyYWdyYXBoOiBzdHJpbmdbXSA9IFtdO1xuICBsZXQgbGlzdDogSFRNTE9MaXN0RWxlbWVudCB8IEhUTUxVTGlzdEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgbGV0IGNvZGVMaW5lczogc3RyaW5nW10gfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBmbHVzaFBhcmFncmFwaCA9ICgpID0+IHtcbiAgICBpZiAocGFyYWdyYXBoLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGNvbnN0IHAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcbiAgICBwLmNsYXNzTmFtZSA9IFwibS0wIGxlYWRpbmctNVwiO1xuICAgIGFwcGVuZElubGluZU1hcmtkb3duKHAsIHBhcmFncmFwaC5qb2luKFwiIFwiKS50cmltKCkpO1xuICAgIHJvb3QuYXBwZW5kQ2hpbGQocCk7XG4gICAgcGFyYWdyYXBoID0gW107XG4gIH07XG4gIGNvbnN0IGZsdXNoTGlzdCA9ICgpID0+IHtcbiAgICBpZiAoIWxpc3QpIHJldHVybjtcbiAgICByb290LmFwcGVuZENoaWxkKGxpc3QpO1xuICAgIGxpc3QgPSBudWxsO1xuICB9O1xuICBjb25zdCBmbHVzaENvZGUgPSAoKSA9PiB7XG4gICAgaWYgKCFjb2RlTGluZXMpIHJldHVybjtcbiAgICBjb25zdCBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgIHByZS5jbGFzc05hbWUgPVxuICAgICAgXCJtLTAgb3ZlcmZsb3ctYXV0byByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLWZvcmVncm91bmQvMTAgcC0yIHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgICBjb25zdCBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIik7XG4gICAgY29kZS50ZXh0Q29udGVudCA9IGNvZGVMaW5lcy5qb2luKFwiXFxuXCIpO1xuICAgIHByZS5hcHBlbmRDaGlsZChjb2RlKTtcbiAgICByb290LmFwcGVuZENoaWxkKHByZSk7XG4gICAgY29kZUxpbmVzID0gbnVsbDtcbiAgfTtcblxuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBpZiAobGluZS50cmltKCkuc3RhcnRzV2l0aChcImBgYFwiKSkge1xuICAgICAgaWYgKGNvZGVMaW5lcykgZmx1c2hDb2RlKCk7XG4gICAgICBlbHNlIHtcbiAgICAgICAgZmx1c2hQYXJhZ3JhcGgoKTtcbiAgICAgICAgZmx1c2hMaXN0KCk7XG4gICAgICAgIGNvZGVMaW5lcyA9IFtdO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmIChjb2RlTGluZXMpIHtcbiAgICAgIGNvZGVMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkge1xuICAgICAgZmx1c2hQYXJhZ3JhcGgoKTtcbiAgICAgIGZsdXNoTGlzdCgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGluZyA9IC9eKCN7MSwzfSlcXHMrKC4rKSQvLmV4ZWModHJpbW1lZCk7XG4gICAgaWYgKGhlYWRpbmcpIHtcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICBmbHVzaExpc3QoKTtcbiAgICAgIGNvbnN0IGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGhlYWRpbmdbMV0ubGVuZ3RoID09PSAxID8gXCJoM1wiIDogXCJoNFwiKTtcbiAgICAgIGguY2xhc3NOYW1lID0gXCJtLTAgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICAgICAgYXBwZW5kSW5saW5lTWFya2Rvd24oaCwgaGVhZGluZ1syXSk7XG4gICAgICByb290LmFwcGVuZENoaWxkKGgpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgdW5vcmRlcmVkID0gL15bLSpdXFxzKyguKykkLy5leGVjKHRyaW1tZWQpO1xuICAgIGNvbnN0IG9yZGVyZWQgPSAvXlxcZCtbLildXFxzKyguKykkLy5leGVjKHRyaW1tZWQpO1xuICAgIGlmICh1bm9yZGVyZWQgfHwgb3JkZXJlZCkge1xuICAgICAgZmx1c2hQYXJhZ3JhcGgoKTtcbiAgICAgIGNvbnN0IHdhbnRPcmRlcmVkID0gQm9vbGVhbihvcmRlcmVkKTtcbiAgICAgIGlmICghbGlzdCB8fCAod2FudE9yZGVyZWQgJiYgbGlzdC50YWdOYW1lICE9PSBcIk9MXCIpIHx8ICghd2FudE9yZGVyZWQgJiYgbGlzdC50YWdOYW1lICE9PSBcIlVMXCIpKSB7XG4gICAgICAgIGZsdXNoTGlzdCgpO1xuICAgICAgICBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh3YW50T3JkZXJlZCA/IFwib2xcIiA6IFwidWxcIik7XG4gICAgICAgIGxpc3QuY2xhc3NOYW1lID0gd2FudE9yZGVyZWRcbiAgICAgICAgICA/IFwibS0wIGxpc3QtZGVjaW1hbCBzcGFjZS15LTEgcGwtNSBsZWFkaW5nLTVcIlxuICAgICAgICAgIDogXCJtLTAgbGlzdC1kaXNjIHNwYWNlLXktMSBwbC01IGxlYWRpbmctNVwiO1xuICAgICAgfVxuICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICBhcHBlbmRJbmxpbmVNYXJrZG93bihsaSwgKHVub3JkZXJlZCA/PyBvcmRlcmVkKT8uWzFdID8/IFwiXCIpO1xuICAgICAgbGlzdC5hcHBlbmRDaGlsZChsaSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBxdW90ZSA9IC9ePlxccz8oLispJC8uZXhlYyh0cmltbWVkKTtcbiAgICBpZiAocXVvdGUpIHtcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICBmbHVzaExpc3QoKTtcbiAgICAgIGNvbnN0IGJsb2NrcXVvdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYmxvY2txdW90ZVwiKTtcbiAgICAgIGJsb2NrcXVvdGUuY2xhc3NOYW1lID0gXCJtLTAgYm9yZGVyLWwtMiBib3JkZXItdG9rZW4tYm9yZGVyIHBsLTMgbGVhZGluZy01XCI7XG4gICAgICBhcHBlbmRJbmxpbmVNYXJrZG93bihibG9ja3F1b3RlLCBxdW90ZVsxXSk7XG4gICAgICByb290LmFwcGVuZENoaWxkKGJsb2NrcXVvdGUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcGFyYWdyYXBoLnB1c2godHJpbW1lZCk7XG4gIH1cblxuICBmbHVzaFBhcmFncmFwaCgpO1xuICBmbHVzaExpc3QoKTtcbiAgZmx1c2hDb2RlKCk7XG4gIHJldHVybiByb290O1xufVxuXG5mdW5jdGlvbiBhcHBlbmRJbmxpbmVNYXJrZG93bihwYXJlbnQ6IEhUTUxFbGVtZW50LCB0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgcGF0dGVybiA9IC8oYChbXmBdKylgfFxcWyhbXlxcXV0rKVxcXVxcKChodHRwcz86XFwvXFwvW15cXHMpXSspXFwpfFxcKlxcKihbXipdKylcXCpcXCp8XFwqKFteKl0rKVxcKikvZztcbiAgbGV0IGxhc3RJbmRleCA9IDA7XG4gIGZvciAoY29uc3QgbWF0Y2ggb2YgdGV4dC5tYXRjaEFsbChwYXR0ZXJuKSkge1xuICAgIGlmIChtYXRjaC5pbmRleCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICBhcHBlbmRUZXh0KHBhcmVudCwgdGV4dC5zbGljZShsYXN0SW5kZXgsIG1hdGNoLmluZGV4KSk7XG4gICAgaWYgKG1hdGNoWzJdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGNvZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY29kZVwiKTtcbiAgICAgIGNvZGUuY2xhc3NOYW1lID1cbiAgICAgICAgXCJyb3VuZGVkIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLWZvcmVncm91bmQvMTAgcHgtMSBweS0wLjUgdGV4dC14cyB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICAgICAgY29kZS50ZXh0Q29udGVudCA9IG1hdGNoWzJdO1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGNvZGUpO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hbM10gIT09IHVuZGVmaW5lZCAmJiBtYXRjaFs0XSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICBhLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXByaW1hcnkgdW5kZXJsaW5lIHVuZGVybGluZS1vZmZzZXQtMlwiO1xuICAgICAgYS5ocmVmID0gbWF0Y2hbNF07XG4gICAgICBhLnRhcmdldCA9IFwiX2JsYW5rXCI7XG4gICAgICBhLnJlbCA9IFwibm9vcGVuZXIgbm9yZWZlcnJlclwiO1xuICAgICAgYS50ZXh0Q29udGVudCA9IG1hdGNoWzNdO1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGEpO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hbNV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgc3Ryb25nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0cm9uZ1wiKTtcbiAgICAgIHN0cm9uZy5jbGFzc05hbWUgPSBcImZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gICAgICBzdHJvbmcudGV4dENvbnRlbnQgPSBtYXRjaFs1XTtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChzdHJvbmcpO1xuICAgIH0gZWxzZSBpZiAobWF0Y2hbNl0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZW1cIik7XG4gICAgICBlbS50ZXh0Q29udGVudCA9IG1hdGNoWzZdO1xuICAgICAgcGFyZW50LmFwcGVuZENoaWxkKGVtKTtcbiAgICB9XG4gICAgbGFzdEluZGV4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gIH1cbiAgYXBwZW5kVGV4dChwYXJlbnQsIHRleHQuc2xpY2UobGFzdEluZGV4KSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFRleHQocGFyZW50OiBIVE1MRWxlbWVudCwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGlmICh0ZXh0KSBwYXJlbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCkpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJXYXRjaGVySGVhbHRoQ2FyZChjYXJkOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LXdhdGNoZXItaGVhbHRoXCIpXG4gICAgLnRoZW4oKGhlYWx0aCkgPT4ge1xuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICByZW5kZXJXYXRjaGVySGVhbHRoKGNhcmQsIGhlYWx0aCBhcyBXYXRjaGVySGVhbHRoKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIkNvdWxkIG5vdCBjaGVjayB3YXRjaGVyXCIsIFN0cmluZyhlKSkpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXJXYXRjaGVySGVhbHRoKGNhcmQ6IEhUTUxFbGVtZW50LCBoZWFsdGg6IFdhdGNoZXJIZWFsdGgpOiB2b2lkIHtcbiAgY2FyZC5hcHBlbmRDaGlsZCh3YXRjaGVyU3VtbWFyeVJvdyhoZWFsdGgpKTtcbiAgZm9yIChjb25zdCBjaGVjayBvZiBoZWFsdGguY2hlY2tzKSB7XG4gICAgaWYgKGNoZWNrLnN0YXR1cyA9PT0gXCJva1wiKSBjb250aW51ZTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKHdhdGNoZXJDaGVja1JvdyhjaGVjaykpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdhdGNoZXJTdW1tYXJ5Um93KGhlYWx0aDogV2F0Y2hlckhlYWx0aCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1zdGFydCBnYXAtM1wiO1xuICBsZWZ0LmFwcGVuZENoaWxkKHN0YXR1c0JhZGdlKGhlYWx0aC5zdGF0dXMsIGhlYWx0aC53YXRjaGVyKSk7XG4gIGNvbnN0IHN0YWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc3RhY2suY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IGhlYWx0aC50aXRsZTtcbiAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICBkZXNjLnRleHRDb250ZW50ID0gYCR7aGVhbHRoLnN1bW1hcnl9IENoZWNrZWQgJHtuZXcgRGF0ZShoZWFsdGguY2hlY2tlZEF0KS50b0xvY2FsZVN0cmluZygpfS5gO1xuICBzdGFjay5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIHN0YWNrLmFwcGVuZENoaWxkKGRlc2MpO1xuICBsZWZ0LmFwcGVuZENoaWxkKHN0YWNrKTtcbiAgcm93LmFwcGVuZENoaWxkKGxlZnQpO1xuXG4gIGNvbnN0IGFjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGFjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGdhcC0yXCI7XG4gIGFjdGlvbi5hcHBlbmRDaGlsZChcbiAgICBjb21wYWN0QnV0dG9uKFwiQ2hlY2sgTm93XCIsICgpID0+IHtcbiAgICAgIGNvbnN0IGNhcmQgPSByb3cucGFyZW50RWxlbWVudDtcbiAgICAgIGlmICghY2FyZCkgcmV0dXJuO1xuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIkNoZWNraW5nIHdhdGNoZXJcIiwgXCJWZXJpZnlpbmcgdGhlIHVwZGF0ZXIgcmVwYWlyIHNlcnZpY2UuXCIpKTtcbiAgICAgIHJlbmRlcldhdGNoZXJIZWFsdGhDYXJkKGNhcmQpO1xuICAgIH0pLFxuICApO1xuICByb3cuYXBwZW5kQ2hpbGQoYWN0aW9uKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gd2F0Y2hlckNoZWNrUm93KGNoZWNrOiBXYXRjaGVySGVhbHRoQ2hlY2spOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IHJvd1NpbXBsZShjaGVjay5uYW1lLCBjaGVjay5kZXRhaWwpO1xuICBjb25zdCBsZWZ0ID0gcm93LmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGxlZnQpIGxlZnQucHJlcGVuZChzdGF0dXNCYWRnZShjaGVjay5zdGF0dXMpKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gc3RhdHVzQmFkZ2Uoc3RhdHVzOiBcIm9rXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiwgbGFiZWw/OiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGNvbnN0IHRvbmUgPVxuICAgIHN0YXR1cyA9PT0gXCJva1wiXG4gICAgICA/IFwiYm9yZGVyLXRva2VuLWNoYXJ0cy1ncmVlbiB0ZXh0LXRva2VuLWNoYXJ0cy1ncmVlblwiXG4gICAgICA6IHN0YXR1cyA9PT0gXCJ3YXJuXCJcbiAgICAgICAgPyBcImJvcmRlci10b2tlbi1jaGFydHMteWVsbG93IHRleHQtdG9rZW4tY2hhcnRzLXllbGxvd1wiXG4gICAgICAgIDogXCJib3JkZXItdG9rZW4tY2hhcnRzLXJlZCB0ZXh0LXRva2VuLWNoYXJ0cy1yZWRcIjtcbiAgYmFkZ2UuY2xhc3NOYW1lID0gYGlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciByb3VuZGVkLWZ1bGwgYm9yZGVyIHB4LTIgcHktMC41IHRleHQteHMgZm9udC1tZWRpdW0gJHt0b25lfWA7XG4gIGJhZGdlLnRleHRDb250ZW50ID0gbGFiZWwgfHwgKHN0YXR1cyA9PT0gXCJva1wiID8gXCJPS1wiIDogc3RhdHVzID09PSBcIndhcm5cIiA/IFwiUmV2aWV3XCIgOiBcIkVycm9yXCIpO1xuICByZXR1cm4gYmFkZ2U7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVN1bW1hcnkoY2hlY2s6IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB8IG51bGwpOiBzdHJpbmcge1xuICBpZiAoIWNoZWNrKSByZXR1cm4gXCJObyB1cGRhdGUgY2hlY2sgaGFzIHJ1biB5ZXQuXCI7XG4gIGNvbnN0IGxhdGVzdCA9IGNoZWNrLmxhdGVzdFZlcnNpb24gPyBgTGF0ZXN0IHYke2NoZWNrLmxhdGVzdFZlcnNpb259LiBgIDogXCJcIjtcbiAgY29uc3QgY2hlY2tlZCA9IGBDaGVja2VkICR7bmV3IERhdGUoY2hlY2suY2hlY2tlZEF0KS50b0xvY2FsZVN0cmluZygpfS5gO1xuICBpZiAoY2hlY2suZXJyb3IpIHJldHVybiBgJHtsYXRlc3R9JHtjaGVja2VkfSAke2NoZWNrLmVycm9yfWA7XG4gIHJldHVybiBgJHtsYXRlc3R9JHtjaGVja2VkfWA7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNoYW5uZWxTdW1tYXJ5KGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IHN0cmluZyB7XG4gIGlmIChjb25maWcudXBkYXRlQ2hhbm5lbCA9PT0gXCJjdXN0b21cIikge1xuICAgIHJldHVybiBgJHtjb25maWcudXBkYXRlUmVwbyB8fCBcImtwa2h4bGd5MC9jb2RleC1wbHVzcGx1c1wifSAke2NvbmZpZy51cGRhdGVSZWYgfHwgXCIobm8gcmVmIHNldClcIn1gO1xuICB9XG4gIGlmIChjb25maWcudXBkYXRlQ2hhbm5lbCA9PT0gXCJwcmVyZWxlYXNlXCIpIHtcbiAgICByZXR1cm4gXCJVc2UgdGhlIG5ld2VzdCBwdWJsaXNoZWQgR2l0SHViIHJlbGVhc2UsIGluY2x1ZGluZyBwcmVyZWxlYXNlcy5cIjtcbiAgfVxuICByZXR1cm4gXCJVc2UgdGhlIGxhdGVzdCBzdGFibGUgR2l0SHViIHJlbGVhc2UuXCI7XG59XG5cbmZ1bmN0aW9uIHNlbGZVcGRhdGVTdW1tYXJ5KHN0YXRlOiBTZWxmVXBkYXRlU3RhdGUgfCBudWxsKTogc3RyaW5nIHtcbiAgaWYgKCFzdGF0ZSkgcmV0dXJuIFwiTm8gYXV0b21hdGljIENvZGV4KysgdXBkYXRlIGhhcyBydW4geWV0LlwiO1xuICBjb25zdCBjaGVja2VkID0gbmV3IERhdGUoc3RhdGUuY29tcGxldGVkQXQgPz8gc3RhdGUuY2hlY2tlZEF0KS50b0xvY2FsZVN0cmluZygpO1xuICBjb25zdCB0YXJnZXQgPSBzdGF0ZS5sYXRlc3RWZXJzaW9uID8gYCBUYXJnZXQgdiR7c3RhdGUubGF0ZXN0VmVyc2lvbn0uYCA6IHN0YXRlLnRhcmdldFJlZiA/IGAgVGFyZ2V0ICR7c3RhdGUudGFyZ2V0UmVmfS5gIDogXCJcIjtcbiAgY29uc3Qgc291cmNlID0gc3RhdGUuaW5zdGFsbGF0aW9uU291cmNlPy5sYWJlbCA/PyBcInVua25vd24gc291cmNlXCI7XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwiZmFpbGVkXCIpIHJldHVybiBgRmFpbGVkICR7Y2hlY2tlZH0uJHt0YXJnZXR9ICR7c3RhdGUuZXJyb3IgPz8gXCJVbmtub3duIGVycm9yXCJ9YDtcbiAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gXCJ1cGRhdGVkXCIpIHJldHVybiBgVXBkYXRlZCAke2NoZWNrZWR9LiR7dGFyZ2V0fSBTb3VyY2U6ICR7c291cmNlfS5gO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcInVwLXRvLWRhdGVcIikgcmV0dXJuIGBVcCB0byBkYXRlICR7Y2hlY2tlZH0uJHt0YXJnZXR9IFNvdXJjZTogJHtzb3VyY2V9LmA7XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwiZGlzYWJsZWRcIikgcmV0dXJuIGBTa2lwcGVkICR7Y2hlY2tlZH07IGF1dG9tYXRpYyByZWZyZXNoIGlzIGRpc2FibGVkLmA7XG4gIHJldHVybiBgQ2hlY2tpbmcgZm9yIHVwZGF0ZXMuIFNvdXJjZTogJHtzb3VyY2V9LmA7XG59XG5cbmZ1bmN0aW9uIHNlbGZVcGRhdGVTdGF0dXNUb25lKHN0YXR1czogU2VsZlVwZGF0ZVN0YXR1cyk6IFwib2tcIiB8IFwid2FyblwiIHwgXCJlcnJvclwiIHtcbiAgaWYgKHN0YXR1cyA9PT0gXCJmYWlsZWRcIikgcmV0dXJuIFwiZXJyb3JcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJkaXNhYmxlZFwiIHx8IHN0YXR1cyA9PT0gXCJjaGVja2luZ1wiKSByZXR1cm4gXCJ3YXJuXCI7XG4gIHJldHVybiBcIm9rXCI7XG59XG5cbmZ1bmN0aW9uIHNlbGZVcGRhdGVTdGF0dXNMYWJlbChzdGF0dXM6IFNlbGZVcGRhdGVTdGF0dXMpOiBzdHJpbmcge1xuICBpZiAoc3RhdHVzID09PSBcInVwLXRvLWRhdGVcIikgcmV0dXJuIFwiVXAgdG8gZGF0ZVwiO1xuICBpZiAoc3RhdHVzID09PSBcInVwZGF0ZWRcIikgcmV0dXJuIFwiVXBkYXRlZFwiO1xuICBpZiAoc3RhdHVzID09PSBcImZhaWxlZFwiKSByZXR1cm4gXCJGYWlsZWRcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJkaXNhYmxlZFwiKSByZXR1cm4gXCJEaXNhYmxlZFwiO1xuICByZXR1cm4gXCJDaGVja2luZ1wiO1xufVxuXG5mdW5jdGlvbiByZWZyZXNoQ29uZmlnQ2FyZChyb3c6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGNhcmQgPSByb3cuY2xvc2VzdChcIltkYXRhLWNvZGV4cHAtY29uZmlnLWNhcmRdXCIpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKCFjYXJkKSByZXR1cm47XG4gIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIlJlZnJlc2hpbmdcIiwgXCJMb2FkaW5nIGN1cnJlbnQgQ29kZXgrKyB1cGRhdGUgc3RhdHVzLlwiKSk7XG4gIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAuaW52b2tlKFwiY29kZXhwcDpnZXQtY29uZmlnXCIpXG4gICAgLnRoZW4oKGNvbmZpZykgPT4ge1xuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICByZW5kZXJDb2RleFBsdXNQbHVzQ29uZmlnKGNhcmQsIGNvbmZpZyBhcyBDb2RleFBsdXNQbHVzQ29uZmlnKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICBjYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIkNvdWxkIG5vdCByZWZyZXNoIHVwZGF0ZSBzZXR0aW5nc1wiLCBTdHJpbmcoZSkpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gdW5pbnN0YWxsUm93KCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gYWN0aW9uUm93KFxuICAgIFwiVW5pbnN0YWxsIENvZGV4KytcIixcbiAgICBcIkNvcGllcyB0aGUgdW5pbnN0YWxsIGNvbW1hbmQuIFJ1biBpdCBmcm9tIGEgdGVybWluYWwgYWZ0ZXIgcXVpdHRpbmcgQ29kZXguXCIsXG4gICk7XG4gIGNvbnN0IGFjdGlvbiA9IHJvdy5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtcm93LWFjdGlvbnNdXCIpO1xuICBhY3Rpb24/LmFwcGVuZENoaWxkKFxuICAgIGNvbXBhY3RCdXR0b24oXCJDb3B5IENvbW1hbmRcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBpcGNSZW5kZXJlclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpjb3B5LXRleHRcIiwgXCJub2RlIH4vLmNvZGV4LXBsdXNwbHVzL3NvdXJjZS9wYWNrYWdlcy9pbnN0YWxsZXIvZGlzdC9jbGkuanMgdW5pbnN0YWxsXCIpXG4gICAgICAgIC5jYXRjaCgoZSkgPT4gcGxvZyhcImNvcHkgdW5pbnN0YWxsIGNvbW1hbmQgZmFpbGVkXCIsIFN0cmluZyhlKSkpO1xuICAgIH0pLFxuICApO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiByZXBvcnRCdWdSb3coKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSBhY3Rpb25Sb3coXG4gICAgXCJSZXBvcnQgYSBidWdcIixcbiAgICBcIk9wZW4gYSBHaXRIdWIgaXNzdWUgd2l0aCBydW50aW1lLCBpbnN0YWxsZXIsIG9yIHR3ZWFrLW1hbmFnZXIgZGV0YWlscy5cIixcbiAgKTtcbiAgY29uc3QgYWN0aW9uID0gcm93LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1yb3ctYWN0aW9uc11cIik7XG4gIGFjdGlvbj8uYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIk9wZW4gSXNzdWVcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgdGl0bGUgPSBlbmNvZGVVUklDb21wb25lbnQoXCJbQnVnXTogXCIpO1xuICAgICAgY29uc3QgYm9keSA9IGVuY29kZVVSSUNvbXBvbmVudChcbiAgICAgICAgW1xuICAgICAgICAgIFwiIyMgV2hhdCBoYXBwZW5lZD9cIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgU3RlcHMgdG8gcmVwcm9kdWNlXCIsXG4gICAgICAgICAgXCIxLiBcIixcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIFwiIyMgRW52aXJvbm1lbnRcIixcbiAgICAgICAgICBcIi0gQ29kZXgrKyB2ZXJzaW9uOiBcIixcbiAgICAgICAgICBcIi0gQ29kZXggYXBwIHZlcnNpb246IFwiLFxuICAgICAgICAgIFwiLSBPUzogXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIExvZ3NcIixcbiAgICAgICAgICBcIkF0dGFjaCByZWxldmFudCBsaW5lcyBmcm9tIHRoZSBDb2RleCsrIGxvZyBkaXJlY3RvcnkuXCIsXG4gICAgICAgIF0uam9pbihcIlxcblwiKSxcbiAgICAgICk7XG4gICAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIixcbiAgICAgICAgYGh0dHBzOi8vZ2l0aHViLmNvbS9rcGtoeGxneTAvY29kZXgtcGx1c3BsdXMvaXNzdWVzL25ldz90aXRsZT0ke3RpdGxlfSZib2R5PSR7Ym9keX1gLFxuICAgICAgKTtcbiAgICB9KSxcbiAgKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gYWN0aW9uUm93KHRpdGxlVGV4dDogc3RyaW5nLCBkZXNjcmlwdGlvbjogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICByb3cuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgcC0zXCI7XG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBsZWZ0LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSB0aXRsZVRleHQ7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcbiAgZGVzYy50ZXh0Q29udGVudCA9IGRlc2NyaXB0aW9uO1xuICBsZWZ0LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgbGVmdC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgcm93LmFwcGVuZENoaWxkKGxlZnQpO1xuICBjb25zdCBhY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYWN0aW9ucy5kYXRhc2V0LmNvZGV4cHBSb3dBY3Rpb25zID0gXCJ0cnVlXCI7XG4gIGFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICByb3cuYXBwZW5kQ2hpbGQoYWN0aW9ucyk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclR3ZWFrU3RvcmVQYWdlKFxuICBzZWN0aW9uc1dyYXA6IEhUTUxFbGVtZW50LFxuICBoZWFkZXJBY3Rpb25zPzogSFRNTEVsZW1lbnQsXG4pOiB2b2lkIHtcbiAgY29uc3Qgc2VjdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpO1xuICBzZWN0aW9uLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtNFwiO1xuXG4gIGNvbnN0IHNvdXJjZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBzb3VyY2UuaGlkZGVuID0gdHJ1ZTtcbiAgc291cmNlLmRhdGFzZXQuY29kZXhwcFN0b3JlU291cmNlID0gXCJ0cnVlXCI7XG4gIHNvdXJjZS50ZXh0Q29udGVudCA9IFwiTG9hZGluZyBsaXZlIHJlZ2lzdHJ5XCI7XG5cbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBjb25zdCByZWZyZXNoQnRuID0gc3RvcmVJY29uQnV0dG9uKHJlZnJlc2hJY29uU3ZnKCksIFwiUmVmcmVzaCB0d2VhayBzdG9yZVwiLCAoKSA9PiB7XG4gICAgcmVmcmVzaEJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShudWxsKTtcbiAgICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgICByZW5kZXJUd2Vha1N0b3JlR2hvc3RHcmlkKGdyaWQpO1xuICAgIHJlZnJlc2hUd2Vha1N0b3JlR3JpZChncmlkLCBzb3VyY2UsIHJlZnJlc2hCdG4sIHRydWUpO1xuICB9KTtcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChyZWZyZXNoQnRuKTtcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVRvb2xiYXJCdXR0b24oXCJQdWJsaXNoIFR3ZWFrXCIsIG9wZW5QdWJsaXNoVHdlYWtEaWFsb2csIFwicHJpbWFyeVwiKSk7XG4gIGlmIChoZWFkZXJBY3Rpb25zKSB7XG4gICAgaGVhZGVyQWN0aW9ucy5yZXBsYWNlQ2hpbGRyZW4oYWN0aW9ucyk7XG4gIH1cblxuICBjb25zdCBncmlkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZUdyaWQgPSBcInRydWVcIjtcbiAgZ3JpZC5jbGFzc05hbWUgPSBcImdyaWQgZ2FwLTRcIjtcbiAgaWYgKHN0YXRlLnR3ZWFrU3RvcmUpIHtcbiAgICBncmlkLmRhdGFzZXQuY29kZXhwcFN0b3JlID0gSlNPTi5zdHJpbmdpZnkoc3RhdGUudHdlYWtTdG9yZSk7XG4gICAgcmVuZGVyVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlKTtcbiAgfSBlbHNlIHtcbiAgICByZW5kZXJUd2Vha1N0b3JlR2hvc3RHcmlkKGdyaWQpO1xuICB9XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoc291cmNlKTtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChncmlkKTtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNlY3Rpb24pO1xuICByZWZyZXNoVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlLCByZWZyZXNoQnRuKTtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaFR3ZWFrU3RvcmVHcmlkKFxuICBncmlkOiBIVE1MRWxlbWVudCxcbiAgc291cmNlOiBIVE1MRWxlbWVudCxcbiAgcmVmcmVzaEJ0bj86IEhUTUxCdXR0b25FbGVtZW50LFxuICBmb3JjZSA9IGZhbHNlLFxuKTogdm9pZCB7XG4gIHZvaWQgZ2V0VHdlYWtTdG9yZShmb3JjZSlcbiAgICAudGhlbigoc3RvcmUpID0+IHtcbiAgICAgIGdyaWQuZGF0YXNldC5jb2RleHBwU3RvcmUgPSBKU09OLnN0cmluZ2lmeShzdG9yZSk7XG4gICAgICByZW5kZXJUd2Vha1N0b3JlR3JpZChncmlkLCBzb3VyY2UpO1xuICAgIH0pXG4gICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICBncmlkLmRhdGFzZXQuY29kZXhwcFN0b3JlID0gXCJcIjtcbiAgICAgIGdyaWQucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1idXN5XCIpO1xuICAgICAgc291cmNlLnRleHRDb250ZW50ID0gXCJMaXZlIHJlZ2lzdHJ5IHVuYXZhaWxhYmxlXCI7XG4gICAgICB1cGRhdGVTdG9yZVVwZGF0ZUJhZGdlKG51bGwpO1xuICAgICAgZ3JpZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICBncmlkLmFwcGVuZENoaWxkKHN0b3JlTWVzc2FnZUNhcmQoXCJDb3VsZCBub3QgbG9hZCB0d2VhayBzdG9yZVwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KVxuICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgIGlmIChyZWZyZXNoQnRuKSByZWZyZXNoQnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHdhcm1Ud2Vha1N0b3JlKCk6IHZvaWQge1xuICBpZiAoc3RhdGUudHdlYWtTdG9yZSB8fCBzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSkgcmV0dXJuO1xuICB2b2lkIGdldFR3ZWFrU3RvcmUoKS50aGVuKChzdG9yZSkgPT4ge1xuICAgIHVwZGF0ZVN0b3JlVXBkYXRlQmFkZ2Uob3V0ZGF0ZWRJbnN0YWxsZWRTdG9yZUNvdW50KHN0b3JlLmVudHJpZXMpKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFR3ZWFrU3RvcmUoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8VHdlYWtTdG9yZVJlZ2lzdHJ5Vmlldz4ge1xuICBpZiAoIWZvcmNlKSB7XG4gICAgaWYgKHN0YXRlLnR3ZWFrU3RvcmUpIHJldHVybiBQcm9taXNlLnJlc29sdmUoc3RhdGUudHdlYWtTdG9yZSk7XG4gICAgaWYgKHN0YXRlLnR3ZWFrU3RvcmVQcm9taXNlKSByZXR1cm4gc3RhdGUudHdlYWtTdG9yZVByb21pc2U7XG4gIH1cbiAgc3RhdGUudHdlYWtTdG9yZUVycm9yID0gbnVsbDtcbiAgY29uc3QgcHJvbWlzZSA9IGlwY1JlbmRlcmVyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LXR3ZWFrLXN0b3JlXCIpXG4gICAgLnRoZW4oKHN0b3JlKSA9PiB7XG4gICAgICBzdGF0ZS50d2Vha1N0b3JlID0gc3RvcmUgYXMgVHdlYWtTdG9yZVJlZ2lzdHJ5VmlldztcbiAgICAgIHJldHVybiBzdGF0ZS50d2Vha1N0b3JlO1xuICAgIH0pXG4gICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICBzdGF0ZS50d2Vha1N0b3JlRXJyb3IgPSBlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9KVxuICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgIGlmIChzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSA9PT0gcHJvbWlzZSkgc3RhdGUudHdlYWtTdG9yZVByb21pc2UgPSBudWxsO1xuICAgIH0pO1xuICBzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSA9IHByb21pc2U7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiByZW5kZXJUd2Vha1N0b3JlR3JpZChncmlkOiBIVE1MRWxlbWVudCwgc291cmNlOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBzdG9yZSA9IHBhcnNlU3RvcmVEYXRhc2V0KGdyaWQpO1xuICBpZiAoIXN0b3JlKSByZXR1cm47XG4gIGNvbnN0IGVudHJpZXMgPSBzdG9yZS5lbnRyaWVzO1xuICBncmlkLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtYnVzeVwiKTtcbiAgc291cmNlLnRleHRDb250ZW50ID0gYFJlZnJlc2hlZCAke25ldyBEYXRlKHN0b3JlLmZldGNoZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX1gO1xuICB1cGRhdGVTdG9yZVVwZGF0ZUJhZGdlKG91dGRhdGVkSW5zdGFsbGVkU3RvcmVDb3VudChlbnRyaWVzKSk7XG4gIGdyaWQudGV4dENvbnRlbnQgPSBcIlwiO1xuICBpZiAoc3RvcmUuZW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICBncmlkLmFwcGVuZENoaWxkKHN0b3JlTWVzc2FnZUNhcmQoXCJObyB0d2Vha3MgeWV0XCIsIFwiVXNlIFB1Ymxpc2ggVHdlYWsgdG8gc3VibWl0IHRoZSBmaXJzdCBvbmUuXCIpKTtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSBncmlkLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVDYXJkKGVudHJ5KSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3RvcmVEYXRhc2V0KGdyaWQ6IEhUTUxFbGVtZW50KTogVHdlYWtTdG9yZVJlZ2lzdHJ5VmlldyB8IG51bGwge1xuICBjb25zdCByYXcgPSBncmlkLmRhdGFzZXQuY29kZXhwcFN0b3JlO1xuICBpZiAoIXJhdykgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmF3KSBhcyBUd2Vha1N0b3JlUmVnaXN0cnlWaWV3O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlQ2FyZChlbnRyeTogVHdlYWtTdG9yZUVudHJ5Vmlldyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgc2hlbGwgPSB0d2Vha1N0b3JlQ2FyZFNoZWxsKCk7XG4gIGNvbnN0IHsgY2FyZCwgbGVmdCwgc3RhY2ssIHZlcnNpb25zLCBhY3Rpb25zIH0gPSBzaGVsbDtcblxuICBsZWZ0Lmluc2VydEJlZm9yZShzdG9yZUF2YXRhcihlbnRyeSksIHN0YWNrKTtcblxuICBjb25zdCB0aXRsZVJvdyA9IHR3ZWFrU3RvcmVUaXRsZVJvdygpO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LWxnIGZvbnQtc2VtaWJvbGQgbGVhZGluZy03IHRleHQtdG9rZW4tZm9yZWdyb3VuZFwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IGVudHJ5Lm1hbmlmZXN0Lm5hbWU7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodmVyaWZpZWRTYWZlQmFkZ2UoKSk7XG4gIHN0YWNrLmFwcGVuZENoaWxkKHRpdGxlUm93KTtcblxuICBpZiAoZW50cnkubWFuaWZlc3QuZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBkZXNjID0gdHdlYWtTdG9yZURlc2NyaXB0aW9uKCk7XG4gICAgZGVzYy50ZXh0Q29udGVudCA9IGVudHJ5Lm1hbmlmZXN0LmRlc2NyaXB0aW9uO1xuICAgIHN0YWNrLmFwcGVuZENoaWxkKGRlc2MpO1xuICB9XG5cbiAgc3RhY2suYXBwZW5kQ2hpbGQodHdlYWtTdG9yZVJlYWRNb3JlQnV0dG9uKGVudHJ5LnJlcG8pKTtcbiAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQodHdlYWtTdG9yZVZlcnNpb25CYWRnZShlbnRyeSkpO1xuXG4gIGlmIChlbnRyeS5yZWxlYXNlVXJsKSB7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJSZWxlYXNlXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgZW50cnkucmVsZWFzZVVybCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG4gIGNvbnN0IGhhc1VwZGF0ZSA9ICEhZW50cnkuaW5zdGFsbGVkICYmIGVudHJ5Lmluc3RhbGxlZC52ZXJzaW9uICE9PSBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uO1xuICBpZiAoZW50cnkuaW5zdGFsbGVkICYmICFoYXNVcGRhdGUpIHtcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKHN0b3JlU3RhdHVzUGlsbChcIkluc3RhbGxlZFwiKSk7XG4gIH0gZWxzZSBpZiAoZW50cnkucGxhdGZvcm0gJiYgIWVudHJ5LnBsYXRmb3JtLmNvbXBhdGlibGUpIHtcbiAgICBjYXJkLmNsYXNzTGlzdC5hZGQoXCJvcGFjaXR5LTcwXCIpO1xuICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3RvcmVTdGF0dXNQaWxsKHBsYXRmb3JtTG9ja2VkTGFiZWwoZW50cnkucGxhdGZvcm0pKSk7XG4gIH0gZWxzZSBpZiAoZW50cnkucnVudGltZSAmJiAhZW50cnkucnVudGltZS5jb21wYXRpYmxlKSB7XG4gICAgY2FyZC5jbGFzc0xpc3QuYWRkKFwib3BhY2l0eS03MFwiKTtcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKHN0b3JlU3RhdHVzUGlsbChydW50aW1lTG9ja2VkTGFiZWwoZW50cnkucnVudGltZSkpKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBpbnN0YWxsTGFiZWwgPSBlbnRyeS5pbnN0YWxsZWQgPyBcIlVwZGF0ZVwiIDogXCJJbnN0YWxsXCI7XG4gICAgaWYgKGhhc1VwZGF0ZSkgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c1BpbGwoXCJVcGRhdGUgYXZhaWxhYmxlXCIsIFwiaW5mb1wiKSk7XG4gICAgY29uc3QgaW5zdGFsbEJ1dHRvbiA9IHN0b3JlSW5zdGFsbEJ1dHRvbihpbnN0YWxsTGFiZWwsIChidXR0b24pID0+IHtcbiAgICAgIGNvbnN0IGdyaWQgPSBjYXJkLmNsb3Nlc3QoXCJbZGF0YS1jb2RleHBwLXN0b3JlLWdyaWRdXCIpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IGdyaWQ/LnBhcmVudEVsZW1lbnQ/LnF1ZXJ5U2VsZWN0b3IoXCJbZGF0YS1jb2RleHBwLXN0b3JlLXNvdXJjZV1cIikgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgc2hvd1N0b3JlQnV0dG9uTG9hZGluZyhidXR0b24sIGVudHJ5Lmluc3RhbGxlZCA/IFwiVXBkYXRpbmdcIiA6IFwiSW5zdGFsbGluZ1wiKTtcbiAgICAgIGFjdGlvbnMucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvblwiKS5mb3JFYWNoKChidXR0b24pID0+IChidXR0b24uZGlzYWJsZWQgPSB0cnVlKSk7XG4gICAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAgIC5pbnZva2UoXCJjb2RleHBwOmluc3RhbGwtc3RvcmUtdHdlYWtcIiwgZW50cnkuaWQpXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBzaG93U3RvcmVUb2FzdChgJHtlbnRyeS5tYW5pZmVzdC5uYW1lfSBpbnN0YWxsZWQuYCk7XG4gICAgICAgICAgc2hvd1N0b3JlQnV0dG9uSW5zdGFsbGVkKGJ1dHRvbik7XG4gICAgICAgICAgdmVyc2lvbnMucmVwbGFjZUNoaWxkcmVuKHR3ZWFrU3RvcmVWZXJzaW9uQmFkZ2UoZW50cnksIGVudHJ5Lm1hbmlmZXN0LnZlcnNpb24pKTtcbiAgICAgICAgICB1cGRhdGVTdG9yZVVwZGF0ZUJhZGdlKE1hdGgubWF4KDAsIGN1cnJlbnRTdG9yZVVwZGF0ZUJhZGdlQ291bnQoKSAtIDEpKTtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGFjdGlvbnMucmVwbGFjZUNoaWxkcmVuKHN0b3JlU3RhdHVzUGlsbChcIkluc3RhbGxlZFwiKSk7XG4gICAgICAgICAgICBpZiAoZ3JpZCAmJiBzb3VyY2UpIHJlZnJlc2hUd2Vha1N0b3JlR3JpZChncmlkLCBzb3VyY2UsIHVuZGVmaW5lZCwgdHJ1ZSk7XG4gICAgICAgICAgfSwgOTAwKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgcmVzZXRTdG9yZUluc3RhbGxCdXR0b24oYnV0dG9uLCBpbnN0YWxsTGFiZWwpO1xuICAgICAgICAgIGFjdGlvbnMucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvblwiKS5mb3JFYWNoKChidXR0b24pID0+IChidXR0b24uZGlzYWJsZWQgPSBmYWxzZSkpO1xuICAgICAgICAgIHNob3dTdG9yZUNhcmRNZXNzYWdlKGNhcmQsIFN0cmluZygoZSBhcyBFcnJvcikubWVzc2FnZSA/PyBlKSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoaW5zdGFsbEJ1dHRvbik7XG4gIH1cbiAgcmV0dXJuIGNhcmQ7XG59XG5cbmZ1bmN0aW9uIHBsYXRmb3JtTG9ja2VkTGFiZWwocGxhdGZvcm06IE5vbk51bGxhYmxlPFR3ZWFrU3RvcmVFbnRyeVZpZXdbXCJwbGF0Zm9ybVwiXT4pOiBzdHJpbmcge1xuICBjb25zdCBzdXBwb3J0ZWQgPSBwbGF0Zm9ybS5zdXBwb3J0ZWQgPz8gW107XG4gIGlmIChzdXBwb3J0ZWQuaW5jbHVkZXMoXCJ3aW4zMlwiKSkgcmV0dXJuIFwiV2luZG93cyBvbmx5XCI7XG4gIGlmIChzdXBwb3J0ZWQuaW5jbHVkZXMoXCJkYXJ3aW5cIikpIHJldHVybiBcIm1hY09TIG9ubHlcIjtcbiAgaWYgKHN1cHBvcnRlZC5pbmNsdWRlcyhcImxpbnV4XCIpKSByZXR1cm4gXCJMaW51eCBvbmx5XCI7XG4gIHJldHVybiBcIlVuYXZhaWxhYmxlXCI7XG59XG5cbmZ1bmN0aW9uIHJ1bnRpbWVMb2NrZWRMYWJlbChydW50aW1lOiBOb25OdWxsYWJsZTxUd2Vha1N0b3JlRW50cnlWaWV3W1wicnVudGltZVwiXT4pOiBzdHJpbmcge1xuICByZXR1cm4gcnVudGltZS5yZXF1aXJlZCA/IGBSZXF1aXJlcyBDb2RleCsrICR7cnVudGltZS5yZXF1aXJlZH1gIDogXCJSZXF1aXJlcyBuZXdlciBDb2RleCsrXCI7XG59XG5cbmZ1bmN0aW9uIHNob3dTdG9yZUNhcmRNZXNzYWdlKGNhcmQ6IEhUTUxFbGVtZW50LCBtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgY2FyZC5xdWVyeVNlbGVjdG9yKFwiW2RhdGEtY29kZXhwcC1zdG9yZS1jYXJkLW1lc3NhZ2VdXCIpPy5yZW1vdmUoKTtcbiAgY29uc3Qgbm90aWNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbm90aWNlLmRhdGFzZXQuY29kZXhwcFN0b3JlQ2FyZE1lc3NhZ2UgPSBcInRydWVcIjtcbiAgbm90aWNlLmNsYXNzTmFtZSA9XG4gICAgXCJyb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLzUwIGJnLXRva2VuLWZvcmVncm91bmQvNSBweC0zIHB5LTIgdGV4dC1zbSBsZWFkaW5nLTUgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XG4gIG5vdGljZS50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG4gIGNvbnN0IGFjdGlvbnMgPSBjYXJkLmxhc3RFbGVtZW50Q2hpbGQ7XG4gIGlmIChhY3Rpb25zKSBjYXJkLmluc2VydEJlZm9yZShub3RpY2UsIGFjdGlvbnMpO1xuICBlbHNlIGNhcmQuYXBwZW5kQ2hpbGQobm90aWNlKTtcbn1cblxuZnVuY3Rpb24gdHdlYWtTdG9yZUNhcmRTaGVsbCgpOiB7XG4gIGNhcmQ6IEhUTUxFbGVtZW50O1xuICBsZWZ0OiBIVE1MRWxlbWVudDtcbiAgc3RhY2s6IEhUTUxFbGVtZW50O1xuICB2ZXJzaW9uczogSFRNTEVsZW1lbnQ7XG4gIGFjdGlvbnM6IEhUTUxFbGVtZW50O1xufSB7XG4gIGNvbnN0IGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjYXJkLmNsYXNzTmFtZSA9XG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyLzQwIGZsZXggbWluLWgtWzE5MHB4XSBmbGV4LWNvbCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgcm91bmRlZC0yeGwgYm9yZGVyIHAtNCB0cmFuc2l0aW9uLWNvbG9ycyBob3ZlcjpiZy10b2tlbi1mb3JlZ3JvdW5kLzVcIjtcblxuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LTEgaXRlbXMtc3RhcnQgZ2FwLTNcIjtcbiAgY29uc3Qgc3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LTEgZmxleC1jb2wgZ2FwLTJcIjtcbiAgbGVmdC5hcHBlbmRDaGlsZChzdGFjayk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQobGVmdCk7XG5cbiAgY29uc3QgZm9vdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZm9vdGVyLmNsYXNzTmFtZSA9IFwibXQtYXV0byBmbGV4IG1pbi13LTAgZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTJcIjtcbiAgY29uc3QgdmVyc2lvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB2ZXJzaW9ucy5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LTEgaXRlbXMtY2VudGVyIGdhcC0yXCI7XG4gIGZvb3Rlci5hcHBlbmRDaGlsZCh2ZXJzaW9ucyk7XG4gIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIganVzdGlmeS1lbmQgZ2FwLTJcIjtcbiAgZm9vdGVyLmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuICBjYXJkLmFwcGVuZENoaWxkKGZvb3Rlcik7XG5cbiAgcmV0dXJuIHsgY2FyZCwgbGVmdCwgc3RhY2ssIHZlcnNpb25zLCBhY3Rpb25zIH07XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3RvcmVUaXRsZVJvdygpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHRpdGxlUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGVSb3cuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI7XG4gIHJldHVybiB0aXRsZVJvdztcbn1cblxuZnVuY3Rpb24gdHdlYWtTdG9yZURlc2NyaXB0aW9uKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRlc2MuY2xhc3NOYW1lID0gXCJsaW5lLWNsYW1wLTMgbWluLXctMCB0ZXh0LXNtIGxlYWRpbmctNSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIHJldHVybiBkZXNjO1xufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlUmVhZE1vcmVCdXR0b24ocmVwbzogc3RyaW5nKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCByZWFkTW9yZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIHJlYWRNb3JlLnR5cGUgPSBcImJ1dHRvblwiO1xuICByZWFkTW9yZS5jbGFzc05hbWUgPVxuICAgIFwiaW5saW5lLWZsZXggdy1maXQgaXRlbXMtY2VudGVyIGdhcC0xIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LWxpbmstZm9yZWdyb3VuZCBob3Zlcjp1bmRlcmxpbmVcIjtcbiAgcmVhZE1vcmUudGV4dENvbnRlbnQgPSBcIlJlYWQgTW9yZVwiO1xuICBhcHBlbmRTdmdIdG1sKFxuICAgIHJlYWRNb3JlLFxuICAgIGA8c3ZnIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwibm9uZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTYgMy41aDYuNVYxME0xMi4yNSAzLjc1IDQgMTJcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjQ1XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8L3N2Zz5gLFxuICApO1xuICByZWFkTW9yZS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCBgaHR0cHM6Ly9naXRodWIuY29tLyR7cmVwb31gKTtcbiAgfSk7XG4gIHJldHVybiByZWFkTW9yZTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBncmlkLnNldEF0dHJpYnV0ZShcImFyaWEtYnVzeVwiLCBcInRydWVcIik7XG4gIGdyaWQudGV4dENvbnRlbnQgPSBcIlwiO1xuICBncmlkLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVHaG9zdENhcmQoKSk7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3RvcmVHaG9zdENhcmQoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCB7IGNhcmQsIGxlZnQsIHN0YWNrLCB2ZXJzaW9ucywgYWN0aW9ucyB9ID0gdHdlYWtTdG9yZUNhcmRTaGVsbCgpO1xuICBjYXJkLmNsYXNzTGlzdC5hZGQoXCJwb2ludGVyLWV2ZW50cy1ub25lXCIpO1xuICBjYXJkLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcblxuICBsZWZ0Lmluc2VydEJlZm9yZShzdG9yZUF2YXRhckdob3N0KCksIHN0YWNrKTtcblxuICBjb25zdCB0aXRsZVJvdyA9IHR3ZWFrU3RvcmVUaXRsZVJvdygpO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LWxnIGZvbnQtc2VtaWJvbGQgbGVhZGluZy03IHRleHQtdG9rZW4tZm9yZWdyb3VuZFwiO1xuICB0aXRsZS5hcHBlbmRDaGlsZChnaG9zdEJsb2NrKFwibXktMSBoLTUgdy00NCByb3VuZGVkLW1kXCIpKTtcbiAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodGl0bGUpO1xuICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh2ZXJpZmllZFNhZmVHaG9zdEJhZGdlKCkpO1xuICBzdGFjay5hcHBlbmRDaGlsZCh0aXRsZVJvdyk7XG5cbiAgY29uc3QgZGVzYyA9IHR3ZWFrU3RvcmVEZXNjcmlwdGlvbigpO1xuICBkZXNjLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJtdC0xIGgtMyB3LWZ1bGwgcm91bmRlZFwiKSk7XG4gIGRlc2MuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcIm10LTIgaC0zIHctMTEvMTIgcm91bmRlZFwiKSk7XG4gIGRlc2MuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcIm10LTIgaC0zIHctNy8xMiByb3VuZGVkXCIpKTtcbiAgc3RhY2suYXBwZW5kQ2hpbGQoZGVzYyk7XG5cbiAgY29uc3QgcmVhZE1vcmUgPSB0d2Vha1N0b3JlUmVhZE1vcmVCdXR0b24oXCJcIik7XG4gIHJlYWRNb3JlLnJlcGxhY2VDaGlsZHJlbihnaG9zdEJsb2NrKFwiaC01IHctMjQgcm91bmRlZFwiKSk7XG4gIHN0YWNrLmFwcGVuZENoaWxkKHJlYWRNb3JlKTtcblxuICB2ZXJzaW9ucy5hcHBlbmRDaGlsZChzdG9yZVZlcnNpb25HaG9zdEJhZGdlKCkpO1xuICBhY3Rpb25zLmFwcGVuZENoaWxkKHN0b3JlU3RhdHVzR2hvc3RQaWxsKCkpO1xuICByZXR1cm4gY2FyZDtcbn1cblxuZnVuY3Rpb24gc3RvcmVBdmF0YXJHaG9zdCgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGF2YXRhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGF2YXRhci5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBoLTEwIHctMTAgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLWRlZmF1bHQgYmctdHJhbnNwYXJlbnQgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XG4gIGF2YXRhci5hcHBlbmRDaGlsZChnaG9zdEJsb2NrKFwiaC1mdWxsIHctZnVsbFwiKSk7XG4gIHJldHVybiBhdmF0YXI7XG59XG5cbmZ1bmN0aW9uIHZlcmlmaWVkU2FmZUdob3N0QmFkZ2UoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBiYWRnZSA9IHZlcmlmaWVkU2FmZUJhZGdlKCk7XG4gIGJhZGdlLnJlcGxhY2VDaGlsZHJlbihnaG9zdEJsb2NrKFwiaC1bMTNweF0gdy1bMTNweF0gcm91bmRlZC1zbVwiKSwgZ2hvc3RCbG9jayhcImgtMyB3LTIwIHJvdW5kZWRcIikpO1xuICByZXR1cm4gYmFkZ2U7XG59XG5cbmZ1bmN0aW9uIHN0b3JlU3RhdHVzR2hvc3RQaWxsKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgcGlsbCA9IHN0b3JlU3RhdHVzUGlsbChcIkluc3RhbGxlZFwiKTtcbiAgcGlsbC5jbGFzc0xpc3QuYWRkKFwiYW5pbWF0ZS1wdWxzZVwiKTtcbiAgcGlsbC5zdHlsZS5jb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcbiAgcmV0dXJuIHBpbGw7XG59XG5cbmZ1bmN0aW9uIHN0b3JlVmVyc2lvbkdob3N0QmFkZ2UoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBiYWRnZSA9IHN0b3JlVmVyc2lvbkJhZGdlU2hlbGwoZmFsc2UpO1xuICBiYWRnZS5hcHBlbmRDaGlsZChnaG9zdEJsb2NrKFwiaC0zIHctMzYgcm91bmRlZFwiKSk7XG4gIHJldHVybiBiYWRnZTtcbn1cblxuZnVuY3Rpb24gZ2hvc3RCbG9jayhjbGFzc05hbWU6IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBibG9jay5jbGFzc05hbWUgPSBgYW5pbWF0ZS1wdWxzZSBiZy10b2tlbi1mb3JlZ3JvdW5kLzEwICR7Y2xhc3NOYW1lfWA7XG4gIGJsb2NrLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgcmV0dXJuIGJsb2NrO1xufVxuXG5mdW5jdGlvbiBzdG9yZUF2YXRhcihlbnRyeTogVHdlYWtTdG9yZUVudHJ5Vmlldyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYXZhdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYXZhdGFyLmNsYXNzTmFtZSA9XG4gICAgXCJmbGV4IGgtMTAgdy0xMCBzaHJpbmstMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgb3ZlcmZsb3ctaGlkZGVuIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXItZGVmYXVsdCBiZy10cmFuc3BhcmVudCB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmRcIjtcbiAgY29uc3QgaW5pdGlhbCA9IChlbnRyeS5tYW5pZmVzdC5uYW1lPy5bMF0gPz8gXCI/XCIpLnRvVXBwZXJDYXNlKCk7XG4gIGNvbnN0IGZhbGxiYWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGZhbGxiYWNrLnRleHRDb250ZW50ID0gaW5pdGlhbDtcbiAgYXZhdGFyLmFwcGVuZENoaWxkKGZhbGxiYWNrKTtcbiAgY29uc3QgaWNvblVybCA9IHN0b3JlRW50cnlJY29uVXJsKGVudHJ5KTtcbiAgaWYgKGljb25VcmwpIHtcbiAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgIGltZy5hbHQgPSBcIlwiO1xuICAgIGltZy5jbGFzc05hbWUgPSBcImgtZnVsbCB3LWZ1bGwgb2JqZWN0LWNvdmVyXCI7XG4gICAgaW1nLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICBpbWcuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xuICAgICAgZmFsbGJhY2sucmVtb3ZlKCk7XG4gICAgICBpbWcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgfSk7XG4gICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoKSA9PiB7XG4gICAgICBpbWcucmVtb3ZlKCk7XG4gICAgfSk7XG4gICAgaW1nLnNyYyA9IGljb25Vcmw7XG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKGltZyk7XG4gIH1cbiAgcmV0dXJuIGF2YXRhcjtcbn1cblxuZnVuY3Rpb24gc3RvcmVFbnRyeUljb25VcmwoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeVZpZXcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgaWNvblVybCA9IGVudHJ5Lm1hbmlmZXN0Lmljb25Vcmw/LnRyaW0oKTtcbiAgaWYgKCFpY29uVXJsKSByZXR1cm4gbnVsbDtcbiAgaWYgKC9eKGh0dHBzPzp8ZGF0YTopL2kudGVzdChpY29uVXJsKSkgcmV0dXJuIGljb25Vcmw7XG4gIGNvbnN0IHJlbCA9IGljb25VcmwucmVwbGFjZSgvXlxcLj9cXC8vLCBcIlwiKTtcbiAgaWYgKCFyZWwgfHwgcmVsLnN0YXJ0c1dpdGgoXCIuLi9cIikpIHJldHVybiBudWxsO1xuICByZXR1cm4gYGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS8ke2VudHJ5LnJlcG99LyR7ZW50cnkuYXBwcm92ZWRDb21taXRTaGF9LyR7cmVsfWA7XG59XG5cbmZ1bmN0aW9uIHNpZGViYXJVcGRhdGVQaWxsQnV0dG9uKCk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xuICBidG4uZGF0YXNldC5jb2RleHBwU2lkZWJhclVwZGF0ZSA9IFwidHJ1ZVwiO1xuICBidG4uY2xhc3NOYW1lID1cbiAgICBcInVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gaW5saW5lLWZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHdoaXRlc3BhY2Utbm93cmFwXCI7XG4gIE9iamVjdC5hc3NpZ24oYnRuLnN0eWxlLCB7XG4gICAgZGlzcGxheTogXCJub25lXCIsXG4gICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOTk5OXB4XCIsXG4gICAgYm9yZGVyOiBcIjBcIixcbiAgICBiYWNrZ3JvdW5kOiBcIiMwQTg0RkZcIixcbiAgICBjb2xvcjogXCIjRkZGRkZGXCIsXG4gICAgcGFkZGluZzogXCIwIDhweFwiLFxuICAgIGZvbnRTaXplOiBcIjEwcHhcIixcbiAgICBmb250V2VpZ2h0OiBcIjcwMFwiLFxuICAgIGxpbmVIZWlnaHQ6IFwiMjBweFwiLFxuICAgIGxldHRlclNwYWNpbmc6IFwiMFwiLFxuICAgIHRleHRUcmFuc2Zvcm06IFwibm9uZVwiLFxuICAgIGJveFNoYWRvdzogXCIwIDFweCAycHggcmdiYSgwLCAwLCAwLCAwLjE4KVwiLFxuICB9KTtcbiAgYnRuLnRleHRDb250ZW50ID0gXCJVcGRhdGVcIjtcbiAgYnRuLnRpdGxlID0gXCJPcGVuIENvZGV4KysgdXBkYXRlXCI7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwibW91c2VlbnRlclwiLCAoKSA9PiB7XG4gICAgYnRuLnN0eWxlLmJhY2tncm91bmQgPSBcIiMwMDcxRTNcIjtcbiAgfSk7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwibW91c2VsZWF2ZVwiLCAoKSA9PiB7XG4gICAgYnRuLnN0eWxlLmJhY2tncm91bmQgPSBcIiMwQTg0RkZcIjtcbiAgfSk7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCBidG4uZGF0YXNldC5jb2RleHBwUmVsZWFzZVVybCB8fCBDT0RFWF9QTFVTUExVU19SRUxFQVNFU19VUkwpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKGZvcmNlID0gZmFsc2UpOiB2b2lkIHtcbiAgY29uc3QgYnRuID0gc3RhdGUuY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbjtcbiAgaWYgKCFidG4pIHJldHVybjtcbiAgdm9pZCBpcGNSZW5kZXJlclxuICAgIC5pbnZva2UoXCJjb2RleHBwOmNoZWNrLWNvZGV4cHAtdXBkYXRlXCIsIGZvcmNlKVxuICAgIC50aGVuKChjaGVjaykgPT4gc2V0U2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oY2hlY2sgYXMgQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrKSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIHBsb2coXCJDb2RleCsrIHNpZGViYXIgcmVsZWFzZSBjaGVjayBmYWlsZWRcIiwgU3RyaW5nKGUpKTtcbiAgICAgIHNldFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKG51bGwpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjaGVjazogQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBidG4gPSBzdGF0ZS5jb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uO1xuICBpZiAoIWJ0bikgcmV0dXJuO1xuICBjb25zdCB1cGRhdGVBdmFpbGFibGUgPSBjaGVjaz8udXBkYXRlQXZhaWxhYmxlID09PSB0cnVlO1xuICBidG4uc3R5bGUuZGlzcGxheSA9IHVwZGF0ZUF2YWlsYWJsZSA/IFwiaW5saW5lLWZsZXhcIiA6IFwibm9uZVwiO1xuICBidG4uaGlkZGVuID0gIXVwZGF0ZUF2YWlsYWJsZTtcbiAgYnRuLmRhdGFzZXQuY29kZXhwcFJlbGVhc2VVcmwgPSBjaGVjaz8ucmVsZWFzZVVybCB8fCBDT0RFWF9QTFVTUExVU19SRUxFQVNFU19VUkw7XG4gIGJ0bi50aXRsZSA9XG4gICAgdXBkYXRlQXZhaWxhYmxlICYmIGNoZWNrPy5sYXRlc3RWZXJzaW9uXG4gICAgICA/IGBPcGVuIENvZGV4KysgJHtjaGVjay5sYXRlc3RWZXJzaW9ufSB1cGRhdGVgXG4gICAgICA6IFwiT3BlbiBDb2RleCsrIHVwZGF0ZVwiO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTdG9yZVVwZGF0ZUJhZGdlKGNvdW50OiBudW1iZXIgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXN0b3JlLXVwZGF0ZS1iYWRnZV1cIik7XG4gIGlmICghYmFkZ2UpIHJldHVybjtcbiAgYmFkZ2UuZGF0YXNldC5jb2RleHBwU3RvcmVVcGRhdGVDb3VudCA9IGNvdW50ID09PSBudWxsID8gXCJcIiA6IFN0cmluZyhjb3VudCk7XG4gIGFwcGx5U3RvcmVVcGRhdGVCYWRnZVN0eWxlKGJhZGdlLCBjb3VudCk7XG4gIGJhZGdlLmhpZGRlbiA9IGNvdW50ID09PSBudWxsIHx8IGNvdW50IDw9IDA7XG4gIGJhZGdlLnRleHRDb250ZW50ID0gY291bnQgJiYgY291bnQgPiAwID8gU3RyaW5nKGNvdW50KSA6IFwiXCI7XG4gIGJhZGdlLnRpdGxlID1cbiAgICBjb3VudCAmJiBjb3VudCA+IDBcbiAgICAgID8gYCR7Y291bnR9IGluc3RhbGxlZCB0d2VhayR7Y291bnQgPT09IDEgPyBcIlwiIDogXCJzXCJ9IGNhbiBiZSB1cGRhdGVkYFxuICAgICAgOiBcIkluc3RhbGxlZCB0d2Vha3MgYXJlIHVwIHRvIGRhdGVcIjtcbn1cblxuZnVuY3Rpb24gYXBwbHlTdG9yZVVwZGF0ZUJhZGdlU3R5bGUoYmFkZ2U6IEhUTUxFbGVtZW50LCBjb3VudDogbnVtYmVyIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBoYXNVcGRhdGVzID0gISFjb3VudCAmJiBjb3VudCA+IDA7XG4gIE9iamVjdC5hc3NpZ24oYmFkZ2Uuc3R5bGUsIHtcbiAgICBtaW5XaWR0aDogXCIyNHB4XCIsXG4gICAgaGVpZ2h0OiBcIjIwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOTk5OXB4XCIsXG4gICAgYm9yZGVyOiBcIjBcIixcbiAgICBiYWNrZ3JvdW5kOiBoYXNVcGRhdGVzID8gXCIjMEE4NEZGXCIgOiBcInRyYW5zcGFyZW50XCIsXG4gICAgY29sb3I6IFwiI0ZGRkZGRlwiLFxuICAgIHBhZGRpbmc6IFwiMCA3cHhcIixcbiAgICBmb250U2l6ZTogXCIxMnB4XCIsXG4gICAgZm9udFdlaWdodDogXCI3MDBcIixcbiAgICBsaW5lSGVpZ2h0OiBcIjIwcHhcIixcbiAgICBsZXR0ZXJTcGFjaW5nOiBcIjBcIixcbiAgICBib3hTaGFkb3c6IGhhc1VwZGF0ZXMgPyBcIjAgMXB4IDJweCByZ2JhKDAsIDAsIDAsIDAuMjIpXCIgOiBcIm5vbmVcIixcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGN1cnJlbnRTdG9yZVVwZGF0ZUJhZGdlQ291bnQoKTogbnVtYmVyIHtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtc3RvcmUtdXBkYXRlLWJhZGdlXVwiKTtcbiAgY29uc3QgcmF3ID0gYmFkZ2U/LmRhdGFzZXQuY29kZXhwcFN0b3JlVXBkYXRlQ291bnQ7XG4gIGNvbnN0IHBhcnNlZCA9IHJhdyA/IE51bWJlcihyYXcpIDogMDtcbiAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpID8gcGFyc2VkIDogMDtcbn1cblxuZnVuY3Rpb24gb3V0ZGF0ZWRJbnN0YWxsZWRTdG9yZUNvdW50KGVudHJpZXM6IFR3ZWFrU3RvcmVFbnRyeVZpZXdbXSk6IG51bWJlciB7XG4gIHJldHVybiBlbnRyaWVzLmZpbHRlcigoZW50cnkpID0+ICEhZW50cnkuaW5zdGFsbGVkICYmIGVudHJ5Lmluc3RhbGxlZC52ZXJzaW9uICE9PSBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uKS5sZW5ndGg7XG59XG5cbmZ1bmN0aW9uIHN0b3JlVG9vbGJhckJ1dHRvbihcbiAgbGFiZWw6IHN0cmluZyxcbiAgb25DbGljazogKCkgPT4gdm9pZCxcbiAgdmFyaWFudDogXCJwcmltYXJ5XCIgfCBcInNlY29uZGFyeVwiID0gXCJzZWNvbmRhcnlcIixcbik6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xuICBidG4uY2xhc3NOYW1lID1cbiAgICB2YXJpYW50ID09PSBcInByaW1hcnlcIlxuICAgICAgPyBcImJvcmRlci10b2tlbi1ib3JkZXIgdXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBmbGV4IGgtOCBpdGVtcy1jZW50ZXIgZ2FwLTEgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1iZy1mb2cgcHgtMiBweS0wIHRleHQtc20gdGV4dC10b2tlbi1idXR0b24tdGVydGlhcnktZm9yZWdyb3VuZCBlbmFibGVkOmhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS00MFwiXG4gICAgICA6IFwiYm9yZGVyLXRva2VuLWJvcmRlciB1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGZsZXggaC04IGl0ZW1zLWNlbnRlciBnYXAtMSB3aGl0ZXNwYWNlLW5vd3JhcCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdHJhbnNwYXJlbnQgYmctdG9rZW4tZm9yZWdyb3VuZC81IHB4LTIgcHktMCB0ZXh0LXNtIHRleHQtdG9rZW4tZm9yZWdyb3VuZCBlbmFibGVkOmhvdmVyOmJnLXRva2VuLWZvcmVncm91bmQvMTAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNDBcIjtcbiAgYnRuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBvbkNsaWNrKCk7XG4gIH0pO1xuICByZXR1cm4gYnRuO1xufVxuXG5mdW5jdGlvbiBzdG9yZUljb25CdXR0b24oXG4gIGljb25Tdmc6IHN0cmluZyxcbiAgbGFiZWw6IHN0cmluZyxcbiAgb25DbGljazogKCkgPT4gdm9pZCxcbik6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xuICBidG4uY2xhc3NOYW1lID1cbiAgICBcImJvcmRlci10b2tlbi1ib3JkZXIgdXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBmbGV4IGgtOCB3LTggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10cmFuc3BhcmVudCBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcC0wIHRleHQtdG9rZW4tZm9yZWdyb3VuZCBlbmFibGVkOmhvdmVyOmJnLXRva2VuLWZvcmVncm91bmQvMTAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNDBcIjtcbiAgYXBwZW5kU3ZnSHRtbChidG4sIGljb25TdmcpO1xuICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBsYWJlbCk7XG4gIGJ0bi50aXRsZSA9IGxhYmVsO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljaygpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gdmVyaWZpZWRTYWZlQmFkZ2UoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBiYWRnZS5jbGFzc05hbWUgPVxuICAgIFwiaW5saW5lLWZsZXggaC02IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMS41IHJvdW5kZWQtbWQgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIvMzAgYmctdHJhbnNwYXJlbnQgcHgtMiB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZFwiO1xuICBhcHBlbmRTdmdIdG1sKFxuICAgIGJhZGdlLFxuICAgIGA8c3ZnIHdpZHRoPVwiMTNcIiBoZWlnaHQ9XCIxM1wiIHZpZXdCb3g9XCIwIDAgMTQgMTRcIiBmaWxsPVwibm9uZVwiIGNsYXNzPVwidGV4dC1ibHVlLTUwMFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTcgMS43NSAxMS4yNSAzLjR2My4yYzAgMi42LTEuNjUgNC4yNS00LjI1IDUuNC0yLjYtMS4xNS00LjI1LTIuOC00LjI1LTUuNFYzLjRMNyAxLjc1WlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuMTVcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPHBhdGggZD1cIk00Ljg1IDcuMDUgNi4zIDguNDVsMi44NS0zLjA1XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS4yNVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YCxcbiAgKTtcbiAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICB0ZXh0LnRleHRDb250ZW50ID0gXCJWZXJpZmllZCBhcyBzYWZlXCI7XG4gIGJhZGdlLmFwcGVuZENoaWxkKHRleHQpO1xuICByZXR1cm4gYmFkZ2U7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3RvcmVWZXJzaW9uQmFkZ2UoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeVZpZXcsIGluc3RhbGxlZE92ZXJyaWRlPzogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBpbnN0YWxsZWQgPSBpbnN0YWxsZWRPdmVycmlkZSA/PyBlbnRyeS5pbnN0YWxsZWQ/LnZlcnNpb24gPz8gbnVsbDtcbiAgY29uc3QgbGF0ZXN0ID0gZW50cnkubWFuaWZlc3QudmVyc2lvbjtcbiAgY29uc3QgaGFzVXBkYXRlID0gISFpbnN0YWxsZWQgJiYgaW5zdGFsbGVkICE9PSBsYXRlc3Q7XG4gIGNvbnN0IGJhZGdlID0gc3RvcmVWZXJzaW9uQmFkZ2VTaGVsbChoYXNVcGRhdGUpO1xuICBjb25zdCBsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBsYWJlbC5jbGFzc05hbWUgPSBcInRydW5jYXRlXCI7XG4gIGxhYmVsLnRleHRDb250ZW50ID0gaW5zdGFsbGVkXG4gICAgPyBgSW5zdGFsbGVkIHYke2luc3RhbGxlZH0gXHUwMEI3IExhdGVzdCB2JHtsYXRlc3R9YFxuICAgIDogYExhdGVzdCB2JHtsYXRlc3R9YDtcbiAgYmFkZ2UudGl0bGUgPSBpbnN0YWxsZWRcbiAgICA/IGBJbnN0YWxsZWQgdmVyc2lvbiAke2luc3RhbGxlZH0uIExhdGVzdCBhcHByb3ZlZCB2ZXJzaW9uICR7bGF0ZXN0fS5gXG4gICAgOiBgTGF0ZXN0IGFwcHJvdmVkIHZlcnNpb24gJHtsYXRlc3R9LmA7XG4gIGJhZGdlLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiBzdG9yZVZlcnNpb25CYWRnZVNoZWxsKGhhc1VwZGF0ZTogYm9vbGVhbik6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgYmFkZ2UuY2xhc3NOYW1lID0gW1xuICAgIFwiaW5saW5lLWZsZXggaC04IG1pbi13LTAgbWF4LXctZnVsbCBpdGVtcy1jZW50ZXIgcm91bmRlZC1sZyBib3JkZXIgcHgtMi41IHRleHQteHMgZm9udC1tZWRpdW1cIixcbiAgICBoYXNVcGRhdGVcbiAgICAgID8gXCJib3JkZXItYmx1ZS01MDAvMzAgYmctYmx1ZS01MDAvMTAgdGV4dC10b2tlbi1mb3JlZ3JvdW5kXCJcbiAgICAgIDogXCJib3JkZXItdG9rZW4tYm9yZGVyLzQwIGJnLXRva2VuLWZvcmVncm91bmQvNSB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmRcIixcbiAgXS5qb2luKFwiIFwiKTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiBzdG9yZVN0YXR1c1BpbGwobGFiZWw6IHN0cmluZywgdG9uZTogXCJuZXV0cmFsXCIgfCBcImluZm9cIiA9IFwibmV1dHJhbFwiKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBwaWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHBpbGwuY2xhc3NOYW1lID0gW1xuICAgIFwiaW5saW5lLWZsZXggaC04IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB3aGl0ZXNwYWNlLW5vd3JhcCByb3VuZGVkLWxnIHB4LTMgdGV4dC1zbSBmb250LW1lZGl1bVwiLFxuICAgIHRvbmUgPT09IFwiaW5mb1wiXG4gICAgICA/IFwiYm9yZGVyIGJvcmRlci1ibHVlLTUwMC8zMCBiZy1ibHVlLTUwMC8xMCB0ZXh0LXRva2VuLWZvcmVncm91bmRcIlxuICAgICAgOiBcImJnLXRva2VuLWZvcmVncm91bmQvNSB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmRcIixcbiAgXS5qb2luKFwiIFwiKTtcbiAgcGlsbC50ZXh0Q29udGVudCA9IGxhYmVsO1xuICByZXR1cm4gcGlsbDtcbn1cblxuZnVuY3Rpb24gc3RvcmVJbnN0YWxsQnV0dG9uKGxhYmVsOiBzdHJpbmcsIG9uQ2xpY2s6IChidXR0b246IEhUTUxCdXR0b25FbGVtZW50KSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5jbGFzc05hbWUgPVxuICAgIHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKCk7XG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljayhidG4pO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gc3RvcmVJbnN0YWxsQnV0dG9uQ2xhc3MoZXh0cmEgPSBcIlwiKTogc3RyaW5nIHtcbiAgcmV0dXJuIFtcbiAgICBcImJvcmRlci10b2tlbi1ib3JkZXIgdXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBmbGV4IGgtOCBtaW4tdy1bODJweF0gaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjUgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLWJsdWUtNTAwLzQwIGJnLWJsdWUtNTAwIHB4LTMgcHktMCB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tZm9yZWdyb3VuZCBzaGFkb3ctc20gdHJhbnNpdGlvbi1jb2xvcnMgZW5hYmxlZDpob3ZlcjpiZy1ibHVlLTYwMCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS04MFwiLFxuICAgIGV4dHJhLFxuICBdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gc2hvd1N0b3JlQnV0dG9uTG9hZGluZyhidXR0b246IEhUTUxCdXR0b25FbGVtZW50LCBsYWJlbDogc3RyaW5nKTogdm9pZCB7XG4gIGJ1dHRvbi5jbGFzc05hbWUgPSBzdG9yZUluc3RhbGxCdXR0b25DbGFzcygpO1xuICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICBidXR0b24uc2V0QXR0cmlidXRlKFwiYXJpYS1idXN5XCIsIFwidHJ1ZVwiKTtcbiAgYnV0dG9uLnJlcGxhY2VDaGlsZHJlbigpO1xuICBhcHBlbmRTdmdIdG1sKFxuICAgIGJ1dHRvbixcbiAgICBgPHN2ZyBjbGFzcz1cImFuaW1hdGUtc3BpblwiIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwibm9uZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8Y2lyY2xlIGN4PVwiOFwiIGN5PVwiOFwiIHI9XCI1LjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgb3BhY2l0eT1cIi4yNVwiLz5gICtcbiAgICBgPHBhdGggZD1cIk0xMy41IDhBNS41IDUuNSAwIDAgMCA4IDIuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xuICAgIGA8L3N2Zz5gLFxuICApO1xuICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHRleHQudGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgYnV0dG9uLmFwcGVuZENoaWxkKHRleHQpO1xufVxuXG5mdW5jdGlvbiBzaG93U3RvcmVCdXR0b25JbnN0YWxsZWQoYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCk6IHZvaWQge1xuICBidXR0b24uY2xhc3NOYW1lID0gc3RvcmVJbnN0YWxsQnV0dG9uQ2xhc3MoXCJib3JkZXItYmx1ZS01MDAgYmctYmx1ZS01MDBcIik7XG4gIGJ1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XG4gIGJ1dHRvbi5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgYXBwZW5kU3ZnSHRtbChcbiAgICBidXR0b24sXG4gICAgYDxzdmcgd2lkdGg9XCIxNFwiIGhlaWdodD1cIjE0XCIgdmlld0JveD1cIjAgMCAxNiAxNlwiIGZpbGw9XCJub25lXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXG4gICAgYDxwYXRoIGQ9XCJNMy43NSA4LjE1IDYuNjUgMTEgMTIuMjUgNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuOFwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YCxcbiAgKTtcbiAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICB0ZXh0LnRleHRDb250ZW50ID0gXCJJbnN0YWxsZWRcIjtcbiAgYnV0dG9uLmFwcGVuZENoaWxkKHRleHQpO1xufVxuXG5mdW5jdGlvbiByZXNldFN0b3JlSW5zdGFsbEJ1dHRvbihidXR0b246IEhUTUxCdXR0b25FbGVtZW50LCBsYWJlbDogc3RyaW5nKTogdm9pZCB7XG4gIGJ1dHRvbi5jbGFzc05hbWUgPSBzdG9yZUluc3RhbGxCdXR0b25DbGFzcygpO1xuICBidXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgYnV0dG9uLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtYnVzeVwiKTtcbiAgYnV0dG9uLnRleHRDb250ZW50ID0gbGFiZWw7XG59XG5cbmZ1bmN0aW9uIHNob3dTdG9yZVRvYXN0KG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICBsZXQgaG9zdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1zdG9yZS10b2FzdC1ob3N0XVwiKTtcbiAgaWYgKCFob3N0KSB7XG4gICAgaG9zdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgaG9zdC5kYXRhc2V0LmNvZGV4cHBTdG9yZVRvYXN0SG9zdCA9IFwidHJ1ZVwiO1xuICAgIGhvc3QuY2xhc3NOYW1lID0gXCJwb2ludGVyLWV2ZW50cy1ub25lIGZpeGVkIGJvdHRvbS01IHJpZ2h0LTUgei1bOTk5OV0gZmxleCBmbGV4LWNvbCBpdGVtcy1lbmQgZ2FwLTJcIjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGhvc3QpO1xuICB9XG4gIGNvbnN0IHRvYXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdG9hc3QuY2xhc3NOYW1lID1cbiAgICBcInRyYW5zbGF0ZS15LTIgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlci81MCBiZy10b2tlbi1tYWluLXN1cmZhY2UtcHJpbWFyeSBweC0zIHB5LTIgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLWZvcmVncm91bmQgb3BhY2l0eS0wIHNoYWRvdy1sZyB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0yMDBcIjtcbiAgdG9hc3QudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuICBob3N0LmFwcGVuZENoaWxkKHRvYXN0KTtcbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICB0b2FzdC5jbGFzc0xpc3QucmVtb3ZlKFwidHJhbnNsYXRlLXktMlwiLCBcIm9wYWNpdHktMFwiKTtcbiAgfSk7XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHRvYXN0LmNsYXNzTGlzdC5hZGQoXCJ0cmFuc2xhdGUteS0yXCIsIFwib3BhY2l0eS0wXCIpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdG9hc3QucmVtb3ZlKCk7XG4gICAgICBpZiAoaG9zdCAmJiBob3N0LmNoaWxkRWxlbWVudENvdW50ID09PSAwKSBob3N0LnJlbW92ZSgpO1xuICAgIH0sIDIyMCk7XG4gIH0sIDI2MDApO1xufVxuXG5mdW5jdGlvbiBzdG9yZU1lc3NhZ2VDYXJkKHRpdGxlOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY2FyZC5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlci80MCBmbGV4IG1pbi1oLVs4NHB4XSBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlciBnYXAtMSByb3VuZGVkLTJ4bCBib3JkZXIgcC00IHRleHQtc21cIjtcbiAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHQuY2xhc3NOYW1lID0gXCJmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0LnRleHRDb250ZW50ID0gdGl0bGU7XG4gIGNhcmQuYXBwZW5kQ2hpbGQodCk7XG4gIGlmIChkZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGQuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gICAgZC50ZXh0Q29udGVudCA9IGRlc2NyaXB0aW9uO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoZCk7XG4gIH1cbiAgcmV0dXJuIGNhcmQ7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclR3ZWFrc1BhZ2Uoc2VjdGlvbnNXcmFwOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBvcGVuQnRuID0gb3BlbkluUGxhY2VCdXR0b24oXCJPcGVuIFR3ZWFrcyBGb2xkZXJcIiwgKCkgPT4ge1xuICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpyZXZlYWxcIiwgdHdlYWtzUGF0aCgpKTtcbiAgfSk7XG4gIGNvbnN0IHJlbG9hZEJ0biA9IG9wZW5JblBsYWNlQnV0dG9uKFwiRm9yY2UgUmVsb2FkXCIsICgpID0+IHtcbiAgICAvLyBGdWxsIHBhZ2UgcmVmcmVzaCBcdTIwMTQgc2FtZSBhcyBEZXZUb29scyBDbWQtUiAvIG91ciBDRFAgUGFnZS5yZWxvYWQuXG4gICAgLy8gTWFpbiByZS1kaXNjb3ZlcnMgdHdlYWtzIGZpcnN0IHNvIHRoZSBuZXcgcmVuZGVyZXIgY29tZXMgdXAgd2l0aCBhXG4gICAgLy8gZnJlc2ggdHdlYWsgc2V0OyB0aGVuIGxvY2F0aW9uLnJlbG9hZCByZXN0YXJ0cyB0aGUgcmVuZGVyZXIgc28gdGhlXG4gICAgLy8gcHJlbG9hZCByZS1pbml0aWFsaXplcyBhZ2FpbnN0IGl0LlxuICAgIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAgIC5pbnZva2UoXCJjb2RleHBwOnJlbG9hZC10d2Vha3NcIilcbiAgICAgIC5jYXRjaCgoZSkgPT4gcGxvZyhcImZvcmNlIHJlbG9hZCAobWFpbikgZmFpbGVkXCIsIFN0cmluZyhlKSkpXG4gICAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgfSk7XG4gIH0pO1xuICAvLyBEcm9wIHRoZSBkaWFnb25hbC1hcnJvdyBpY29uIGZyb20gdGhlIHJlbG9hZCBidXR0b24gXHUyMDE0IGl0IGltcGxpZXMgXCJvcGVuXG4gIC8vIG91dCBvZiBhcHBcIiB3aGljaCBkb2Vzbid0IGZpdC4gUmVwbGFjZSBpdHMgdHJhaWxpbmcgc3ZnIHdpdGggYSByZWZyZXNoLlxuICBjb25zdCByZWxvYWRTdmcgPSByZWxvYWRCdG4ucXVlcnlTZWxlY3RvcihcInN2Z1wiKTtcbiAgaWYgKHJlbG9hZFN2Zykge1xuICAgIGNvbnN0IGljb24gPSBzdmdFbGVtZW50KFxuICAgICAgYDxzdmcgd2lkdGg9XCIyMFwiIGhlaWdodD1cIjIwXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGNsYXNzPVwiaWNvbi0yeHNcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICAgIGA8cGF0aCBkPVwiTTQgMTBhNiA2IDAgMCAxIDEwLjI0LTQuMjRMMTYgNy41TTE2IDR2My41aC0zLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgICBgPHBhdGggZD1cIk0xNiAxMGE2IDYgMCAwIDEtMTAuMjQgNC4yNEw0IDEyLjVNNCAxNnYtMy41aDMuNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICAgIGA8L3N2Zz5gLFxuICAgICk7XG4gICAgaWYgKGljb24pIHJlbG9hZFN2Zy5yZXBsYWNlV2l0aChpY29uKTtcbiAgfVxuXG4gIGNvbnN0IHRyYWlsaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdHJhaWxpbmcuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICB0cmFpbGluZy5hcHBlbmRDaGlsZChyZWxvYWRCdG4pO1xuICB0cmFpbGluZy5hcHBlbmRDaGlsZChvcGVuQnRuKTtcblxuICBpZiAoc3RhdGUubGlzdGVkVHdlYWtzLmxlbmd0aCA9PT0gMCkge1xuICAgIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgICBzZWN0aW9uLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICAgIHNlY3Rpb24uYXBwZW5kQ2hpbGQoc2VjdGlvblRpdGxlKFwiSW5zdGFsbGVkIFR3ZWFrc1wiLCB0cmFpbGluZykpO1xuICAgIGNvbnN0IGNhcmQgPSByb3VuZGVkQ2FyZCgpO1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoXG4gICAgICByb3dTaW1wbGUoXG4gICAgICAgIFwiTm8gdHdlYWtzIGluc3RhbGxlZFwiLFxuICAgICAgICBgRHJvcCBhIHR3ZWFrIGZvbGRlciBpbnRvICR7dHdlYWtzUGF0aCgpfSBhbmQgcmVsb2FkLmAsXG4gICAgICApLFxuICAgICk7XG4gICAgc2VjdGlvbi5hcHBlbmRDaGlsZChjYXJkKTtcbiAgICBzZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQoc2VjdGlvbik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gR3JvdXAgcmVnaXN0ZXJlZCBTZXR0aW5nc1NlY3Rpb25zIGJ5IHR3ZWFrIGlkIChwcmVmaXggc3BsaXQgYXQgXCI6XCIpLlxuICBjb25zdCBzZWN0aW9uc0J5VHdlYWsgPSBuZXcgTWFwPHN0cmluZywgU2V0dGluZ3NTZWN0aW9uW10+KCk7XG4gIGZvciAoY29uc3QgcyBvZiBzdGF0ZS5zZWN0aW9ucy52YWx1ZXMoKSkge1xuICAgIGNvbnN0IHR3ZWFrSWQgPSBzLmlkLnNwbGl0KFwiOlwiKVswXTtcbiAgICBpZiAoIXNlY3Rpb25zQnlUd2Vhay5oYXModHdlYWtJZCkpIHNlY3Rpb25zQnlUd2Vhay5zZXQodHdlYWtJZCwgW10pO1xuICAgIHNlY3Rpb25zQnlUd2Vhay5nZXQodHdlYWtJZCkhLnB1c2gocyk7XG4gIH1cblxuICBjb25zdCBwYWdlc0J5VHdlYWsgPSBuZXcgTWFwPHN0cmluZywgUmVnaXN0ZXJlZFBhZ2VbXT4oKTtcbiAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSB7XG4gICAgaWYgKCFwYWdlc0J5VHdlYWsuaGFzKHAudHdlYWtJZCkpIHBhZ2VzQnlUd2Vhay5zZXQocC50d2Vha0lkLCBbXSk7XG4gICAgcGFnZXNCeVR3ZWFrLmdldChwLnR3ZWFrSWQpIS5wdXNoKHApO1xuICB9XG5cbiAgY29uc3Qgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpO1xuICB3cmFwLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICB3cmFwLmFwcGVuZENoaWxkKHNlY3Rpb25UaXRsZShcIkluc3RhbGxlZCBUd2Vha3NcIiwgdHJhaWxpbmcpKTtcblxuICBjb25zdCBjYXJkID0gcm91bmRlZENhcmQoKTtcbiAgZm9yIChjb25zdCB0IG9mIHN0YXRlLmxpc3RlZFR3ZWFrcykge1xuICAgIGNhcmQuYXBwZW5kQ2hpbGQoXG4gICAgICB0d2Vha1JvdyhcbiAgICAgICAgdCxcbiAgICAgICAgc2VjdGlvbnNCeVR3ZWFrLmdldCh0Lm1hbmlmZXN0LmlkKSA/PyBbXSxcbiAgICAgICAgcGFnZXNCeVR3ZWFrLmdldCh0Lm1hbmlmZXN0LmlkKSA/PyBbXSxcbiAgICAgICksXG4gICAgKTtcbiAgfVxuICB3cmFwLmFwcGVuZENoaWxkKGNhcmQpO1xuICBzZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQod3JhcCk7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrUm93KFxuICB0OiBMaXN0ZWRUd2VhayxcbiAgc2VjdGlvbnM6IFNldHRpbmdzU2VjdGlvbltdLFxuICBwYWdlczogUmVnaXN0ZXJlZFBhZ2VbXSxcbik6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgbSA9IHQubWFuaWZlc3Q7XG5cbiAgLy8gT3V0ZXIgY2VsbCB3cmFwcyB0aGUgaGVhZGVyIHJvdyArIChvcHRpb25hbCkgbmVzdGVkIHNlY3Rpb25zIHNvIHRoZVxuICAvLyBwYXJlbnQgY2FyZCdzIGRpdmlkZXIgc3RheXMgYmV0d2VlbiAqdHdlYWtzKiwgbm90IGJldHdlZW4gaGVhZGVyIGFuZFxuICAvLyBib2R5IG9mIHRoZSBzYW1lIHR3ZWFrLlxuICBjb25zdCBjZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY2VsbC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2xcIjtcbiAgaWYgKCF0LmVuYWJsZWQpIGNlbGwuc3R5bGUub3BhY2l0eSA9IFwiMC43XCI7XG5cbiAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyLmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1zdGFydCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgcC0zXCI7XG5cbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGl0ZW1zLXN0YXJ0IGdhcC0zXCI7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIEF2YXRhciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3QgYXZhdGFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYXZhdGFyLmNsYXNzTmFtZSA9XG4gICAgXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIG92ZXJmbG93LWhpZGRlbiB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIGF2YXRhci5zdHlsZS53aWR0aCA9IFwiNTZweFwiO1xuICBhdmF0YXIuc3R5bGUuaGVpZ2h0ID0gXCI1NnB4XCI7XG4gIGF2YXRhci5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcInZhcigtLWNvbG9yLXRva2VuLWJnLWZvZywgdHJhbnNwYXJlbnQpXCI7XG4gIGlmIChtLmljb25VcmwpIHtcbiAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgIGltZy5hbHQgPSBcIlwiO1xuICAgIGltZy5jbGFzc05hbWUgPSBcInNpemUtZnVsbCBvYmplY3QtY29udGFpblwiO1xuICAgIC8vIEluaXRpYWw6IHNob3cgZmFsbGJhY2sgaW5pdGlhbCBpbiBjYXNlIHRoZSBpY29uIGZhaWxzIHRvIGxvYWQuXG4gICAgY29uc3QgaW5pdGlhbCA9IChtLm5hbWU/LlswXSA/PyBcIj9cIikudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdCBmYWxsYmFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIGZhbGxiYWNrLmNsYXNzTmFtZSA9IFwidGV4dC14bCBmb250LW1lZGl1bVwiO1xuICAgIGZhbGxiYWNrLnRleHRDb250ZW50ID0gaW5pdGlhbDtcbiAgICBhdmF0YXIuYXBwZW5kQ2hpbGQoZmFsbGJhY2spO1xuICAgIGltZy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcbiAgICAgIGZhbGxiYWNrLnJlbW92ZSgpO1xuICAgICAgaW1nLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgIH0pO1xuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKCkgPT4ge1xuICAgICAgaW1nLnJlbW92ZSgpO1xuICAgIH0pO1xuICAgIHZvaWQgcmVzb2x2ZUljb25VcmwobS5pY29uVXJsLCB0LmRpcikudGhlbigodXJsKSA9PiB7XG4gICAgICBpZiAodXJsKSBpbWcuc3JjID0gdXJsO1xuICAgICAgZWxzZSBpbWcucmVtb3ZlKCk7XG4gICAgfSk7XG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKGltZyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaW5pdGlhbCA9IChtLm5hbWU/LlswXSA/PyBcIj9cIikudG9VcHBlckNhc2UoKTtcbiAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgc3Bhbi5jbGFzc05hbWUgPSBcInRleHQteGwgZm9udC1tZWRpdW1cIjtcbiAgICBzcGFuLnRleHRDb250ZW50ID0gaW5pdGlhbDtcbiAgICBhdmF0YXIuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cbiAgbGVmdC5hcHBlbmRDaGlsZChhdmF0YXIpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUZXh0IHN0YWNrIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBzdGFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHN0YWNrLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0wLjVcIjtcblxuICBjb25zdCB0aXRsZVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlUm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgY29uc3QgbmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG5hbWUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgbmFtZS50ZXh0Q29udGVudCA9IG0ubmFtZTtcbiAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQobmFtZSk7XG4gIGlmIChtLnZlcnNpb24pIHtcbiAgICBjb25zdCB2ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICB2ZXIuY2xhc3NOYW1lID1cbiAgICAgIFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSB0ZXh0LXhzIGZvbnQtbm9ybWFsIHRhYnVsYXItbnVtc1wiO1xuICAgIHZlci50ZXh0Q29udGVudCA9IGB2JHttLnZlcnNpb259YDtcbiAgICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh2ZXIpO1xuICB9XG4gIGlmICh0LnVwZGF0ZT8udXBkYXRlQXZhaWxhYmxlKSB7XG4gICAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICBiYWRnZS5jbGFzc05hbWUgPVxuICAgICAgXCJyb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tZm9yZWdyb3VuZC81IHB4LTIgcHktMC41IHRleHQtWzExcHhdIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gICAgYmFkZ2UudGV4dENvbnRlbnQgPSBcIlVwZGF0ZSBBdmFpbGFibGVcIjtcbiAgICB0aXRsZVJvdy5hcHBlbmRDaGlsZChiYWRnZSk7XG4gIH1cbiAgc3RhY2suYXBwZW5kQ2hpbGQodGl0bGVSb3cpO1xuXG4gIGlmIChtLmRlc2NyaXB0aW9uKSB7XG4gICAgY29uc3QgZGVzYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZGVzYy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XG4gICAgZGVzYy50ZXh0Q29udGVudCA9IG0uZGVzY3JpcHRpb247XG4gICAgc3RhY2suYXBwZW5kQ2hpbGQoZGVzYyk7XG4gIH1cblxuICBjb25zdCBtZXRhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbWV0YS5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBjb25zdCBhdXRob3JFbCA9IHJlbmRlckF1dGhvcihtLmF1dGhvcik7XG4gIGlmIChhdXRob3JFbCkgbWV0YS5hcHBlbmRDaGlsZChhdXRob3JFbCk7XG4gIGlmIChtLmdpdGh1YlJlcG8pIHtcbiAgICBpZiAobWV0YS5jaGlsZHJlbi5sZW5ndGggPiAwKSBtZXRhLmFwcGVuZENoaWxkKGRvdCgpKTtcbiAgICBjb25zdCByZXBvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICByZXBvLnR5cGUgPSBcImJ1dHRvblwiO1xuICAgIHJlcG8uY2xhc3NOYW1lID0gXCJpbmxpbmUtZmxleCB0ZXh0LXRva2VuLXRleHQtbGluay1mb3JlZ3JvdW5kIGhvdmVyOnVuZGVybGluZVwiO1xuICAgIHJlcG8udGV4dENvbnRlbnQgPSBtLmdpdGh1YlJlcG87XG4gICAgcmVwby5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCBgaHR0cHM6Ly9naXRodWIuY29tLyR7bS5naXRodWJSZXBvfWApO1xuICAgIH0pO1xuICAgIG1ldGEuYXBwZW5kQ2hpbGQocmVwbyk7XG4gIH1cbiAgaWYgKG0uaG9tZXBhZ2UpIHtcbiAgICBpZiAobWV0YS5jaGlsZHJlbi5sZW5ndGggPiAwKSBtZXRhLmFwcGVuZENoaWxkKGRvdCgpKTtcbiAgICBjb25zdCBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgbGluay5ocmVmID0gbS5ob21lcGFnZTtcbiAgICBsaW5rLnRhcmdldCA9IFwiX2JsYW5rXCI7XG4gICAgbGluay5yZWwgPSBcIm5vcmVmZXJyZXJcIjtcbiAgICBsaW5rLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggdGV4dC10b2tlbi10ZXh0LWxpbmstZm9yZWdyb3VuZCBob3Zlcjp1bmRlcmxpbmVcIjtcbiAgICBsaW5rLnRleHRDb250ZW50ID0gXCJIb21lcGFnZVwiO1xuICAgIG1ldGEuYXBwZW5kQ2hpbGQobGluayk7XG4gIH1cbiAgaWYgKG1ldGEuY2hpbGRyZW4ubGVuZ3RoID4gMCkgc3RhY2suYXBwZW5kQ2hpbGQobWV0YSk7XG5cbiAgLy8gVGFncyByb3cgKGlmIGFueSkgXHUyMDE0IHNtYWxsIHBpbGwgY2hpcHMgYmVsb3cgdGhlIG1ldGEgbGluZS5cbiAgaWYgKG0udGFncyAmJiBtLnRhZ3MubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IHRhZ3NSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRhZ3NSb3cuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTEgcHQtMC41XCI7XG4gICAgZm9yIChjb25zdCB0YWcgb2YgbS50YWdzKSB7XG4gICAgICBjb25zdCBwaWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBwaWxsLmNsYXNzTmFtZSA9XG4gICAgICAgIFwicm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLWZvcmVncm91bmQvNSBweC0yIHB5LTAuNSB0ZXh0LVsxMXB4XSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gICAgICBwaWxsLnRleHRDb250ZW50ID0gdGFnO1xuICAgICAgdGFnc1Jvdy5hcHBlbmRDaGlsZChwaWxsKTtcbiAgICB9XG4gICAgc3RhY2suYXBwZW5kQ2hpbGQodGFnc1Jvdyk7XG4gIH1cblxuICBsZWZ0LmFwcGVuZENoaWxkKHN0YWNrKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKGxlZnQpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBUb2dnbGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IHJpZ2h0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcmlnaHQuY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMiBwdC0wLjVcIjtcbiAgaWYgKHQuZW5hYmxlZCAmJiBwYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgY29uZmlndXJlQnRuID0gY29tcGFjdEJ1dHRvbihcIkNvbmZpZ3VyZVwiLCAoKSA9PiB7XG4gICAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcInJlZ2lzdGVyZWRcIiwgaWQ6IHBhZ2VzWzBdIS5pZCB9KTtcbiAgICB9KTtcbiAgICBjb25maWd1cmVCdG4udGl0bGUgPSBwYWdlcy5sZW5ndGggPT09IDFcbiAgICAgID8gYE9wZW4gJHtwYWdlc1swXSEucGFnZS50aXRsZX1gXG4gICAgICA6IGBPcGVuICR7cGFnZXMubWFwKChwKSA9PiBwLnBhZ2UudGl0bGUpLmpvaW4oXCIsIFwiKX1gO1xuICAgIHJpZ2h0LmFwcGVuZENoaWxkKGNvbmZpZ3VyZUJ0bik7XG4gIH1cbiAgaWYgKHQudXBkYXRlPy51cGRhdGVBdmFpbGFibGUgJiYgdC51cGRhdGUucmVsZWFzZVVybCkge1xuICAgIHJpZ2h0LmFwcGVuZENoaWxkKFxuICAgICAgY29tcGFjdEJ1dHRvbihcIlJldmlldyBSZWxlYXNlXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgdC51cGRhdGUhLnJlbGVhc2VVcmwpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuICByaWdodC5hcHBlbmRDaGlsZChcbiAgICBzd2l0Y2hDb250cm9sKHQuZW5hYmxlZCwgYXN5bmMgKG5leHQpID0+IHtcbiAgICAgIGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6c2V0LXR3ZWFrLWVuYWJsZWRcIiwgbS5pZCwgbmV4dCk7XG4gICAgICAvLyBUaGUgbWFpbiBwcm9jZXNzIGJyb2FkY2FzdHMgYSByZWxvYWQgd2hpY2ggd2lsbCByZS1mZXRjaCB0aGUgbGlzdFxuICAgICAgLy8gYW5kIHJlLXJlbmRlci4gV2UgZG9uJ3Qgb3B0aW1pc3RpY2FsbHkgdG9nZ2xlIHRvIGF2b2lkIGRyaWZ0LlxuICAgIH0pLFxuICApO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQocmlnaHQpO1xuXG4gIGNlbGwuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuICAvLyBJZiB0aGUgdHdlYWsgaXMgZW5hYmxlZCBhbmQgcmVnaXN0ZXJlZCBzZXR0aW5ncyBzZWN0aW9ucywgcmVuZGVyIHRob3NlXG4gIC8vIGJvZGllcyBhcyBuZXN0ZWQgcm93cyBiZW5lYXRoIHRoZSBoZWFkZXIgaW5zaWRlIHRoZSBzYW1lIGNlbGwuXG4gIGlmICh0LmVuYWJsZWQgJiYgc2VjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IG5lc3RlZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgbmVzdGVkLmNsYXNzTmFtZSA9XG4gICAgICBcImZsZXggZmxleC1jb2wgZGl2aWRlLXktWzAuNXB4XSBkaXZpZGUtdG9rZW4tYm9yZGVyIGJvcmRlci10LVswLjVweF0gYm9yZGVyLXRva2VuLWJvcmRlclwiO1xuICAgIGZvciAoY29uc3QgcyBvZiBzZWN0aW9ucykge1xuICAgICAgY29uc3QgYm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBib2R5LmNsYXNzTmFtZSA9IFwicC0zXCI7XG4gICAgICB0cnkge1xuICAgICAgICBzLnJlbmRlcihib2R5KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYm9keS50ZXh0Q29udGVudCA9IGBFcnJvciByZW5kZXJpbmcgdHdlYWsgc2VjdGlvbjogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gO1xuICAgICAgfVxuICAgICAgbmVzdGVkLmFwcGVuZENoaWxkKGJvZHkpO1xuICAgIH1cbiAgICBjZWxsLmFwcGVuZENoaWxkKG5lc3RlZCk7XG4gIH1cblxuICByZXR1cm4gY2VsbDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQXV0aG9yKGF1dGhvcjogVHdlYWtNYW5pZmVzdFtcImF1dGhvclwiXSk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGlmICghYXV0aG9yKSByZXR1cm4gbnVsbDtcbiAgY29uc3Qgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICB3cmFwLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggaXRlbXMtY2VudGVyIGdhcC0xXCI7XG4gIGlmICh0eXBlb2YgYXV0aG9yID09PSBcInN0cmluZ1wiKSB7XG4gICAgd3JhcC50ZXh0Q29udGVudCA9IGBieSAke2F1dGhvcn1gO1xuICAgIHJldHVybiB3cmFwO1xuICB9XG4gIHdyYXAuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJieSBcIikpO1xuICBpZiAoYXV0aG9yLnVybCkge1xuICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICBhLmhyZWYgPSBhdXRob3IudXJsO1xuICAgIGEudGFyZ2V0ID0gXCJfYmxhbmtcIjtcbiAgICBhLnJlbCA9IFwibm9yZWZlcnJlclwiO1xuICAgIGEuY2xhc3NOYW1lID0gXCJpbmxpbmUtZmxleCB0ZXh0LXRva2VuLXRleHQtbGluay1mb3JlZ3JvdW5kIGhvdmVyOnVuZGVybGluZVwiO1xuICAgIGEudGV4dENvbnRlbnQgPSBhdXRob3IubmFtZTtcbiAgICB3cmFwLmFwcGVuZENoaWxkKGEpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICBzcGFuLnRleHRDb250ZW50ID0gYXV0aG9yLm5hbWU7XG4gICAgd3JhcC5hcHBlbmRDaGlsZChzcGFuKTtcbiAgfVxuICByZXR1cm4gd3JhcDtcbn1cblxuZnVuY3Rpb24gb3BlblB1Ymxpc2hUd2Vha0RpYWxvZygpOiB2b2lkIHtcbiAgY29uc3QgZXhpc3RpbmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtcHVibGlzaC1kaWFsb2ddXCIpO1xuICBleGlzdGluZz8ucmVtb3ZlKCk7XG5cbiAgY29uc3Qgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG92ZXJsYXkuZGF0YXNldC5jb2RleHBwUHVibGlzaERpYWxvZyA9IFwidHJ1ZVwiO1xuICBvdmVybGF5LmNsYXNzTmFtZSA9IFwiZml4ZWQgaW5zZXQtMCB6LVs5OTk5XSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFjay80MCBwLTRcIjtcblxuICBjb25zdCBkaWFsb2cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkaWFsb2cuY2xhc3NOYW1lID1cbiAgICBcImZsZXggdy1mdWxsIG1heC13LXhsIGZsZXgtY29sIGdhcC00IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tbWFpbi1zdXJmYWNlLXByaW1hcnkgcC00IHNoYWRvdy14bFwiO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKGRpYWxvZyk7XG5cbiAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyLmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1zdGFydCBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIjtcbiAgY29uc3QgdGl0bGVTdGFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlU3RhY2suY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcInRleHQtYmFzZSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IFwiUHVibGlzaCBUd2Vha1wiO1xuICBjb25zdCBzdWJ0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHN1YnRpdGxlLmNsYXNzTmFtZSA9IFwidGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIHN1YnRpdGxlLnRleHRDb250ZW50ID0gXCJTdWJtaXQgYSBHaXRIdWIgcmVwbyBmb3IgYWRtaW4gcmV2aWV3LiBDb2RleCsrIHJlY29yZHMgdGhlIGV4YWN0IGNvbW1pdCBhZG1pbnMgbXVzdCByZXZpZXcgYW5kIHBpbi5cIjtcbiAgdGl0bGVTdGFjay5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIHRpdGxlU3RhY2suYXBwZW5kQ2hpbGQoc3VidGl0bGUpO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQodGl0bGVTdGFjayk7XG4gIGhlYWRlci5hcHBlbmRDaGlsZChjb21wYWN0QnV0dG9uKFwiRGlzbWlzc1wiLCAoKSA9PiBvdmVybGF5LnJlbW92ZSgpKSk7XG4gIGRpYWxvZy5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gIGNvbnN0IHJlcG9JbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbnB1dFwiKTtcbiAgcmVwb0lucHV0LnR5cGUgPSBcInRleHRcIjtcbiAgcmVwb0lucHV0LnBsYWNlaG9sZGVyID0gXCJvd25lci9yZXBvIG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9vd25lci9yZXBvXCI7XG4gIHJlcG9JbnB1dC5jbGFzc05hbWUgPVxuICAgIFwiaC0xMCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRyYW5zcGFyZW50IHB4LTMgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeSBmb2N1czpvdXRsaW5lLW5vbmVcIjtcbiAgZGlhbG9nLmFwcGVuZENoaWxkKHJlcG9JbnB1dCk7XG5cbiAgY29uc3Qgc3RhdHVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc3RhdHVzLmNsYXNzTmFtZSA9IFwibWluLWgtNSB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgc3RhdHVzLnRleHRDb250ZW50ID0gXCJUaGUgbWFuaWZlc3Qgc2hvdWxkIGluY2x1ZGUgYW4gaWNvblVybCBzdWl0YWJsZSBmb3IgdGhlIHN0b3JlLlwiO1xuICBkaWFsb2cuYXBwZW5kQ2hpbGQoc3RhdHVzKTtcblxuICBjb25zdCBhY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYWN0aW9ucy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktZW5kIGdhcC0yXCI7XG4gIGNvbnN0IHN1Ym1pdCA9IGNvbXBhY3RCdXR0b24oXCJPcGVuIFJldmlldyBJc3N1ZVwiLCAoKSA9PiB7XG4gICAgdm9pZCBzdWJtaXRQdWJsaXNoVHdlYWsocmVwb0lucHV0LCBzdGF0dXMpO1xuICB9KTtcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdWJtaXQpO1xuICBkaWFsb2cuYXBwZW5kQ2hpbGQoYWN0aW9ucyk7XG5cbiAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBpZiAoZS50YXJnZXQgPT09IG92ZXJsYXkpIG92ZXJsYXkucmVtb3ZlKCk7XG4gIH0pO1xuICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICByZXBvSW5wdXQuZm9jdXMoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3VibWl0UHVibGlzaFR3ZWFrKFxuICByZXBvSW5wdXQ6IEhUTUxJbnB1dEVsZW1lbnQsXG4gIHN0YXR1czogSFRNTEVsZW1lbnQsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgc3RhdHVzLmNsYXNzTmFtZSA9IFwibWluLWgtNSB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgc3RhdHVzLnRleHRDb250ZW50ID0gXCJSZXNvbHZpbmcgdGhlIHJlcG8gY29tbWl0IHRvIHJldmlldy5cIjtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdWJtaXNzaW9uID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgXCJjb2RleHBwOnByZXBhcmUtdHdlYWstc3RvcmUtc3VibWlzc2lvblwiLFxuICAgICAgcmVwb0lucHV0LnZhbHVlLFxuICAgICkgYXMgVHdlYWtTdG9yZVB1Ymxpc2hTdWJtaXNzaW9uO1xuICAgIGNvbnN0IHVybCA9IGJ1aWxkVHdlYWtQdWJsaXNoSXNzdWVVcmwoc3VibWlzc2lvbik7XG4gICAgYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIHVybCk7XG4gICAgc3RhdHVzLnRleHRDb250ZW50ID0gYEdpdEh1YiByZXZpZXcgaXNzdWUgb3BlbmVkIGZvciAke3N1Ym1pc3Npb24uY29tbWl0U2hhLnNsaWNlKDAsIDcpfS5gO1xuICB9IGNhdGNoIChlKSB7XG4gICAgc3RhdHVzLmNsYXNzTmFtZSA9IFwibWluLWgtNSB0ZXh0LXNtIHRleHQtdG9rZW4tY2hhcnRzLXJlZFwiO1xuICAgIHN0YXR1cy50ZXh0Q29udGVudCA9IFN0cmluZygoZSBhcyBFcnJvcikubWVzc2FnZSA/PyBlKTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgY29tcG9uZW50cyBcdTI1MDBcdTI1MDBcblxuLyoqIFRoZSBmdWxsIHBhbmVsIHNoZWxsICh0b29sYmFyICsgc2Nyb2xsICsgaGVhZGluZyArIHNlY3Rpb25zIHdyYXApLiAqL1xuZnVuY3Rpb24gcGFuZWxTaGVsbChcbiAgdGl0bGU6IHN0cmluZyxcbiAgc3VidGl0bGU/OiBzdHJpbmcsXG4gIG9wdGlvbnM/OiB7IHdpZGU/OiBib29sZWFuIH0sXG4pOiB7XG4gIG91dGVyOiBIVE1MRWxlbWVudDtcbiAgc2VjdGlvbnNXcmFwOiBIVE1MRWxlbWVudDtcbiAgc3VidGl0bGU/OiBIVE1MRWxlbWVudDtcbiAgaGVhZGVyQWN0aW9uczogSFRNTEVsZW1lbnQ7XG4gIGhlYWRlclRpdGxlQWN0aW9uczogSFRNTEVsZW1lbnQ7XG59IHtcbiAgY29uc3Qgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBvdXRlci5jbGFzc05hbWUgPSBcIm1haW4tc3VyZmFjZSBmbGV4IGgtZnVsbCBtaW4taC0wIGZsZXgtY29sXCI7XG5cbiAgY29uc3QgdG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRvb2xiYXIuY2xhc3NOYW1lID1cbiAgICBcImRyYWdnYWJsZSBmbGV4IGl0ZW1zLWNlbnRlciBweC1wYW5lbCBlbGVjdHJvbjpoLXRvb2xiYXIgZXh0ZW5zaW9uOmgtdG9vbGJhci1zbVwiO1xuICBvdXRlci5hcHBlbmRDaGlsZCh0b29sYmFyKTtcblxuICBjb25zdCBzY3JvbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzY3JvbGwuY2xhc3NOYW1lID0gXCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtcGFuZWxcIjtcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoc2Nyb2xsKTtcblxuICBjb25zdCBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGlubmVyLmNsYXNzTmFtZSA9XG4gICAgb3B0aW9ucz8ud2lkZVxuICAgICAgPyBcIm14LWF1dG8gZmxleCB3LWZ1bGwgbWF4LXctNXhsIGZsZXgtY29sIGVsZWN0cm9uOm1pbi13LVtjYWxjKDMyMHB4KnZhcigtLWNvZGV4LXdpbmRvdy16b29tKSldXCJcbiAgICAgIDogXCJteC1hdXRvIGZsZXggdy1mdWxsIGZsZXgtY29sIG1heC13LTJ4bCBlbGVjdHJvbjptaW4tdy1bY2FsYygzMjBweCp2YXIoLS1jb2RleC13aW5kb3ctem9vbSkpXVwiO1xuICBzY3JvbGwuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gIGNvbnN0IGhlYWRlcldyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBoZWFkZXJXcmFwLmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIHBiLXBhbmVsXCI7XG4gIGNvbnN0IGhlYWRlcklubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVySW5uZXIuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGZsZXgtY29sIGdhcC0xLjUgcGItcGFuZWxcIjtcbiAgY29uc3QgdGl0bGVMaW5lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGVMaW5lLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBjb25zdCBoZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGluZy5jbGFzc05hbWUgPSBcImVsZWN0cm9uOmhlYWRpbmctbGcgaGVhZGluZy1iYXNlIHRydW5jYXRlXCI7XG4gIGhlYWRpbmcudGV4dENvbnRlbnQgPSB0aXRsZTtcbiAgdGl0bGVMaW5lLmFwcGVuZENoaWxkKGhlYWRpbmcpO1xuICBjb25zdCBoZWFkZXJUaXRsZUFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBoZWFkZXJUaXRsZUFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICB0aXRsZUxpbmUuYXBwZW5kQ2hpbGQoaGVhZGVyVGl0bGVBY3Rpb25zKTtcbiAgaGVhZGVySW5uZXIuYXBwZW5kQ2hpbGQodGl0bGVMaW5lKTtcbiAgbGV0IHN1YnRpdGxlRWxlbWVudDogSFRNTEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIGlmIChzdWJ0aXRsZSkge1xuICAgIGNvbnN0IHN1YiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgc3ViLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSB0ZXh0LXNtXCI7XG4gICAgc3ViLnRleHRDb250ZW50ID0gc3VidGl0bGU7XG4gICAgaGVhZGVySW5uZXIuYXBwZW5kQ2hpbGQoc3ViKTtcbiAgICBzdWJ0aXRsZUVsZW1lbnQgPSBzdWI7XG4gIH1cbiAgaGVhZGVyV3JhcC5hcHBlbmRDaGlsZChoZWFkZXJJbm5lcik7XG4gIGNvbnN0IGhlYWRlckFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBoZWFkZXJBY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgaGVhZGVyV3JhcC5hcHBlbmRDaGlsZChoZWFkZXJBY3Rpb25zKTtcbiAgaW5uZXIuYXBwZW5kQ2hpbGQoaGVhZGVyV3JhcCk7XG5cbiAgY29uc3Qgc2VjdGlvbnNXcmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc2VjdGlvbnNXcmFwLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtW3ZhcigtLXBhZGRpbmctcGFuZWwpXVwiO1xuICBpbm5lci5hcHBlbmRDaGlsZChzZWN0aW9uc1dyYXApO1xuXG4gIHJldHVybiB7IG91dGVyLCBzZWN0aW9uc1dyYXAsIHN1YnRpdGxlOiBzdWJ0aXRsZUVsZW1lbnQsIGhlYWRlckFjdGlvbnMsIGhlYWRlclRpdGxlQWN0aW9ucyB9O1xufVxuXG5mdW5jdGlvbiBzZWN0aW9uVGl0bGUodGV4dDogc3RyaW5nLCB0cmFpbGluZz86IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCB0aXRsZVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlUm93LmNsYXNzTmFtZSA9XG4gICAgXCJmbGV4IGgtdG9vbGJhciBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHB4LTAgcHktMFwiO1xuICBjb25zdCB0aXRsZUlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGVJbm5lci5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LTEgZmxleC1jb2wgZ2FwLTFcIjtcbiAgY29uc3QgdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHQuY2xhc3NOYW1lID0gXCJ0ZXh0LWJhc2UgZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdC50ZXh0Q29udGVudCA9IHRleHQ7XG4gIHRpdGxlSW5uZXIuYXBwZW5kQ2hpbGQodCk7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHRpdGxlSW5uZXIpO1xuICBpZiAodHJhaWxpbmcpIHtcbiAgICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgcmlnaHQuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICAgIHJpZ2h0LmFwcGVuZENoaWxkKHRyYWlsaW5nKTtcbiAgICB0aXRsZVJvdy5hcHBlbmRDaGlsZChyaWdodCk7XG4gIH1cbiAgcmV0dXJuIHRpdGxlUm93O1xufVxuXG4vKipcbiAqIENvZGV4J3MgXCJPcGVuIGNvbmZpZy50b21sXCItc3R5bGUgdHJhaWxpbmcgYnV0dG9uOiBnaG9zdCBib3JkZXIsIG11dGVkXG4gKiBsYWJlbCwgdG9wLXJpZ2h0IGRpYWdvbmFsIGFycm93IGljb24uIE1hcmt1cCBtaXJyb3JzIENvbmZpZ3VyYXRpb24gcGFuZWwuXG4gKi9cbmZ1bmN0aW9uIG9wZW5JblBsYWNlQnV0dG9uKGxhYmVsOiBzdHJpbmcsIG9uQ2xpY2s6ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgYm9yZGVyIHdoaXRlc3BhY2Utbm93cmFwIGZvY3VzOm91dGxpbmUtbm9uZSBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgZGlzYWJsZWQ6b3BhY2l0eS00MCByb3VuZGVkLWxnIHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZCBlbmFibGVkOmhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZCBkYXRhLVtzdGF0ZT1vcGVuXTpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgYm9yZGVyLXRyYW5zcGFyZW50IGgtdG9rZW4tYnV0dG9uLWNvbXBvc2VyIHB4LTIgcHktMCB0ZXh0LWJhc2UgbGVhZGluZy1bMThweF1cIjtcbiAgYnRuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGFwcGVuZFN2Z0h0bWwoXG4gICAgYnRuLFxuICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tMnhzXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXG4gICAgYDxwYXRoIGQ9XCJNMTQuMzM0OSAxMy4zMzAxVjYuNjA2NDVMNS40NzA2NSAxNS40NzA3QzUuMjEwOTUgMTUuNzMwNCA0Ljc4ODk1IDE1LjczMDQgNC41MjkyNSAxNS40NzA3QzQuMjY5NTUgMTUuMjExIDQuMjY5NTUgMTQuNzg5IDQuNTI5MjUgMTQuNTI5M0wxMy4zOTM1IDUuNjY1MDRINi42NjAxMUM2LjI5Mjg0IDUuNjY1MDQgNS45OTUwNyA1LjM2NzI3IDUuOTk1MDcgNUM1Ljk5NTA3IDQuNjMyNzMgNi4yOTI4NCA0LjMzNDk2IDYuNjYwMTEgNC4zMzQ5NkgxNC45OTk5TDE1LjEzMzcgNC4zNDg2M0MxNS40MzY5IDQuNDEwNTcgMTUuNjY1IDQuNjc4NTcgMTUuNjY1IDVWMTMuMzMwMUMxNS42NjQ5IDEzLjY5NzMgMTUuMzY3MiAxMy45OTUxIDE0Ljk5OTkgMTMuOTk1MUMxNC42MzI3IDEzLjk5NTEgMTQuMzM1IDEzLjY5NzMgMTQuMzM0OSAxMy4zMzAxWlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIj48L3BhdGg+YCArXG4gICAgYDwvc3ZnPmAsXG4gICk7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBvbkNsaWNrKCk7XG4gIH0pO1xuICByZXR1cm4gYnRuO1xufVxuXG5mdW5jdGlvbiBjb21wYWN0QnV0dG9uKGxhYmVsOiBzdHJpbmcsIG9uQ2xpY2s6ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gaW5saW5lLWZsZXggaC04IGl0ZW1zLWNlbnRlciB3aGl0ZXNwYWNlLW5vd3JhcCByb3VuZGVkLWxnIGJvcmRlciBweC0yIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnkgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNDBcIjtcbiAgYnRuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBvbkNsaWNrKCk7XG4gIH0pO1xuICByZXR1cm4gYnRuO1xufVxuXG5mdW5jdGlvbiByb3VuZGVkQ2FyZCgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGNhcmQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBjYXJkLmNsYXNzTmFtZSA9XG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIGZsZXggZmxleC1jb2wgZGl2aWRlLXktWzAuNXB4XSBkaXZpZGUtdG9rZW4tYm9yZGVyIHJvdW5kZWQtbGcgYm9yZGVyXCI7XG4gIGNhcmQuc2V0QXR0cmlidXRlKFxuICAgIFwic3R5bGVcIixcbiAgICBcImJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbG9yLWJhY2tncm91bmQtcGFuZWwsIHZhcigtLWNvbG9yLXRva2VuLWJnLWZvZykpO1wiLFxuICApO1xuICByZXR1cm4gY2FyZDtcbn1cblxuZnVuY3Rpb24gcm93U2ltcGxlKHRpdGxlOiBzdHJpbmcgfCB1bmRlZmluZWQsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICByb3cuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTQgcC0zXCI7XG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBsZWZ0LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGl0ZW1zLWNlbnRlciBnYXAtM1wiO1xuICBjb25zdCBzdGFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHN0YWNrLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XG4gIGlmICh0aXRsZSkge1xuICAgIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHQuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgICB0LnRleHRDb250ZW50ID0gdGl0bGU7XG4gICAgc3RhY2suYXBwZW5kQ2hpbGQodCk7XG4gIH1cbiAgaWYgKGRlc2NyaXB0aW9uKSB7XG4gICAgY29uc3QgZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZC5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XG4gICAgZC50ZXh0Q29udGVudCA9IGRlc2NyaXB0aW9uO1xuICAgIHN0YWNrLmFwcGVuZENoaWxkKGQpO1xuICB9XG4gIGxlZnQuYXBwZW5kQ2hpbGQoc3RhY2spO1xuICByb3cuYXBwZW5kQ2hpbGQobGVmdCk7XG4gIHJldHVybiByb3c7XG59XG5cbi8qKlxuICogQ29kZXgtc3R5bGVkIHRvZ2dsZSBzd2l0Y2guIE1hcmt1cCBtaXJyb3JzIHRoZSBHZW5lcmFsID4gUGVybWlzc2lvbnMgcm93XG4gKiBzd2l0Y2ggd2UgY2FwdHVyZWQ6IG91dGVyIGJ1dHRvbiAocm9sZT1zd2l0Y2gpLCBpbm5lciBwaWxsLCBzbGlkaW5nIGtub2IuXG4gKi9cbmZ1bmN0aW9uIHN3aXRjaENvbnRyb2woXG4gIGluaXRpYWw6IGJvb2xlYW4sXG4gIG9uQ2hhbmdlOiAobmV4dDogYm9vbGVhbikgPT4gdm9pZCB8IFByb21pc2U8dm9pZD4sXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJzd2l0Y2hcIik7XG5cbiAgY29uc3QgcGlsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBjb25zdCBrbm9iID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGtub2IuY2xhc3NOYW1lID1cbiAgICBcInJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLVtjb2xvcjp2YXIoLS1ncmF5LTApXSBiZy1bY29sb3I6dmFyKC0tZ3JheS0wKV0gc2hhZG93LXNtIHRyYW5zaXRpb24tdHJhbnNmb3JtIGR1cmF0aW9uLTIwMCBlYXNlLW91dCBoLTQgdy00XCI7XG4gIHBpbGwuYXBwZW5kQ2hpbGQoa25vYik7XG5cbiAgY29uc3QgYXBwbHkgPSAob246IGJvb2xlYW4pOiB2b2lkID0+IHtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1jaGVja2VkXCIsIFN0cmluZyhvbikpO1xuICAgIGJ0bi5kYXRhc2V0LnN0YXRlID0gb24gPyBcImNoZWNrZWRcIiA6IFwidW5jaGVja2VkXCI7XG4gICAgYnRuLmNsYXNzTmFtZSA9XG4gICAgICBcImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LXNtIGZvY3VzLXZpc2libGU6b3V0bGluZS1ub25lIGZvY3VzLXZpc2libGU6cmluZy0yIGZvY3VzLXZpc2libGU6cmluZy10b2tlbi1mb2N1cy1ib3JkZXIgZm9jdXMtdmlzaWJsZTpyb3VuZGVkLWZ1bGwgY3Vyc29yLWludGVyYWN0aW9uXCI7XG4gICAgcGlsbC5jbGFzc05hbWUgPSBgcmVsYXRpdmUgaW5saW5lLWZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uLWNvbG9ycyBkdXJhdGlvbi0yMDAgZWFzZS1vdXQgaC01IHctOCAke1xuICAgICAgb24gPyBcImJnLXRva2VuLWNoYXJ0cy1ibHVlXCIgOiBcImJnLXRva2VuLWZvcmVncm91bmQvMjBcIlxuICAgIH1gO1xuICAgIHBpbGwuZGF0YXNldC5zdGF0ZSA9IG9uID8gXCJjaGVja2VkXCIgOiBcInVuY2hlY2tlZFwiO1xuICAgIGtub2IuZGF0YXNldC5zdGF0ZSA9IG9uID8gXCJjaGVja2VkXCIgOiBcInVuY2hlY2tlZFwiO1xuICAgIGtub2Iuc3R5bGUudHJhbnNmb3JtID0gb24gPyBcInRyYW5zbGF0ZVgoMTRweClcIiA6IFwidHJhbnNsYXRlWCgycHgpXCI7XG4gIH07XG4gIGFwcGx5KGluaXRpYWwpO1xuXG4gIGJ0bi5hcHBlbmRDaGlsZChwaWxsKTtcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGNvbnN0IG5leHQgPSBidG4uZ2V0QXR0cmlidXRlKFwiYXJpYS1jaGVja2VkXCIpICE9PSBcInRydWVcIjtcbiAgICBhcHBseShuZXh0KTtcbiAgICBidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBvbkNoYW5nZShuZXh0KTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgYnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gZG90KCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBzLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XG4gIHMudGV4dENvbnRlbnQgPSBcIlx1MDBCN1wiO1xuICByZXR1cm4gcztcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUljb25VcmwoXG4gIHVybDogc3RyaW5nLFxuICB0d2Vha0Rpcjogc3RyaW5nLFxuKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XG4gIGlmICgvXihodHRwcz86fGRhdGE6KS8udGVzdCh1cmwpKSByZXR1cm4gdXJsO1xuICAvLyBSZWxhdGl2ZSBwYXRoIFx1MjE5MiBhc2sgbWFpbiB0byByZWFkIHRoZSBmaWxlIGFuZCByZXR1cm4gYSBkYXRhOiBVUkwuXG4gIC8vIFJlbmRlcmVyIGlzIHNhbmRib3hlZCBzbyBmaWxlOi8vIHdvbid0IGxvYWQgZGlyZWN0bHkuXG4gIGNvbnN0IHJlbCA9IHVybC5zdGFydHNXaXRoKFwiLi9cIikgPyB1cmwuc2xpY2UoMikgOiB1cmw7XG4gIHRyeSB7XG4gICAgcmV0dXJuIChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICBcImNvZGV4cHA6cmVhZC10d2Vhay1hc3NldFwiLFxuICAgICAgdHdlYWtEaXIsXG4gICAgICByZWwsXG4gICAgKSkgYXMgc3RyaW5nO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcGxvZyhcImljb24gbG9hZCBmYWlsZWRcIiwgeyB1cmwsIHR3ZWFrRGlyLCBlcnI6IFN0cmluZyhlKSB9KTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgRE9NIGhldXJpc3RpY3MgXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGZpbmRTaWRlYmFySXRlbXNHcm91cCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBjYWNoZWQgPSBjYWNoZWRTaWRlYmFySXRlbXNHcm91cCgpO1xuICBpZiAoY2FjaGVkKSByZXR1cm4gY2FjaGVkO1xuXG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBBcnJheS5mcm9tKFxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiYXNpZGUsbmF2LFtyb2xlPSduYXZpZ2F0aW9uJ10sZGl2XCIpLFxuICApO1xuXG4gIGxldCBiZXN0OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBsZXQgYmVzdFNjb3JlID0gLTE7XG4gIGxldCBiZXN0QXJlYSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcblxuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgaWYgKGNhbmRpZGF0ZS5kYXRhc2V0LmNvZGV4cHApIGNvbnRpbnVlO1xuICAgIGlmICghaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUoY2FuZGlkYXRlKSkgY29udGludWU7XG5cbiAgICBjb25zdCBsYWJlbHMgPSBjb2RleFBwU2V0dGluZ3NMYWJlbHNGcm9tKGNhbmRpZGF0ZSk7XG4gICAgY29uc3Qgc2NvcmUgPSBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlKGxhYmVscyk7XG4gICAgY29uc3QgcmVjdCA9IGNhbmRpZGF0ZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBhcmVhID0gcmVjdC53aWR0aCAqIHJlY3QuaGVpZ2h0O1xuICAgIGNvbnN0IHdlaWdodGVkID0gc2NvcmUuY29yZSAqIDEwMCArIHNjb3JlLnRvdGFsO1xuXG4gICAgaWYgKHdlaWdodGVkID4gYmVzdFNjb3JlIHx8ICh3ZWlnaHRlZCA9PT0gYmVzdFNjb3JlICYmIGFyZWEgPCBiZXN0QXJlYSkpIHtcbiAgICAgIGJlc3QgPSBjYW5kaWRhdGU7XG4gICAgICBiZXN0U2NvcmUgPSB3ZWlnaHRlZDtcbiAgICAgIGJlc3RBcmVhID0gYXJlYTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYmVzdDtcbn1cblxuZnVuY3Rpb24gY2FjaGVkU2lkZWJhckl0ZW1zR3JvdXAoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgY2FuZGlkYXRlcyA9IFtcbiAgICBzdGF0ZS5zaWRlYmFyUm9vdCxcbiAgICBzdGF0ZS5uYXZHcm91cD8ucGFyZW50RWxlbWVudCA/PyBudWxsLFxuICAgIHN0YXRlLnBhZ2VzR3JvdXA/LnBhcmVudEVsZW1lbnQgPz8gbnVsbCxcbiAgXTtcblxuICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBjYW5kaWRhdGVzKSB7XG4gICAgaWYgKCFjYW5kaWRhdGUpIGNvbnRpbnVlO1xuICAgIGlmICghY2FuZGlkYXRlLmlzQ29ubmVjdGVkKSBjb250aW51ZTtcbiAgICBpZiAoaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUoY2FuZGlkYXRlKSkgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiByZW1vdmVNaXNwbGFjZWRTZXR0aW5nc0dyb3VwcygpOiB2b2lkIHtcbiAgY29uc3QgZ3JvdXBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXG4gICAgXCJbZGF0YS1jb2RleHBwPSduYXYtZ3JvdXAnXSwgW2RhdGEtY29kZXhwcD0ncGFnZXMtZ3JvdXAnXSwgW2RhdGEtY29kZXhwcD0nbmF0aXZlLW5hdi1oZWFkZXInXVwiLFxuICApO1xuICBmb3IgKGNvbnN0IGdyb3VwIG9mIEFycmF5LmZyb20oZ3JvdXBzKSkge1xuICAgIGlmIChpc0NvZGV4UHBJbmplY3RlZFNldHRpbmdzR3JvdXBQbGFjZW1lbnRWYWxpZChncm91cCkpIGNvbnRpbnVlO1xuICAgIHJlc2V0Q29kZXhQcEluamVjdGVkU2V0dGluZ3NHcm91cFN0YXRlKGdyb3VwKTtcbiAgICBncm91cC5yZW1vdmUoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0NvZGV4UHBJbmplY3RlZFNldHRpbmdzR3JvdXBQbGFjZW1lbnRWYWxpZChncm91cDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgaWYgKGlzRm9yYmlkZGVuU2V0dGluZ3NTaWRlYmFyU3VyZmFjZShncm91cCkpIHJldHVybiBmYWxzZTtcblxuICBsZXQgbm9kZSA9IGdyb3VwLnBhcmVudEVsZW1lbnQ7XG4gIGZvciAobGV0IGRlcHRoID0gMDsgbm9kZSAmJiBkZXB0aCA8IDQ7IGRlcHRoKyspIHtcbiAgICBpZiAoaXNGb3JiaWRkZW5TZXR0aW5nc1NpZGViYXJTdXJmYWNlKG5vZGUpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKG5vZGUpKSByZXR1cm4gdHJ1ZTtcbiAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZXNldENvZGV4UHBJbmplY3RlZFNldHRpbmdzR3JvdXBTdGF0ZShncm91cDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLm5hdkdyb3VwID09PSBncm91cCB8fCAoc3RhdGUubmF2R3JvdXAgJiYgZ3JvdXAuY29udGFpbnMoc3RhdGUubmF2R3JvdXApKSkge1xuICAgIHN0YXRlLm5hdkdyb3VwID0gbnVsbDtcbiAgICBzdGF0ZS5uYXZCdXR0b25zID0gbnVsbDtcbiAgICBzdGF0ZS5jb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uID0gbnVsbDtcbiAgfVxuICBpZiAoc3RhdGUucGFnZXNHcm91cCA9PT0gZ3JvdXAgfHwgKHN0YXRlLnBhZ2VzR3JvdXAgJiYgZ3JvdXAuY29udGFpbnMoc3RhdGUucGFnZXNHcm91cCkpKSB7XG4gICAgc3RhdGUucGFnZXNHcm91cCA9IG51bGw7XG4gICAgc3RhdGUucGFnZXNHcm91cEtleSA9IG51bGw7XG4gICAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSBwLm5hdkJ1dHRvbiA9IG51bGw7XG4gIH1cbiAgaWYgKHN0YXRlLm5hdGl2ZU5hdkhlYWRlciA9PT0gZ3JvdXAgfHwgKHN0YXRlLm5hdGl2ZU5hdkhlYWRlciAmJiBncm91cC5jb250YWlucyhzdGF0ZS5uYXRpdmVOYXZIZWFkZXIpKSkge1xuICAgIHN0YXRlLm5hdGl2ZU5hdkhlYWRlciA9IG51bGw7XG4gIH1cbiAgaWYgKHN0YXRlLnNpZGViYXJSb290ICYmIHN0YXRlLnNpZGViYXJSb290LmNvbnRhaW5zKGdyb3VwKSkge1xuICAgIHN0YXRlLnNpZGViYXJSb290ID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kQ29udGVudEFyZWEoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3Qgc2lkZWJhciA9IGZpbmRTaWRlYmFySXRlbXNHcm91cCgpO1xuICBpZiAoIXNpZGViYXIpIHJldHVybiBudWxsO1xuICBsZXQgcGFyZW50ID0gc2lkZWJhci5wYXJlbnRFbGVtZW50O1xuICB3aGlsZSAocGFyZW50KSB7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKHBhcmVudC5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSkge1xuICAgICAgaWYgKGNoaWxkID09PSBzaWRlYmFyIHx8IGNoaWxkLmNvbnRhaW5zKHNpZGViYXIpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHIgPSBjaGlsZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGlmIChyLndpZHRoID4gMzAwICYmIHIuaGVpZ2h0ID4gMjAwKSByZXR1cm4gY2hpbGQ7XG4gICAgfVxuICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnRFbGVtZW50O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBtYXliZUR1bXBEb20oKTogdm9pZCB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2lkZWJhciA9IGZpbmRTaWRlYmFySXRlbXNHcm91cCgpO1xuICAgIGlmIChzaWRlYmFyICYmICFzdGF0ZS5zaWRlYmFyRHVtcGVkKSB7XG4gICAgICBzdGF0ZS5zaWRlYmFyRHVtcGVkID0gdHJ1ZTtcbiAgICAgIGlmIChpc1NldHRpbmdzRG9tRHVtcEVuYWJsZWQoKSkge1xuICAgICAgICBjb25zdCBzYlJvb3QgPSBzaWRlYmFyLnBhcmVudEVsZW1lbnQgPz8gc2lkZWJhcjtcbiAgICAgICAgcGxvZyhgY29kZXggc2lkZWJhciBIVE1MYCwgc2JSb290Lm91dGVySFRNTC5zbGljZSgwLCAzMjAwMCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBjb250ZW50ID0gZmluZENvbnRlbnRBcmVhKCk7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICBpZiAoc3RhdGUuZmluZ2VycHJpbnQgIT09IGxvY2F0aW9uLmhyZWYpIHtcbiAgICAgICAgc3RhdGUuZmluZ2VycHJpbnQgPSBsb2NhdGlvbi5ocmVmO1xuICAgICAgICBwbG9nKFwiZG9tIHByb2JlIChubyBjb250ZW50KVwiLCB7XG4gICAgICAgICAgdXJsOiBsb2NhdGlvbi5ocmVmLFxuICAgICAgICAgIHNpZGViYXI6IHNpZGViYXIgPyBkZXNjcmliZShzaWRlYmFyKSA6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgcGFuZWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGNvbnRlbnQuY2hpbGRyZW4pIGFzIEhUTUxFbGVtZW50W10pIHtcbiAgICAgIGlmIChjaGlsZC5kYXRhc2V0LmNvZGV4cHAgPT09IFwidHdlYWtzLXBhbmVsXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKGNoaWxkLnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiKSBjb250aW51ZTtcbiAgICAgIHBhbmVsID0gY2hpbGQ7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgYWN0aXZlTmF2ID0gc2lkZWJhclxuICAgICAgPyBBcnJheS5mcm9tKHNpZGViYXIucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCJidXR0b24sIGFcIikpLmZpbmQoXG4gICAgICAgICAgKGIpID0+XG4gICAgICAgICAgICBiLmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSA9PT0gXCJwYWdlXCIgfHxcbiAgICAgICAgICAgIGIuZ2V0QXR0cmlidXRlKFwiZGF0YS1hY3RpdmVcIikgPT09IFwidHJ1ZVwiIHx8XG4gICAgICAgICAgICBiLmdldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIikgPT09IFwidHJ1ZVwiIHx8XG4gICAgICAgICAgICBiLmNsYXNzTGlzdC5jb250YWlucyhcImFjdGl2ZVwiKSxcbiAgICAgICAgKVxuICAgICAgOiBudWxsO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBwYW5lbD8ucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICBcImgxLCBoMiwgaDMsIFtjbGFzcyo9J2hlYWRpbmcnXVwiLFxuICAgICk7XG4gICAgY29uc3QgZmluZ2VycHJpbnQgPSBgJHthY3RpdmVOYXY/LnRleHRDb250ZW50ID8/IFwiXCJ9fCR7aGVhZGluZz8udGV4dENvbnRlbnQgPz8gXCJcIn18JHtwYW5lbD8uY2hpbGRyZW4ubGVuZ3RoID8/IDB9YDtcbiAgICBpZiAoc3RhdGUuZmluZ2VycHJpbnQgPT09IGZpbmdlcnByaW50KSByZXR1cm47XG4gICAgc3RhdGUuZmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcbiAgICBwbG9nKFwiZG9tIHByb2JlXCIsIHtcbiAgICAgIHVybDogbG9jYXRpb24uaHJlZixcbiAgICAgIGFjdGl2ZU5hdjogYWN0aXZlTmF2Py50ZXh0Q29udGVudD8udHJpbSgpID8/IG51bGwsXG4gICAgICBoZWFkaW5nOiBoZWFkaW5nPy50ZXh0Q29udGVudD8udHJpbSgpID8/IG51bGwsXG4gICAgICBjb250ZW50OiBkZXNjcmliZShjb250ZW50KSxcbiAgICB9KTtcbiAgICBpZiAocGFuZWwgJiYgaXNTZXR0aW5nc0RvbUR1bXBFbmFibGVkKCkpIHtcbiAgICAgIGNvbnN0IGh0bWwgPSBwYW5lbC5vdXRlckhUTUw7XG4gICAgICBwbG9nKFxuICAgICAgICBgY29kZXggcGFuZWwgSFRNTCAoJHthY3RpdmVOYXY/LnRleHRDb250ZW50Py50cmltKCkgPz8gXCI/XCJ9KWAsXG4gICAgICAgIGh0bWwuc2xpY2UoMCwgMzIwMDApLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBwbG9nKFwiZG9tIHByb2JlIGZhaWxlZFwiLCBTdHJpbmcoZSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzU2V0dGluZ3NEb21EdW1wRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuICh3aW5kb3cgYXMgV2luZG93ICYgeyBfX2NvZGV4cHBEdW1wU2V0dGluZ3NEb20/OiBib29sZWFuIH0pLl9fY29kZXhwcER1bXBTZXR0aW5nc0RvbSA9PT0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZGVzY3JpYmUoZWw6IEhUTUxFbGVtZW50KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIHRhZzogZWwudGFnTmFtZSxcbiAgICBjbHM6IGVsLmNsYXNzTmFtZS5zbGljZSgwLCAxMjApLFxuICAgIGlkOiBlbC5pZCB8fCB1bmRlZmluZWQsXG4gICAgY2hpbGRyZW46IGVsLmNoaWxkcmVuLmxlbmd0aCxcbiAgICByZWN0OiAoKCkgPT4ge1xuICAgICAgY29uc3QgciA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHsgdzogTWF0aC5yb3VuZChyLndpZHRoKSwgaDogTWF0aC5yb3VuZChyLmhlaWdodCkgfTtcbiAgICB9KSgpLFxuICB9O1xufVxuXG5mdW5jdGlvbiB0d2Vha3NQYXRoKCk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgKHdpbmRvdyBhcyB1bmtub3duIGFzIHsgX19jb2RleHBwX3R3ZWFrc19kaXJfXz86IHN0cmluZyB9KS5fX2NvZGV4cHBfdHdlYWtzX2Rpcl9fID8/XG4gICAgXCI8dXNlciBkaXI+L3R3ZWFrc1wiXG4gICk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBUd2Vha01hbmlmZXN0IH0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfVFdFQUtfU1RPUkVfSU5ERVhfVVJMID1cbiAgXCJodHRwczovL2twa2h4bGd5MC5naXRodWIuaW8vY29kZXgtcGx1c3BsdXMvc3RvcmUvaW5kZXguanNvblwiO1xuZXhwb3J0IGNvbnN0IFRXRUFLX1NUT1JFX1JFVklFV19JU1NVRV9VUkwgPVxuICBcImh0dHBzOi8vZ2l0aHViLmNvbS9rcGtoeGxneTAvY29kZXgtcGx1c3BsdXMvaXNzdWVzL25ld1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFR3ZWFrU3RvcmVSZWdpc3RyeSB7XG4gIHNjaGVtYVZlcnNpb246IDE7XG4gIGdlbmVyYXRlZEF0Pzogc3RyaW5nO1xuICBlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlRW50cnkge1xuICBpZDogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgcmVwbzogc3RyaW5nO1xuICBhcHByb3ZlZENvbW1pdFNoYTogc3RyaW5nO1xuICBhcHByb3ZlZEF0OiBzdHJpbmc7XG4gIGFwcHJvdmVkQnk6IHN0cmluZztcbiAgcGxhdGZvcm1zPzogVHdlYWtTdG9yZVBsYXRmb3JtW107XG4gIHJlbGVhc2VVcmw/OiBzdHJpbmc7XG4gIHJldmlld1VybD86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgVHdlYWtTdG9yZVBsYXRmb3JtID0gXCJkYXJ3aW5cIiB8IFwid2luMzJcIiB8IFwibGludXhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24ge1xuICByZXBvOiBzdHJpbmc7XG4gIGRlZmF1bHRCcmFuY2g6IHN0cmluZztcbiAgY29tbWl0U2hhOiBzdHJpbmc7XG4gIGNvbW1pdFVybDogc3RyaW5nO1xuICBtYW5pZmVzdD86IHtcbiAgICBpZD86IHN0cmluZztcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHZlcnNpb24/OiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgaWNvblVybD86IHN0cmluZztcbiAgfTtcbn1cblxuY29uc3QgR0lUSFVCX1JFUE9fUkUgPSAvXltBLVphLXowLTlfLi1dK1xcL1tBLVphLXowLTlfLi1dKyQvO1xuY29uc3QgRlVMTF9TSEFfUkUgPSAvXlthLWYwLTldezQwfSQvaTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUdpdEh1YlJlcG8oaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJhdyA9IGlucHV0LnRyaW0oKTtcbiAgaWYgKCFyYXcpIHRocm93IG5ldyBFcnJvcihcIkdpdEh1YiByZXBvIGlzIHJlcXVpcmVkXCIpO1xuXG4gIGNvbnN0IHNzaCA9IC9eZ2l0QGdpdGh1YlxcLmNvbTooW14vXStcXC9bXi9dKz8pKD86XFwuZ2l0KT8kL2kuZXhlYyhyYXcpO1xuICBpZiAoc3NoKSByZXR1cm4gbm9ybWFsaXplUmVwb1BhcnQoc3NoWzFdKTtcblxuICBpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdChyYXcpKSB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChyYXcpO1xuICAgIGlmICh1cmwuaG9zdG5hbWUgIT09IFwiZ2l0aHViLmNvbVwiKSB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IGdpdGh1Yi5jb20gcmVwb3NpdG9yaWVzIGFyZSBzdXBwb3J0ZWRcIik7XG4gICAgY29uc3QgcGFydHMgPSB1cmwucGF0aG5hbWUucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikuc3BsaXQoXCIvXCIpO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoXCJHaXRIdWIgcmVwbyBVUkwgbXVzdCBpbmNsdWRlIG93bmVyIGFuZCByZXBvc2l0b3J5XCIpO1xuICAgIHJldHVybiBub3JtYWxpemVSZXBvUGFydChgJHtwYXJ0c1swXX0vJHtwYXJ0c1sxXX1gKTtcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVSZXBvUGFydChyYXcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3RvcmVSZWdpc3RyeShpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVSZWdpc3RyeSB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gaW5wdXQgYXMgUGFydGlhbDxUd2Vha1N0b3JlUmVnaXN0cnk+IHwgbnVsbDtcbiAgaWYgKCFyZWdpc3RyeSB8fCByZWdpc3RyeS5zY2hlbWFWZXJzaW9uICE9PSAxIHx8ICFBcnJheS5pc0FycmF5KHJlZ2lzdHJ5LmVudHJpZXMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgdHdlYWsgc3RvcmUgcmVnaXN0cnlcIik7XG4gIH1cbiAgY29uc3QgZW50cmllcyA9IHJlZ2lzdHJ5LmVudHJpZXMubWFwKG5vcm1hbGl6ZVN0b3JlRW50cnkpO1xuICBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGEubWFuaWZlc3QubmFtZS5sb2NhbGVDb21wYXJlKGIubWFuaWZlc3QubmFtZSkpO1xuICByZXR1cm4ge1xuICAgIHNjaGVtYVZlcnNpb246IDEsXG4gICAgZ2VuZXJhdGVkQXQ6IHR5cGVvZiByZWdpc3RyeS5nZW5lcmF0ZWRBdCA9PT0gXCJzdHJpbmdcIiA/IHJlZ2lzdHJ5LmdlbmVyYXRlZEF0IDogdW5kZWZpbmVkLFxuICAgIGVudHJpZXMsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaHVmZmxlU3RvcmVFbnRyaWVzPFQ+KFxuICBlbnRyaWVzOiByZWFkb25seSBUW10sXG4gIHJhbmRvbUluZGV4OiAoZXhjbHVzaXZlTWF4OiBudW1iZXIpID0+IG51bWJlciA9IChleGNsdXNpdmVNYXgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGV4Y2x1c2l2ZU1heCksXG4pOiBUW10ge1xuICBjb25zdCBzaHVmZmxlZCA9IFsuLi5lbnRyaWVzXTtcbiAgZm9yIChsZXQgaSA9IHNodWZmbGVkLmxlbmd0aCAtIDE7IGkgPiAwOyBpIC09IDEpIHtcbiAgICBjb25zdCBqID0gcmFuZG9tSW5kZXgoaSArIDEpO1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihqKSB8fCBqIDwgMCB8fCBqID4gaSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBzaHVmZmxlIHJhbmRvbUluZGV4IHJldHVybmVkICR7an07IGV4cGVjdGVkIGFuIGludGVnZXIgZnJvbSAwIHRvICR7aX1gKTtcbiAgICB9XG4gICAgW3NodWZmbGVkW2ldLCBzaHVmZmxlZFtqXV0gPSBbc2h1ZmZsZWRbal0sIHNodWZmbGVkW2ldXTtcbiAgfVxuICByZXR1cm4gc2h1ZmZsZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdG9yZUVudHJ5KGlucHV0OiB1bmtub3duKTogVHdlYWtTdG9yZUVudHJ5IHtcbiAgY29uc3QgZW50cnkgPSBpbnB1dCBhcyBQYXJ0aWFsPFR3ZWFrU3RvcmVFbnRyeT4gfCBudWxsO1xuICBpZiAoIWVudHJ5IHx8IHR5cGVvZiBlbnRyeSAhPT0gXCJvYmplY3RcIikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0d2VhayBzdG9yZSBlbnRyeVwiKTtcbiAgY29uc3QgcmVwbyA9IG5vcm1hbGl6ZUdpdEh1YlJlcG8oU3RyaW5nKGVudHJ5LnJlcG8gPz8gZW50cnkubWFuaWZlc3Q/LmdpdGh1YlJlcG8gPz8gXCJcIikpO1xuICBjb25zdCBtYW5pZmVzdCA9IGVudHJ5Lm1hbmlmZXN0IGFzIFR3ZWFrTWFuaWZlc3QgfCB1bmRlZmluZWQ7XG4gIGlmICghbWFuaWZlc3Q/LmlkIHx8ICFtYW5pZmVzdC5uYW1lIHx8ICFtYW5pZmVzdC52ZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSBmb3IgJHtyZXBvfSBpcyBtaXNzaW5nIG1hbmlmZXN0IGZpZWxkc2ApO1xuICB9XG4gIGlmIChub3JtYWxpemVHaXRIdWJSZXBvKG1hbmlmZXN0LmdpdGh1YlJlcG8pICE9PSByZXBvKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke21hbmlmZXN0LmlkfSByZXBvIGRvZXMgbm90IG1hdGNoIG1hbmlmZXN0IGdpdGh1YlJlcG9gKTtcbiAgfVxuICBpZiAoIWlzRnVsbENvbW1pdFNoYShTdHJpbmcoZW50cnkuYXBwcm92ZWRDb21taXRTaGEgPz8gXCJcIikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke21hbmlmZXN0LmlkfSBtdXN0IHBpbiBhIGZ1bGwgYXBwcm92ZWQgY29tbWl0IFNIQWApO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IG1hbmlmZXN0LmlkLFxuICAgIG1hbmlmZXN0LFxuICAgIHJlcG8sXG4gICAgYXBwcm92ZWRDb21taXRTaGE6IFN0cmluZyhlbnRyeS5hcHByb3ZlZENvbW1pdFNoYSksXG4gICAgYXBwcm92ZWRBdDogdHlwZW9mIGVudHJ5LmFwcHJvdmVkQXQgPT09IFwic3RyaW5nXCIgPyBlbnRyeS5hcHByb3ZlZEF0IDogXCJcIixcbiAgICBhcHByb3ZlZEJ5OiB0eXBlb2YgZW50cnkuYXBwcm92ZWRCeSA9PT0gXCJzdHJpbmdcIiA/IGVudHJ5LmFwcHJvdmVkQnkgOiBcIlwiLFxuICAgIHBsYXRmb3Jtczogbm9ybWFsaXplU3RvcmVQbGF0Zm9ybXMoKGVudHJ5IGFzIHsgcGxhdGZvcm1zPzogdW5rbm93biB9KS5wbGF0Zm9ybXMpLFxuICAgIHJlbGVhc2VVcmw6IG9wdGlvbmFsR2l0aHViVXJsKGVudHJ5LnJlbGVhc2VVcmwpLFxuICAgIHJldmlld1VybDogb3B0aW9uYWxHaXRodWJVcmwoZW50cnkucmV2aWV3VXJsKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQXJjaGl2ZVVybChlbnRyeTogVHdlYWtTdG9yZUVudHJ5KTogc3RyaW5nIHtcbiAgaWYgKCFpc0Z1bGxDb21taXRTaGEoZW50cnkuYXBwcm92ZWRDb21taXRTaGEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke2VudHJ5LmlkfSBpcyBub3QgcGlubmVkIHRvIGEgZnVsbCBjb21taXQgU0hBYCk7XG4gIH1cbiAgcmV0dXJuIGBodHRwczovL2NvZGVsb2FkLmdpdGh1Yi5jb20vJHtlbnRyeS5yZXBvfS90YXIuZ3ovJHtlbnRyeS5hcHByb3ZlZENvbW1pdFNoYX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRUd2Vha1B1Ymxpc2hJc3N1ZVVybChzdWJtaXNzaW9uOiBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24pOiBzdHJpbmcge1xuICBjb25zdCByZXBvID0gbm9ybWFsaXplR2l0SHViUmVwbyhzdWJtaXNzaW9uLnJlcG8pO1xuICBpZiAoIWlzRnVsbENvbW1pdFNoYShzdWJtaXNzaW9uLmNvbW1pdFNoYSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdWJtaXNzaW9uIG11c3QgaW5jbHVkZSB0aGUgZnVsbCBjb21taXQgU0hBIHRvIHJldmlld1wiKTtcbiAgfVxuICBjb25zdCB0aXRsZSA9IGBUd2VhayBzdG9yZSByZXZpZXc6ICR7cmVwb31gO1xuICBjb25zdCBib2R5ID0gW1xuICAgIFwiIyMgVHdlYWsgcmVwb1wiLFxuICAgIGBodHRwczovL2dpdGh1Yi5jb20vJHtyZXBvfWAsXG4gICAgXCJcIixcbiAgICBcIiMjIENvbW1pdCB0byByZXZpZXdcIixcbiAgICBzdWJtaXNzaW9uLmNvbW1pdFNoYSxcbiAgICBzdWJtaXNzaW9uLmNvbW1pdFVybCxcbiAgICBcIlwiLFxuICAgIFwiRG8gbm90IGFwcHJvdmUgYSBkaWZmZXJlbnQgY29tbWl0LiBJZiB0aGUgYXV0aG9yIHB1c2hlcyBjaGFuZ2VzLCBhc2sgdGhlbSB0byByZXN1Ym1pdC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTWFuaWZlc3RcIixcbiAgICBgLSBpZDogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5pZCA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSBuYW1lOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/Lm5hbWUgPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgYC0gdmVyc2lvbjogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py52ZXJzaW9uID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIGRlc2NyaXB0aW9uOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/LmRlc2NyaXB0aW9uID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIGljb25Vcmw6ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8uaWNvblVybCA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQWRtaW4gY2hlY2tsaXN0XCIsXG4gICAgXCItIFsgXSBtYW5pZmVzdC5qc29uIGlzIHZhbGlkXCIsXG4gICAgXCItIFsgXSBtYW5pZmVzdC5pY29uVXJsIGlzIHVzYWJsZSBhcyB0aGUgc3RvcmUgaWNvblwiLFxuICAgIFwiLSBbIF0gc291cmNlIHdhcyByZXZpZXdlZCBhdCB0aGUgZXhhY3QgY29tbWl0IGFib3ZlXCIsXG4gICAgXCItIFsgXSBgc3RvcmUvaW5kZXguanNvbmAgZW50cnkgcGlucyBgYXBwcm92ZWRDb21taXRTaGFgIHRvIHRoZSBleGFjdCBjb21taXQgYWJvdmVcIixcbiAgXS5qb2luKFwiXFxuXCIpO1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKFRXRUFLX1NUT1JFX1JFVklFV19JU1NVRV9VUkwpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcInRlbXBsYXRlXCIsIFwidHdlYWstc3RvcmUtcmV2aWV3Lm1kXCIpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcInRpdGxlXCIsIHRpdGxlKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJib2R5XCIsIGJvZHkpO1xuICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bGxDb21taXRTaGEodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gRlVMTF9TSEFfUkUudGVzdCh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlcG9QYXJ0KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXBvID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL1xcLmdpdCQvaSwgXCJcIikucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIik7XG4gIGlmICghR0lUSFVCX1JFUE9fUkUudGVzdChyZXBvKSkgdGhyb3cgbmV3IEVycm9yKFwiR2l0SHViIHJlcG8gbXVzdCBiZSBpbiBvd25lci9yZXBvIGZvcm1cIik7XG4gIHJldHVybiByZXBvO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdG9yZVBsYXRmb3JtcyhpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVQbGF0Zm9ybVtdIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkpIHRocm93IG5ldyBFcnJvcihcIlN0b3JlIGVudHJ5IHBsYXRmb3JtcyBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICBjb25zdCBhbGxvd2VkID0gbmV3IFNldDxUd2Vha1N0b3JlUGxhdGZvcm0+KFtcImRhcndpblwiLCBcIndpbjMyXCIsIFwibGludXhcIl0pO1xuICBjb25zdCBwbGF0Zm9ybXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoaW5wdXQubWFwKCh2YWx1ZSkgPT4ge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIWFsbG93ZWQuaGFzKHZhbHVlIGFzIFR3ZWFrU3RvcmVQbGF0Zm9ybSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgc3RvcmUgcGxhdGZvcm06ICR7U3RyaW5nKHZhbHVlKX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlIGFzIFR3ZWFrU3RvcmVQbGF0Zm9ybTtcbiAgfSkpKTtcbiAgcmV0dXJuIHBsYXRmb3Jtcy5sZW5ndGggPiAwID8gcGxhdGZvcm1zIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBvcHRpb25hbEdpdGh1YlVybCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIXZhbHVlLnRyaW0oKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdXJsID0gbmV3IFVSTCh2YWx1ZSk7XG4gIGlmICh1cmwucHJvdG9jb2wgIT09IFwiaHR0cHM6XCIgfHwgdXJsLmhvc3RuYW1lICE9PSBcImdpdGh1Yi5jb21cIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIHVybC50b1N0cmluZygpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBjb21wYWN0U2V0dGluZ3NUZXh0KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHZhbHVlIHx8IFwiXCIpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc05hdGl2ZVNldHRpbmdzU2VjdGlvbkhlYWRlcnMocm9vdDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgY29uc3QgaGVhZGluZ3MgPSBuZXcgU2V0KFtcIlBlcnNvbmFsXCIsIFwiSW50ZWdyYXRpb25zXCIsIFwiQ29kaW5nXCIsIFwiQXJjaGl2ZWRcIl0pO1xuICByZXR1cm4gQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiZGl2LHNwYW5cIikpLnNvbWUoKGVsKSA9PiB7XG4gICAgaWYgKGVsLmRhdGFzZXQuY29kZXhwcCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghaGVhZGluZ3MuaGFzKGNvbXBhY3RTZXR0aW5nc1RleHQoZWwudGV4dENvbnRlbnQgfHwgXCJcIikpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucyhcInRleHQtdG9rZW4taW5wdXQtcGxhY2Vob2xkZXItZm9yZWdyb3VuZFwiKSB8fFxuICAgICAgZWwuY2xhc3NMaXN0LmNvbnRhaW5zKFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiKSB8fFxuICAgICAgZWwuY2xhc3NOYW1lLmluY2x1ZGVzKFwidGV4dC10b2tlblwiKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVDb2RleFBwU2V0dGluZ3NMYWJlbCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbXBhY3RTZXR0aW5nc1RleHQodmFsdWUpXG4gICAgLnRvTG9jYWxlTG93ZXJDYXNlKClcbiAgICAubm9ybWFsaXplKFwiTkZEXCIpXG4gICAgLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1tcdTIwMTlcdTIwMThgXHUwMEI0XS9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAudHJpbSgpO1xufVxuXG5jb25zdCBDT0RFWFBQX0NPUkVfU0VUVElOR1NfTEFCRUxTID0gW1xuICBcIkdlbmVyYWxcIixcbiAgXCJcdTVFMzhcdTg5QzRcIixcbiAgXCJcdTkwMUFcdTc1MjhcIixcbiAgXCJBcHBlYXJhbmNlXCIsXG4gIFwiXHU1OTE2XHU4OUMyXCIsXG4gIFwiQ29uZmlndXJhdGlvblwiLFxuICBcIlx1OTE0RFx1N0Y2RVwiLFxuICBcIlx1OUVEOFx1OEJBNFx1Njc0M1x1OTY1MFwiLFxuICBcIlBlcnNvbmFsaXphdGlvblwiLFxuICBcIlx1NEUyQVx1NjAyN1x1NTMxNlwiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXG5jb25zdCBDT0RFWFBQX0VYVEVOREVEX1NFVFRJTkdTX0xBQkVMUyA9IFtcbiAgXCJBY2NvdW50XCIsXG4gIFwiXHU4RDI2XHU2MjM3XCIsXG4gIFwiXHU4RDI2XHU1M0Y3XCIsXG4gIFwiR2VuZXJhbFwiLFxuICBcIlx1NUUzOFx1ODlDNFwiLFxuICBcIlx1OTAxQVx1NzUyOFwiLFxuICBcIkFwcGVhcmFuY2VcIixcbiAgXCJcdTU5MTZcdTg5QzJcIixcbiAgXCJDb25maWd1cmF0aW9uXCIsXG4gIFwiXHU5MTREXHU3RjZFXCIsXG4gIFwiXHU5RUQ4XHU4QkE0XHU2NzQzXHU5NjUwXCIsXG4gIFwiUGVyc29uYWxpemF0aW9uXCIsXG4gIFwiXHU0RTJBXHU2MDI3XHU1MzE2XCIsXG4gIFwiS2V5Ym9hcmQgc2hvcnRjdXRzXCIsXG4gIFwiQXJjaGl2ZWQgY2hhdHNcIixcbiAgXCJVc2FnZVwiLFxuICBcIkNvbXB1dGVyIHVzZVwiLFxuICBcIkJyb3dzZXIgdXNlXCIsXG4gIFwiTUNQIHNlcnZlcnNcIixcbiAgXCJNQ1AgU2VydmVyc1wiLFxuICBcIk1DUCBcdTY3MERcdTUyQTFcdTU2NjhcIixcbiAgXCJHaXRcIixcbiAgXCJFbnZpcm9ubWVudHNcIixcbiAgXCJcdTczQUZcdTU4ODNcIixcbiAgXCJDbG91ZCBFbnZpcm9ubWVudHNcIixcbiAgXCJXb3JrdHJlZXNcIixcbiAgXCJDb25uZWN0aW9uc1wiLFxuICBcIlBsdWdpbnNcIixcbiAgXCJTa2lsbHNcIixcbl0ubWFwKG5vcm1hbGl6ZUNvZGV4UHBTZXR0aW5nc0xhYmVsKTtcblxuY29uc3QgQ09ERVhQUF9TRVRUSU5HU19PTkxZX0xBQkVMUyA9IFtcbiAgXCJHZW5lcmFsXCIsXG4gIFwiXHU1RTM4XHU4OUM0XCIsXG4gIFwiXHU5MDFBXHU3NTI4XCIsXG4gIFwiQXBwZWFyYW5jZVwiLFxuICBcIlx1NTkxNlx1ODlDMlwiLFxuICBcIkNvbmZpZ3VyYXRpb25cIixcbiAgXCJcdTkxNERcdTdGNkVcIixcbiAgXCJcdTlFRDhcdThCQTRcdTY3NDNcdTk2NTBcIixcbiAgXCJQZXJzb25hbGl6YXRpb25cIixcbiAgXCJcdTRFMkFcdTYwMjdcdTUzMTZcIixcbiAgXCJLZXlib2FyZCBzaG9ydGN1dHNcIixcbiAgXCJBcmNoaXZlZCBjaGF0c1wiLFxuICBcIlVzYWdlXCIsXG4gIFwiQ29tcHV0ZXIgdXNlXCIsXG4gIFwiQnJvd3NlciB1c2VcIixcbiAgXCJNQ1Agc2VydmVyc1wiLFxuICBcIk1DUCBTZXJ2ZXJzXCIsXG4gIFwiTUNQIFx1NjcwRFx1NTJBMVx1NTY2OFwiLFxuICBcIkdpdFwiLFxuICBcIkVudmlyb25tZW50c1wiLFxuICBcIlx1NzNBRlx1NTg4M1wiLFxuICBcIkNsb3VkIEVudmlyb25tZW50c1wiLFxuICBcIldvcmt0cmVlc1wiLFxuICBcIkNvbm5lY3Rpb25zXCIsXG5dLm1hcChub3JtYWxpemVDb2RleFBwU2V0dGluZ3NMYWJlbCk7XG5cbmNvbnN0IENPREVYUFBfTUFJTl9BUFBfTkFWX0xBQkVMUyA9IFtcbiAgXCJOZXcgY2hhdFwiLFxuICBcIlF1aWNrIGNoYXRcIixcbiAgXCJcdTVGRUJcdTkwMUZcdTVCRjlcdThCRERcIixcbiAgXCJTZWFyY2hcIixcbiAgXCJcdTY0MUNcdTdEMjJcIixcbiAgXCJQbHVnaW5zXCIsXG4gIFwiXHU2M0QyXHU0RUY2XCIsXG4gIFwiQXV0b21hdGlvbnNcIixcbiAgXCJBdXRvbWF0aW9uXCIsXG4gIFwiXHU4MUVBXHU1MkE4XHU1MzE2XCIsXG4gIFwiQ2hhdHNcIixcbiAgXCJDaGF0XCIsXG4gIFwiXHU1QkY5XHU4QkREXCIsXG4gIFwiUHJvamVjdHNcIixcbiAgXCJcdTk4NzlcdTc2RUVcIixcbiAgXCJQaW5uZWRcIixcbiAgXCJTZXR0aW5nc1wiLFxuICBcIlx1OEJCRVx1N0Y2RVwiLFxuICBcIldvcmsgbG9jYWxseVwiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXG5leHBvcnQgZnVuY3Rpb24gY29kZXhQcENvbnRyb2xMYWJlbChlbDogSFRNTEVsZW1lbnQpOiBzdHJpbmcge1xuICByZXR1cm4gbm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwoXG4gICAgZWwuZ2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiKSB8fFxuICAgICAgZWwuZ2V0QXR0cmlidXRlKFwidGl0bGVcIikgfHxcbiAgICAgIGVsLnRleHRDb250ZW50IHx8XG4gICAgICBcIlwiLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29kZXhQcFNldHRpbmdzTGFiZWxzRnJvbShyb290OiBQYXJlbnROb2RlKTogc3RyaW5nW10ge1xuICBjb25zdCBjb250cm9scyA9IEFycmF5LmZyb20oXG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImJ1dHRvbixhLFtyb2xlPSdidXR0b24nXSxbcm9sZT0nbGluayddXCIpLFxuICApO1xuXG4gIHJldHVybiBbXG4gICAgLi4ubmV3IFNldChcbiAgICAgIGNvbnRyb2xzXG4gICAgICAgIC5tYXAoY29kZXhQcENvbnRyb2xMYWJlbClcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKSxcbiAgICApLFxuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29kZXhQcFNldHRpbmdzTGFiZWxTY29yZShsYWJlbHM6IHN0cmluZ1tdKTogeyBjb3JlOiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfSB7XG4gIGNvbnN0IGNvcmUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdG90YWwgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IGxhYmVsIG9mIGxhYmVscykge1xuICAgIGZvciAoY29uc3QgbWFya2VyIG9mIENPREVYUFBfQ09SRV9TRVRUSU5HU19MQUJFTFMpIHtcbiAgICAgIGlmIChjb2RleFBwTGFiZWxNYXRjaGVzTWFya2VyKGxhYmVsLCBtYXJrZXIpKSBjb3JlLmFkZChtYXJrZXIpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbWFya2VyIG9mIENPREVYUFBfRVhURU5ERURfU0VUVElOR1NfTEFCRUxTKSB7XG4gICAgICBpZiAoY29kZXhQcExhYmVsTWF0Y2hlc01hcmtlcihsYWJlbCwgbWFya2VyKSkgdG90YWwuYWRkKG1hcmtlcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgY29yZTogY29yZS5zaXplLCB0b3RhbDogdG90YWwuc2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBjb2RleFBwTGFiZWxNYXRjaGVzTWFya2VyKGxhYmVsOiBzdHJpbmcsIG1hcmtlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBsYWJlbCA9PT0gbWFya2VyIHx8IGxhYmVsLmluY2x1ZGVzKG1hcmtlcik7XG59XG5cbmZ1bmN0aW9uIGNvZGV4UHBNYXJrZXJDb3VudChsYWJlbHM6IHN0cmluZ1tdLCBtYXJrZXJzOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IG1hdGNoZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBsYWJlbCBvZiBsYWJlbHMpIHtcbiAgICBmb3IgKGNvbnN0IG1hcmtlciBvZiBtYXJrZXJzKSB7XG4gICAgICBpZiAoY29kZXhQcExhYmVsTWF0Y2hlc01hcmtlcihsYWJlbCwgbWFya2VyKSkgbWF0Y2hlZC5hZGQobWFya2VyKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZWQuc2l6ZTtcbn1cblxuZnVuY3Rpb24gaGFzQ29kZXhQcFNldHRpbmdzT25seVNpZ25hbChsYWJlbHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RleFBwTWFya2VyQ291bnQobGFiZWxzLCBDT0RFWFBQX1NFVFRJTkdTX09OTFlfTEFCRUxTKSA+IDA7XG59XG5cbmZ1bmN0aW9uIGhhc01haW5BcHBTaWRlYmFyU2lnbmFscyhsYWJlbHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RleFBwTWFya2VyQ291bnQobGFiZWxzLCBDT0RFWFBQX01BSU5fQVBQX05BVl9MQUJFTFMpID49IDI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0KGxhYmVsczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgY29uc3Qgc2NvcmUgPSBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlKGxhYmVscyk7XG4gIHJldHVybiBzY29yZS5jb3JlID49IDIgJiYgc2NvcmUudG90YWwgPj0gMztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvZGV4UHBWaXNpYmxlQm94KGVsOiBIVE1MRWxlbWVudCk6IERPTVJlY3QgfCBudWxsIHtcbiAgaWYgKCFlbC5pc0Nvbm5lY3RlZCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gIGlmIChzdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fCBzdHlsZS52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGlmIChyZWN0LndpZHRoIDw9IDAgfHwgcmVjdC5oZWlnaHQgPD0gMCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiByZWN0O1xufVxuXG5jb25zdCBGT1JCSURERU5fU0VUVElOR1NfU0lERUJBUl9TRUxFQ1RPUiA9IFtcbiAgXCJbZGF0YS1jb21wb3Nlci1vdmVybGF5LWZsb2F0aW5nLXVpPSd0cnVlJ11cIixcbiAgXCJbZGF0YS1jb2RleHBwLXNsYXNoLW1lbnU9J3RydWUnXVwiLFxuICBcIltkYXRhLWNvZGV4cHAtb3ZlcmxheS1ub2lzZT0ndHJ1ZSddXCIsXG4gIFwiLmNvbXBvc2VyLWhvbWUtdG9wLW1lbnVcIixcbiAgXCIudmVydGljYWwtc2Nyb2xsLWZhZGUtbWFza1wiLFxuICBcIltjbGFzcyo9J1tjb250YWluZXItbmFtZTpob21lLW1haW4tY29udGVudF0nXVwiLFxuXS5qb2luKFwiLFwiKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRm9yYmlkZGVuU2V0dGluZ3NTaWRlYmFyU3VyZmFjZShub2RlOiBFbGVtZW50IHwgbnVsbCk6IGJvb2xlYW4ge1xuICBpZiAoIW5vZGUpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgZWwgPSBub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgPyBub2RlIDogbm9kZS5wYXJlbnRFbGVtZW50O1xuICBpZiAoIWVsKSByZXR1cm4gZmFsc2U7XG4gIGlmIChlbC5jbG9zZXN0KEZPUkJJRERFTl9TRVRUSU5HU19TSURFQkFSX1NFTEVDVE9SKSkgcmV0dXJuIHRydWU7XG4gIGlmIChlbC5xdWVyeVNlbGVjdG9yKFwiW2RhdGEtbGlzdC1uYXZpZ2F0aW9uLWl0ZW09J3RydWUnXSwgW2NtZGstaXRlbV1cIikpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShlbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgY29uc3QgcmVjdCA9IGNvZGV4UHBWaXNpYmxlQm94KGVsKTtcbiAgaWYgKCFyZWN0KSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gQ3VycmVudCBDb2RleCBTZXR0aW5ncyBzaWRlYmFyOiBsZWZ0IGNvbHVtbiwgbm90IHRoZSBtYWluIGNvbnRlbnQgcGFuZWwuXG4gIGlmIChyZWN0LndpZHRoIDwgMTIwIHx8IHJlY3Qud2lkdGggPiA2MjApIHJldHVybiBmYWxzZTtcbiAgaWYgKHJlY3QuaGVpZ2h0IDwgODApIHJldHVybiBmYWxzZTtcbiAgaWYgKHJlY3QubGVmdCA+IHdpbmRvdy5pbm5lcldpZHRoICogMC42NSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGxhYmVscyA9IGNvZGV4UHBTZXR0aW5nc0xhYmVsc0Zyb20oZWwpO1xuICBpZiAoaGFzTWFpbkFwcFNpZGViYXJTaWduYWxzKGxhYmVscykgJiYgIWhhc0NvZGV4UHBTZXR0aW5nc09ubHlTaWduYWwobGFiZWxzKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0KGxhYmVscyk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ0ljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk0zIDVoOU0xNSA1aDJNMyAxMGgyTTggMTBoOU0zIDE1aDExTTE3IDE1aDBcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xuICAgIGA8Y2lyY2xlIGN4PVwiMTNcIiBjeT1cIjVcIiByPVwiMS42XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcbiAgICBgPGNpcmNsZSBjeD1cIjZcIiBjeT1cIjEwXCIgcj1cIjEuNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIi8+YCArXG4gICAgYDxjaXJjbGUgY3g9XCIxNVwiIGN5PVwiMTVcIiByPVwiMS42XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcbiAgICBgPC9zdmc+YFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHdlYWtzSWNvblN2ZygpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tc20gaW5saW5lLWJsb2NrIGFsaWduLW1pZGRsZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTEwIDIuNSBMMTEuNCA4LjYgTDE3LjUgMTAgTDExLjQgMTEuNCBMMTAgMTcuNSBMOC42IDExLjQgTDIuNSAxMCBMOC42IDguNiBaXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcbiAgICBgPHBhdGggZD1cIk0xNS41IDMgTDE2IDUgTDE4IDUuNSBMMTYgNiBMMTUuNSA4IEwxNSA2IEwxMyA1LjUgTDE1IDUgWlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIiBvcGFjaXR5PVwiMC43XCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk00IDguMiA1LjEgNC41QTEuNSAxLjUgMCAwIDEgNi41NSAzLjRoNi45YTEuNSAxLjUgMCAwIDEgMS40NSAxLjFMMTYgOC4yXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNNC41IDhoMTF2Ny41QTEuNSAxLjUgMCAwIDEgMTQgMTdINmExLjUgMS41IDAgMCAxLTEuNS0xLjVWOFpcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPHBhdGggZD1cIk03LjUgOHYxYTIuNSAyLjUgMCAwIDAgNSAwVjhcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0UGFnZUljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk01IDNoN2wzIDN2MTFhMSAxIDAgMCAxLTEgMUg1YTEgMSAwIDAgMS0xLTFWNGExIDEgMCAwIDEgMS0xWlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTEyIDN2M2ExIDEgMCAwIDAgMSAxaDJcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPHBhdGggZD1cIk03IDExaDZNNyAxNGg0XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaEljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiBjbGFzcz1cImljb24teHNcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk00LjQgOS4zNUE1LjY1IDUuNjUgMCAwIDEgMTQgNS4zTDE1Ljc1IDdNMTUuNzUgMy43NVY3aC0zLjI1XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTE1LjYgMTAuNjVBNS42NSA1LjY1IDAgMCAxIDYgMTQuN0w0LjI1IDEzTTQuMjUgMTYuMjVWMTNINy41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFN2Z0h0bWwocGFyZW50OiBIVE1MRWxlbWVudCwgc3ZnOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBzdmdFbGVtZW50KHN2Zyk7XG4gIGlmIChlbCkgcGFyZW50LmFwcGVuZENoaWxkKGVsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN2Z0VsZW1lbnQoc3ZnOiBzdHJpbmcpOiBFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBzdmcudHJpbSgpO1xuICBjb25zdCBlbCA9IHRlbXBsYXRlLmNvbnRlbnQuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gIGlmICghZWwgfHwgZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpICE9PSBcInN2Z1wiKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGVsO1xufVxuIiwgIi8qKlxuICogUmVuZGVyZXItc2lkZSB0d2VhayBob3N0LiBXZTpcbiAqICAgMS4gQXNrIG1haW4gZm9yIHRoZSB0d2VhayBsaXN0ICh3aXRoIHJlc29sdmVkIGVudHJ5IHBhdGgpLlxuICogICAyLiBGb3IgZWFjaCByZW5kZXJlci1zY29wZWQgKG9yIFwiYm90aFwiKSB0d2VhaywgZmV0Y2ggaXRzIHNvdXJjZSB2aWEgSVBDXG4gKiAgICAgIGFuZCBleGVjdXRlIGl0IGFzIGEgQ29tbW9uSlMtc2hhcGVkIGZ1bmN0aW9uLlxuICogICAzLiBQcm92aWRlIGl0IHRoZSByZW5kZXJlciBoYWxmIG9mIHRoZSBBUEkuXG4gKlxuICogQ29kZXggcnVucyB0aGUgcmVuZGVyZXIgd2l0aCBzYW5kYm94OiB0cnVlLCBzbyBOb2RlJ3MgYHJlcXVpcmUoKWAgaXNcbiAqIHJlc3RyaWN0ZWQgdG8gYSB0aW55IHdoaXRlbGlzdCAoZWxlY3Ryb24gKyBhIGZldyBwb2x5ZmlsbHMpLiBUaGF0IG1lYW5zIHdlXG4gKiBjYW5ub3QgYHJlcXVpcmUoKWAgYXJiaXRyYXJ5IHR3ZWFrIGZpbGVzIGZyb20gZGlzay4gSW5zdGVhZCB3ZSBwdWxsIHRoZVxuICogc291cmNlIHN0cmluZyBmcm9tIG1haW4gYW5kIGV2YWx1YXRlIGl0IHdpdGggYG5ldyBGdW5jdGlvbmAgaW5zaWRlIHRoZVxuICogcHJlbG9hZCBjb250ZXh0LiBUd2VhayBhdXRob3JzIHdobyBuZWVkIG5wbSBkZXBzIG11c3QgYnVuZGxlIHRoZW0gaW4uXG4gKi9cblxuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IHJlZ2lzdGVyU2VjdGlvbiwgcmVnaXN0ZXJQYWdlLCBjbGVhclNlY3Rpb25zLCBzZXRMaXN0ZWRUd2Vha3MgfSBmcm9tIFwiLi9zZXR0aW5ncy1pbmplY3RvclwiO1xuaW1wb3J0IHsgZmliZXJGb3JOb2RlIH0gZnJvbSBcIi4vcmVhY3QtaG9va1wiO1xuaW1wb3J0IHsgd2FpdEZvckVsZW1lbnQsIGNhbmNlbEFsbEVsZW1lbnRXYWl0ZXJzIH0gZnJvbSBcIi4vZWxlbWVudC13YWl0ZXJcIjtcbmltcG9ydCB7IGNyZWF0ZVR3ZWFrTW9kdWxlTG9hZGVyIH0gZnJvbSBcIi4vdHdlYWstbW9kdWxlLWxvYWRlclwiO1xuaW1wb3J0IHsgZGlzcG9zZVNpZGViYXJBY3Rpb25zRm9yVHdlYWssIHJlbmRlcmVyU2lkZWJhckFwaSB9IGZyb20gXCIuL21haW4tc2lkZWJhci1hY3Rpb25zXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENvZGV4Q2RwU3RhdHVzLFxuICBDb2RleENkcFRhcmdldCxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMsXG4gIENvZGV4TW9kZWxPYmplY3RSZXN1bHQsXG4gIENvZGV4TW9kZWxUZXh0UmVzdWx0LFxuICBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXMsXG4gIENvZGV4UnVudGltZUluZm8sXG4gIENvZGV4Vmlld1JlZixcbiAgQ29kZXhXaW5kb3dSZWYsXG4gIE5hdGl2ZUhlbHBlclJlZixcbiAgTmF0aXZlTW9kdWxlS2luZCxcbiAgTmF0aXZlTW9kdWxlUmVmLFxuICBOYXRpdmVQYW5lbFJlZixcbiAgTmF0aXZlVmlld1JlZixcbiAgVHdlYWtNYW5pZmVzdCxcbiAgVHdlYWtBcGksXG4gIFJlYWN0RmliZXJOb2RlLFxuICBUd2Vhayxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuaW50ZXJmYWNlIExpc3RlZFR3ZWFrIHtcbiAgbWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3Q7XG4gIGVudHJ5OiBzdHJpbmc7XG4gIGRpcjogc3RyaW5nO1xuICBlbnRyeUV4aXN0czogYm9vbGVhbjtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgdXBkYXRlOiB7XG4gICAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gICAgcmVwbzogc3RyaW5nO1xuICAgIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gICAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgICBsYXRlc3RUYWc6IHN0cmluZyB8IG51bGw7XG4gICAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gICAgZXJyb3I/OiBzdHJpbmc7XG4gIH0gfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgVXNlclBhdGhzIHtcbiAgdXNlclJvb3Q6IHN0cmluZztcbiAgcnVudGltZURpcjogc3RyaW5nO1xuICB0d2Vha3NEaXI6IHN0cmluZztcbiAgbG9nRGlyOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBFbGVjdHJvbkJyaWRnZSB7XG4gIGdldEJ1aWxkRmxhdm9yPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbiAgdXNlc093bEFwcFNoZWxsPzogKCkgPT4gYm9vbGVhbjtcbn1cblxuY29uc3QgbG9hZGVkID0gbmV3IE1hcDxzdHJpbmcsIHsgc3RvcD86ICgpID0+IHZvaWQgfT4oKTtcbnR5cGUgTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIgPSAobWVzc2FnZTogdW5rbm93bikgPT4gdW5rbm93biB8IHVuZGVmaW5lZDtcbmNvbnN0IG1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycyA9IG5ldyBTZXQ8TWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI+KCk7XG5cbmluc3RhbGxCcmlkZ2VIb29rcygpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnRUd2Vha0hvc3QoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHR3ZWFrcyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmxpc3QtdHdlYWtzXCIpKSBhcyBMaXN0ZWRUd2Vha1tdO1xuICBjb25zdCBwYXRocyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnVzZXItcGF0aHNcIikpIGFzIFVzZXJQYXRocztcbiAgLy8gUHVzaCB0aGUgbGlzdCB0byB0aGUgc2V0dGluZ3MgaW5qZWN0b3Igc28gdGhlIFR3ZWFrcyBwYWdlIGNhbiByZW5kZXJcbiAgLy8gY2FyZHMgZXZlbiBiZWZvcmUgYW55IHR3ZWFrJ3Mgc3RhcnQoKSBydW5zIChhbmQgZm9yIGRpc2FibGVkIHR3ZWFrc1xuICAvLyB0aGF0IHdlIG5ldmVyIGxvYWQpLlxuICBzZXRMaXN0ZWRUd2Vha3ModHdlYWtzKTtcbiAgLy8gU3Rhc2ggZm9yIHRoZSBzZXR0aW5ncyBpbmplY3RvcidzIGVtcHR5LXN0YXRlIG1lc3NhZ2UuXG4gICh3aW5kb3cgYXMgdW5rbm93biBhcyB7IF9fY29kZXhwcF90d2Vha3NfZGlyX18/OiBzdHJpbmcgfSkuX19jb2RleHBwX3R3ZWFrc19kaXJfXyA9XG4gICAgcGF0aHMudHdlYWtzRGlyO1xuXG4gIGZvciAoY29uc3QgdCBvZiB0d2Vha3MpIHtcbiAgICBpZiAodC5tYW5pZmVzdC5zY29wZSA9PT0gXCJtYWluXCIpIGNvbnRpbnVlO1xuICAgIGlmICghdC5lbnRyeUV4aXN0cykgY29udGludWU7XG4gICAgaWYgKCF0LmVuYWJsZWQpIGNvbnRpbnVlO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBsb2FkVHdlYWsodCwgcGF0aHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHR3ZWFrIGxvYWQgZmFpbGVkOlwiLCB0Lm1hbmlmZXN0LmlkLCBlKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlwY1JlbmRlcmVyLnNlbmQoXG4gICAgICAgICAgXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsXG4gICAgICAgICAgXCJlcnJvclwiLFxuICAgICAgICAgIFwidHdlYWsgbG9hZCBmYWlsZWQ6IFwiICsgdC5tYW5pZmVzdC5pZCArIFwiOiBcIiArIFN0cmluZygoZSBhcyBFcnJvcik/LnN0YWNrID8/IGUpLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUuaW5mbyhcbiAgICBgW2NvZGV4LXBsdXNwbHVzXSByZW5kZXJlciBob3N0IGxvYWRlZCAke2xvYWRlZC5zaXplfSB0d2VhayhzKTpgLFxuICAgIFsuLi5sb2FkZWQua2V5cygpXS5qb2luKFwiLCBcIikgfHwgXCIobm9uZSlcIixcbiAgKTtcbiAgaXBjUmVuZGVyZXIuc2VuZChcbiAgICBcImNvZGV4cHA6cHJlbG9hZC1sb2dcIixcbiAgICBcImluZm9cIixcbiAgICBgcmVuZGVyZXIgaG9zdCBsb2FkZWQgJHtsb2FkZWQuc2l6ZX0gdHdlYWsocyk6ICR7Wy4uLmxvYWRlZC5rZXlzKCldLmpvaW4oXCIsIFwiKSB8fCBcIihub25lKVwifWAsXG4gICk7XG59XG5cbi8qKlxuICogU3RvcCBldmVyeSByZW5kZXJlci1zY29wZSB0d2VhayBzbyBhIHN1YnNlcXVlbnQgYHN0YXJ0VHdlYWtIb3N0KClgIHdpbGxcbiAqIHJlLWV2YWx1YXRlIGZyZXNoIHNvdXJjZS4gTW9kdWxlIGNhY2hlIGlzbid0IHJlbGV2YW50IHNpbmNlIHdlIGV2YWxcbiAqIHNvdXJjZSBzdHJpbmdzIGRpcmVjdGx5IFx1MjAxNCBlYWNoIGxvYWQgY3JlYXRlcyBhIGZyZXNoIHNjb3BlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVhcmRvd25Ud2Vha0hvc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgW2lkLCB0XSBvZiBsb2FkZWQpIHtcbiAgICB0cnkge1xuICAgICAgdC5zdG9wPy4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbY29kZXgtcGx1c3BsdXNdIHR3ZWFrIHN0b3AgZmFpbGVkOlwiLCBpZCwgZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWRpc3Bvc2UtdHdlYWtcIiwgaWQpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtZGlzcG9zZS10d2Vha1wiLCBpZCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgZGlzcG9zZVNpZGViYXJBY3Rpb25zRm9yVHdlYWsoaWQpO1xuICAgIH1cbiAgfVxuICBsb2FkZWQuY2xlYXIoKTtcbiAgY2FuY2VsQWxsRWxlbWVudFdhaXRlcnMoXCJ0d2VhayBob3N0IHRlYXJkb3duXCIpO1xuICBjbGVhclNlY3Rpb25zKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRUd2Vhayh0OiBMaXN0ZWRUd2VhaywgcGF0aHM6IFVzZXJQYXRocyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzb3VyY2UgPSAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgIFwiY29kZXhwcDpyZWFkLXR3ZWFrLXNvdXJjZVwiLFxuICAgIHQuZW50cnksXG4gICkpIGFzIHN0cmluZztcblxuICAvLyBFdmFsdWF0ZSBhcyBDSlMtc2hhcGVkOiBwcm92aWRlIG1vZHVsZS9leHBvcnRzL2FwaS4gVHdlYWsgY29kZSBtYXkgdXNlXG4gIC8vIGBtb2R1bGUuZXhwb3J0cyA9IHsgc3RhcnQsIHN0b3AgfWAgb3IgYGV4cG9ydHMuc3RhcnQgPSAuLi5gIG9yIHB1cmUgRVNNXG4gIC8vIGRlZmF1bHQgZXhwb3J0IHNoYXBlICh3ZSBhY2NlcHQgYm90aCkuXG4gIGNvbnN0IGxvYWRlciA9IGNyZWF0ZVR3ZWFrTW9kdWxlTG9hZGVyKHtcbiAgICBtYW5pZmVzdElkOiB0Lm1hbmlmZXN0LmlkLFxuICAgIGVudHJ5OiB0LmVudHJ5LFxuICAgIGRpcjogdC5kaXIsXG4gICAgcmVhZFNvdXJjZTogcmVhZFR3ZWFrU291cmNlU3luYyxcbiAgICBmYWxsYmFja1JlcXVpcmU6IHJlbmRlcmVyRmFsbGJhY2tSZXF1aXJlLFxuICAgIGNvbnNvbGUsXG4gIH0pO1xuICBjb25zdCBtb2QgPSBsb2FkZXIubG9hZEVudHJ5KHNvdXJjZSkgYXMgeyBkZWZhdWx0PzogVHdlYWsgfSAmIFR3ZWFrO1xuICBjb25zdCB0d2VhazogVHdlYWsgPSAobW9kIGFzIHsgZGVmYXVsdD86IFR3ZWFrIH0pLmRlZmF1bHQgPz8gKG1vZCBhcyBUd2Vhayk7XG4gIGlmICh0eXBlb2YgdHdlYWs/LnN0YXJ0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrICR7dC5tYW5pZmVzdC5pZH0gaGFzIG5vIHN0YXJ0KClgKTtcbiAgfVxuICBjb25zdCBhcGkgPSBtYWtlUmVuZGVyZXJBcGkodC5tYW5pZmVzdCwgcGF0aHMpO1xuICBhd2FpdCB0d2Vhay5zdGFydChhcGkpO1xuICBsb2FkZWQuc2V0KHQubWFuaWZlc3QuaWQsIHsgc3RvcDogdHdlYWsuc3RvcD8uYmluZCh0d2VhaykgfSk7XG59XG5cbmZ1bmN0aW9uIHJlYWRUd2Vha1NvdXJjZVN5bmMoZW50cnlQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXN1bHQgPSBpcGNSZW5kZXJlci5zZW5kU3luYyhcImNvZGV4cHA6cmVhZC10d2Vhay1zb3VyY2Utc3luY1wiLCBlbnRyeVBhdGgpIGFzXG4gICAgfCB7IG9rOiB0cnVlOyBzb3VyY2U6IHN0cmluZyB9XG4gICAgfCB7IG9rOiBmYWxzZTsgZXJyb3I/OiBzdHJpbmcgfTtcbiAgaWYgKHJlc3VsdD8ub2sgPT09IHRydWUpIHJldHVybiByZXN1bHQuc291cmNlO1xuICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0Py5lcnJvciB8fCBgVW5hYmxlIHRvIHJlYWQgdHdlYWsgc291cmNlOiAke2VudHJ5UGF0aH1gKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJGYWxsYmFja1JlcXVpcmUocmVxdWVzdDogc3RyaW5nKTogdW5rbm93biB7XG4gIGNvbnN0IGZhbGxiYWNrID0gKGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7IHJlcXVpcmU/OiAoaWQ6IHN0cmluZykgPT4gdW5rbm93biB9KS5yZXF1aXJlO1xuICBpZiAodHlwZW9mIGZhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxsYmFjayhyZXF1ZXN0KTtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIGBSZW5kZXJlciB0d2VhayByZXF1aXJlIG9ubHkgc3VwcG9ydHMgcmVsYXRpdmUgZmlsZXM7IGJ1bmRsZSBkZXBlbmRlbmN5IFwiJHtyZXF1ZXN0fVwiIGludG8gdGhlIHR3ZWFrIGVudHJ5YCxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlbmRlcmVyQXBpKG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0LCBwYXRoczogVXNlclBhdGhzKTogVHdlYWtBcGkge1xuICBjb25zdCBpZCA9IG1hbmlmZXN0LmlkO1xuICBjb25zdCBsb2cgPSAobGV2ZWw6IFwiZGVidWdcIiB8IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIC4uLmE6IHVua25vd25bXSkgPT4ge1xuICAgIGNvbnN0IGNvbnNvbGVGbiA9XG4gICAgICBsZXZlbCA9PT0gXCJkZWJ1Z1wiID8gY29uc29sZS5kZWJ1Z1xuICAgICAgOiBsZXZlbCA9PT0gXCJ3YXJuXCIgPyBjb25zb2xlLndhcm5cbiAgICAgIDogbGV2ZWwgPT09IFwiZXJyb3JcIiA/IGNvbnNvbGUuZXJyb3JcbiAgICAgIDogY29uc29sZS5sb2c7XG4gICAgY29uc29sZUZuKGBbY29kZXgtcGx1c3BsdXNdWyR7aWR9XWAsIC4uLmEpO1xuICAgIC8vIEFsc28gbWlycm9yIHRvIG1haW4ncyBsb2cgZmlsZSBzbyB3ZSBjYW4gZGlhZ25vc2UgdHdlYWsgYmVoYXZpb3JcbiAgICAvLyB3aXRob3V0IGF0dGFjaGluZyBEZXZUb29scy4gU3RyaW5naWZ5IGVhY2ggYXJnIGRlZmVuc2l2ZWx5LlxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGEubWFwKCh2KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHY7XG4gICAgICAgIGlmICh2IGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiBgJHt2Lm5hbWV9OiAke3YubWVzc2FnZX1gO1xuICAgICAgICB0cnkgeyByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7IH0gY2F0Y2ggeyByZXR1cm4gU3RyaW5nKHYpOyB9XG4gICAgICB9KTtcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoXG4gICAgICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxuICAgICAgICBsZXZlbCxcbiAgICAgICAgYFt0d2VhayAke2lkfV0gJHtwYXJ0cy5qb2luKFwiIFwiKX1gLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8qIHN3YWxsb3cgXHUyMDE0IG5ldmVyIGxldCBsb2dnaW5nIGJyZWFrIGEgdHdlYWsgKi9cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBtYW5pZmVzdCxcbiAgICBwcm9jZXNzOiBcInJlbmRlcmVyXCIsXG4gICAgbG9nOiB7XG4gICAgICBkZWJ1ZzogKC4uLmEpID0+IGxvZyhcImRlYnVnXCIsIC4uLmEpLFxuICAgICAgaW5mbzogKC4uLmEpID0+IGxvZyhcImluZm9cIiwgLi4uYSksXG4gICAgICB3YXJuOiAoLi4uYSkgPT4gbG9nKFwid2FyblwiLCAuLi5hKSxcbiAgICAgIGVycm9yOiAoLi4uYSkgPT4gbG9nKFwiZXJyb3JcIiwgLi4uYSksXG4gICAgfSxcbiAgICBzdG9yYWdlOiByZW5kZXJlclN0b3JhZ2UoaWQpLFxuICAgIHNldHRpbmdzOiB7XG4gICAgICByZWdpc3RlcjogKHMpID0+IHJlZ2lzdGVyU2VjdGlvbih7IC4uLnMsIGlkOiBgJHtpZH06JHtzLmlkfWAgfSksXG4gICAgICByZWdpc3RlclBhZ2U6IChwKSA9PlxuICAgICAgICByZWdpc3RlclBhZ2UoaWQsIG1hbmlmZXN0LCB7IC4uLnAsIGlkOiBgJHtpZH06JHtwLmlkfWAgfSksXG4gICAgfSxcbiAgICByZWFjdDoge1xuICAgICAgZ2V0RmliZXI6IChuKSA9PiBmaWJlckZvck5vZGUobikgYXMgUmVhY3RGaWJlck5vZGUgfCBudWxsLFxuICAgICAgZmluZE93bmVyQnlOYW1lOiAobiwgbmFtZSkgPT4ge1xuICAgICAgICBsZXQgZiA9IGZpYmVyRm9yTm9kZShuKSBhcyBSZWFjdEZpYmVyTm9kZSB8IG51bGw7XG4gICAgICAgIHdoaWxlIChmKSB7XG4gICAgICAgICAgY29uc3QgdCA9IGYudHlwZSBhcyB7IGRpc3BsYXlOYW1lPzogc3RyaW5nOyBuYW1lPzogc3RyaW5nIH0gfCBudWxsO1xuICAgICAgICAgIGlmICh0ICYmICh0LmRpc3BsYXlOYW1lID09PSBuYW1lIHx8IHQubmFtZSA9PT0gbmFtZSkpIHJldHVybiBmO1xuICAgICAgICAgIGYgPSBmLnJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG4gICAgICB3YWl0Rm9yRWxlbWVudCxcbiAgICB9LFxuICAgIGJyaWRnZToge1xuICAgICAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI6ICh0cmFuc2Zvcm1lcikgPT4ge1xuICAgICAgICBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuYWRkKHRyYW5zZm9ybWVyKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICAgICAgICBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuZGVsZXRlKHRyYW5zZm9ybWVyKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9LFxuICAgIGlwYzoge1xuICAgICAgb246IChjLCBoKSA9PiB7XG4gICAgICAgIGNvbnN0IHdyYXBwZWQgPSAoX2U6IHVua25vd24sIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gaCguLi5hcmdzKTtcbiAgICAgICAgaXBjUmVuZGVyZXIub24oYGNvZGV4cHA6JHtpZH06JHtjfWAsIHdyYXBwZWQpO1xuICAgICAgICByZXR1cm4gKCkgPT4gaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoYGNvZGV4cHA6JHtpZH06JHtjfWAsIHdyYXBwZWQpO1xuICAgICAgfSxcbiAgICAgIHNlbmQ6IChjLCAuLi5hcmdzKSA9PiBpcGNSZW5kZXJlci5zZW5kKGBjb2RleHBwOiR7aWR9OiR7Y31gLCAuLi5hcmdzKSxcbiAgICAgIGludm9rZTogPFQ+KGM6IHN0cmluZywgLi4uYXJnczogdW5rbm93bltdKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoYGNvZGV4cHA6JHtpZH06JHtjfWAsIC4uLmFyZ3MpIGFzIFByb21pc2U8VD4sXG4gICAgfSxcbiAgICBmczogcmVuZGVyZXJGcyhpZCwgcGF0aHMpLFxuICAgIG1vZGVsOiByZW5kZXJlck1vZGVsQXBpKGlkKSxcbiAgICBjb2RleDogcmVuZGVyZXJDb2RleEFwaShpZCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxCcmlkZ2VIb29rcygpOiB2b2lkIHtcbiAgY29uc3QgaG9va3MgPSB7XG4gICAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIodHJhbnNmb3JtZXI6IE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyKSB7XG4gICAgICBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuYWRkKHRyYW5zZm9ybWVyKTtcbiAgICAgIHJldHVybiAoKSA9PiBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuZGVsZXRlKHRyYW5zZm9ybWVyKTtcbiAgICB9LFxuICAgIHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhtZXNzYWdlOiB1bmtub3duKSB7XG4gICAgICBsZXQgY3VycmVudCA9IG1lc3NhZ2U7XG4gICAgICBmb3IgKGNvbnN0IHRyYW5zZm9ybWVyIG9mIEFycmF5LmZyb20obWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzKSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSB0cmFuc2Zvcm1lcihjdXJyZW50KTtcbiAgICAgICAgICBpZiAobmV4dCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50ID0gbmV4dDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbY29kZXgtcGx1c3BsdXNdIG1lc3NhZ2UtZnJvbS12aWV3IHRyYW5zZm9ybWVyIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlwY1JlbmRlcmVyLnNlbmQoXG4gICAgICAgICAgICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxuICAgICAgICAgICAgICBcIndhcm5cIixcbiAgICAgICAgICAgICAgXCJtZXNzYWdlLWZyb20tdmlldyB0cmFuc2Zvcm1lciBmYWlsZWQ6IFwiICsgU3RyaW5nKChlcnJvciBhcyBFcnJvcik/LnN0YWNrID8/IGVycm9yKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY3VycmVudDtcbiAgICB9LFxuICB9O1xuICBjb25zdCB0YXJnZXQgPSB3aW5kb3cgYXMgdW5rbm93biBhcyB7XG4gICAgX19jb2RleFBsdXNQbHVzQnJpZGdlSG9va3M/OiB0eXBlb2YgaG9va3M7XG4gICAgX19jb2RleHBwQnJpZGdlSG9va3M/OiB0eXBlb2YgaG9va3M7XG4gIH07XG4gIHRhcmdldC5fX2NvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcyA9IGhvb2tzO1xuICB0YXJnZXQuX19jb2RleHBwQnJpZGdlSG9va3MgPSBob29rcztcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJDb2RleEFwaSh0d2Vha0lkOiBzdHJpbmcpOiBOb25OdWxsYWJsZTxUd2Vha0FwaVtcImNvZGV4XCJdPiB7XG4gIHJldHVybiB7XG4gICAgcnVudGltZToge1xuICAgICAgZ2V0SW5mbzogYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC1ydW50aW1lLWluZm9cIikgYXMgQ29kZXhSdW50aW1lSW5mbztcbiAgICAgICAgY29uc3QgYnJpZGdlID0gcmVuZGVyZXJFbGVjdHJvbkJyaWRnZSgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLmluZm8sXG4gICAgICAgICAgYnVpbGRGbGF2b3I6IGJyaWRnZT8uZ2V0QnVpbGRGbGF2b3I/LigpID8/IGluZm8uYnVpbGRGbGF2b3IsXG4gICAgICAgICAgdXNlc093bEFwcFNoZWxsOiBicmlkZ2U/LnVzZXNPd2xBcHBTaGVsbD8uKCkgPz8gaW5mby51c2VzT3dsQXBwU2hlbGwsXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgZ2V0Q2FwYWJpbGl0aWVzOiAoKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXJ1bnRpbWUtY2FwYWJpbGl0aWVzXCIpIGFzIFByb21pc2U8Q29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzPixcbiAgICB9LFxuICAgIHNpZGViYXI6IHJlbmRlcmVyU2lkZWJhckFwaSh0d2Vha0lkKSxcbiAgICB3aW5kb3dzOiB7XG4gICAgICBjcmVhdGU6IChvcHRpb25zKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1jcmVhdGVcIiwgb3B0aW9ucykgYXMgUHJvbWlzZTxDb2RleFdpbmRvd1JlZj4sXG4gICAgICBnZXRQcmltYXJ5OiAoKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1wcmltYXJ5XCIpIGFzIFByb21pc2U8Q29kZXhXaW5kb3dSZWYgfCBudWxsPixcbiAgICAgIGZvY3VzOiAod2luZG93SWQpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWZvY3VzXCIsIHdpbmRvd0lkKSBhcyBQcm9taXNlPGJvb2xlYW4+LFxuICAgICAgc2hvdzogKHdpbmRvd0lkKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1zaG93XCIsIHdpbmRvd0lkKSBhcyBQcm9taXNlPGJvb2xlYW4+LFxuICAgIH0sXG4gICAgdmlld3M6IHtcbiAgICAgIGNyZWF0ZTogYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgcmVmID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICAgIFwiY29kZXhwcDpjb2RleC12aWV3LWNyZWF0ZVwiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHdlYkNvbnRlbnRzSWQ6IG51bWJlcjsgcGFyZW50V2luZG93SWQ6IG51bWJlciB8IG51bGwgfTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyQ29kZXhWaWV3UmVmKHR3ZWFrSWQsIHJlZi5pZCwgcmVmLndlYkNvbnRlbnRzSWQsIHJlZi5wYXJlbnRXaW5kb3dJZCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgY2RwOiB7XG4gICAgICBnZXRTdGF0dXM6ICgpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtY2RwLXN0YXR1c1wiKSBhcyBQcm9taXNlPENvZGV4Q2RwU3RhdHVzPixcbiAgICAgIGxpc3RUYXJnZXRzOiAoKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LWNkcC10YXJnZXRzXCIpIGFzIFByb21pc2U8Q29kZXhDZHBUYXJnZXRbXT4sXG4gICAgfSxcbiAgICBuYXRpdmU6IHtcbiAgICAgIGxvYWRNb2R1bGU6IGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgICBcImNvZGV4cHA6bmF0aXZlLWxvYWQtbW9kdWxlXCIsXG4gICAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgICBvcHRpb25zLFxuICAgICAgICApIGFzIHsgaWQ6IHN0cmluZzsga2luZDogTmF0aXZlTW9kdWxlS2luZCB9O1xuICAgICAgICByZXR1cm4gcmVuZGVyZXJOYXRpdmVNb2R1bGVSZWYodHdlYWtJZCwgcmVmLmlkLCByZWYua2luZCk7XG4gICAgICB9LFxuICAgICAgY3JlYXRlUGFuZWw6IGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgICBcImNvZGV4cHA6bmF0aXZlLWNyZWF0ZS1wYW5lbFwiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHdpbmRvd0lkOiBudW1iZXIgfCBudWxsIH07XG4gICAgICAgIHJldHVybiByZW5kZXJlck5hdGl2ZVBhbmVsUmVmKHR3ZWFrSWQsIHJlZi5pZCwgcmVmLndpbmRvd0lkKTtcbiAgICAgIH0sXG4gICAgICBhdHRhY2hWaWV3OiBhc3luYyAob3B0aW9ucykgPT4ge1xuICAgICAgICBjb25zdCByZWYgPSBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgICAgXCJjb2RleHBwOm5hdGl2ZS1hdHRhY2gtdmlld1wiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmcgfTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyTmF0aXZlVmlld1JlZih0d2Vha0lkLCByZWYuaWQpO1xuICAgICAgfSxcbiAgICAgIGxhdW5jaEhlbHBlcjogYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgcmVmID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICAgIFwiY29kZXhwcDpuYXRpdmUtbGF1bmNoLWhlbHBlclwiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHBpZDogbnVtYmVyIH07XG4gICAgICAgIHJldHVybiByZW5kZXJlck5hdGl2ZUhlbHBlclJlZih0d2Vha0lkLCByZWYuaWQsIHJlZi5waWQpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIGNyZWF0ZUJyb3dzZXJWaWV3OiAoX29wdGlvbnMpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImFwaS5jb2RleC5jcmVhdGVCcm93c2VyVmlldyBpcyBtYWluLW9ubHk7IHVzZSBhIG1haW4tc2NvcGVkIHR3ZWFrXCIpO1xuICAgIH0sXG4gICAgY3JlYXRlV2luZG93OiAob3B0aW9ucykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWNyZWF0ZVwiLCBvcHRpb25zKSBhcyBQcm9taXNlPENvZGV4V2luZG93UmVmPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJNb2RlbEFwaSh0d2Vha0lkOiBzdHJpbmcpOiBOb25OdWxsYWJsZTxUd2Vha0FwaVtcIm1vZGVsXCJdPiB7XG4gIHJldHVybiB7XG4gICAgZ2VuZXJhdGVUZXh0OiAob3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDptb2RlbC1nZW5lcmF0ZS10ZXh0XCIsXG4gICAgICAgIHR3ZWFrSWQsXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICApIGFzIFByb21pc2U8Q29kZXhNb2RlbFRleHRSZXN1bHQ+LFxuICAgIGdlbmVyYXRlT2JqZWN0OiA8VCA9IHVua25vd24+KG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZU9iamVjdE9wdGlvbnMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDptb2RlbC1nZW5lcmF0ZS1vYmplY3RcIixcbiAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgICkgYXMgUHJvbWlzZTxDb2RleE1vZGVsT2JqZWN0UmVzdWx0PFQ+PixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJDb2RleFZpZXdSZWYoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgaWQ6IHN0cmluZyxcbiAgd2ViQ29udGVudHNJZDogbnVtYmVyLFxuICBwYXJlbnRXaW5kb3dJZDogbnVtYmVyIHwgbnVsbCxcbik6IENvZGV4Vmlld1JlZiB7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgd2ViQ29udGVudHNJZCxcbiAgICBwYXJlbnRXaW5kb3dJZCxcbiAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJzZXRCb3VuZHNcIiwgYm91bmRzKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIHNldFZpc2libGU6ICh2aXNpYmxlKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwic2V0VmlzaWJsZVwiLCB2aXNpYmxlKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGJyaW5nVG9Gcm9udDogKCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcImJyaW5nVG9Gcm9udFwiKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGxvYWRSb3V0ZTogKHJvdXRlLCBob3N0SWQpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJsb2FkUm91dGVcIiwgcm91dGUsIGhvc3RJZCkgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBsb2FkVXJsOiAodXJsKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwibG9hZFVybFwiLCB1cmwpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgZGlzcG9zZTogKCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcImRpc3Bvc2VcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVNb2R1bGVSZWYoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgaWQ6IHN0cmluZyxcbiAga2luZDogTmF0aXZlTW9kdWxlS2luZCxcbik6IE5hdGl2ZU1vZHVsZVJlZiB7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAga2luZCxcbiAgICByZXF1ZXN0OiAobWV0aG9kLCBwYXlsb2FkLCB0aW1lb3V0TXMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDpuYXRpdmUtbW9kdWxlLXJlcXVlc3RcIixcbiAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgaWQsXG4gICAgICAgIG1ldGhvZCxcbiAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgdGltZW91dE1zLFxuICAgICAgKSxcbiAgICBkaXNwb3NlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtbW9kdWxlLWRpc3Bvc2VcIiwgdHdlYWtJZCwgaWQpIGFzIFByb21pc2U8dm9pZD4sXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVyTmF0aXZlUGFuZWxSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCB3aW5kb3dJZDogbnVtYmVyIHwgbnVsbCk6IE5hdGl2ZVBhbmVsUmVmIHtcbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICB3aW5kb3dJZCxcbiAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwicGFuZWxcIiwgaWQsIFwic2V0Qm91bmRzXCIsIGJvdW5kcykgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBzaG93OiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcInNob3dcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBoaWRlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcImhpZGVcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBkaXNwb3NlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcImRpc3Bvc2VcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVWaWV3UmVmKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IE5hdGl2ZVZpZXdSZWYge1xuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIHNldEJvdW5kczogKGJvdW5kcykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWluc3RhbmNlLWNhbGxcIiwgdHdlYWtJZCwgXCJ2aWV3XCIsIGlkLCBcInNldEJvdW5kc1wiLCBib3VuZHMpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgc2V0VmlzaWJsZTogKHZpc2libGUpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwidmlld1wiLCBpZCwgXCJzZXRWaXNpYmxlXCIsIHZpc2libGUpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgZGlzcG9zZTogKCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWluc3RhbmNlLWNhbGxcIiwgdHdlYWtJZCwgXCJ2aWV3XCIsIGlkLCBcImRpc3Bvc2VcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVIZWxwZXJSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCBwaWQ6IG51bWJlcik6IE5hdGl2ZUhlbHBlclJlZiB7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgcGlkLFxuICAgIHNlbmQ6IChtZXNzYWdlKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaGVscGVyLWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwic2VuZFwiLCBtZXNzYWdlKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIHJlcXVlc3Q6IChtZXNzYWdlLCB0aW1lb3V0TXMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDpuYXRpdmUtaGVscGVyLWNhbGxcIixcbiAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgaWQsXG4gICAgICAgIFwicmVxdWVzdFwiLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICB0aW1lb3V0TXMsXG4gICAgICApLFxuICAgIHN0b3A6ICgpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1oZWxwZXItY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJzdG9wXCIpIGFzIFByb21pc2U8dm9pZD4sXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVyRWxlY3Ryb25CcmlkZ2UoKTogRWxlY3Ryb25CcmlkZ2UgfCBudWxsIHtcbiAgY29uc3QgdmFsdWUgPSAod2luZG93IGFzIHVua25vd24gYXMgeyBlbGVjdHJvbkJyaWRnZT86IHVua25vd24gfSkuZWxlY3Ryb25CcmlkZ2U7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZSBhcyBFbGVjdHJvbkJyaWRnZSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVyU3RvcmFnZShpZDogc3RyaW5nKSB7XG4gIGNvbnN0IGtleSA9IGBjb2RleHBwOnN0b3JhZ2U6JHtpZH1gO1xuICBjb25zdCByZWFkID0gKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSA/PyBcInt9XCIpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfTtcbiAgY29uc3Qgd3JpdGUgPSAodjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeSh2KSk7XG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4oazogc3RyaW5nLCBkPzogVCkgPT4gKGsgaW4gcmVhZCgpID8gKHJlYWQoKVtrXSBhcyBUKSA6IChkIGFzIFQpKSxcbiAgICBzZXQ6IChrOiBzdHJpbmcsIHY6IHVua25vd24pID0+IHtcbiAgICAgIGNvbnN0IG8gPSByZWFkKCk7XG4gICAgICBvW2tdID0gdjtcbiAgICAgIHdyaXRlKG8pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoazogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBvID0gcmVhZCgpO1xuICAgICAgZGVsZXRlIG9ba107XG4gICAgICB3cml0ZShvKTtcbiAgICB9LFxuICAgIGFsbDogKCkgPT4gcmVhZCgpLFxuICB9O1xufVxuXG5mdW5jdGlvbiByZW5kZXJlckZzKGlkOiBzdHJpbmcsIF9wYXRoczogVXNlclBhdGhzKSB7XG4gIC8vIFNhbmRib3hlZCByZW5kZXJlciBjYW4ndCB1c2UgTm9kZSBmcyBkaXJlY3RseSBcdTIwMTQgcHJveHkgdGhyb3VnaCBtYWluIElQQy5cbiAgcmV0dXJuIHtcbiAgICBkYXRhRGlyOiBgPHJlbW90ZT4vdHdlYWstZGF0YS8ke2lkfWAsXG4gICAgcmVhZDogKHA6IHN0cmluZykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dHdlYWstZnNcIiwgXCJyZWFkXCIsIGlkLCBwKSBhcyBQcm9taXNlPHN0cmluZz4sXG4gICAgd3JpdGU6IChwOiBzdHJpbmcsIGM6IHN0cmluZykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dHdlYWstZnNcIiwgXCJ3cml0ZVwiLCBpZCwgcCwgYykgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBleGlzdHM6IChwOiBzdHJpbmcpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnR3ZWFrLWZzXCIsIFwiZXhpc3RzXCIsIGlkLCBwKSBhcyBQcm9taXNlPGJvb2xlYW4+LFxuICB9O1xufVxuIiwgImludGVyZmFjZSBFbGVtZW50V2FpdGVyIHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgcmVzb2x2ZTogKGVsOiBFbGVtZW50KSA9PiB2b2lkO1xuICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQ7XG4gIHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0Pjtcbn1cblxuY29uc3QgZWxlbWVudFdhaXRlcnMgPSBuZXcgU2V0PEVsZW1lbnRXYWl0ZXI+KCk7XG5sZXQgb2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbmxldCBmcmFtZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiB3YWl0Rm9yRWxlbWVudChcbiAgc2VsZWN0b3I6IHN0cmluZyxcbiAgdGltZW91dE1zID0gNTAwMCxcbik6IFByb21pc2U8RWxlbWVudD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICByZXNvbHZlKGV4aXN0aW5nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB3YWl0ZXI6IEVsZW1lbnRXYWl0ZXIgPSB7XG4gICAgICBzZWxlY3RvcixcbiAgICAgIHJlc29sdmUsXG4gICAgICByZWplY3QsXG4gICAgICB0aW1lcjogc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGVsZW1lbnRXYWl0ZXJzLmRlbGV0ZSh3YWl0ZXIpO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGB0aW1lb3V0IHdhaXRpbmcgZm9yICR7c2VsZWN0b3J9YCkpO1xuICAgICAgICBkaXNjb25uZWN0SWZJZGxlKCk7XG4gICAgICB9LCBNYXRoLm1heCgwLCB0aW1lb3V0TXMpKSxcbiAgICB9O1xuXG4gICAgZWxlbWVudFdhaXRlcnMuYWRkKHdhaXRlcik7XG4gICAgZW5zdXJlT2JzZXJ2ZXIoKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5jZWxBbGxFbGVtZW50V2FpdGVycyhyZWFzb246IHN0cmluZyk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHdhaXRlciBvZiBBcnJheS5mcm9tKGVsZW1lbnRXYWl0ZXJzKSkge1xuICAgIGNsZWFyVGltZW91dCh3YWl0ZXIudGltZXIpO1xuICAgIGVsZW1lbnRXYWl0ZXJzLmRlbGV0ZSh3YWl0ZXIpO1xuICAgIHdhaXRlci5yZWplY3QobmV3IEVycm9yKGAke3JlYXNvbn06ICR7d2FpdGVyLnNlbGVjdG9yfWApKTtcbiAgfVxuICBkaXNjb25uZWN0SWZJZGxlKCk7XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU9ic2VydmVyKCk6IHZvaWQge1xuICBpZiAob2JzZXJ2ZXIpIHJldHVybjtcbiAgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgc2NoZWR1bGVDaGVjaygpO1xuICB9KTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xufVxuXG5mdW5jdGlvbiBzY2hlZHVsZUNoZWNrKCk6IHZvaWQge1xuICBpZiAoZnJhbWUgIT09IG51bGwpIHJldHVybjtcbiAgZnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGZyYW1lID0gbnVsbDtcbiAgICBjaGVja1dhaXRlcnMoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrV2FpdGVycygpOiB2b2lkIHtcbiAgZm9yIChjb25zdCB3YWl0ZXIgb2YgQXJyYXkuZnJvbShlbGVtZW50V2FpdGVycykpIHtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iod2FpdGVyLnNlbGVjdG9yKTtcbiAgICBpZiAoIWVsKSBjb250aW51ZTtcbiAgICBjbGVhclRpbWVvdXQod2FpdGVyLnRpbWVyKTtcbiAgICBlbGVtZW50V2FpdGVycy5kZWxldGUod2FpdGVyKTtcbiAgICB3YWl0ZXIucmVzb2x2ZShlbCk7XG4gIH1cbiAgZGlzY29ubmVjdElmSWRsZSgpO1xufVxuXG5mdW5jdGlvbiBkaXNjb25uZWN0SWZJZGxlKCk6IHZvaWQge1xuICBpZiAoZWxlbWVudFdhaXRlcnMuc2l6ZSA+IDApIHJldHVybjtcbiAgaWYgKGZyYW1lICE9PSBudWxsKSB7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICAgIGZyYW1lID0gbnVsbDtcbiAgfVxuICBvYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICBvYnNlcnZlciA9IG51bGw7XG59XG4iLCAiZXhwb3J0IGludGVyZmFjZSBUd2Vha01vZHVsZUxvYWRlck9wdGlvbnMge1xuICBtYW5pZmVzdElkOiBzdHJpbmc7XG4gIGVudHJ5OiBzdHJpbmc7XG4gIGRpcjogc3RyaW5nO1xuICByZWFkU291cmNlOiAoZmlsZW5hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xuICBmYWxsYmFja1JlcXVpcmU/OiAocmVxdWVzdDogc3RyaW5nKSA9PiB1bmtub3duO1xuICBjb25zb2xlPzogQ29uc29sZTtcbn1cblxuaW50ZXJmYWNlIFR3ZWFrTW9kdWxlUmVjb3JkIHtcbiAgaWQ6IHN0cmluZztcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgZGlybmFtZTogc3RyaW5nO1xuICBleHBvcnRzOiB1bmtub3duO1xuICBsb2FkZWQ6IGJvb2xlYW47XG59XG5cbnR5cGUgVHdlYWtSZXF1aXJlID0gKChyZXF1ZXN0OiBzdHJpbmcpID0+IHVua25vd24pICYge1xuICByZXNvbHZlOiAocmVxdWVzdDogc3RyaW5nKSA9PiBzdHJpbmc7XG59O1xuXG5jb25zdCBNT0RVTEVfRklMRV9FWFRFTlNJT05TID0gW1wiLmpzXCIsIFwiLmNqc1wiLCBcIi5qc29uXCJdO1xuY29uc3QgTU9EVUxFX0lOREVYX0ZJTEVTID0gW1wiaW5kZXguanNcIiwgXCJpbmRleC5janNcIiwgXCJpbmRleC5qc29uXCJdO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHdlYWtNb2R1bGVMb2FkZXIob3B0aW9uczogVHdlYWtNb2R1bGVMb2FkZXJPcHRpb25zKSB7XG4gIGNvbnN0IHR3ZWFrRGlyID0gbm9ybWFsaXplQWJzb2x1dGVQYXRoKG9wdGlvbnMuZGlyKTtcbiAgY29uc3QgZW50cnkgPSBub3JtYWxpemVBYnNvbHV0ZVBhdGgob3B0aW9ucy5lbnRyeSk7XG4gIGNvbnN0IG1vZHVsZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFR3ZWFrTW9kdWxlUmVjb3JkPigpO1xuXG4gIGFzc2VydEluc2lkZVR3ZWFrRGlyKHR3ZWFrRGlyLCBlbnRyeSk7XG5cbiAgY29uc3QgbG9hZE1vZHVsZSA9IChmaWxlbmFtZTogc3RyaW5nLCBzb3VyY2VPdmVycmlkZT86IHN0cmluZyk6IHVua25vd24gPT4ge1xuICAgIGNvbnN0IHJlc29sdmVkID0gbm9ybWFsaXplQWJzb2x1dGVQYXRoKGZpbGVuYW1lKTtcbiAgICBhc3NlcnRJbnNpZGVUd2Vha0Rpcih0d2Vha0RpciwgcmVzb2x2ZWQpO1xuXG4gICAgY29uc3QgZXhpc3RpbmcgPSBtb2R1bGVDYWNoZS5nZXQocmVzb2x2ZWQpO1xuICAgIGlmIChleGlzdGluZykgcmV0dXJuIGV4aXN0aW5nLmV4cG9ydHM7XG5cbiAgICBpZiAocmVzb2x2ZWQuZW5kc1dpdGgoXCIuanNvblwiKSkge1xuICAgICAgY29uc3Qgc291cmNlID0gc291cmNlT3ZlcnJpZGUgPz8gb3B0aW9ucy5yZWFkU291cmNlKHJlc29sdmVkKTtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGNyZWF0ZU1vZHVsZVJlY29yZChyZXNvbHZlZCwgSlNPTi5wYXJzZShzb3VyY2UpIGFzIHVua25vd24pO1xuICAgICAgbW9kdWxlLmxvYWRlZCA9IHRydWU7XG4gICAgICBtb2R1bGVDYWNoZS5zZXQocmVzb2x2ZWQsIG1vZHVsZSk7XG4gICAgICByZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlID0gY3JlYXRlTW9kdWxlUmVjb3JkKHJlc29sdmVkLCB7fSk7XG4gICAgbW9kdWxlQ2FjaGUuc2V0KHJlc29sdmVkLCBtb2R1bGUpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHNvdXJjZU92ZXJyaWRlID8/IG9wdGlvbnMucmVhZFNvdXJjZShyZXNvbHZlZCk7XG4gICAgY29uc3QgbG9jYWxSZXF1aXJlID0gbWFrZVJlcXVpcmUocmVzb2x2ZWQpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8taW1wbGllZC1ldmFsLCBuby1uZXctZnVuY1xuICAgICAgY29uc3QgZm4gPSBuZXcgRnVuY3Rpb24oXG4gICAgICAgIFwibW9kdWxlXCIsXG4gICAgICAgIFwiZXhwb3J0c1wiLFxuICAgICAgICBcInJlcXVpcmVcIixcbiAgICAgICAgXCJfX2ZpbGVuYW1lXCIsXG4gICAgICAgIFwiX19kaXJuYW1lXCIsXG4gICAgICAgIFwiY29uc29sZVwiLFxuICAgICAgICBgJHtzb3VyY2V9XFxuLy8jIHNvdXJjZVVSTD0ke3NvdXJjZVVybChvcHRpb25zLm1hbmlmZXN0SWQsIHJlc29sdmVkKX1gLFxuICAgICAgKTtcbiAgICAgIGZuKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIGxvY2FsUmVxdWlyZSwgcmVzb2x2ZWQsIG1vZHVsZS5kaXJuYW1lLCBvcHRpb25zLmNvbnNvbGUgPz8gY29uc29sZSk7XG4gICAgICBtb2R1bGUubG9hZGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbW9kdWxlQ2FjaGUuZGVsZXRlKHJlc29sdmVkKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCByZXNvbHZlTW9kdWxlID0gKHJlcXVlc3Q6IHN0cmluZywgcGFyZW50RmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgaWYgKCFpc1JlbGF0aXZlUmVxdWVzdChyZXF1ZXN0KSkge1xuICAgICAgaWYgKG9wdGlvbnMuZmFsbGJhY2tSZXF1aXJlKSByZXR1cm4gcmVxdWVzdDtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFJlbmRlcmVyIHR3ZWFrIHJlcXVpcmUgb25seSBzdXBwb3J0cyByZWxhdGl2ZSBmaWxlczsgYnVuZGxlIGRlcGVuZGVuY3kgXCIke3JlcXVlc3R9XCIgaW50byB0aGUgdHdlYWsgZW50cnlgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlID0gZGlybmFtZVBhdGgocGFyZW50RmlsZW5hbWUpO1xuICAgIGNvbnN0IHRhcmdldCA9IG5vcm1hbGl6ZUFic29sdXRlUGF0aChqb2luUGF0aChiYXNlLCByZXF1ZXN0KSk7XG4gICAgYXNzZXJ0SW5zaWRlVHdlYWtEaXIodHdlYWtEaXIsIHRhcmdldCk7XG5cbiAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBtb2R1bGVDYW5kaWRhdGVzKHRhcmdldCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wdGlvbnMucmVhZFNvdXJjZShjYW5kaWRhdGUpO1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIFRyeSB0aGUgbmV4dCBDb21tb25KUyBjYW5kaWRhdGUuXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCBtb2R1bGUgXCIke3JlcXVlc3R9XCIgZnJvbSAke3BhcmVudEZpbGVuYW1lfWApO1xuICB9O1xuXG4gIGNvbnN0IG1ha2VSZXF1aXJlID0gKHBhcmVudEZpbGVuYW1lOiBzdHJpbmcpOiBUd2Vha1JlcXVpcmUgPT4ge1xuICAgIGNvbnN0IHJlcXVpcmVGbiA9ICgocmVxdWVzdDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIWlzUmVsYXRpdmVSZXF1ZXN0KHJlcXVlc3QpKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmZhbGxiYWNrUmVxdWlyZSkgcmV0dXJuIG9wdGlvbnMuZmFsbGJhY2tSZXF1aXJlKHJlcXVlc3QpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFJlbmRlcmVyIHR3ZWFrIHJlcXVpcmUgb25seSBzdXBwb3J0cyByZWxhdGl2ZSBmaWxlczsgYnVuZGxlIGRlcGVuZGVuY3kgXCIke3JlcXVlc3R9XCIgaW50byB0aGUgdHdlYWsgZW50cnlgLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY29uc3QgZmlsZW5hbWUgPSByZXNvbHZlTW9kdWxlKHJlcXVlc3QsIHBhcmVudEZpbGVuYW1lKTtcbiAgICAgIHJldHVybiBsb2FkTW9kdWxlKGZpbGVuYW1lKTtcbiAgICB9KSBhcyBUd2Vha1JlcXVpcmU7XG4gICAgcmVxdWlyZUZuLnJlc29sdmUgPSAocmVxdWVzdDogc3RyaW5nKSA9PiByZXNvbHZlTW9kdWxlKHJlcXVlc3QsIHBhcmVudEZpbGVuYW1lKTtcbiAgICByZXR1cm4gcmVxdWlyZUZuO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbG9hZEVudHJ5KHNvdXJjZU92ZXJyaWRlPzogc3RyaW5nKTogdW5rbm93biB7XG4gICAgICByZXR1cm4gbG9hZE1vZHVsZShlbnRyeSwgc291cmNlT3ZlcnJpZGUpO1xuICAgIH0sXG5cbiAgICByZXNvbHZlKHJlcXVlc3Q6IHN0cmluZywgcGFyZW50RmlsZW5hbWUgPSBlbnRyeSk6IHN0cmluZyB7XG4gICAgICByZXR1cm4gcmVzb2x2ZU1vZHVsZShyZXF1ZXN0LCBwYXJlbnRGaWxlbmFtZSk7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTW9kdWxlUmVjb3JkKGZpbGVuYW1lOiBzdHJpbmcsIGV4cG9ydHM6IHVua25vd24pOiBUd2Vha01vZHVsZVJlY29yZCB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGZpbGVuYW1lLFxuICAgIGZpbGVuYW1lLFxuICAgIGRpcm5hbWU6IGRpcm5hbWVQYXRoKGZpbGVuYW1lKSxcbiAgICBleHBvcnRzLFxuICAgIGxvYWRlZDogZmFsc2UsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1vZHVsZUNhbmRpZGF0ZXModGFyZ2V0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGV4dCA9IGV4dGVuc2lvbk9mKHRhcmdldCk7XG4gIGlmIChleHQpIHJldHVybiBbdGFyZ2V0XTtcbiAgcmV0dXJuIFtcbiAgICB0YXJnZXQsXG4gICAgLi4uTU9EVUxFX0ZJTEVfRVhURU5TSU9OUy5tYXAoKGV4dGVuc2lvbikgPT4gYCR7dGFyZ2V0fSR7ZXh0ZW5zaW9ufWApLFxuICAgIC4uLk1PRFVMRV9JTkRFWF9GSUxFUy5tYXAoKGZpbGUpID0+IGAke3RhcmdldH0vJHtmaWxlfWApLFxuICBdO1xufVxuXG5mdW5jdGlvbiBpc1JlbGF0aXZlUmVxdWVzdChyZXF1ZXN0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHJlcXVlc3QgPT09IFwiLlwiIHx8IHJlcXVlc3QgPT09IFwiLi5cIiB8fCByZXF1ZXN0LnN0YXJ0c1dpdGgoXCIuL1wiKSB8fCByZXF1ZXN0LnN0YXJ0c1dpdGgoXCIuLi9cIik7XG59XG5cbmZ1bmN0aW9uIHNvdXJjZVVybChtYW5pZmVzdElkOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYGNvZGV4cHAtdHdlYWs6Ly8ke2VuY29kZVVSSUNvbXBvbmVudChtYW5pZmVzdElkKX0vJHtlbmNvZGVVUklDb21wb25lbnQoZmlsZW5hbWUpfWA7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEluc2lkZVR3ZWFrRGlyKHR3ZWFrRGlyOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKCFpc1BhdGhJbnNpZGVPckVxdWFsKHR3ZWFrRGlyLCBmaWxlbmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwYXRoIG91dHNpZGUgdHdlYWsgZGlyXCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzUGF0aEluc2lkZU9yRXF1YWwocGFyZW50OiBzdHJpbmcsIGNoaWxkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50UGF0aCA9IG5vcm1hbGl6ZUZvckNvbXBhcmUocGFyZW50KTtcbiAgY29uc3QgY2hpbGRQYXRoID0gbm9ybWFsaXplRm9yQ29tcGFyZShjaGlsZCk7XG4gIHJldHVybiBjaGlsZFBhdGggPT09IHBhcmVudFBhdGggfHwgY2hpbGRQYXRoLnN0YXJ0c1dpdGgoYCR7cGFyZW50UGF0aH0vYCk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZvckNvbXBhcmUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVBYnNvbHV0ZVBhdGgodmFsdWUpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiAvXltBLVphLXpdOlxcLy8udGVzdChub3JtYWxpemVkKSA/IG5vcm1hbGl6ZWQudG9Mb3dlckNhc2UoKSA6IG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFic29sdXRlUGF0aChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IFN0cmluZyhpbnB1dCB8fCBcIlwiKS5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKTtcbiAgbGV0IHByZWZpeCA9IFwiXCI7XG4gIGxldCByZXN0ID0gbm9ybWFsaXplZDtcblxuICBjb25zdCBkcml2ZU1hdGNoID0gcmVzdC5tYXRjaCgvXihbQS1aYS16XTopKD86XFwvfCQpLyk7XG4gIGlmIChkcml2ZU1hdGNoKSB7XG4gICAgcHJlZml4ID0gZHJpdmVNYXRjaFsxXSA/PyBcIlwiO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKHByZWZpeC5sZW5ndGgpO1xuICB9IGVsc2UgaWYgKHJlc3Quc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICBwcmVmaXggPSBcIi9cIjtcbiAgICByZXN0ID0gcmVzdC5zbGljZSgxKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IHBhcnQgb2YgcmVzdC5zcGxpdChcIi9cIikpIHtcbiAgICBpZiAoIXBhcnQgfHwgcGFydCA9PT0gXCIuXCIpIGNvbnRpbnVlO1xuICAgIGlmIChwYXJ0ID09PSBcIi4uXCIpIHtcbiAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiAwKSBwYXJ0cy5wb3AoKTtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwicGF0aCB0cmF2ZXJzYWxcIik7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcGFydHMucHVzaChwYXJ0KTtcbiAgfVxuXG4gIGlmIChwcmVmaXggPT09IFwiL1wiKSByZXR1cm4gYC8ke3BhcnRzLmpvaW4oXCIvXCIpfWA7XG4gIGlmIChwcmVmaXgpIHJldHVybiBgJHtwcmVmaXh9LyR7cGFydHMuam9pbihcIi9cIil9YC5yZXBsYWNlKC9cXC8kLywgXCIvXCIpO1xuICByZXR1cm4gcGFydHMuam9pbihcIi9cIik7XG59XG5cbmZ1bmN0aW9uIGpvaW5QYXRoKGJhc2U6IHN0cmluZywgcmVxdWVzdDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Jhc2UucmVwbGFjZSgvXFwvKyQvLCBcIlwiKX0vJHtyZXF1ZXN0fWA7XG59XG5cbmZ1bmN0aW9uIGRpcm5hbWVQYXRoKGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQWJzb2x1dGVQYXRoKGZpbGVuYW1lKTtcbiAgY29uc3QgaW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgaWYgKGluZGV4IDw9IDApIHJldHVybiBub3JtYWxpemVkLnN0YXJ0c1dpdGgoXCIvXCIpID8gXCIvXCIgOiBcIi5cIjtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQuc2xpY2UoMCwgaW5kZXgpO1xufVxuXG5mdW5jdGlvbiBleHRlbnNpb25PZihmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgYmFzZW5hbWUgPSBmaWxlbmFtZS5zbGljZShmaWxlbmFtZS5sYXN0SW5kZXhPZihcIi9cIikgKyAxKTtcbiAgY29uc3QgaW5kZXggPSBiYXNlbmFtZS5sYXN0SW5kZXhPZihcIi5cIik7XG4gIHJldHVybiBpbmRleCA+IDAgPyBiYXNlbmFtZS5zbGljZShpbmRleCkgOiBcIlwiO1xufVxuIiwgImltcG9ydCB0eXBlIHtcbiAgQ29kZXhTaWRlYmFyQWN0aW9uT3B0aW9ucyxcbiAgQ29kZXhTaWRlYmFyQWN0aW9uUmVmLFxuICBDb2RleFNpZGViYXJBY3Rpb25VcGRhdGUsXG4gIENvZGV4U2lkZWJhckFwaSxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuaW50ZXJmYWNlIFNpZGViYXJBY3Rpb25SZWNvcmQge1xuICB0d2Vha0lkOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIGtleTogc3RyaW5nO1xuICBvcHRpb25zOiBSZXF1aXJlZDxQaWNrPENvZGV4U2lkZWJhckFjdGlvbk9wdGlvbnMsIFwiaWRcIiB8IFwibGFiZWxcIiB8IFwidG9vbHRpcFwiIHwgXCJwbGFjZW1lbnRcIiB8IFwib3JkZXJcIiB8IFwiYWN0aXZlXCI+PiAmXG4gICAgUGljazxDb2RleFNpZGViYXJBY3Rpb25PcHRpb25zLCBcImljb25TdmdcIiB8IFwib25DbGlja1wiPjtcbiAgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBsaXN0ZW5lcjogKChldmVudDogTW91c2VFdmVudCkgPT4gdm9pZCkgfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgU2lkZWJhclNsb3Qge1xuICBjb250YWluZXI6IEhUTUxFbGVtZW50O1xuICB0ZW1wbGF0ZTogSFRNTEVsZW1lbnQ7XG4gIGluc2VydEJlZm9yZTogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpbnNlcnRBZnRlcjogSFRNTEVsZW1lbnQgfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgTXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50IHtcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIGFyaWFDdXJyZW50OiBzdHJpbmcgfCBudWxsO1xuICBhcmlhU2VsZWN0ZWQ6IHN0cmluZyB8IG51bGw7XG4gIGRhdGFTdGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgZGF0YUFjdGl2ZTogc3RyaW5nIHwgbnVsbDtcbiAgZGF0YVNlbGVjdGVkOiBzdHJpbmcgfCBudWxsO1xufVxuXG5jb25zdCBNQUlOX1NJREVCQVJfQUNUSU9OX0xBQkVMUyA9IFtcbiAgXCJOZXcgY2hhdFwiLFxuICBcIlF1aWNrIGNoYXRcIixcbiAgXCJTZWFyY2hcIixcbiAgXCJQbHVnaW5zXCIsXG4gIFwiQXV0b21hdGlvbnNcIixcbiAgXCJBdXRvbWF0aW9uXCIsXG5dLm1hcChub3JtYWxpemVMYWJlbCk7XG5cbmNvbnN0IHJlY29yZHMgPSBuZXcgTWFwPHN0cmluZywgU2lkZWJhckFjdGlvblJlY29yZD4oKTtcbmNvbnN0IG11dGVkTmF0aXZlQWN0aXZlRWxlbWVudHMgPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBNdXRlZE5hdGl2ZUFjdGl2ZUVsZW1lbnQ+KCk7XG5sZXQgb2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbmxldCBkZWxlZ2F0ZWRFdmVudHNJbnN0YWxsZWQgPSBmYWxzZTtcbmxldCByZWZyZXNoVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJlclNpZGViYXJBcGkodHdlYWtJZDogc3RyaW5nKTogQ29kZXhTaWRlYmFyQXBpIHtcbiAgcmV0dXJuIHtcbiAgICByZWdpc3RlckFjdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gcmVnaXN0ZXJTaWRlYmFyQWN0aW9uKHR3ZWFrSWQsIG9wdGlvbnMpO1xuICAgIH0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNwb3NlU2lkZWJhckFjdGlvbnNGb3JUd2Vhayh0d2Vha0lkOiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChjb25zdCByZWNvcmQgb2YgQXJyYXkuZnJvbShyZWNvcmRzLnZhbHVlcygpKSkge1xuICAgIGlmIChyZWNvcmQudHdlYWtJZCA9PT0gdHdlYWtJZCkgZGlzcG9zZVJlY29yZChyZWNvcmQpO1xuICB9XG4gIHN0b3BPYnNlcnZlcklmSWRsZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJTaWRlYmFyQWN0aW9uKFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIG9wdGlvbnM6IENvZGV4U2lkZWJhckFjdGlvbk9wdGlvbnMsXG4pOiBDb2RleFNpZGViYXJBY3Rpb25SZWYge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKTtcbiAgY29uc3Qga2V5ID0gYCR7dHdlYWtJZH06JHtub3JtYWxpemVkLmlkfWA7XG4gIGNvbnN0IGV4aXN0aW5nID0gcmVjb3Jkcy5nZXQoa2V5KTtcbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgZXhpc3Rpbmcub3B0aW9ucyA9IG5vcm1hbGl6ZWQ7XG4gICAgcmVuZGVyUmVjb3JkKGV4aXN0aW5nKTtcbiAgICBzeW5jTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG4gICAgcmV0dXJuIGFjdGlvblJlZihleGlzdGluZyk7XG4gIH1cblxuICBjb25zdCByZWNvcmQ6IFNpZGViYXJBY3Rpb25SZWNvcmQgPSB7XG4gICAgdHdlYWtJZCxcbiAgICBpZDogbm9ybWFsaXplZC5pZCxcbiAgICBrZXksXG4gICAgb3B0aW9uczogbm9ybWFsaXplZCxcbiAgICBub2RlOiBudWxsLFxuICAgIGxpc3RlbmVyOiBudWxsLFxuICB9O1xuICByZWNvcmRzLnNldChrZXksIHJlY29yZCk7XG4gIGVuc3VyZU9ic2VydmVyKCk7XG4gIHNjaGVkdWxlU2lkZWJhclJlZnJlc2goKTtcbiAgcmV0dXJuIGFjdGlvblJlZihyZWNvcmQpO1xufVxuXG5mdW5jdGlvbiBhY3Rpb25SZWYocmVjb3JkOiBTaWRlYmFyQWN0aW9uUmVjb3JkKTogQ29kZXhTaWRlYmFyQWN0aW9uUmVmIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVjb3JkLmlkLFxuICAgIHVwZGF0ZSh1cGRhdGU6IENvZGV4U2lkZWJhckFjdGlvblVwZGF0ZSkge1xuICAgICAgY29uc3QgbWVyZ2VkID0gbm9ybWFsaXplT3B0aW9ucyh7IC4uLnJlY29yZC5vcHRpb25zLCAuLi51cGRhdGUsIGlkOiByZWNvcmQuaWQgfSk7XG4gICAgICByZWNvcmQub3B0aW9ucyA9IG1lcmdlZDtcbiAgICAgIHJlbmRlclJlY29yZChyZWNvcmQpO1xuICAgICAgc3luY05hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xuICAgICAgc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCgpO1xuICAgIH0sXG4gICAgc2V0QWN0aXZlKGFjdGl2ZSkge1xuICAgICAgcmVjb3JkLm9wdGlvbnMgPSB7IC4uLnJlY29yZC5vcHRpb25zLCBhY3RpdmUgfTtcbiAgICAgIHJlbmRlclJlY29yZChyZWNvcmQpO1xuICAgICAgc3luY05hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xuICAgIH0sXG4gICAgZGlzcG9zZSgpIHtcbiAgICAgIGRpc3Bvc2VSZWNvcmQocmVjb3JkKTtcbiAgICAgIHN0b3BPYnNlcnZlcklmSWRsZSgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU9wdGlvbnMob3B0aW9uczogQ29kZXhTaWRlYmFyQWN0aW9uT3B0aW9ucyk6IFNpZGViYXJBY3Rpb25SZWNvcmRbXCJvcHRpb25zXCJdIHtcbiAgY29uc3QgaWQgPSBjbGVhblN0cmluZyhvcHRpb25zLmlkKTtcbiAgY29uc3QgbGFiZWwgPSBjbGVhblN0cmluZyhvcHRpb25zLmxhYmVsKTtcbiAgaWYgKCFpZCkgdGhyb3cgbmV3IEVycm9yKFwic2lkZWJhciBhY3Rpb24gaWQgaXMgcmVxdWlyZWRcIik7XG4gIGlmICghbGFiZWwpIHRocm93IG5ldyBFcnJvcihcInNpZGViYXIgYWN0aW9uIGxhYmVsIGlzIHJlcXVpcmVkXCIpO1xuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIGxhYmVsLFxuICAgIHRvb2x0aXA6IGNsZWFuU3RyaW5nKG9wdGlvbnMudG9vbHRpcCkgfHwgbGFiZWwsXG4gICAgcGxhY2VtZW50OiBvcHRpb25zLnBsYWNlbWVudCA9PT0gXCJzdGFydFwiID8gXCJzdGFydFwiIDogXCJlbmRcIixcbiAgICBvcmRlcjogTnVtYmVyLmlzRmluaXRlKG9wdGlvbnMub3JkZXIpID8gTnVtYmVyKG9wdGlvbnMub3JkZXIpIDogNTAsXG4gICAgYWN0aXZlOiBvcHRpb25zLmFjdGl2ZSA9PT0gdHJ1ZSxcbiAgICBpY29uU3ZnOiBjbGVhblN0cmluZyhvcHRpb25zLmljb25TdmcpIHx8IHVuZGVmaW5lZCxcbiAgICBvbkNsaWNrOiBvcHRpb25zLm9uQ2xpY2ssXG4gIH07XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU9ic2VydmVyKCk6IHZvaWQge1xuICBpZiAob2JzZXJ2ZXIgfHwgdHlwZW9mIGRvY3VtZW50ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm47XG4gIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4gc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCgpKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBzY2hlZHVsZVNpZGViYXJSZWZyZXNoLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gIGVuc3VyZURlbGVnYXRlZFNpZGViYXJFdmVudHMoKTtcbn1cblxuZnVuY3Rpb24gc3RvcE9ic2VydmVySWZJZGxlKCk6IHZvaWQge1xuICBpZiAocmVjb3Jkcy5zaXplID4gMCkgcmV0dXJuO1xuICBvYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICBvYnNlcnZlciA9IG51bGw7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHNjaGVkdWxlU2lkZWJhclJlZnJlc2gpO1xuICByZW1vdmVEZWxlZ2F0ZWRTaWRlYmFyRXZlbnRzKCk7XG4gIGlmIChyZWZyZXNoVGltZXIpIHtcbiAgICBjbGVhclRpbWVvdXQocmVmcmVzaFRpbWVyKTtcbiAgICByZWZyZXNoVGltZXIgPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVuc3VyZURlbGVnYXRlZFNpZGViYXJFdmVudHMoKTogdm9pZCB7XG4gIGlmIChkZWxlZ2F0ZWRFdmVudHNJbnN0YWxsZWQgfHwgdHlwZW9mIGRvY3VtZW50ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm47XG4gIGRlbGVnYXRlZEV2ZW50c0luc3RhbGxlZCA9IHRydWU7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkRlbGVnYXRlZFNpZGViYXJBY3Rpb25DbGljaywgdHJ1ZSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbktleWRvd24sIHRydWUpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVEZWxlZ2F0ZWRTaWRlYmFyRXZlbnRzKCk6IHZvaWQge1xuICBpZiAoIWRlbGVnYXRlZEV2ZW50c0luc3RhbGxlZCB8fCB0eXBlb2YgZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcbiAgZGVsZWdhdGVkRXZlbnRzSW5zdGFsbGVkID0gZmFsc2U7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkRlbGVnYXRlZFNpZGViYXJBY3Rpb25DbGljaywgdHJ1ZSk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbktleWRvd24sIHRydWUpO1xufVxuXG5mdW5jdGlvbiBvbkRlbGVnYXRlZFNpZGViYXJBY3Rpb25DbGljayhldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuICBjb25zdCBhY3Rpb24gPSBzaWRlYmFyQWN0aW9uTm9kZUZvckV2ZW50KGV2ZW50KTtcbiAgaWYgKCFhY3Rpb24pIHJldHVybjtcbiAgY29uc3QgcmVjb3JkID0gcmVjb3Jkcy5nZXQoYWN0aW9uLmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb24gfHwgXCJcIik7XG4gIGlmICghcmVjb3JkKSByZXR1cm47XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB2b2lkIHJlY29yZC5vcHRpb25zLm9uQ2xpY2s/LihldmVudCk7XG59XG5cbmZ1bmN0aW9uIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGV2ZW50LmtleSAhPT0gXCJFbnRlclwiICYmIGV2ZW50LmtleSAhPT0gXCIgXCIpIHJldHVybjtcbiAgY29uc3QgYWN0aW9uID0gc2lkZWJhckFjdGlvbk5vZGVGb3JFdmVudChldmVudCk7XG4gIGlmICghYWN0aW9uKSByZXR1cm47XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICBpbnRlcmFjdGl2ZVRhcmdldChhY3Rpb24pLmNsaWNrKCk7XG59XG5cbmZ1bmN0aW9uIHNpZGViYXJBY3Rpb25Ob2RlRm9yRXZlbnQoZXZlbnQ6IEV2ZW50KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgdGFyZ2V0ID0gZXZlbnRUYXJnZXRFbGVtZW50KGV2ZW50KTtcbiAgY29uc3QgYWN0aW9uID0gdGFyZ2V0Py5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zaWRlYmFyLWFjdGlvbl1cIik7XG4gIHJldHVybiBkb21FbGVtZW50KGFjdGlvbik7XG59XG5cbmZ1bmN0aW9uIGV2ZW50VGFyZ2V0RWxlbWVudChldmVudDogRXZlbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICByZXR1cm4gZG9tRWxlbWVudChldmVudC50YXJnZXQpO1xufVxuXG5mdW5jdGlvbiBkb21FbGVtZW50KHZhbHVlOiB1bmtub3duKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIpIHJldHVybiBudWxsO1xuICBjb25zdCBlbGVtZW50ID0gdmFsdWUgYXMgSFRNTEVsZW1lbnQ7XG4gIGlmICh0eXBlb2YgZWxlbWVudC5jbG9zZXN0ICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBudWxsO1xuICBpZiAodHlwZW9mIGVsZW1lbnQuZ2V0QXR0cmlidXRlICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBudWxsO1xuICByZXR1cm4gZWxlbWVudDtcbn1cblxuZnVuY3Rpb24gc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCgpOiB2b2lkIHtcbiAgaWYgKHJlZnJlc2hUaW1lcikgcmV0dXJuO1xuICByZWZyZXNoVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICByZWZyZXNoVGltZXIgPSBudWxsO1xuICAgIHJlZnJlc2hTaWRlYmFyQWN0aW9ucygpO1xuICB9LCAxMjApO1xufVxuXG5mdW5jdGlvbiByZWZyZXNoU2lkZWJhckFjdGlvbnMoKTogdm9pZCB7XG4gIGlmICghcmVjb3Jkcy5zaXplKSByZXR1cm47XG4gIGNvbnN0IHNsb3QgPSBmaW5kTWFpblNpZGViYXJBY3Rpb25TbG90KCk7XG4gIGlmICghc2xvdCkgcmV0dXJuO1xuXG4gIGNvbnN0IHNvcnRlZCA9IHNvcnRlZFJlY29yZHMoKTtcbiAgZm9yIChjb25zdCByZWNvcmQgb2Ygc29ydGVkKSB7XG4gICAgaWYgKCFyZWNvcmQubm9kZSB8fCAhcmVjb3JkLm5vZGUuaXNDb25uZWN0ZWQgfHwgcmVjb3JkLm5vZGUucGFyZW50RWxlbWVudCAhPT0gc2xvdC5jb250YWluZXIpIHtcbiAgICAgIHJlY29yZC5ub2RlPy5yZW1vdmUoKTtcbiAgICAgIHJlY29yZC5ub2RlID0gY3JlYXRlQWN0aW9uTm9kZShzbG90LnRlbXBsYXRlLCByZWNvcmQpO1xuICAgIH1cbiAgICByZW5kZXJSZWNvcmQocmVjb3JkKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIHNvcnRlZCkge1xuICAgIGlmIChyZWNvcmQubm9kZT8ucGFyZW50RWxlbWVudCA9PT0gc2xvdC5jb250YWluZXIpIHJlY29yZC5ub2RlLnJlbW92ZSgpO1xuICB9XG5cbiAgbGV0IGFuY2hvciA9IHNsb3QuaW5zZXJ0QWZ0ZXI7XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIHNvcnRlZC5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0ub3B0aW9ucy5wbGFjZW1lbnQgPT09IFwic3RhcnRcIikpIHtcbiAgICBpZiAoIXJlY29yZC5ub2RlKSBjb250aW51ZTtcbiAgICBzbG90LmNvbnRhaW5lci5pbnNlcnRCZWZvcmUocmVjb3JkLm5vZGUsIGFuY2hvciA/IGFuY2hvci5uZXh0U2libGluZyA6IHNsb3QuY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgIGFuY2hvciA9IHJlY29yZC5ub2RlO1xuICB9XG5cbiAgZm9yIChjb25zdCByZWNvcmQgb2Ygc29ydGVkLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5vcHRpb25zLnBsYWNlbWVudCA9PT0gXCJlbmRcIikpIHtcbiAgICBpZiAoIXJlY29yZC5ub2RlKSBjb250aW51ZTtcbiAgICBzbG90LmNvbnRhaW5lci5pbnNlcnRCZWZvcmUocmVjb3JkLm5vZGUsIGFuY2hvciA/IGFuY2hvci5uZXh0U2libGluZyA6IHNsb3QuY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgIGFuY2hvciA9IHJlY29yZC5ub2RlO1xuICB9XG5cbiAgc3luY05hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xufVxuXG5mdW5jdGlvbiBzb3J0ZWRSZWNvcmRzKCk6IFNpZGViYXJBY3Rpb25SZWNvcmRbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKHJlY29yZHMudmFsdWVzKCkpLnNvcnQoKGEsIGIpID0+XG4gICAgYS5vcHRpb25zLm9yZGVyIC0gYi5vcHRpb25zLm9yZGVyIHx8IGEua2V5LmxvY2FsZUNvbXBhcmUoYi5rZXkpLFxuICApO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBY3Rpb25Ob2RlKHRlbXBsYXRlOiBIVE1MRWxlbWVudCwgcmVjb3JkOiBTaWRlYmFyQWN0aW9uUmVjb3JkKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBub2RlID0gdGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xuICBzYW5pdGl6ZUFjdGlvbk5vZGUobm9kZSk7XG4gIG5vZGUuZGF0YXNldC5jb2RleHBwU2lkZWJhckFjdGlvbiA9IHJlY29yZC5rZXk7XG4gIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiByZW5kZXJSZWNvcmQocmVjb3JkOiBTaWRlYmFyQWN0aW9uUmVjb3JkKTogdm9pZCB7XG4gIGNvbnN0IG5vZGUgPSByZWNvcmQubm9kZTtcbiAgaWYgKCFub2RlKSByZXR1cm47XG4gIGNvbnN0IHRhcmdldCA9IGludGVyYWN0aXZlVGFyZ2V0KG5vZGUpO1xuICBub2RlLmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb24gPSByZWNvcmQua2V5O1xuICBub2RlLmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb25BY3RpdmUgPSByZWNvcmQub3B0aW9ucy5hY3RpdmUgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgaWYgKHRhcmdldCAhPT0gbm9kZSkgdGFyZ2V0LmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb25BY3RpdmUgPSByZWNvcmQub3B0aW9ucy5hY3RpdmUgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgYXBwbHlQbGFjZW1lbnRTdHlsZShub2RlLCByZWNvcmQpO1xuICB0YXJnZXQuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCByZWNvcmQub3B0aW9ucy5sYWJlbCk7XG4gIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCByZWNvcmQub3B0aW9ucy50b29sdGlwKTtcbiAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJidXR0b25cIik7XG4gIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XG4gIHNldEFjdGl2ZUF0dHJpYnV0ZXMobm9kZSwgcmVjb3JkLm9wdGlvbnMuYWN0aXZlKTtcbiAgaWYgKHRhcmdldCAhPT0gbm9kZSkgc2V0QWN0aXZlQXR0cmlidXRlcyh0YXJnZXQsIHJlY29yZC5vcHRpb25zLmFjdGl2ZSk7XG4gIGFwcGx5TmF0aXZlTGlrZUFjdGl2ZVN0eWxlKHRhcmdldCwgcmVjb3JkLm9wdGlvbnMuYWN0aXZlKTtcbiAgcmVwbGFjZUFjdGlvbkljb24obm9kZSwgcmVjb3JkLm9wdGlvbnMuaWNvblN2Zyk7XG4gIHJlcGxhY2VBY3Rpb25MYWJlbChub2RlLCByZWNvcmQub3B0aW9ucy5sYWJlbCk7XG4gIGFwcGx5TmF0aXZlTGlrZUFjdGl2ZVN0eWxlKHRhcmdldCwgcmVjb3JkLm9wdGlvbnMuYWN0aXZlKTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZVJlY29yZChyZWNvcmQ6IFNpZGViYXJBY3Rpb25SZWNvcmQpOiB2b2lkIHtcbiAgcmVjb3JkLm5vZGU/LnJlbW92ZSgpO1xuICByZWNvcmQubm9kZSA9IG51bGw7XG4gIHJlY29yZHMuZGVsZXRlKHJlY29yZC5rZXkpO1xuICBzeW5jTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5UGxhY2VtZW50U3R5bGUobm9kZTogSFRNTEVsZW1lbnQsIHJlY29yZDogU2lkZWJhckFjdGlvblJlY29yZCk6IHZvaWQge1xuICBpZiAocmVjb3JkLm9wdGlvbnMucGxhY2VtZW50ID09PSBcInN0YXJ0XCIpIHtcbiAgICBub2RlLnN0eWxlLm9yZGVyID0gU3RyaW5nKC0xMDAwMCArIHJlY29yZC5vcHRpb25zLm9yZGVyKTtcbiAgfSBlbHNlIHtcbiAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KFwib3JkZXJcIik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRNYWluU2lkZWJhckFjdGlvblNsb3Qocm9vdDogUGFyZW50Tm9kZSA9IGRvY3VtZW50KTogU2lkZWJhclNsb3QgfCBudWxsIHtcbiAgY29uc3QgYXNpZGUgPSBBcnJheS5mcm9tKHJvb3QucXVlcnlTZWxlY3RvckFsbD8uKFwiYXNpZGVcIikgPz8gW10pXG4gICAgLmZpbmQoKGNhbmRpZGF0ZSk6IGNhbmRpZGF0ZSBpcyBIVE1MRWxlbWVudCA9PiBjYW5kaWRhdGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCAmJiAhIXZpc2libGVCb3goY2FuZGlkYXRlKSk7XG4gIGlmICghYXNpZGUpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGNvbnRyb2xzID0gdmlzaWJsZUNvbnRyb2xzKGFzaWRlKVxuICAgIC5tYXAoKGNvbnRyb2wpID0+ICh7IGNvbnRyb2wsIGxhYmVsOiBub3JtYWxpemVMYWJlbChjb250cm9sTGFiZWwoY29udHJvbCkpIH0pKVxuICAgIC5maWx0ZXIoKGl0ZW0pID0+IE1BSU5fU0lERUJBUl9BQ1RJT05fTEFCRUxTLnNvbWUoKG1hcmtlcikgPT4gbGFiZWxNYXRjaGVzKGl0ZW0ubGFiZWwsIG1hcmtlcikpKTtcbiAgaWYgKCFjb250cm9scy5sZW5ndGgpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHNvcnRlZENvbnRyb2xzID0gY29udHJvbHNcbiAgICAubWFwKChpdGVtKSA9PiBpdGVtLmNvbnRyb2wpXG4gICAgLnNvcnQoY29tcGFyZURvY3VtZW50UG9zaXRpb24pO1xuICBjb25zdCB0ZW1wbGF0ZUNvbnRyb2wgPSBzb3J0ZWRDb250cm9sc1swXTtcbiAgaWYgKCF0ZW1wbGF0ZUNvbnRyb2wpIHJldHVybiBudWxsO1xuICBjb25zdCBncm91cCA9IGFjdGlvbkdyb3VwRm9yKGFzaWRlLCBzb3J0ZWRDb250cm9scyk7XG4gIGNvbnN0IHRlbXBsYXRlID0gcm93SW5Hcm91cChncm91cCwgdGVtcGxhdGVDb250cm9sKTtcbiAgY29uc3Qgcm93cyA9IHNvcnRlZENvbnRyb2xzLm1hcCgoY29udHJvbCkgPT4gcm93SW5Hcm91cChncm91cCwgY29udHJvbCkpLmZpbHRlcihCb29sZWFuKTtcbiAgY29uc3Qgc29ydGVkUm93cyA9IHJvd3Muc29ydChjb21wYXJlRG9jdW1lbnRQb3NpdGlvbik7XG4gIGNvbnN0IGluc2VydEJlZm9yZSA9IHNvcnRlZFJvd3NbMF0gPz8gdGVtcGxhdGU7XG4gIGNvbnN0IGluc2VydEFmdGVyID0gc29ydGVkUm93cy5hdCgtMSkgPz8gdGVtcGxhdGU7XG4gIHJldHVybiB7IGNvbnRhaW5lcjogZ3JvdXAsIHRlbXBsYXRlLCBpbnNlcnRCZWZvcmUsIGluc2VydEFmdGVyIH07XG59XG5cbmZ1bmN0aW9uIHZpc2libGVDb250cm9scyhyb290OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50W10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiYnV0dG9uLGEsW3JvbGU9J2J1dHRvbiddLFtyb2xlPSdsaW5rJ11cIikpXG4gICAgLmZpbHRlcigoY29udHJvbCkgPT4ge1xuICAgICAgaWYgKGNvbnRyb2wuY2xvc2VzdChcIltkYXRhLWNvZGV4cHAtc2lkZWJhci1hY3Rpb25dXCIpKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBsYWJlbCA9IGNvbnRyb2xMYWJlbChjb250cm9sKTtcbiAgICAgIGlmICghbGFiZWwpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGJveCA9IHZpc2libGVCb3goY29udHJvbCk7XG4gICAgICByZXR1cm4gISFib3g7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFjdGlvbkdyb3VwRm9yKGFzaWRlOiBIVE1MRWxlbWVudCwgY29udHJvbHM6IEhUTUxFbGVtZW50W10pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGZpcnN0ID0gY29udHJvbHNbMF07XG4gIGlmICghZmlyc3QpIHJldHVybiBhc2lkZTtcbiAgbGV0IG5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGZpcnN0LnBhcmVudEVsZW1lbnQ7XG4gIHdoaWxlIChub2RlICYmIG5vZGUgIT09IGFzaWRlKSB7XG4gICAgY29uc3QgY2hpbGRSb3dzID0gY29udHJvbHNcbiAgICAgIC5tYXAoKGNvbnRyb2wpID0+IGNoaWxkSW5Db250YWluZXIobm9kZSBhcyBIVE1MRWxlbWVudCwgY29udHJvbCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGlmIChuZXcgU2V0KGNoaWxkUm93cykuc2l6ZSA+PSBNYXRoLm1pbigyLCBjb250cm9scy5sZW5ndGgpKSByZXR1cm4gbm9kZTtcbiAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICB9XG4gIHJldHVybiBmaXJzdC5wYXJlbnRFbGVtZW50IHx8IGFzaWRlO1xufVxuXG5mdW5jdGlvbiByb3dJbkdyb3VwKGdyb3VwOiBIVE1MRWxlbWVudCwgY29udHJvbDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGxldCBub2RlOiBIVE1MRWxlbWVudCA9IGNvbnRyb2w7XG4gIHdoaWxlIChub2RlLnBhcmVudEVsZW1lbnQgJiYgbm9kZS5wYXJlbnRFbGVtZW50ICE9PSBncm91cCkgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgcmV0dXJuIG5vZGU7XG59XG5cbmZ1bmN0aW9uIGNoaWxkSW5Db250YWluZXIoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgY29udHJvbDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgPSBjb250cm9sO1xuICB3aGlsZSAobm9kZS5wYXJlbnRFbGVtZW50ICYmIG5vZGUucGFyZW50RWxlbWVudCAhPT0gY29udGFpbmVyKSBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICByZXR1cm4gbm9kZS5wYXJlbnRFbGVtZW50ID09PSBjb250YWluZXIgPyBub2RlIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gc2FuaXRpemVBY3Rpb25Ob2RlKG5vZGU6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGFsbCA9IFtub2RlLCAuLi5BcnJheS5mcm9tKG5vZGUucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCIqXCIpKV07XG4gIGZvciAoY29uc3QgZWwgb2YgYWxsKSB7XG4gICAgZm9yIChjb25zdCBhdHRyIG9mIEFycmF5LmZyb20oZWwuYXR0cmlidXRlcykpIHtcbiAgICAgIGlmIChhdHRyLm5hbWUuc3RhcnRzV2l0aChcImRhdGEtYXBwLWFjdGlvblwiKSkgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIubmFtZSk7XG4gICAgICBpZiAoYXR0ci5uYW1lID09PSBcImhyZWZcIiB8fCBhdHRyLm5hbWUgPT09IFwiYXJpYS1jdXJyZW50XCIpIGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyLm5hbWUpO1xuICAgIH1cbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBIVE1MQnV0dG9uRWxlbWVudCkgZWwudHlwZSA9IFwiYnV0dG9uXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW50ZXJhY3RpdmVUYXJnZXQobm9kZTogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGlmIChtYXRjaGVzQ29udHJvbChub2RlKSkgcmV0dXJuIG5vZGU7XG4gIHJldHVybiBub2RlLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiYnV0dG9uLGEsW3JvbGU9J2J1dHRvbiddLFtyb2xlPSdsaW5rJ11cIikgfHwgbm9kZTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc0NvbnRyb2wobm9kZTogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5vZGUubWF0Y2hlcyhcImJ1dHRvbixhLFtyb2xlPSdidXR0b24nXSxbcm9sZT0nbGluayddXCIpO1xufVxuXG5mdW5jdGlvbiBzZXRBY3RpdmVBdHRyaWJ1dGVzKG5vZGU6IEhUTUxFbGVtZW50LCBhY3RpdmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGFjdGl2ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIsIFwicGFnZVwiKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgXCJ0cnVlXCIpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiLCBcImFjdGl2ZVwiKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIsIFwidHJ1ZVwiKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImRhdGEtc2VsZWN0ZWRcIiwgXCJ0cnVlXCIpO1xuICB9IGVsc2Uge1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIpO1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiKTtcbiAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIik7XG4gICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLWFjdGl2ZVwiKTtcbiAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc2VsZWN0ZWRcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlOYXRpdmVMaWtlQWN0aXZlU3R5bGUodGFyZ2V0OiBIVE1MRWxlbWVudCwgYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGNvbnRlbnQgPSBhY3RpdmVDb250ZW50RWxlbWVudCh0YXJnZXQpO1xuICBjb25zdCBpY29uID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3I8U1ZHRWxlbWVudD4oXCJzdmdcIik7XG4gIGlmIChhY3RpdmUpIHtcbiAgICB0YXJnZXQuY2xhc3NMaXN0LnJlbW92ZShcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xuICAgIHRhcmdldC5jbGFzc0xpc3QuYWRkKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIGNvbnRlbnQ/LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXRva2VuLWZvcmVncm91bmRcIik7XG4gICAgY29udGVudD8uY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgaWNvbj8uY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuY2xhc3NMaXN0LmFkZChcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xuICAgIHRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIGNvbnRlbnQ/LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXRva2VuLWZvcmVncm91bmRcIik7XG4gICAgY29udGVudD8uY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgaWNvbj8uY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhY3RpdmVDb250ZW50RWxlbWVudCh0YXJnZXQ6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgdG9rZW5FbGVtZW50ID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgIFwiLnRleHQtdG9rZW4tZm9yZWdyb3VuZCwudGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiLFxuICApO1xuICBpZiAodG9rZW5FbGVtZW50KSByZXR1cm4gdG9rZW5FbGVtZW50O1xuICByZXR1cm4gdGFyZ2V0LmZpcnN0RWxlbWVudENoaWxkIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgPyB0YXJnZXQuZmlyc3RFbGVtZW50Q2hpbGQgOiB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIHN5bmNOYXRpdmVTaWRlYmFyQWN0aXZlU3RhdGUoKTogdm9pZCB7XG4gIGlmIChoYXNBY3RpdmVSZWNvcmQoKSkgbXV0ZU5hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xuICBlbHNlIHJlc3RvcmVOYXRpdmVTaWRlYmFyQWN0aXZlU3RhdGUoKTtcbn1cblxuZnVuY3Rpb24gaGFzQWN0aXZlUmVjb3JkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gQXJyYXkuZnJvbShyZWNvcmRzLnZhbHVlcygpKS5zb21lKChyZWNvcmQpID0+IHJlY29yZC5vcHRpb25zLmFjdGl2ZSAmJiByZWNvcmQubm9kZT8uaXNDb25uZWN0ZWQpO1xufVxuXG5mdW5jdGlvbiBtdXRlTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKHJvb3Q6IFBhcmVudE5vZGUgPSBkb2N1bWVudCk6IHZvaWQge1xuICBjb25zdCBhc2lkZSA9IEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsPy4oXCJhc2lkZVwiKSA/PyBbXSlcbiAgICAuZmluZCgoY2FuZGlkYXRlKTogY2FuZGlkYXRlIGlzIEhUTUxFbGVtZW50ID0+IGNhbmRpZGF0ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmICEhdmlzaWJsZUJveChjYW5kaWRhdGUpKTtcbiAgaWYgKCFhc2lkZSkgcmV0dXJuO1xuXG4gIGNvbnN0IGNvbnRyb2xzID0gQXJyYXkuZnJvbShcbiAgICBhc2lkZS5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImJ1dHRvbixhLFtyb2xlPSdidXR0b24nXSxbcm9sZT0nbGluayddXCIpLFxuICApO1xuICBmb3IgKGNvbnN0IGNvbnRyb2wgb2YgY29udHJvbHMpIHtcbiAgICBpZiAoY29udHJvbC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zaWRlYmFyLWFjdGlvbl1cIikpIGNvbnRpbnVlO1xuICAgIGlmICghaXNOYXRpdmVBY3RpdmVDb250cm9sKGNvbnRyb2wpKSBjb250aW51ZTtcbiAgICBtdXRlTmF0aXZlQWN0aXZlRWxlbWVudChjb250cm9sKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGFjdGl2ZVNlbGVjdGlvbkRlc2NlbmRhbnRzKGNvbnRyb2wpKSBtdXRlTmF0aXZlQWN0aXZlRWxlbWVudChjaGlsZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzdG9yZU5hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBbZWxlbWVudCwgc3RhdGVdIG9mIEFycmF5LmZyb20obXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50cy5lbnRyaWVzKCkpKSB7XG4gICAgaWYgKGVsZW1lbnQuaXNDb25uZWN0ZWQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gc3RhdGUuY2xhc3NOYW1lO1xuICAgICAgcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQsIFwiYXJpYS1jdXJyZW50XCIsIHN0YXRlLmFyaWFDdXJyZW50KTtcbiAgICAgIHJlc3RvcmVOdWxsYWJsZUF0dHJpYnV0ZShlbGVtZW50LCBcImFyaWEtc2VsZWN0ZWRcIiwgc3RhdGUuYXJpYVNlbGVjdGVkKTtcbiAgICAgIHJlc3RvcmVOdWxsYWJsZUF0dHJpYnV0ZShlbGVtZW50LCBcImRhdGEtc3RhdGVcIiwgc3RhdGUuZGF0YVN0YXRlKTtcbiAgICAgIHJlc3RvcmVOdWxsYWJsZUF0dHJpYnV0ZShlbGVtZW50LCBcImRhdGEtYWN0aXZlXCIsIHN0YXRlLmRhdGFBY3RpdmUpO1xuICAgICAgcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQsIFwiZGF0YS1zZWxlY3RlZFwiLCBzdGF0ZS5kYXRhU2VsZWN0ZWQpO1xuICAgIH1cbiAgICBtdXRlZE5hdGl2ZUFjdGl2ZUVsZW1lbnRzLmRlbGV0ZShlbGVtZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtdXRlTmF0aXZlQWN0aXZlRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBpZiAoIW11dGVkTmF0aXZlQWN0aXZlRWxlbWVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgbXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50cy5zZXQoZWxlbWVudCwge1xuICAgICAgY2xhc3NOYW1lOiBlbGVtZW50LmNsYXNzTmFtZSxcbiAgICAgIGFyaWFDdXJyZW50OiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSxcbiAgICAgIGFyaWFTZWxlY3RlZDogZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpLFxuICAgICAgZGF0YVN0YXRlOiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIiksXG4gICAgICBkYXRhQWN0aXZlOiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIpLFxuICAgICAgZGF0YVNlbGVjdGVkOiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtc2VsZWN0ZWRcIiksXG4gICAgfSk7XG4gIH1cblxuICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKTtcbiAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpO1xuICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIik7XG4gIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1hY3RpdmVcIik7XG4gIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1zZWxlY3RlZFwiKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFxuICAgIFwiYWN0aXZlXCIsXG4gICAgXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIixcbiAgICBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIixcbiAgICBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiLFxuICApO1xuICBpZiAobWF0Y2hlc0NvbnRyb2woZWxlbWVudCkpIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xufVxuXG5mdW5jdGlvbiBhY3RpdmVTZWxlY3Rpb25EZXNjZW5kYW50cyhjb250cm9sOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50W10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShcbiAgICBjb250cm9sLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFxuICAgICAgXCIuYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kLC50ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1mb3JlZ3JvdW5kLC50ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1pY29uLWZvcmVncm91bmRcIixcbiAgICApLFxuICApO1xufVxuXG5mdW5jdGlvbiBpc05hdGl2ZUFjdGl2ZUNvbnRyb2woY29udHJvbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIpID09PSBcInBhZ2VcIiB8fFxuICAgIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiKSA9PT0gXCJ0cnVlXCIgfHxcbiAgICBjb250cm9sLmdldEF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIikgPT09IFwiYWN0aXZlXCIgfHxcbiAgICBjb250cm9sLmdldEF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIpID09PSBcInRydWVcIiB8fFxuICAgIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiZGF0YS1zZWxlY3RlZFwiKSA9PT0gXCJ0cnVlXCIgfHxcbiAgICBjb250cm9sLmNsYXNzTGlzdC5jb250YWlucyhcImFjdGl2ZVwiKSB8fFxuICAgIGNvbnRyb2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpIHx8XG4gICAgYWN0aXZlU2VsZWN0aW9uRGVzY2VuZGFudHMoY29udHJvbCkubGVuZ3RoID4gMDtcbn1cblxuZnVuY3Rpb24gcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIGVsc2UgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlQWN0aW9uSWNvbihub2RlOiBIVE1MRWxlbWVudCwgaWNvblN2Zz86IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBzdmcgPSBwYXJzZVN2ZyhpY29uU3ZnIHx8IGRlZmF1bHRTaWRlYmFySWNvblN2ZygpKTtcbiAgY29uc3QgY3VycmVudCA9IG5vZGUucXVlcnlTZWxlY3RvcihcInN2Z1wiKTtcbiAgaWYgKGN1cnJlbnQgJiYgc3ZnKSB7XG4gICAgY29weUljb25QcmVzZW50YXRpb24oY3VycmVudCwgc3ZnKTtcbiAgICBjdXJyZW50LnJlcGxhY2VXaXRoKHN2Zyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzdmcpIG5vZGUucHJlcGVuZChzdmcpO1xufVxuXG5mdW5jdGlvbiBjb3B5SWNvblByZXNlbnRhdGlvbihmcm9tOiBTVkdFbGVtZW50LCB0bzogU1ZHRWxlbWVudCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGF0dHIgb2YgW1wiY2xhc3NcIiwgXCJzdHlsZVwiLCBcIndpZHRoXCIsIFwiaGVpZ2h0XCJdKSB7XG4gICAgY29uc3QgdmFsdWUgPSBmcm9tLmdldEF0dHJpYnV0ZShhdHRyKTtcbiAgICBpZiAodmFsdWUpIHRvLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XG4gIH1cbiAgaWYgKCF0by5nZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiKSAmJiAhdG8uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikpIHRvLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiMTZcIik7XG4gIGlmICghdG8uZ2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIpICYmICF0by5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSkgdG8uc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiMTZcIik7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VBY3Rpb25MYWJlbChub2RlOiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCB0ZXh0Tm9kZXM6IFRleHRbXSA9IFtdO1xuICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKG5vZGUsIE5vZGVGaWx0ZXIuU0hPV19URVhUKTtcbiAgd2hpbGUgKHdhbGtlci5uZXh0Tm9kZSgpKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHdhbGtlci5jdXJyZW50Tm9kZTtcbiAgICBpZiAoY3VycmVudCBpbnN0YW5jZW9mIFRleHQgJiYgY2xlYW5TdHJpbmcoY3VycmVudC50ZXh0Q29udGVudCkpIHRleHROb2Rlcy5wdXNoKGN1cnJlbnQpO1xuICB9XG4gIGlmICh0ZXh0Tm9kZXMubGVuZ3RoKSB7XG4gICAgdGV4dE5vZGVzWzBdLnRleHRDb250ZW50ID0gbGFiZWw7XG4gICAgZm9yIChjb25zdCBleHRyYSBvZiB0ZXh0Tm9kZXMuc2xpY2UoMSkpIHJlbW92ZUFjY2Vzc29yeVRleHROb2RlKGV4dHJhLCBub2RlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBzcGFuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIG5vZGUuYXBwZW5kQ2hpbGQoc3Bhbik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUFjY2Vzc29yeVRleHROb2RlKHRleHQ6IFRleHQsIHJvb3Q6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IG9yaWdpbmFsID0gY2xlYW5TdHJpbmcodGV4dC50ZXh0Q29udGVudCk7XG4gIGxldCBub2RlOiBIVE1MRWxlbWVudCB8IG51bGwgPSB0ZXh0LnBhcmVudEVsZW1lbnQ7XG4gIHdoaWxlIChub2RlICYmIG5vZGUgIT09IHJvb3QpIHtcbiAgICBjb25zdCBjb250ZW50ID0gY2xlYW5TdHJpbmcobm9kZS50ZXh0Q29udGVudCk7XG4gICAgY29uc3QgaGFzR3JhcGhpYyA9ICEhbm9kZS5xdWVyeVNlbGVjdG9yKFwic3ZnLGltZ1wiKTtcbiAgICBpZiAoY29udGVudCA9PT0gb3JpZ2luYWwgJiYgIWhhc0dyYXBoaWMpIHtcbiAgICAgIG5vZGUucmVtb3ZlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gIH1cbiAgdGV4dC50ZXh0Q29udGVudCA9IFwiXCI7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3ZnKHN2Z1RleHQ6IHN0cmluZyk6IFNWR0VsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG4gIHRlbXBsYXRlLmlubmVySFRNTCA9IHN2Z1RleHQudHJpbSgpO1xuICBjb25zdCBzdmcgPSB0ZW1wbGF0ZS5jb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIik7XG4gIGlmICghKHN2ZyBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpKSByZXR1cm4gbnVsbDtcbiAgc3ZnLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgc3ZnLnNldEF0dHJpYnV0ZShcImZvY3VzYWJsZVwiLCBcImZhbHNlXCIpO1xuICByZXR1cm4gc3ZnO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0U2lkZWJhckljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuICc8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTQgMTEuNSAxMiA1bDggNi41XCI+PC9wYXRoPjxwYXRoIGQ9XCJNNiAxMC41VjIwaDEydi05LjVcIj48L3BhdGg+PHBhdGggZD1cIk0xMCAyMHYtNWg0djVcIj48L3BhdGg+PC9zdmc+Jztcbn1cblxuZnVuY3Rpb24gY29udHJvbExhYmVsKGVsOiBIVE1MRWxlbWVudCk6IHN0cmluZyB7XG4gIHJldHVybiBjbGVhblN0cmluZyhlbC5nZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIpKSB8fFxuICAgIGNsZWFuU3RyaW5nKGVsLmdldEF0dHJpYnV0ZShcInRpdGxlXCIpKSB8fFxuICAgIGNsZWFuU3RyaW5nKGVsLnRleHRDb250ZW50KTtcbn1cblxuZnVuY3Rpb24gbGFiZWxNYXRjaGVzKGxhYmVsOiBzdHJpbmcsIG1hcmtlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBsYWJlbCA9PT0gbWFya2VyIHx8IGxhYmVsLmluY2x1ZGVzKG1hcmtlcik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxhYmVsKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY2xlYW5TdHJpbmcodmFsdWUpXG4gICAgLnRvTG9jYWxlTG93ZXJDYXNlKClcbiAgICAubm9ybWFsaXplKFwiTkZEXCIpXG4gICAgLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1tcdTIwMTlcdTIwMThgXHUwMEI0XS9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGNsZWFuU3RyaW5nKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS50cmltKCkgPyB2YWx1ZS50cmltKCkgOiBcIlwiO1xufVxuXG5mdW5jdGlvbiB2aXNpYmxlQm94KGVsOiBIVE1MRWxlbWVudCk6IERPTVJlY3QgfCBudWxsIHtcbiAgaWYgKCFlbC5pc0Nvbm5lY3RlZCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gIGlmIChzdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fCBzdHlsZS52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBpZiAocmVjdC53aWR0aCA8PSAwIHx8IHJlY3QuaGVpZ2h0IDw9IDApIHJldHVybiBudWxsO1xuICByZXR1cm4gcmVjdDtcbn1cblxuZnVuY3Rpb24gY29tcGFyZURvY3VtZW50UG9zaXRpb24oYTogSFRNTEVsZW1lbnQsIGI6IEhUTUxFbGVtZW50KTogbnVtYmVyIHtcbiAgaWYgKGEgPT09IGIpIHJldHVybiAwO1xuICByZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSAmIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRk9MTE9XSU5HID8gLTEgOiAxO1xufVxuIiwgIi8qKlxuICogQnVpbHQtaW4gXCJUd2VhayBNYW5hZ2VyXCIgXHUyMDE0IGF1dG8taW5qZWN0ZWQgYnkgdGhlIHJ1bnRpbWUsIG5vdCBhIHVzZXIgdHdlYWsuXG4gKiBMaXN0cyBkaXNjb3ZlcmVkIHR3ZWFrcyB3aXRoIGVuYWJsZSB0b2dnbGVzLCBvcGVucyB0aGUgdHdlYWtzIGRpciwgbGlua3NcbiAqIHRvIGxvZ3MgYW5kIGNvbmZpZy4gTGl2ZXMgaW4gdGhlIHJlbmRlcmVyLlxuICpcbiAqIFRoaXMgaXMgaW52b2tlZCBmcm9tIHByZWxvYWQvaW5kZXgudHMgQUZURVIgdXNlciB0d2Vha3MgYXJlIGxvYWRlZCBzbyBpdFxuICogY2FuIHNob3cgdXAtdG8tZGF0ZSBzdGF0dXMuXG4gKi9cbmltcG9ydCB7IGlwY1JlbmRlcmVyIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgeyByZWdpc3RlclNlY3Rpb24gfSBmcm9tIFwiLi9zZXR0aW5ncy1pbmplY3RvclwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW91bnRNYW5hZ2VyKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB0d2Vha3MgPSAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpsaXN0LXR3ZWFrc1wiKSkgYXMgQXJyYXk8e1xuICAgIG1hbmlmZXN0OiB7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgdmVyc2lvbjogc3RyaW5nOyBkZXNjcmlwdGlvbj86IHN0cmluZyB9O1xuICAgIGVudHJ5RXhpc3RzOiBib29sZWFuO1xuICB9PjtcbiAgY29uc3QgcGF0aHMgPSAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDp1c2VyLXBhdGhzXCIpKSBhcyB7XG4gICAgdXNlclJvb3Q6IHN0cmluZztcbiAgICB0d2Vha3NEaXI6IHN0cmluZztcbiAgICBsb2dEaXI6IHN0cmluZztcbiAgfTtcblxuICByZWdpc3RlclNlY3Rpb24oe1xuICAgIGlkOiBcImNvZGV4LXBsdXNwbHVzOm1hbmFnZXJcIixcbiAgICB0aXRsZTogXCJUd2VhayBNYW5hZ2VyXCIsXG4gICAgZGVzY3JpcHRpb246IGAke3R3ZWFrcy5sZW5ndGh9IHR3ZWFrKHMpIGluc3RhbGxlZC4gVXNlciBkaXI6ICR7cGF0aHMudXNlclJvb3R9YCxcbiAgICByZW5kZXIocm9vdCkge1xuICAgICAgcm9vdC5zdHlsZS5jc3NUZXh0ID0gXCJkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo4cHg7XCI7XG5cbiAgICAgIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgYWN0aW9ucy5zdHlsZS5jc3NUZXh0ID0gXCJkaXNwbGF5OmZsZXg7Z2FwOjhweDtmbGV4LXdyYXA6d3JhcDtcIjtcbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGJ1dHRvbihcIk9wZW4gdHdlYWtzIGZvbGRlclwiLCAoKSA9PlxuICAgICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6cmV2ZWFsXCIsIHBhdGhzLnR3ZWFrc0RpcikuY2F0Y2goKCkgPT4ge30pLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGJ1dHRvbihcIk9wZW4gbG9nc1wiLCAoKSA9PlxuICAgICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6cmV2ZWFsXCIsIHBhdGhzLmxvZ0RpcikuY2F0Y2goKCkgPT4ge30pLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGJ1dHRvbihcIlJlbG9hZCB3aW5kb3dcIiwgKCkgPT4gbG9jYXRpb24ucmVsb2FkKCkpLFxuICAgICAgKTtcbiAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoYWN0aW9ucyk7XG5cbiAgICAgIGlmICh0d2Vha3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IGVtcHR5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgICAgIGVtcHR5LnN0eWxlLmNzc1RleHQgPSBcImNvbG9yOiM4ODg7Zm9udDoxM3B4IHN5c3RlbS11aTttYXJnaW46OHB4IDA7XCI7XG4gICAgICAgIGVtcHR5LnRleHRDb250ZW50ID1cbiAgICAgICAgICBcIk5vIHVzZXIgdHdlYWtzIHlldC4gRHJvcCBhIGZvbGRlciB3aXRoIG1hbmlmZXN0Lmpzb24gKyBpbmRleC5qcyBpbnRvIHRoZSB0d2Vha3MgZGlyLCB0aGVuIHJlbG9hZC5cIjtcbiAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChlbXB0eSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcbiAgICAgIGxpc3Quc3R5bGUuY3NzVGV4dCA9IFwibGlzdC1zdHlsZTpub25lO21hcmdpbjowO3BhZGRpbmc6MDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo2cHg7XCI7XG4gICAgICBmb3IgKGNvbnN0IHQgb2YgdHdlYWtzKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBsaS5zdHlsZS5jc3NUZXh0ID1cbiAgICAgICAgICBcImRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47cGFkZGluZzo4cHggMTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJvcmRlciwjMmEyYTJhKTtib3JkZXItcmFkaXVzOjZweDtcIjtcbiAgICAgICAgY29uc3QgbGVmdCA9IHR3ZWFrU3VtbWFyeSh0KTtcbiAgICAgICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICByaWdodC5zdHlsZS5jc3NUZXh0ID0gXCJjb2xvcjojODg4O2ZvbnQ6MTJweCBzeXN0ZW0tdWk7XCI7XG4gICAgICAgIHJpZ2h0LnRleHRDb250ZW50ID0gdC5lbnRyeUV4aXN0cyA/IFwibG9hZGVkXCIgOiBcIm1pc3NpbmcgZW50cnlcIjtcbiAgICAgICAgbGkuYXBwZW5kKGxlZnQsIHJpZ2h0KTtcbiAgICAgICAgbGlzdC5hcHBlbmQobGkpO1xuICAgICAgfVxuICAgICAgcm9vdC5hcHBlbmQobGlzdCk7XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbmNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYi50eXBlID0gXCJidXR0b25cIjtcbiAgYi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBiLnN0eWxlLmNzc1RleHQgPVxuICAgIFwicGFkZGluZzo2cHggMTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJvcmRlciwjMzMzKTtib3JkZXItcmFkaXVzOjZweDtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O2NvbG9yOmluaGVyaXQ7Zm9udDoxMnB4IHN5c3RlbS11aTtjdXJzb3I6cG9pbnRlcjtcIjtcbiAgYi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25jbGljayk7XG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiB0d2Vha1N1bW1hcnkodHdlYWs6IHtcbiAgbWFuaWZlc3Q6IHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyB2ZXJzaW9uOiBzdHJpbmc7IGRlc2NyaXB0aW9uPzogc3RyaW5nIH07XG59KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLnN0eWxlLmNzc1RleHQgPSBcImZvbnQ6NjAwIDEzcHggc3lzdGVtLXVpO1wiO1xuICB0aXRsZS5hcHBlbmQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodHdlYWsubWFuaWZlc3QubmFtZSArIFwiIFwiKSk7XG5cbiAgY29uc3QgdmVyc2lvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICB2ZXJzaW9uLnN0eWxlLmNzc1RleHQgPSBcImNvbG9yOiM4ODg7Zm9udC13ZWlnaHQ6NDAwO1wiO1xuICB2ZXJzaW9uLnRleHRDb250ZW50ID0gYHYke3R3ZWFrLm1hbmlmZXN0LnZlcnNpb259YDtcbiAgdGl0bGUuYXBwZW5kQ2hpbGQodmVyc2lvbik7XG5cbiAgY29uc3QgZGVzY3JpcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjcmlwdGlvbi5zdHlsZS5jc3NUZXh0ID0gXCJjb2xvcjojODg4O2ZvbnQ6MTJweCBzeXN0ZW0tdWk7XCI7XG4gIGRlc2NyaXB0aW9uLnRleHRDb250ZW50ID0gdHdlYWsubWFuaWZlc3QuZGVzY3JpcHRpb24gPz8gdHdlYWsubWFuaWZlc3QuaWQ7XG5cbiAgbGVmdC5hcHBlbmQodGl0bGUsIGRlc2NyaXB0aW9uKTtcbiAgcmV0dXJuIGxlZnQ7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFXQSxJQUFBQSxtQkFBNEI7OztBQzZCckIsU0FBUyxtQkFBeUI7QUFDdkMsTUFBSSxPQUFPLCtCQUFnQztBQUMzQyxRQUFNLFlBQVksb0JBQUksSUFBK0I7QUFDckQsTUFBSSxTQUFTO0FBQ2IsUUFBTSxZQUFZLG9CQUFJLElBQTRDO0FBRWxFLFFBQU0sT0FBMEI7QUFBQSxJQUM5QixlQUFlO0FBQUEsSUFDZjtBQUFBLElBQ0EsT0FBTyxVQUFVO0FBQ2YsWUFBTSxLQUFLO0FBQ1gsZ0JBQVUsSUFBSSxJQUFJLFFBQVE7QUFFMUIsY0FBUTtBQUFBLFFBQ047QUFBQSxRQUNBLFNBQVM7QUFBQSxRQUNULFNBQVM7QUFBQSxNQUNYO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFBQSxJQUNBLEdBQUcsT0FB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WUFBcUI7QUFDdEQsaUNBQVksS0FBSywyQkFBMkIsVUFBVSxPQUFPO0FBQUEsRUFDL0Q7QUFDQSxrQkFBZ0IsSUFBSSxVQUFVLFFBQVE7QUFDdEMsK0JBQVksR0FBRyw0QkFBNEIsUUFBUSxHQUFHLFFBQVE7QUFDOUQsU0FBTztBQUNUO0FBRUEsU0FBUyxtQ0FDUCxVQUNBLGlCQUNTO0FBQ1QsUUFBTSxXQUFXLGdCQUFnQixJQUFJLFFBQVE7QUFDN0MsTUFBSSxDQUFDLFNBQVUsUUFBTztBQUN0QixrQkFBZ0IsT0FBTyxRQUFRO0FBQy9CLCtCQUFZLGVBQWUsNEJBQTRCLFFBQVEsR0FBRyxRQUFRO0FBQzFFLFNBQU87QUFDVDsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2VsZWN0cm9uIiwgInJvb3QiLCAic3RhdGUiLCAiY2hlY2siLCAiYnV0dG9uIiwgImNhcmQiLCAiaW1wb3J0X2VsZWN0cm9uIiwgInNvdXJjZSIsICJtb2R1bGUiLCAiZXhwb3J0cyIsICJvYnNlcnZlciIsICJlbnN1cmVPYnNlcnZlciIsICJzdGF0ZSIsICJpbXBvcnRfZWxlY3Ryb24iLCAic2FmZVN0cmluZ2lmeSJdCn0K
