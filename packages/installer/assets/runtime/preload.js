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
  if (isForbiddenSettingsSidebarSurface(el)) return false;
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
  contentHost: null,
  hiddenContent: /* @__PURE__ */ new Map(),
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
    if (state.activePage && (!state.sidebarRoot?.isConnected || !state.contentHost?.isConnected)) {
      restoreCodexView();
    }
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
  if (state.activePage && (state.sidebarRoot !== outer || state.contentHost !== findContentArea())) {
    restoreCodexView();
  }
  state.sidebarRoot = outer;
  removeSettingsGroupsOutsideRoot(outer);
  syncNativeSettingsHeader(itemsGroup, outer);
  if (state.navGroup && outer.contains(state.navGroup)) {
    syncPagesGroup();
    if (state.activePage !== null) syncCodexNativeNavActive(true);
    return;
  }
  if (state.activePage !== null || state.panelHost !== null || state.contentHost !== null) {
    plog("sidebar re-mount detected; clearing stale active state", {
      prevActive: state.activePage
    });
    state.activePage = null;
    state.panelHost = null;
    state.contentHost = null;
    state.hiddenContent.clear();
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
    if (state.activePage) restoreCodexView();
    plog("activate: content area not found");
    return;
  }
  if (state.contentHost && state.contentHost !== content) restoreCodexView();
  state.activePage = page;
  state.contentHost = content;
  plog("activate", { page });
  for (const child of Array.from(content.children)) {
    if (child.dataset.codexpp === "tweaks-panel") continue;
    if (!state.hiddenContent.has(child)) state.hiddenContent.set(child, child.style.display);
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
  if (state.panelHost) state.panelHost.style.display = "none";
  state.panelHost = null;
  for (const [child, display] of state.hiddenContent) child.style.display = display;
  state.hiddenContent.clear();
  state.contentHost = null;
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
        const ref = window.prompt("Git ref", config.updateRef || "master");
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
  const workspaceRow = sidebar.closest("[data-app-shell-workspace-row]");
  if (workspaceRow) {
    const surfaces = Array.from(
      workspaceRow.querySelectorAll('[data-app-shell-main-surface="default"]')
    ).filter((surface) => surface.closest("[data-app-shell-workspace-row]") === workspaceRow && !surface.contains(sidebar) && !sidebar.contains(surface));
    const areas = surfaces.flatMap((surface) => Array.from(surface.querySelectorAll('[data-app-shell-focus-area="main"]')).filter((area) => area.closest('[data-app-shell-main-surface="default"]') === surface).filter((area) => isVisibleSettingsContent(area, workspaceRow)));
    if (areas.length === 1) return areas[0];
    plog("content area rejected", {
      reason: areas.length === 0 ? "no visible native main in settings row" : "ambiguous native main in settings row"
    });
    return null;
  }
  const navRoot = sidebar.closest('nav, aside, [role="navigation"], .overflow-y-auto');
  const legacyRow = navRoot?.parentElement;
  if (!navRoot || !isSettingsSidebarCandidate(navRoot) || !legacyRow || legacyRow === document.body) {
    plog("content area rejected", { reason: "no identifiable legacy settings row" });
    return null;
  }
  const candidates = Array.from(legacyRow.children).filter((child) => child instanceof HTMLElement && !child.contains(navRoot)).filter((child) => {
    const rect = child.getBoundingClientRect();
    return rect.width > 300 && rect.height > 200;
  }).filter((child) => isVisibleSettingsContent(child, legacyRow)).filter((child) => getComputedStyle(child).position !== "absolute");
  if (candidates.length === 1) return candidates[0];
  plog("content area rejected", {
    reason: candidates.length ? "ambiguous legacy siblings" : "no visible legacy content"
  });
  return null;
}
function isVisibleSettingsContent(node, boundary) {
  if (!node.isConnected) return false;
  for (let current = node; current; current = current.parentElement) {
    if (current.hidden || current.hasAttribute("inert") || current.getAttribute("aria-hidden") === "true") return false;
    const style = getComputedStyle(current);
    if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse") return false;
    if (current === boundary) break;
  }
  const rect = node.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ByZWxvYWQvaW5kZXgudHMiLCAiLi4vc3JjL3ByZWxvYWQvcmVhY3QtaG9vay50cyIsICIuLi9zcmMvcHJlbG9hZC9zZXR0aW5ncy1pbmplY3Rvci50cyIsICIuLi9zcmMvdHdlYWstc3RvcmUudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3MtZG9tLWhldXJpc3RpY3MudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3MtaWNvbnMudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3Mtc3ZnLnRzIiwgIi4uL3NyYy9wcmVsb2FkL3R3ZWFrLWhvc3QudHMiLCAiLi4vc3JjL3ByZWxvYWQvZWxlbWVudC13YWl0ZXIudHMiLCAiLi4vc3JjL3ByZWxvYWQvdHdlYWstbW9kdWxlLWxvYWRlci50cyIsICIuLi9zcmMvcHJlbG9hZC9tYWluLXNpZGViYXItYWN0aW9ucy50cyIsICIuLi9zcmMvcHJlbG9hZC9tYW5hZ2VyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIFJlbmRlcmVyIHByZWxvYWQgZW50cnkuIFJ1bnMgaW4gYW4gaXNvbGF0ZWQgd29ybGQgYmVmb3JlIENvZGV4J3MgcGFnZSBKUy5cbiAqIFJlc3BvbnNpYmlsaXRpZXM6XG4gKiAgIDEuIEluc3RhbGwgYSBSZWFjdCBEZXZUb29scy1zaGFwZWQgZ2xvYmFsIGhvb2sgdG8gY2FwdHVyZSB0aGUgcmVuZGVyZXJcbiAqICAgICAgcmVmZXJlbmNlIHdoZW4gUmVhY3QgbW91bnRzLiBXZSB1c2UgdGhpcyBmb3IgZmliZXIgd2Fsa2luZy5cbiAqICAgMi4gQWZ0ZXIgRE9NQ29udGVudExvYWRlZCwga2ljayBvZmYgc2V0dGluZ3MtaW5qZWN0aW9uIGxvZ2ljLlxuICogICAzLiBEaXNjb3ZlciByZW5kZXJlci1zY29wZWQgdHdlYWtzICh2aWEgSVBDIHRvIG1haW4pIGFuZCBzdGFydCB0aGVtLlxuICogICA0LiBMaXN0ZW4gZm9yIGBjb2RleHBwOnR3ZWFrcy1jaGFuZ2VkYCBmcm9tIG1haW4gKGZpbGVzeXN0ZW0gd2F0Y2hlcikgYW5kXG4gKiAgICAgIGhvdC1yZWxvYWQgdHdlYWtzIHdpdGhvdXQgZHJvcHBpbmcgdGhlIHBhZ2UuXG4gKi9cblxuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGluc3RhbGxSZWFjdEhvb2sgfSBmcm9tIFwiLi9yZWFjdC1ob29rXCI7XG5pbXBvcnQgeyBzdGFydFNldHRpbmdzSW5qZWN0b3IgfSBmcm9tIFwiLi9zZXR0aW5ncy1pbmplY3RvclwiO1xuaW1wb3J0IHsgc3RhcnRUd2Vha0hvc3QsIHRlYXJkb3duVHdlYWtIb3N0IH0gZnJvbSBcIi4vdHdlYWstaG9zdFwiO1xuaW1wb3J0IHsgbW91bnRNYW5hZ2VyIH0gZnJvbSBcIi4vbWFuYWdlclwiO1xuXG5jb25zdCBCUk9XU0VSX1VJX0NPTk5FQ1RfUE9SVCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWNvbm5lY3QtYXBwLWhvc3RcIjtcbmNvbnN0IEJST1dTRVJfVUlfQlJJREdFX1JFUVVFU1QgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVxdWVzdFwiO1xuY29uc3QgQlJPV1NFUl9VSV9CUklER0VfUkVTUE9OU0UgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVzcG9uc2VcIjtcbmNvbnN0IEJST1dTRVJfVUlfTUVTU0FHRV9GT1JfVklFVyA9IFwiY29kZXhwcDpicm93c2VyLXVpLW1lc3NhZ2UtZm9yLXZpZXdcIjtcbmNvbnN0IEJST1dTRVJfVUlfV09SS0VSX01FU1NBR0UgPSBcImNvZGV4cHA6YnJvd3Nlci11aS13b3JrZXItbWVzc2FnZVwiO1xuY29uc3QgQlJPV1NFUl9VSV9TWVNURU1fVEhFTUUgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1zeXN0ZW0tdGhlbWVcIjtcblxuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVyA9IFwiY29kZXhfZGVza3RvcDptZXNzYWdlLWZyb20tdmlld1wiO1xuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZPUl9WSUVXID0gXCJjb2RleF9kZXNrdG9wOm1lc3NhZ2UtZm9yLXZpZXdcIjtcbmNvbnN0IERFU0tUT1BfU0hPV19DT05URVhUX01FTlUgPSBcImNvZGV4X2Rlc2t0b3A6c2hvdy1jb250ZXh0LW1lbnVcIjtcbmNvbnN0IERFU0tUT1BfU0hPV19BUFBMSUNBVElPTl9NRU5VID0gXCJjb2RleF9kZXNrdG9wOnNob3ctYXBwbGljYXRpb24tbWVudVwiO1xuY29uc3QgREVTS1RPUF9HRVRfU0VOVFJZX0lOSVRfT1BUSU9OUyA9IFwiY29kZXhfZGVza3RvcDpnZXQtc2VudHJ5LWluaXQtb3B0aW9uc1wiO1xuY29uc3QgREVTS1RPUF9HRVRfQlVJTERfRkxBVk9SID0gXCJjb2RleF9kZXNrdG9wOmdldC1idWlsZC1mbGF2b3JcIjtcbmNvbnN0IERFU0tUT1BfR0VUX1VTRVNfT1dMX0FQUF9TSEVMTCA9IFwiY29kZXhfZGVza3RvcDpnZXQtdXNlcy1vd2wtYXBwLXNoZWxsXCI7XG5jb25zdCBERVNLVE9QX0dFVF9TWVNURU1fVEhFTUVfVkFSSUFOVCA9IFwiY29kZXhfZGVza3RvcDpnZXQtc3lzdGVtLXRoZW1lLXZhcmlhbnRcIjtcbmNvbnN0IERFU0tUT1BfR0VUX1NIQVJFRF9PQkpFQ1RfU05BUFNIT1QgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LXNoYXJlZC1vYmplY3Qtc25hcHNob3RcIjtcbmNvbnN0IERFU0tUT1BfR0VUX0ZBU1RfTU9ERV9ST0xMT1VUX01FVFJJQ1MgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LWZhc3QtbW9kZS1yb2xsb3V0LW1ldHJpY3NcIjtcbmNvbnN0IERFU0tUT1BfU1lTVEVNX1RIRU1FX1VQREFURUQgPSBcImNvZGV4X2Rlc2t0b3A6c3lzdGVtLXRoZW1lLXZhcmlhbnQtdXBkYXRlZFwiO1xuY29uc3QgREVTS1RPUF9UUklHR0VSX1NFTlRSWV9URVNUID0gXCJjb2RleF9kZXNrdG9wOnRyaWdnZXItc2VudHJ5LXRlc3RcIjtcblxudHlwZSBNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lciA9IChtZXNzYWdlOiB1bmtub3duKSA9PiB1bmtub3duO1xuXG50eXBlIENvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcyA9IHtcbiAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI/OiAodHJhbnNmb3JtZXI6IE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyKSA9PiAoKSA9PiB2b2lkO1xuICB0cmFuc2Zvcm1NZXNzYWdlRnJvbVZpZXc/OiAobWVzc2FnZTogdW5rbm93bikgPT4gdW5rbm93bjtcbn07XG5cbmZ1bmN0aW9uIGRlc2t0b3BXb3JrZXJGcm9tVmlld0NoYW5uZWwod29ya2VySWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgY29kZXhfZGVza3RvcDp3b3JrZXI6JHt3b3JrZXJJZH06ZnJvbS12aWV3YDtcbn1cblxuZnVuY3Rpb24gZGVza3RvcFdvcmtlckZvclZpZXdDaGFubmVsKHdvcmtlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYGNvZGV4X2Rlc2t0b3A6d29ya2VyOiR7d29ya2VySWR9OmZvci12aWV3YDtcbn1cblxuLy8gRmlsZS1sb2cgcHJlbG9hZCBwcm9ncmVzcyBzbyB3ZSBjYW4gZGlhZ25vc2Ugd2l0aG91dCBEZXZUb29scy4gQmVzdC1lZmZvcnQ6XG4vLyBmYWlsdXJlcyBoZXJlIG11c3QgbmV2ZXIgdGhyb3cgYmVjYXVzZSB3ZSdkIHRha2UgdGhlIHBhZ2UgZG93biB3aXRoIHVzLlxuLy9cbi8vIENvZGV4J3MgcmVuZGVyZXIgaXMgc2FuZGJveGVkIChzYW5kYm94OiB0cnVlKSwgc28gYHJlcXVpcmUoXCJub2RlOmZzXCIpYCBpc1xuLy8gdW5hdmFpbGFibGUuIFdlIGZvcndhcmQgbG9nIGxpbmVzIHRvIG1haW4gdmlhIElQQzsgbWFpbiB3cml0ZXMgdGhlIGZpbGUuXG5mdW5jdGlvbiBmaWxlTG9nKHN0YWdlOiBzdHJpbmcsIGV4dHJhPzogdW5rbm93bik6IHZvaWQge1xuICBjb25zdCBtc2cgPSBgW2NvZGV4LXBsdXNwbHVzIHByZWxvYWRdICR7c3RhZ2V9JHtcbiAgICBleHRyYSA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IFwiIFwiICsgc2FmZVN0cmluZ2lmeShleHRyYSlcbiAgfWA7XG4gIHRyeSB7XG4gICAgaWYgKHN0YWdlLmluY2x1ZGVzKFwiRkFJTEVEXCIpKSBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgZWxzZSBjb25zb2xlLmluZm8obXNnKTtcbiAgfSBjYXRjaCB7fVxuICB0cnkge1xuICAgIGlwY1JlbmRlcmVyLnNlbmQoXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsIFwiaW5mb1wiLCBtc2cpO1xuICB9IGNhdGNoIHt9XG59XG5mdW5jdGlvbiBzYWZlU3RyaW5naWZ5KHY6IHVua25vd24pOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFN0cmluZyh2KTtcbiAgfVxufVxuXG5maWxlTG9nKFwicHJlbG9hZCBlbnRyeVwiLCB7IHVybDogbG9jYXRpb24uaHJlZiB9KTtcblxudHJ5IHtcbiAgaW5zdGFsbEJyb3dzZXJVaUhvc3RCcmlkZ2UoKTtcbiAgZmlsZUxvZyhcImJyb3dzZXIgVUkgaG9zdCBicmlkZ2UgaW5zdGFsbGVkXCIpO1xufSBjYXRjaCAoZSkge1xuICBmaWxlTG9nKFwiYnJvd3NlciBVSSBob3N0IGJyaWRnZSBGQUlMRURcIiwgU3RyaW5nKGUpKTtcbn1cblxuLy8gUmVhY3QgaG9vayBtdXN0IGJlIGluc3RhbGxlZCAqYmVmb3JlKiBDb2RleCdzIGJ1bmRsZSBydW5zLlxudHJ5IHtcbiAgaW5zdGFsbFJlYWN0SG9vaygpO1xuICBmaWxlTG9nKFwicmVhY3QgaG9vayBpbnN0YWxsZWRcIik7XG59IGNhdGNoIChlKSB7XG4gIGZpbGVMb2coXCJyZWFjdCBob29rIEZBSUxFRFwiLCBTdHJpbmcoZSkpO1xufVxuXG5xdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGJvb3QsIHsgb25jZTogdHJ1ZSB9KTtcbiAgfSBlbHNlIHtcbiAgICBib290KCk7XG4gIH1cbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICBmaWxlTG9nKFwiYm9vdCBzdGFydFwiLCB7IHJlYWR5U3RhdGU6IGRvY3VtZW50LnJlYWR5U3RhdGUgfSk7XG4gIHRyeSB7XG4gICAgc3RhcnRTZXR0aW5nc0luamVjdG9yKCk7XG4gICAgZmlsZUxvZyhcInNldHRpbmdzIGluamVjdG9yIHN0YXJ0ZWRcIik7XG4gICAgYXdhaXQgc3RhcnRUd2Vha0hvc3QoKTtcbiAgICBmaWxlTG9nKFwidHdlYWsgaG9zdCBzdGFydGVkXCIpO1xuICAgIGF3YWl0IG1vdW50TWFuYWdlcigpO1xuICAgIGZpbGVMb2coXCJtYW5hZ2VyIG1vdW50ZWRcIik7XG4gICAgc3Vic2NyaWJlUmVsb2FkKCk7XG4gICAgZmlsZUxvZyhcImJvb3QgY29tcGxldGVcIik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBmaWxlTG9nKFwiYm9vdCBGQUlMRURcIiwgU3RyaW5nKChlIGFzIEVycm9yKT8uc3RhY2sgPz8gZSkpO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHByZWxvYWQgYm9vdCBmYWlsZWQ6XCIsIGUpO1xuICB9XG59XG5cbi8vIEhvdCByZWxvYWQ6IGdhdGVkIGJlaGluZCBhIHNtYWxsIGluLWZsaWdodCBsb2NrIHNvIGEgZmx1cnJ5IG9mIGZzIGV2ZW50c1xuLy8gZG9lc24ndCByZWVudHJhbnRseSB0ZWFyIGRvd24gdGhlIGhvc3QgbWlkLWxvYWQuXG5sZXQgcmVsb2FkaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XG5mdW5jdGlvbiBzdWJzY3JpYmVSZWxvYWQoKTogdm9pZCB7XG4gIGlwY1JlbmRlcmVyLm9uKFwiY29kZXhwcDp0d2Vha3MtY2hhbmdlZFwiLCAoKSA9PiB7XG4gICAgaWYgKHJlbG9hZGluZykgcmV0dXJuO1xuICAgIHJlbG9hZGluZyA9IChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmluZm8oXCJbY29kZXgtcGx1c3BsdXNdIGhvdC1yZWxvYWRpbmcgdHdlYWtzXCIpO1xuICAgICAgICB0ZWFyZG93blR3ZWFrSG9zdCgpO1xuICAgICAgICBhd2FpdCBzdGFydFR3ZWFrSG9zdCgpO1xuICAgICAgICBhd2FpdCBtb3VudE1hbmFnZXIoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIltjb2RleC1wbHVzcGx1c10gaG90IHJlbG9hZCBmYWlsZWQ6XCIsIGUpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgcmVsb2FkaW5nID0gbnVsbDtcbiAgICAgIH1cbiAgICB9KSgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbEJyb3dzZXJVaUhvc3RCcmlkZ2UoKTogdm9pZCB7XG4gIGNvbnN0IHdvcmtlckxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkPigpO1xuXG4gIGlwY1JlbmRlcmVyLm9uKEJST1dTRVJfVUlfQ09OTkVDVF9QT1JULCAoZXZlbnQpID0+IHtcbiAgICBjb25zdCBbcG9ydF0gPSBldmVudC5wb3J0cztcbiAgICBpZiAoIXBvcnQpIHJldHVybjtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNvbm5lY3QtYXBwLWhvc3RcIiwgcG9ydCB9LCBcIipcIiwgW3BvcnRdKTtcbiAgfSk7XG5cbiAgaXBjUmVuZGVyZXIub24oQlJPV1NFUl9VSV9CUklER0VfUkVRVUVTVCwgYXN5bmMgKF9ldmVudCwgcGF5bG9hZCkgPT4ge1xuICAgIGNvbnN0IHJlcXVlc3QgPSBwYXlsb2FkICYmIHR5cGVvZiBwYXlsb2FkID09PSBcIm9iamVjdFwiXG4gICAgICA/IHBheWxvYWQgYXMgeyBpZD86IHVua25vd247IG1ldGhvZD86IHVua25vd247IGFyZ3M/OiB1bmtub3duIH1cbiAgICAgIDoge307XG4gICAgY29uc3QgaWQgPSB0eXBlb2YgcmVxdWVzdC5pZCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QuaWQgOiBcIlwiO1xuICAgIGNvbnN0IG1ldGhvZCA9IHR5cGVvZiByZXF1ZXN0Lm1ldGhvZCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QubWV0aG9kIDogXCJcIjtcbiAgICBjb25zdCBhcmdzID0gQXJyYXkuaXNBcnJheShyZXF1ZXN0LmFyZ3MpID8gcmVxdWVzdC5hcmdzIDogW107XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcnVuQnJvd3NlclVpQnJpZGdlTWV0aG9kKG1ldGhvZCwgYXJncywgd29ya2VyTGlzdGVuZXJzKTtcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9CUklER0VfUkVTUE9OU0UsIHsgaWQsIG9rOiB0cnVlLCB2YWx1ZSB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfQlJJREdFX1JFU1BPTlNFLCB7XG4gICAgICAgIGlkLFxuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGlwY1JlbmRlcmVyLm9uKERFU0tUT1BfTUVTU0FHRV9GT1JfVklFVywgKF9ldmVudCwgbWVzc2FnZSkgPT4ge1xuICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9NRVNTQUdFX0ZPUl9WSUVXLCBtZXNzYWdlKTtcbiAgfSk7XG5cbiAgaXBjUmVuZGVyZXIub24oREVTS1RPUF9TWVNURU1fVEhFTUVfVVBEQVRFRCwgKF9ldmVudCwgdmFsdWUpID0+IHtcbiAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfU1lTVEVNX1RIRU1FLCB2YWx1ZSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Ccm93c2VyVWlCcmlkZ2VNZXRob2QoXG4gIG1ldGhvZDogc3RyaW5nLFxuICBhcmdzOiB1bmtub3duW10sXG4gIHdvcmtlckxpc3RlbmVyczogTWFwPHN0cmluZywgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZD4sXG4pOiBQcm9taXNlPHVua25vd24+IHtcbiAgc3dpdGNoIChtZXRob2QpIHtcbiAgICBjYXNlIFwic25hcHNob3RcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TSEFSRURfT0JKRUNUX1NOQVBTSE9UKSA/PyB7fTtcbiAgICBjYXNlIFwic3lzdGVtVGhlbWVcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TWVNURU1fVEhFTUVfVkFSSUFOVCk7XG4gICAgY2FzZSBcInNlbnRyeU9wdGlvbnNcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TRU5UUllfSU5JVF9PUFRJT05TKTtcbiAgICBjYXNlIFwiYnVpbGRGbGF2b3JcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9CVUlMRF9GTEFWT1IpO1xuICAgIGNhc2UgXCJ1c2VzT3dsQXBwU2hlbGxcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9VU0VTX09XTF9BUFBfU0hFTEwpID09PSB0cnVlO1xuICAgIGNhc2UgXCJzZW5kTWVzc2FnZUZyb21WaWV3XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfTUVTU0FHRV9GUk9NX1ZJRVcsIHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhhcmdzWzBdKSk7XG4gICAgY2FzZSBcInNlbmRXb3JrZXJNZXNzYWdlRnJvbVZpZXdcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5pbnZva2UoZGVza3RvcFdvcmtlckZyb21WaWV3Q2hhbm5lbChTdHJpbmcoYXJnc1swXSkpLCBhcmdzWzFdKTtcbiAgICBjYXNlIFwic3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIjpcbiAgICAgIHJldHVybiBzdWJzY3JpYmVCcm93c2VyVWlXb3JrZXJNZXNzYWdlcyhTdHJpbmcoYXJnc1swXSksIHdvcmtlckxpc3RlbmVycyk7XG4gICAgY2FzZSBcInVuc3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIjpcbiAgICAgIHJldHVybiB1bnN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFN0cmluZyhhcmdzWzBdKSwgd29ya2VyTGlzdGVuZXJzKTtcbiAgICBjYXNlIFwic2hvd0NvbnRleHRNZW51XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfU0hPV19DT05URVhUX01FTlUsIGFyZ3NbMF0pO1xuICAgIGNhc2UgXCJzaG93QXBwbGljYXRpb25NZW51XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfU0hPV19BUFBMSUNBVElPTl9NRU5VLCB7XG4gICAgICAgIG1lbnVJZDogYXJnc1swXSxcbiAgICAgICAgeDogYXJnc1sxXSxcbiAgICAgICAgeTogYXJnc1syXSxcbiAgICAgIH0pO1xuICAgIGNhc2UgXCJnZXRGYXN0TW9kZVJvbGxvdXRNZXRyaWNzXCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfR0VUX0ZBU1RfTU9ERV9ST0xMT1VUX01FVFJJQ1MsIGFyZ3NbMF0pO1xuICAgIGNhc2UgXCJ0cmlnZ2VyU2VudHJ5VGVzdEVycm9yXCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfVFJJR0dFUl9TRU5UUllfVEVTVCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBDb2RleCsrIGJyb3dzZXIgVUkgYnJpZGdlIG1ldGhvZDogJHttZXRob2R9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2U6IHVua25vd24pOiB1bmtub3duIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBob29rcyA9IChnbG9iYWxUaGlzIGFzIHR5cGVvZiBnbG9iYWxUaGlzICYge1xuICAgICAgX19jb2RleFBsdXNQbHVzQnJpZGdlSG9va3M/OiBDb2RleFBsdXNQbHVzQnJpZGdlSG9va3M7XG4gICAgICBfX2NvZGV4cHBCcmlkZ2VIb29rcz86IENvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcztcbiAgICB9KS5fX2NvZGV4UGx1c1BsdXNCcmlkZ2VIb29rc1xuICAgICAgPz8gKGdsb2JhbFRoaXMgYXMgdHlwZW9mIGdsb2JhbFRoaXMgJiB7XG4gICAgICAgIF9fY29kZXhwcEJyaWRnZUhvb2tzPzogQ29kZXhQbHVzUGx1c0JyaWRnZUhvb2tzO1xuICAgICAgfSkuX19jb2RleHBwQnJpZGdlSG9va3M7XG4gICAgaWYgKHR5cGVvZiBob29rcz8udHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3ICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBtZXNzYWdlO1xuICAgIGNvbnN0IHRyYW5zZm9ybWVkID0gaG9va3MudHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2UpO1xuICAgIHJldHVybiB0cmFuc2Zvcm1lZCA9PT0gdW5kZWZpbmVkID8gbWVzc2FnZSA6IHRyYW5zZm9ybWVkO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGZpbGVMb2coXCJtZXNzYWdlLWZyb20tdmlldyB0cmFuc2Zvcm0gRkFJTEVEXCIsIFN0cmluZygoZXJyb3IgYXMgRXJyb3IpPy5zdGFjayA/PyBlcnJvcikpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFxuICB3b3JrZXJJZDogc3RyaW5nLFxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxuKTogYm9vbGVhbiB7XG4gIGlmICghL15bYS16QS1aMC05Ll86LV0rJC8udGVzdCh3b3JrZXJJZCkpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgd29ya2VyIGlkXCIpO1xuICBpZiAod29ya2VyTGlzdGVuZXJzLmhhcyh3b3JrZXJJZCkpIHJldHVybiB0cnVlO1xuICBjb25zdCBsaXN0ZW5lciA9IChfZXZlbnQ6IHVua25vd24sIG1lc3NhZ2U6IHVua25vd24pID0+IHtcbiAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfV09SS0VSX01FU1NBR0UsIHdvcmtlcklkLCBtZXNzYWdlKTtcbiAgfTtcbiAgd29ya2VyTGlzdGVuZXJzLnNldCh3b3JrZXJJZCwgbGlzdGVuZXIpO1xuICBpcGNSZW5kZXJlci5vbihkZXNrdG9wV29ya2VyRm9yVmlld0NoYW5uZWwod29ya2VySWQpLCBsaXN0ZW5lcik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB1bnN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFxuICB3b3JrZXJJZDogc3RyaW5nLFxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxpc3RlbmVyID0gd29ya2VyTGlzdGVuZXJzLmdldCh3b3JrZXJJZCk7XG4gIGlmICghbGlzdGVuZXIpIHJldHVybiB0cnVlO1xuICB3b3JrZXJMaXN0ZW5lcnMuZGVsZXRlKHdvcmtlcklkKTtcbiAgaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoZGVza3RvcFdvcmtlckZvclZpZXdDaGFubmVsKHdvcmtlcklkKSwgbGlzdGVuZXIpO1xuICByZXR1cm4gdHJ1ZTtcbn1cbiIsICIvKipcbiAqIEluc3RhbGwgYSBtaW5pbWFsIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy4gUmVhY3QgY2FsbHNcbiAqIGBob29rLmluamVjdChyZW5kZXJlckludGVybmFscylgIGR1cmluZyBgY3JlYXRlUm9vdGAvYGh5ZHJhdGVSb290YC4gVGhlXG4gKiBcImludGVybmFsc1wiIG9iamVjdCBleHBvc2VzIGZpbmRGaWJlckJ5SG9zdEluc3RhbmNlLCB3aGljaCBsZXRzIHVzIHR1cm4gYVxuICogRE9NIG5vZGUgaW50byBhIFJlYWN0IGZpYmVyIFx1MjAxNCBuZWNlc3NhcnkgZm9yIG91ciBTZXR0aW5ncyBpbmplY3Rvci5cbiAqXG4gKiBXZSBkb24ndCB3YW50IHRvIGJyZWFrIHJlYWwgUmVhY3QgRGV2VG9vbHMgaWYgdGhlIHVzZXIgb3BlbnMgaXQ7IHdlIGluc3RhbGxcbiAqIG9ubHkgaWYgbm8gaG9vayBleGlzdHMgeWV0LCBhbmQgd2UgZm9yd2FyZCBjYWxscyB0byBhIGRvd25zdHJlYW0gaG9vayBpZlxuICogb25lIGlzIGxhdGVyIGFzc2lnbmVkLlxuICovXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXz86IFJlYWN0RGV2dG9vbHNIb29rO1xuICAgIF9fY29kZXhwcF9fPzoge1xuICAgICAgaG9vazogUmVhY3REZXZ0b29sc0hvb2s7XG4gICAgICByZW5kZXJlcnM6IE1hcDxudW1iZXIsIFJlbmRlcmVySW50ZXJuYWxzPjtcbiAgICB9O1xuICB9XG59XG5cbmludGVyZmFjZSBSZW5kZXJlckludGVybmFscyB7XG4gIGZpbmRGaWJlckJ5SG9zdEluc3RhbmNlPzogKG46IE5vZGUpID0+IHVua25vd247XG4gIHZlcnNpb24/OiBzdHJpbmc7XG4gIGJ1bmRsZVR5cGU/OiBudW1iZXI7XG4gIHJlbmRlcmVyUGFja2FnZU5hbWU/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBSZWFjdERldnRvb2xzSG9vayB7XG4gIHN1cHBvcnRzRmliZXI6IHRydWU7XG4gIHJlbmRlcmVyczogTWFwPG51bWJlciwgUmVuZGVyZXJJbnRlcm5hbHM+O1xuICBvbihldmVudDogc3RyaW5nLCBmbjogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCk6IHZvaWQ7XG4gIG9mZihldmVudDogc3RyaW5nLCBmbjogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCk6IHZvaWQ7XG4gIGVtaXQoZXZlbnQ6IHN0cmluZywgLi4uYTogdW5rbm93bltdKTogdm9pZDtcbiAgaW5qZWN0KHJlbmRlcmVyOiBSZW5kZXJlckludGVybmFscyk6IG51bWJlcjtcbiAgb25TY2hlZHVsZUZpYmVyUm9vdD8oKTogdm9pZDtcbiAgb25Db21taXRGaWJlclJvb3Q/KCk6IHZvaWQ7XG4gIG9uQ29tbWl0RmliZXJVbm1vdW50PygpOiB2b2lkO1xuICBjaGVja0RDRT8oKTogdm9pZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxSZWFjdEhvb2soKTogdm9pZCB7XG4gIGlmICh3aW5kb3cuX19SRUFDVF9ERVZUT09MU19HTE9CQUxfSE9PS19fKSByZXR1cm47XG4gIGNvbnN0IHJlbmRlcmVycyA9IG5ldyBNYXA8bnVtYmVyLCBSZW5kZXJlckludGVybmFscz4oKTtcbiAgbGV0IG5leHRJZCA9IDE7XG4gIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8KC4uLmE6IHVua25vd25bXSkgPT4gdm9pZD4+KCk7XG5cbiAgY29uc3QgaG9vazogUmVhY3REZXZ0b29sc0hvb2sgPSB7XG4gICAgc3VwcG9ydHNGaWJlcjogdHJ1ZSxcbiAgICByZW5kZXJlcnMsXG4gICAgaW5qZWN0KHJlbmRlcmVyKSB7XG4gICAgICBjb25zdCBpZCA9IG5leHRJZCsrO1xuICAgICAgcmVuZGVyZXJzLnNldChpZCwgcmVuZGVyZXIpO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIFwiW2NvZGV4LXBsdXNwbHVzXSBSZWFjdCByZW5kZXJlciBhdHRhY2hlZDpcIixcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyZXJQYWNrYWdlTmFtZSxcbiAgICAgICAgcmVuZGVyZXIudmVyc2lvbixcbiAgICAgICk7XG4gICAgICByZXR1cm4gaWQ7XG4gICAgfSxcbiAgICBvbihldmVudCwgZm4pIHtcbiAgICAgIGxldCBzID0gbGlzdGVuZXJzLmdldChldmVudCk7XG4gICAgICBpZiAoIXMpIGxpc3RlbmVycy5zZXQoZXZlbnQsIChzID0gbmV3IFNldCgpKSk7XG4gICAgICBzLmFkZChmbik7XG4gICAgfSxcbiAgICBvZmYoZXZlbnQsIGZuKSB7XG4gICAgICBsaXN0ZW5lcnMuZ2V0KGV2ZW50KT8uZGVsZXRlKGZuKTtcbiAgICB9LFxuICAgIGVtaXQoZXZlbnQsIC4uLmFyZ3MpIHtcbiAgICAgIGxpc3RlbmVycy5nZXQoZXZlbnQpPy5mb3JFYWNoKChmbikgPT4gZm4oLi4uYXJncykpO1xuICAgIH0sXG4gICAgb25Db21taXRGaWJlclJvb3QoKSB7fSxcbiAgICBvbkNvbW1pdEZpYmVyVW5tb3VudCgpIHt9LFxuICAgIG9uU2NoZWR1bGVGaWJlclJvb3QoKSB7fSxcbiAgICBjaGVja0RDRSgpIHt9LFxuICB9O1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3csIFwiX19SRUFDVF9ERVZUT09MU19HTE9CQUxfSE9PS19fXCIsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWUsIC8vIGFsbG93IHJlYWwgRGV2VG9vbHMgdG8gb3ZlcndyaXRlIGlmIHVzZXIgaW5zdGFsbHMgaXRcbiAgICB2YWx1ZTogaG9vayxcbiAgfSk7XG5cbiAgd2luZG93Ll9fY29kZXhwcF9fID0geyBob29rLCByZW5kZXJlcnMgfTtcbn1cblxuLyoqIFJlc29sdmUgdGhlIFJlYWN0IGZpYmVyIGZvciBhIERPTSBub2RlLCBpZiBhbnkgcmVuZGVyZXIgaGFzIG9uZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWJlckZvck5vZGUobm9kZTogTm9kZSk6IHVua25vd24gfCBudWxsIHtcbiAgY29uc3QgcmVuZGVyZXJzID0gd2luZG93Ll9fY29kZXhwcF9fPy5yZW5kZXJlcnM7XG4gIGlmIChyZW5kZXJlcnMpIHtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVuZGVyZXJzLnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBmID0gci5maW5kRmliZXJCeUhvc3RJbnN0YW5jZT8uKG5vZGUpO1xuICAgICAgaWYgKGYpIHJldHVybiBmO1xuICAgIH1cbiAgfVxuICAvLyBGYWxsYmFjazogcmVhZCB0aGUgUmVhY3QgaW50ZXJuYWwgcHJvcGVydHkgZGlyZWN0bHkgZnJvbSB0aGUgRE9NIG5vZGUuXG4gIC8vIFJlYWN0IHN0b3JlcyBmaWJlcnMgYXMgYSBwcm9wZXJ0eSB3aG9zZSBrZXkgc3RhcnRzIHdpdGggXCJfX3JlYWN0RmliZXJcIi5cbiAgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKG5vZGUpKSB7XG4gICAgaWYgKGsuc3RhcnRzV2l0aChcIl9fcmVhY3RGaWJlclwiKSkgcmV0dXJuIChub2RlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgIi8qKlxuICogU2V0dGluZ3MgaW5qZWN0b3IgZm9yIENvZGV4J3MgU2V0dGluZ3MgcGFnZS5cbiAqXG4gKiBDb2RleCdzIHNldHRpbmdzIGlzIGEgcm91dGVkIHBhZ2UgKFVSTCBzdGF5cyBhdCBgL2luZGV4Lmh0bWw/aG9zdElkPWxvY2FsYClcbiAqIE5PVCBhIG1vZGFsIGRpYWxvZy4gVGhlIHNpZGViYXIgaXMgYSBncm91cGVkIHNldHRpbmdzIG5hdiAoUGVyc29uYWwsXG4gKiBJbnRlZ3JhdGlvbnMsIENvZGluZywgQXJjaGl2ZWQpIHdpdGggbmF0aXZlIHNlY3Rpb24gaGVhZGVycyBhYm92ZSBzdGFja3Mgb2ZcbiAqIGJ1dHRvbnMuIFRoZXJlIGFyZSBubyBzdGFibGUgYHJvbGVgIC8gYGFyaWEtbGFiZWxgIC8gYGRhdGEtdGVzdGlkYCBob29rcyBvblxuICogdGhlIHNoZWxsIHNvIHdlIGlkZW50aWZ5IHRoZSBzaWRlYmFyIGJ5IHRleHQtY29udGVudCBtYXRjaCBhZ2FpbnN0IGtub3duIGl0ZW1cbiAqIGxhYmVscyAoR2VuZXJhbCwgQXBwZWFyYW5jZSwgQ29uZmlndXJhdGlvbiwgXHUyMDI2KS5cbiAqXG4gKiBMYXlvdXQgd2UgaW5qZWN0OlxuICpcbiAqICAgUGVyc29uYWwgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBDb2RleCBncm91cCBsYWJlbClcbiAqICAgW0NvZGV4J3MgZXhpc3RpbmcgaXRlbXMgZ3JvdXBdXG4gKiAgIENvZGV4KysgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUgQ29kZXggZ3JvdXAgbGFiZWwpXG4gKiAgIFx1MjREOCBDb25maWdcbiAqICAgXHUyNjMwIFR3ZWFrc1xuICogICBcdTI1QzcgVHdlYWsgU3RvcmVcbiAqXG4gKiBDbGlja2luZyBDb25maWcgLyBUd2Vha3MgLyBUd2VhayBTdG9yZSBoaWRlcyBDb2RleCdzIGNvbnRlbnQgcGFuZWwgY2hpbGRyZW4gYW5kIHJlbmRlcnNcbiAqIG91ciBvd24gYG1haW4tc3VyZmFjZWAgcGFuZWwgaW4gdGhlaXIgcGxhY2UuIENsaWNraW5nIGFueSBvZiBDb2RleCdzXG4gKiBzaWRlYmFyIGl0ZW1zIHJlc3RvcmVzIHRoZSBvcmlnaW5hbCB2aWV3LlxuICovXG5cbmltcG9ydCB7IGlwY1JlbmRlcmVyIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgdHlwZSB7XG4gIFNldHRpbmdzU2VjdGlvbixcbiAgU2V0dGluZ3NQYWdlLFxuICBTZXR0aW5nc0hhbmRsZSxcbiAgVHdlYWtNYW5pZmVzdCxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcbmltcG9ydCB7XG4gIGJ1aWxkVHdlYWtQdWJsaXNoSXNzdWVVcmwsXG4gIHR5cGUgVHdlYWtTdG9yZUVudHJ5LFxuICB0eXBlIFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbixcbn0gZnJvbSBcIi4uL3R3ZWFrLXN0b3JlXCI7XG5pbXBvcnQge1xuICBjb2RleFBwU2V0dGluZ3NMYWJlbHNGcm9tLFxuICBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlLFxuICBjb21wYWN0U2V0dGluZ3NUZXh0LFxuICBoYXNOYXRpdmVTZXR0aW5nc1NlY3Rpb25IZWFkZXJzLFxuICBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0LFxuICBpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2UsXG4gIGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlLFxufSBmcm9tIFwiLi9zZXR0aW5ncy1kb20taGV1cmlzdGljc1wiO1xuaW1wb3J0IHtcbiAgY29uZmlnSWNvblN2ZyxcbiAgZGVmYXVsdFBhZ2VJY29uU3ZnLFxuICByZWZyZXNoSWNvblN2ZyxcbiAgc3RvcmVJY29uU3ZnLFxuICB0d2Vha3NJY29uU3ZnLFxufSBmcm9tIFwiLi9zZXR0aW5ncy1pY29uc1wiO1xuaW1wb3J0IHsgYXBwZW5kU3ZnSHRtbCwgc3ZnRWxlbWVudCB9IGZyb20gXCIuL3NldHRpbmdzLXN2Z1wiO1xuXG5jb25zdCBDT0RFWF9QTFVTUExVU19SRUxFQVNFU19VUkwgPSBcImh0dHBzOi8vZ2l0aHViLmNvbS9rcGtoeGxneTAvY29kZXgtcGx1c3BsdXMvcmVsZWFzZXNcIjtcblxuLy8gTWlycm9ycyB0aGUgcnVudGltZSdzIG1haW4tc2lkZSBMaXN0ZWRUd2VhayBzaGFwZSAoa2VwdCBpbiBzeW5jIG1hbnVhbGx5KS5cbmludGVyZmFjZSBMaXN0ZWRUd2VhayB7XG4gIG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0O1xuICBlbnRyeTogc3RyaW5nO1xuICBkaXI6IHN0cmluZztcbiAgZW50cnlFeGlzdHM6IGJvb2xlYW47XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZTogVHdlYWtVcGRhdGVDaGVjayB8IG51bGw7XG59XG5cbmludGVyZmFjZSBUd2Vha1VwZGF0ZUNoZWNrIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHJlcG86IHN0cmluZztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgbGF0ZXN0VGFnOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQ29kZXhQbHVzUGx1c0NvbmZpZyB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgYXV0b1VwZGF0ZTogYm9vbGVhbjtcbiAgdXBkYXRlQ2hhbm5lbDogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gIHVwZGF0ZVJlcG86IHN0cmluZztcbiAgdXBkYXRlUmVmOiBzdHJpbmc7XG4gIHVwZGF0ZUNoZWNrOiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sgfCBudWxsO1xuICBzZWxmVXBkYXRlOiBTZWxmVXBkYXRlU3RhdGUgfCBudWxsO1xuICBpbnN0YWxsYXRpb25Tb3VyY2U6IEluc3RhbGxhdGlvblNvdXJjZTtcbn1cblxuaW50ZXJmYWNlIENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB7XG4gIGNoZWNrZWRBdDogc3RyaW5nO1xuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nO1xuICBsYXRlc3RWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlTm90ZXM6IHN0cmluZyB8IG51bGw7XG4gIHVwZGF0ZUF2YWlsYWJsZTogYm9vbGVhbjtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbnR5cGUgU2VsZlVwZGF0ZUNoYW5uZWwgPSBcInN0YWJsZVwiIHwgXCJwcmVyZWxlYXNlXCIgfCBcImN1c3RvbVwiO1xudHlwZSBTZWxmVXBkYXRlU3RhdHVzID0gXCJjaGVja2luZ1wiIHwgXCJ1cC10by1kYXRlXCIgfCBcInVwZGF0ZWRcIiB8IFwiZmFpbGVkXCIgfCBcImRpc2FibGVkXCI7XG5cbmludGVyZmFjZSBTZWxmVXBkYXRlU3RhdGUge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7XG4gIHN0YXR1czogU2VsZlVwZGF0ZVN0YXR1cztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgdGFyZ2V0UmVmOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZXBvOiBzdHJpbmc7XG4gIGNoYW5uZWw6IFNlbGZVcGRhdGVDaGFubmVsO1xuICBzb3VyY2VSb290OiBzdHJpbmc7XG4gIGluc3RhbGxhdGlvblNvdXJjZT86IEluc3RhbGxhdGlvblNvdXJjZTtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJbnN0YWxsYXRpb25Tb3VyY2Uge1xuICBraW5kOiBcImdpdGh1Yi1zb3VyY2VcIiB8IFwiaG9tZWJyZXdcIiB8IFwibG9jYWwtZGV2XCIgfCBcInNvdXJjZS1hcmNoaXZlXCIgfCBcInVua25vd25cIjtcbiAgbGFiZWw6IHN0cmluZztcbiAgZGV0YWlsOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBXYXRjaGVySGVhbHRoIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHN0YXR1czogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgd2F0Y2hlcjogc3RyaW5nO1xuICBjaGVja3M6IFdhdGNoZXJIZWFsdGhDaGVja1tdO1xufVxuXG5pbnRlcmZhY2UgV2F0Y2hlckhlYWx0aENoZWNrIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzdGF0dXM6IFwib2tcIiB8IFwid2FyblwiIHwgXCJlcnJvclwiO1xuICBkZXRhaWw6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXcge1xuICBzY2hlbWFWZXJzaW9uOiAxO1xuICBnZW5lcmF0ZWRBdD86IHN0cmluZztcbiAgc291cmNlVXJsOiBzdHJpbmc7XG4gIGZldGNoZWRBdDogc3RyaW5nO1xuICBlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlWaWV3W107XG59XG5cbmludGVyZmFjZSBUd2Vha1N0b3JlRW50cnlWaWV3IGV4dGVuZHMgVHdlYWtTdG9yZUVudHJ5IHtcbiAgaW5zdGFsbGVkOiB7XG4gICAgdmVyc2lvbjogc3RyaW5nO1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gIH0gfCBudWxsO1xuICBwbGF0Zm9ybT86IHtcbiAgICBjdXJyZW50OiBzdHJpbmc7XG4gICAgc3VwcG9ydGVkOiBzdHJpbmdbXSB8IG51bGw7XG4gICAgY29tcGF0aWJsZTogYm9vbGVhbjtcbiAgICByZWFzb246IHN0cmluZyB8IG51bGw7XG4gIH07XG4gIHJ1bnRpbWU/OiB7XG4gICAgY3VycmVudDogc3RyaW5nO1xuICAgIHJlcXVpcmVkOiBzdHJpbmcgfCBudWxsO1xuICAgIGNvbXBhdGlibGU6IGJvb2xlYW47XG4gICAgcmVhc29uOiBzdHJpbmcgfCBudWxsO1xuICB9O1xufVxuXG4vKipcbiAqIEEgdHdlYWstcmVnaXN0ZXJlZCBwYWdlLiBXZSBjYXJyeSB0aGUgb3duaW5nIHR3ZWFrJ3MgbWFuaWZlc3Qgc28gd2UgY2FuXG4gKiByZXNvbHZlIHJlbGF0aXZlIGljb25VcmxzIGFuZCBzaG93IGF1dGhvcnNoaXAgaW4gdGhlIHBhZ2UgaGVhZGVyLlxuICovXG5pbnRlcmZhY2UgUmVnaXN0ZXJlZFBhZ2Uge1xuICAvKiogRnVsbHktcXVhbGlmaWVkIGlkOiBgPHR3ZWFrSWQ+OjxwYWdlSWQ+YC4gKi9cbiAgaWQ6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgcGFnZTogU2V0dGluZ3NQYWdlO1xuICAvKiogUGVyLXBhZ2UgRE9NIHRlYXJkb3duIHJldHVybmVkIGJ5IGBwYWdlLnJlbmRlcmAsIGlmIGFueS4gKi9cbiAgdGVhcmRvd24/OiAoKCkgPT4gdm9pZCkgfCBudWxsO1xuICAvKiogVGhlIGluamVjdGVkIHNpZGViYXIgYnV0dG9uIChzbyB3ZSBjYW4gdXBkYXRlIGl0cyBhY3RpdmUgc3RhdGUpLiAqL1xuICBuYXZCdXR0b24/OiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG59XG5cbi8qKiBXaGF0IHBhZ2UgaXMgY3VycmVudGx5IHNlbGVjdGVkIGluIG91ciBpbmplY3RlZCBuYXYuICovXG50eXBlIEFjdGl2ZVBhZ2UgPVxuICB8IHsga2luZDogXCJjb25maWdcIiB9XG4gIHwgeyBraW5kOiBcInN0b3JlXCIgfVxuICB8IHsga2luZDogXCJ0d2Vha3NcIiB9XG4gIHwgeyBraW5kOiBcInJlZ2lzdGVyZWRcIjsgaWQ6IHN0cmluZyB9O1xuXG5pbnRlcmZhY2UgSW5qZWN0b3JTdGF0ZSB7XG4gIHNlY3Rpb25zOiBNYXA8c3RyaW5nLCBTZXR0aW5nc1NlY3Rpb24+O1xuICBwYWdlczogTWFwPHN0cmluZywgUmVnaXN0ZXJlZFBhZ2U+O1xuICBsaXN0ZWRUd2Vha3M6IExpc3RlZFR3ZWFrW107XG4gIC8qKiBPdXRlciB3cmFwcGVyIHRoYXQgaG9sZHMgQ29kZXgncyBpdGVtcyBncm91cCArIG91ciBpbmplY3RlZCBncm91cHMuICovXG4gIG91dGVyV3JhcHBlcjogSFRNTEVsZW1lbnQgfCBudWxsO1xuICAvKiogT3VyIFwiR2VuZXJhbFwiIGxhYmVsIGZvciBDb2RleCdzIG5hdGl2ZSBzZXR0aW5ncyBncm91cC4gKi9cbiAgbmF0aXZlTmF2SGVhZGVyOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIC8qKiBPdXIgXCJDb2RleCsrXCIgbmF2IGdyb3VwIChDb25maWcvVHdlYWtzKS4gKi9cbiAgbmF2R3JvdXA6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgbmF2QnV0dG9uczogeyBjb25maWc6IEhUTUxCdXR0b25FbGVtZW50OyB0d2Vha3M6IEhUTUxCdXR0b25FbGVtZW50OyBzdG9yZTogSFRNTEJ1dHRvbkVsZW1lbnQgfSB8IG51bGw7XG4gIC8qKiBTaWRlYmFyIHVwZGF0ZSBwaWxsIHNob3duIG9ubHkgd2hlbiBHaXRIdWIgaGFzIGEgbmV3ZXIgQ29kZXgrKyByZWxlYXNlLiAqL1xuICBjb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIC8qKiBPdXIgXCJUd2Vha3NcIiBuYXYgZ3JvdXAgKHBlci10d2VhayBwYWdlcykuIENyZWF0ZWQgbGF6aWx5LiAqL1xuICBwYWdlc0dyb3VwOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIHBhZ2VzR3JvdXBLZXk6IHN0cmluZyB8IG51bGw7XG4gIHBhbmVsSG9zdDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBjb250ZW50SG9zdDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBoaWRkZW5Db250ZW50OiBNYXA8SFRNTEVsZW1lbnQsIHN0cmluZz47XG4gIG9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbDtcbiAgZmluZ2VycHJpbnQ6IHN0cmluZyB8IG51bGw7XG4gIHNpZGViYXJEdW1wZWQ6IGJvb2xlYW47XG4gIGFjdGl2ZVBhZ2U6IEFjdGl2ZVBhZ2UgfCBudWxsO1xuICBzaWRlYmFyUm9vdDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBzaWRlYmFyUmVzdG9yZUhhbmRsZXI6ICgoZTogRXZlbnQpID0+IHZvaWQpIHwgbnVsbDtcbiAgc2V0dGluZ3NTdXJmYWNlVmlzaWJsZTogYm9vbGVhbjtcbiAgc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGw7XG4gIHR3ZWFrU3RvcmU6IFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXcgfCBudWxsO1xuICB0d2Vha1N0b3JlUHJvbWlzZTogUHJvbWlzZTxUd2Vha1N0b3JlUmVnaXN0cnlWaWV3PiB8IG51bGw7XG4gIHR3ZWFrU3RvcmVFcnJvcjogdW5rbm93bjtcbn1cblxuY29uc3Qgc3RhdGU6IEluamVjdG9yU3RhdGUgPSB7XG4gIHNlY3Rpb25zOiBuZXcgTWFwKCksXG4gIHBhZ2VzOiBuZXcgTWFwKCksXG4gIGxpc3RlZFR3ZWFrczogW10sXG4gIG91dGVyV3JhcHBlcjogbnVsbCxcbiAgbmF0aXZlTmF2SGVhZGVyOiBudWxsLFxuICBuYXZHcm91cDogbnVsbCxcbiAgbmF2QnV0dG9uczogbnVsbCxcbiAgY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbjogbnVsbCxcbiAgcGFnZXNHcm91cDogbnVsbCxcbiAgcGFnZXNHcm91cEtleTogbnVsbCxcbiAgcGFuZWxIb3N0OiBudWxsLFxuICBjb250ZW50SG9zdDogbnVsbCxcbiAgaGlkZGVuQ29udGVudDogbmV3IE1hcCgpLFxuICBvYnNlcnZlcjogbnVsbCxcbiAgZmluZ2VycHJpbnQ6IG51bGwsXG4gIHNpZGViYXJEdW1wZWQ6IGZhbHNlLFxuICBhY3RpdmVQYWdlOiBudWxsLFxuICBzaWRlYmFyUm9vdDogbnVsbCxcbiAgc2lkZWJhclJlc3RvcmVIYW5kbGVyOiBudWxsLFxuICBzZXR0aW5nc1N1cmZhY2VWaXNpYmxlOiBmYWxzZSxcbiAgc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyOiBudWxsLFxuICB0d2Vha1N0b3JlOiBudWxsLFxuICB0d2Vha1N0b3JlUHJvbWlzZTogbnVsbCxcbiAgdHdlYWtTdG9yZUVycm9yOiBudWxsLFxufTtcblxubGV0IHNjaGVkdWxlZEluamVjdEZyYW1lOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0U2lkZWJhck1pc3NpbmdMb2dBdCA9IDA7XG5cbmZ1bmN0aW9uIHBsb2cobXNnOiBzdHJpbmcsIGV4dHJhPzogdW5rbm93bik6IHZvaWQge1xuICBpcGNSZW5kZXJlci5zZW5kKFxuICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxuICAgIFwiaW5mb1wiLFxuICAgIGBbc2V0dGluZ3MtaW5qZWN0b3JdICR7bXNnfSR7ZXh0cmEgPT09IHVuZGVmaW5lZCA/IFwiXCIgOiBcIiBcIiArIHNhZmVTdHJpbmdpZnkoZXh0cmEpfWAsXG4gICk7XG59XG5mdW5jdGlvbiBzYWZlU3RyaW5naWZ5KHY6IHVua25vd24pOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFN0cmluZyh2KTtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgcHVibGljIEFQSSBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0U2V0dGluZ3NJbmplY3RvcigpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLm9ic2VydmVyKSByZXR1cm47XG5cbiAgY29uc3Qgb2JzID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xuICAgIHNjaGVkdWxlSW5qZWN0KCk7XG4gIH0pO1xuICBvYnMub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICBzdGF0ZS5vYnNlcnZlciA9IG9icztcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInBvcHN0YXRlXCIsIG9uTmF2KTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJoYXNoY2hhbmdlXCIsIG9uTmF2KTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uRG9jdW1lbnRDbGljaywgdHJ1ZSk7XG4gIGZvciAoY29uc3QgbSBvZiBbXCJwdXNoU3RhdGVcIiwgXCJyZXBsYWNlU3RhdGVcIl0gYXMgY29uc3QpIHtcbiAgICBjb25zdCBvcmlnID0gaGlzdG9yeVttXTtcbiAgICBoaXN0b3J5W21dID0gZnVuY3Rpb24gKHRoaXM6IEhpc3RvcnksIC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIG9yaWc+KSB7XG4gICAgICBjb25zdCByID0gb3JpZy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudChgY29kZXhwcC0ke219YCkpO1xuICAgICAgcmV0dXJuIHI7XG4gICAgfSBhcyB0eXBlb2Ygb3JpZztcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihgY29kZXhwcC0ke219YCwgb25OYXYpO1xuICB9XG5cbiAgcnVuSW5qZWN0QW5kRHVtcCgpO1xuICBsZXQgdGlja3MgPSAwO1xuICBjb25zdCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICB0aWNrcysrO1xuICAgIHNjaGVkdWxlSW5qZWN0KCk7XG4gICAgaWYgKHRpY2tzID4gNjApIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICB9LCA1MDApO1xufVxuXG5mdW5jdGlvbiBvbk5hdigpOiB2b2lkIHtcbiAgc3RhdGUuZmluZ2VycHJpbnQgPSBudWxsO1xuICBydW5JbmplY3RBbmREdW1wKCk7XG59XG5cbmZ1bmN0aW9uIHJ1bkluamVjdEFuZER1bXAoKTogdm9pZCB7XG4gIGlmIChzY2hlZHVsZWRJbmplY3RGcmFtZSAhPT0gbnVsbCkge1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHNjaGVkdWxlZEluamVjdEZyYW1lKTtcbiAgICBzY2hlZHVsZWRJbmplY3RGcmFtZSA9IG51bGw7XG4gIH1cbiAgdHJ5SW5qZWN0KCk7XG4gIG1heWJlRHVtcERvbSgpO1xufVxuXG5mdW5jdGlvbiBzY2hlZHVsZUluamVjdCgpOiB2b2lkIHtcbiAgaWYgKHNjaGVkdWxlZEluamVjdEZyYW1lICE9PSBudWxsKSByZXR1cm47XG4gIHNjaGVkdWxlZEluamVjdEZyYW1lID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICBzY2hlZHVsZWRJbmplY3RGcmFtZSA9IG51bGw7XG4gICAgdHJ5SW5qZWN0KCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBvbkRvY3VtZW50Q2xpY2soZTogTW91c2VFdmVudCk6IHZvaWQge1xuICBjb25zdCB0YXJnZXQgPSBlLnRhcmdldCBpbnN0YW5jZW9mIEVsZW1lbnQgPyBlLnRhcmdldCA6IG51bGw7XG4gIGNvbnN0IGNvbnRyb2wgPSB0YXJnZXQ/LmNsb3Nlc3QoXCJbcm9sZT0nbGluayddLGJ1dHRvbixhXCIpO1xuICBpZiAoIShjb250cm9sIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm47XG4gIGlmIChjb21wYWN0U2V0dGluZ3NUZXh0KGNvbnRyb2wudGV4dENvbnRlbnQgfHwgXCJcIikgIT09IFwiQmFjayB0byBhcHBcIikgcmV0dXJuO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBzZXRTZXR0aW5nc1N1cmZhY2VWaXNpYmxlKGZhbHNlLCBcImJhY2stdG8tYXBwXCIpO1xuICB9LCAwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyU2VjdGlvbihzZWN0aW9uOiBTZXR0aW5nc1NlY3Rpb24pOiBTZXR0aW5nc0hhbmRsZSB7XG4gIHN0YXRlLnNlY3Rpb25zLnNldChzZWN0aW9uLmlkLCBzZWN0aW9uKTtcbiAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwidHdlYWtzXCIpIHJlcmVuZGVyKCk7XG4gIHJldHVybiB7XG4gICAgdW5yZWdpc3RlcjogKCkgPT4ge1xuICAgICAgc3RhdGUuc2VjdGlvbnMuZGVsZXRlKHNlY3Rpb24uaWQpO1xuICAgICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwidHdlYWtzXCIpIHJlcmVuZGVyKCk7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyU2VjdGlvbnMoKTogdm9pZCB7XG4gIHN0YXRlLnNlY3Rpb25zLmNsZWFyKCk7XG4gIC8vIERyb3AgcmVnaXN0ZXJlZCBwYWdlcyB0b28gXHUyMDE0IHRoZXkncmUgb3duZWQgYnkgdHdlYWtzIHRoYXQganVzdCBnb3RcbiAgLy8gdG9ybiBkb3duIGJ5IHRoZSBob3N0LiBSdW4gYW55IHRlYXJkb3ducyBiZWZvcmUgZm9yZ2V0dGluZyB0aGVtLlxuICBmb3IgKGNvbnN0IHAgb2Ygc3RhdGUucGFnZXMudmFsdWVzKCkpIHtcbiAgICB0cnkge1xuICAgICAgcC50ZWFyZG93bj8uKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcGxvZyhcInBhZ2UgdGVhcmRvd24gZmFpbGVkXCIsIHsgaWQ6IHAuaWQsIGVycjogU3RyaW5nKGUpIH0pO1xuICAgIH1cbiAgfVxuICBzdGF0ZS5wYWdlcy5jbGVhcigpO1xuICBzeW5jUGFnZXNHcm91cCgpO1xuICAvLyBJZiB3ZSB3ZXJlIG9uIGEgcmVnaXN0ZXJlZCBwYWdlIHRoYXQgbm8gbG9uZ2VyIGV4aXN0cywgZmFsbCBiYWNrIHRvXG4gIC8vIHJlc3RvcmluZyBDb2RleCdzIHZpZXcuXG4gIGlmIChcbiAgICBzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInJlZ2lzdGVyZWRcIiAmJlxuICAgICFzdGF0ZS5wYWdlcy5oYXMoc3RhdGUuYWN0aXZlUGFnZS5pZClcbiAgKSB7XG4gICAgcmVzdG9yZUNvZGV4VmlldygpO1xuICB9IGVsc2UgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwidHdlYWtzXCIpIHtcbiAgICByZXJlbmRlcigpO1xuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXIgYSB0d2Vhay1vd25lZCBzZXR0aW5ncyBwYWdlLiBUaGUgcnVudGltZSBpbmplY3RzIGEgc2lkZWJhciBlbnRyeVxuICogdW5kZXIgYSBcIlRXRUFLU1wiIGdyb3VwIGhlYWRlciAod2hpY2ggYXBwZWFycyBvbmx5IHdoZW4gYXQgbGVhc3Qgb25lIHBhZ2VcbiAqIGlzIHJlZ2lzdGVyZWQpIGFuZCByb3V0ZXMgY2xpY2tzIHRvIHRoZSBwYWdlJ3MgYHJlbmRlcihyb290KWAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclBhZ2UoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgbWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3QsXG4gIHBhZ2U6IFNldHRpbmdzUGFnZSxcbik6IFNldHRpbmdzSGFuZGxlIHtcbiAgY29uc3QgaWQgPSBwYWdlLmlkOyAvLyBhbHJlYWR5IG5hbWVzcGFjZWQgYnkgdHdlYWstaG9zdCBhcyBgJHt0d2Vha0lkfToke3BhZ2UuaWR9YFxuICBjb25zdCBlbnRyeTogUmVnaXN0ZXJlZFBhZ2UgPSB7IGlkLCB0d2Vha0lkLCBtYW5pZmVzdCwgcGFnZSB9O1xuICBzdGF0ZS5wYWdlcy5zZXQoaWQsIGVudHJ5KTtcbiAgcGxvZyhcInJlZ2lzdGVyUGFnZVwiLCB7IGlkLCB0aXRsZTogcGFnZS50aXRsZSwgdHdlYWtJZCB9KTtcbiAgc3luY1BhZ2VzR3JvdXAoKTtcbiAgLy8gSWYgdGhlIHVzZXIgd2FzIGFscmVhZHkgb24gdGhpcyBwYWdlIChob3QgcmVsb2FkKSwgcmUtbW91bnQgaXRzIGJvZHkuXG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInJlZ2lzdGVyZWRcIiAmJiBzdGF0ZS5hY3RpdmVQYWdlLmlkID09PSBpZCkge1xuICAgIHJlcmVuZGVyKCk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICBjb25zdCBlID0gc3RhdGUucGFnZXMuZ2V0KGlkKTtcbiAgICAgIGlmICghZSkgcmV0dXJuO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZS50ZWFyZG93bj8uKCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICBzdGF0ZS5wYWdlcy5kZWxldGUoaWQpO1xuICAgICAgc3luY1BhZ2VzR3JvdXAoKTtcbiAgICAgIGlmIChzdGF0ZS5hY3RpdmVQYWdlPy5raW5kID09PSBcInJlZ2lzdGVyZWRcIiAmJiBzdGF0ZS5hY3RpdmVQYWdlLmlkID09PSBpZCkge1xuICAgICAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cblxuLyoqIENhbGxlZCBieSB0aGUgdHdlYWsgaG9zdCBhZnRlciBmZXRjaGluZyB0aGUgdHdlYWsgbGlzdCBmcm9tIG1haW4uICovXG5leHBvcnQgZnVuY3Rpb24gc2V0TGlzdGVkVHdlYWtzKGxpc3Q6IExpc3RlZFR3ZWFrW10pOiB2b2lkIHtcbiAgc3RhdGUubGlzdGVkVHdlYWtzID0gbGlzdDtcbiAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwidHdlYWtzXCIpIHJlcmVuZGVyKCk7XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBpbmplY3Rpb24gXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIHRyeUluamVjdCgpOiB2b2lkIHtcbiAgcmVtb3ZlTWlzcGxhY2VkU2V0dGluZ3NHcm91cHMoKTtcblxuICBjb25zdCBpdGVtc0dyb3VwID0gZmluZFNpZGViYXJJdGVtc0dyb3VwKCk7XG4gIGlmICghaXRlbXNHcm91cCkge1xuICAgIGlmIChzdGF0ZS5hY3RpdmVQYWdlICYmICghc3RhdGUuc2lkZWJhclJvb3Q/LmlzQ29ubmVjdGVkIHx8ICFzdGF0ZS5jb250ZW50SG9zdD8uaXNDb25uZWN0ZWQpKSB7XG4gICAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgfVxuICAgIHNjaGVkdWxlU2V0dGluZ3NTdXJmYWNlSGlkZGVuKCk7XG4gICAgbG9nU2lkZWJhck1pc3NpbmcoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgbGFzdFNpZGViYXJNaXNzaW5nTG9nQXQgPSAwO1xuICBpZiAoc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyKSB7XG4gICAgY2xlYXJUaW1lb3V0KHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lcik7XG4gICAgc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyID0gbnVsbDtcbiAgfVxuICBzZXRTZXR0aW5nc1N1cmZhY2VWaXNpYmxlKHRydWUsIFwic2lkZWJhci1mb3VuZFwiKTtcbiAgLy8gQ29kZXgncyBuYXRpdmUgc2V0dGluZ3MgZ3JvdXBzIGxpdmUgaW5zaWRlIHRoZSBzY3JvbGxhYmxlIG5hdiBzdGFjay4gSWYgd2VcbiAgLy8gYXBwZW5kIG91dHNpZGUgdGhhdCBzdGFjaywgdGhlIGZsZXgtMSBzY3JvbGxlciBwdXNoZXMgQ29kZXgrKyB0byB0aGUgYm90dG9tXG4gIC8vIG9mIHRoZSBzaWRlYmFyIGFuZCBjcmVhdGVzIGEgbGFyZ2UgdmlzdWFsIGdhcCBhZnRlciB0aGUgbGFzdCBuYXRpdmUgZ3JvdXAuXG4gIGNvbnN0IG91dGVyID0gZmluZFNpZGViYXJJbmplY3Rpb25Sb290KGl0ZW1zR3JvdXApO1xuICBpZiAoIWlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKGl0ZW1zR3JvdXApIHx8ICFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShvdXRlcikpIHtcbiAgICBzY2hlZHVsZVNldHRpbmdzU3VyZmFjZUhpZGRlbigpO1xuICAgIHBsb2coXCJyZWplY3RlZCBub24tc2V0dGluZ3Mgc2lkZWJhciBjYW5kaWRhdGVcIiwge1xuICAgICAgaXRlbXNHcm91cDogZGVzY3JpYmUoaXRlbXNHcm91cCksXG4gICAgICBvdXRlcjogZGVzY3JpYmUob3V0ZXIpLFxuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoc3RhdGUuYWN0aXZlUGFnZSAmJiAoc3RhdGUuc2lkZWJhclJvb3QgIT09IG91dGVyIHx8IHN0YXRlLmNvbnRlbnRIb3N0ICE9PSBmaW5kQ29udGVudEFyZWEoKSkpIHtcbiAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gIH1cbiAgc3RhdGUuc2lkZWJhclJvb3QgPSBvdXRlcjtcbiAgcmVtb3ZlU2V0dGluZ3NHcm91cHNPdXRzaWRlUm9vdChvdXRlcik7XG4gIHN5bmNOYXRpdmVTZXR0aW5nc0hlYWRlcihpdGVtc0dyb3VwLCBvdXRlcik7XG5cbiAgaWYgKHN0YXRlLm5hdkdyb3VwICYmIG91dGVyLmNvbnRhaW5zKHN0YXRlLm5hdkdyb3VwKSkge1xuICAgIHN5bmNQYWdlc0dyb3VwKCk7XG4gICAgLy8gQ29kZXggcmUtcmVuZGVycyBpdHMgbmF0aXZlIHNpZGViYXIgYnV0dG9ucyBvbiBpdHMgb3duIHN0YXRlIGNoYW5nZXMuXG4gICAgLy8gSWYgb25lIG9mIG91ciBwYWdlcyBpcyBhY3RpdmUsIHJlLXN0cmlwIENvZGV4J3MgYWN0aXZlIHN0eWxpbmcgc29cbiAgICAvLyBHZW5lcmFsIGRvZXNuJ3QgcmVhcHBlYXIgYXMgc2VsZWN0ZWQuXG4gICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2UgIT09IG51bGwpIHN5bmNDb2RleE5hdGl2ZU5hdkFjdGl2ZSh0cnVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBTaWRlYmFyIHdhcyBlaXRoZXIgZnJlc2hseSBtb3VudGVkIChTZXR0aW5ncyBqdXN0IG9wZW5lZCkgb3IgcmUtbW91bnRlZFxuICAvLyAoY2xvc2VkIGFuZCByZS1vcGVuZWQsIG9yIG5hdmlnYXRlZCBhd2F5IGFuZCBiYWNrKS4gSW4gYWxsIG9mIHRob3NlXG4gIC8vIGNhc2VzIENvZGV4IHJlc2V0cyB0byBpdHMgZGVmYXVsdCBwYWdlIChHZW5lcmFsKSwgYnV0IG91ciBpbi1tZW1vcnlcbiAgLy8gYGFjdGl2ZVBhZ2VgIG1heSBzdGlsbCByZWZlcmVuY2UgdGhlIGxhc3QgdHdlYWsvcGFnZSB0aGUgdXNlciBoYWQgb3BlblxuICAvLyBcdTIwMTQgd2hpY2ggd291bGQgY2F1c2UgdGhhdCBuYXYgYnV0dG9uIHRvIHJlbmRlciB3aXRoIHRoZSBhY3RpdmUgc3R5bGluZ1xuICAvLyBldmVuIHRob3VnaCBDb2RleCBpcyBzaG93aW5nIEdlbmVyYWwuIENsZWFyIGl0IHNvIGBzeW5jUGFnZXNHcm91cGAgL1xuICAvLyBgc2V0TmF2QWN0aXZlYCBzdGFydCBmcm9tIGEgbmV1dHJhbCBzdGF0ZS4gVGhlIHBhbmVsSG9zdCByZWZlcmVuY2UgaXNcbiAgLy8gYWxzbyBzdGFsZSAoaXRzIERPTSB3YXMgZGlzY2FyZGVkIHdpdGggdGhlIHByZXZpb3VzIGNvbnRlbnQgYXJlYSkuXG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlICE9PSBudWxsIHx8IHN0YXRlLnBhbmVsSG9zdCAhPT0gbnVsbCB8fCBzdGF0ZS5jb250ZW50SG9zdCAhPT0gbnVsbCkge1xuICAgIHBsb2coXCJzaWRlYmFyIHJlLW1vdW50IGRldGVjdGVkOyBjbGVhcmluZyBzdGFsZSBhY3RpdmUgc3RhdGVcIiwge1xuICAgICAgcHJldkFjdGl2ZTogc3RhdGUuYWN0aXZlUGFnZSxcbiAgICB9KTtcbiAgICBzdGF0ZS5hY3RpdmVQYWdlID0gbnVsbDtcbiAgICBzdGF0ZS5wYW5lbEhvc3QgPSBudWxsO1xuICAgIHN0YXRlLmNvbnRlbnRIb3N0ID0gbnVsbDtcbiAgICBzdGF0ZS5oaWRkZW5Db250ZW50LmNsZWFyKCk7XG4gIH1cblxuICBjb25zdCBleGlzdGluZ0NvZGV4UHBOYXZHcm91cCA9XG4gICAgb3V0ZXIucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJzpzY29wZSA+IFtkYXRhLWNvZGV4cHA9XCJuYXYtZ3JvdXBcIl0nKSA/P1xuICAgIG91dGVyLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCdbZGF0YS1jb2RleHBwPVwibmF2LWdyb3VwXCJdJyk7XG5cbiAgaWYgKGV4aXN0aW5nQ29kZXhQcE5hdkdyb3VwKSB7XG4gICAgc3RhdGUubmF2R3JvdXAgPSBleGlzdGluZ0NvZGV4UHBOYXZHcm91cDtcbiAgICBzdGF0ZS5jb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uID0gZXhpc3RpbmdDb2RleFBwTmF2R3JvdXAucXVlcnlTZWxlY3RvcjxIVE1MQnV0dG9uRWxlbWVudD4oXG4gICAgICBcIltkYXRhLWNvZGV4cHAtc2lkZWJhci11cGRhdGVdXCIsXG4gICAgKTtcbiAgICBzdGF0ZS5zaWRlYmFyUm9vdCA9IG91dGVyO1xuICAgIHN5bmNQYWdlc0dyb3VwKCk7XG4gICAgcmVmcmVzaFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKCk7XG4gICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2UgIT09IG51bGwpIHN5bmNDb2RleE5hdGl2ZU5hdkFjdGl2ZSh0cnVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBcdTI1MDBcdTI1MDAgR3JvdXAgY29udGFpbmVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBncm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGdyb3VwLmRhdGFzZXQuY29kZXhwcCA9IFwibmF2LWdyb3VwXCI7XG4gIGdyb3VwLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMVwiO1xuXG4gIGNvbnN0IHVwZGF0ZUJ1dHRvbiA9IHNpZGViYXJVcGRhdGVQaWxsQnV0dG9uKCk7XG4gIHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24gPSB1cGRhdGVCdXR0b247XG4gIGdyb3VwLmFwcGVuZENoaWxkKHNpZGViYXJHcm91cEhlYWRlcihcIkNvZGV4KytcIiwgdXBkYXRlQnV0dG9uKSk7XG4gIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbigpO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBTaWRlYmFyIGl0ZW1zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCBjb25maWdCdG4gPSBtYWtlU2lkZWJhckl0ZW0oXCJDb25maWdcIiwgY29uZmlnSWNvblN2ZygpKTtcbiAgY29uc3QgdHdlYWtzQnRuID0gbWFrZVNpZGViYXJJdGVtKFwiVHdlYWtzXCIsIHR3ZWFrc0ljb25TdmcoKSk7XG4gIGNvbnN0IHN0b3JlQnRuID0gbWFrZVNpZGViYXJJdGVtKFwiVHdlYWsgU3RvcmVcIiwgc3RvcmVJY29uU3ZnKCkpO1xuICBhcHBlbmRTaWRlYmFyU3RvcmVVcGRhdGVCYWRnZShzdG9yZUJ0bik7XG5cbiAgY29uZmlnQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGFjdGl2YXRlUGFnZSh7IGtpbmQ6IFwiY29uZmlnXCIgfSk7XG4gIH0pO1xuICB0d2Vha3NCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgYWN0aXZhdGVQYWdlKHsga2luZDogXCJ0d2Vha3NcIiB9KTtcbiAgfSk7XG4gIHN0b3JlQnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIGFjdGl2YXRlUGFnZSh7IGtpbmQ6IFwic3RvcmVcIiB9KTtcbiAgfSk7XG5cbiAgY29uc3QgaXRlbXMgPSBzaWRlYmFyR3JvdXBJdGVtcygpO1xuICBpdGVtcy5hcHBlbmRDaGlsZChjb25maWdCdG4pO1xuICBpdGVtcy5hcHBlbmRDaGlsZCh0d2Vha3NCdG4pO1xuICBpdGVtcy5hcHBlbmRDaGlsZChzdG9yZUJ0bik7XG4gIGdyb3VwLmFwcGVuZENoaWxkKGl0ZW1zKTtcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoZ3JvdXApO1xuXG4gIHN0YXRlLm5hdkdyb3VwID0gZ3JvdXA7XG4gIHN0YXRlLm5hdkJ1dHRvbnMgPSB7IGNvbmZpZzogY29uZmlnQnRuLCB0d2Vha3M6IHR3ZWFrc0J0biwgc3RvcmU6IHN0b3JlQnRuIH07XG4gIHBsb2coXCJuYXYgZ3JvdXAgaW5qZWN0ZWRcIiwgeyBvdXRlclRhZzogb3V0ZXIudGFnTmFtZSB9KTtcbiAgc3luY1BhZ2VzR3JvdXAoKTtcbn1cblxuZnVuY3Rpb24gbG9nU2lkZWJhck1pc3NpbmcoKTogdm9pZCB7XG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gIGlmIChub3cgLSBsYXN0U2lkZWJhck1pc3NpbmdMb2dBdCA8IDUwMDApIHJldHVybjtcbiAgbGFzdFNpZGViYXJNaXNzaW5nTG9nQXQgPSBub3c7XG4gIHBsb2coXCJzaWRlYmFyIG5vdCBmb3VuZFwiKTtcbn1cblxuZnVuY3Rpb24gc3luY05hdGl2ZVNldHRpbmdzSGVhZGVyKGl0ZW1zR3JvdXA6IEhUTUxFbGVtZW50LCBvdXRlcjogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLm5hdGl2ZU5hdkhlYWRlciAmJiBvdXRlci5jb250YWlucyhzdGF0ZS5uYXRpdmVOYXZIZWFkZXIpKSByZXR1cm47XG4gIGlmIChvdXRlciA9PT0gaXRlbXNHcm91cCkgcmV0dXJuO1xuICBpZiAoaGFzTmF0aXZlU2V0dGluZ3NTZWN0aW9uSGVhZGVycyhvdXRlcikpIHJldHVybjtcblxuICBjb25zdCBoZWFkZXIgPSBzaWRlYmFyR3JvdXBIZWFkZXIoXCJHZW5lcmFsXCIpO1xuICBoZWFkZXIuZGF0YXNldC5jb2RleHBwID0gXCJuYXRpdmUtbmF2LWhlYWRlclwiO1xuICBvdXRlci5pbnNlcnRCZWZvcmUoaGVhZGVyLCBpdGVtc0dyb3VwKTtcbiAgc3RhdGUubmF0aXZlTmF2SGVhZGVyID0gaGVhZGVyO1xufVxuXG5mdW5jdGlvbiBmaW5kU2lkZWJhckluamVjdGlvblJvb3QoaXRlbXNHcm91cDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IG93blNjcm9sbGFibGUgPSBzbWFsbGVzdFNldHRpbmdzU2Nyb2xsYWJsZShbaXRlbXNHcm91cF0pO1xuICBpZiAob3duU2Nyb2xsYWJsZSkgcmV0dXJuIG93blNjcm9sbGFibGU7XG5cbiAgY29uc3QgZGVzY2VuZGFudFNjcm9sbGFibGUgPSBzbWFsbGVzdFNldHRpbmdzU2Nyb2xsYWJsZShcbiAgICBBcnJheS5mcm9tKGl0ZW1zR3JvdXAucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCJkaXYsbmF2LGFzaWRlXCIpKSxcbiAgKTtcbiAgaWYgKGRlc2NlbmRhbnRTY3JvbGxhYmxlKSByZXR1cm4gZGVzY2VuZGFudFNjcm9sbGFibGU7XG5cbiAgY29uc3QgYW5jZXN0b3JzOiBIVE1MRWxlbWVudFtdID0gW107XG4gIGxldCBub2RlID0gaXRlbXNHcm91cC5wYXJlbnRFbGVtZW50O1xuICBmb3IgKGxldCBkZXB0aCA9IDA7IG5vZGUgJiYgZGVwdGggPCA1OyBkZXB0aCsrKSB7XG4gICAgYW5jZXN0b3JzLnB1c2gobm9kZSk7XG4gICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgfVxuICBjb25zdCBhbmNlc3RvclNjcm9sbGFibGUgPSBzbWFsbGVzdFNldHRpbmdzU2Nyb2xsYWJsZShhbmNlc3RvcnMpO1xuICBpZiAoYW5jZXN0b3JTY3JvbGxhYmxlKSByZXR1cm4gYW5jZXN0b3JTY3JvbGxhYmxlO1xuXG4gIHJldHVybiBpdGVtc0dyb3VwLnBhcmVudEVsZW1lbnQgPz8gaXRlbXNHcm91cDtcbn1cblxuZnVuY3Rpb24gc21hbGxlc3RTZXR0aW5nc1Njcm9sbGFibGUobm9kZXM6IEhUTUxFbGVtZW50W10pOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBsZXQgYmVzdDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgbGV0IGJlc3RBcmVhID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuXG4gIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgIGlmICghbm9kZS5jbGFzc0xpc3QuY29udGFpbnMoXCJvdmVyZmxvdy15LWF1dG9cIikpIGNvbnRpbnVlO1xuICAgIGlmICghaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUobm9kZSkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IHJlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGFyZWEgPSByZWN0LndpZHRoICogcmVjdC5oZWlnaHQ7XG4gICAgaWYgKGFyZWEgPCBiZXN0QXJlYSkge1xuICAgICAgYmVzdCA9IG5vZGU7XG4gICAgICBiZXN0QXJlYSA9IGFyZWE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJlc3Q7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZVNldHRpbmdzR3JvdXBzT3V0c2lkZVJvb3Qocm9vdDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZ3JvdXBzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXG4gICAgXCJbZGF0YS1jb2RleHBwPSduYXYtZ3JvdXAnXSwgW2RhdGEtY29kZXhwcD0ncGFnZXMtZ3JvdXAnXSwgW2RhdGEtY29kZXhwcD0nbmF0aXZlLW5hdi1oZWFkZXInXVwiLFxuICApO1xuICBmb3IgKGNvbnN0IGdyb3VwIG9mIEFycmF5LmZyb20oZ3JvdXBzKSkge1xuICAgIGlmIChncm91cC5wYXJlbnRFbGVtZW50ID09PSByb290KSBjb250aW51ZTtcbiAgICByZXNldENvZGV4UHBJbmplY3RlZFNldHRpbmdzR3JvdXBTdGF0ZShncm91cCk7XG4gICAgZ3JvdXAucmVtb3ZlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2lkZWJhckdyb3VwSGVhZGVyKHRleHQ6IHN0cmluZywgdHJhaWxpbmc/OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyLmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHByLTAuNSBwbC0yIHNlbGVjdC1ub25lXCI7XG4gIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGxhYmVsLmNsYXNzTmFtZSA9IFwibWluLXctMCBmbGV4LTEgdHJ1bmNhdGUgdGV4dC1iYXNlIHRleHQtdG9rZW4taW5wdXQtcGxhY2Vob2xkZXItZm9yZWdyb3VuZCBvcGFjaXR5LTc1XCI7XG4gIGxhYmVsLnRleHRDb250ZW50ID0gdGV4dDtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKGxhYmVsKTtcbiAgaWYgKHRyYWlsaW5nKSB7XG4gICAgY29uc3QgdHJhaWxpbmdXcmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0cmFpbGluZ1dyYXAuY2xhc3NOYW1lID0gXCJzaHJpbmstMFwiO1xuICAgIHRyYWlsaW5nV3JhcC5hcHBlbmRDaGlsZCh0cmFpbGluZyk7XG4gICAgaGVhZGVyLmFwcGVuZENoaWxkKHRyYWlsaW5nV3JhcCk7XG4gIH1cbiAgcmV0dXJuIGhlYWRlcjtcbn1cblxuZnVuY3Rpb24gc2lkZWJhckdyb3VwSXRlbXMoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBpdGVtcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGl0ZW1zLmRhdGFzZXQuY29kZXhwcCA9IFwiZ3JvdXAtaXRlbXNcIjtcbiAgaXRlbXMuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC1weFwiO1xuICByZXR1cm4gaXRlbXM7XG59XG5cbmZ1bmN0aW9uIHNjaGVkdWxlU2V0dGluZ3NTdXJmYWNlSGlkZGVuKCk6IHZvaWQge1xuICBpZiAoIXN0YXRlLnNldHRpbmdzU3VyZmFjZVZpc2libGUgfHwgc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyKSByZXR1cm47XG4gIHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHN0YXRlLnNldHRpbmdzU3VyZmFjZUhpZGVUaW1lciA9IG51bGw7XG4gICAgY29uc3Qgc2lkZWJhciA9IGZpbmRTaWRlYmFySXRlbXNHcm91cCgpO1xuICAgIGlmIChzaWRlYmFyICYmIGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKHNpZGViYXIpKSByZXR1cm47XG4gICAgaWYgKGlzU2V0dGluZ3NUZXh0VmlzaWJsZSgpKSByZXR1cm47XG4gICAgc2V0U2V0dGluZ3NTdXJmYWNlVmlzaWJsZShmYWxzZSwgXCJzaWRlYmFyLW5vdC1mb3VuZFwiKTtcbiAgfSwgMTUwMCk7XG59XG5cbmZ1bmN0aW9uIGlzU2V0dGluZ3NUZXh0VmlzaWJsZSgpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzQ29kZXhQcFNldHRpbmdzTGFiZWxTZXQoY29kZXhQcFNldHRpbmdzTGFiZWxzRnJvbShkb2N1bWVudCkpO1xufVxuXG5mdW5jdGlvbiBzZXRTZXR0aW5nc1N1cmZhY2VWaXNpYmxlKHZpc2libGU6IGJvb2xlYW4sIHJlYXNvbjogc3RyaW5nKTogdm9pZCB7XG4gIGlmIChzdGF0ZS5zZXR0aW5nc1N1cmZhY2VWaXNpYmxlID09PSB2aXNpYmxlKSByZXR1cm47XG4gIHN0YXRlLnNldHRpbmdzU3VyZmFjZVZpc2libGUgPSB2aXNpYmxlO1xuICBpZiAodmlzaWJsZSkgd2FybVR3ZWFrU3RvcmUoKTtcbiAgdHJ5IHtcbiAgICAod2luZG93IGFzIFdpbmRvdyAmIHsgX19jb2RleHBwU2V0dGluZ3NTdXJmYWNlVmlzaWJsZT86IGJvb2xlYW4gfSkuX19jb2RleHBwU2V0dGluZ3NTdXJmYWNlVmlzaWJsZSA9IHZpc2libGU7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuY29kZXhwcFNldHRpbmdzU3VyZmFjZSA9IHZpc2libGUgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChcbiAgICAgIG5ldyBDdXN0b21FdmVudChcImNvZGV4cHA6c2V0dGluZ3Mtc3VyZmFjZVwiLCB7XG4gICAgICAgIGRldGFpbDogeyB2aXNpYmxlLCByZWFzb24gfSxcbiAgICAgIH0pLFxuICAgICk7XG4gIH0gY2F0Y2gge31cbiAgcGxvZyhcInNldHRpbmdzIHN1cmZhY2VcIiwgeyB2aXNpYmxlLCByZWFzb24sIHVybDogbG9jYXRpb24uaHJlZiB9KTtcbn1cblxuLyoqXG4gKiBSZW5kZXIgKG9yIHJlLXJlbmRlcikgdGhlIHNlY29uZCBzaWRlYmFyIGdyb3VwIG9mIHBlci10d2VhayBwYWdlcy4gVGhlXG4gKiBncm91cCBpcyBjcmVhdGVkIGxhemlseSBhbmQgcmVtb3ZlZCB3aGVuIHRoZSBsYXN0IHBhZ2UgdW5yZWdpc3RlcnMsIHNvXG4gKiB1c2VycyB3aXRoIG5vIHBhZ2UtcmVnaXN0ZXJpbmcgdHdlYWtzIG5ldmVyIHNlZSBhbiBlbXB0eSBcIlR3ZWFrc1wiIGhlYWRlci5cbiAqL1xuZnVuY3Rpb24gc3luY1BhZ2VzR3JvdXAoKTogdm9pZCB7XG4gIGNvbnN0IG91dGVyID0gc3RhdGUuc2lkZWJhclJvb3Q7XG4gIGlmICghb3V0ZXIpIHJldHVybjtcbiAgaWYgKCFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShvdXRlcikpIHtcbiAgICBzdGF0ZS5zaWRlYmFyUm9vdCA9IG51bGw7XG4gICAgc3RhdGUucGFnZXNHcm91cCA9IG51bGw7XG4gICAgc3RhdGUucGFnZXNHcm91cEtleSA9IG51bGw7XG4gICAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSBwLm5hdkJ1dHRvbiA9IG51bGw7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHBhZ2VzID0gWy4uLnN0YXRlLnBhZ2VzLnZhbHVlcygpXTtcblxuICAvLyBCdWlsZCBhIGRldGVybWluaXN0aWMgZmluZ2VycHJpbnQgb2YgdGhlIGRlc2lyZWQgZ3JvdXAgc3RhdGUuIElmIHRoZVxuICAvLyBjdXJyZW50IERPTSBncm91cCBhbHJlYWR5IG1hdGNoZXMsIHRoaXMgaXMgYSBuby1vcCBcdTIwMTQgY3JpdGljYWwsIGJlY2F1c2VcbiAgLy8gc3luY1BhZ2VzR3JvdXAgaXMgY2FsbGVkIG9uIGV2ZXJ5IE11dGF0aW9uT2JzZXJ2ZXIgdGljayBhbmQgYW55IERPTVxuICAvLyB3cml0ZSB3b3VsZCByZS10cmlnZ2VyIHRoYXQgb2JzZXJ2ZXIgKGluZmluaXRlIGxvb3AsIGFwcCBmcmVlemUpLlxuICBjb25zdCBkZXNpcmVkS2V5ID0gcGFnZXMubGVuZ3RoID09PSAwXG4gICAgPyBcIkVNUFRZXCJcbiAgICA6IHBhZ2VzLm1hcCgocCkgPT4gYCR7cC5pZH18JHtwLnBhZ2UudGl0bGV9fCR7cC5wYWdlLmljb25TdmcgPz8gXCJcIn1gKS5qb2luKFwiXFxuXCIpO1xuICBjb25zdCBncm91cEF0dGFjaGVkID0gISFzdGF0ZS5wYWdlc0dyb3VwICYmIG91dGVyLmNvbnRhaW5zKHN0YXRlLnBhZ2VzR3JvdXApO1xuICBpZiAoc3RhdGUucGFnZXNHcm91cEtleSA9PT0gZGVzaXJlZEtleSAmJiAocGFnZXMubGVuZ3RoID09PSAwID8gIWdyb3VwQXR0YWNoZWQgOiBncm91cEF0dGFjaGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChwYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoc3RhdGUucGFnZXNHcm91cCkge1xuICAgICAgc3RhdGUucGFnZXNHcm91cC5yZW1vdmUoKTtcbiAgICAgIHN0YXRlLnBhZ2VzR3JvdXAgPSBudWxsO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHAgb2Ygc3RhdGUucGFnZXMudmFsdWVzKCkpIHAubmF2QnV0dG9uID0gbnVsbDtcbiAgICBzdGF0ZS5wYWdlc0dyb3VwS2V5ID0gZGVzaXJlZEtleTtcbiAgICByZXR1cm47XG4gIH1cblxuICBsZXQgZ3JvdXAgPSBzdGF0ZS5wYWdlc0dyb3VwO1xuICBpZiAoIWdyb3VwIHx8ICFvdXRlci5jb250YWlucyhncm91cCkpIHtcbiAgICBncm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgZ3JvdXAuZGF0YXNldC5jb2RleHBwID0gXCJwYWdlcy1ncm91cFwiO1xuICAgIGdyb3VwLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMVwiO1xuICAgIGdyb3VwLmFwcGVuZENoaWxkKHNpZGViYXJHcm91cEhlYWRlcihcIlR3ZWFrc1wiKSk7XG4gICAgZ3JvdXAuYXBwZW5kQ2hpbGQoc2lkZWJhckdyb3VwSXRlbXMoKSk7XG4gICAgb3V0ZXIuYXBwZW5kQ2hpbGQoZ3JvdXApO1xuICAgIHN0YXRlLnBhZ2VzR3JvdXAgPSBncm91cDtcbiAgfVxuXG4gIGxldCBpdGVtcyA9IGdyb3VwLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KCc6c2NvcGUgPiBbZGF0YS1jb2RleHBwPVwiZ3JvdXAtaXRlbXNcIl0nKTtcbiAgaWYgKCFpdGVtcykge1xuICAgIGl0ZW1zID0gc2lkZWJhckdyb3VwSXRlbXMoKTtcbiAgICB3aGlsZSAoZ3JvdXAuY2hpbGRyZW4ubGVuZ3RoID4gMSkgaXRlbXMuYXBwZW5kQ2hpbGQoZ3JvdXAuY2hpbGRyZW5bMV0pO1xuICAgIGdyb3VwLmFwcGVuZENoaWxkKGl0ZW1zKTtcbiAgfVxuICBpdGVtcy5yZXBsYWNlQ2hpbGRyZW4oKTtcblxuICBmb3IgKGNvbnN0IHAgb2YgcGFnZXMpIHtcbiAgICBjb25zdCBpY29uID0gcC5wYWdlLmljb25TdmcgPz8gZGVmYXVsdFBhZ2VJY29uU3ZnKCk7XG4gICAgY29uc3QgYnRuID0gbWFrZVNpZGViYXJJdGVtKHAucGFnZS50aXRsZSwgaWNvbik7XG4gICAgYnRuLmRhdGFzZXQuY29kZXhwcCA9IGBuYXYtcGFnZS0ke3AuaWR9YDtcbiAgICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgYWN0aXZhdGVQYWdlKHsga2luZDogXCJyZWdpc3RlcmVkXCIsIGlkOiBwLmlkIH0pO1xuICAgIH0pO1xuICAgIHAubmF2QnV0dG9uID0gYnRuO1xuICAgIGl0ZW1zLmFwcGVuZENoaWxkKGJ0bik7XG4gIH1cbiAgc3RhdGUucGFnZXNHcm91cEtleSA9IGRlc2lyZWRLZXk7XG4gIHBsb2coXCJwYWdlcyBncm91cCBzeW5jZWRcIiwge1xuICAgIGNvdW50OiBwYWdlcy5sZW5ndGgsXG4gICAgaWRzOiBwYWdlcy5tYXAoKHApID0+IHAuaWQpLFxuICB9KTtcbiAgLy8gUmVmbGVjdCBjdXJyZW50IGFjdGl2ZSBzdGF0ZSBhY3Jvc3MgdGhlIHJlYnVpbHQgYnV0dG9ucy5cbiAgc2V0TmF2QWN0aXZlKHN0YXRlLmFjdGl2ZVBhZ2UpO1xufVxuXG5mdW5jdGlvbiBtYWtlU2lkZWJhckl0ZW0obGFiZWw6IHN0cmluZywgaWNvblN2Zzogc3RyaW5nKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICAvLyBDbGFzcyBzdHJpbmcgY29waWVkIHZlcmJhdGltIGZyb20gQ29kZXgncyBzaWRlYmFyIGJ1dHRvbnMgKEdlbmVyYWwgZXRjKS5cbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xuICBidG4uZGF0YXNldC5jb2RleHBwID0gYG5hdi0ke2xhYmVsLnRvTG93ZXJDYXNlKCl9YDtcbiAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgbGFiZWwpO1xuICBidG4uY2xhc3NOYW1lID1cbiAgICBcImZvY3VzLXZpc2libGU6b3V0bGluZS10b2tlbi1ib3JkZXIgcmVsYXRpdmUgcHgtcm93LXggcHktcm93LXkgY3Vyc29yLWludGVyYWN0aW9uIHNocmluay0wIGl0ZW1zLWNlbnRlciBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1sZyB0ZXh0LWxlZnQgdGV4dC1zbSBmb2N1cy12aXNpYmxlOm91dGxpbmUgZm9jdXMtdmlzaWJsZTpvdXRsaW5lLTIgZm9jdXMtdmlzaWJsZTpvdXRsaW5lLW9mZnNldC0yIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTUwIGdhcC0yIGZsZXggdy1mdWxsIGhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZCBmb250LW5vcm1hbFwiO1xuXG4gIGNvbnN0IGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaW5uZXIuY2xhc3NOYW1lID1cbiAgICBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgdGV4dC1iYXNlIGdhcC0yIGZsZXgtMSB0ZXh0LXRva2VuLWZvcmVncm91bmRcIjtcbiAgYXBwZW5kU3ZnSHRtbChpbm5lciwgaWNvblN2Zyk7XG4gIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgdGV4dC5jbGFzc05hbWUgPSBcInRydW5jYXRlXCI7XG4gIHRleHQudGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgaW5uZXIuYXBwZW5kQ2hpbGQodGV4dCk7XG4gIGJ0bi5hcHBlbmRDaGlsZChpbm5lcik7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFNpZGViYXJTdG9yZVVwZGF0ZUJhZGdlKGJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgaW5uZXIgPSBidG4uZmlyc3RFbGVtZW50Q2hpbGQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAoIWlubmVyKSByZXR1cm47XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGJhZGdlLmRhdGFzZXQuY29kZXhwcFN0b3JlVXBkYXRlQmFkZ2UgPSBcInRydWVcIjtcbiAgYmFkZ2UuaGlkZGVuID0gdHJ1ZTtcbiAgYmFkZ2UudGl0bGUgPSBcIkluc3RhbGxlZCB0d2Vha3Mgd2l0aCBhcHByb3ZlZCB1cGRhdGVzXCI7XG4gIGJhZGdlLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI7XG4gIE9iamVjdC5hc3NpZ24oYmFkZ2Uuc3R5bGUsIHtcbiAgICBwb3NpdGlvbjogXCJhYnNvbHV0ZVwiLFxuICAgIHJpZ2h0OiBcIjEycHhcIixcbiAgICB0b3A6IFwiNTAlXCIsXG4gICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZVkoLTUwJSlcIixcbiAgICB6SW5kZXg6IFwiMVwiLFxuICB9KTtcbiAgYXBwbHlTdG9yZVVwZGF0ZUJhZGdlU3R5bGUoYmFkZ2UsIG51bGwpO1xuICBidG4uYXBwZW5kQ2hpbGQoYmFkZ2UpO1xufVxuXG4vKiogSW50ZXJuYWwga2V5IGZvciB0aGUgYnVpbHQtaW4gbmF2IGJ1dHRvbnMuICovXG50eXBlIEJ1aWx0aW5QYWdlID0gXCJjb25maWdcIiB8IFwidHdlYWtzXCIgfCBcInN0b3JlXCI7XG5cbmZ1bmN0aW9uIHNldE5hdkFjdGl2ZShhY3RpdmU6IEFjdGl2ZVBhZ2UgfCBudWxsKTogdm9pZCB7XG4gIC8vIEJ1aWx0LWluIChDb25maWcvVHdlYWtzKSBidXR0b25zLlxuICBpZiAoc3RhdGUubmF2QnV0dG9ucykge1xuICAgIGNvbnN0IGJ1aWx0aW46IEJ1aWx0aW5QYWdlIHwgbnVsbCA9XG4gICAgICBhY3RpdmU/LmtpbmQgPT09IFwiY29uZmlnXCIgPyBcImNvbmZpZ1wiIDpcbiAgICAgIGFjdGl2ZT8ua2luZCA9PT0gXCJ0d2Vha3NcIiA/IFwidHdlYWtzXCIgOlxuICAgICAgYWN0aXZlPy5raW5kID09PSBcInN0b3JlXCIgPyBcInN0b3JlXCIgOiBudWxsO1xuICAgIGZvciAoY29uc3QgW2tleSwgYnRuXSBvZiBPYmplY3QuZW50cmllcyhzdGF0ZS5uYXZCdXR0b25zKSBhcyBbQnVpbHRpblBhZ2UsIEhUTUxCdXR0b25FbGVtZW50XVtdKSB7XG4gICAgICBhcHBseU5hdkFjdGl2ZShidG4sIGtleSA9PT0gYnVpbHRpbik7XG4gICAgfVxuICB9XG4gIC8vIFBlci1wYWdlIHJlZ2lzdGVyZWQgYnV0dG9ucy5cbiAgZm9yIChjb25zdCBwIG9mIHN0YXRlLnBhZ2VzLnZhbHVlcygpKSB7XG4gICAgaWYgKCFwLm5hdkJ1dHRvbikgY29udGludWU7XG4gICAgY29uc3QgaXNBY3RpdmUgPSBhY3RpdmU/LmtpbmQgPT09IFwicmVnaXN0ZXJlZFwiICYmIGFjdGl2ZS5pZCA9PT0gcC5pZDtcbiAgICBhcHBseU5hdkFjdGl2ZShwLm5hdkJ1dHRvbiwgaXNBY3RpdmUpO1xuICB9XG4gIC8vIENvZGV4J3Mgb3duIHNpZGViYXIgYnV0dG9ucyAoR2VuZXJhbCwgQXBwZWFyYW5jZSwgZXRjKS4gV2hlbiBvbmUgb2ZcbiAgLy8gb3VyIHBhZ2VzIGlzIGFjdGl2ZSwgQ29kZXggc3RpbGwgaGFzIGFyaWEtY3VycmVudD1cInBhZ2VcIiBhbmQgdGhlXG4gIC8vIGFjdGl2ZS1iZyBjbGFzcyBvbiB3aGljaGV2ZXIgaXRlbSBpdCBjb25zaWRlcmVkIHRoZSByb3V0ZSBcdTIwMTQgdHlwaWNhbGx5XG4gIC8vIEdlbmVyYWwuIFRoYXQgbWFrZXMgYm90aCBidXR0b25zIGxvb2sgc2VsZWN0ZWQuIFN0cmlwIENvZGV4J3MgYWN0aXZlXG4gIC8vIHN0eWxpbmcgd2hpbGUgb25lIG9mIG91cnMgaXMgYWN0aXZlOyByZXN0b3JlIGl0IHdoZW4gbm9uZSBpcy5cbiAgc3luY0NvZGV4TmF0aXZlTmF2QWN0aXZlKGFjdGl2ZSAhPT0gbnVsbCk7XG59XG5cbi8qKlxuICogTXV0ZSBDb2RleCdzIG93biBhY3RpdmUtc3RhdGUgc3R5bGluZyBvbiBpdHMgc2lkZWJhciBidXR0b25zLiBXZSBkb24ndFxuICogdG91Y2ggQ29kZXgncyBSZWFjdCBzdGF0ZSBcdTIwMTQgd2hlbiB0aGUgdXNlciBjbGlja3MgYSBuYXRpdmUgaXRlbSwgQ29kZXhcbiAqIHJlLXJlbmRlcnMgdGhlIGJ1dHRvbnMgYW5kIHJlLWFwcGxpZXMgaXRzIG93biBjb3JyZWN0IHN0YXRlLCB0aGVuIG91clxuICogc2lkZWJhci1jbGljayBsaXN0ZW5lciBmaXJlcyBgcmVzdG9yZUNvZGV4Vmlld2AgKHdoaWNoIGNhbGxzIGJhY2sgaW50b1xuICogYHNldE5hdkFjdGl2ZShudWxsKWAgYW5kIGxldHMgQ29kZXgncyBzdHlsaW5nIHN0YW5kKS5cbiAqXG4gKiBgbXV0ZT10cnVlYCAgXHUyMTkyIHN0cmlwIGFyaWEtY3VycmVudCBhbmQgc3dhcCBhY3RpdmUgYmcgXHUyMTkyIGhvdmVyIGJnXG4gKiBgbXV0ZT1mYWxzZWAgXHUyMTkyIG5vLW9wIChDb2RleCdzIG93biByZS1yZW5kZXIgYWxyZWFkeSByZXN0b3JlZCB0aGluZ3MpXG4gKi9cbmZ1bmN0aW9uIHN5bmNDb2RleE5hdGl2ZU5hdkFjdGl2ZShtdXRlOiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghbXV0ZSkgcmV0dXJuO1xuICBjb25zdCByb290ID0gc3RhdGUuc2lkZWJhclJvb3Q7XG4gIGlmICghcm9vdCkgcmV0dXJuO1xuICBjb25zdCBidXR0b25zID0gQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEJ1dHRvbkVsZW1lbnQ+KFwiYnV0dG9uXCIpKTtcbiAgZm9yIChjb25zdCBidG4gb2YgYnV0dG9ucykge1xuICAgIC8vIFNraXAgb3VyIG93biBidXR0b25zLlxuICAgIGlmIChidG4uZGF0YXNldC5jb2RleHBwKSBjb250aW51ZTtcbiAgICBpZiAoYnRuLmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSA9PT0gXCJwYWdlXCIpIHtcbiAgICAgIGJ0bi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIik7XG4gICAgfVxuICAgIGlmIChidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpKSB7XG4gICAgICBidG4uY2xhc3NMaXN0LnJlbW92ZShcImJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiKTtcbiAgICAgIGJ0bi5jbGFzc0xpc3QuYWRkKFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseU5hdkFjdGl2ZShidG46IEhUTUxCdXR0b25FbGVtZW50LCBhY3RpdmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgaW5uZXIgPSBidG4uZmlyc3RFbGVtZW50Q2hpbGQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpZiAoYWN0aXZlKSB7XG4gICAgICBidG4uY2xhc3NMaXN0LnJlbW92ZShcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIik7XG4gICAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIsIFwicGFnZVwiKTtcbiAgICAgIGlmIChpbm5lcikge1xuICAgICAgICBpbm5lci5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC10b2tlbi1mb3JlZ3JvdW5kXCIpO1xuICAgICAgICBpbm5lci5jbGFzc0xpc3QuYWRkKFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiKTtcbiAgICAgICAgaW5uZXJcbiAgICAgICAgICAucXVlcnlTZWxlY3RvcihcInN2Z1wiKVxuICAgICAgICAgID8uY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoXCJob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIiwgXCJmb250LW5vcm1hbFwiKTtcbiAgICAgIGJ0bi5jbGFzc0xpc3QucmVtb3ZlKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgICAgYnRuLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKTtcbiAgICAgIGlmIChpbm5lcikge1xuICAgICAgICBpbm5lci5jbGFzc0xpc3QuYWRkKFwidGV4dC10b2tlbi1mb3JlZ3JvdW5kXCIpO1xuICAgICAgICBpbm5lci5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiKTtcbiAgICAgICAgaW5uZXJcbiAgICAgICAgICAucXVlcnlTZWxlY3RvcihcInN2Z1wiKVxuICAgICAgICAgID8uY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcbiAgICAgIH1cbiAgICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBhY3RpdmF0aW9uIFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBhY3RpdmF0ZVBhZ2UocGFnZTogQWN0aXZlUGFnZSk6IHZvaWQge1xuICBjb25zdCBjb250ZW50ID0gZmluZENvbnRlbnRBcmVhKCk7XG4gIGlmICghY29udGVudCkge1xuICAgIGlmIChzdGF0ZS5hY3RpdmVQYWdlKSByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgcGxvZyhcImFjdGl2YXRlOiBjb250ZW50IGFyZWEgbm90IGZvdW5kXCIpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoc3RhdGUuY29udGVudEhvc3QgJiYgc3RhdGUuY29udGVudEhvc3QgIT09IGNvbnRlbnQpIHJlc3RvcmVDb2RleFZpZXcoKTtcbiAgc3RhdGUuYWN0aXZlUGFnZSA9IHBhZ2U7XG4gIHN0YXRlLmNvbnRlbnRIb3N0ID0gY29udGVudDtcbiAgcGxvZyhcImFjdGl2YXRlXCIsIHsgcGFnZSB9KTtcblxuICAvLyBIaWRlIENvZGV4J3MgY29udGVudCBjaGlsZHJlbiwgc2hvdyBvdXJzLlxuICBmb3IgKGNvbnN0IGNoaWxkIG9mIEFycmF5LmZyb20oY29udGVudC5jaGlsZHJlbikgYXMgSFRNTEVsZW1lbnRbXSkge1xuICAgIGlmIChjaGlsZC5kYXRhc2V0LmNvZGV4cHAgPT09IFwidHdlYWtzLXBhbmVsXCIpIGNvbnRpbnVlO1xuICAgIGlmICghc3RhdGUuaGlkZGVuQ29udGVudC5oYXMoY2hpbGQpKSBzdGF0ZS5oaWRkZW5Db250ZW50LnNldChjaGlsZCwgY2hpbGQuc3R5bGUuZGlzcGxheSk7XG4gICAgY2hpbGQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9XG4gIGxldCBwYW5lbCA9IGNvbnRlbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJ1tkYXRhLWNvZGV4cHA9XCJ0d2Vha3MtcGFuZWxcIl0nKTtcbiAgaWYgKCFwYW5lbCkge1xuICAgIHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBwYW5lbC5kYXRhc2V0LmNvZGV4cHAgPSBcInR3ZWFrcy1wYW5lbFwiO1xuICAgIHBhbmVsLnN0eWxlLmNzc1RleHQgPSBcIndpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7b3ZlcmZsb3c6YXV0bztcIjtcbiAgICBjb250ZW50LmFwcGVuZENoaWxkKHBhbmVsKTtcbiAgfVxuICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICBzdGF0ZS5wYW5lbEhvc3QgPSBwYW5lbDtcbiAgcmVyZW5kZXIoKTtcbiAgc2V0TmF2QWN0aXZlKHBhZ2UpO1xuICAvLyByZXN0b3JlIENvZGV4J3Mgdmlldy4gUmUtcmVnaXN0ZXIgaWYgbmVlZGVkLlxuICBjb25zdCBzaWRlYmFyID0gc3RhdGUuc2lkZWJhclJvb3Q7XG4gIGlmIChzaWRlYmFyKSB7XG4gICAgaWYgKHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlcikge1xuICAgICAgc2lkZWJhci5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyLCB0cnVlKTtcbiAgICB9XG4gICAgY29uc3QgaGFuZGxlciA9IChlOiBFdmVudCkgPT4ge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgICAgIGlmIChzdGF0ZS5uYXZHcm91cD8uY29udGFpbnModGFyZ2V0KSkgcmV0dXJuOyAvLyBvdXIgYnV0dG9uc1xuICAgICAgaWYgKHN0YXRlLnBhZ2VzR3JvdXA/LmNvbnRhaW5zKHRhcmdldCkpIHJldHVybjsgLy8gb3VyIHBhZ2UgYnV0dG9uc1xuICAgICAgaWYgKHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zZXR0aW5ncy1zZWFyY2hdXCIpKSByZXR1cm47XG4gICAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgfTtcbiAgICBzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIgPSBoYW5kbGVyO1xuICAgIHNpZGViYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZXIsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc3RvcmVDb2RleFZpZXcoKTogdm9pZCB7XG4gIHBsb2coXCJyZXN0b3JlIGNvZGV4IHZpZXdcIik7XG4gIGlmIChzdGF0ZS5wYW5lbEhvc3QpIHN0YXRlLnBhbmVsSG9zdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIHN0YXRlLnBhbmVsSG9zdCA9IG51bGw7XG4gIGZvciAoY29uc3QgW2NoaWxkLCBkaXNwbGF5XSBvZiBzdGF0ZS5oaWRkZW5Db250ZW50KSBjaGlsZC5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheTtcbiAgc3RhdGUuaGlkZGVuQ29udGVudC5jbGVhcigpO1xuICBzdGF0ZS5jb250ZW50SG9zdCA9IG51bGw7XG4gIHN0YXRlLmFjdGl2ZVBhZ2UgPSBudWxsO1xuICBzZXROYXZBY3RpdmUobnVsbCk7XG4gIGlmIChzdGF0ZS5zaWRlYmFyUm9vdCAmJiBzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIpIHtcbiAgICBzdGF0ZS5zaWRlYmFyUm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgXCJjbGlja1wiLFxuICAgICAgc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyLFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICAgIHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlciA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVyZW5kZXIoKTogdm9pZCB7XG4gIGlmICghc3RhdGUuYWN0aXZlUGFnZSkgcmV0dXJuO1xuICBjb25zdCBob3N0ID0gc3RhdGUucGFuZWxIb3N0O1xuICBpZiAoIWhvc3QpIHJldHVybjtcbiAgaG9zdC5yZXBsYWNlQ2hpbGRyZW4oKTtcblxuICBjb25zdCBhcCA9IHN0YXRlLmFjdGl2ZVBhZ2U7XG4gIGlmIChhcC5raW5kID09PSBcInJlZ2lzdGVyZWRcIikge1xuICAgIGNvbnN0IGVudHJ5ID0gc3RhdGUucGFnZXMuZ2V0KGFwLmlkKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb3QgPSBwYW5lbFNoZWxsKGVudHJ5LnBhZ2UudGl0bGUsIGVudHJ5LnBhZ2UuZGVzY3JpcHRpb24pO1xuICAgIGhvc3QuYXBwZW5kQ2hpbGQocm9vdC5vdXRlcik7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFRlYXIgZG93biBhbnkgcHJpb3IgcmVuZGVyIGJlZm9yZSByZS1yZW5kZXJpbmcgKGhvdCByZWxvYWQpLlxuICAgICAgdHJ5IHsgZW50cnkudGVhcmRvd24/LigpOyB9IGNhdGNoIHt9XG4gICAgICBlbnRyeS50ZWFyZG93biA9IG51bGw7XG4gICAgICBjb25zdCByZXQgPSBlbnRyeS5wYWdlLnJlbmRlcihyb290LnNlY3Rpb25zV3JhcCk7XG4gICAgICBpZiAodHlwZW9mIHJldCA9PT0gXCJmdW5jdGlvblwiKSBlbnRyeS50ZWFyZG93biA9IHJldDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zdCBlcnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgZXJyLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi1jaGFydHMtcmVkIHRleHQtc21cIjtcbiAgICAgIGVyci50ZXh0Q29udGVudCA9IGBFcnJvciByZW5kZXJpbmcgcGFnZTogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gO1xuICAgICAgcm9vdC5zZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQoZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdGl0bGUgPVxuICAgIGFwLmtpbmQgPT09IFwidHdlYWtzXCIgPyBcIlR3ZWFrc1wiIDpcbiAgICBhcC5raW5kID09PSBcInN0b3JlXCIgPyBcIlR3ZWFrIFN0b3JlXCIgOiBcIkNvZGV4KytcIjtcbiAgY29uc3Qgc3VidGl0bGUgPVxuICAgIGFwLmtpbmQgPT09IFwidHdlYWtzXCJcbiAgICAgID8gXCJNYW5hZ2UgeW91ciBpbnN0YWxsZWQgQ29kZXgrKyB0d2Vha3MuXCJcbiAgICAgIDogYXAua2luZCA9PT0gXCJzdG9yZVwiXG4gICAgICAgID8gXCJJbnN0YWxsIHJldmlld2VkIHR3ZWFrcyBwaW5uZWQgdG8gYXBwcm92ZWQgR2l0SHViIGNvbW1pdHMuXCJcbiAgICAgICAgOiBcIkNoZWNraW5nIGluc3RhbGxlZCBDb2RleCsrIHZlcnNpb24uXCI7XG4gIGNvbnN0IHJvb3QgPSBwYW5lbFNoZWxsKHRpdGxlLCBzdWJ0aXRsZSk7XG4gIGhvc3QuYXBwZW5kQ2hpbGQocm9vdC5vdXRlcik7XG4gIGlmIChhcC5raW5kID09PSBcInR3ZWFrc1wiKSByZW5kZXJUd2Vha3NQYWdlKHJvb3Quc2VjdGlvbnNXcmFwKTtcbiAgZWxzZSBpZiAoYXAua2luZCA9PT0gXCJzdG9yZVwiKSByZW5kZXJUd2Vha1N0b3JlUGFnZShyb290LnNlY3Rpb25zV3JhcCwgcm9vdC5oZWFkZXJBY3Rpb25zKTtcbiAgZWxzZSByZW5kZXJDb25maWdQYWdlKHJvb3Quc2VjdGlvbnNXcmFwLCByb290LnN1YnRpdGxlKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIHBhZ2VzIFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiByZW5kZXJDb25maWdQYWdlKFxuICBzZWN0aW9uc1dyYXA6IEhUTUxFbGVtZW50LFxuICBzdWJ0aXRsZT86IEhUTUxFbGVtZW50LFxuKTogdm9pZCB7XG4gIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJDb2RleCsrIFVwZGF0ZXNcIikpO1xuICBjb25zdCBjYXJkID0gcm91bmRlZENhcmQoKTtcbiAgY2FyZC5kYXRhc2V0LmNvZGV4cHBDb25maWdDYXJkID0gXCJ0cnVlXCI7XG4gIGNvbnN0IGxvYWRpbmcgPSByb3dTaW1wbGUoXCJMb2FkaW5nIHVwZGF0ZSBzZXR0aW5nc1wiLCBcIkNoZWNraW5nIGN1cnJlbnQgQ29kZXgrKyBjb25maWd1cmF0aW9uLlwiKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChsb2FkaW5nKTtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChjYXJkKTtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNlY3Rpb24pO1xuXG4gIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAuaW52b2tlKFwiY29kZXhwcDpnZXQtY29uZmlnXCIpXG4gICAgLnRoZW4oKGNvbmZpZykgPT4ge1xuICAgICAgaWYgKHN1YnRpdGxlKSB7XG4gICAgICAgIHN1YnRpdGxlLnRleHRDb250ZW50ID0gYFlvdSBoYXZlIENvZGV4KysgJHsoY29uZmlnIGFzIENvZGV4UGx1c1BsdXNDb25maWcpLnZlcnNpb259IGluc3RhbGxlZC5gO1xuICAgICAgfVxuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICByZW5kZXJDb2RleFBsdXNQbHVzQ29uZmlnKGNhcmQsIGNvbmZpZyBhcyBDb2RleFBsdXNQbHVzQ29uZmlnKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgaWYgKHN1YnRpdGxlKSBzdWJ0aXRsZS50ZXh0Q29udGVudCA9IFwiQ291bGQgbm90IGxvYWQgaW5zdGFsbGVkIENvZGV4KysgdmVyc2lvbi5cIjtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDb3VsZCBub3QgbG9hZCB1cGRhdGUgc2V0dGluZ3NcIiwgU3RyaW5nKGUpKSk7XG4gICAgfSk7XG5cbiAgY29uc3Qgd2F0Y2hlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpO1xuICB3YXRjaGVyLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICB3YXRjaGVyLmFwcGVuZENoaWxkKHNlY3Rpb25UaXRsZShcIkF1dG8tUmVwYWlyIFdhdGNoZXJcIikpO1xuICBjb25zdCB3YXRjaGVyQ2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIHdhdGNoZXJDYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIkNoZWNraW5nIHdhdGNoZXJcIiwgXCJWZXJpZnlpbmcgdGhlIHVwZGF0ZXIgcmVwYWlyIHNlcnZpY2UuXCIpKTtcbiAgd2F0Y2hlci5hcHBlbmRDaGlsZCh3YXRjaGVyQ2FyZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZCh3YXRjaGVyKTtcbiAgcmVuZGVyV2F0Y2hlckhlYWx0aENhcmQod2F0Y2hlckNhcmQpO1xuXG4gIGNvbnN0IG1haW50ZW5hbmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gIG1haW50ZW5hbmNlLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICBtYWludGVuYW5jZS5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJNYWludGVuYW5jZVwiKSk7XG4gIGNvbnN0IG1haW50ZW5hbmNlQ2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIG1haW50ZW5hbmNlQ2FyZC5hcHBlbmRDaGlsZCh1bmluc3RhbGxSb3coKSk7XG4gIG1haW50ZW5hbmNlQ2FyZC5hcHBlbmRDaGlsZChyZXBvcnRCdWdSb3coKSk7XG4gIG1haW50ZW5hbmNlLmFwcGVuZENoaWxkKG1haW50ZW5hbmNlQ2FyZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZChtYWludGVuYW5jZSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvZGV4UGx1c1BsdXNDb25maWcoY2FyZDogSFRNTEVsZW1lbnQsIGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IHZvaWQge1xuICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjb25maWcudXBkYXRlQ2hlY2spO1xuICBjYXJkLmFwcGVuZENoaWxkKGF1dG9VcGRhdGVSb3coY29uZmlnKSk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQodXBkYXRlQ2hhbm5lbFJvdyhjb25maWcpKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChpbnN0YWxsYXRpb25Tb3VyY2VSb3coY29uZmlnLmluc3RhbGxhdGlvblNvdXJjZSkpO1xuICBjYXJkLmFwcGVuZENoaWxkKHNlbGZVcGRhdGVTdGF0dXNSb3coY29uZmlnLnNlbGZVcGRhdGUpKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChjaGVja0ZvclVwZGF0ZXNSb3coY29uZmlnKSk7XG4gIGlmIChjb25maWcudXBkYXRlQ2hlY2spIGNhcmQuYXBwZW5kQ2hpbGQocmVsZWFzZU5vdGVzUm93KGNvbmZpZy51cGRhdGVDaGVjaykpO1xufVxuXG5mdW5jdGlvbiBhdXRvVXBkYXRlUm93KGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gXCJBdXRvbWF0aWNhbGx5IHJlZnJlc2ggQ29kZXgrK1wiO1xuICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGVzYy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XG4gIGRlc2MudGV4dENvbnRlbnQgPSBgSW5zdGFsbGVkIHZlcnNpb24gdiR7Y29uZmlnLnZlcnNpb259LiBUaGUgd2F0Y2hlciBjaGVja3MgaG91cmx5IGFuZCBjYW4gcmVmcmVzaCB0aGUgQ29kZXgrKyBydW50aW1lIGF1dG9tYXRpY2FsbHkuYDtcbiAgbGVmdC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIGxlZnQuYXBwZW5kQ2hpbGQoZGVzYyk7XG4gIHJvdy5hcHBlbmRDaGlsZChsZWZ0KTtcbiAgcm93LmFwcGVuZENoaWxkKFxuICAgIHN3aXRjaENvbnRyb2woY29uZmlnLmF1dG9VcGRhdGUsIGFzeW5jIChuZXh0KSA9PiB7XG4gICAgICBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnNldC1hdXRvLXVwZGF0ZVwiLCBuZXh0KTtcbiAgICB9KSxcbiAgKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2hhbm5lbFJvdyhjb25maWc6IENvZGV4UGx1c1BsdXNDb25maWcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGFjdGlvblJvdyhcIlJlbGVhc2UgY2hhbm5lbFwiLCB1cGRhdGVDaGFubmVsU3VtbWFyeShjb25maWcpKTtcbiAgY29uc3QgYWN0aW9uID0gcm93LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1yb3ctYWN0aW9uc11cIik7XG4gIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XG4gIHNlbGVjdC5jbGFzc05hbWUgPVxuICAgIFwiaC04IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdHJhbnNwYXJlbnQgcHgtMiB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZVwiO1xuICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtcbiAgICBbXCJzdGFibGVcIiwgXCJTdGFibGVcIl0sXG4gICAgW1wicHJlcmVsZWFzZVwiLCBcIlByZXJlbGVhc2VcIl0sXG4gICAgW1wiY3VzdG9tXCIsIFwiQ3VzdG9tXCJdLFxuICBdIGFzIGNvbnN0KSB7XG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICBvcHRpb24udmFsdWUgPSB2YWx1ZTtcbiAgICBvcHRpb24udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgICBvcHRpb24uc2VsZWN0ZWQgPSBjb25maWcudXBkYXRlQ2hhbm5lbCA9PT0gdmFsdWU7XG4gICAgc2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbik7XG4gIH1cbiAgc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAgIC5pbnZva2UoXCJjb2RleHBwOnNldC11cGRhdGUtY29uZmlnXCIsIHsgdXBkYXRlQ2hhbm5lbDogc2VsZWN0LnZhbHVlIH0pXG4gICAgICAudGhlbigoKSA9PiByZWZyZXNoQ29uZmlnQ2FyZChyb3cpKVxuICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwic2V0IHVwZGF0ZSBjaGFubmVsIGZhaWxlZFwiLCBTdHJpbmcoZSkpKTtcbiAgfSk7XG4gIGFjdGlvbj8uYXBwZW5kQ2hpbGQoc2VsZWN0KTtcbiAgaWYgKGNvbmZpZy51cGRhdGVDaGFubmVsID09PSBcImN1c3RvbVwiKSB7XG4gICAgYWN0aW9uPy5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJFZGl0XCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVwbyA9IHdpbmRvdy5wcm9tcHQoXCJHaXRIdWIgcmVwb1wiLCBjb25maWcudXBkYXRlUmVwbyB8fCBcImtwa2h4bGd5MC9jb2RleC1wbHVzcGx1c1wiKTtcbiAgICAgICAgaWYgKHJlcG8gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgY29uc3QgcmVmID0gd2luZG93LnByb21wdChcIkdpdCByZWZcIiwgY29uZmlnLnVwZGF0ZVJlZiB8fCBcIm1hc3RlclwiKTtcbiAgICAgICAgaWYgKHJlZiA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAgICAgLmludm9rZShcImNvZGV4cHA6c2V0LXVwZGF0ZS1jb25maWdcIiwge1xuICAgICAgICAgICAgdXBkYXRlQ2hhbm5lbDogXCJjdXN0b21cIixcbiAgICAgICAgICAgIHVwZGF0ZVJlcG86IHJlcG8sXG4gICAgICAgICAgICB1cGRhdGVSZWY6IHJlZixcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHJlZnJlc2hDb25maWdDYXJkKHJvdykpXG4gICAgICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwic2V0IGN1c3RvbSB1cGRhdGUgc291cmNlIGZhaWxlZFwiLCBTdHJpbmcoZSkpKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gaW5zdGFsbGF0aW9uU291cmNlUm93KHNvdXJjZTogSW5zdGFsbGF0aW9uU291cmNlKTogSFRNTEVsZW1lbnQge1xuICByZXR1cm4gcm93U2ltcGxlKFwiSW5zdGFsbGF0aW9uIHNvdXJjZVwiLCBgJHtzb3VyY2UubGFiZWx9OiAke3NvdXJjZS5kZXRhaWx9YCk7XG59XG5cbmZ1bmN0aW9uIHNlbGZVcGRhdGVTdGF0dXNSb3coc3RhdGU6IFNlbGZVcGRhdGVTdGF0ZSB8IG51bGwpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IHJvd1NpbXBsZShcIkxhc3QgQ29kZXgrKyB1cGRhdGVcIiwgc2VsZlVwZGF0ZVN1bW1hcnkoc3RhdGUpKTtcbiAgY29uc3QgbGVmdCA9IHJvdy5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChsZWZ0ICYmIHN0YXRlKSBsZWZ0LnByZXBlbmQoc3RhdHVzQmFkZ2Uoc2VsZlVwZGF0ZVN0YXR1c1RvbmUoc3RhdGUuc3RhdHVzKSwgc2VsZlVwZGF0ZVN0YXR1c0xhYmVsKHN0YXRlLnN0YXR1cykpKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gY2hlY2tGb3JVcGRhdGVzUm93KGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgY2hlY2sgPSBjb25maWcudXBkYXRlQ2hlY2s7XG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IGNoZWNrPy51cGRhdGVBdmFpbGFibGUgPyBcIkNvZGV4KysgdXBkYXRlIGF2YWlsYWJsZVwiIDogXCJDaGVjayBmb3IgQ29kZXgrKyB1cGRhdGVzXCI7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcbiAgZGVzYy50ZXh0Q29udGVudCA9IHVwZGF0ZVN1bW1hcnkoY2hlY2spO1xuICBsZWZ0LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgbGVmdC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgcm93LmFwcGVuZENoaWxkKGxlZnQpO1xuXG4gIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgaWYgKGNoZWNrPy5yZWxlYXNlVXJsKSB7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJSZWxlYXNlIE5vdGVzXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgY2hlY2sucmVsZWFzZVVybCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIkNoZWNrIE5vd1wiLCAoKSA9PiB7XG4gICAgICByb3cuc3R5bGUub3BhY2l0eSA9IFwiMC42NVwiO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpjaGVjay1jb2RleHBwLXVwZGF0ZVwiLCB0cnVlKVxuICAgICAgICAudGhlbigoY2hlY2spID0+IHtcbiAgICAgICAgICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjaGVjayBhcyBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2spO1xuICAgICAgICAgIHJlZnJlc2hDb25maWdDYXJkKHJvdyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZSkgPT4gcGxvZyhcIkNvZGV4KysgcmVsZWFzZSBjaGVjayBmYWlsZWRcIiwgU3RyaW5nKGUpKSlcbiAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCJcIjtcbiAgICAgICAgfSk7XG4gICAgfSksXG4gICk7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIkRvd25sb2FkIFVwZGF0ZVwiLCAoKSA9PiB7XG4gICAgICByb3cuc3R5bGUub3BhY2l0eSA9IFwiMC42NVwiO1xuICAgICAgY29uc3QgYnV0dG9ucyA9IGFjdGlvbnMucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvblwiKTtcbiAgICAgIGJ1dHRvbnMuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gdHJ1ZSkpO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpydW4tY29kZXhwcC11cGRhdGVcIilcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbih0cnVlKTtcbiAgICAgICAgICByZWZyZXNoQ29uZmlnQ2FyZChyb3cpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICBwbG9nKFwiQ29kZXgrKyBzZWxmLXVwZGF0ZSBmYWlsZWRcIiwgU3RyaW5nKGUpKTtcbiAgICAgICAgICB2b2lkIHJlZnJlc2hDb25maWdDYXJkKHJvdyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICByb3cuc3R5bGUub3BhY2l0eSA9IFwiXCI7XG4gICAgICAgICAgYnV0dG9ucy5mb3JFYWNoKChidXR0b24pID0+IChidXR0b24uZGlzYWJsZWQgPSBmYWxzZSkpO1xuICAgICAgICB9KTtcbiAgICB9KSxcbiAgKTtcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiByZWxlYXNlTm90ZXNSb3coY2hlY2s6IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMiBwLTNcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcInRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBcIkxhdGVzdCByZWxlYXNlIG5vdGVzXCI7XG4gIHJvdy5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBib2R5LmNsYXNzTmFtZSA9XG4gICAgXCJtYXgtaC02MCBvdmVyZmxvdy1hdXRvIHJvdW5kZWQtbWQgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tZm9yZWdyb3VuZC81IHAtMyB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgYm9keS5hcHBlbmRDaGlsZChyZW5kZXJSZWxlYXNlTm90ZXNNYXJrZG93bihjaGVjay5yZWxlYXNlTm90ZXM/LnRyaW0oKSB8fCBjaGVjay5lcnJvciB8fCBcIk5vIHJlbGVhc2Ugbm90ZXMgYXZhaWxhYmxlLlwiKSk7XG4gIHJvdy5hcHBlbmRDaGlsZChib2R5KTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gcmVuZGVyUmVsZWFzZU5vdGVzTWFya2Rvd24obWFya2Rvd246IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvb3QuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yXCI7XG4gIGNvbnN0IGxpbmVzID0gbWFya2Rvd24ucmVwbGFjZSgvXFxyXFxuPy9nLCBcIlxcblwiKS5zcGxpdChcIlxcblwiKTtcbiAgbGV0IHBhcmFncmFwaDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGxpc3Q6IEhUTUxPTGlzdEVsZW1lbnQgfCBIVE1MVUxpc3RFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIGxldCBjb2RlTGluZXM6IHN0cmluZ1tdIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3QgZmx1c2hQYXJhZ3JhcGggPSAoKSA9PiB7XG4gICAgaWYgKHBhcmFncmFwaC5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgcC5jbGFzc05hbWUgPSBcIm0tMCBsZWFkaW5nLTVcIjtcbiAgICBhcHBlbmRJbmxpbmVNYXJrZG93bihwLCBwYXJhZ3JhcGguam9pbihcIiBcIikudHJpbSgpKTtcbiAgICByb290LmFwcGVuZENoaWxkKHApO1xuICAgIHBhcmFncmFwaCA9IFtdO1xuICB9O1xuICBjb25zdCBmbHVzaExpc3QgPSAoKSA9PiB7XG4gICAgaWYgKCFsaXN0KSByZXR1cm47XG4gICAgcm9vdC5hcHBlbmRDaGlsZChsaXN0KTtcbiAgICBsaXN0ID0gbnVsbDtcbiAgfTtcbiAgY29uc3QgZmx1c2hDb2RlID0gKCkgPT4ge1xuICAgIGlmICghY29kZUxpbmVzKSByZXR1cm47XG4gICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICBwcmUuY2xhc3NOYW1lID1cbiAgICAgIFwibS0wIG92ZXJmbG93LWF1dG8gcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIHAtMiB0ZXh0LXhzIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gICAgY29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIpO1xuICAgIGNvZGUudGV4dENvbnRlbnQgPSBjb2RlTGluZXMuam9pbihcIlxcblwiKTtcbiAgICBwcmUuYXBwZW5kQ2hpbGQoY29kZSk7XG4gICAgcm9vdC5hcHBlbmRDaGlsZChwcmUpO1xuICAgIGNvZGVMaW5lcyA9IG51bGw7XG4gIH07XG5cbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgaWYgKGxpbmUudHJpbSgpLnN0YXJ0c1dpdGgoXCJgYGBcIikpIHtcbiAgICAgIGlmIChjb2RlTGluZXMpIGZsdXNoQ29kZSgpO1xuICAgICAgZWxzZSB7XG4gICAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICAgIGZsdXNoTGlzdCgpO1xuICAgICAgICBjb2RlTGluZXMgPSBbXTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoY29kZUxpbmVzKSB7XG4gICAgICBjb2RlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIHtcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICBmbHVzaExpc3QoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSAvXigjezEsM30pXFxzKyguKykkLy5leGVjKHRyaW1tZWQpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBmbHVzaFBhcmFncmFwaCgpO1xuICAgICAgZmx1c2hMaXN0KCk7XG4gICAgICBjb25zdCBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChoZWFkaW5nWzFdLmxlbmd0aCA9PT0gMSA/IFwiaDNcIiA6IFwiaDRcIik7XG4gICAgICBoLmNsYXNzTmFtZSA9IFwibS0wIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgICAgIGFwcGVuZElubGluZU1hcmtkb3duKGgsIGhlYWRpbmdbMl0pO1xuICAgICAgcm9vdC5hcHBlbmRDaGlsZChoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHVub3JkZXJlZCA9IC9eWy0qXVxccysoLispJC8uZXhlYyh0cmltbWVkKTtcbiAgICBjb25zdCBvcmRlcmVkID0gL15cXGQrWy4pXVxccysoLispJC8uZXhlYyh0cmltbWVkKTtcbiAgICBpZiAodW5vcmRlcmVkIHx8IG9yZGVyZWQpIHtcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICBjb25zdCB3YW50T3JkZXJlZCA9IEJvb2xlYW4ob3JkZXJlZCk7XG4gICAgICBpZiAoIWxpc3QgfHwgKHdhbnRPcmRlcmVkICYmIGxpc3QudGFnTmFtZSAhPT0gXCJPTFwiKSB8fCAoIXdhbnRPcmRlcmVkICYmIGxpc3QudGFnTmFtZSAhPT0gXCJVTFwiKSkge1xuICAgICAgICBmbHVzaExpc3QoKTtcbiAgICAgICAgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQod2FudE9yZGVyZWQgPyBcIm9sXCIgOiBcInVsXCIpO1xuICAgICAgICBsaXN0LmNsYXNzTmFtZSA9IHdhbnRPcmRlcmVkXG4gICAgICAgICAgPyBcIm0tMCBsaXN0LWRlY2ltYWwgc3BhY2UteS0xIHBsLTUgbGVhZGluZy01XCJcbiAgICAgICAgICA6IFwibS0wIGxpc3QtZGlzYyBzcGFjZS15LTEgcGwtNSBsZWFkaW5nLTVcIjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgYXBwZW5kSW5saW5lTWFya2Rvd24obGksICh1bm9yZGVyZWQgPz8gb3JkZXJlZCk/LlsxXSA/PyBcIlwiKTtcbiAgICAgIGxpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcXVvdGUgPSAvXj5cXHM/KC4rKSQvLmV4ZWModHJpbW1lZCk7XG4gICAgaWYgKHF1b3RlKSB7XG4gICAgICBmbHVzaFBhcmFncmFwaCgpO1xuICAgICAgZmx1c2hMaXN0KCk7XG4gICAgICBjb25zdCBibG9ja3F1b3RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJsb2NrcXVvdGVcIik7XG4gICAgICBibG9ja3F1b3RlLmNsYXNzTmFtZSA9IFwibS0wIGJvcmRlci1sLTIgYm9yZGVyLXRva2VuLWJvcmRlciBwbC0zIGxlYWRpbmctNVwiO1xuICAgICAgYXBwZW5kSW5saW5lTWFya2Rvd24oYmxvY2txdW90ZSwgcXVvdGVbMV0pO1xuICAgICAgcm9vdC5hcHBlbmRDaGlsZChibG9ja3F1b3RlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHBhcmFncmFwaC5wdXNoKHRyaW1tZWQpO1xuICB9XG5cbiAgZmx1c2hQYXJhZ3JhcGgoKTtcbiAgZmx1c2hMaXN0KCk7XG4gIGZsdXNoQ29kZSgpO1xuICByZXR1cm4gcm9vdDtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSW5saW5lTWFya2Rvd24ocGFyZW50OiBIVE1MRWxlbWVudCwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHBhdHRlcm4gPSAvKGAoW15gXSspYHxcXFsoW15cXF1dKylcXF1cXCgoaHR0cHM/OlxcL1xcL1teXFxzKV0rKVxcKXxcXCpcXCooW14qXSspXFwqXFwqfFxcKihbXipdKylcXCopL2c7XG4gIGxldCBsYXN0SW5kZXggPSAwO1xuICBmb3IgKGNvbnN0IG1hdGNoIG9mIHRleHQubWF0Y2hBbGwocGF0dGVybikpIHtcbiAgICBpZiAobWF0Y2guaW5kZXggPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgYXBwZW5kVGV4dChwYXJlbnQsIHRleHQuc2xpY2UobGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgIGlmIChtYXRjaFsyXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIik7XG4gICAgICBjb2RlLmNsYXNzTmFtZSA9XG4gICAgICAgIFwicm91bmRlZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIHB4LTEgcHktMC41IHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgICAgIGNvZGUudGV4dENvbnRlbnQgPSBtYXRjaFsyXTtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChjb2RlKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzNdICE9PSB1bmRlZmluZWQgJiYgbWF0Y2hbNF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgYS5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1wcmltYXJ5IHVuZGVybGluZSB1bmRlcmxpbmUtb2Zmc2V0LTJcIjtcbiAgICAgIGEuaHJlZiA9IG1hdGNoWzRdO1xuICAgICAgYS50YXJnZXQgPSBcIl9ibGFua1wiO1xuICAgICAgYS5yZWwgPSBcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIjtcbiAgICAgIGEudGV4dENvbnRlbnQgPSBtYXRjaFszXTtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChhKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHN0cm9uZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICBzdHJvbmcuY2xhc3NOYW1lID0gXCJmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICAgICAgc3Ryb25nLnRleHRDb250ZW50ID0gbWF0Y2hbNV07XG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoc3Ryb25nKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzZdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImVtXCIpO1xuICAgICAgZW0udGV4dENvbnRlbnQgPSBtYXRjaFs2XTtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbSk7XG4gICAgfVxuICAgIGxhc3RJbmRleCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICB9XG4gIGFwcGVuZFRleHQocGFyZW50LCB0ZXh0LnNsaWNlKGxhc3RJbmRleCkpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRUZXh0KHBhcmVudDogSFRNTEVsZW1lbnQsIHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICBpZiAodGV4dCkgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyV2F0Y2hlckhlYWx0aENhcmQoY2FyZDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgdm9pZCBpcGNSZW5kZXJlclxuICAgIC5pbnZva2UoXCJjb2RleHBwOmdldC13YXRjaGVyLWhlYWx0aFwiKVxuICAgIC50aGVuKChoZWFsdGgpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgcmVuZGVyV2F0Y2hlckhlYWx0aChjYXJkLCBoZWFsdGggYXMgV2F0Y2hlckhlYWx0aCk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDb3VsZCBub3QgY2hlY2sgd2F0Y2hlclwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyV2F0Y2hlckhlYWx0aChjYXJkOiBIVE1MRWxlbWVudCwgaGVhbHRoOiBXYXRjaGVySGVhbHRoKTogdm9pZCB7XG4gIGNhcmQuYXBwZW5kQ2hpbGQod2F0Y2hlclN1bW1hcnlSb3coaGVhbHRoKSk7XG4gIGZvciAoY29uc3QgY2hlY2sgb2YgaGVhbHRoLmNoZWNrcykge1xuICAgIGlmIChjaGVjay5zdGF0dXMgPT09IFwib2tcIikgY29udGludWU7XG4gICAgY2FyZC5hcHBlbmRDaGlsZCh3YXRjaGVyQ2hlY2tSb3coY2hlY2spKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3YXRjaGVyU3VtbWFyeVJvdyhoZWFsdGg6IFdhdGNoZXJIZWFsdGgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgaXRlbXMtc3RhcnQgZ2FwLTNcIjtcbiAgbGVmdC5hcHBlbmRDaGlsZChzdGF0dXNCYWRnZShoZWFsdGguc3RhdHVzLCBoZWFsdGgud2F0Y2hlcikpO1xuICBjb25zdCBzdGFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHN0YWNrLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBoZWFsdGgudGl0bGU7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcbiAgZGVzYy50ZXh0Q29udGVudCA9IGAke2hlYWx0aC5zdW1tYXJ5fSBDaGVja2VkICR7bmV3IERhdGUoaGVhbHRoLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX0uYDtcbiAgc3RhY2suYXBwZW5kQ2hpbGQodGl0bGUpO1xuICBzdGFjay5hcHBlbmRDaGlsZChkZXNjKTtcbiAgbGVmdC5hcHBlbmRDaGlsZChzdGFjayk7XG4gIHJvdy5hcHBlbmRDaGlsZChsZWZ0KTtcblxuICBjb25zdCBhY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhY3Rpb24uY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBhY3Rpb24uYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIkNoZWNrIE5vd1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBjYXJkID0gcm93LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAoIWNhcmQpIHJldHVybjtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDaGVja2luZyB3YXRjaGVyXCIsIFwiVmVyaWZ5aW5nIHRoZSB1cGRhdGVyIHJlcGFpciBzZXJ2aWNlLlwiKSk7XG4gICAgICByZW5kZXJXYXRjaGVySGVhbHRoQ2FyZChjYXJkKTtcbiAgICB9KSxcbiAgKTtcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbik7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHdhdGNoZXJDaGVja1JvdyhjaGVjazogV2F0Y2hlckhlYWx0aENoZWNrKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSByb3dTaW1wbGUoY2hlY2submFtZSwgY2hlY2suZGV0YWlsKTtcbiAgY29uc3QgbGVmdCA9IHJvdy5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChsZWZ0KSBsZWZ0LnByZXBlbmQoc3RhdHVzQmFkZ2UoY2hlY2suc3RhdHVzKSk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHN0YXR1c0JhZGdlKHN0YXR1czogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIGxhYmVsPzogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBjb25zdCB0b25lID1cbiAgICBzdGF0dXMgPT09IFwib2tcIlxuICAgICAgPyBcImJvcmRlci10b2tlbi1jaGFydHMtZ3JlZW4gdGV4dC10b2tlbi1jaGFydHMtZ3JlZW5cIlxuICAgICAgOiBzdGF0dXMgPT09IFwid2FyblwiXG4gICAgICAgID8gXCJib3JkZXItdG9rZW4tY2hhcnRzLXllbGxvdyB0ZXh0LXRva2VuLWNoYXJ0cy15ZWxsb3dcIlxuICAgICAgICA6IFwiYm9yZGVyLXRva2VuLWNoYXJ0cy1yZWQgdGV4dC10b2tlbi1jaGFydHMtcmVkXCI7XG4gIGJhZGdlLmNsYXNzTmFtZSA9IGBpbmxpbmUtZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgcm91bmRlZC1mdWxsIGJvcmRlciBweC0yIHB5LTAuNSB0ZXh0LXhzIGZvbnQtbWVkaXVtICR7dG9uZX1gO1xuICBiYWRnZS50ZXh0Q29udGVudCA9IGxhYmVsIHx8IChzdGF0dXMgPT09IFwib2tcIiA/IFwiT0tcIiA6IHN0YXR1cyA9PT0gXCJ3YXJuXCIgPyBcIlJldmlld1wiIDogXCJFcnJvclwiKTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTdW1tYXJ5KGNoZWNrOiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sgfCBudWxsKTogc3RyaW5nIHtcbiAgaWYgKCFjaGVjaykgcmV0dXJuIFwiTm8gdXBkYXRlIGNoZWNrIGhhcyBydW4geWV0LlwiO1xuICBjb25zdCBsYXRlc3QgPSBjaGVjay5sYXRlc3RWZXJzaW9uID8gYExhdGVzdCB2JHtjaGVjay5sYXRlc3RWZXJzaW9ufS4gYCA6IFwiXCI7XG4gIGNvbnN0IGNoZWNrZWQgPSBgQ2hlY2tlZCAke25ldyBEYXRlKGNoZWNrLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX0uYDtcbiAgaWYgKGNoZWNrLmVycm9yKSByZXR1cm4gYCR7bGF0ZXN0fSR7Y2hlY2tlZH0gJHtjaGVjay5lcnJvcn1gO1xuICByZXR1cm4gYCR7bGF0ZXN0fSR7Y2hlY2tlZH1gO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDaGFubmVsU3VtbWFyeShjb25maWc6IENvZGV4UGx1c1BsdXNDb25maWcpOiBzdHJpbmcge1xuICBpZiAoY29uZmlnLnVwZGF0ZUNoYW5uZWwgPT09IFwiY3VzdG9tXCIpIHtcbiAgICByZXR1cm4gYCR7Y29uZmlnLnVwZGF0ZVJlcG8gfHwgXCJrcGtoeGxneTAvY29kZXgtcGx1c3BsdXNcIn0gJHtjb25maWcudXBkYXRlUmVmIHx8IFwiKG5vIHJlZiBzZXQpXCJ9YDtcbiAgfVxuICBpZiAoY29uZmlnLnVwZGF0ZUNoYW5uZWwgPT09IFwicHJlcmVsZWFzZVwiKSB7XG4gICAgcmV0dXJuIFwiVXNlIHRoZSBuZXdlc3QgcHVibGlzaGVkIEdpdEh1YiByZWxlYXNlLCBpbmNsdWRpbmcgcHJlcmVsZWFzZXMuXCI7XG4gIH1cbiAgcmV0dXJuIFwiVXNlIHRoZSBsYXRlc3Qgc3RhYmxlIEdpdEh1YiByZWxlYXNlLlwiO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlU3VtbWFyeShzdGF0ZTogU2VsZlVwZGF0ZVN0YXRlIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghc3RhdGUpIHJldHVybiBcIk5vIGF1dG9tYXRpYyBDb2RleCsrIHVwZGF0ZSBoYXMgcnVuIHlldC5cIjtcbiAgY29uc3QgY2hlY2tlZCA9IG5ldyBEYXRlKHN0YXRlLmNvbXBsZXRlZEF0ID8/IHN0YXRlLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKTtcbiAgY29uc3QgdGFyZ2V0ID0gc3RhdGUubGF0ZXN0VmVyc2lvbiA/IGAgVGFyZ2V0IHYke3N0YXRlLmxhdGVzdFZlcnNpb259LmAgOiBzdGF0ZS50YXJnZXRSZWYgPyBgIFRhcmdldCAke3N0YXRlLnRhcmdldFJlZn0uYCA6IFwiXCI7XG4gIGNvbnN0IHNvdXJjZSA9IHN0YXRlLmluc3RhbGxhdGlvblNvdXJjZT8ubGFiZWwgPz8gXCJ1bmtub3duIHNvdXJjZVwiO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImZhaWxlZFwiKSByZXR1cm4gYEZhaWxlZCAke2NoZWNrZWR9LiR7dGFyZ2V0fSAke3N0YXRlLmVycm9yID8/IFwiVW5rbm93biBlcnJvclwifWA7XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwidXBkYXRlZFwiKSByZXR1cm4gYFVwZGF0ZWQgJHtjaGVja2VkfS4ke3RhcmdldH0gU291cmNlOiAke3NvdXJjZX0uYDtcbiAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gXCJ1cC10by1kYXRlXCIpIHJldHVybiBgVXAgdG8gZGF0ZSAke2NoZWNrZWR9LiR7dGFyZ2V0fSBTb3VyY2U6ICR7c291cmNlfS5gO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImRpc2FibGVkXCIpIHJldHVybiBgU2tpcHBlZCAke2NoZWNrZWR9OyBhdXRvbWF0aWMgcmVmcmVzaCBpcyBkaXNhYmxlZC5gO1xuICByZXR1cm4gYENoZWNraW5nIGZvciB1cGRhdGVzLiBTb3VyY2U6ICR7c291cmNlfS5gO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlU3RhdHVzVG9uZShzdGF0dXM6IFNlbGZVcGRhdGVTdGF0dXMpOiBcIm9rXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiB7XG4gIGlmIChzdGF0dXMgPT09IFwiZmFpbGVkXCIpIHJldHVybiBcImVycm9yXCI7XG4gIGlmIChzdGF0dXMgPT09IFwiZGlzYWJsZWRcIiB8fCBzdGF0dXMgPT09IFwiY2hlY2tpbmdcIikgcmV0dXJuIFwid2FyblwiO1xuICByZXR1cm4gXCJva1wiO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlU3RhdHVzTGFiZWwoc3RhdHVzOiBTZWxmVXBkYXRlU3RhdHVzKTogc3RyaW5nIHtcbiAgaWYgKHN0YXR1cyA9PT0gXCJ1cC10by1kYXRlXCIpIHJldHVybiBcIlVwIHRvIGRhdGVcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJ1cGRhdGVkXCIpIHJldHVybiBcIlVwZGF0ZWRcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJmYWlsZWRcIikgcmV0dXJuIFwiRmFpbGVkXCI7XG4gIGlmIChzdGF0dXMgPT09IFwiZGlzYWJsZWRcIikgcmV0dXJuIFwiRGlzYWJsZWRcIjtcbiAgcmV0dXJuIFwiQ2hlY2tpbmdcIjtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaENvbmZpZ0NhcmQocm93OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBjYXJkID0gcm93LmNsb3Nlc3QoXCJbZGF0YS1jb2RleHBwLWNvbmZpZy1jYXJkXVwiKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmICghY2FyZCkgcmV0dXJuO1xuICBjYXJkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJSZWZyZXNoaW5nXCIsIFwiTG9hZGluZyBjdXJyZW50IENvZGV4KysgdXBkYXRlIHN0YXR1cy5cIikpO1xuICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LWNvbmZpZ1wiKVxuICAgIC50aGVuKChjb25maWcpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgcmVuZGVyQ29kZXhQbHVzUGx1c0NvbmZpZyhjYXJkLCBjb25maWcgYXMgQ29kZXhQbHVzUGx1c0NvbmZpZyk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDb3VsZCBub3QgcmVmcmVzaCB1cGRhdGUgc2V0dGluZ3NcIiwgU3RyaW5nKGUpKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHVuaW5zdGFsbFJvdygpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGFjdGlvblJvdyhcbiAgICBcIlVuaW5zdGFsbCBDb2RleCsrXCIsXG4gICAgXCJDb3BpZXMgdGhlIHVuaW5zdGFsbCBjb21tYW5kLiBSdW4gaXQgZnJvbSBhIHRlcm1pbmFsIGFmdGVyIHF1aXR0aW5nIENvZGV4LlwiLFxuICApO1xuICBjb25zdCBhY3Rpb24gPSByb3cucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXJvdy1hY3Rpb25zXVwiKTtcbiAgYWN0aW9uPy5hcHBlbmRDaGlsZChcbiAgICBjb21wYWN0QnV0dG9uKFwiQ29weSBDb21tYW5kXCIsICgpID0+IHtcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAgICAgLmludm9rZShcImNvZGV4cHA6Y29weS10ZXh0XCIsIFwibm9kZSB+Ly5jb2RleC1wbHVzcGx1cy9zb3VyY2UvcGFja2FnZXMvaW5zdGFsbGVyL2Rpc3QvY2xpLmpzIHVuaW5zdGFsbFwiKVxuICAgICAgICAuY2F0Y2goKGUpID0+IHBsb2coXCJjb3B5IHVuaW5zdGFsbCBjb21tYW5kIGZhaWxlZFwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KSxcbiAgKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gcmVwb3J0QnVnUm93KCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gYWN0aW9uUm93KFxuICAgIFwiUmVwb3J0IGEgYnVnXCIsXG4gICAgXCJPcGVuIGEgR2l0SHViIGlzc3VlIHdpdGggcnVudGltZSwgaW5zdGFsbGVyLCBvciB0d2Vhay1tYW5hZ2VyIGRldGFpbHMuXCIsXG4gICk7XG4gIGNvbnN0IGFjdGlvbiA9IHJvdy5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtcm93LWFjdGlvbnNdXCIpO1xuICBhY3Rpb24/LmFwcGVuZENoaWxkKFxuICAgIGNvbXBhY3RCdXR0b24oXCJPcGVuIElzc3VlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHRpdGxlID0gZW5jb2RlVVJJQ29tcG9uZW50KFwiW0J1Z106IFwiKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgIFtcbiAgICAgICAgICBcIiMjIFdoYXQgaGFwcGVuZWQ/XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIFN0ZXBzIHRvIHJlcHJvZHVjZVwiLFxuICAgICAgICAgIFwiMS4gXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIEVudmlyb25tZW50XCIsXG4gICAgICAgICAgXCItIENvZGV4KysgdmVyc2lvbjogXCIsXG4gICAgICAgICAgXCItIENvZGV4IGFwcCB2ZXJzaW9uOiBcIixcbiAgICAgICAgICBcIi0gT1M6IFwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIyBMb2dzXCIsXG4gICAgICAgICAgXCJBdHRhY2ggcmVsZXZhbnQgbGluZXMgZnJvbSB0aGUgQ29kZXgrKyBsb2cgZGlyZWN0b3J5LlwiLFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICApO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsXG4gICAgICAgIGBodHRwczovL2dpdGh1Yi5jb20va3BraHhsZ3kwL2NvZGV4LXBsdXNwbHVzL2lzc3Vlcy9uZXc/dGl0bGU9JHt0aXRsZX0mYm9keT0ke2JvZHl9YCxcbiAgICAgICk7XG4gICAgfSksXG4gICk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIGFjdGlvblJvdyh0aXRsZVRleHQ6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gdGl0bGVUZXh0O1xuICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGVzYy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XG4gIGRlc2MudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcbiAgbGVmdC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIGxlZnQuYXBwZW5kQ2hpbGQoZGVzYyk7XG4gIHJvdy5hcHBlbmRDaGlsZChsZWZ0KTtcbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGFjdGlvbnMuZGF0YXNldC5jb2RleHBwUm93QWN0aW9ucyA9IFwidHJ1ZVwiO1xuICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiByZW5kZXJUd2Vha1N0b3JlUGFnZShcbiAgc2VjdGlvbnNXcmFwOiBIVE1MRWxlbWVudCxcbiAgaGVhZGVyQWN0aW9ucz86IEhUTUxFbGVtZW50LFxuKTogdm9pZCB7XG4gIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTRcIjtcblxuICBjb25zdCBzb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgc291cmNlLmhpZGRlbiA9IHRydWU7XG4gIHNvdXJjZS5kYXRhc2V0LmNvZGV4cHBTdG9yZVNvdXJjZSA9IFwidHJ1ZVwiO1xuICBzb3VyY2UudGV4dENvbnRlbnQgPSBcIkxvYWRpbmcgbGl2ZSByZWdpc3RyeVwiO1xuXG4gIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgY29uc3QgcmVmcmVzaEJ0biA9IHN0b3JlSWNvbkJ1dHRvbihyZWZyZXNoSWNvblN2ZygpLCBcIlJlZnJlc2ggdHdlYWsgc3RvcmVcIiwgKCkgPT4ge1xuICAgIHJlZnJlc2hCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHVwZGF0ZVN0b3JlVXBkYXRlQmFkZ2UobnVsbCk7XG4gICAgZ3JpZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkKTtcbiAgICByZWZyZXNoVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlLCByZWZyZXNoQnRuLCB0cnVlKTtcbiAgfSk7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQocmVmcmVzaEJ0bik7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3RvcmVUb29sYmFyQnV0dG9uKFwiUHVibGlzaCBUd2Vha1wiLCBvcGVuUHVibGlzaFR3ZWFrRGlhbG9nLCBcInByaW1hcnlcIikpO1xuICBpZiAoaGVhZGVyQWN0aW9ucykge1xuICAgIGhlYWRlckFjdGlvbnMucmVwbGFjZUNoaWxkcmVuKGFjdGlvbnMpO1xuICB9XG5cbiAgY29uc3QgZ3JpZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGdyaWQuZGF0YXNldC5jb2RleHBwU3RvcmVHcmlkID0gXCJ0cnVlXCI7XG4gIGdyaWQuY2xhc3NOYW1lID0gXCJncmlkIGdhcC00XCI7XG4gIGlmIChzdGF0ZS50d2Vha1N0b3JlKSB7XG4gICAgZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZSA9IEpTT04uc3RyaW5naWZ5KHN0YXRlLnR3ZWFrU3RvcmUpO1xuICAgIHJlbmRlclR3ZWFrU3RvcmVHcmlkKGdyaWQsIHNvdXJjZSk7XG4gIH0gZWxzZSB7XG4gICAgcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkKTtcbiAgfVxuICBzZWN0aW9uLmFwcGVuZENoaWxkKHNvdXJjZSk7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoZ3JpZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZChzZWN0aW9uKTtcbiAgcmVmcmVzaFR3ZWFrU3RvcmVHcmlkKGdyaWQsIHNvdXJjZSwgcmVmcmVzaEJ0bik7XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hUd2Vha1N0b3JlR3JpZChcbiAgZ3JpZDogSFRNTEVsZW1lbnQsXG4gIHNvdXJjZTogSFRNTEVsZW1lbnQsXG4gIHJlZnJlc2hCdG4/OiBIVE1MQnV0dG9uRWxlbWVudCxcbiAgZm9yY2UgPSBmYWxzZSxcbik6IHZvaWQge1xuICB2b2lkIGdldFR3ZWFrU3RvcmUoZm9yY2UpXG4gICAgLnRoZW4oKHN0b3JlKSA9PiB7XG4gICAgICBncmlkLmRhdGFzZXQuY29kZXhwcFN0b3JlID0gSlNPTi5zdHJpbmdpZnkoc3RvcmUpO1xuICAgICAgcmVuZGVyVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZSA9IFwiXCI7XG4gICAgICBncmlkLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtYnVzeVwiKTtcbiAgICAgIHNvdXJjZS50ZXh0Q29udGVudCA9IFwiTGl2ZSByZWdpc3RyeSB1bmF2YWlsYWJsZVwiO1xuICAgICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShudWxsKTtcbiAgICAgIGdyaWQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgZ3JpZC5hcHBlbmRDaGlsZChzdG9yZU1lc3NhZ2VDYXJkKFwiQ291bGQgbm90IGxvYWQgdHdlYWsgc3RvcmVcIiwgU3RyaW5nKGUpKSk7XG4gICAgfSlcbiAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICBpZiAocmVmcmVzaEJ0bikgcmVmcmVzaEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB3YXJtVHdlYWtTdG9yZSgpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLnR3ZWFrU3RvcmUgfHwgc3RhdGUudHdlYWtTdG9yZVByb21pc2UpIHJldHVybjtcbiAgdm9pZCBnZXRUd2Vha1N0b3JlKCkudGhlbigoc3RvcmUpID0+IHtcbiAgICB1cGRhdGVTdG9yZVVwZGF0ZUJhZGdlKG91dGRhdGVkSW5zdGFsbGVkU3RvcmVDb3VudChzdG9yZS5lbnRyaWVzKSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRUd2Vha1N0b3JlKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc+IHtcbiAgaWYgKCFmb3JjZSkge1xuICAgIGlmIChzdGF0ZS50d2Vha1N0b3JlKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHN0YXRlLnR3ZWFrU3RvcmUpO1xuICAgIGlmIChzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSkgcmV0dXJuIHN0YXRlLnR3ZWFrU3RvcmVQcm9taXNlO1xuICB9XG4gIHN0YXRlLnR3ZWFrU3RvcmVFcnJvciA9IG51bGw7XG4gIGNvbnN0IHByb21pc2UgPSBpcGNSZW5kZXJlclxuICAgIC5pbnZva2UoXCJjb2RleHBwOmdldC10d2Vhay1zdG9yZVwiKVxuICAgIC50aGVuKChzdG9yZSkgPT4ge1xuICAgICAgc3RhdGUudHdlYWtTdG9yZSA9IHN0b3JlIGFzIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc7XG4gICAgICByZXR1cm4gc3RhdGUudHdlYWtTdG9yZTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgc3RhdGUudHdlYWtTdG9yZUVycm9yID0gZTtcbiAgICAgIHRocm93IGU7XG4gICAgfSlcbiAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICBpZiAoc3RhdGUudHdlYWtTdG9yZVByb21pc2UgPT09IHByb21pc2UpIHN0YXRlLnR3ZWFrU3RvcmVQcm9taXNlID0gbnVsbDtcbiAgICB9KTtcbiAgc3RhdGUudHdlYWtTdG9yZVByb21pc2UgPSBwcm9taXNlO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVHdlYWtTdG9yZUdyaWQoZ3JpZDogSFRNTEVsZW1lbnQsIHNvdXJjZTogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3Qgc3RvcmUgPSBwYXJzZVN0b3JlRGF0YXNldChncmlkKTtcbiAgaWYgKCFzdG9yZSkgcmV0dXJuO1xuICBjb25zdCBlbnRyaWVzID0gc3RvcmUuZW50cmllcztcbiAgZ3JpZC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XG4gIHNvdXJjZS50ZXh0Q29udGVudCA9IGBSZWZyZXNoZWQgJHtuZXcgRGF0ZShzdG9yZS5mZXRjaGVkQXQpLnRvTG9jYWxlU3RyaW5nKCl9YDtcbiAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShvdXRkYXRlZEluc3RhbGxlZFN0b3JlQ291bnQoZW50cmllcykpO1xuICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgaWYgKHN0b3JlLmVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgZ3JpZC5hcHBlbmRDaGlsZChzdG9yZU1lc3NhZ2VDYXJkKFwiTm8gdHdlYWtzIHlldFwiLCBcIlVzZSBQdWJsaXNoIFR3ZWFrIHRvIHN1Ym1pdCB0aGUgZmlyc3Qgb25lLlwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykgZ3JpZC5hcHBlbmRDaGlsZCh0d2Vha1N0b3JlQ2FyZChlbnRyeSkpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN0b3JlRGF0YXNldChncmlkOiBIVE1MRWxlbWVudCk6IFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXcgfCBudWxsIHtcbiAgY29uc3QgcmF3ID0gZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZTtcbiAgaWYgKCFyYXcpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJhdykgYXMgVHdlYWtTdG9yZVJlZ2lzdHJ5VmlldztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHdlYWtTdG9yZUNhcmQoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeVZpZXcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHNoZWxsID0gdHdlYWtTdG9yZUNhcmRTaGVsbCgpO1xuICBjb25zdCB7IGNhcmQsIGxlZnQsIHN0YWNrLCB2ZXJzaW9ucywgYWN0aW9ucyB9ID0gc2hlbGw7XG5cbiAgbGVmdC5pbnNlcnRCZWZvcmUoc3RvcmVBdmF0YXIoZW50cnkpLCBzdGFjayk7XG5cbiAgY29uc3QgdGl0bGVSb3cgPSB0d2Vha1N0b3JlVGl0bGVSb3coKTtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1sZyBmb250LXNlbWlib2xkIGxlYWRpbmctNyB0ZXh0LXRva2VuLWZvcmVncm91bmRcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBlbnRyeS5tYW5pZmVzdC5uYW1lO1xuICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHZlcmlmaWVkU2FmZUJhZGdlKCkpO1xuICBzdGFjay5hcHBlbmRDaGlsZCh0aXRsZVJvdyk7XG5cbiAgaWYgKGVudHJ5Lm1hbmlmZXN0LmRlc2NyaXB0aW9uKSB7XG4gICAgY29uc3QgZGVzYyA9IHR3ZWFrU3RvcmVEZXNjcmlwdGlvbigpO1xuICAgIGRlc2MudGV4dENvbnRlbnQgPSBlbnRyeS5tYW5pZmVzdC5kZXNjcmlwdGlvbjtcbiAgICBzdGFjay5hcHBlbmRDaGlsZChkZXNjKTtcbiAgfVxuXG4gIHN0YWNrLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVSZWFkTW9yZUJ1dHRvbihlbnRyeS5yZXBvKSk7XG4gIHZlcnNpb25zLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVWZXJzaW9uQmFkZ2UoZW50cnkpKTtcblxuICBpZiAoZW50cnkucmVsZWFzZVVybCkge1xuICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICBjb21wYWN0QnV0dG9uKFwiUmVsZWFzZVwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIGVudHJ5LnJlbGVhc2VVcmwpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuICBjb25zdCBoYXNVcGRhdGUgPSAhIWVudHJ5Lmluc3RhbGxlZCAmJiBlbnRyeS5pbnN0YWxsZWQudmVyc2lvbiAhPT0gZW50cnkubWFuaWZlc3QudmVyc2lvbjtcbiAgaWYgKGVudHJ5Lmluc3RhbGxlZCAmJiAhaGFzVXBkYXRlKSB7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c1BpbGwoXCJJbnN0YWxsZWRcIikpO1xuICB9IGVsc2UgaWYgKGVudHJ5LnBsYXRmb3JtICYmICFlbnRyeS5wbGF0Zm9ybS5jb21wYXRpYmxlKSB7XG4gICAgY2FyZC5jbGFzc0xpc3QuYWRkKFwib3BhY2l0eS03MFwiKTtcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKHN0b3JlU3RhdHVzUGlsbChwbGF0Zm9ybUxvY2tlZExhYmVsKGVudHJ5LnBsYXRmb3JtKSkpO1xuICB9IGVsc2UgaWYgKGVudHJ5LnJ1bnRpbWUgJiYgIWVudHJ5LnJ1bnRpbWUuY29tcGF0aWJsZSkge1xuICAgIGNhcmQuY2xhc3NMaXN0LmFkZChcIm9wYWNpdHktNzBcIik7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c1BpbGwocnVudGltZUxvY2tlZExhYmVsKGVudHJ5LnJ1bnRpbWUpKSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaW5zdGFsbExhYmVsID0gZW50cnkuaW5zdGFsbGVkID8gXCJVcGRhdGVcIiA6IFwiSW5zdGFsbFwiO1xuICAgIGlmIChoYXNVcGRhdGUpIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3RvcmVTdGF0dXNQaWxsKFwiVXBkYXRlIGF2YWlsYWJsZVwiLCBcImluZm9cIikpO1xuICAgIGNvbnN0IGluc3RhbGxCdXR0b24gPSBzdG9yZUluc3RhbGxCdXR0b24oaW5zdGFsbExhYmVsLCAoYnV0dG9uKSA9PiB7XG4gICAgICBjb25zdCBncmlkID0gY2FyZC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zdG9yZS1ncmlkXVwiKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICBjb25zdCBzb3VyY2UgPSBncmlkPy5wYXJlbnRFbGVtZW50Py5xdWVyeVNlbGVjdG9yKFwiW2RhdGEtY29kZXhwcC1zdG9yZS1zb3VyY2VdXCIpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgIHNob3dTdG9yZUJ1dHRvbkxvYWRpbmcoYnV0dG9uLCBlbnRyeS5pbnN0YWxsZWQgPyBcIlVwZGF0aW5nXCIgOiBcIkluc3RhbGxpbmdcIik7XG4gICAgICBhY3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIikuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gdHJ1ZSkpO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDppbnN0YWxsLXN0b3JlLXR3ZWFrXCIsIGVudHJ5LmlkKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgc2hvd1N0b3JlVG9hc3QoYCR7ZW50cnkubWFuaWZlc3QubmFtZX0gaW5zdGFsbGVkLmApO1xuICAgICAgICAgIHNob3dTdG9yZUJ1dHRvbkluc3RhbGxlZChidXR0b24pO1xuICAgICAgICAgIHZlcnNpb25zLnJlcGxhY2VDaGlsZHJlbih0d2Vha1N0b3JlVmVyc2lvbkJhZGdlKGVudHJ5LCBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uKSk7XG4gICAgICAgICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShNYXRoLm1heCgwLCBjdXJyZW50U3RvcmVVcGRhdGVCYWRnZUNvdW50KCkgLSAxKSk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBhY3Rpb25zLnJlcGxhY2VDaGlsZHJlbihzdG9yZVN0YXR1c1BpbGwoXCJJbnN0YWxsZWRcIikpO1xuICAgICAgICAgICAgaWYgKGdyaWQgJiYgc291cmNlKSByZWZyZXNoVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIH0sIDkwMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIHJlc2V0U3RvcmVJbnN0YWxsQnV0dG9uKGJ1dHRvbiwgaW5zdGFsbExhYmVsKTtcbiAgICAgICAgICBhY3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIikuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gZmFsc2UpKTtcbiAgICAgICAgICBzaG93U3RvcmVDYXJkTWVzc2FnZShjYXJkLCBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UgPz8gZSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKGluc3RhbGxCdXR0b24pO1xuICB9XG4gIHJldHVybiBjYXJkO1xufVxuXG5mdW5jdGlvbiBwbGF0Zm9ybUxvY2tlZExhYmVsKHBsYXRmb3JtOiBOb25OdWxsYWJsZTxUd2Vha1N0b3JlRW50cnlWaWV3W1wicGxhdGZvcm1cIl0+KTogc3RyaW5nIHtcbiAgY29uc3Qgc3VwcG9ydGVkID0gcGxhdGZvcm0uc3VwcG9ydGVkID8/IFtdO1xuICBpZiAoc3VwcG9ydGVkLmluY2x1ZGVzKFwid2luMzJcIikpIHJldHVybiBcIldpbmRvd3Mgb25seVwiO1xuICBpZiAoc3VwcG9ydGVkLmluY2x1ZGVzKFwiZGFyd2luXCIpKSByZXR1cm4gXCJtYWNPUyBvbmx5XCI7XG4gIGlmIChzdXBwb3J0ZWQuaW5jbHVkZXMoXCJsaW51eFwiKSkgcmV0dXJuIFwiTGludXggb25seVwiO1xuICByZXR1cm4gXCJVbmF2YWlsYWJsZVwiO1xufVxuXG5mdW5jdGlvbiBydW50aW1lTG9ja2VkTGFiZWwocnVudGltZTogTm9uTnVsbGFibGU8VHdlYWtTdG9yZUVudHJ5Vmlld1tcInJ1bnRpbWVcIl0+KTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bnRpbWUucmVxdWlyZWQgPyBgUmVxdWlyZXMgQ29kZXgrKyAke3J1bnRpbWUucmVxdWlyZWR9YCA6IFwiUmVxdWlyZXMgbmV3ZXIgQ29kZXgrK1wiO1xufVxuXG5mdW5jdGlvbiBzaG93U3RvcmVDYXJkTWVzc2FnZShjYXJkOiBIVE1MRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGNhcmQucXVlcnlTZWxlY3RvcihcIltkYXRhLWNvZGV4cHAtc3RvcmUtY2FyZC1tZXNzYWdlXVwiKT8ucmVtb3ZlKCk7XG4gIGNvbnN0IG5vdGljZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG5vdGljZS5kYXRhc2V0LmNvZGV4cHBTdG9yZUNhcmRNZXNzYWdlID0gXCJ0cnVlXCI7XG4gIG5vdGljZS5jbGFzc05hbWUgPVxuICAgIFwicm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlci81MCBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcHgtMyBweS0yIHRleHQtc20gbGVhZGluZy01IHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZFwiO1xuICBub3RpY2UudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuICBjb25zdCBhY3Rpb25zID0gY2FyZC5sYXN0RWxlbWVudENoaWxkO1xuICBpZiAoYWN0aW9ucykgY2FyZC5pbnNlcnRCZWZvcmUobm90aWNlLCBhY3Rpb25zKTtcbiAgZWxzZSBjYXJkLmFwcGVuZENoaWxkKG5vdGljZSk7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3RvcmVDYXJkU2hlbGwoKToge1xuICBjYXJkOiBIVE1MRWxlbWVudDtcbiAgbGVmdDogSFRNTEVsZW1lbnQ7XG4gIHN0YWNrOiBIVE1MRWxlbWVudDtcbiAgdmVyc2lvbnM6IEhUTUxFbGVtZW50O1xuICBhY3Rpb25zOiBIVE1MRWxlbWVudDtcbn0ge1xuICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY2FyZC5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlci80MCBmbGV4IG1pbi1oLVsxOTBweF0gZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIGdhcC00IHJvdW5kZWQtMnhsIGJvcmRlciBwLTQgdHJhbnNpdGlvbi1jb2xvcnMgaG92ZXI6YmctdG9rZW4tZm9yZWdyb3VuZC81XCI7XG5cbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGl0ZW1zLXN0YXJ0IGdhcC0zXCI7XG4gIGNvbnN0IHN0YWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc3RhY2suY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGZsZXgtY29sIGdhcC0yXCI7XG4gIGxlZnQuYXBwZW5kQ2hpbGQoc3RhY2spO1xuICBjYXJkLmFwcGVuZENoaWxkKGxlZnQpO1xuXG4gIGNvbnN0IGZvb3RlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGZvb3Rlci5jbGFzc05hbWUgPSBcIm10LWF1dG8gZmxleCBtaW4tdy0wIGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yXCI7XG4gIGNvbnN0IHZlcnNpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdmVyc2lvbnMuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBmb290ZXIuYXBwZW5kQ2hpbGQodmVyc2lvbnMpO1xuICBjb25zdCBhY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYWN0aW9ucy5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktZW5kIGdhcC0yXCI7XG4gIGZvb3Rlci5hcHBlbmRDaGlsZChhY3Rpb25zKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChmb290ZXIpO1xuXG4gIHJldHVybiB7IGNhcmQsIGxlZnQsIHN0YWNrLCB2ZXJzaW9ucywgYWN0aW9ucyB9O1xufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlVGl0bGVSb3coKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCB0aXRsZVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlUm93LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGl0ZW1zLXN0YXJ0IGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiO1xuICByZXR1cm4gdGl0bGVSb3c7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3RvcmVEZXNjcmlwdGlvbigpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwibGluZS1jbGFtcC0zIG1pbi13LTAgdGV4dC1zbSBsZWFkaW5nLTUgdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICByZXR1cm4gZGVzYztcbn1cblxuZnVuY3Rpb24gdHdlYWtTdG9yZVJlYWRNb3JlQnV0dG9uKHJlcG86IHN0cmluZyk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgcmVhZE1vcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICByZWFkTW9yZS50eXBlID0gXCJidXR0b25cIjtcbiAgcmVhZE1vcmUuY2xhc3NOYW1lID1cbiAgICBcImlubGluZS1mbGV4IHctZml0IGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1saW5rLWZvcmVncm91bmQgaG92ZXI6dW5kZXJsaW5lXCI7XG4gIHJlYWRNb3JlLnRleHRDb250ZW50ID0gXCJSZWFkIE1vcmVcIjtcbiAgYXBwZW5kU3ZnSHRtbChcbiAgICByZWFkTW9yZSxcbiAgICBgPHN2ZyB3aWR0aD1cIjE0XCIgaGVpZ2h0PVwiMTRcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cIm5vbmVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk02IDMuNWg2LjVWMTBNMTIuMjUgMy43NSA0IDEyXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS40NVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YCxcbiAgKTtcbiAgcmVhZE1vcmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgYGh0dHBzOi8vZ2l0aHViLmNvbS8ke3JlcG99YCk7XG4gIH0pO1xuICByZXR1cm4gcmVhZE1vcmU7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclR3ZWFrU3RvcmVHaG9zdEdyaWQoZ3JpZDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZ3JpZC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIiwgXCJ0cnVlXCIpO1xuICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgZ3JpZC5hcHBlbmRDaGlsZCh0d2Vha1N0b3JlR2hvc3RDYXJkKCkpO1xufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlR2hvc3RDYXJkKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgeyBjYXJkLCBsZWZ0LCBzdGFjaywgdmVyc2lvbnMsIGFjdGlvbnMgfSA9IHR3ZWFrU3RvcmVDYXJkU2hlbGwoKTtcbiAgY2FyZC5jbGFzc0xpc3QuYWRkKFwicG9pbnRlci1ldmVudHMtbm9uZVwiKTtcbiAgY2FyZC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG5cbiAgbGVmdC5pbnNlcnRCZWZvcmUoc3RvcmVBdmF0YXJHaG9zdCgpLCBzdGFjayk7XG5cbiAgY29uc3QgdGl0bGVSb3cgPSB0d2Vha1N0b3JlVGl0bGVSb3coKTtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1sZyBmb250LXNlbWlib2xkIGxlYWRpbmctNyB0ZXh0LXRva2VuLWZvcmVncm91bmRcIjtcbiAgdGl0bGUuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcIm15LTEgaC01IHctNDQgcm91bmRlZC1tZFwiKSk7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodmVyaWZpZWRTYWZlR2hvc3RCYWRnZSgpKTtcbiAgc3RhY2suYXBwZW5kQ2hpbGQodGl0bGVSb3cpO1xuXG4gIGNvbnN0IGRlc2MgPSB0d2Vha1N0b3JlRGVzY3JpcHRpb24oKTtcbiAgZGVzYy5hcHBlbmRDaGlsZChnaG9zdEJsb2NrKFwibXQtMSBoLTMgdy1mdWxsIHJvdW5kZWRcIikpO1xuICBkZXNjLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJtdC0yIGgtMyB3LTExLzEyIHJvdW5kZWRcIikpO1xuICBkZXNjLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJtdC0yIGgtMyB3LTcvMTIgcm91bmRlZFwiKSk7XG4gIHN0YWNrLmFwcGVuZENoaWxkKGRlc2MpO1xuXG4gIGNvbnN0IHJlYWRNb3JlID0gdHdlYWtTdG9yZVJlYWRNb3JlQnV0dG9uKFwiXCIpO1xuICByZWFkTW9yZS5yZXBsYWNlQ2hpbGRyZW4oZ2hvc3RCbG9jayhcImgtNSB3LTI0IHJvdW5kZWRcIikpO1xuICBzdGFjay5hcHBlbmRDaGlsZChyZWFkTW9yZSk7XG5cbiAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQoc3RvcmVWZXJzaW9uR2hvc3RCYWRnZSgpKTtcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c0dob3N0UGlsbCgpKTtcbiAgcmV0dXJuIGNhcmQ7XG59XG5cbmZ1bmN0aW9uIHN0b3JlQXZhdGFyR2hvc3QoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBhdmF0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhdmF0YXIuY2xhc3NOYW1lID1cbiAgICBcImZsZXggaC0xMCB3LTEwIHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlci1kZWZhdWx0IGJnLXRyYW5zcGFyZW50IHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZFwiO1xuICBhdmF0YXIuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcImgtZnVsbCB3LWZ1bGxcIikpO1xuICByZXR1cm4gYXZhdGFyO1xufVxuXG5mdW5jdGlvbiB2ZXJpZmllZFNhZmVHaG9zdEJhZGdlKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFkZ2UgPSB2ZXJpZmllZFNhZmVCYWRnZSgpO1xuICBiYWRnZS5yZXBsYWNlQ2hpbGRyZW4oZ2hvc3RCbG9jayhcImgtWzEzcHhdIHctWzEzcHhdIHJvdW5kZWQtc21cIiksIGdob3N0QmxvY2soXCJoLTMgdy0yMCByb3VuZGVkXCIpKTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiBzdG9yZVN0YXR1c0dob3N0UGlsbCgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHBpbGwgPSBzdG9yZVN0YXR1c1BpbGwoXCJJbnN0YWxsZWRcIik7XG4gIHBpbGwuY2xhc3NMaXN0LmFkZChcImFuaW1hdGUtcHVsc2VcIik7XG4gIHBpbGwuc3R5bGUuY29sb3IgPSBcInRyYW5zcGFyZW50XCI7XG4gIHJldHVybiBwaWxsO1xufVxuXG5mdW5jdGlvbiBzdG9yZVZlcnNpb25HaG9zdEJhZGdlKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFkZ2UgPSBzdG9yZVZlcnNpb25CYWRnZVNoZWxsKGZhbHNlKTtcbiAgYmFkZ2UuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcImgtMyB3LTM2IHJvdW5kZWRcIikpO1xuICByZXR1cm4gYmFkZ2U7XG59XG5cbmZ1bmN0aW9uIGdob3N0QmxvY2soY2xhc3NOYW1lOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGJsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYmxvY2suY2xhc3NOYW1lID0gYGFuaW1hdGUtcHVsc2UgYmctdG9rZW4tZm9yZWdyb3VuZC8xMCAke2NsYXNzTmFtZX1gO1xuICBibG9jay5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gIHJldHVybiBibG9jaztcbn1cblxuZnVuY3Rpb24gc3RvcmVBdmF0YXIoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeVZpZXcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGF2YXRhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGF2YXRhci5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBoLTEwIHctMTAgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLWRlZmF1bHQgYmctdHJhbnNwYXJlbnQgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XG4gIGNvbnN0IGluaXRpYWwgPSAoZW50cnkubWFuaWZlc3QubmFtZT8uWzBdID8/IFwiP1wiKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBmYWxsYmFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBmYWxsYmFjay50ZXh0Q29udGVudCA9IGluaXRpYWw7XG4gIGF2YXRhci5hcHBlbmRDaGlsZChmYWxsYmFjayk7XG4gIGNvbnN0IGljb25VcmwgPSBzdG9yZUVudHJ5SWNvblVybChlbnRyeSk7XG4gIGlmIChpY29uVXJsKSB7XG4gICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICBpbWcuYWx0ID0gXCJcIjtcbiAgICBpbWcuY2xhc3NOYW1lID0gXCJoLWZ1bGwgdy1mdWxsIG9iamVjdC1jb3ZlclwiO1xuICAgIGltZy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcbiAgICAgIGZhbGxiYWNrLnJlbW92ZSgpO1xuICAgICAgaW1nLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgIH0pO1xuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKCkgPT4ge1xuICAgICAgaW1nLnJlbW92ZSgpO1xuICAgIH0pO1xuICAgIGltZy5zcmMgPSBpY29uVXJsO1xuICAgIGF2YXRhci5hcHBlbmRDaGlsZChpbWcpO1xuICB9XG4gIHJldHVybiBhdmF0YXI7XG59XG5cbmZ1bmN0aW9uIHN0b3JlRW50cnlJY29uVXJsKGVudHJ5OiBUd2Vha1N0b3JlRW50cnlWaWV3KTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGljb25VcmwgPSBlbnRyeS5tYW5pZmVzdC5pY29uVXJsPy50cmltKCk7XG4gIGlmICghaWNvblVybCkgcmV0dXJuIG51bGw7XG4gIGlmICgvXihodHRwcz86fGRhdGE6KS9pLnRlc3QoaWNvblVybCkpIHJldHVybiBpY29uVXJsO1xuICBjb25zdCByZWwgPSBpY29uVXJsLnJlcGxhY2UoL15cXC4/XFwvLywgXCJcIik7XG4gIGlmICghcmVsIHx8IHJlbC5zdGFydHNXaXRoKFwiLi4vXCIpKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vJHtlbnRyeS5yZXBvfS8ke2VudHJ5LmFwcHJvdmVkQ29tbWl0U2hhfS8ke3JlbH1gO1xufVxuXG5mdW5jdGlvbiBzaWRlYmFyVXBkYXRlUGlsbEJ1dHRvbigpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmRhdGFzZXQuY29kZXhwcFNpZGViYXJVcGRhdGUgPSBcInRydWVcIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgXCJ1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB3aGl0ZXNwYWNlLW5vd3JhcFwiO1xuICBPYmplY3QuYXNzaWduKGJ0bi5zdHlsZSwge1xuICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjk5OTlweFwiLFxuICAgIGJvcmRlcjogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogXCIjMEE4NEZGXCIsXG4gICAgY29sb3I6IFwiI0ZGRkZGRlwiLFxuICAgIHBhZGRpbmc6IFwiMCA4cHhcIixcbiAgICBmb250U2l6ZTogXCIxMHB4XCIsXG4gICAgZm9udFdlaWdodDogXCI3MDBcIixcbiAgICBsaW5lSGVpZ2h0OiBcIjIwcHhcIixcbiAgICBsZXR0ZXJTcGFjaW5nOiBcIjBcIixcbiAgICB0ZXh0VHJhbnNmb3JtOiBcIm5vbmVcIixcbiAgICBib3hTaGFkb3c6IFwiMCAxcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4xOClcIixcbiAgfSk7XG4gIGJ0bi50ZXh0Q29udGVudCA9IFwiVXBkYXRlXCI7XG4gIGJ0bi50aXRsZSA9IFwiT3BlbiBDb2RleCsrIHVwZGF0ZVwiO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgKCkgPT4ge1xuICAgIGJ0bi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjMDA3MUUzXCI7XG4gIH0pO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgKCkgPT4ge1xuICAgIGJ0bi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjMEE4NEZGXCI7XG4gIH0pO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgYnRuLmRhdGFzZXQuY29kZXhwcFJlbGVhc2VVcmwgfHwgQ09ERVhfUExVU1BMVVNfUkVMRUFTRVNfVVJMKTtcbiAgfSk7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihmb3JjZSA9IGZhbHNlKTogdm9pZCB7XG4gIGNvbnN0IGJ0biA9IHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b247XG4gIGlmICghYnRuKSByZXR1cm47XG4gIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAuaW52b2tlKFwiY29kZXhwcDpjaGVjay1jb2RleHBwLXVwZGF0ZVwiLCBmb3JjZSlcbiAgICAudGhlbigoY2hlY2spID0+IHNldFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKGNoZWNrIGFzIENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjaykpXG4gICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICBwbG9nKFwiQ29kZXgrKyBzaWRlYmFyIHJlbGVhc2UgY2hlY2sgZmFpbGVkXCIsIFN0cmluZyhlKSk7XG4gICAgICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihudWxsKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0U2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oY2hlY2s6IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgYnRuID0gc3RhdGUuY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbjtcbiAgaWYgKCFidG4pIHJldHVybjtcbiAgY29uc3QgdXBkYXRlQXZhaWxhYmxlID0gY2hlY2s/LnVwZGF0ZUF2YWlsYWJsZSA9PT0gdHJ1ZTtcbiAgYnRuLnN0eWxlLmRpc3BsYXkgPSB1cGRhdGVBdmFpbGFibGUgPyBcImlubGluZS1mbGV4XCIgOiBcIm5vbmVcIjtcbiAgYnRuLmhpZGRlbiA9ICF1cGRhdGVBdmFpbGFibGU7XG4gIGJ0bi5kYXRhc2V0LmNvZGV4cHBSZWxlYXNlVXJsID0gY2hlY2s/LnJlbGVhc2VVcmwgfHwgQ09ERVhfUExVU1BMVVNfUkVMRUFTRVNfVVJMO1xuICBidG4udGl0bGUgPVxuICAgIHVwZGF0ZUF2YWlsYWJsZSAmJiBjaGVjaz8ubGF0ZXN0VmVyc2lvblxuICAgICAgPyBgT3BlbiBDb2RleCsrICR7Y2hlY2subGF0ZXN0VmVyc2lvbn0gdXBkYXRlYFxuICAgICAgOiBcIk9wZW4gQ29kZXgrKyB1cGRhdGVcIjtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShjb3VudDogbnVtYmVyIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1zdG9yZS11cGRhdGUtYmFkZ2VdXCIpO1xuICBpZiAoIWJhZGdlKSByZXR1cm47XG4gIGJhZGdlLmRhdGFzZXQuY29kZXhwcFN0b3JlVXBkYXRlQ291bnQgPSBjb3VudCA9PT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcoY291bnQpO1xuICBhcHBseVN0b3JlVXBkYXRlQmFkZ2VTdHlsZShiYWRnZSwgY291bnQpO1xuICBiYWRnZS5oaWRkZW4gPSBjb3VudCA9PT0gbnVsbCB8fCBjb3VudCA8PSAwO1xuICBiYWRnZS50ZXh0Q29udGVudCA9IGNvdW50ICYmIGNvdW50ID4gMCA/IFN0cmluZyhjb3VudCkgOiBcIlwiO1xuICBiYWRnZS50aXRsZSA9XG4gICAgY291bnQgJiYgY291bnQgPiAwXG4gICAgICA/IGAke2NvdW50fSBpbnN0YWxsZWQgdHdlYWske2NvdW50ID09PSAxID8gXCJcIiA6IFwic1wifSBjYW4gYmUgdXBkYXRlZGBcbiAgICAgIDogXCJJbnN0YWxsZWQgdHdlYWtzIGFyZSB1cCB0byBkYXRlXCI7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3RvcmVVcGRhdGVCYWRnZVN0eWxlKGJhZGdlOiBIVE1MRWxlbWVudCwgY291bnQ6IG51bWJlciB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaGFzVXBkYXRlcyA9ICEhY291bnQgJiYgY291bnQgPiAwO1xuICBPYmplY3QuYXNzaWduKGJhZGdlLnN0eWxlLCB7XG4gICAgbWluV2lkdGg6IFwiMjRweFwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjk5OTlweFwiLFxuICAgIGJvcmRlcjogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogaGFzVXBkYXRlcyA/IFwiIzBBODRGRlwiIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGNvbG9yOiBcIiNGRkZGRkZcIixcbiAgICBwYWRkaW5nOiBcIjAgN3B4XCIsXG4gICAgZm9udFNpemU6IFwiMTJweFwiLFxuICAgIGZvbnRXZWlnaHQ6IFwiNzAwXCIsXG4gICAgbGluZUhlaWdodDogXCIyMHB4XCIsXG4gICAgbGV0dGVyU3BhY2luZzogXCIwXCIsXG4gICAgYm94U2hhZG93OiBoYXNVcGRhdGVzID8gXCIwIDFweCAycHggcmdiYSgwLCAwLCAwLCAwLjIyKVwiIDogXCJub25lXCIsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjdXJyZW50U3RvcmVVcGRhdGVCYWRnZUNvdW50KCk6IG51bWJlciB7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXN0b3JlLXVwZGF0ZS1iYWRnZV1cIik7XG4gIGNvbnN0IHJhdyA9IGJhZGdlPy5kYXRhc2V0LmNvZGV4cHBTdG9yZVVwZGF0ZUNvdW50O1xuICBjb25zdCBwYXJzZWQgPSByYXcgPyBOdW1iZXIocmF3KSA6IDA7XG4gIHJldHVybiBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XG59XG5cbmZ1bmN0aW9uIG91dGRhdGVkSW5zdGFsbGVkU3RvcmVDb3VudChlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlWaWV3W10pOiBudW1iZXIge1xuICByZXR1cm4gZW50cmllcy5maWx0ZXIoKGVudHJ5KSA9PiAhIWVudHJ5Lmluc3RhbGxlZCAmJiBlbnRyeS5pbnN0YWxsZWQudmVyc2lvbiAhPT0gZW50cnkubWFuaWZlc3QudmVyc2lvbikubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBzdG9yZVRvb2xiYXJCdXR0b24oXG4gIGxhYmVsOiBzdHJpbmcsXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gIHZhcmlhbnQ6IFwicHJpbWFyeVwiIHwgXCJzZWNvbmRhcnlcIiA9IFwic2Vjb25kYXJ5XCIsXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgdmFyaWFudCA9PT0gXCJwcmltYXJ5XCJcbiAgICAgID8gXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBoLTggaXRlbXMtY2VudGVyIGdhcC0xIHdoaXRlc3BhY2Utbm93cmFwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tYmctZm9nIHB4LTIgcHktMCB0ZXh0LXNtIHRleHQtdG9rZW4tYnV0dG9uLXRlcnRpYXJ5LWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNDBcIlxuICAgICAgOiBcImJvcmRlci10b2tlbi1ib3JkZXIgdXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBmbGV4IGgtOCBpdGVtcy1jZW50ZXIgZ2FwLTEgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50IGJnLXRva2VuLWZvcmVncm91bmQvNSBweC0yIHB5LTAgdGV4dC1zbSB0ZXh0LXRva2VuLWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI7XG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljaygpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gc3RvcmVJY29uQnV0dG9uKFxuICBpY29uU3ZnOiBzdHJpbmcsXG4gIGxhYmVsOiBzdHJpbmcsXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBoLTggdy04IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdHJhbnNwYXJlbnQgYmctdG9rZW4tZm9yZWdyb3VuZC81IHAtMCB0ZXh0LXRva2VuLWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI7XG4gIGFwcGVuZFN2Z0h0bWwoYnRuLCBpY29uU3ZnKTtcbiAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgbGFiZWwpO1xuICBidG4udGl0bGUgPSBsYWJlbDtcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIG9uQ2xpY2soKTtcbiAgfSk7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIHZlcmlmaWVkU2FmZUJhZGdlKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgYmFkZ2UuY2xhc3NOYW1lID1cbiAgICBcImlubGluZS1mbGV4IGgtNiBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLzMwIGJnLXRyYW5zcGFyZW50IHB4LTIgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmRcIjtcbiAgYXBwZW5kU3ZnSHRtbChcbiAgICBiYWRnZSxcbiAgICBgPHN2ZyB3aWR0aD1cIjEzXCIgaGVpZ2h0PVwiMTNcIiB2aWV3Qm94PVwiMCAwIDE0IDE0XCIgZmlsbD1cIm5vbmVcIiBjbGFzcz1cInRleHQtYmx1ZS01MDBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk03IDEuNzUgMTEuMjUgMy40djMuMmMwIDIuNi0xLjY1IDQuMjUtNC4yNSA1LjQtMi42LTEuMTUtNC4yNS0yLjgtNC4yNS01LjRWMy40TDcgMS43NVpcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjE1XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNNC44NSA3LjA1IDYuMyA4LjQ1bDIuODUtMy4wNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuMjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDwvc3ZnPmAsXG4gICk7XG4gIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgdGV4dC50ZXh0Q29udGVudCA9IFwiVmVyaWZpZWQgYXMgc2FmZVwiO1xuICBiYWRnZS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlVmVyc2lvbkJhZGdlKGVudHJ5OiBUd2Vha1N0b3JlRW50cnlWaWV3LCBpbnN0YWxsZWRPdmVycmlkZT86IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgaW5zdGFsbGVkID0gaW5zdGFsbGVkT3ZlcnJpZGUgPz8gZW50cnkuaW5zdGFsbGVkPy52ZXJzaW9uID8/IG51bGw7XG4gIGNvbnN0IGxhdGVzdCA9IGVudHJ5Lm1hbmlmZXN0LnZlcnNpb247XG4gIGNvbnN0IGhhc1VwZGF0ZSA9ICEhaW5zdGFsbGVkICYmIGluc3RhbGxlZCAhPT0gbGF0ZXN0O1xuICBjb25zdCBiYWRnZSA9IHN0b3JlVmVyc2lvbkJhZGdlU2hlbGwoaGFzVXBkYXRlKTtcbiAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgbGFiZWwuY2xhc3NOYW1lID0gXCJ0cnVuY2F0ZVwiO1xuICBsYWJlbC50ZXh0Q29udGVudCA9IGluc3RhbGxlZFxuICAgID8gYEluc3RhbGxlZCB2JHtpbnN0YWxsZWR9IFx1MDBCNyBMYXRlc3QgdiR7bGF0ZXN0fWBcbiAgICA6IGBMYXRlc3QgdiR7bGF0ZXN0fWA7XG4gIGJhZGdlLnRpdGxlID0gaW5zdGFsbGVkXG4gICAgPyBgSW5zdGFsbGVkIHZlcnNpb24gJHtpbnN0YWxsZWR9LiBMYXRlc3QgYXBwcm92ZWQgdmVyc2lvbiAke2xhdGVzdH0uYFxuICAgIDogYExhdGVzdCBhcHByb3ZlZCB2ZXJzaW9uICR7bGF0ZXN0fS5gO1xuICBiYWRnZS5hcHBlbmRDaGlsZChsYWJlbCk7XG4gIHJldHVybiBiYWRnZTtcbn1cblxuZnVuY3Rpb24gc3RvcmVWZXJzaW9uQmFkZ2VTaGVsbChoYXNVcGRhdGU6IGJvb2xlYW4pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGJhZGdlLmNsYXNzTmFtZSA9IFtcbiAgICBcImlubGluZS1mbGV4IGgtOCBtaW4tdy0wIG1heC13LWZ1bGwgaXRlbXMtY2VudGVyIHJvdW5kZWQtbGcgYm9yZGVyIHB4LTIuNSB0ZXh0LXhzIGZvbnQtbWVkaXVtXCIsXG4gICAgaGFzVXBkYXRlXG4gICAgICA/IFwiYm9yZGVyLWJsdWUtNTAwLzMwIGJnLWJsdWUtNTAwLzEwIHRleHQtdG9rZW4tZm9yZWdyb3VuZFwiXG4gICAgICA6IFwiYm9yZGVyLXRva2VuLWJvcmRlci80MCBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCIsXG4gIF0uam9pbihcIiBcIik7XG4gIHJldHVybiBiYWRnZTtcbn1cblxuZnVuY3Rpb24gc3RvcmVTdGF0dXNQaWxsKGxhYmVsOiBzdHJpbmcsIHRvbmU6IFwibmV1dHJhbFwiIHwgXCJpbmZvXCIgPSBcIm5ldXRyYWxcIik6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgcGlsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBwaWxsLmNsYXNzTmFtZSA9IFtcbiAgICBcImlubGluZS1mbGV4IGgtOCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBweC0zIHRleHQtc20gZm9udC1tZWRpdW1cIixcbiAgICB0b25lID09PSBcImluZm9cIlxuICAgICAgPyBcImJvcmRlciBib3JkZXItYmx1ZS01MDAvMzAgYmctYmx1ZS01MDAvMTAgdGV4dC10b2tlbi1mb3JlZ3JvdW5kXCJcbiAgICAgIDogXCJiZy10b2tlbi1mb3JlZ3JvdW5kLzUgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCIsXG4gIF0uam9pbihcIiBcIik7XG4gIHBpbGwudGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgcmV0dXJuIHBpbGw7XG59XG5cbmZ1bmN0aW9uIHN0b3JlSW5zdGFsbEJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbkNsaWNrOiAoYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCkgPT4gdm9pZCk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xuICBidG4uY2xhc3NOYW1lID1cbiAgICBzdG9yZUluc3RhbGxCdXR0b25DbGFzcygpO1xuICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIG9uQ2xpY2soYnRuKTtcbiAgfSk7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKGV4dHJhID0gXCJcIik6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBoLTggbWluLXctWzgycHhdIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHdoaXRlc3BhY2Utbm93cmFwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1ibHVlLTUwMC80MCBiZy1ibHVlLTUwMCBweC0zIHB5LTAgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLWZvcmVncm91bmQgc2hhZG93LXNtIHRyYW5zaXRpb24tY29sb3JzIGVuYWJsZWQ6aG92ZXI6YmctYmx1ZS02MDAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktODBcIixcbiAgICBleHRyYSxcbiAgXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHNob3dTdG9yZUJ1dHRvbkxvYWRpbmcoYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICBidXR0b24uY2xhc3NOYW1lID0gc3RvcmVJbnN0YWxsQnV0dG9uQ2xhc3MoKTtcbiAgYnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImFyaWEtYnVzeVwiLCBcInRydWVcIik7XG4gIGJ1dHRvbi5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgYXBwZW5kU3ZnSHRtbChcbiAgICBidXR0b24sXG4gICAgYDxzdmcgY2xhc3M9XCJhbmltYXRlLXNwaW5cIiB3aWR0aD1cIjE0XCIgaGVpZ2h0PVwiMTRcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cIm5vbmVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPGNpcmNsZSBjeD1cIjhcIiBjeT1cIjhcIiByPVwiNS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIG9wYWNpdHk9XCIuMjVcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNMTMuNSA4QTUuNSA1LjUgMCAwIDAgOCAyLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YCxcbiAgKTtcbiAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICB0ZXh0LnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGJ1dHRvbi5hcHBlbmRDaGlsZCh0ZXh0KTtcbn1cblxuZnVuY3Rpb24gc2hvd1N0b3JlQnV0dG9uSW5zdGFsbGVkKGJ1dHRvbjogSFRNTEJ1dHRvbkVsZW1lbnQpOiB2b2lkIHtcbiAgYnV0dG9uLmNsYXNzTmFtZSA9IHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKFwiYm9yZGVyLWJsdWUtNTAwIGJnLWJsdWUtNTAwXCIpO1xuICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICBidXR0b24ucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1idXN5XCIpO1xuICBidXR0b24ucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGFwcGVuZFN2Z0h0bWwoXG4gICAgYnV0dG9uLFxuICAgIGA8c3ZnIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwibm9uZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTMuNzUgOC4xNSA2LjY1IDExIDEyLjI1IDVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjhcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDwvc3ZnPmAsXG4gICk7XG4gIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgdGV4dC50ZXh0Q29udGVudCA9IFwiSW5zdGFsbGVkXCI7XG4gIGJ1dHRvbi5hcHBlbmRDaGlsZCh0ZXh0KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRTdG9yZUluc3RhbGxCdXR0b24oYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICBidXR0b24uY2xhc3NOYW1lID0gc3RvcmVJbnN0YWxsQnV0dG9uQ2xhc3MoKTtcbiAgYnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XG4gIGJ1dHRvbi50ZXh0Q29udGVudCA9IGxhYmVsO1xufVxuXG5mdW5jdGlvbiBzaG93U3RvcmVUb2FzdChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbGV0IGhvc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtc3RvcmUtdG9hc3QtaG9zdF1cIik7XG4gIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGhvc3QuZGF0YXNldC5jb2RleHBwU3RvcmVUb2FzdEhvc3QgPSBcInRydWVcIjtcbiAgICBob3N0LmNsYXNzTmFtZSA9IFwicG9pbnRlci1ldmVudHMtbm9uZSBmaXhlZCBib3R0b20tNSByaWdodC01IHotWzk5OTldIGZsZXggZmxleC1jb2wgaXRlbXMtZW5kIGdhcC0yXCI7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChob3N0KTtcbiAgfVxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRvYXN0LmNsYXNzTmFtZSA9XG4gICAgXCJ0cmFuc2xhdGUteS0yIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIvNTAgYmctdG9rZW4tbWFpbi1zdXJmYWNlLXByaW1hcnkgcHgtMyBweS0yIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi1mb3JlZ3JvdW5kIG9wYWNpdHktMCBzaGFkb3ctbGcgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwXCI7XG4gIHRvYXN0LnRleHRDb250ZW50ID0gbWVzc2FnZTtcbiAgaG9zdC5hcHBlbmRDaGlsZCh0b2FzdCk7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgdG9hc3QuY2xhc3NMaXN0LnJlbW92ZShcInRyYW5zbGF0ZS15LTJcIiwgXCJvcGFjaXR5LTBcIik7XG4gIH0pO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0b2FzdC5jbGFzc0xpc3QuYWRkKFwidHJhbnNsYXRlLXktMlwiLCBcIm9wYWNpdHktMFwiKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRvYXN0LnJlbW92ZSgpO1xuICAgICAgaWYgKGhvc3QgJiYgaG9zdC5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMCkgaG9zdC5yZW1vdmUoKTtcbiAgICB9LCAyMjApO1xuICB9LCAyNjAwKTtcbn1cblxuZnVuY3Rpb24gc3RvcmVNZXNzYWdlQ2FyZCh0aXRsZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgY2FyZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNhcmQuY2xhc3NOYW1lID1cbiAgICBcImJvcmRlci10b2tlbi1ib3JkZXIvNDAgZmxleCBtaW4taC1bODRweF0gZmxleC1jb2wganVzdGlmeS1jZW50ZXIgZ2FwLTEgcm91bmRlZC0yeGwgYm9yZGVyIHAtNCB0ZXh0LXNtXCI7XG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0LmNsYXNzTmFtZSA9IFwiZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdC50ZXh0Q29udGVudCA9IHRpdGxlO1xuICBjYXJkLmFwcGVuZENoaWxkKHQpO1xuICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBkLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICAgIGQudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcbiAgICBjYXJkLmFwcGVuZENoaWxkKGQpO1xuICB9XG4gIHJldHVybiBjYXJkO1xufVxuXG5mdW5jdGlvbiByZW5kZXJUd2Vha3NQYWdlKHNlY3Rpb25zV3JhcDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3Qgb3BlbkJ0biA9IG9wZW5JblBsYWNlQnV0dG9uKFwiT3BlbiBUd2Vha3MgRm9sZGVyXCIsICgpID0+IHtcbiAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6cmV2ZWFsXCIsIHR3ZWFrc1BhdGgoKSk7XG4gIH0pO1xuICBjb25zdCByZWxvYWRCdG4gPSBvcGVuSW5QbGFjZUJ1dHRvbihcIkZvcmNlIFJlbG9hZFwiLCAoKSA9PiB7XG4gICAgLy8gRnVsbCBwYWdlIHJlZnJlc2ggXHUyMDE0IHNhbWUgYXMgRGV2VG9vbHMgQ21kLVIgLyBvdXIgQ0RQIFBhZ2UucmVsb2FkLlxuICAgIC8vIE1haW4gcmUtZGlzY292ZXJzIHR3ZWFrcyBmaXJzdCBzbyB0aGUgbmV3IHJlbmRlcmVyIGNvbWVzIHVwIHdpdGggYVxuICAgIC8vIGZyZXNoIHR3ZWFrIHNldDsgdGhlbiBsb2NhdGlvbi5yZWxvYWQgcmVzdGFydHMgdGhlIHJlbmRlcmVyIHNvIHRoZVxuICAgIC8vIHByZWxvYWQgcmUtaW5pdGlhbGl6ZXMgYWdhaW5zdCBpdC5cbiAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAuaW52b2tlKFwiY29kZXhwcDpyZWxvYWQtdHdlYWtzXCIpXG4gICAgICAuY2F0Y2goKGUpID0+IHBsb2coXCJmb3JjZSByZWxvYWQgKG1haW4pIGZhaWxlZFwiLCBTdHJpbmcoZSkpKVxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgIH0pO1xuICB9KTtcbiAgLy8gRHJvcCB0aGUgZGlhZ29uYWwtYXJyb3cgaWNvbiBmcm9tIHRoZSByZWxvYWQgYnV0dG9uIFx1MjAxNCBpdCBpbXBsaWVzIFwib3BlblxuICAvLyBvdXQgb2YgYXBwXCIgd2hpY2ggZG9lc24ndCBmaXQuIFJlcGxhY2UgaXRzIHRyYWlsaW5nIHN2ZyB3aXRoIGEgcmVmcmVzaC5cbiAgY29uc3QgcmVsb2FkU3ZnID0gcmVsb2FkQnRuLnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIik7XG4gIGlmIChyZWxvYWRTdmcpIHtcbiAgICBjb25zdCBpY29uID0gc3ZnRWxlbWVudChcbiAgICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tMnhzXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXG4gICAgICBgPHBhdGggZD1cIk00IDEwYTYgNiAwIDAgMSAxMC4yNC00LjI0TDE2IDcuNU0xNiA0djMuNWgtMy41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgICAgYDxwYXRoIGQ9XCJNMTYgMTBhNiA2IDAgMCAxLTEwLjI0IDQuMjRMNCAxMi41TTQgMTZ2LTMuNWgzLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgICBgPC9zdmc+YCxcbiAgICApO1xuICAgIGlmIChpY29uKSByZWxvYWRTdmcucmVwbGFjZVdpdGgoaWNvbik7XG4gIH1cblxuICBjb25zdCB0cmFpbGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRyYWlsaW5nLmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgdHJhaWxpbmcuYXBwZW5kQ2hpbGQocmVsb2FkQnRuKTtcbiAgdHJhaWxpbmcuYXBwZW5kQ2hpbGQob3BlbkJ0bik7XG5cbiAgaWYgKHN0YXRlLmxpc3RlZFR3ZWFrcy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zdCBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gICAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgICBzZWN0aW9uLmFwcGVuZENoaWxkKHNlY3Rpb25UaXRsZShcIkluc3RhbGxlZCBUd2Vha3NcIiwgdHJhaWxpbmcpKTtcbiAgICBjb25zdCBjYXJkID0gcm91bmRlZENhcmQoKTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKFxuICAgICAgcm93U2ltcGxlKFxuICAgICAgICBcIk5vIHR3ZWFrcyBpbnN0YWxsZWRcIixcbiAgICAgICAgYERyb3AgYSB0d2VhayBmb2xkZXIgaW50byAke3R3ZWFrc1BhdGgoKX0gYW5kIHJlbG9hZC5gLFxuICAgICAgKSxcbiAgICApO1xuICAgIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY2FyZCk7XG4gICAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNlY3Rpb24pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEdyb3VwIHJlZ2lzdGVyZWQgU2V0dGluZ3NTZWN0aW9ucyBieSB0d2VhayBpZCAocHJlZml4IHNwbGl0IGF0IFwiOlwiKS5cbiAgY29uc3Qgc2VjdGlvbnNCeVR3ZWFrID0gbmV3IE1hcDxzdHJpbmcsIFNldHRpbmdzU2VjdGlvbltdPigpO1xuICBmb3IgKGNvbnN0IHMgb2Ygc3RhdGUuc2VjdGlvbnMudmFsdWVzKCkpIHtcbiAgICBjb25zdCB0d2Vha0lkID0gcy5pZC5zcGxpdChcIjpcIilbMF07XG4gICAgaWYgKCFzZWN0aW9uc0J5VHdlYWsuaGFzKHR3ZWFrSWQpKSBzZWN0aW9uc0J5VHdlYWsuc2V0KHR3ZWFrSWQsIFtdKTtcbiAgICBzZWN0aW9uc0J5VHdlYWsuZ2V0KHR3ZWFrSWQpIS5wdXNoKHMpO1xuICB9XG5cbiAgY29uc3QgcGFnZXNCeVR3ZWFrID0gbmV3IE1hcDxzdHJpbmcsIFJlZ2lzdGVyZWRQYWdlW10+KCk7XG4gIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkge1xuICAgIGlmICghcGFnZXNCeVR3ZWFrLmhhcyhwLnR3ZWFrSWQpKSBwYWdlc0J5VHdlYWsuc2V0KHAudHdlYWtJZCwgW10pO1xuICAgIHBhZ2VzQnlUd2Vhay5nZXQocC50d2Vha0lkKSEucHVzaChwKTtcbiAgfVxuXG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgd3JhcC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgd3JhcC5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJJbnN0YWxsZWQgVHdlYWtzXCIsIHRyYWlsaW5nKSk7XG5cbiAgY29uc3QgY2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIGZvciAoY29uc3QgdCBvZiBzdGF0ZS5saXN0ZWRUd2Vha3MpIHtcbiAgICBjYXJkLmFwcGVuZENoaWxkKFxuICAgICAgdHdlYWtSb3coXG4gICAgICAgIHQsXG4gICAgICAgIHNlY3Rpb25zQnlUd2Vhay5nZXQodC5tYW5pZmVzdC5pZCkgPz8gW10sXG4gICAgICAgIHBhZ2VzQnlUd2Vhay5nZXQodC5tYW5pZmVzdC5pZCkgPz8gW10sXG4gICAgICApLFxuICAgICk7XG4gIH1cbiAgd3JhcC5hcHBlbmRDaGlsZChjYXJkKTtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHdyYXApO1xufVxuXG5mdW5jdGlvbiB0d2Vha1JvdyhcbiAgdDogTGlzdGVkVHdlYWssXG4gIHNlY3Rpb25zOiBTZXR0aW5nc1NlY3Rpb25bXSxcbiAgcGFnZXM6IFJlZ2lzdGVyZWRQYWdlW10sXG4pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IG0gPSB0Lm1hbmlmZXN0O1xuXG4gIC8vIE91dGVyIGNlbGwgd3JhcHMgdGhlIGhlYWRlciByb3cgKyAob3B0aW9uYWwpIG5lc3RlZCBzZWN0aW9ucyBzbyB0aGVcbiAgLy8gcGFyZW50IGNhcmQncyBkaXZpZGVyIHN0YXlzIGJldHdlZW4gKnR3ZWFrcyosIG5vdCBiZXR3ZWVuIGhlYWRlciBhbmRcbiAgLy8gYm9keSBvZiB0aGUgc2FtZSB0d2Vhay5cbiAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNlbGwuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sXCI7XG4gIGlmICghdC5lbmFibGVkKSBjZWxsLnN0eWxlLm9wYWNpdHkgPSBcIjAuN1wiO1xuXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRlci5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuXG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBsZWZ0LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtMSBpdGVtcy1zdGFydCBnYXAtM1wiO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBBdmF0YXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGF2YXRhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGF2YXRhci5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBvdmVyZmxvdy1oaWRkZW4gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBhdmF0YXIuc3R5bGUud2lkdGggPSBcIjU2cHhcIjtcbiAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IFwiNTZweFwiO1xuICBhdmF0YXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ2YXIoLS1jb2xvci10b2tlbi1iZy1mb2csIHRyYW5zcGFyZW50KVwiO1xuICBpZiAobS5pY29uVXJsKSB7XG4gICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICBpbWcuYWx0ID0gXCJcIjtcbiAgICBpbWcuY2xhc3NOYW1lID0gXCJzaXplLWZ1bGwgb2JqZWN0LWNvbnRhaW5cIjtcbiAgICAvLyBJbml0aWFsOiBzaG93IGZhbGxiYWNrIGluaXRpYWwgaW4gY2FzZSB0aGUgaWNvbiBmYWlscyB0byBsb2FkLlxuICAgIGNvbnN0IGluaXRpYWwgPSAobS5uYW1lPy5bMF0gPz8gXCI/XCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3QgZmFsbGJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICBmYWxsYmFjay5jbGFzc05hbWUgPSBcInRleHQteGwgZm9udC1tZWRpdW1cIjtcbiAgICBmYWxsYmFjay50ZXh0Q29udGVudCA9IGluaXRpYWw7XG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKGZhbGxiYWNrKTtcbiAgICBpbWcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG4gICAgICBmYWxsYmFjay5yZW1vdmUoKTtcbiAgICAgIGltZy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICB9KTtcbiAgICBpbWcuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsICgpID0+IHtcbiAgICAgIGltZy5yZW1vdmUoKTtcbiAgICB9KTtcbiAgICB2b2lkIHJlc29sdmVJY29uVXJsKG0uaWNvblVybCwgdC5kaXIpLnRoZW4oKHVybCkgPT4ge1xuICAgICAgaWYgKHVybCkgaW1nLnNyYyA9IHVybDtcbiAgICAgIGVsc2UgaW1nLnJlbW92ZSgpO1xuICAgIH0pO1xuICAgIGF2YXRhci5hcHBlbmRDaGlsZChpbWcpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGluaXRpYWwgPSAobS5uYW1lPy5bMF0gPz8gXCI/XCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gXCJ0ZXh0LXhsIGZvbnQtbWVkaXVtXCI7XG4gICAgc3Bhbi50ZXh0Q29udGVudCA9IGluaXRpYWw7XG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKHNwYW4pO1xuICB9XG4gIGxlZnQuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVGV4dCBzdGFjayBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3Qgc3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMC41XCI7XG5cbiAgY29uc3QgdGl0bGVSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZVJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI7XG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBuYW1lLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIG5hbWUudGV4dENvbnRlbnQgPSBtLm5hbWU7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKG5hbWUpO1xuICBpZiAobS52ZXJzaW9uKSB7XG4gICAgY29uc3QgdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgdmVyLmNsYXNzTmFtZSA9XG4gICAgICBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgdGV4dC14cyBmb250LW5vcm1hbCB0YWJ1bGFyLW51bXNcIjtcbiAgICB2ZXIudGV4dENvbnRlbnQgPSBgdiR7bS52ZXJzaW9ufWA7XG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodmVyKTtcbiAgfVxuICBpZiAodC51cGRhdGU/LnVwZGF0ZUF2YWlsYWJsZSkge1xuICAgIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgYmFkZ2UuY2xhc3NOYW1lID1cbiAgICAgIFwicm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLWZvcmVncm91bmQvNSBweC0yIHB5LTAuNSB0ZXh0LVsxMXB4XSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICAgIGJhZGdlLnRleHRDb250ZW50ID0gXCJVcGRhdGUgQXZhaWxhYmxlXCI7XG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuICB9XG4gIHN0YWNrLmFwcGVuZENoaWxkKHRpdGxlUm93KTtcblxuICBpZiAobS5kZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICAgIGRlc2MudGV4dENvbnRlbnQgPSBtLmRlc2NyaXB0aW9uO1xuICAgIHN0YWNrLmFwcGVuZENoaWxkKGRlc2MpO1xuICB9XG5cbiAgY29uc3QgbWV0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG1ldGEuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgY29uc3QgYXV0aG9yRWwgPSByZW5kZXJBdXRob3IobS5hdXRob3IpO1xuICBpZiAoYXV0aG9yRWwpIG1ldGEuYXBwZW5kQ2hpbGQoYXV0aG9yRWwpO1xuICBpZiAobS5naXRodWJSZXBvKSB7XG4gICAgaWYgKG1ldGEuY2hpbGRyZW4ubGVuZ3RoID4gMCkgbWV0YS5hcHBlbmRDaGlsZChkb3QoKSk7XG4gICAgY29uc3QgcmVwbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgcmVwby50eXBlID0gXCJidXR0b25cIjtcbiAgICByZXBvLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggdGV4dC10b2tlbi10ZXh0LWxpbmstZm9yZWdyb3VuZCBob3Zlcjp1bmRlcmxpbmVcIjtcbiAgICByZXBvLnRleHRDb250ZW50ID0gbS5naXRodWJSZXBvO1xuICAgIHJlcG8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgYGh0dHBzOi8vZ2l0aHViLmNvbS8ke20uZ2l0aHViUmVwb31gKTtcbiAgICB9KTtcbiAgICBtZXRhLmFwcGVuZENoaWxkKHJlcG8pO1xuICB9XG4gIGlmIChtLmhvbWVwYWdlKSB7XG4gICAgaWYgKG1ldGEuY2hpbGRyZW4ubGVuZ3RoID4gMCkgbWV0YS5hcHBlbmRDaGlsZChkb3QoKSk7XG4gICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIGxpbmsuaHJlZiA9IG0uaG9tZXBhZ2U7XG4gICAgbGluay50YXJnZXQgPSBcIl9ibGFua1wiO1xuICAgIGxpbmsucmVsID0gXCJub3JlZmVycmVyXCI7XG4gICAgbGluay5jbGFzc05hbWUgPSBcImlubGluZS1mbGV4IHRleHQtdG9rZW4tdGV4dC1saW5rLWZvcmVncm91bmQgaG92ZXI6dW5kZXJsaW5lXCI7XG4gICAgbGluay50ZXh0Q29udGVudCA9IFwiSG9tZXBhZ2VcIjtcbiAgICBtZXRhLmFwcGVuZENoaWxkKGxpbmspO1xuICB9XG4gIGlmIChtZXRhLmNoaWxkcmVuLmxlbmd0aCA+IDApIHN0YWNrLmFwcGVuZENoaWxkKG1ldGEpO1xuXG4gIC8vIFRhZ3Mgcm93IChpZiBhbnkpIFx1MjAxNCBzbWFsbCBwaWxsIGNoaXBzIGJlbG93IHRoZSBtZXRhIGxpbmUuXG4gIGlmIChtLnRhZ3MgJiYgbS50YWdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB0YWdzUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0YWdzUm93LmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0xIHB0LTAuNVwiO1xuICAgIGZvciAoY29uc3QgdGFnIG9mIG0udGFncykge1xuICAgICAgY29uc3QgcGlsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgcGlsbC5jbGFzc05hbWUgPVxuICAgICAgICBcInJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcHgtMiBweS0wLjUgdGV4dC1bMTFweF0gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICAgICAgcGlsbC50ZXh0Q29udGVudCA9IHRhZztcbiAgICAgIHRhZ3NSb3cuYXBwZW5kQ2hpbGQocGlsbCk7XG4gICAgfVxuICAgIHN0YWNrLmFwcGVuZENoaWxkKHRhZ3NSb3cpO1xuICB9XG5cbiAgbGVmdC5hcHBlbmRDaGlsZChzdGFjayk7XG4gIGhlYWRlci5hcHBlbmRDaGlsZChsZWZ0KTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVG9nZ2xlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJpZ2h0LmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHQtMC41XCI7XG4gIGlmICh0LmVuYWJsZWQgJiYgcGFnZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGNvbmZpZ3VyZUJ0biA9IGNvbXBhY3RCdXR0b24oXCJDb25maWd1cmVcIiwgKCkgPT4ge1xuICAgICAgYWN0aXZhdGVQYWdlKHsga2luZDogXCJyZWdpc3RlcmVkXCIsIGlkOiBwYWdlc1swXSEuaWQgfSk7XG4gICAgfSk7XG4gICAgY29uZmlndXJlQnRuLnRpdGxlID0gcGFnZXMubGVuZ3RoID09PSAxXG4gICAgICA/IGBPcGVuICR7cGFnZXNbMF0hLnBhZ2UudGl0bGV9YFxuICAgICAgOiBgT3BlbiAke3BhZ2VzLm1hcCgocCkgPT4gcC5wYWdlLnRpdGxlKS5qb2luKFwiLCBcIil9YDtcbiAgICByaWdodC5hcHBlbmRDaGlsZChjb25maWd1cmVCdG4pO1xuICB9XG4gIGlmICh0LnVwZGF0ZT8udXBkYXRlQXZhaWxhYmxlICYmIHQudXBkYXRlLnJlbGVhc2VVcmwpIHtcbiAgICByaWdodC5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJSZXZpZXcgUmVsZWFzZVwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIHQudXBkYXRlIS5yZWxlYXNlVXJsKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbiAgcmlnaHQuYXBwZW5kQ2hpbGQoXG4gICAgc3dpdGNoQ29udHJvbCh0LmVuYWJsZWQsIGFzeW5jIChuZXh0KSA9PiB7XG4gICAgICBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnNldC10d2Vhay1lbmFibGVkXCIsIG0uaWQsIG5leHQpO1xuICAgICAgLy8gVGhlIG1haW4gcHJvY2VzcyBicm9hZGNhc3RzIGEgcmVsb2FkIHdoaWNoIHdpbGwgcmUtZmV0Y2ggdGhlIGxpc3RcbiAgICAgIC8vIGFuZCByZS1yZW5kZXIuIFdlIGRvbid0IG9wdGltaXN0aWNhbGx5IHRvZ2dsZSB0byBhdm9pZCBkcmlmdC5cbiAgICB9KSxcbiAgKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKHJpZ2h0KTtcblxuICBjZWxsLmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgLy8gSWYgdGhlIHR3ZWFrIGlzIGVuYWJsZWQgYW5kIHJlZ2lzdGVyZWQgc2V0dGluZ3Mgc2VjdGlvbnMsIHJlbmRlciB0aG9zZVxuICAvLyBib2RpZXMgYXMgbmVzdGVkIHJvd3MgYmVuZWF0aCB0aGUgaGVhZGVyIGluc2lkZSB0aGUgc2FtZSBjZWxsLlxuICBpZiAodC5lbmFibGVkICYmIHNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBuZXN0ZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG5lc3RlZC5jbGFzc05hbWUgPVxuICAgICAgXCJmbGV4IGZsZXgtY29sIGRpdmlkZS15LVswLjVweF0gZGl2aWRlLXRva2VuLWJvcmRlciBib3JkZXItdC1bMC41cHhdIGJvcmRlci10b2tlbi1ib3JkZXJcIjtcbiAgICBmb3IgKGNvbnN0IHMgb2Ygc2VjdGlvbnMpIHtcbiAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgYm9keS5jbGFzc05hbWUgPSBcInAtM1wiO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcy5yZW5kZXIoYm9keSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGJvZHkudGV4dENvbnRlbnQgPSBgRXJyb3IgcmVuZGVyaW5nIHR3ZWFrIHNlY3Rpb246ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YDtcbiAgICAgIH1cbiAgICAgIG5lc3RlZC5hcHBlbmRDaGlsZChib2R5KTtcbiAgICB9XG4gICAgY2VsbC5hcHBlbmRDaGlsZChuZXN0ZWQpO1xuICB9XG5cbiAgcmV0dXJuIGNlbGw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckF1dGhvcihhdXRob3I6IFR3ZWFrTWFuaWZlc3RbXCJhdXRob3JcIl0pOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBpZiAoIWF1dGhvcikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgd3JhcC5jbGFzc05hbWUgPSBcImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiO1xuICBpZiAodHlwZW9mIGF1dGhvciA9PT0gXCJzdHJpbmdcIikge1xuICAgIHdyYXAudGV4dENvbnRlbnQgPSBgYnkgJHthdXRob3J9YDtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxuICB3cmFwLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiYnkgXCIpKTtcbiAgaWYgKGF1dGhvci51cmwpIHtcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgYS5ocmVmID0gYXV0aG9yLnVybDtcbiAgICBhLnRhcmdldCA9IFwiX2JsYW5rXCI7XG4gICAgYS5yZWwgPSBcIm5vcmVmZXJyZXJcIjtcbiAgICBhLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggdGV4dC10b2tlbi10ZXh0LWxpbmstZm9yZWdyb3VuZCBob3Zlcjp1bmRlcmxpbmVcIjtcbiAgICBhLnRleHRDb250ZW50ID0gYXV0aG9yLm5hbWU7XG4gICAgd3JhcC5hcHBlbmRDaGlsZChhKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgc3Bhbi50ZXh0Q29udGVudCA9IGF1dGhvci5uYW1lO1xuICAgIHdyYXAuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cbiAgcmV0dXJuIHdyYXA7XG59XG5cbmZ1bmN0aW9uIG9wZW5QdWJsaXNoVHdlYWtEaWFsb2coKTogdm9pZCB7XG4gIGNvbnN0IGV4aXN0aW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXB1Ymxpc2gtZGlhbG9nXVwiKTtcbiAgZXhpc3Rpbmc/LnJlbW92ZSgpO1xuXG4gIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBvdmVybGF5LmRhdGFzZXQuY29kZXhwcFB1Ymxpc2hEaWFsb2cgPSBcInRydWVcIjtcbiAgb3ZlcmxheS5jbGFzc05hbWUgPSBcImZpeGVkIGluc2V0LTAgei1bOTk5OV0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgcC00XCI7XG5cbiAgY29uc3QgZGlhbG9nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGlhbG9nLmNsYXNzTmFtZSA9XG4gICAgXCJmbGV4IHctZnVsbCBtYXgtdy14bCBmbGV4LWNvbCBnYXAtNCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLW1haW4tc3VyZmFjZS1wcmltYXJ5IHAtNCBzaGFkb3cteGxcIjtcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChkaWFsb2cpO1xuXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRlci5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI7XG4gIGNvbnN0IHRpdGxlU3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZVN0YWNrLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJ0ZXh0LWJhc2UgZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBcIlB1Ymxpc2ggVHdlYWtcIjtcbiAgY29uc3Qgc3VidGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdWJ0aXRsZS5jbGFzc05hbWUgPSBcInRleHQtc20gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBzdWJ0aXRsZS50ZXh0Q29udGVudCA9IFwiU3VibWl0IGEgR2l0SHViIHJlcG8gZm9yIGFkbWluIHJldmlldy4gQ29kZXgrKyByZWNvcmRzIHRoZSBleGFjdCBjb21taXQgYWRtaW5zIG11c3QgcmV2aWV3IGFuZCBwaW4uXCI7XG4gIHRpdGxlU3RhY2suYXBwZW5kQ2hpbGQodGl0bGUpO1xuICB0aXRsZVN0YWNrLmFwcGVuZENoaWxkKHN1YnRpdGxlKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKHRpdGxlU3RhY2spO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQoY29tcGFjdEJ1dHRvbihcIkRpc21pc3NcIiwgKCkgPT4gb3ZlcmxheS5yZW1vdmUoKSkpO1xuICBkaWFsb2cuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuICBjb25zdCByZXBvSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gIHJlcG9JbnB1dC50eXBlID0gXCJ0ZXh0XCI7XG4gIHJlcG9JbnB1dC5wbGFjZWhvbGRlciA9IFwib3duZXIvcmVwbyBvciBodHRwczovL2dpdGh1Yi5jb20vb3duZXIvcmVwb1wiO1xuICByZXBvSW5wdXQuY2xhc3NOYW1lID1cbiAgICBcImgtMTAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10cmFuc3BhcmVudCBweC0zIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnkgZm9jdXM6b3V0bGluZS1ub25lXCI7XG4gIGRpYWxvZy5hcHBlbmRDaGlsZChyZXBvSW5wdXQpO1xuXG4gIGNvbnN0IHN0YXR1cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHN0YXR1cy5jbGFzc05hbWUgPSBcIm1pbi1oLTUgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIHN0YXR1cy50ZXh0Q29udGVudCA9IFwiVGhlIG1hbmlmZXN0IHNob3VsZCBpbmNsdWRlIGFuIGljb25Vcmwgc3VpdGFibGUgZm9yIHRoZSBzdG9yZS5cIjtcbiAgZGlhbG9nLmFwcGVuZENoaWxkKHN0YXR1cyk7XG5cbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWVuZCBnYXAtMlwiO1xuICBjb25zdCBzdWJtaXQgPSBjb21wYWN0QnV0dG9uKFwiT3BlbiBSZXZpZXcgSXNzdWVcIiwgKCkgPT4ge1xuICAgIHZvaWQgc3VibWl0UHVibGlzaFR3ZWFrKHJlcG9JbnB1dCwgc3RhdHVzKTtcbiAgfSk7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3VibWl0KTtcbiAgZGlhbG9nLmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuXG4gIG92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgaWYgKGUudGFyZ2V0ID09PSBvdmVybGF5KSBvdmVybGF5LnJlbW92ZSgpO1xuICB9KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdmVybGF5KTtcbiAgcmVwb0lucHV0LmZvY3VzKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN1Ym1pdFB1Ymxpc2hUd2VhayhcbiAgcmVwb0lucHV0OiBIVE1MSW5wdXRFbGVtZW50LFxuICBzdGF0dXM6IEhUTUxFbGVtZW50LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIHN0YXR1cy5jbGFzc05hbWUgPSBcIm1pbi1oLTUgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIHN0YXR1cy50ZXh0Q29udGVudCA9IFwiUmVzb2x2aW5nIHRoZSByZXBvIGNvbW1pdCB0byByZXZpZXcuXCI7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3VibWlzc2lvbiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgIFwiY29kZXhwcDpwcmVwYXJlLXR3ZWFrLXN0b3JlLXN1Ym1pc3Npb25cIixcbiAgICAgIHJlcG9JbnB1dC52YWx1ZSxcbiAgICApIGFzIFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbjtcbiAgICBjb25zdCB1cmwgPSBidWlsZFR3ZWFrUHVibGlzaElzc3VlVXJsKHN1Ym1pc3Npb24pO1xuICAgIGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCB1cmwpO1xuICAgIHN0YXR1cy50ZXh0Q29udGVudCA9IGBHaXRIdWIgcmV2aWV3IGlzc3VlIG9wZW5lZCBmb3IgJHtzdWJtaXNzaW9uLmNvbW1pdFNoYS5zbGljZSgwLCA3KX0uYDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHN0YXR1cy5jbGFzc05hbWUgPSBcIm1pbi1oLTUgdGV4dC1zbSB0ZXh0LXRva2VuLWNoYXJ0cy1yZWRcIjtcbiAgICBzdGF0dXMudGV4dENvbnRlbnQgPSBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UgPz8gZSk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIGNvbXBvbmVudHMgXHUyNTAwXHUyNTAwXG5cbi8qKiBUaGUgZnVsbCBwYW5lbCBzaGVsbCAodG9vbGJhciArIHNjcm9sbCArIGhlYWRpbmcgKyBzZWN0aW9ucyB3cmFwKS4gKi9cbmZ1bmN0aW9uIHBhbmVsU2hlbGwoXG4gIHRpdGxlOiBzdHJpbmcsXG4gIHN1YnRpdGxlPzogc3RyaW5nLFxuICBvcHRpb25zPzogeyB3aWRlPzogYm9vbGVhbiB9LFxuKToge1xuICBvdXRlcjogSFRNTEVsZW1lbnQ7XG4gIHNlY3Rpb25zV3JhcDogSFRNTEVsZW1lbnQ7XG4gIHN1YnRpdGxlPzogSFRNTEVsZW1lbnQ7XG4gIGhlYWRlckFjdGlvbnM6IEhUTUxFbGVtZW50O1xuICBoZWFkZXJUaXRsZUFjdGlvbnM6IEhUTUxFbGVtZW50O1xufSB7XG4gIGNvbnN0IG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgb3V0ZXIuY2xhc3NOYW1lID0gXCJtYWluLXN1cmZhY2UgZmxleCBoLWZ1bGwgbWluLWgtMCBmbGV4LWNvbFwiO1xuXG4gIGNvbnN0IHRvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0b29sYmFyLmNsYXNzTmFtZSA9XG4gICAgXCJkcmFnZ2FibGUgZmxleCBpdGVtcy1jZW50ZXIgcHgtcGFuZWwgZWxlY3Ryb246aC10b29sYmFyIGV4dGVuc2lvbjpoLXRvb2xiYXItc21cIjtcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQodG9vbGJhcik7XG5cbiAgY29uc3Qgc2Nyb2xsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc2Nyb2xsLmNsYXNzTmFtZSA9IFwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLXBhbmVsXCI7XG4gIG91dGVyLmFwcGVuZENoaWxkKHNjcm9sbCk7XG5cbiAgY29uc3QgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBpbm5lci5jbGFzc05hbWUgPVxuICAgIG9wdGlvbnM/LndpZGVcbiAgICAgID8gXCJteC1hdXRvIGZsZXggdy1mdWxsIG1heC13LTV4bCBmbGV4LWNvbCBlbGVjdHJvbjptaW4tdy1bY2FsYygzMjBweCp2YXIoLS1jb2RleC13aW5kb3ctem9vbSkpXVwiXG4gICAgICA6IFwibXgtYXV0byBmbGV4IHctZnVsbCBmbGV4LWNvbCBtYXgtdy0yeGwgZWxlY3Ryb246bWluLXctW2NhbGMoMzIwcHgqdmFyKC0tY29kZXgtd2luZG93LXpvb20pKV1cIjtcbiAgc2Nyb2xsLmFwcGVuZENoaWxkKGlubmVyKTtcblxuICBjb25zdCBoZWFkZXJXcmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyV3JhcC5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBwYi1wYW5lbFwiO1xuICBjb25zdCBoZWFkZXJJbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRlcklubmVyLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtMSBmbGV4LWNvbCBnYXAtMS41IHBiLXBhbmVsXCI7XG4gIGNvbnN0IHRpdGxlTGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlTGluZS5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgY29uc3QgaGVhZGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRpbmcuY2xhc3NOYW1lID0gXCJlbGVjdHJvbjpoZWFkaW5nLWxnIGhlYWRpbmctYmFzZSB0cnVuY2F0ZVwiO1xuICBoZWFkaW5nLnRleHRDb250ZW50ID0gdGl0bGU7XG4gIHRpdGxlTGluZS5hcHBlbmRDaGlsZChoZWFkaW5nKTtcbiAgY29uc3QgaGVhZGVyVGl0bGVBY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyVGl0bGVBY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgdGl0bGVMaW5lLmFwcGVuZENoaWxkKGhlYWRlclRpdGxlQWN0aW9ucyk7XG4gIGhlYWRlcklubmVyLmFwcGVuZENoaWxkKHRpdGxlTGluZSk7XG4gIGxldCBzdWJ0aXRsZUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBpZiAoc3VidGl0bGUpIHtcbiAgICBjb25zdCBzdWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHN1Yi5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgdGV4dC1zbVwiO1xuICAgIHN1Yi50ZXh0Q29udGVudCA9IHN1YnRpdGxlO1xuICAgIGhlYWRlcklubmVyLmFwcGVuZENoaWxkKHN1Yik7XG4gICAgc3VidGl0bGVFbGVtZW50ID0gc3ViO1xuICB9XG4gIGhlYWRlcldyYXAuYXBwZW5kQ2hpbGQoaGVhZGVySW5uZXIpO1xuICBjb25zdCBoZWFkZXJBY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyQWN0aW9ucy5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGdhcC0yXCI7XG4gIGhlYWRlcldyYXAuYXBwZW5kQ2hpbGQoaGVhZGVyQWN0aW9ucyk7XG4gIGlubmVyLmFwcGVuZENoaWxkKGhlYWRlcldyYXApO1xuXG4gIGNvbnN0IHNlY3Rpb25zV3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHNlY3Rpb25zV3JhcC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLVt2YXIoLS1wYWRkaW5nLXBhbmVsKV1cIjtcbiAgaW5uZXIuYXBwZW5kQ2hpbGQoc2VjdGlvbnNXcmFwKTtcblxuICByZXR1cm4geyBvdXRlciwgc2VjdGlvbnNXcmFwLCBzdWJ0aXRsZTogc3VidGl0bGVFbGVtZW50LCBoZWFkZXJBY3Rpb25zLCBoZWFkZXJUaXRsZUFjdGlvbnMgfTtcbn1cblxuZnVuY3Rpb24gc2VjdGlvblRpdGxlKHRleHQ6IHN0cmluZywgdHJhaWxpbmc/OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgdGl0bGVSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZVJvdy5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBoLXRvb2xiYXIgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBweC0wIHB5LTBcIjtcbiAgY29uc3QgdGl0bGVJbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlSW5uZXIuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0LmNsYXNzTmFtZSA9IFwidGV4dC1iYXNlIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICB0aXRsZUlubmVyLmFwcGVuZENoaWxkKHQpO1xuICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh0aXRsZUlubmVyKTtcbiAgaWYgKHRyYWlsaW5nKSB7XG4gICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHJpZ2h0LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgICByaWdodC5hcHBlbmRDaGlsZCh0cmFpbGluZyk7XG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQocmlnaHQpO1xuICB9XG4gIHJldHVybiB0aXRsZVJvdztcbn1cblxuLyoqXG4gKiBDb2RleCdzIFwiT3BlbiBjb25maWcudG9tbFwiLXN0eWxlIHRyYWlsaW5nIGJ1dHRvbjogZ2hvc3QgYm9yZGVyLCBtdXRlZFxuICogbGFiZWwsIHRvcC1yaWdodCBkaWFnb25hbCBhcnJvdyBpY29uLiBNYXJrdXAgbWlycm9ycyBDb25maWd1cmF0aW9uIHBhbmVsLlxuICovXG5mdW5jdGlvbiBvcGVuSW5QbGFjZUJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbkNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciB1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGJvcmRlciB3aGl0ZXNwYWNlLW5vd3JhcCBmb2N1czpvdXRsaW5lLW5vbmUgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNDAgcm91bmRlZC1sZyB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgZGF0YS1bc3RhdGU9b3Blbl06YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kIGJvcmRlci10cmFuc3BhcmVudCBoLXRva2VuLWJ1dHRvbi1jb21wb3NlciBweC0yIHB5LTAgdGV4dC1iYXNlIGxlYWRpbmctWzE4cHhdXCI7XG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBhcHBlbmRTdmdIdG1sKFxuICAgIGJ0bixcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLTJ4c1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTE0LjMzNDkgMTMuMzMwMVY2LjYwNjQ1TDUuNDcwNjUgMTUuNDcwN0M1LjIxMDk1IDE1LjczMDQgNC43ODg5NSAxNS43MzA0IDQuNTI5MjUgMTUuNDcwN0M0LjI2OTU1IDE1LjIxMSA0LjI2OTU1IDE0Ljc4OSA0LjUyOTI1IDE0LjUyOTNMMTMuMzkzNSA1LjY2NTA0SDYuNjYwMTFDNi4yOTI4NCA1LjY2NTA0IDUuOTk1MDcgNS4zNjcyNyA1Ljk5NTA3IDVDNS45OTUwNyA0LjYzMjczIDYuMjkyODQgNC4zMzQ5NiA2LjY2MDExIDQuMzM0OTZIMTQuOTk5OUwxNS4xMzM3IDQuMzQ4NjNDMTUuNDM2OSA0LjQxMDU3IDE1LjY2NSA0LjY3ODU3IDE1LjY2NSA1VjEzLjMzMDFDMTUuNjY0OSAxMy42OTczIDE1LjM2NzIgMTMuOTk1MSAxNC45OTk5IDEzLjk5NTFDMTQuNjMyNyAxMy45OTUxIDE0LjMzNSAxMy42OTczIDE0LjMzNDkgMTMuMzMwMVpcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+PC9wYXRoPmAgK1xuICAgIGA8L3N2Zz5gLFxuICApO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljaygpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gY29tcGFjdEJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbkNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciB1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGlubGluZS1mbGV4IGgtOCBpdGVtcy1jZW50ZXIgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBib3JkZXIgcHgtMiB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5IGVuYWJsZWQ6aG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI7XG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljaygpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gcm91bmRlZENhcmQoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY2FyZC5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciBmbGV4IGZsZXgtY29sIGRpdmlkZS15LVswLjVweF0gZGl2aWRlLXRva2VuLWJvcmRlciByb3VuZGVkLWxnIGJvcmRlclwiO1xuICBjYXJkLnNldEF0dHJpYnV0ZShcbiAgICBcInN0eWxlXCIsXG4gICAgXCJiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1iYWNrZ3JvdW5kLXBhbmVsLCB2YXIoLS1jb2xvci10b2tlbi1iZy1mb2cpKTtcIixcbiAgKTtcbiAgcmV0dXJuIGNhcmQ7XG59XG5cbmZ1bmN0aW9uIHJvd1NpbXBsZSh0aXRsZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgZ2FwLTNcIjtcbiAgY29uc3Qgc3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBpZiAodGl0bGUpIHtcbiAgICBjb25zdCB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0LmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gICAgdC50ZXh0Q29udGVudCA9IHRpdGxlO1xuICAgIHN0YWNrLmFwcGVuZENoaWxkKHQpO1xuICB9XG4gIGlmIChkZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGQuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICAgIGQudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcbiAgICBzdGFjay5hcHBlbmRDaGlsZChkKTtcbiAgfVxuICBsZWZ0LmFwcGVuZENoaWxkKHN0YWNrKTtcbiAgcm93LmFwcGVuZENoaWxkKGxlZnQpO1xuICByZXR1cm4gcm93O1xufVxuXG4vKipcbiAqIENvZGV4LXN0eWxlZCB0b2dnbGUgc3dpdGNoLiBNYXJrdXAgbWlycm9ycyB0aGUgR2VuZXJhbCA+IFBlcm1pc3Npb25zIHJvd1xuICogc3dpdGNoIHdlIGNhcHR1cmVkOiBvdXRlciBidXR0b24gKHJvbGU9c3dpdGNoKSwgaW5uZXIgcGlsbCwgc2xpZGluZyBrbm9iLlxuICovXG5mdW5jdGlvbiBzd2l0Y2hDb250cm9sKFxuICBpbml0aWFsOiBib29sZWFuLFxuICBvbkNoYW5nZTogKG5leHQ6IGJvb2xlYW4pID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+LFxuKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwic3dpdGNoXCIpO1xuXG4gIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgY29uc3Qga25vYiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBrbm9iLmNsYXNzTmFtZSA9XG4gICAgXCJyb3VuZGVkLWZ1bGwgYm9yZGVyIGJvcmRlci1bY29sb3I6dmFyKC0tZ3JheS0wKV0gYmctW2NvbG9yOnZhcigtLWdyYXktMCldIHNoYWRvdy1zbSB0cmFuc2l0aW9uLXRyYW5zZm9ybSBkdXJhdGlvbi0yMDAgZWFzZS1vdXQgaC00IHctNFwiO1xuICBwaWxsLmFwcGVuZENoaWxkKGtub2IpO1xuXG4gIGNvbnN0IGFwcGx5ID0gKG9uOiBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtY2hlY2tlZFwiLCBTdHJpbmcob24pKTtcbiAgICBidG4uZGF0YXNldC5zdGF0ZSA9IG9uID8gXCJjaGVja2VkXCIgOiBcInVuY2hlY2tlZFwiO1xuICAgIGJ0bi5jbGFzc05hbWUgPVxuICAgICAgXCJpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgdGV4dC1zbSBmb2N1cy12aXNpYmxlOm91dGxpbmUtbm9uZSBmb2N1cy12aXNpYmxlOnJpbmctMiBmb2N1cy12aXNpYmxlOnJpbmctdG9rZW4tZm9jdXMtYm9yZGVyIGZvY3VzLXZpc2libGU6cm91bmRlZC1mdWxsIGN1cnNvci1pbnRlcmFjdGlvblwiO1xuICAgIHBpbGwuY2xhc3NOYW1lID0gYHJlbGF0aXZlIGlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1jb2xvcnMgZHVyYXRpb24tMjAwIGVhc2Utb3V0IGgtNSB3LTggJHtcbiAgICAgIG9uID8gXCJiZy10b2tlbi1jaGFydHMtYmx1ZVwiIDogXCJiZy10b2tlbi1mb3JlZ3JvdW5kLzIwXCJcbiAgICB9YDtcbiAgICBwaWxsLmRhdGFzZXQuc3RhdGUgPSBvbiA/IFwiY2hlY2tlZFwiIDogXCJ1bmNoZWNrZWRcIjtcbiAgICBrbm9iLmRhdGFzZXQuc3RhdGUgPSBvbiA/IFwiY2hlY2tlZFwiIDogXCJ1bmNoZWNrZWRcIjtcbiAgICBrbm9iLnN0eWxlLnRyYW5zZm9ybSA9IG9uID8gXCJ0cmFuc2xhdGVYKDE0cHgpXCIgOiBcInRyYW5zbGF0ZVgoMnB4KVwiO1xuICB9O1xuICBhcHBseShpbml0aWFsKTtcblxuICBidG4uYXBwZW5kQ2hpbGQocGlsbCk7XG4gIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBjb25zdCBuZXh0ID0gYnRuLmdldEF0dHJpYnV0ZShcImFyaWEtY2hlY2tlZFwiKSAhPT0gXCJ0cnVlXCI7XG4gICAgYXBwbHkobmV4dCk7XG4gICAgYnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgb25DaGFuZ2UobmV4dCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIGRvdCgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgcy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZFwiO1xuICBzLnRleHRDb250ZW50ID0gXCJcdTAwQjdcIjtcbiAgcmV0dXJuIHM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVJY29uVXJsKFxuICB1cmw6IHN0cmluZyxcbiAgdHdlYWtEaXI6IHN0cmluZyxcbik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBpZiAoL14oaHR0cHM/OnxkYXRhOikvLnRlc3QodXJsKSkgcmV0dXJuIHVybDtcbiAgLy8gUmVsYXRpdmUgcGF0aCBcdTIxOTIgYXNrIG1haW4gdG8gcmVhZCB0aGUgZmlsZSBhbmQgcmV0dXJuIGEgZGF0YTogVVJMLlxuICAvLyBSZW5kZXJlciBpcyBzYW5kYm94ZWQgc28gZmlsZTovLyB3b24ndCBsb2FkIGRpcmVjdGx5LlxuICBjb25zdCByZWwgPSB1cmwuc3RhcnRzV2l0aChcIi4vXCIpID8gdXJsLnNsaWNlKDIpIDogdXJsO1xuICB0cnkge1xuICAgIHJldHVybiAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgXCJjb2RleHBwOnJlYWQtdHdlYWstYXNzZXRcIixcbiAgICAgIHR3ZWFrRGlyLFxuICAgICAgcmVsLFxuICAgICkpIGFzIHN0cmluZztcbiAgfSBjYXRjaCAoZSkge1xuICAgIHBsb2coXCJpY29uIGxvYWQgZmFpbGVkXCIsIHsgdXJsLCB0d2Vha0RpciwgZXJyOiBTdHJpbmcoZSkgfSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIERPTSBoZXVyaXN0aWNzIFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBmaW5kU2lkZWJhckl0ZW1zR3JvdXAoKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgY2FjaGVkID0gY2FjaGVkU2lkZWJhckl0ZW1zR3JvdXAoKTtcbiAgaWYgKGNhY2hlZCkgcmV0dXJuIGNhY2hlZDtcblxuICBjb25zdCBjYW5kaWRhdGVzID0gQXJyYXkuZnJvbShcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImFzaWRlLG5hdixbcm9sZT0nbmF2aWdhdGlvbiddLGRpdlwiKSxcbiAgKTtcblxuICBsZXQgYmVzdDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgbGV0IGJlc3RTY29yZSA9IC0xO1xuICBsZXQgYmVzdEFyZWEgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG5cbiAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgIGlmIChjYW5kaWRhdGUuZGF0YXNldC5jb2RleHBwKSBjb250aW51ZTtcbiAgICBpZiAoIWlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKGNhbmRpZGF0ZSkpIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbGFiZWxzID0gY29kZXhQcFNldHRpbmdzTGFiZWxzRnJvbShjYW5kaWRhdGUpO1xuICAgIGNvbnN0IHNjb3JlID0gY29kZXhQcFNldHRpbmdzTGFiZWxTY29yZShsYWJlbHMpO1xuICAgIGNvbnN0IHJlY3QgPSBjYW5kaWRhdGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgYXJlYSA9IHJlY3Qud2lkdGggKiByZWN0LmhlaWdodDtcbiAgICBjb25zdCB3ZWlnaHRlZCA9IHNjb3JlLmNvcmUgKiAxMDAgKyBzY29yZS50b3RhbDtcblxuICAgIGlmICh3ZWlnaHRlZCA+IGJlc3RTY29yZSB8fCAod2VpZ2h0ZWQgPT09IGJlc3RTY29yZSAmJiBhcmVhIDwgYmVzdEFyZWEpKSB7XG4gICAgICBiZXN0ID0gY2FuZGlkYXRlO1xuICAgICAgYmVzdFNjb3JlID0gd2VpZ2h0ZWQ7XG4gICAgICBiZXN0QXJlYSA9IGFyZWE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJlc3Q7XG59XG5cbmZ1bmN0aW9uIGNhY2hlZFNpZGViYXJJdGVtc0dyb3VwKCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgc3RhdGUuc2lkZWJhclJvb3QsXG4gICAgc3RhdGUubmF2R3JvdXA/LnBhcmVudEVsZW1lbnQgPz8gbnVsbCxcbiAgICBzdGF0ZS5wYWdlc0dyb3VwPy5wYXJlbnRFbGVtZW50ID8/IG51bGwsXG4gIF07XG5cbiAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgIGlmICghY2FuZGlkYXRlKSBjb250aW51ZTtcbiAgICBpZiAoIWNhbmRpZGF0ZS5pc0Nvbm5lY3RlZCkgY29udGludWU7XG4gICAgaWYgKGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKGNhbmRpZGF0ZSkpIHJldHVybiBjYW5kaWRhdGU7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTWlzcGxhY2VkU2V0dGluZ3NHcm91cHMoKTogdm9pZCB7XG4gIGNvbnN0IGdyb3VwcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFxuICAgIFwiW2RhdGEtY29kZXhwcD0nbmF2LWdyb3VwJ10sIFtkYXRhLWNvZGV4cHA9J3BhZ2VzLWdyb3VwJ10sIFtkYXRhLWNvZGV4cHA9J25hdGl2ZS1uYXYtaGVhZGVyJ11cIixcbiAgKTtcbiAgZm9yIChjb25zdCBncm91cCBvZiBBcnJheS5mcm9tKGdyb3VwcykpIHtcbiAgICBpZiAoaXNDb2RleFBwSW5qZWN0ZWRTZXR0aW5nc0dyb3VwUGxhY2VtZW50VmFsaWQoZ3JvdXApKSBjb250aW51ZTtcbiAgICByZXNldENvZGV4UHBJbmplY3RlZFNldHRpbmdzR3JvdXBTdGF0ZShncm91cCk7XG4gICAgZ3JvdXAucmVtb3ZlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNDb2RleFBwSW5qZWN0ZWRTZXR0aW5nc0dyb3VwUGxhY2VtZW50VmFsaWQoZ3JvdXA6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIGlmIChpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2UoZ3JvdXApKSByZXR1cm4gZmFsc2U7XG5cbiAgbGV0IG5vZGUgPSBncm91cC5wYXJlbnRFbGVtZW50O1xuICBmb3IgKGxldCBkZXB0aCA9IDA7IG5vZGUgJiYgZGVwdGggPCA0OyBkZXB0aCsrKSB7XG4gICAgaWYgKGlzRm9yYmlkZGVuU2V0dGluZ3NTaWRlYmFyU3VyZmFjZShub2RlKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShub2RlKSkgcmV0dXJuIHRydWU7XG4gICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gcmVzZXRDb2RleFBwSW5qZWN0ZWRTZXR0aW5nc0dyb3VwU3RhdGUoZ3JvdXA6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGlmIChzdGF0ZS5uYXZHcm91cCA9PT0gZ3JvdXAgfHwgKHN0YXRlLm5hdkdyb3VwICYmIGdyb3VwLmNvbnRhaW5zKHN0YXRlLm5hdkdyb3VwKSkpIHtcbiAgICBzdGF0ZS5uYXZHcm91cCA9IG51bGw7XG4gICAgc3RhdGUubmF2QnV0dG9ucyA9IG51bGw7XG4gICAgc3RhdGUuY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbiA9IG51bGw7XG4gIH1cbiAgaWYgKHN0YXRlLnBhZ2VzR3JvdXAgPT09IGdyb3VwIHx8IChzdGF0ZS5wYWdlc0dyb3VwICYmIGdyb3VwLmNvbnRhaW5zKHN0YXRlLnBhZ2VzR3JvdXApKSkge1xuICAgIHN0YXRlLnBhZ2VzR3JvdXAgPSBudWxsO1xuICAgIHN0YXRlLnBhZ2VzR3JvdXBLZXkgPSBudWxsO1xuICAgIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkgcC5uYXZCdXR0b24gPSBudWxsO1xuICB9XG4gIGlmIChzdGF0ZS5uYXRpdmVOYXZIZWFkZXIgPT09IGdyb3VwIHx8IChzdGF0ZS5uYXRpdmVOYXZIZWFkZXIgJiYgZ3JvdXAuY29udGFpbnMoc3RhdGUubmF0aXZlTmF2SGVhZGVyKSkpIHtcbiAgICBzdGF0ZS5uYXRpdmVOYXZIZWFkZXIgPSBudWxsO1xuICB9XG4gIGlmIChzdGF0ZS5zaWRlYmFyUm9vdCAmJiBzdGF0ZS5zaWRlYmFyUm9vdC5jb250YWlucyhncm91cCkpIHtcbiAgICBzdGF0ZS5zaWRlYmFyUm9vdCA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmluZENvbnRlbnRBcmVhKCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IHNpZGViYXIgPSBmaW5kU2lkZWJhckl0ZW1zR3JvdXAoKTtcbiAgaWYgKCFzaWRlYmFyKSByZXR1cm4gbnVsbDtcbiAgY29uc3Qgd29ya3NwYWNlUm93ID0gc2lkZWJhci5jbG9zZXN0PEhUTUxFbGVtZW50PignW2RhdGEtYXBwLXNoZWxsLXdvcmtzcGFjZS1yb3ddJyk7XG4gIGlmICh3b3Jrc3BhY2VSb3cpIHtcbiAgICBjb25zdCBzdXJmYWNlcyA9IEFycmF5LmZyb20oXG4gICAgICB3b3Jrc3BhY2VSb3cucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oJ1tkYXRhLWFwcC1zaGVsbC1tYWluLXN1cmZhY2U9XCJkZWZhdWx0XCJdJyksXG4gICAgKS5maWx0ZXIoKHN1cmZhY2UpID0+XG4gICAgICBzdXJmYWNlLmNsb3Nlc3QoJ1tkYXRhLWFwcC1zaGVsbC13b3Jrc3BhY2Utcm93XScpID09PSB3b3Jrc3BhY2VSb3cgJiZcbiAgICAgICFzdXJmYWNlLmNvbnRhaW5zKHNpZGViYXIpICYmICFzaWRlYmFyLmNvbnRhaW5zKHN1cmZhY2UpKTtcbiAgICBjb25zdCBhcmVhcyA9IHN1cmZhY2VzLmZsYXRNYXAoKHN1cmZhY2UpID0+XG4gICAgICBBcnJheS5mcm9tKHN1cmZhY2UucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oJ1tkYXRhLWFwcC1zaGVsbC1mb2N1cy1hcmVhPVwibWFpblwiXScpKVxuICAgICAgICAuZmlsdGVyKChhcmVhKSA9PiBhcmVhLmNsb3Nlc3QoJ1tkYXRhLWFwcC1zaGVsbC1tYWluLXN1cmZhY2U9XCJkZWZhdWx0XCJdJykgPT09IHN1cmZhY2UpXG4gICAgICAgIC5maWx0ZXIoKGFyZWEpID0+IGlzVmlzaWJsZVNldHRpbmdzQ29udGVudChhcmVhLCB3b3Jrc3BhY2VSb3cpKSk7XG4gICAgaWYgKGFyZWFzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGFyZWFzWzBdO1xuICAgIHBsb2coXCJjb250ZW50IGFyZWEgcmVqZWN0ZWRcIiwge1xuICAgICAgcmVhc29uOiBhcmVhcy5sZW5ndGggPT09IDAgPyBcIm5vIHZpc2libGUgbmF0aXZlIG1haW4gaW4gc2V0dGluZ3Mgcm93XCIgOiBcImFtYmlndW91cyBuYXRpdmUgbWFpbiBpbiBzZXR0aW5ncyByb3dcIixcbiAgICB9KTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IG5hdlJvb3QgPSBzaWRlYmFyLmNsb3Nlc3Q8SFRNTEVsZW1lbnQ+KCduYXYsIGFzaWRlLCBbcm9sZT1cIm5hdmlnYXRpb25cIl0sIC5vdmVyZmxvdy15LWF1dG8nKTtcbiAgY29uc3QgbGVnYWN5Um93ID0gbmF2Um9vdD8ucGFyZW50RWxlbWVudDtcbiAgaWYgKCFuYXZSb290IHx8ICFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShuYXZSb290KSB8fCAhbGVnYWN5Um93IHx8IGxlZ2FjeVJvdyA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgIHBsb2coXCJjb250ZW50IGFyZWEgcmVqZWN0ZWRcIiwgeyByZWFzb246IFwibm8gaWRlbnRpZmlhYmxlIGxlZ2FjeSBzZXR0aW5ncyByb3dcIiB9KTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBjYW5kaWRhdGVzID0gQXJyYXkuZnJvbShsZWdhY3lSb3cuY2hpbGRyZW4pXG4gICAgLmZpbHRlcigoY2hpbGQpOiBjaGlsZCBpcyBIVE1MRWxlbWVudCA9PiBjaGlsZCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmICFjaGlsZC5jb250YWlucyhuYXZSb290KSlcbiAgICAuZmlsdGVyKChjaGlsZCkgPT4ge1xuICAgICAgY29uc3QgcmVjdCA9IGNoaWxkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHJlY3Qud2lkdGggPiAzMDAgJiYgcmVjdC5oZWlnaHQgPiAyMDA7XG4gICAgfSlcbiAgICAuZmlsdGVyKChjaGlsZCkgPT4gaXNWaXNpYmxlU2V0dGluZ3NDb250ZW50KGNoaWxkLCBsZWdhY3lSb3cpKVxuICAgIC5maWx0ZXIoKGNoaWxkKSA9PiBnZXRDb21wdXRlZFN0eWxlKGNoaWxkKS5wb3NpdGlvbiAhPT0gXCJhYnNvbHV0ZVwiKTtcbiAgaWYgKGNhbmRpZGF0ZXMubGVuZ3RoID09PSAxKSByZXR1cm4gY2FuZGlkYXRlc1swXTtcbiAgcGxvZyhcImNvbnRlbnQgYXJlYSByZWplY3RlZFwiLCB7XG4gICAgcmVhc29uOiBjYW5kaWRhdGVzLmxlbmd0aCA/IFwiYW1iaWd1b3VzIGxlZ2FjeSBzaWJsaW5nc1wiIDogXCJubyB2aXNpYmxlIGxlZ2FjeSBjb250ZW50XCIsXG4gIH0pO1xuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNWaXNpYmxlU2V0dGluZ3NDb250ZW50KG5vZGU6IEhUTUxFbGVtZW50LCBib3VuZGFyeTogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgaWYgKCFub2RlLmlzQ29ubmVjdGVkKSByZXR1cm4gZmFsc2U7XG4gIGZvciAobGV0IGN1cnJlbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG5vZGU7IGN1cnJlbnQ7IGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudEVsZW1lbnQpIHtcbiAgICBpZiAoY3VycmVudC5oaWRkZW4gfHwgY3VycmVudC5oYXNBdHRyaWJ1dGUoXCJpbmVydFwiKSB8fCBjdXJyZW50LmdldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIpID09PSBcInRydWVcIikgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShjdXJyZW50KTtcbiAgICBpZiAoc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIgfHwgc3R5bGUudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIiB8fCBzdHlsZS52aXNpYmlsaXR5ID09PSBcImNvbGxhcHNlXCIpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoY3VycmVudCA9PT0gYm91bmRhcnkpIGJyZWFrO1xuICB9XG4gIGNvbnN0IHJlY3QgPSBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICByZXR1cm4gcmVjdC53aWR0aCA+IDAgJiYgcmVjdC5oZWlnaHQgPiAwO1xufVxuXG5mdW5jdGlvbiBtYXliZUR1bXBEb20oKTogdm9pZCB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2lkZWJhciA9IGZpbmRTaWRlYmFySXRlbXNHcm91cCgpO1xuICAgIGlmIChzaWRlYmFyICYmICFzdGF0ZS5zaWRlYmFyRHVtcGVkKSB7XG4gICAgICBzdGF0ZS5zaWRlYmFyRHVtcGVkID0gdHJ1ZTtcbiAgICAgIGlmIChpc1NldHRpbmdzRG9tRHVtcEVuYWJsZWQoKSkge1xuICAgICAgICBjb25zdCBzYlJvb3QgPSBzaWRlYmFyLnBhcmVudEVsZW1lbnQgPz8gc2lkZWJhcjtcbiAgICAgICAgcGxvZyhgY29kZXggc2lkZWJhciBIVE1MYCwgc2JSb290Lm91dGVySFRNTC5zbGljZSgwLCAzMjAwMCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBjb250ZW50ID0gZmluZENvbnRlbnRBcmVhKCk7XG4gICAgaWYgKCFjb250ZW50KSB7XG4gICAgICBpZiAoc3RhdGUuZmluZ2VycHJpbnQgIT09IGxvY2F0aW9uLmhyZWYpIHtcbiAgICAgICAgc3RhdGUuZmluZ2VycHJpbnQgPSBsb2NhdGlvbi5ocmVmO1xuICAgICAgICBwbG9nKFwiZG9tIHByb2JlIChubyBjb250ZW50KVwiLCB7XG4gICAgICAgICAgdXJsOiBsb2NhdGlvbi5ocmVmLFxuICAgICAgICAgIHNpZGViYXI6IHNpZGViYXIgPyBkZXNjcmliZShzaWRlYmFyKSA6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgcGFuZWw6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGNvbnRlbnQuY2hpbGRyZW4pIGFzIEhUTUxFbGVtZW50W10pIHtcbiAgICAgIGlmIChjaGlsZC5kYXRhc2V0LmNvZGV4cHAgPT09IFwidHdlYWtzLXBhbmVsXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKGNoaWxkLnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiKSBjb250aW51ZTtcbiAgICAgIHBhbmVsID0gY2hpbGQ7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY29uc3QgYWN0aXZlTmF2ID0gc2lkZWJhclxuICAgICAgPyBBcnJheS5mcm9tKHNpZGViYXIucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCJidXR0b24sIGFcIikpLmZpbmQoXG4gICAgICAgICAgKGIpID0+XG4gICAgICAgICAgICBiLmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSA9PT0gXCJwYWdlXCIgfHxcbiAgICAgICAgICAgIGIuZ2V0QXR0cmlidXRlKFwiZGF0YS1hY3RpdmVcIikgPT09IFwidHJ1ZVwiIHx8XG4gICAgICAgICAgICBiLmdldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIikgPT09IFwidHJ1ZVwiIHx8XG4gICAgICAgICAgICBiLmNsYXNzTGlzdC5jb250YWlucyhcImFjdGl2ZVwiKSxcbiAgICAgICAgKVxuICAgICAgOiBudWxsO1xuICAgIGNvbnN0IGhlYWRpbmcgPSBwYW5lbD8ucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICBcImgxLCBoMiwgaDMsIFtjbGFzcyo9J2hlYWRpbmcnXVwiLFxuICAgICk7XG4gICAgY29uc3QgZmluZ2VycHJpbnQgPSBgJHthY3RpdmVOYXY/LnRleHRDb250ZW50ID8/IFwiXCJ9fCR7aGVhZGluZz8udGV4dENvbnRlbnQgPz8gXCJcIn18JHtwYW5lbD8uY2hpbGRyZW4ubGVuZ3RoID8/IDB9YDtcbiAgICBpZiAoc3RhdGUuZmluZ2VycHJpbnQgPT09IGZpbmdlcnByaW50KSByZXR1cm47XG4gICAgc3RhdGUuZmluZ2VycHJpbnQgPSBmaW5nZXJwcmludDtcbiAgICBwbG9nKFwiZG9tIHByb2JlXCIsIHtcbiAgICAgIHVybDogbG9jYXRpb24uaHJlZixcbiAgICAgIGFjdGl2ZU5hdjogYWN0aXZlTmF2Py50ZXh0Q29udGVudD8udHJpbSgpID8/IG51bGwsXG4gICAgICBoZWFkaW5nOiBoZWFkaW5nPy50ZXh0Q29udGVudD8udHJpbSgpID8/IG51bGwsXG4gICAgICBjb250ZW50OiBkZXNjcmliZShjb250ZW50KSxcbiAgICB9KTtcbiAgICBpZiAocGFuZWwgJiYgaXNTZXR0aW5nc0RvbUR1bXBFbmFibGVkKCkpIHtcbiAgICAgIGNvbnN0IGh0bWwgPSBwYW5lbC5vdXRlckhUTUw7XG4gICAgICBwbG9nKFxuICAgICAgICBgY29kZXggcGFuZWwgSFRNTCAoJHthY3RpdmVOYXY/LnRleHRDb250ZW50Py50cmltKCkgPz8gXCI/XCJ9KWAsXG4gICAgICAgIGh0bWwuc2xpY2UoMCwgMzIwMDApLFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBwbG9nKFwiZG9tIHByb2JlIGZhaWxlZFwiLCBTdHJpbmcoZSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzU2V0dGluZ3NEb21EdW1wRW5hYmxlZCgpOiBib29sZWFuIHtcbiAgcmV0dXJuICh3aW5kb3cgYXMgV2luZG93ICYgeyBfX2NvZGV4cHBEdW1wU2V0dGluZ3NEb20/OiBib29sZWFuIH0pLl9fY29kZXhwcER1bXBTZXR0aW5nc0RvbSA9PT0gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZGVzY3JpYmUoZWw6IEhUTUxFbGVtZW50KTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICByZXR1cm4ge1xuICAgIHRhZzogZWwudGFnTmFtZSxcbiAgICBjbHM6IGVsLmNsYXNzTmFtZS5zbGljZSgwLCAxMjApLFxuICAgIGlkOiBlbC5pZCB8fCB1bmRlZmluZWQsXG4gICAgY2hpbGRyZW46IGVsLmNoaWxkcmVuLmxlbmd0aCxcbiAgICByZWN0OiAoKCkgPT4ge1xuICAgICAgY29uc3QgciA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgcmV0dXJuIHsgdzogTWF0aC5yb3VuZChyLndpZHRoKSwgaDogTWF0aC5yb3VuZChyLmhlaWdodCkgfTtcbiAgICB9KSgpLFxuICB9O1xufVxuXG5mdW5jdGlvbiB0d2Vha3NQYXRoKCk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgKHdpbmRvdyBhcyB1bmtub3duIGFzIHsgX19jb2RleHBwX3R3ZWFrc19kaXJfXz86IHN0cmluZyB9KS5fX2NvZGV4cHBfdHdlYWtzX2Rpcl9fID8/XG4gICAgXCI8dXNlciBkaXI+L3R3ZWFrc1wiXG4gICk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBUd2Vha01hbmlmZXN0IH0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfVFdFQUtfU1RPUkVfSU5ERVhfVVJMID1cbiAgXCJodHRwczovL2twa2h4bGd5MC5naXRodWIuaW8vY29kZXgtcGx1c3BsdXMvc3RvcmUvaW5kZXguanNvblwiO1xuZXhwb3J0IGNvbnN0IFRXRUFLX1NUT1JFX1JFVklFV19JU1NVRV9VUkwgPVxuICBcImh0dHBzOi8vZ2l0aHViLmNvbS9rcGtoeGxneTAvY29kZXgtcGx1c3BsdXMvaXNzdWVzL25ld1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFR3ZWFrU3RvcmVSZWdpc3RyeSB7XG4gIHNjaGVtYVZlcnNpb246IDE7XG4gIGdlbmVyYXRlZEF0Pzogc3RyaW5nO1xuICBlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlRW50cnkge1xuICBpZDogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgcmVwbzogc3RyaW5nO1xuICBhcHByb3ZlZENvbW1pdFNoYTogc3RyaW5nO1xuICBhcHByb3ZlZEF0OiBzdHJpbmc7XG4gIGFwcHJvdmVkQnk6IHN0cmluZztcbiAgcGxhdGZvcm1zPzogVHdlYWtTdG9yZVBsYXRmb3JtW107XG4gIHJlbGVhc2VVcmw/OiBzdHJpbmc7XG4gIHJldmlld1VybD86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgVHdlYWtTdG9yZVBsYXRmb3JtID0gXCJkYXJ3aW5cIiB8IFwid2luMzJcIiB8IFwibGludXhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24ge1xuICByZXBvOiBzdHJpbmc7XG4gIGRlZmF1bHRCcmFuY2g6IHN0cmluZztcbiAgY29tbWl0U2hhOiBzdHJpbmc7XG4gIGNvbW1pdFVybDogc3RyaW5nO1xuICBtYW5pZmVzdD86IHtcbiAgICBpZD86IHN0cmluZztcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHZlcnNpb24/OiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgaWNvblVybD86IHN0cmluZztcbiAgfTtcbn1cblxuY29uc3QgR0lUSFVCX1JFUE9fUkUgPSAvXltBLVphLXowLTlfLi1dK1xcL1tBLVphLXowLTlfLi1dKyQvO1xuY29uc3QgRlVMTF9TSEFfUkUgPSAvXlthLWYwLTldezQwfSQvaTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUdpdEh1YlJlcG8oaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJhdyA9IGlucHV0LnRyaW0oKTtcbiAgaWYgKCFyYXcpIHRocm93IG5ldyBFcnJvcihcIkdpdEh1YiByZXBvIGlzIHJlcXVpcmVkXCIpO1xuXG4gIGNvbnN0IHNzaCA9IC9eZ2l0QGdpdGh1YlxcLmNvbTooW14vXStcXC9bXi9dKz8pKD86XFwuZ2l0KT8kL2kuZXhlYyhyYXcpO1xuICBpZiAoc3NoKSByZXR1cm4gbm9ybWFsaXplUmVwb1BhcnQoc3NoWzFdKTtcblxuICBpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdChyYXcpKSB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChyYXcpO1xuICAgIGlmICh1cmwuaG9zdG5hbWUgIT09IFwiZ2l0aHViLmNvbVwiKSB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IGdpdGh1Yi5jb20gcmVwb3NpdG9yaWVzIGFyZSBzdXBwb3J0ZWRcIik7XG4gICAgY29uc3QgcGFydHMgPSB1cmwucGF0aG5hbWUucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikuc3BsaXQoXCIvXCIpO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoXCJHaXRIdWIgcmVwbyBVUkwgbXVzdCBpbmNsdWRlIG93bmVyIGFuZCByZXBvc2l0b3J5XCIpO1xuICAgIHJldHVybiBub3JtYWxpemVSZXBvUGFydChgJHtwYXJ0c1swXX0vJHtwYXJ0c1sxXX1gKTtcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVSZXBvUGFydChyYXcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3RvcmVSZWdpc3RyeShpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVSZWdpc3RyeSB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gaW5wdXQgYXMgUGFydGlhbDxUd2Vha1N0b3JlUmVnaXN0cnk+IHwgbnVsbDtcbiAgaWYgKCFyZWdpc3RyeSB8fCByZWdpc3RyeS5zY2hlbWFWZXJzaW9uICE9PSAxIHx8ICFBcnJheS5pc0FycmF5KHJlZ2lzdHJ5LmVudHJpZXMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgdHdlYWsgc3RvcmUgcmVnaXN0cnlcIik7XG4gIH1cbiAgY29uc3QgZW50cmllcyA9IHJlZ2lzdHJ5LmVudHJpZXMubWFwKG5vcm1hbGl6ZVN0b3JlRW50cnkpO1xuICBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGEubWFuaWZlc3QubmFtZS5sb2NhbGVDb21wYXJlKGIubWFuaWZlc3QubmFtZSkpO1xuICByZXR1cm4ge1xuICAgIHNjaGVtYVZlcnNpb246IDEsXG4gICAgZ2VuZXJhdGVkQXQ6IHR5cGVvZiByZWdpc3RyeS5nZW5lcmF0ZWRBdCA9PT0gXCJzdHJpbmdcIiA/IHJlZ2lzdHJ5LmdlbmVyYXRlZEF0IDogdW5kZWZpbmVkLFxuICAgIGVudHJpZXMsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaHVmZmxlU3RvcmVFbnRyaWVzPFQ+KFxuICBlbnRyaWVzOiByZWFkb25seSBUW10sXG4gIHJhbmRvbUluZGV4OiAoZXhjbHVzaXZlTWF4OiBudW1iZXIpID0+IG51bWJlciA9IChleGNsdXNpdmVNYXgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGV4Y2x1c2l2ZU1heCksXG4pOiBUW10ge1xuICBjb25zdCBzaHVmZmxlZCA9IFsuLi5lbnRyaWVzXTtcbiAgZm9yIChsZXQgaSA9IHNodWZmbGVkLmxlbmd0aCAtIDE7IGkgPiAwOyBpIC09IDEpIHtcbiAgICBjb25zdCBqID0gcmFuZG9tSW5kZXgoaSArIDEpO1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihqKSB8fCBqIDwgMCB8fCBqID4gaSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBzaHVmZmxlIHJhbmRvbUluZGV4IHJldHVybmVkICR7an07IGV4cGVjdGVkIGFuIGludGVnZXIgZnJvbSAwIHRvICR7aX1gKTtcbiAgICB9XG4gICAgW3NodWZmbGVkW2ldLCBzaHVmZmxlZFtqXV0gPSBbc2h1ZmZsZWRbal0sIHNodWZmbGVkW2ldXTtcbiAgfVxuICByZXR1cm4gc2h1ZmZsZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdG9yZUVudHJ5KGlucHV0OiB1bmtub3duKTogVHdlYWtTdG9yZUVudHJ5IHtcbiAgY29uc3QgZW50cnkgPSBpbnB1dCBhcyBQYXJ0aWFsPFR3ZWFrU3RvcmVFbnRyeT4gfCBudWxsO1xuICBpZiAoIWVudHJ5IHx8IHR5cGVvZiBlbnRyeSAhPT0gXCJvYmplY3RcIikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0d2VhayBzdG9yZSBlbnRyeVwiKTtcbiAgY29uc3QgcmVwbyA9IG5vcm1hbGl6ZUdpdEh1YlJlcG8oU3RyaW5nKGVudHJ5LnJlcG8gPz8gZW50cnkubWFuaWZlc3Q/LmdpdGh1YlJlcG8gPz8gXCJcIikpO1xuICBjb25zdCBtYW5pZmVzdCA9IGVudHJ5Lm1hbmlmZXN0IGFzIFR3ZWFrTWFuaWZlc3QgfCB1bmRlZmluZWQ7XG4gIGlmICghbWFuaWZlc3Q/LmlkIHx8ICFtYW5pZmVzdC5uYW1lIHx8ICFtYW5pZmVzdC52ZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSBmb3IgJHtyZXBvfSBpcyBtaXNzaW5nIG1hbmlmZXN0IGZpZWxkc2ApO1xuICB9XG4gIGlmIChub3JtYWxpemVHaXRIdWJSZXBvKG1hbmlmZXN0LmdpdGh1YlJlcG8pICE9PSByZXBvKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke21hbmlmZXN0LmlkfSByZXBvIGRvZXMgbm90IG1hdGNoIG1hbmlmZXN0IGdpdGh1YlJlcG9gKTtcbiAgfVxuICBpZiAoIWlzRnVsbENvbW1pdFNoYShTdHJpbmcoZW50cnkuYXBwcm92ZWRDb21taXRTaGEgPz8gXCJcIikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke21hbmlmZXN0LmlkfSBtdXN0IHBpbiBhIGZ1bGwgYXBwcm92ZWQgY29tbWl0IFNIQWApO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IG1hbmlmZXN0LmlkLFxuICAgIG1hbmlmZXN0LFxuICAgIHJlcG8sXG4gICAgYXBwcm92ZWRDb21taXRTaGE6IFN0cmluZyhlbnRyeS5hcHByb3ZlZENvbW1pdFNoYSksXG4gICAgYXBwcm92ZWRBdDogdHlwZW9mIGVudHJ5LmFwcHJvdmVkQXQgPT09IFwic3RyaW5nXCIgPyBlbnRyeS5hcHByb3ZlZEF0IDogXCJcIixcbiAgICBhcHByb3ZlZEJ5OiB0eXBlb2YgZW50cnkuYXBwcm92ZWRCeSA9PT0gXCJzdHJpbmdcIiA/IGVudHJ5LmFwcHJvdmVkQnkgOiBcIlwiLFxuICAgIHBsYXRmb3Jtczogbm9ybWFsaXplU3RvcmVQbGF0Zm9ybXMoKGVudHJ5IGFzIHsgcGxhdGZvcm1zPzogdW5rbm93biB9KS5wbGF0Zm9ybXMpLFxuICAgIHJlbGVhc2VVcmw6IG9wdGlvbmFsR2l0aHViVXJsKGVudHJ5LnJlbGVhc2VVcmwpLFxuICAgIHJldmlld1VybDogb3B0aW9uYWxHaXRodWJVcmwoZW50cnkucmV2aWV3VXJsKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQXJjaGl2ZVVybChlbnRyeTogVHdlYWtTdG9yZUVudHJ5KTogc3RyaW5nIHtcbiAgaWYgKCFpc0Z1bGxDb21taXRTaGEoZW50cnkuYXBwcm92ZWRDb21taXRTaGEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke2VudHJ5LmlkfSBpcyBub3QgcGlubmVkIHRvIGEgZnVsbCBjb21taXQgU0hBYCk7XG4gIH1cbiAgcmV0dXJuIGBodHRwczovL2NvZGVsb2FkLmdpdGh1Yi5jb20vJHtlbnRyeS5yZXBvfS90YXIuZ3ovJHtlbnRyeS5hcHByb3ZlZENvbW1pdFNoYX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRUd2Vha1B1Ymxpc2hJc3N1ZVVybChzdWJtaXNzaW9uOiBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24pOiBzdHJpbmcge1xuICBjb25zdCByZXBvID0gbm9ybWFsaXplR2l0SHViUmVwbyhzdWJtaXNzaW9uLnJlcG8pO1xuICBpZiAoIWlzRnVsbENvbW1pdFNoYShzdWJtaXNzaW9uLmNvbW1pdFNoYSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdWJtaXNzaW9uIG11c3QgaW5jbHVkZSB0aGUgZnVsbCBjb21taXQgU0hBIHRvIHJldmlld1wiKTtcbiAgfVxuICBjb25zdCB0aXRsZSA9IGBUd2VhayBzdG9yZSByZXZpZXc6ICR7cmVwb31gO1xuICBjb25zdCBib2R5ID0gW1xuICAgIFwiIyMgVHdlYWsgcmVwb1wiLFxuICAgIGBodHRwczovL2dpdGh1Yi5jb20vJHtyZXBvfWAsXG4gICAgXCJcIixcbiAgICBcIiMjIENvbW1pdCB0byByZXZpZXdcIixcbiAgICBzdWJtaXNzaW9uLmNvbW1pdFNoYSxcbiAgICBzdWJtaXNzaW9uLmNvbW1pdFVybCxcbiAgICBcIlwiLFxuICAgIFwiRG8gbm90IGFwcHJvdmUgYSBkaWZmZXJlbnQgY29tbWl0LiBJZiB0aGUgYXV0aG9yIHB1c2hlcyBjaGFuZ2VzLCBhc2sgdGhlbSB0byByZXN1Ym1pdC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTWFuaWZlc3RcIixcbiAgICBgLSBpZDogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5pZCA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSBuYW1lOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/Lm5hbWUgPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgYC0gdmVyc2lvbjogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py52ZXJzaW9uID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIGRlc2NyaXB0aW9uOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/LmRlc2NyaXB0aW9uID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIGljb25Vcmw6ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8uaWNvblVybCA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQWRtaW4gY2hlY2tsaXN0XCIsXG4gICAgXCItIFsgXSBtYW5pZmVzdC5qc29uIGlzIHZhbGlkXCIsXG4gICAgXCItIFsgXSBtYW5pZmVzdC5pY29uVXJsIGlzIHVzYWJsZSBhcyB0aGUgc3RvcmUgaWNvblwiLFxuICAgIFwiLSBbIF0gc291cmNlIHdhcyByZXZpZXdlZCBhdCB0aGUgZXhhY3QgY29tbWl0IGFib3ZlXCIsXG4gICAgXCItIFsgXSBgc3RvcmUvaW5kZXguanNvbmAgZW50cnkgcGlucyBgYXBwcm92ZWRDb21taXRTaGFgIHRvIHRoZSBleGFjdCBjb21taXQgYWJvdmVcIixcbiAgXS5qb2luKFwiXFxuXCIpO1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKFRXRUFLX1NUT1JFX1JFVklFV19JU1NVRV9VUkwpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcInRlbXBsYXRlXCIsIFwidHdlYWstc3RvcmUtcmV2aWV3Lm1kXCIpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcInRpdGxlXCIsIHRpdGxlKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJib2R5XCIsIGJvZHkpO1xuICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bGxDb21taXRTaGEodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gRlVMTF9TSEFfUkUudGVzdCh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlcG9QYXJ0KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXBvID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL1xcLmdpdCQvaSwgXCJcIikucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIik7XG4gIGlmICghR0lUSFVCX1JFUE9fUkUudGVzdChyZXBvKSkgdGhyb3cgbmV3IEVycm9yKFwiR2l0SHViIHJlcG8gbXVzdCBiZSBpbiBvd25lci9yZXBvIGZvcm1cIik7XG4gIHJldHVybiByZXBvO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdG9yZVBsYXRmb3JtcyhpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVQbGF0Zm9ybVtdIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkpIHRocm93IG5ldyBFcnJvcihcIlN0b3JlIGVudHJ5IHBsYXRmb3JtcyBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICBjb25zdCBhbGxvd2VkID0gbmV3IFNldDxUd2Vha1N0b3JlUGxhdGZvcm0+KFtcImRhcndpblwiLCBcIndpbjMyXCIsIFwibGludXhcIl0pO1xuICBjb25zdCBwbGF0Zm9ybXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoaW5wdXQubWFwKCh2YWx1ZSkgPT4ge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIWFsbG93ZWQuaGFzKHZhbHVlIGFzIFR3ZWFrU3RvcmVQbGF0Zm9ybSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgc3RvcmUgcGxhdGZvcm06ICR7U3RyaW5nKHZhbHVlKX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlIGFzIFR3ZWFrU3RvcmVQbGF0Zm9ybTtcbiAgfSkpKTtcbiAgcmV0dXJuIHBsYXRmb3Jtcy5sZW5ndGggPiAwID8gcGxhdGZvcm1zIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBvcHRpb25hbEdpdGh1YlVybCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIXZhbHVlLnRyaW0oKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdXJsID0gbmV3IFVSTCh2YWx1ZSk7XG4gIGlmICh1cmwucHJvdG9jb2wgIT09IFwiaHR0cHM6XCIgfHwgdXJsLmhvc3RuYW1lICE9PSBcImdpdGh1Yi5jb21cIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIHVybC50b1N0cmluZygpO1xufVxuIiwgImV4cG9ydCBmdW5jdGlvbiBjb21wYWN0U2V0dGluZ3NUZXh0KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gU3RyaW5nKHZhbHVlIHx8IFwiXCIpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpLnRyaW0oKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc05hdGl2ZVNldHRpbmdzU2VjdGlvbkhlYWRlcnMocm9vdDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgY29uc3QgaGVhZGluZ3MgPSBuZXcgU2V0KFtcIlBlcnNvbmFsXCIsIFwiSW50ZWdyYXRpb25zXCIsIFwiQ29kaW5nXCIsIFwiQXJjaGl2ZWRcIl0pO1xuICByZXR1cm4gQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiZGl2LHNwYW5cIikpLnNvbWUoKGVsKSA9PiB7XG4gICAgaWYgKGVsLmRhdGFzZXQuY29kZXhwcCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghaGVhZGluZ3MuaGFzKGNvbXBhY3RTZXR0aW5nc1RleHQoZWwudGV4dENvbnRlbnQgfHwgXCJcIikpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucyhcInRleHQtdG9rZW4taW5wdXQtcGxhY2Vob2xkZXItZm9yZWdyb3VuZFwiKSB8fFxuICAgICAgZWwuY2xhc3NMaXN0LmNvbnRhaW5zKFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiKSB8fFxuICAgICAgZWwuY2xhc3NOYW1lLmluY2x1ZGVzKFwidGV4dC10b2tlblwiKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVDb2RleFBwU2V0dGluZ3NMYWJlbCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGNvbXBhY3RTZXR0aW5nc1RleHQodmFsdWUpXG4gICAgLnRvTG9jYWxlTG93ZXJDYXNlKClcbiAgICAubm9ybWFsaXplKFwiTkZEXCIpXG4gICAgLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1tcdTIwMTlcdTIwMThgXHUwMEI0XS9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAudHJpbSgpO1xufVxuXG5jb25zdCBDT0RFWFBQX0NPUkVfU0VUVElOR1NfTEFCRUxTID0gW1xuICBcIkdlbmVyYWxcIixcbiAgXCJcdTVFMzhcdTg5QzRcIixcbiAgXCJcdTkwMUFcdTc1MjhcIixcbiAgXCJBcHBlYXJhbmNlXCIsXG4gIFwiXHU1OTE2XHU4OUMyXCIsXG4gIFwiQ29uZmlndXJhdGlvblwiLFxuICBcIlx1OTE0RFx1N0Y2RVwiLFxuICBcIlx1OUVEOFx1OEJBNFx1Njc0M1x1OTY1MFwiLFxuICBcIlBlcnNvbmFsaXphdGlvblwiLFxuICBcIlx1NEUyQVx1NjAyN1x1NTMxNlwiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXG5jb25zdCBDT0RFWFBQX0VYVEVOREVEX1NFVFRJTkdTX0xBQkVMUyA9IFtcbiAgXCJBY2NvdW50XCIsXG4gIFwiXHU4RDI2XHU2MjM3XCIsXG4gIFwiXHU4RDI2XHU1M0Y3XCIsXG4gIFwiR2VuZXJhbFwiLFxuICBcIlx1NUUzOFx1ODlDNFwiLFxuICBcIlx1OTAxQVx1NzUyOFwiLFxuICBcIkFwcGVhcmFuY2VcIixcbiAgXCJcdTU5MTZcdTg5QzJcIixcbiAgXCJDb25maWd1cmF0aW9uXCIsXG4gIFwiXHU5MTREXHU3RjZFXCIsXG4gIFwiXHU5RUQ4XHU4QkE0XHU2NzQzXHU5NjUwXCIsXG4gIFwiUGVyc29uYWxpemF0aW9uXCIsXG4gIFwiXHU0RTJBXHU2MDI3XHU1MzE2XCIsXG4gIFwiS2V5Ym9hcmQgc2hvcnRjdXRzXCIsXG4gIFwiQXJjaGl2ZWQgY2hhdHNcIixcbiAgXCJVc2FnZVwiLFxuICBcIkNvbXB1dGVyIHVzZVwiLFxuICBcIkJyb3dzZXIgdXNlXCIsXG4gIFwiTUNQIHNlcnZlcnNcIixcbiAgXCJNQ1AgU2VydmVyc1wiLFxuICBcIk1DUCBcdTY3MERcdTUyQTFcdTU2NjhcIixcbiAgXCJHaXRcIixcbiAgXCJFbnZpcm9ubWVudHNcIixcbiAgXCJcdTczQUZcdTU4ODNcIixcbiAgXCJDbG91ZCBFbnZpcm9ubWVudHNcIixcbiAgXCJXb3JrdHJlZXNcIixcbiAgXCJDb25uZWN0aW9uc1wiLFxuICBcIlBsdWdpbnNcIixcbiAgXCJTa2lsbHNcIixcbl0ubWFwKG5vcm1hbGl6ZUNvZGV4UHBTZXR0aW5nc0xhYmVsKTtcblxuY29uc3QgQ09ERVhQUF9TRVRUSU5HU19PTkxZX0xBQkVMUyA9IFtcbiAgXCJHZW5lcmFsXCIsXG4gIFwiXHU1RTM4XHU4OUM0XCIsXG4gIFwiXHU5MDFBXHU3NTI4XCIsXG4gIFwiQXBwZWFyYW5jZVwiLFxuICBcIlx1NTkxNlx1ODlDMlwiLFxuICBcIkNvbmZpZ3VyYXRpb25cIixcbiAgXCJcdTkxNERcdTdGNkVcIixcbiAgXCJcdTlFRDhcdThCQTRcdTY3NDNcdTk2NTBcIixcbiAgXCJQZXJzb25hbGl6YXRpb25cIixcbiAgXCJcdTRFMkFcdTYwMjdcdTUzMTZcIixcbiAgXCJLZXlib2FyZCBzaG9ydGN1dHNcIixcbiAgXCJBcmNoaXZlZCBjaGF0c1wiLFxuICBcIlVzYWdlXCIsXG4gIFwiQ29tcHV0ZXIgdXNlXCIsXG4gIFwiQnJvd3NlciB1c2VcIixcbiAgXCJNQ1Agc2VydmVyc1wiLFxuICBcIk1DUCBTZXJ2ZXJzXCIsXG4gIFwiTUNQIFx1NjcwRFx1NTJBMVx1NTY2OFwiLFxuICBcIkdpdFwiLFxuICBcIkVudmlyb25tZW50c1wiLFxuICBcIlx1NzNBRlx1NTg4M1wiLFxuICBcIkNsb3VkIEVudmlyb25tZW50c1wiLFxuICBcIldvcmt0cmVlc1wiLFxuICBcIkNvbm5lY3Rpb25zXCIsXG5dLm1hcChub3JtYWxpemVDb2RleFBwU2V0dGluZ3NMYWJlbCk7XG5cbmNvbnN0IENPREVYUFBfTUFJTl9BUFBfTkFWX0xBQkVMUyA9IFtcbiAgXCJOZXcgY2hhdFwiLFxuICBcIlF1aWNrIGNoYXRcIixcbiAgXCJcdTVGRUJcdTkwMUZcdTVCRjlcdThCRERcIixcbiAgXCJTZWFyY2hcIixcbiAgXCJcdTY0MUNcdTdEMjJcIixcbiAgXCJQbHVnaW5zXCIsXG4gIFwiXHU2M0QyXHU0RUY2XCIsXG4gIFwiQXV0b21hdGlvbnNcIixcbiAgXCJBdXRvbWF0aW9uXCIsXG4gIFwiXHU4MUVBXHU1MkE4XHU1MzE2XCIsXG4gIFwiQ2hhdHNcIixcbiAgXCJDaGF0XCIsXG4gIFwiXHU1QkY5XHU4QkREXCIsXG4gIFwiUHJvamVjdHNcIixcbiAgXCJcdTk4NzlcdTc2RUVcIixcbiAgXCJQaW5uZWRcIixcbiAgXCJTZXR0aW5nc1wiLFxuICBcIlx1OEJCRVx1N0Y2RVwiLFxuICBcIldvcmsgbG9jYWxseVwiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXG5leHBvcnQgZnVuY3Rpb24gY29kZXhQcENvbnRyb2xMYWJlbChlbDogSFRNTEVsZW1lbnQpOiBzdHJpbmcge1xuICByZXR1cm4gbm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwoXG4gICAgZWwuZ2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiKSB8fFxuICAgICAgZWwuZ2V0QXR0cmlidXRlKFwidGl0bGVcIikgfHxcbiAgICAgIGVsLnRleHRDb250ZW50IHx8XG4gICAgICBcIlwiLFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29kZXhQcFNldHRpbmdzTGFiZWxzRnJvbShyb290OiBQYXJlbnROb2RlKTogc3RyaW5nW10ge1xuICBjb25zdCBjb250cm9scyA9IEFycmF5LmZyb20oXG4gICAgcm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImJ1dHRvbixhLFtyb2xlPSdidXR0b24nXSxbcm9sZT0nbGluayddXCIpLFxuICApO1xuXG4gIHJldHVybiBbXG4gICAgLi4ubmV3IFNldChcbiAgICAgIGNvbnRyb2xzXG4gICAgICAgIC5tYXAoY29kZXhQcENvbnRyb2xMYWJlbClcbiAgICAgICAgLmZpbHRlcihCb29sZWFuKSxcbiAgICApLFxuICBdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29kZXhQcFNldHRpbmdzTGFiZWxTY29yZShsYWJlbHM6IHN0cmluZ1tdKTogeyBjb3JlOiBudW1iZXI7IHRvdGFsOiBudW1iZXIgfSB7XG4gIGNvbnN0IGNvcmUgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdG90YWwgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICBmb3IgKGNvbnN0IGxhYmVsIG9mIGxhYmVscykge1xuICAgIGZvciAoY29uc3QgbWFya2VyIG9mIENPREVYUFBfQ09SRV9TRVRUSU5HU19MQUJFTFMpIHtcbiAgICAgIGlmIChjb2RleFBwTGFiZWxNYXRjaGVzTWFya2VyKGxhYmVsLCBtYXJrZXIpKSBjb3JlLmFkZChtYXJrZXIpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgbWFya2VyIG9mIENPREVYUFBfRVhURU5ERURfU0VUVElOR1NfTEFCRUxTKSB7XG4gICAgICBpZiAoY29kZXhQcExhYmVsTWF0Y2hlc01hcmtlcihsYWJlbCwgbWFya2VyKSkgdG90YWwuYWRkKG1hcmtlcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHsgY29yZTogY29yZS5zaXplLCB0b3RhbDogdG90YWwuc2l6ZSB9O1xufVxuXG5mdW5jdGlvbiBjb2RleFBwTGFiZWxNYXRjaGVzTWFya2VyKGxhYmVsOiBzdHJpbmcsIG1hcmtlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBsYWJlbCA9PT0gbWFya2VyIHx8IGxhYmVsLmluY2x1ZGVzKG1hcmtlcik7XG59XG5cbmZ1bmN0aW9uIGNvZGV4UHBNYXJrZXJDb3VudChsYWJlbHM6IHN0cmluZ1tdLCBtYXJrZXJzOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIGNvbnN0IG1hdGNoZWQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBsYWJlbCBvZiBsYWJlbHMpIHtcbiAgICBmb3IgKGNvbnN0IG1hcmtlciBvZiBtYXJrZXJzKSB7XG4gICAgICBpZiAoY29kZXhQcExhYmVsTWF0Y2hlc01hcmtlcihsYWJlbCwgbWFya2VyKSkgbWF0Y2hlZC5hZGQobWFya2VyKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZWQuc2l6ZTtcbn1cblxuZnVuY3Rpb24gaGFzQ29kZXhQcFNldHRpbmdzT25seVNpZ25hbChsYWJlbHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RleFBwTWFya2VyQ291bnQobGFiZWxzLCBDT0RFWFBQX1NFVFRJTkdTX09OTFlfTEFCRUxTKSA+IDA7XG59XG5cbmZ1bmN0aW9uIGhhc01haW5BcHBTaWRlYmFyU2lnbmFscyhsYWJlbHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIHJldHVybiBjb2RleFBwTWFya2VyQ291bnQobGFiZWxzLCBDT0RFWFBQX01BSU5fQVBQX05BVl9MQUJFTFMpID49IDI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0KGxhYmVsczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgY29uc3Qgc2NvcmUgPSBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlKGxhYmVscyk7XG4gIHJldHVybiBzY29yZS5jb3JlID49IDIgJiYgc2NvcmUudG90YWwgPj0gMztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvZGV4UHBWaXNpYmxlQm94KGVsOiBIVE1MRWxlbWVudCk6IERPTVJlY3QgfCBudWxsIHtcbiAgaWYgKCFlbC5pc0Nvbm5lY3RlZCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gIGlmIChzdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fCBzdHlsZS52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGlmIChyZWN0LndpZHRoIDw9IDAgfHwgcmVjdC5oZWlnaHQgPD0gMCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiByZWN0O1xufVxuXG5jb25zdCBGT1JCSURERU5fU0VUVElOR1NfU0lERUJBUl9TRUxFQ1RPUiA9IFtcbiAgXCJbZGF0YS1jb21wb3Nlci1vdmVybGF5LWZsb2F0aW5nLXVpPSd0cnVlJ11cIixcbiAgXCJbZGF0YS1jb2RleHBwLXNsYXNoLW1lbnU9J3RydWUnXVwiLFxuICBcIltkYXRhLWNvZGV4cHAtb3ZlcmxheS1ub2lzZT0ndHJ1ZSddXCIsXG4gIFwiLmNvbXBvc2VyLWhvbWUtdG9wLW1lbnVcIixcbiAgXCJbY2xhc3MqPSdbY29udGFpbmVyLW5hbWU6aG9tZS1tYWluLWNvbnRlbnRdJ11cIixcbl0uam9pbihcIixcIik7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2Uobm9kZTogRWxlbWVudCB8IG51bGwpOiBib29sZWFuIHtcbiAgaWYgKCFub2RlKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGVsID0gbm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ID8gbm9kZSA6IG5vZGUucGFyZW50RWxlbWVudDtcbiAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlO1xuICBpZiAoZWwuY2xvc2VzdChGT1JCSURERU5fU0VUVElOR1NfU0lERUJBUl9TRUxFQ1RPUikpIHJldHVybiB0cnVlO1xuICBpZiAoZWwucXVlcnlTZWxlY3RvcihcIltkYXRhLWxpc3QtbmF2aWdhdGlvbi1pdGVtPSd0cnVlJ10sIFtjbWRrLWl0ZW1dXCIpKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUoZWw6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIC8vIFVzZSB0aGUgc2FtZSBleGNsdXNpb25zIHdoZW4gc2VsZWN0aW5nIGEgaG9zdCBhbmQgdmFsaWRhdGluZyBpbmplY3RlZFxuICAvLyBncm91cHMuIE90aGVyd2lzZSBjbGVhbnVwIHJlbW92ZXMgZ3JvdXBzIHRoYXQgdGhlIG5leHQgcGFzcyByZWluc2VydHMuXG4gIC8vIFRoZSBnZW5lcmljIHZlcnRpY2FsLXNjcm9sbC1mYWRlLW1hc2sgY2xhc3MgYWxzbyBhcHBlYXJzIGluIFNldHRpbmdzO1xuICAvLyBvbmx5IHRoZSBjb21wb3Nlci9vdmVybGF5LXNwZWNpZmljIG1hcmtlcnMgYWJvdmUgaWRlbnRpZnkgZm9yYmlkZGVuIGhvc3RzLlxuICBpZiAoaXNGb3JiaWRkZW5TZXR0aW5nc1NpZGViYXJTdXJmYWNlKGVsKSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCByZWN0ID0gY29kZXhQcFZpc2libGVCb3goZWwpO1xuICBpZiAoIXJlY3QpIHJldHVybiBmYWxzZTtcblxuICAvLyBDdXJyZW50IENvZGV4IFNldHRpbmdzIHNpZGViYXI6IGxlZnQgY29sdW1uLCBub3QgdGhlIG1haW4gY29udGVudCBwYW5lbC5cbiAgaWYgKHJlY3Qud2lkdGggPCAxMjAgfHwgcmVjdC53aWR0aCA+IDYyMCkgcmV0dXJuIGZhbHNlO1xuICBpZiAocmVjdC5oZWlnaHQgPCA4MCkgcmV0dXJuIGZhbHNlO1xuICBpZiAocmVjdC5sZWZ0ID4gd2luZG93LmlubmVyV2lkdGggKiAwLjY1KSByZXR1cm4gZmFsc2U7XG5cbiAgY29uc3QgbGFiZWxzID0gY29kZXhQcFNldHRpbmdzTGFiZWxzRnJvbShlbCk7XG4gIGlmIChoYXNNYWluQXBwU2lkZWJhclNpZ25hbHMobGFiZWxzKSAmJiAhaGFzQ29kZXhQcFNldHRpbmdzT25seVNpZ25hbChsYWJlbHMpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGlzQ29kZXhQcFNldHRpbmdzTGFiZWxTZXQobGFiZWxzKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gY29uZmlnSWNvblN2ZygpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tc20gaW5saW5lLWJsb2NrIGFsaWduLW1pZGRsZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTMgNWg5TTE1IDVoMk0zIDEwaDJNOCAxMGg5TTMgMTVoMTFNMTcgMTVoMFwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIi8+YCArXG4gICAgYDxjaXJjbGUgY3g9XCIxM1wiIGN5PVwiNVwiIHI9XCIxLjZcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPmAgK1xuICAgIGA8Y2lyY2xlIGN4PVwiNlwiIGN5PVwiMTBcIiByPVwiMS42XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcbiAgICBgPGNpcmNsZSBjeD1cIjE1XCIgY3k9XCIxNVwiIHI9XCIxLjZcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0d2Vha3NJY29uU3ZnKCk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgYDxzdmcgd2lkdGg9XCIyMFwiIGhlaWdodD1cIjIwXCIgdmlld0JveD1cIjAgMCAyMCAyMFwiIGZpbGw9XCJub25lXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIGNsYXNzPVwiaWNvbi1zbSBpbmxpbmUtYmxvY2sgYWxpZ24tbWlkZGxlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXG4gICAgYDxwYXRoIGQ9XCJNMTAgMi41IEwxMS40IDguNiBMMTcuNSAxMCBMMTEuNCAxMS40IEwxMCAxNy41IEw4LjYgMTEuNCBMMi41IDEwIEw4LjYgOC42IFpcIiBmaWxsPVwiY3VycmVudENvbG9yXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTE1LjUgMyBMMTYgNSBMMTggNS41IEwxNiA2IEwxNS41IDggTDE1IDYgTDEzIDUuNSBMMTUgNSBaXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiIG9wYWNpdHk9XCIwLjdcIi8+YCArXG4gICAgYDwvc3ZnPmBcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlSWNvblN2ZygpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tc20gaW5saW5lLWJsb2NrIGFsaWduLW1pZGRsZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTQgOC4yIDUuMSA0LjVBMS41IDEuNSAwIDAgMSA2LjU1IDMuNGg2LjlhMS41IDEuNSAwIDAgMSAxLjQ1IDEuMUwxNiA4LjJcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPHBhdGggZD1cIk00LjUgOGgxMXY3LjVBMS41IDEuNSAwIDAgMSAxNCAxN0g2YTEuNSAxLjUgMCAwIDEtMS41LTEuNVY4WlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTcuNSA4djFhMi41IDIuNSAwIDAgMCA1IDBWOFwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIi8+YCArXG4gICAgYDwvc3ZnPmBcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZmF1bHRQYWdlSWNvblN2ZygpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tc20gaW5saW5lLWJsb2NrIGFsaWduLW1pZGRsZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTUgM2g3bDMgM3YxMWExIDEgMCAwIDEtMSAxSDVhMSAxIDAgMCAxLTEtMVY0YTEgMSAwIDAgMSAxLTFaXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNMTIgM3YzYTEgMSAwIDAgMCAxIDFoMlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTcgMTFoNk03IDE0aDRcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoSWNvblN2ZygpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGA8c3ZnIHdpZHRoPVwiMThcIiBoZWlnaHQ9XCIxOFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIGNsYXNzPVwiaWNvbi14c1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTQuNCA5LjM1QTUuNjUgNS42NSAwIDAgMSAxNCA1LjNMMTUuNzUgN00xNS43NSAzLjc1VjdoLTMuMjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNMTUuNiAxMC42NUE1LjY1IDUuNjUgMCAwIDEgNiAxNC43TDQuMjUgMTNNNC4yNSAxNi4yNVYxM0g3LjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDwvc3ZnPmBcbiAgKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gYXBwZW5kU3ZnSHRtbChwYXJlbnQ6IEhUTUxFbGVtZW50LCBzdmc6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBlbCA9IHN2Z0VsZW1lbnQoc3ZnKTtcbiAgaWYgKGVsKSBwYXJlbnQuYXBwZW5kQ2hpbGQoZWwpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3ZnRWxlbWVudChzdmc6IHN0cmluZyk6IEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG4gIHRlbXBsYXRlLmlubmVySFRNTCA9IHN2Zy50cmltKCk7XG4gIGNvbnN0IGVsID0gdGVtcGxhdGUuY29udGVudC5maXJzdEVsZW1lbnRDaGlsZDtcbiAgaWYgKCFlbCB8fCBlbC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgIT09IFwic3ZnXCIpIHJldHVybiBudWxsO1xuICByZXR1cm4gZWw7XG59XG4iLCAiLyoqXG4gKiBSZW5kZXJlci1zaWRlIHR3ZWFrIGhvc3QuIFdlOlxuICogICAxLiBBc2sgbWFpbiBmb3IgdGhlIHR3ZWFrIGxpc3QgKHdpdGggcmVzb2x2ZWQgZW50cnkgcGF0aCkuXG4gKiAgIDIuIEZvciBlYWNoIHJlbmRlcmVyLXNjb3BlZCAob3IgXCJib3RoXCIpIHR3ZWFrLCBmZXRjaCBpdHMgc291cmNlIHZpYSBJUENcbiAqICAgICAgYW5kIGV4ZWN1dGUgaXQgYXMgYSBDb21tb25KUy1zaGFwZWQgZnVuY3Rpb24uXG4gKiAgIDMuIFByb3ZpZGUgaXQgdGhlIHJlbmRlcmVyIGhhbGYgb2YgdGhlIEFQSS5cbiAqXG4gKiBDb2RleCBydW5zIHRoZSByZW5kZXJlciB3aXRoIHNhbmRib3g6IHRydWUsIHNvIE5vZGUncyBgcmVxdWlyZSgpYCBpc1xuICogcmVzdHJpY3RlZCB0byBhIHRpbnkgd2hpdGVsaXN0IChlbGVjdHJvbiArIGEgZmV3IHBvbHlmaWxscykuIFRoYXQgbWVhbnMgd2VcbiAqIGNhbm5vdCBgcmVxdWlyZSgpYCBhcmJpdHJhcnkgdHdlYWsgZmlsZXMgZnJvbSBkaXNrLiBJbnN0ZWFkIHdlIHB1bGwgdGhlXG4gKiBzb3VyY2Ugc3RyaW5nIGZyb20gbWFpbiBhbmQgZXZhbHVhdGUgaXQgd2l0aCBgbmV3IEZ1bmN0aW9uYCBpbnNpZGUgdGhlXG4gKiBwcmVsb2FkIGNvbnRleHQuIFR3ZWFrIGF1dGhvcnMgd2hvIG5lZWQgbnBtIGRlcHMgbXVzdCBidW5kbGUgdGhlbSBpbi5cbiAqL1xuXG5pbXBvcnQgeyBpcGNSZW5kZXJlciB9IGZyb20gXCJlbGVjdHJvblwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJTZWN0aW9uLCByZWdpc3RlclBhZ2UsIGNsZWFyU2VjdGlvbnMsIHNldExpc3RlZFR3ZWFrcyB9IGZyb20gXCIuL3NldHRpbmdzLWluamVjdG9yXCI7XG5pbXBvcnQgeyBmaWJlckZvck5vZGUgfSBmcm9tIFwiLi9yZWFjdC1ob29rXCI7XG5pbXBvcnQgeyB3YWl0Rm9yRWxlbWVudCwgY2FuY2VsQWxsRWxlbWVudFdhaXRlcnMgfSBmcm9tIFwiLi9lbGVtZW50LXdhaXRlclwiO1xuaW1wb3J0IHsgY3JlYXRlVHdlYWtNb2R1bGVMb2FkZXIgfSBmcm9tIFwiLi90d2Vhay1tb2R1bGUtbG9hZGVyXCI7XG5pbXBvcnQgeyBkaXNwb3NlU2lkZWJhckFjdGlvbnNGb3JUd2VhaywgcmVuZGVyZXJTaWRlYmFyQXBpIH0gZnJvbSBcIi4vbWFpbi1zaWRlYmFyLWFjdGlvbnNcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ29kZXhDZHBTdGF0dXMsXG4gIENvZGV4Q2RwVGFyZ2V0LFxuICBDb2RleE1vZGVsR2VuZXJhdGVPYmplY3RPcHRpb25zLFxuICBDb2RleE1vZGVsR2VuZXJhdGVUZXh0T3B0aW9ucyxcbiAgQ29kZXhNb2RlbE9iamVjdFJlc3VsdCxcbiAgQ29kZXhNb2RlbFRleHRSZXN1bHQsXG4gIENvZGV4UnVudGltZUNhcGFiaWxpdGllcyxcbiAgQ29kZXhSdW50aW1lSW5mbyxcbiAgQ29kZXhWaWV3UmVmLFxuICBDb2RleFdpbmRvd1JlZixcbiAgTmF0aXZlSGVscGVyUmVmLFxuICBOYXRpdmVNb2R1bGVLaW5kLFxuICBOYXRpdmVNb2R1bGVSZWYsXG4gIE5hdGl2ZVBhbmVsUmVmLFxuICBOYXRpdmVWaWV3UmVmLFxuICBUd2Vha01hbmlmZXN0LFxuICBUd2Vha0FwaSxcbiAgUmVhY3RGaWJlck5vZGUsXG4gIFR3ZWFrLFxufSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5pbnRlcmZhY2UgTGlzdGVkVHdlYWsge1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgZW50cnk6IHN0cmluZztcbiAgZGlyOiBzdHJpbmc7XG4gIGVudHJ5RXhpc3RzOiBib29sZWFuO1xuICBlbmFibGVkOiBib29sZWFuO1xuICB1cGRhdGU6IHtcbiAgICBjaGVja2VkQXQ6IHN0cmluZztcbiAgICByZXBvOiBzdHJpbmc7XG4gICAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgICBsYXRlc3RWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICAgIGxhdGVzdFRhZzogc3RyaW5nIHwgbnVsbDtcbiAgICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICAgIHVwZGF0ZUF2YWlsYWJsZTogYm9vbGVhbjtcbiAgICBlcnJvcj86IHN0cmluZztcbiAgfSB8IG51bGw7XG59XG5cbmludGVyZmFjZSBVc2VyUGF0aHMge1xuICB1c2VyUm9vdDogc3RyaW5nO1xuICBydW50aW1lRGlyOiBzdHJpbmc7XG4gIHR3ZWFrc0Rpcjogc3RyaW5nO1xuICBsb2dEaXI6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEVsZWN0cm9uQnJpZGdlIHtcbiAgZ2V0QnVpbGRGbGF2b3I/OiAoKSA9PiBzdHJpbmcgfCBudWxsO1xuICB1c2VzT3dsQXBwU2hlbGw/OiAoKSA9PiBib29sZWFuO1xufVxuXG5jb25zdCBsb2FkZWQgPSBuZXcgTWFwPHN0cmluZywgeyBzdG9wPzogKCkgPT4gdm9pZCB9PigpO1xudHlwZSBNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lciA9IChtZXNzYWdlOiB1bmtub3duKSA9PiB1bmtub3duIHwgdW5kZWZpbmVkO1xuY29uc3QgbWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzID0gbmV3IFNldDxNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcj4oKTtcblxuaW5zdGFsbEJyaWRnZUhvb2tzKCk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFydFR3ZWFrSG9zdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdHdlYWtzID0gKGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bGlzdC10d2Vha3NcIikpIGFzIExpc3RlZFR3ZWFrW107XG4gIGNvbnN0IHBhdGhzID0gKGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dXNlci1wYXRoc1wiKSkgYXMgVXNlclBhdGhzO1xuICAvLyBQdXNoIHRoZSBsaXN0IHRvIHRoZSBzZXR0aW5ncyBpbmplY3RvciBzbyB0aGUgVHdlYWtzIHBhZ2UgY2FuIHJlbmRlclxuICAvLyBjYXJkcyBldmVuIGJlZm9yZSBhbnkgdHdlYWsncyBzdGFydCgpIHJ1bnMgKGFuZCBmb3IgZGlzYWJsZWQgdHdlYWtzXG4gIC8vIHRoYXQgd2UgbmV2ZXIgbG9hZCkuXG4gIHNldExpc3RlZFR3ZWFrcyh0d2Vha3MpO1xuICAvLyBTdGFzaCBmb3IgdGhlIHNldHRpbmdzIGluamVjdG9yJ3MgZW1wdHktc3RhdGUgbWVzc2FnZS5cbiAgKHdpbmRvdyBhcyB1bmtub3duIGFzIHsgX19jb2RleHBwX3R3ZWFrc19kaXJfXz86IHN0cmluZyB9KS5fX2NvZGV4cHBfdHdlYWtzX2Rpcl9fID1cbiAgICBwYXRocy50d2Vha3NEaXI7XG5cbiAgZm9yIChjb25zdCB0IG9mIHR3ZWFrcykge1xuICAgIGlmICh0Lm1hbmlmZXN0LnNjb3BlID09PSBcIm1haW5cIikgY29udGludWU7XG4gICAgaWYgKCF0LmVudHJ5RXhpc3RzKSBjb250aW51ZTtcbiAgICBpZiAoIXQuZW5hYmxlZCkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGxvYWRUd2Vhayh0LCBwYXRocyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihcIltjb2RleC1wbHVzcGx1c10gdHdlYWsgbG9hZCBmYWlsZWQ6XCIsIHQubWFuaWZlc3QuaWQsIGUpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaXBjUmVuZGVyZXIuc2VuZChcbiAgICAgICAgICBcImNvZGV4cHA6cHJlbG9hZC1sb2dcIixcbiAgICAgICAgICBcImVycm9yXCIsXG4gICAgICAgICAgXCJ0d2VhayBsb2FkIGZhaWxlZDogXCIgKyB0Lm1hbmlmZXN0LmlkICsgXCI6IFwiICsgU3RyaW5nKChlIGFzIEVycm9yKT8uc3RhY2sgPz8gZSksXG4gICAgICAgICk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuICB9XG5cbiAgY29uc29sZS5pbmZvKFxuICAgIGBbY29kZXgtcGx1c3BsdXNdIHJlbmRlcmVyIGhvc3QgbG9hZGVkICR7bG9hZGVkLnNpemV9IHR3ZWFrKHMpOmAsXG4gICAgWy4uLmxvYWRlZC5rZXlzKCldLmpvaW4oXCIsIFwiKSB8fCBcIihub25lKVwiLFxuICApO1xuICBpcGNSZW5kZXJlci5zZW5kKFxuICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxuICAgIFwiaW5mb1wiLFxuICAgIGByZW5kZXJlciBob3N0IGxvYWRlZCAke2xvYWRlZC5zaXplfSB0d2VhayhzKTogJHtbLi4ubG9hZGVkLmtleXMoKV0uam9pbihcIiwgXCIpIHx8IFwiKG5vbmUpXCJ9YCxcbiAgKTtcbn1cblxuLyoqXG4gKiBTdG9wIGV2ZXJ5IHJlbmRlcmVyLXNjb3BlIHR3ZWFrIHNvIGEgc3Vic2VxdWVudCBgc3RhcnRUd2Vha0hvc3QoKWAgd2lsbFxuICogcmUtZXZhbHVhdGUgZnJlc2ggc291cmNlLiBNb2R1bGUgY2FjaGUgaXNuJ3QgcmVsZXZhbnQgc2luY2Ugd2UgZXZhbFxuICogc291cmNlIHN0cmluZ3MgZGlyZWN0bHkgXHUyMDE0IGVhY2ggbG9hZCBjcmVhdGVzIGEgZnJlc2ggc2NvcGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZWFyZG93blR3ZWFrSG9zdCgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBbaWQsIHRdIG9mIGxvYWRlZCkge1xuICAgIHRyeSB7XG4gICAgICB0LnN0b3A/LigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltjb2RleC1wbHVzcGx1c10gdHdlYWsgc3RvcCBmYWlsZWQ6XCIsIGlkLCBlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctZGlzcG9zZS10d2Vha1wiLCBpZCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1kaXNwb3NlLXR3ZWFrXCIsIGlkKS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgICBkaXNwb3NlU2lkZWJhckFjdGlvbnNGb3JUd2VhayhpZCk7XG4gICAgfVxuICB9XG4gIGxvYWRlZC5jbGVhcigpO1xuICBjYW5jZWxBbGxFbGVtZW50V2FpdGVycyhcInR3ZWFrIGhvc3QgdGVhcmRvd25cIik7XG4gIGNsZWFyU2VjdGlvbnMoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZFR3ZWFrKHQ6IExpc3RlZFR3ZWFrLCBwYXRoczogVXNlclBhdGhzKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNvdXJjZSA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgXCJjb2RleHBwOnJlYWQtdHdlYWstc291cmNlXCIsXG4gICAgdC5lbnRyeSxcbiAgKSkgYXMgc3RyaW5nO1xuXG4gIC8vIEV2YWx1YXRlIGFzIENKUy1zaGFwZWQ6IHByb3ZpZGUgbW9kdWxlL2V4cG9ydHMvYXBpLiBUd2VhayBjb2RlIG1heSB1c2VcbiAgLy8gYG1vZHVsZS5leHBvcnRzID0geyBzdGFydCwgc3RvcCB9YCBvciBgZXhwb3J0cy5zdGFydCA9IC4uLmAgb3IgcHVyZSBFU01cbiAgLy8gZGVmYXVsdCBleHBvcnQgc2hhcGUgKHdlIGFjY2VwdCBib3RoKS5cbiAgY29uc3QgbG9hZGVyID0gY3JlYXRlVHdlYWtNb2R1bGVMb2FkZXIoe1xuICAgIG1hbmlmZXN0SWQ6IHQubWFuaWZlc3QuaWQsXG4gICAgZW50cnk6IHQuZW50cnksXG4gICAgZGlyOiB0LmRpcixcbiAgICByZWFkU291cmNlOiByZWFkVHdlYWtTb3VyY2VTeW5jLFxuICAgIGZhbGxiYWNrUmVxdWlyZTogcmVuZGVyZXJGYWxsYmFja1JlcXVpcmUsXG4gICAgY29uc29sZSxcbiAgfSk7XG4gIGNvbnN0IG1vZCA9IGxvYWRlci5sb2FkRW50cnkoc291cmNlKSBhcyB7IGRlZmF1bHQ/OiBUd2VhayB9ICYgVHdlYWs7XG4gIGNvbnN0IHR3ZWFrOiBUd2VhayA9IChtb2QgYXMgeyBkZWZhdWx0PzogVHdlYWsgfSkuZGVmYXVsdCA/PyAobW9kIGFzIFR3ZWFrKTtcbiAgaWYgKHR5cGVvZiB0d2Vhaz8uc3RhcnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRocm93IG5ldyBFcnJvcihgdHdlYWsgJHt0Lm1hbmlmZXN0LmlkfSBoYXMgbm8gc3RhcnQoKWApO1xuICB9XG4gIGNvbnN0IGFwaSA9IG1ha2VSZW5kZXJlckFwaSh0Lm1hbmlmZXN0LCBwYXRocyk7XG4gIGF3YWl0IHR3ZWFrLnN0YXJ0KGFwaSk7XG4gIGxvYWRlZC5zZXQodC5tYW5pZmVzdC5pZCwgeyBzdG9wOiB0d2Vhay5zdG9wPy5iaW5kKHR3ZWFrKSB9KTtcbn1cblxuZnVuY3Rpb24gcmVhZFR3ZWFrU291cmNlU3luYyhlbnRyeVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJlc3VsdCA9IGlwY1JlbmRlcmVyLnNlbmRTeW5jKFwiY29kZXhwcDpyZWFkLXR3ZWFrLXNvdXJjZS1zeW5jXCIsIGVudHJ5UGF0aCkgYXNcbiAgICB8IHsgb2s6IHRydWU7IHNvdXJjZTogc3RyaW5nIH1cbiAgICB8IHsgb2s6IGZhbHNlOyBlcnJvcj86IHN0cmluZyB9O1xuICBpZiAocmVzdWx0Py5vayA9PT0gdHJ1ZSkgcmV0dXJuIHJlc3VsdC5zb3VyY2U7XG4gIHRocm93IG5ldyBFcnJvcihyZXN1bHQ/LmVycm9yIHx8IGBVbmFibGUgdG8gcmVhZCB0d2VhayBzb3VyY2U6ICR7ZW50cnlQYXRofWApO1xufVxuXG5mdW5jdGlvbiByZW5kZXJlckZhbGxiYWNrUmVxdWlyZShyZXF1ZXN0OiBzdHJpbmcpOiB1bmtub3duIHtcbiAgY29uc3QgZmFsbGJhY2sgPSAoZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIHsgcmVxdWlyZT86IChpZDogc3RyaW5nKSA9PiB1bmtub3duIH0pLnJlcXVpcmU7XG4gIGlmICh0eXBlb2YgZmFsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbGxiYWNrKHJlcXVlc3QpO1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYFJlbmRlcmVyIHR3ZWFrIHJlcXVpcmUgb25seSBzdXBwb3J0cyByZWxhdGl2ZSBmaWxlczsgYnVuZGxlIGRlcGVuZGVuY3kgXCIke3JlcXVlc3R9XCIgaW50byB0aGUgdHdlYWsgZW50cnlgLFxuICApO1xufVxuXG5mdW5jdGlvbiBtYWtlUmVuZGVyZXJBcGkobWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3QsIHBhdGhzOiBVc2VyUGF0aHMpOiBUd2Vha0FwaSB7XG4gIGNvbnN0IGlkID0gbWFuaWZlc3QuaWQ7XG4gIGNvbnN0IGxvZyA9IChsZXZlbDogXCJkZWJ1Z1wiIHwgXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiwgLi4uYTogdW5rbm93bltdKSA9PiB7XG4gICAgY29uc3QgY29uc29sZUZuID1cbiAgICAgIGxldmVsID09PSBcImRlYnVnXCIgPyBjb25zb2xlLmRlYnVnXG4gICAgICA6IGxldmVsID09PSBcIndhcm5cIiA/IGNvbnNvbGUud2FyblxuICAgICAgOiBsZXZlbCA9PT0gXCJlcnJvclwiID8gY29uc29sZS5lcnJvclxuICAgICAgOiBjb25zb2xlLmxvZztcbiAgICBjb25zb2xlRm4oYFtjb2RleC1wbHVzcGx1c11bJHtpZH1dYCwgLi4uYSk7XG4gICAgLy8gQWxzbyBtaXJyb3IgdG8gbWFpbidzIGxvZyBmaWxlIHNvIHdlIGNhbiBkaWFnbm9zZSB0d2VhayBiZWhhdmlvclxuICAgIC8vIHdpdGhvdXQgYXR0YWNoaW5nIERldlRvb2xzLiBTdHJpbmdpZnkgZWFjaCBhcmcgZGVmZW5zaXZlbHkuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcnRzID0gYS5tYXAoKHYpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSByZXR1cm4gdjtcbiAgICAgICAgaWYgKHYgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuIGAke3YubmFtZX06ICR7di5tZXNzYWdlfWA7XG4gICAgICAgIHRyeSB7IHJldHVybiBKU09OLnN0cmluZ2lmeSh2KTsgfSBjYXRjaCB7IHJldHVybiBTdHJpbmcodik7IH1cbiAgICAgIH0pO1xuICAgICAgaXBjUmVuZGVyZXIuc2VuZChcbiAgICAgICAgXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsXG4gICAgICAgIGxldmVsLFxuICAgICAgICBgW3R3ZWFrICR7aWR9XSAke3BhcnRzLmpvaW4oXCIgXCIpfWAsXG4gICAgICApO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLyogc3dhbGxvdyBcdTIwMTQgbmV2ZXIgbGV0IGxvZ2dpbmcgYnJlYWsgYSB0d2VhayAqL1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG1hbmlmZXN0LFxuICAgIHByb2Nlc3M6IFwicmVuZGVyZXJcIixcbiAgICBsb2c6IHtcbiAgICAgIGRlYnVnOiAoLi4uYSkgPT4gbG9nKFwiZGVidWdcIiwgLi4uYSksXG4gICAgICBpbmZvOiAoLi4uYSkgPT4gbG9nKFwiaW5mb1wiLCAuLi5hKSxcbiAgICAgIHdhcm46ICguLi5hKSA9PiBsb2coXCJ3YXJuXCIsIC4uLmEpLFxuICAgICAgZXJyb3I6ICguLi5hKSA9PiBsb2coXCJlcnJvclwiLCAuLi5hKSxcbiAgICB9LFxuICAgIHN0b3JhZ2U6IHJlbmRlcmVyU3RvcmFnZShpZCksXG4gICAgc2V0dGluZ3M6IHtcbiAgICAgIHJlZ2lzdGVyOiAocykgPT4gcmVnaXN0ZXJTZWN0aW9uKHsgLi4ucywgaWQ6IGAke2lkfToke3MuaWR9YCB9KSxcbiAgICAgIHJlZ2lzdGVyUGFnZTogKHApID0+XG4gICAgICAgIHJlZ2lzdGVyUGFnZShpZCwgbWFuaWZlc3QsIHsgLi4ucCwgaWQ6IGAke2lkfToke3AuaWR9YCB9KSxcbiAgICB9LFxuICAgIHJlYWN0OiB7XG4gICAgICBnZXRGaWJlcjogKG4pID0+IGZpYmVyRm9yTm9kZShuKSBhcyBSZWFjdEZpYmVyTm9kZSB8IG51bGwsXG4gICAgICBmaW5kT3duZXJCeU5hbWU6IChuLCBuYW1lKSA9PiB7XG4gICAgICAgIGxldCBmID0gZmliZXJGb3JOb2RlKG4pIGFzIFJlYWN0RmliZXJOb2RlIHwgbnVsbDtcbiAgICAgICAgd2hpbGUgKGYpIHtcbiAgICAgICAgICBjb25zdCB0ID0gZi50eXBlIGFzIHsgZGlzcGxheU5hbWU/OiBzdHJpbmc7IG5hbWU/OiBzdHJpbmcgfSB8IG51bGw7XG4gICAgICAgICAgaWYgKHQgJiYgKHQuZGlzcGxheU5hbWUgPT09IG5hbWUgfHwgdC5uYW1lID09PSBuYW1lKSkgcmV0dXJuIGY7XG4gICAgICAgICAgZiA9IGYucmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSxcbiAgICAgIHdhaXRGb3JFbGVtZW50LFxuICAgIH0sXG4gICAgYnJpZGdlOiB7XG4gICAgICBhZGRNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcjogKHRyYW5zZm9ybWVyKSA9PiB7XG4gICAgICAgIG1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycy5hZGQodHJhbnNmb3JtZXIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVucmVnaXN0ZXI6ICgpID0+IHtcbiAgICAgICAgICAgIG1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycy5kZWxldGUodHJhbnNmb3JtZXIpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgIH0sXG4gICAgaXBjOiB7XG4gICAgICBvbjogKGMsIGgpID0+IHtcbiAgICAgICAgY29uc3Qgd3JhcHBlZCA9IChfZTogdW5rbm93biwgLi4uYXJnczogdW5rbm93bltdKSA9PiBoKC4uLmFyZ3MpO1xuICAgICAgICBpcGNSZW5kZXJlci5vbihgY29kZXhwcDoke2lkfToke2N9YCwgd3JhcHBlZCk7XG4gICAgICAgIHJldHVybiAoKSA9PiBpcGNSZW5kZXJlci5yZW1vdmVMaXN0ZW5lcihgY29kZXhwcDoke2lkfToke2N9YCwgd3JhcHBlZCk7XG4gICAgICB9LFxuICAgICAgc2VuZDogKGMsIC4uLmFyZ3MpID0+IGlwY1JlbmRlcmVyLnNlbmQoYGNvZGV4cHA6JHtpZH06JHtjfWAsIC4uLmFyZ3MpLFxuICAgICAgaW52b2tlOiA8VD4oYzogc3RyaW5nLCAuLi5hcmdzOiB1bmtub3duW10pID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShgY29kZXhwcDoke2lkfToke2N9YCwgLi4uYXJncykgYXMgUHJvbWlzZTxUPixcbiAgICB9LFxuICAgIGZzOiByZW5kZXJlckZzKGlkLCBwYXRocyksXG4gICAgbW9kZWw6IHJlbmRlcmVyTW9kZWxBcGkoaWQpLFxuICAgIGNvZGV4OiByZW5kZXJlckNvZGV4QXBpKGlkKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbEJyaWRnZUhvb2tzKCk6IHZvaWQge1xuICBjb25zdCBob29rcyA9IHtcbiAgICBhZGRNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcih0cmFuc2Zvcm1lcjogTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIpIHtcbiAgICAgIG1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycy5hZGQodHJhbnNmb3JtZXIpO1xuICAgICAgcmV0dXJuICgpID0+IG1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycy5kZWxldGUodHJhbnNmb3JtZXIpO1xuICAgIH0sXG4gICAgdHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2U6IHVua25vd24pIHtcbiAgICAgIGxldCBjdXJyZW50ID0gbWVzc2FnZTtcbiAgICAgIGZvciAoY29uc3QgdHJhbnNmb3JtZXIgb2YgQXJyYXkuZnJvbShtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbmV4dCA9IHRyYW5zZm9ybWVyKGN1cnJlbnQpO1xuICAgICAgICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIGN1cnJlbnQgPSBuZXh0O1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcIltjb2RleC1wbHVzcGx1c10gbWVzc2FnZS1mcm9tLXZpZXcgdHJhbnNmb3JtZXIgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXBjUmVuZGVyZXIuc2VuZChcbiAgICAgICAgICAgICAgXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsXG4gICAgICAgICAgICAgIFwid2FyblwiLFxuICAgICAgICAgICAgICBcIm1lc3NhZ2UtZnJvbS12aWV3IHRyYW5zZm9ybWVyIGZhaWxlZDogXCIgKyBTdHJpbmcoKGVycm9yIGFzIEVycm9yKT8uc3RhY2sgPz8gZXJyb3IpLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBjdXJyZW50O1xuICAgIH0sXG4gIH07XG4gIGNvbnN0IHRhcmdldCA9IHdpbmRvdyBhcyB1bmtub3duIGFzIHtcbiAgICBfX2NvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcz86IHR5cGVvZiBob29rcztcbiAgICBfX2NvZGV4cHBCcmlkZ2VIb29rcz86IHR5cGVvZiBob29rcztcbiAgfTtcbiAgdGFyZ2V0Ll9fY29kZXhQbHVzUGx1c0JyaWRnZUhvb2tzID0gaG9va3M7XG4gIHRhcmdldC5fX2NvZGV4cHBCcmlkZ2VIb29rcyA9IGhvb2tzO1xufVxuXG5mdW5jdGlvbiByZW5kZXJlckNvZGV4QXBpKHR3ZWFrSWQ6IHN0cmluZyk6IE5vbk51bGxhYmxlPFR3ZWFrQXBpW1wiY29kZXhcIl0+IHtcbiAgcmV0dXJuIHtcbiAgICBydW50aW1lOiB7XG4gICAgICBnZXRJbmZvOiBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXJ1bnRpbWUtaW5mb1wiKSBhcyBDb2RleFJ1bnRpbWVJbmZvO1xuICAgICAgICBjb25zdCBicmlkZ2UgPSByZW5kZXJlckVsZWN0cm9uQnJpZGdlKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uaW5mbyxcbiAgICAgICAgICBidWlsZEZsYXZvcjogYnJpZGdlPy5nZXRCdWlsZEZsYXZvcj8uKCkgPz8gaW5mby5idWlsZEZsYXZvcixcbiAgICAgICAgICB1c2VzT3dsQXBwU2hlbGw6IGJyaWRnZT8udXNlc093bEFwcFNoZWxsPy4oKSA/PyBpbmZvLnVzZXNPd2xBcHBTaGVsbCxcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICBnZXRDYXBhYmlsaXRpZXM6ICgpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtcnVudGltZS1jYXBhYmlsaXRpZXNcIikgYXMgUHJvbWlzZTxDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXM+LFxuICAgIH0sXG4gICAgc2lkZWJhcjogcmVuZGVyZXJTaWRlYmFyQXBpKHR3ZWFrSWQpLFxuICAgIHdpbmRvd3M6IHtcbiAgICAgIGNyZWF0ZTogKG9wdGlvbnMpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWNyZWF0ZVwiLCBvcHRpb25zKSBhcyBQcm9taXNlPENvZGV4V2luZG93UmVmPixcbiAgICAgIGdldFByaW1hcnk6ICgpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LXByaW1hcnlcIikgYXMgUHJvbWlzZTxDb2RleFdpbmRvd1JlZiB8IG51bGw+LFxuICAgICAgZm9jdXM6ICh3aW5kb3dJZCkgPT5cbiAgICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC13aW5kb3ctZm9jdXNcIiwgd2luZG93SWQpIGFzIFByb21pc2U8Ym9vbGVhbj4sXG4gICAgICBzaG93OiAod2luZG93SWQpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LXNob3dcIiwgd2luZG93SWQpIGFzIFByb21pc2U8Ym9vbGVhbj4sXG4gICAgfSxcbiAgICB2aWV3czoge1xuICAgICAgY3JlYXRlOiBhc3luYyAob3B0aW9ucykgPT4ge1xuICAgICAgICBjb25zdCByZWYgPSBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgICAgXCJjb2RleHBwOmNvZGV4LXZpZXctY3JlYXRlXCIsXG4gICAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgICBvcHRpb25zLFxuICAgICAgICApIGFzIHsgaWQ6IHN0cmluZzsgd2ViQ29udGVudHNJZDogbnVtYmVyOyBwYXJlbnRXaW5kb3dJZDogbnVtYmVyIHwgbnVsbCB9O1xuICAgICAgICByZXR1cm4gcmVuZGVyZXJDb2RleFZpZXdSZWYodHdlYWtJZCwgcmVmLmlkLCByZWYud2ViQ29udGVudHNJZCwgcmVmLnBhcmVudFdpbmRvd0lkKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjZHA6IHtcbiAgICAgIGdldFN0YXR1czogKCkgPT5cbiAgICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC1jZHAtc3RhdHVzXCIpIGFzIFByb21pc2U8Q29kZXhDZHBTdGF0dXM+LFxuICAgICAgbGlzdFRhcmdldHM6ICgpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtY2RwLXRhcmdldHNcIikgYXMgUHJvbWlzZTxDb2RleENkcFRhcmdldFtdPixcbiAgICB9LFxuICAgIG5hdGl2ZToge1xuICAgICAgbG9hZE1vZHVsZTogYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgcmVmID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICAgIFwiY29kZXhwcDpuYXRpdmUtbG9hZC1tb2R1bGVcIixcbiAgICAgICAgICB0d2Vha0lkLFxuICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICkgYXMgeyBpZDogc3RyaW5nOyBraW5kOiBOYXRpdmVNb2R1bGVLaW5kIH07XG4gICAgICAgIHJldHVybiByZW5kZXJlck5hdGl2ZU1vZHVsZVJlZih0d2Vha0lkLCByZWYuaWQsIHJlZi5raW5kKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVQYW5lbDogYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgcmVmID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICAgIFwiY29kZXhwcDpuYXRpdmUtY3JlYXRlLXBhbmVsXCIsXG4gICAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgICBvcHRpb25zLFxuICAgICAgICApIGFzIHsgaWQ6IHN0cmluZzsgd2luZG93SWQ6IG51bWJlciB8IG51bGwgfTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyTmF0aXZlUGFuZWxSZWYodHdlYWtJZCwgcmVmLmlkLCByZWYud2luZG93SWQpO1xuICAgICAgfSxcbiAgICAgIGF0dGFjaFZpZXc6IGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgICBcImNvZGV4cHA6bmF0aXZlLWF0dGFjaC12aWV3XCIsXG4gICAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgICBvcHRpb25zLFxuICAgICAgICApIGFzIHsgaWQ6IHN0cmluZyB9O1xuICAgICAgICByZXR1cm4gcmVuZGVyZXJOYXRpdmVWaWV3UmVmKHR3ZWFrSWQsIHJlZi5pZCk7XG4gICAgICB9LFxuICAgICAgbGF1bmNoSGVscGVyOiBhc3luYyAob3B0aW9ucykgPT4ge1xuICAgICAgICBjb25zdCByZWYgPSBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgICAgXCJjb2RleHBwOm5hdGl2ZS1sYXVuY2gtaGVscGVyXCIsXG4gICAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgICBvcHRpb25zLFxuICAgICAgICApIGFzIHsgaWQ6IHN0cmluZzsgcGlkOiBudW1iZXIgfTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyTmF0aXZlSGVscGVyUmVmKHR3ZWFrSWQsIHJlZi5pZCwgcmVmLnBpZCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgY3JlYXRlQnJvd3NlclZpZXc6IChfb3B0aW9ucykgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYXBpLmNvZGV4LmNyZWF0ZUJyb3dzZXJWaWV3IGlzIG1haW4tb25seTsgdXNlIGEgbWFpbi1zY29wZWQgdHdlYWtcIik7XG4gICAgfSxcbiAgICBjcmVhdGVXaW5kb3c6IChvcHRpb25zKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC13aW5kb3ctY3JlYXRlXCIsIG9wdGlvbnMpIGFzIFByb21pc2U8Q29kZXhXaW5kb3dSZWY+LFxuICB9O1xufVxuXG5mdW5jdGlvbiByZW5kZXJlck1vZGVsQXBpKHR3ZWFrSWQ6IHN0cmluZyk6IE5vbk51bGxhYmxlPFR3ZWFrQXBpW1wibW9kZWxcIl0+IHtcbiAgcmV0dXJuIHtcbiAgICBnZW5lcmF0ZVRleHQ6IChvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVUZXh0T3B0aW9ucykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgXCJjb2RleHBwOm1vZGVsLWdlbmVyYXRlLXRleHRcIixcbiAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgICkgYXMgUHJvbWlzZTxDb2RleE1vZGVsVGV4dFJlc3VsdD4sXG4gICAgZ2VuZXJhdGVPYmplY3Q6IDxUID0gdW5rbm93bj4ob3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgXCJjb2RleHBwOm1vZGVsLWdlbmVyYXRlLW9iamVjdFwiLFxuICAgICAgICB0d2Vha0lkLFxuICAgICAgICBvcHRpb25zLFxuICAgICAgKSBhcyBQcm9taXNlPENvZGV4TW9kZWxPYmplY3RSZXN1bHQ8VD4+LFxuICB9O1xufVxuXG5mdW5jdGlvbiByZW5kZXJlckNvZGV4Vmlld1JlZihcbiAgdHdlYWtJZDogc3RyaW5nLFxuICBpZDogc3RyaW5nLFxuICB3ZWJDb250ZW50c0lkOiBudW1iZXIsXG4gIHBhcmVudFdpbmRvd0lkOiBudW1iZXIgfCBudWxsLFxuKTogQ29kZXhWaWV3UmVmIHtcbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICB3ZWJDb250ZW50c0lkLFxuICAgIHBhcmVudFdpbmRvd0lkLFxuICAgIHNldEJvdW5kczogKGJvdW5kcykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcInNldEJvdW5kc1wiLCBib3VuZHMpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgc2V0VmlzaWJsZTogKHZpc2libGUpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJzZXRWaXNpYmxlXCIsIHZpc2libGUpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgYnJpbmdUb0Zyb250OiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwiYnJpbmdUb0Zyb250XCIpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgbG9hZFJvdXRlOiAocm91dGUsIGhvc3RJZCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcImxvYWRSb3V0ZVwiLCByb3V0ZSwgaG9zdElkKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGxvYWRVcmw6ICh1cmwpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJsb2FkVXJsXCIsIHVybCkgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBkaXNwb3NlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwiZGlzcG9zZVwiKSBhcyBQcm9taXNlPHZvaWQ+LFxuICB9O1xufVxuXG5mdW5jdGlvbiByZW5kZXJlck5hdGl2ZU1vZHVsZVJlZihcbiAgdHdlYWtJZDogc3RyaW5nLFxuICBpZDogc3RyaW5nLFxuICBraW5kOiBOYXRpdmVNb2R1bGVLaW5kLFxuKTogTmF0aXZlTW9kdWxlUmVmIHtcbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICBraW5kLFxuICAgIHJlcXVlc3Q6IChtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgXCJjb2RleHBwOm5hdGl2ZS1tb2R1bGUtcmVxdWVzdFwiLFxuICAgICAgICB0d2Vha0lkLFxuICAgICAgICBpZCxcbiAgICAgICAgbWV0aG9kLFxuICAgICAgICBwYXlsb2FkLFxuICAgICAgICB0aW1lb3V0TXMsXG4gICAgICApLFxuICAgIGRpc3Bvc2U6ICgpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1tb2R1bGUtZGlzcG9zZVwiLCB0d2Vha0lkLCBpZCkgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVQYW5lbFJlZih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcsIHdpbmRvd0lkOiBudW1iZXIgfCBudWxsKTogTmF0aXZlUGFuZWxSZWYge1xuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIHdpbmRvd0lkLFxuICAgIHNldEJvdW5kczogKGJvdW5kcykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWluc3RhbmNlLWNhbGxcIiwgdHdlYWtJZCwgXCJwYW5lbFwiLCBpZCwgXCJzZXRCb3VuZHNcIiwgYm91bmRzKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIHNob3c6ICgpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwicGFuZWxcIiwgaWQsIFwic2hvd1wiKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGhpZGU6ICgpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwicGFuZWxcIiwgaWQsIFwiaGlkZVwiKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGRpc3Bvc2U6ICgpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwicGFuZWxcIiwgaWQsIFwiZGlzcG9zZVwiKSBhcyBQcm9taXNlPHZvaWQ+LFxuICB9O1xufVxuXG5mdW5jdGlvbiByZW5kZXJlck5hdGl2ZVZpZXdSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogTmF0aXZlVmlld1JlZiB7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgc2V0Qm91bmRzOiAoYm91bmRzKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInZpZXdcIiwgaWQsIFwic2V0Qm91bmRzXCIsIGJvdW5kcykgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBzZXRWaXNpYmxlOiAodmlzaWJsZSkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWluc3RhbmNlLWNhbGxcIiwgdHdlYWtJZCwgXCJ2aWV3XCIsIGlkLCBcInNldFZpc2libGVcIiwgdmlzaWJsZSkgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBkaXNwb3NlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInZpZXdcIiwgaWQsIFwiZGlzcG9zZVwiKSBhcyBQcm9taXNlPHZvaWQ+LFxuICB9O1xufVxuXG5mdW5jdGlvbiByZW5kZXJlck5hdGl2ZUhlbHBlclJlZih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcsIHBpZDogbnVtYmVyKTogTmF0aXZlSGVscGVyUmVmIHtcbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICBwaWQsXG4gICAgc2VuZDogKG1lc3NhZ2UpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1oZWxwZXItY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJzZW5kXCIsIG1lc3NhZ2UpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgcmVxdWVzdDogKG1lc3NhZ2UsIHRpbWVvdXRNcykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgXCJjb2RleHBwOm5hdGl2ZS1oZWxwZXItY2FsbFwiLFxuICAgICAgICB0d2Vha0lkLFxuICAgICAgICBpZCxcbiAgICAgICAgXCJyZXF1ZXN0XCIsXG4gICAgICAgIG1lc3NhZ2UsXG4gICAgICAgIHRpbWVvdXRNcyxcbiAgICAgICksXG4gICAgc3RvcDogKCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWhlbHBlci1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcInN0b3BcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJFbGVjdHJvbkJyaWRnZSgpOiBFbGVjdHJvbkJyaWRnZSB8IG51bGwge1xuICBjb25zdCB2YWx1ZSA9ICh3aW5kb3cgYXMgdW5rbm93biBhcyB7IGVsZWN0cm9uQnJpZGdlPzogdW5rbm93biB9KS5lbGVjdHJvbkJyaWRnZTtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlIGFzIEVsZWN0cm9uQnJpZGdlIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJTdG9yYWdlKGlkOiBzdHJpbmcpIHtcbiAgY29uc3Qga2V5ID0gYGNvZGV4cHA6c3RvcmFnZToke2lkfWA7XG4gIGNvbnN0IHJlYWQgPSAoKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpID8/IFwie31cIik7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9O1xuICBjb25zdCB3cml0ZSA9ICh2OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT5cbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIEpTT04uc3RyaW5naWZ5KHYpKTtcbiAgcmV0dXJuIHtcbiAgICBnZXQ6IDxUPihrOiBzdHJpbmcsIGQ/OiBUKSA9PiAoayBpbiByZWFkKCkgPyAocmVhZCgpW2tdIGFzIFQpIDogKGQgYXMgVCkpLFxuICAgIHNldDogKGs6IHN0cmluZywgdjogdW5rbm93bikgPT4ge1xuICAgICAgY29uc3QgbyA9IHJlYWQoKTtcbiAgICAgIG9ba10gPSB2O1xuICAgICAgd3JpdGUobyk7XG4gICAgfSxcbiAgICBkZWxldGU6IChrOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IG8gPSByZWFkKCk7XG4gICAgICBkZWxldGUgb1trXTtcbiAgICAgIHdyaXRlKG8pO1xuICAgIH0sXG4gICAgYWxsOiAoKSA9PiByZWFkKCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVyRnMoaWQ6IHN0cmluZywgX3BhdGhzOiBVc2VyUGF0aHMpIHtcbiAgLy8gU2FuZGJveGVkIHJlbmRlcmVyIGNhbid0IHVzZSBOb2RlIGZzIGRpcmVjdGx5IFx1MjAxNCBwcm94eSB0aHJvdWdoIG1haW4gSVBDLlxuICByZXR1cm4ge1xuICAgIGRhdGFEaXI6IGA8cmVtb3RlPi90d2Vhay1kYXRhLyR7aWR9YCxcbiAgICByZWFkOiAocDogc3RyaW5nKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDp0d2Vhay1mc1wiLCBcInJlYWRcIiwgaWQsIHApIGFzIFByb21pc2U8c3RyaW5nPixcbiAgICB3cml0ZTogKHA6IHN0cmluZywgYzogc3RyaW5nKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDp0d2Vhay1mc1wiLCBcIndyaXRlXCIsIGlkLCBwLCBjKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGV4aXN0czogKHA6IHN0cmluZykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dHdlYWstZnNcIiwgXCJleGlzdHNcIiwgaWQsIHApIGFzIFByb21pc2U8Ym9vbGVhbj4sXG4gIH07XG59XG4iLCAiaW50ZXJmYWNlIEVsZW1lbnRXYWl0ZXIge1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICByZXNvbHZlOiAoZWw6IEVsZW1lbnQpID0+IHZvaWQ7XG4gIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbiAgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+O1xufVxuXG5jb25zdCBlbGVtZW50V2FpdGVycyA9IG5ldyBTZXQ8RWxlbWVudFdhaXRlcj4oKTtcbmxldCBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGwgPSBudWxsO1xubGV0IGZyYW1lOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIHdhaXRGb3JFbGVtZW50KFxuICBzZWxlY3Rvcjogc3RyaW5nLFxuICB0aW1lb3V0TXMgPSA1MDAwLFxuKTogUHJvbWlzZTxFbGVtZW50PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIHJlc29sdmUoZXhpc3RpbmcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHdhaXRlcjogRWxlbWVudFdhaXRlciA9IHtcbiAgICAgIHNlbGVjdG9yLFxuICAgICAgcmVzb2x2ZSxcbiAgICAgIHJlamVjdCxcbiAgICAgIHRpbWVyOiBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgZWxlbWVudFdhaXRlcnMuZGVsZXRlKHdhaXRlcik7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYHRpbWVvdXQgd2FpdGluZyBmb3IgJHtzZWxlY3Rvcn1gKSk7XG4gICAgICAgIGRpc2Nvbm5lY3RJZklkbGUoKTtcbiAgICAgIH0sIE1hdGgubWF4KDAsIHRpbWVvdXRNcykpLFxuICAgIH07XG5cbiAgICBlbGVtZW50V2FpdGVycy5hZGQod2FpdGVyKTtcbiAgICBlbnN1cmVPYnNlcnZlcigpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbmNlbEFsbEVsZW1lbnRXYWl0ZXJzKHJlYXNvbjogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAoY29uc3Qgd2FpdGVyIG9mIEFycmF5LmZyb20oZWxlbWVudFdhaXRlcnMpKSB7XG4gICAgY2xlYXJUaW1lb3V0KHdhaXRlci50aW1lcik7XG4gICAgZWxlbWVudFdhaXRlcnMuZGVsZXRlKHdhaXRlcik7XG4gICAgd2FpdGVyLnJlamVjdChuZXcgRXJyb3IoYCR7cmVhc29ufTogJHt3YWl0ZXIuc2VsZWN0b3J9YCkpO1xuICB9XG4gIGRpc2Nvbm5lY3RJZklkbGUoKTtcbn1cblxuZnVuY3Rpb24gZW5zdXJlT2JzZXJ2ZXIoKTogdm9pZCB7XG4gIGlmIChvYnNlcnZlcikgcmV0dXJuO1xuICBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICBzY2hlZHVsZUNoZWNrKCk7XG4gIH0pO1xuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG59XG5cbmZ1bmN0aW9uIHNjaGVkdWxlQ2hlY2soKTogdm9pZCB7XG4gIGlmIChmcmFtZSAhPT0gbnVsbCkgcmV0dXJuO1xuICBmcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgZnJhbWUgPSBudWxsO1xuICAgIGNoZWNrV2FpdGVycygpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tXYWl0ZXJzKCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHdhaXRlciBvZiBBcnJheS5mcm9tKGVsZW1lbnRXYWl0ZXJzKSkge1xuICAgIGNvbnN0IGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcih3YWl0ZXIuc2VsZWN0b3IpO1xuICAgIGlmICghZWwpIGNvbnRpbnVlO1xuICAgIGNsZWFyVGltZW91dCh3YWl0ZXIudGltZXIpO1xuICAgIGVsZW1lbnRXYWl0ZXJzLmRlbGV0ZSh3YWl0ZXIpO1xuICAgIHdhaXRlci5yZXNvbHZlKGVsKTtcbiAgfVxuICBkaXNjb25uZWN0SWZJZGxlKCk7XG59XG5cbmZ1bmN0aW9uIGRpc2Nvbm5lY3RJZklkbGUoKTogdm9pZCB7XG4gIGlmIChlbGVtZW50V2FpdGVycy5zaXplID4gMCkgcmV0dXJuO1xuICBpZiAoZnJhbWUgIT09IG51bGwpIHtcbiAgICBjYW5jZWxBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gICAgZnJhbWUgPSBudWxsO1xuICB9XG4gIG9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gIG9ic2VydmVyID0gbnVsbDtcbn1cbiIsICJleHBvcnQgaW50ZXJmYWNlIFR3ZWFrTW9kdWxlTG9hZGVyT3B0aW9ucyB7XG4gIG1hbmlmZXN0SWQ6IHN0cmluZztcbiAgZW50cnk6IHN0cmluZztcbiAgZGlyOiBzdHJpbmc7XG4gIHJlYWRTb3VyY2U6IChmaWxlbmFtZTogc3RyaW5nKSA9PiBzdHJpbmc7XG4gIGZhbGxiYWNrUmVxdWlyZT86IChyZXF1ZXN0OiBzdHJpbmcpID0+IHVua25vd247XG4gIGNvbnNvbGU/OiBDb25zb2xlO1xufVxuXG5pbnRlcmZhY2UgVHdlYWtNb2R1bGVSZWNvcmQge1xuICBpZDogc3RyaW5nO1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBkaXJuYW1lOiBzdHJpbmc7XG4gIGV4cG9ydHM6IHVua25vd247XG4gIGxvYWRlZDogYm9vbGVhbjtcbn1cblxudHlwZSBUd2Vha1JlcXVpcmUgPSAoKHJlcXVlc3Q6IHN0cmluZykgPT4gdW5rbm93bikgJiB7XG4gIHJlc29sdmU6IChyZXF1ZXN0OiBzdHJpbmcpID0+IHN0cmluZztcbn07XG5cbmNvbnN0IE1PRFVMRV9GSUxFX0VYVEVOU0lPTlMgPSBbXCIuanNcIiwgXCIuY2pzXCIsIFwiLmpzb25cIl07XG5jb25zdCBNT0RVTEVfSU5ERVhfRklMRVMgPSBbXCJpbmRleC5qc1wiLCBcImluZGV4LmNqc1wiLCBcImluZGV4Lmpzb25cIl07XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUd2Vha01vZHVsZUxvYWRlcihvcHRpb25zOiBUd2Vha01vZHVsZUxvYWRlck9wdGlvbnMpIHtcbiAgY29uc3QgdHdlYWtEaXIgPSBub3JtYWxpemVBYnNvbHV0ZVBhdGgob3B0aW9ucy5kaXIpO1xuICBjb25zdCBlbnRyeSA9IG5vcm1hbGl6ZUFic29sdXRlUGF0aChvcHRpb25zLmVudHJ5KTtcbiAgY29uc3QgbW9kdWxlQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgVHdlYWtNb2R1bGVSZWNvcmQ+KCk7XG5cbiAgYXNzZXJ0SW5zaWRlVHdlYWtEaXIodHdlYWtEaXIsIGVudHJ5KTtcblxuICBjb25zdCBsb2FkTW9kdWxlID0gKGZpbGVuYW1lOiBzdHJpbmcsIHNvdXJjZU92ZXJyaWRlPzogc3RyaW5nKTogdW5rbm93biA9PiB7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBub3JtYWxpemVBYnNvbHV0ZVBhdGgoZmlsZW5hbWUpO1xuICAgIGFzc2VydEluc2lkZVR3ZWFrRGlyKHR3ZWFrRGlyLCByZXNvbHZlZCk7XG5cbiAgICBjb25zdCBleGlzdGluZyA9IG1vZHVsZUNhY2hlLmdldChyZXNvbHZlZCk7XG4gICAgaWYgKGV4aXN0aW5nKSByZXR1cm4gZXhpc3RpbmcuZXhwb3J0cztcblxuICAgIGlmIChyZXNvbHZlZC5lbmRzV2l0aChcIi5qc29uXCIpKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBzb3VyY2VPdmVycmlkZSA/PyBvcHRpb25zLnJlYWRTb3VyY2UocmVzb2x2ZWQpO1xuICAgICAgY29uc3QgbW9kdWxlID0gY3JlYXRlTW9kdWxlUmVjb3JkKHJlc29sdmVkLCBKU09OLnBhcnNlKHNvdXJjZSkgYXMgdW5rbm93bik7XG4gICAgICBtb2R1bGUubG9hZGVkID0gdHJ1ZTtcbiAgICAgIG1vZHVsZUNhY2hlLnNldChyZXNvbHZlZCwgbW9kdWxlKTtcbiAgICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiAgICB9XG5cbiAgICBjb25zdCBtb2R1bGUgPSBjcmVhdGVNb2R1bGVSZWNvcmQocmVzb2x2ZWQsIHt9KTtcbiAgICBtb2R1bGVDYWNoZS5zZXQocmVzb2x2ZWQsIG1vZHVsZSk7XG4gICAgY29uc3Qgc291cmNlID0gc291cmNlT3ZlcnJpZGUgPz8gb3B0aW9ucy5yZWFkU291cmNlKHJlc29sdmVkKTtcbiAgICBjb25zdCBsb2NhbFJlcXVpcmUgPSBtYWtlUmVxdWlyZShyZXNvbHZlZCk7XG5cbiAgICB0cnkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1pbXBsaWVkLWV2YWwsIG5vLW5ldy1mdW5jXG4gICAgICBjb25zdCBmbiA9IG5ldyBGdW5jdGlvbihcbiAgICAgICAgXCJtb2R1bGVcIixcbiAgICAgICAgXCJleHBvcnRzXCIsXG4gICAgICAgIFwicmVxdWlyZVwiLFxuICAgICAgICBcIl9fZmlsZW5hbWVcIixcbiAgICAgICAgXCJfX2Rpcm5hbWVcIixcbiAgICAgICAgXCJjb25zb2xlXCIsXG4gICAgICAgIGAke3NvdXJjZX1cXG4vLyMgc291cmNlVVJMPSR7c291cmNlVXJsKG9wdGlvbnMubWFuaWZlc3RJZCwgcmVzb2x2ZWQpfWAsXG4gICAgICApO1xuICAgICAgZm4obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgbG9jYWxSZXF1aXJlLCByZXNvbHZlZCwgbW9kdWxlLmRpcm5hbWUsIG9wdGlvbnMuY29uc29sZSA/PyBjb25zb2xlKTtcbiAgICAgIG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBtb2R1bGVDYWNoZS5kZWxldGUocmVzb2x2ZWQpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IHJlc29sdmVNb2R1bGUgPSAocmVxdWVzdDogc3RyaW5nLCBwYXJlbnRGaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgICBpZiAoIWlzUmVsYXRpdmVSZXF1ZXN0KHJlcXVlc3QpKSB7XG4gICAgICBpZiAob3B0aW9ucy5mYWxsYmFja1JlcXVpcmUpIHJldHVybiByZXF1ZXN0O1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgUmVuZGVyZXIgdHdlYWsgcmVxdWlyZSBvbmx5IHN1cHBvcnRzIHJlbGF0aXZlIGZpbGVzOyBidW5kbGUgZGVwZW5kZW5jeSBcIiR7cmVxdWVzdH1cIiBpbnRvIHRoZSB0d2VhayBlbnRyeWAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGJhc2UgPSBkaXJuYW1lUGF0aChwYXJlbnRGaWxlbmFtZSk7XG4gICAgY29uc3QgdGFyZ2V0ID0gbm9ybWFsaXplQWJzb2x1dGVQYXRoKGpvaW5QYXRoKGJhc2UsIHJlcXVlc3QpKTtcbiAgICBhc3NlcnRJbnNpZGVUd2Vha0Rpcih0d2Vha0RpciwgdGFyZ2V0KTtcblxuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIG1vZHVsZUNhbmRpZGF0ZXModGFyZ2V0KSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3B0aW9ucy5yZWFkU291cmNlKGNhbmRpZGF0ZSk7XG4gICAgICAgIHJldHVybiBjYW5kaWRhdGU7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gVHJ5IHRoZSBuZXh0IENvbW1vbkpTIGNhbmRpZGF0ZS5cbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBmaW5kIG1vZHVsZSBcIiR7cmVxdWVzdH1cIiBmcm9tICR7cGFyZW50RmlsZW5hbWV9YCk7XG4gIH07XG5cbiAgY29uc3QgbWFrZVJlcXVpcmUgPSAocGFyZW50RmlsZW5hbWU6IHN0cmluZyk6IFR3ZWFrUmVxdWlyZSA9PiB7XG4gICAgY29uc3QgcmVxdWlyZUZuID0gKChyZXF1ZXN0OiBzdHJpbmcpID0+IHtcbiAgICAgIGlmICghaXNSZWxhdGl2ZVJlcXVlc3QocmVxdWVzdCkpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuZmFsbGJhY2tSZXF1aXJlKSByZXR1cm4gb3B0aW9ucy5mYWxsYmFja1JlcXVpcmUocmVxdWVzdCk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgUmVuZGVyZXIgdHdlYWsgcmVxdWlyZSBvbmx5IHN1cHBvcnRzIHJlbGF0aXZlIGZpbGVzOyBidW5kbGUgZGVwZW5kZW5jeSBcIiR7cmVxdWVzdH1cIiBpbnRvIHRoZSB0d2VhayBlbnRyeWAsXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb25zdCBmaWxlbmFtZSA9IHJlc29sdmVNb2R1bGUocmVxdWVzdCwgcGFyZW50RmlsZW5hbWUpO1xuICAgICAgcmV0dXJuIGxvYWRNb2R1bGUoZmlsZW5hbWUpO1xuICAgIH0pIGFzIFR3ZWFrUmVxdWlyZTtcbiAgICByZXF1aXJlRm4ucmVzb2x2ZSA9IChyZXF1ZXN0OiBzdHJpbmcpID0+IHJlc29sdmVNb2R1bGUocmVxdWVzdCwgcGFyZW50RmlsZW5hbWUpO1xuICAgIHJldHVybiByZXF1aXJlRm47XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBsb2FkRW50cnkoc291cmNlT3ZlcnJpZGU/OiBzdHJpbmcpOiB1bmtub3duIHtcbiAgICAgIHJldHVybiBsb2FkTW9kdWxlKGVudHJ5LCBzb3VyY2VPdmVycmlkZSk7XG4gICAgfSxcblxuICAgIHJlc29sdmUocmVxdWVzdDogc3RyaW5nLCBwYXJlbnRGaWxlbmFtZSA9IGVudHJ5KTogc3RyaW5nIHtcbiAgICAgIHJldHVybiByZXNvbHZlTW9kdWxlKHJlcXVlc3QsIHBhcmVudEZpbGVuYW1lKTtcbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVNb2R1bGVSZWNvcmQoZmlsZW5hbWU6IHN0cmluZywgZXhwb3J0czogdW5rbm93bik6IFR3ZWFrTW9kdWxlUmVjb3JkIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogZmlsZW5hbWUsXG4gICAgZmlsZW5hbWUsXG4gICAgZGlybmFtZTogZGlybmFtZVBhdGgoZmlsZW5hbWUpLFxuICAgIGV4cG9ydHMsXG4gICAgbG9hZGVkOiBmYWxzZSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbW9kdWxlQ2FuZGlkYXRlcyh0YXJnZXQ6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgY29uc3QgZXh0ID0gZXh0ZW5zaW9uT2YodGFyZ2V0KTtcbiAgaWYgKGV4dCkgcmV0dXJuIFt0YXJnZXRdO1xuICByZXR1cm4gW1xuICAgIHRhcmdldCxcbiAgICAuLi5NT0RVTEVfRklMRV9FWFRFTlNJT05TLm1hcCgoZXh0ZW5zaW9uKSA9PiBgJHt0YXJnZXR9JHtleHRlbnNpb259YCksXG4gICAgLi4uTU9EVUxFX0lOREVYX0ZJTEVTLm1hcCgoZmlsZSkgPT4gYCR7dGFyZ2V0fS8ke2ZpbGV9YCksXG4gIF07XG59XG5cbmZ1bmN0aW9uIGlzUmVsYXRpdmVSZXF1ZXN0KHJlcXVlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gcmVxdWVzdCA9PT0gXCIuXCIgfHwgcmVxdWVzdCA9PT0gXCIuLlwiIHx8IHJlcXVlc3Quc3RhcnRzV2l0aChcIi4vXCIpIHx8IHJlcXVlc3Quc3RhcnRzV2l0aChcIi4uL1wiKTtcbn1cblxuZnVuY3Rpb24gc291cmNlVXJsKG1hbmlmZXN0SWQ6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgY29kZXhwcC10d2VhazovLyR7ZW5jb2RlVVJJQ29tcG9uZW50KG1hbmlmZXN0SWQpfS8ke2VuY29kZVVSSUNvbXBvbmVudChmaWxlbmFtZSl9YDtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0SW5zaWRlVHdlYWtEaXIodHdlYWtEaXI6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZyk6IHZvaWQge1xuICBpZiAoIWlzUGF0aEluc2lkZU9yRXF1YWwodHdlYWtEaXIsIGZpbGVuYW1lKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcInBhdGggb3V0c2lkZSB0d2VhayBkaXJcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNQYXRoSW5zaWRlT3JFcXVhbChwYXJlbnQ6IHN0cmluZywgY2hpbGQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBwYXJlbnRQYXRoID0gbm9ybWFsaXplRm9yQ29tcGFyZShwYXJlbnQpO1xuICBjb25zdCBjaGlsZFBhdGggPSBub3JtYWxpemVGb3JDb21wYXJlKGNoaWxkKTtcbiAgcmV0dXJuIGNoaWxkUGF0aCA9PT0gcGFyZW50UGF0aCB8fCBjaGlsZFBhdGguc3RhcnRzV2l0aChgJHtwYXJlbnRQYXRofS9gKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplRm9yQ29tcGFyZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUFic29sdXRlUGF0aCh2YWx1ZSkucmVwbGFjZSgvXFwvKyQvLCBcIlwiKTtcbiAgcmV0dXJuIC9eW0EtWmEtel06XFwvLy50ZXN0KG5vcm1hbGl6ZWQpID8gbm9ybWFsaXplZC50b0xvd2VyQ2FzZSgpIDogbm9ybWFsaXplZDtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQWJzb2x1dGVQYXRoKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gU3RyaW5nKGlucHV0IHx8IFwiXCIpLnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xuICBsZXQgcHJlZml4ID0gXCJcIjtcbiAgbGV0IHJlc3QgPSBub3JtYWxpemVkO1xuXG4gIGNvbnN0IGRyaXZlTWF0Y2ggPSByZXN0Lm1hdGNoKC9eKFtBLVphLXpdOikoPzpcXC98JCkvKTtcbiAgaWYgKGRyaXZlTWF0Y2gpIHtcbiAgICBwcmVmaXggPSBkcml2ZU1hdGNoWzFdID8/IFwiXCI7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UocHJlZml4Lmxlbmd0aCk7XG4gIH0gZWxzZSBpZiAocmVzdC5zdGFydHNXaXRoKFwiL1wiKSkge1xuICAgIHByZWZpeCA9IFwiL1wiO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDEpO1xuICB9XG5cbiAgY29uc3QgcGFydHM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgcGFydCBvZiByZXN0LnNwbGl0KFwiL1wiKSkge1xuICAgIGlmICghcGFydCB8fCBwYXJ0ID09PSBcIi5cIikgY29udGludWU7XG4gICAgaWYgKHBhcnQgPT09IFwiLi5cIikge1xuICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDApIHBhcnRzLnBvcCgpO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJwYXRoIHRyYXZlcnNhbFwiKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBwYXJ0cy5wdXNoKHBhcnQpO1xuICB9XG5cbiAgaWYgKHByZWZpeCA9PT0gXCIvXCIpIHJldHVybiBgLyR7cGFydHMuam9pbihcIi9cIil9YDtcbiAgaWYgKHByZWZpeCkgcmV0dXJuIGAke3ByZWZpeH0vJHtwYXJ0cy5qb2luKFwiL1wiKX1gLnJlcGxhY2UoL1xcLyQvLCBcIi9cIik7XG4gIHJldHVybiBwYXJ0cy5qb2luKFwiL1wiKTtcbn1cblxuZnVuY3Rpb24gam9pblBhdGgoYmFzZTogc3RyaW5nLCByZXF1ZXN0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7YmFzZS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpfS8ke3JlcXVlc3R9YDtcbn1cblxuZnVuY3Rpb24gZGlybmFtZVBhdGgoZmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVBYnNvbHV0ZVBhdGgoZmlsZW5hbWUpO1xuICBjb25zdCBpbmRleCA9IG5vcm1hbGl6ZWQubGFzdEluZGV4T2YoXCIvXCIpO1xuICBpZiAoaW5kZXggPD0gMCkgcmV0dXJuIG5vcm1hbGl6ZWQuc3RhcnRzV2l0aChcIi9cIikgPyBcIi9cIiA6IFwiLlwiO1xuICByZXR1cm4gbm9ybWFsaXplZC5zbGljZSgwLCBpbmRleCk7XG59XG5cbmZ1bmN0aW9uIGV4dGVuc2lvbk9mKGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBiYXNlbmFtZSA9IGZpbGVuYW1lLnNsaWNlKGZpbGVuYW1lLmxhc3RJbmRleE9mKFwiL1wiKSArIDEpO1xuICBjb25zdCBpbmRleCA9IGJhc2VuYW1lLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgcmV0dXJuIGluZGV4ID4gMCA/IGJhc2VuYW1lLnNsaWNlKGluZGV4KSA6IFwiXCI7XG59XG4iLCAiaW1wb3J0IHR5cGUge1xuICBDb2RleFNpZGViYXJBY3Rpb25PcHRpb25zLFxuICBDb2RleFNpZGViYXJBY3Rpb25SZWYsXG4gIENvZGV4U2lkZWJhckFjdGlvblVwZGF0ZSxcbiAgQ29kZXhTaWRlYmFyQXBpLFxufSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5pbnRlcmZhY2UgU2lkZWJhckFjdGlvblJlY29yZCB7XG4gIHR3ZWFrSWQ6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAga2V5OiBzdHJpbmc7XG4gIG9wdGlvbnM6IFJlcXVpcmVkPFBpY2s8Q29kZXhTaWRlYmFyQWN0aW9uT3B0aW9ucywgXCJpZFwiIHwgXCJsYWJlbFwiIHwgXCJ0b29sdGlwXCIgfCBcInBsYWNlbWVudFwiIHwgXCJvcmRlclwiIHwgXCJhY3RpdmVcIj4+ICZcbiAgICBQaWNrPENvZGV4U2lkZWJhckFjdGlvbk9wdGlvbnMsIFwiaWNvblN2Z1wiIHwgXCJvbkNsaWNrXCI+O1xuICBub2RlOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGxpc3RlbmVyOiAoKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB2b2lkKSB8IG51bGw7XG59XG5cbmludGVyZmFjZSBTaWRlYmFyU2xvdCB7XG4gIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQ7XG4gIHRlbXBsYXRlOiBIVE1MRWxlbWVudDtcbiAgaW5zZXJ0QmVmb3JlOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGluc2VydEFmdGVyOiBIVE1MRWxlbWVudCB8IG51bGw7XG59XG5cbmludGVyZmFjZSBNdXRlZE5hdGl2ZUFjdGl2ZUVsZW1lbnQge1xuICBjbGFzc05hbWU6IHN0cmluZztcbiAgYXJpYUN1cnJlbnQ6IHN0cmluZyB8IG51bGw7XG4gIGFyaWFTZWxlY3RlZDogc3RyaW5nIHwgbnVsbDtcbiAgZGF0YVN0YXRlOiBzdHJpbmcgfCBudWxsO1xuICBkYXRhQWN0aXZlOiBzdHJpbmcgfCBudWxsO1xuICBkYXRhU2VsZWN0ZWQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmNvbnN0IE1BSU5fU0lERUJBUl9BQ1RJT05fTEFCRUxTID0gW1xuICBcIk5ldyBjaGF0XCIsXG4gIFwiUXVpY2sgY2hhdFwiLFxuICBcIlNlYXJjaFwiLFxuICBcIlBsdWdpbnNcIixcbiAgXCJBdXRvbWF0aW9uc1wiLFxuICBcIkF1dG9tYXRpb25cIixcbl0ubWFwKG5vcm1hbGl6ZUxhYmVsKTtcblxuY29uc3QgcmVjb3JkcyA9IG5ldyBNYXA8c3RyaW5nLCBTaWRlYmFyQWN0aW9uUmVjb3JkPigpO1xuY29uc3QgbXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50cyA9IG5ldyBNYXA8SFRNTEVsZW1lbnQsIE11dGVkTmF0aXZlQWN0aXZlRWxlbWVudD4oKTtcbmxldCBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGwgPSBudWxsO1xubGV0IGRlbGVnYXRlZEV2ZW50c0luc3RhbGxlZCA9IGZhbHNlO1xubGV0IHJlZnJlc2hUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlcmVyU2lkZWJhckFwaSh0d2Vha0lkOiBzdHJpbmcpOiBDb2RleFNpZGViYXJBcGkge1xuICByZXR1cm4ge1xuICAgIHJlZ2lzdGVyQWN0aW9uKG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiByZWdpc3RlclNpZGViYXJBY3Rpb24odHdlYWtJZCwgb3B0aW9ucyk7XG4gICAgfSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc3Bvc2VTaWRlYmFyQWN0aW9uc0ZvclR3ZWFrKHR3ZWFrSWQ6IHN0cmluZyk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBBcnJheS5mcm9tKHJlY29yZHMudmFsdWVzKCkpKSB7XG4gICAgaWYgKHJlY29yZC50d2Vha0lkID09PSB0d2Vha0lkKSBkaXNwb3NlUmVjb3JkKHJlY29yZCk7XG4gIH1cbiAgc3RvcE9ic2VydmVySWZJZGxlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlclNpZGViYXJBY3Rpb24oXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgb3B0aW9uczogQ29kZXhTaWRlYmFyQWN0aW9uT3B0aW9ucyxcbik6IENvZGV4U2lkZWJhckFjdGlvblJlZiB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVPcHRpb25zKG9wdGlvbnMpO1xuICBjb25zdCBrZXkgPSBgJHt0d2Vha0lkfToke25vcm1hbGl6ZWQuaWR9YDtcbiAgY29uc3QgZXhpc3RpbmcgPSByZWNvcmRzLmdldChrZXkpO1xuICBpZiAoZXhpc3RpbmcpIHtcbiAgICBleGlzdGluZy5vcHRpb25zID0gbm9ybWFsaXplZDtcbiAgICByZW5kZXJSZWNvcmQoZXhpc3RpbmcpO1xuICAgIHN5bmNOYXRpdmVTaWRlYmFyQWN0aXZlU3RhdGUoKTtcbiAgICByZXR1cm4gYWN0aW9uUmVmKGV4aXN0aW5nKTtcbiAgfVxuXG4gIGNvbnN0IHJlY29yZDogU2lkZWJhckFjdGlvblJlY29yZCA9IHtcbiAgICB0d2Vha0lkLFxuICAgIGlkOiBub3JtYWxpemVkLmlkLFxuICAgIGtleSxcbiAgICBvcHRpb25zOiBub3JtYWxpemVkLFxuICAgIG5vZGU6IG51bGwsXG4gICAgbGlzdGVuZXI6IG51bGwsXG4gIH07XG4gIHJlY29yZHMuc2V0KGtleSwgcmVjb3JkKTtcbiAgZW5zdXJlT2JzZXJ2ZXIoKTtcbiAgc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCgpO1xuICByZXR1cm4gYWN0aW9uUmVmKHJlY29yZCk7XG59XG5cbmZ1bmN0aW9uIGFjdGlvblJlZihyZWNvcmQ6IFNpZGViYXJBY3Rpb25SZWNvcmQpOiBDb2RleFNpZGViYXJBY3Rpb25SZWYge1xuICByZXR1cm4ge1xuICAgIGlkOiByZWNvcmQuaWQsXG4gICAgdXBkYXRlKHVwZGF0ZTogQ29kZXhTaWRlYmFyQWN0aW9uVXBkYXRlKSB7XG4gICAgICBjb25zdCBtZXJnZWQgPSBub3JtYWxpemVPcHRpb25zKHsgLi4ucmVjb3JkLm9wdGlvbnMsIC4uLnVwZGF0ZSwgaWQ6IHJlY29yZC5pZCB9KTtcbiAgICAgIHJlY29yZC5vcHRpb25zID0gbWVyZ2VkO1xuICAgICAgcmVuZGVyUmVjb3JkKHJlY29yZCk7XG4gICAgICBzeW5jTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG4gICAgICBzY2hlZHVsZVNpZGViYXJSZWZyZXNoKCk7XG4gICAgfSxcbiAgICBzZXRBY3RpdmUoYWN0aXZlKSB7XG4gICAgICByZWNvcmQub3B0aW9ucyA9IHsgLi4ucmVjb3JkLm9wdGlvbnMsIGFjdGl2ZSB9O1xuICAgICAgcmVuZGVyUmVjb3JkKHJlY29yZCk7XG4gICAgICBzeW5jTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG4gICAgfSxcbiAgICBkaXNwb3NlKCkge1xuICAgICAgZGlzcG9zZVJlY29yZChyZWNvcmQpO1xuICAgICAgc3RvcE9ic2VydmVySWZJZGxlKCk7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zOiBDb2RleFNpZGViYXJBY3Rpb25PcHRpb25zKTogU2lkZWJhckFjdGlvblJlY29yZFtcIm9wdGlvbnNcIl0ge1xuICBjb25zdCBpZCA9IGNsZWFuU3RyaW5nKG9wdGlvbnMuaWQpO1xuICBjb25zdCBsYWJlbCA9IGNsZWFuU3RyaW5nKG9wdGlvbnMubGFiZWwpO1xuICBpZiAoIWlkKSB0aHJvdyBuZXcgRXJyb3IoXCJzaWRlYmFyIGFjdGlvbiBpZCBpcyByZXF1aXJlZFwiKTtcbiAgaWYgKCFsYWJlbCkgdGhyb3cgbmV3IEVycm9yKFwic2lkZWJhciBhY3Rpb24gbGFiZWwgaXMgcmVxdWlyZWRcIik7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgbGFiZWwsXG4gICAgdG9vbHRpcDogY2xlYW5TdHJpbmcob3B0aW9ucy50b29sdGlwKSB8fCBsYWJlbCxcbiAgICBwbGFjZW1lbnQ6IG9wdGlvbnMucGxhY2VtZW50ID09PSBcInN0YXJ0XCIgPyBcInN0YXJ0XCIgOiBcImVuZFwiLFxuICAgIG9yZGVyOiBOdW1iZXIuaXNGaW5pdGUob3B0aW9ucy5vcmRlcikgPyBOdW1iZXIob3B0aW9ucy5vcmRlcikgOiA1MCxcbiAgICBhY3RpdmU6IG9wdGlvbnMuYWN0aXZlID09PSB0cnVlLFxuICAgIGljb25Tdmc6IGNsZWFuU3RyaW5nKG9wdGlvbnMuaWNvblN2ZykgfHwgdW5kZWZpbmVkLFxuICAgIG9uQ2xpY2s6IG9wdGlvbnMub25DbGljayxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZW5zdXJlT2JzZXJ2ZXIoKTogdm9pZCB7XG4gIGlmIChvYnNlcnZlciB8fCB0eXBlb2YgZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcbiAgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiBzY2hlZHVsZVNpZGViYXJSZWZyZXNoKCkpO1xuICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHNjaGVkdWxlU2lkZWJhclJlZnJlc2gsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgZW5zdXJlRGVsZWdhdGVkU2lkZWJhckV2ZW50cygpO1xufVxuXG5mdW5jdGlvbiBzdG9wT2JzZXJ2ZXJJZklkbGUoKTogdm9pZCB7XG4gIGlmIChyZWNvcmRzLnNpemUgPiAwKSByZXR1cm47XG4gIG9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gIG9ic2VydmVyID0gbnVsbDtcbiAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCk7XG4gIHJlbW92ZURlbGVnYXRlZFNpZGViYXJFdmVudHMoKTtcbiAgaWYgKHJlZnJlc2hUaW1lcikge1xuICAgIGNsZWFyVGltZW91dChyZWZyZXNoVGltZXIpO1xuICAgIHJlZnJlc2hUaW1lciA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gZW5zdXJlRGVsZWdhdGVkU2lkZWJhckV2ZW50cygpOiB2b2lkIHtcbiAgaWYgKGRlbGVnYXRlZEV2ZW50c0luc3RhbGxlZCB8fCB0eXBlb2YgZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcbiAgZGVsZWdhdGVkRXZlbnRzSW5zdGFsbGVkID0gdHJ1ZTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbkNsaWNrLCB0cnVlKTtcbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgb25EZWxlZ2F0ZWRTaWRlYmFyQWN0aW9uS2V5ZG93biwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZURlbGVnYXRlZFNpZGViYXJFdmVudHMoKTogdm9pZCB7XG4gIGlmICghZGVsZWdhdGVkRXZlbnRzSW5zdGFsbGVkIHx8IHR5cGVvZiBkb2N1bWVudCA9PT0gXCJ1bmRlZmluZWRcIikgcmV0dXJuO1xuICBkZWxlZ2F0ZWRFdmVudHNJbnN0YWxsZWQgPSBmYWxzZTtcbiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbkNsaWNrLCB0cnVlKTtcbiAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgb25EZWxlZ2F0ZWRTaWRlYmFyQWN0aW9uS2V5ZG93biwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbkNsaWNrKGV2ZW50OiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gIGNvbnN0IGFjdGlvbiA9IHNpZGViYXJBY3Rpb25Ob2RlRm9yRXZlbnQoZXZlbnQpO1xuICBpZiAoIWFjdGlvbikgcmV0dXJuO1xuICBjb25zdCByZWNvcmQgPSByZWNvcmRzLmdldChhY3Rpb24uZGF0YXNldC5jb2RleHBwU2lkZWJhckFjdGlvbiB8fCBcIlwiKTtcbiAgaWYgKCFyZWNvcmQpIHJldHVybjtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIHZvaWQgcmVjb3JkLm9wdGlvbnMub25DbGljaz8uKGV2ZW50KTtcbn1cblxuZnVuY3Rpb24gb25EZWxlZ2F0ZWRTaWRlYmFyQWN0aW9uS2V5ZG93bihldmVudDogS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuICBpZiAoZXZlbnQua2V5ICE9PSBcIkVudGVyXCIgJiYgZXZlbnQua2V5ICE9PSBcIiBcIikgcmV0dXJuO1xuICBjb25zdCBhY3Rpb24gPSBzaWRlYmFyQWN0aW9uTm9kZUZvckV2ZW50KGV2ZW50KTtcbiAgaWYgKCFhY3Rpb24pIHJldHVybjtcbiAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIGludGVyYWN0aXZlVGFyZ2V0KGFjdGlvbikuY2xpY2soKTtcbn1cblxuZnVuY3Rpb24gc2lkZWJhckFjdGlvbk5vZGVGb3JFdmVudChldmVudDogRXZlbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBjb25zdCB0YXJnZXQgPSBldmVudFRhcmdldEVsZW1lbnQoZXZlbnQpO1xuICBjb25zdCBhY3Rpb24gPSB0YXJnZXQ/LmNsb3Nlc3QoXCJbZGF0YS1jb2RleHBwLXNpZGViYXItYWN0aW9uXVwiKTtcbiAgcmV0dXJuIGRvbUVsZW1lbnQoYWN0aW9uKTtcbn1cblxuZnVuY3Rpb24gZXZlbnRUYXJnZXRFbGVtZW50KGV2ZW50OiBFdmVudCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIHJldHVybiBkb21FbGVtZW50KGV2ZW50LnRhcmdldCk7XG59XG5cbmZ1bmN0aW9uIGRvbUVsZW1lbnQodmFsdWU6IHVua25vd24pOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGVsZW1lbnQgPSB2YWx1ZSBhcyBIVE1MRWxlbWVudDtcbiAgaWYgKHR5cGVvZiBlbGVtZW50LmNsb3Nlc3QgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIG51bGw7XG4gIGlmICh0eXBlb2YgZWxlbWVudC5nZXRBdHRyaWJ1dGUgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIG51bGw7XG4gIHJldHVybiBlbGVtZW50O1xufVxuXG5mdW5jdGlvbiBzY2hlZHVsZVNpZGViYXJSZWZyZXNoKCk6IHZvaWQge1xuICBpZiAocmVmcmVzaFRpbWVyKSByZXR1cm47XG4gIHJlZnJlc2hUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHJlZnJlc2hUaW1lciA9IG51bGw7XG4gICAgcmVmcmVzaFNpZGViYXJBY3Rpb25zKCk7XG4gIH0sIDEyMCk7XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hTaWRlYmFyQWN0aW9ucygpOiB2b2lkIHtcbiAgaWYgKCFyZWNvcmRzLnNpemUpIHJldHVybjtcbiAgY29uc3Qgc2xvdCA9IGZpbmRNYWluU2lkZWJhckFjdGlvblNsb3QoKTtcbiAgaWYgKCFzbG90KSByZXR1cm47XG5cbiAgY29uc3Qgc29ydGVkID0gc29ydGVkUmVjb3JkcygpO1xuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBzb3J0ZWQpIHtcbiAgICBpZiAoIXJlY29yZC5ub2RlIHx8ICFyZWNvcmQubm9kZS5pc0Nvbm5lY3RlZCB8fCByZWNvcmQubm9kZS5wYXJlbnRFbGVtZW50ICE9PSBzbG90LmNvbnRhaW5lcikge1xuICAgICAgcmVjb3JkLm5vZGU/LnJlbW92ZSgpO1xuICAgICAgcmVjb3JkLm5vZGUgPSBjcmVhdGVBY3Rpb25Ob2RlKHNsb3QudGVtcGxhdGUsIHJlY29yZCk7XG4gICAgfVxuICAgIHJlbmRlclJlY29yZChyZWNvcmQpO1xuICB9XG5cbiAgZm9yIChjb25zdCByZWNvcmQgb2Ygc29ydGVkKSB7XG4gICAgaWYgKHJlY29yZC5ub2RlPy5wYXJlbnRFbGVtZW50ID09PSBzbG90LmNvbnRhaW5lcikgcmVjb3JkLm5vZGUucmVtb3ZlKCk7XG4gIH1cblxuICBsZXQgYW5jaG9yID0gc2xvdC5pbnNlcnRBZnRlcjtcbiAgZm9yIChjb25zdCByZWNvcmQgb2Ygc29ydGVkLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5vcHRpb25zLnBsYWNlbWVudCA9PT0gXCJzdGFydFwiKSkge1xuICAgIGlmICghcmVjb3JkLm5vZGUpIGNvbnRpbnVlO1xuICAgIHNsb3QuY29udGFpbmVyLmluc2VydEJlZm9yZShyZWNvcmQubm9kZSwgYW5jaG9yID8gYW5jaG9yLm5leHRTaWJsaW5nIDogc2xvdC5jb250YWluZXIuZmlyc3RDaGlsZCk7XG4gICAgYW5jaG9yID0gcmVjb3JkLm5vZGU7XG4gIH1cblxuICBmb3IgKGNvbnN0IHJlY29yZCBvZiBzb3J0ZWQuZmlsdGVyKChpdGVtKSA9PiBpdGVtLm9wdGlvbnMucGxhY2VtZW50ID09PSBcImVuZFwiKSkge1xuICAgIGlmICghcmVjb3JkLm5vZGUpIGNvbnRpbnVlO1xuICAgIHNsb3QuY29udGFpbmVyLmluc2VydEJlZm9yZShyZWNvcmQubm9kZSwgYW5jaG9yID8gYW5jaG9yLm5leHRTaWJsaW5nIDogc2xvdC5jb250YWluZXIuZmlyc3RDaGlsZCk7XG4gICAgYW5jaG9yID0gcmVjb3JkLm5vZGU7XG4gIH1cblxuICBzeW5jTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG59XG5cbmZ1bmN0aW9uIHNvcnRlZFJlY29yZHMoKTogU2lkZWJhckFjdGlvblJlY29yZFtdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20ocmVjb3Jkcy52YWx1ZXMoKSkuc29ydCgoYSwgYikgPT5cbiAgICBhLm9wdGlvbnMub3JkZXIgLSBiLm9wdGlvbnMub3JkZXIgfHwgYS5rZXkubG9jYWxlQ29tcGFyZShiLmtleSksXG4gICk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUFjdGlvbk5vZGUodGVtcGxhdGU6IEhUTUxFbGVtZW50LCByZWNvcmQ6IFNpZGViYXJBY3Rpb25SZWNvcmQpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IG5vZGUgPSB0ZW1wbGF0ZS5jbG9uZU5vZGUodHJ1ZSkgYXMgSFRNTEVsZW1lbnQ7XG4gIHNhbml0aXplQWN0aW9uTm9kZShub2RlKTtcbiAgbm9kZS5kYXRhc2V0LmNvZGV4cHBTaWRlYmFyQWN0aW9uID0gcmVjb3JkLmtleTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclJlY29yZChyZWNvcmQ6IFNpZGViYXJBY3Rpb25SZWNvcmQpOiB2b2lkIHtcbiAgY29uc3Qgbm9kZSA9IHJlY29yZC5ub2RlO1xuICBpZiAoIW5vZGUpIHJldHVybjtcbiAgY29uc3QgdGFyZ2V0ID0gaW50ZXJhY3RpdmVUYXJnZXQobm9kZSk7XG4gIG5vZGUuZGF0YXNldC5jb2RleHBwU2lkZWJhckFjdGlvbiA9IHJlY29yZC5rZXk7XG4gIG5vZGUuZGF0YXNldC5jb2RleHBwU2lkZWJhckFjdGlvbkFjdGl2ZSA9IHJlY29yZC5vcHRpb25zLmFjdGl2ZSA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiO1xuICBpZiAodGFyZ2V0ICE9PSBub2RlKSB0YXJnZXQuZGF0YXNldC5jb2RleHBwU2lkZWJhckFjdGlvbkFjdGl2ZSA9IHJlY29yZC5vcHRpb25zLmFjdGl2ZSA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiO1xuICBhcHBseVBsYWNlbWVudFN0eWxlKG5vZGUsIHJlY29yZCk7XG4gIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIHJlY29yZC5vcHRpb25zLmxhYmVsKTtcbiAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRpdGxlXCIsIHJlY29yZC5vcHRpb25zLnRvb2x0aXApO1xuICB0YXJnZXQuc2V0QXR0cmlidXRlKFwicm9sZVwiLCBcImJ1dHRvblwiKTtcbiAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInRhYmluZGV4XCIsIFwiMFwiKTtcbiAgc2V0QWN0aXZlQXR0cmlidXRlcyhub2RlLCByZWNvcmQub3B0aW9ucy5hY3RpdmUpO1xuICBpZiAodGFyZ2V0ICE9PSBub2RlKSBzZXRBY3RpdmVBdHRyaWJ1dGVzKHRhcmdldCwgcmVjb3JkLm9wdGlvbnMuYWN0aXZlKTtcbiAgYXBwbHlOYXRpdmVMaWtlQWN0aXZlU3R5bGUodGFyZ2V0LCByZWNvcmQub3B0aW9ucy5hY3RpdmUpO1xuICByZXBsYWNlQWN0aW9uSWNvbihub2RlLCByZWNvcmQub3B0aW9ucy5pY29uU3ZnKTtcbiAgcmVwbGFjZUFjdGlvbkxhYmVsKG5vZGUsIHJlY29yZC5vcHRpb25zLmxhYmVsKTtcbiAgYXBwbHlOYXRpdmVMaWtlQWN0aXZlU3R5bGUodGFyZ2V0LCByZWNvcmQub3B0aW9ucy5hY3RpdmUpO1xufVxuXG5mdW5jdGlvbiBkaXNwb3NlUmVjb3JkKHJlY29yZDogU2lkZWJhckFjdGlvblJlY29yZCk6IHZvaWQge1xuICByZWNvcmQubm9kZT8ucmVtb3ZlKCk7XG4gIHJlY29yZC5ub2RlID0gbnVsbDtcbiAgcmVjb3Jkcy5kZWxldGUocmVjb3JkLmtleSk7XG4gIHN5bmNOYXRpdmVTaWRlYmFyQWN0aXZlU3RhdGUoKTtcbn1cblxuZnVuY3Rpb24gYXBwbHlQbGFjZW1lbnRTdHlsZShub2RlOiBIVE1MRWxlbWVudCwgcmVjb3JkOiBTaWRlYmFyQWN0aW9uUmVjb3JkKTogdm9pZCB7XG4gIGlmIChyZWNvcmQub3B0aW9ucy5wbGFjZW1lbnQgPT09IFwic3RhcnRcIikge1xuICAgIG5vZGUuc3R5bGUub3JkZXIgPSBTdHJpbmcoLTEwMDAwICsgcmVjb3JkLm9wdGlvbnMub3JkZXIpO1xuICB9IGVsc2Uge1xuICAgIG5vZGUuc3R5bGUucmVtb3ZlUHJvcGVydHkoXCJvcmRlclwiKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZE1haW5TaWRlYmFyQWN0aW9uU2xvdChyb290OiBQYXJlbnROb2RlID0gZG9jdW1lbnQpOiBTaWRlYmFyU2xvdCB8IG51bGwge1xuICBjb25zdCBhc2lkZSA9IEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsPy4oXCJhc2lkZVwiKSA/PyBbXSlcbiAgICAuZmluZCgoY2FuZGlkYXRlKTogY2FuZGlkYXRlIGlzIEhUTUxFbGVtZW50ID0+IGNhbmRpZGF0ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmICEhdmlzaWJsZUJveChjYW5kaWRhdGUpKTtcbiAgaWYgKCFhc2lkZSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgY29udHJvbHMgPSB2aXNpYmxlQ29udHJvbHMoYXNpZGUpXG4gICAgLm1hcCgoY29udHJvbCkgPT4gKHsgY29udHJvbCwgbGFiZWw6IG5vcm1hbGl6ZUxhYmVsKGNvbnRyb2xMYWJlbChjb250cm9sKSkgfSkpXG4gICAgLmZpbHRlcigoaXRlbSkgPT4gTUFJTl9TSURFQkFSX0FDVElPTl9MQUJFTFMuc29tZSgobWFya2VyKSA9PiBsYWJlbE1hdGNoZXMoaXRlbS5sYWJlbCwgbWFya2VyKSkpO1xuICBpZiAoIWNvbnRyb2xzLmxlbmd0aCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3Qgc29ydGVkQ29udHJvbHMgPSBjb250cm9sc1xuICAgIC5tYXAoKGl0ZW0pID0+IGl0ZW0uY29udHJvbClcbiAgICAuc29ydChjb21wYXJlRG9jdW1lbnRQb3NpdGlvbik7XG4gIGNvbnN0IHRlbXBsYXRlQ29udHJvbCA9IHNvcnRlZENvbnRyb2xzWzBdO1xuICBpZiAoIXRlbXBsYXRlQ29udHJvbCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGdyb3VwID0gYWN0aW9uR3JvdXBGb3IoYXNpZGUsIHNvcnRlZENvbnRyb2xzKTtcbiAgY29uc3QgdGVtcGxhdGUgPSByb3dJbkdyb3VwKGdyb3VwLCB0ZW1wbGF0ZUNvbnRyb2wpO1xuICBjb25zdCByb3dzID0gc29ydGVkQ29udHJvbHMubWFwKChjb250cm9sKSA9PiByb3dJbkdyb3VwKGdyb3VwLCBjb250cm9sKSkuZmlsdGVyKEJvb2xlYW4pO1xuICBjb25zdCBzb3J0ZWRSb3dzID0gcm93cy5zb3J0KGNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKTtcbiAgY29uc3QgaW5zZXJ0QmVmb3JlID0gc29ydGVkUm93c1swXSA/PyB0ZW1wbGF0ZTtcbiAgY29uc3QgaW5zZXJ0QWZ0ZXIgPSBzb3J0ZWRSb3dzLmF0KC0xKSA/PyB0ZW1wbGF0ZTtcbiAgcmV0dXJuIHsgY29udGFpbmVyOiBncm91cCwgdGVtcGxhdGUsIGluc2VydEJlZm9yZSwgaW5zZXJ0QWZ0ZXIgfTtcbn1cblxuZnVuY3Rpb24gdmlzaWJsZUNvbnRyb2xzKHJvb3Q6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnRbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKHJvb3QucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCJidXR0b24sYSxbcm9sZT0nYnV0dG9uJ10sW3JvbGU9J2xpbmsnXVwiKSlcbiAgICAuZmlsdGVyKChjb250cm9sKSA9PiB7XG4gICAgICBpZiAoY29udHJvbC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zaWRlYmFyLWFjdGlvbl1cIikpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGxhYmVsID0gY29udHJvbExhYmVsKGNvbnRyb2wpO1xuICAgICAgaWYgKCFsYWJlbCkgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgYm94ID0gdmlzaWJsZUJveChjb250cm9sKTtcbiAgICAgIHJldHVybiAhIWJveDtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gYWN0aW9uR3JvdXBGb3IoYXNpZGU6IEhUTUxFbGVtZW50LCBjb250cm9sczogSFRNTEVsZW1lbnRbXSk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgZmlyc3QgPSBjb250cm9sc1swXTtcbiAgaWYgKCFmaXJzdCkgcmV0dXJuIGFzaWRlO1xuICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsID0gZmlyc3QucGFyZW50RWxlbWVudDtcbiAgd2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gYXNpZGUpIHtcbiAgICBjb25zdCBjaGlsZFJvd3MgPSBjb250cm9sc1xuICAgICAgLm1hcCgoY29udHJvbCkgPT4gY2hpbGRJbkNvbnRhaW5lcihub2RlIGFzIEhUTUxFbGVtZW50LCBjb250cm9sKSlcbiAgICAgIC5maWx0ZXIoQm9vbGVhbik7XG4gICAgaWYgKG5ldyBTZXQoY2hpbGRSb3dzKS5zaXplID49IE1hdGgubWluKDIsIGNvbnRyb2xzLmxlbmd0aCkpIHJldHVybiBub2RlO1xuICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gIH1cbiAgcmV0dXJuIGZpcnN0LnBhcmVudEVsZW1lbnQgfHwgYXNpZGU7XG59XG5cbmZ1bmN0aW9uIHJvd0luR3JvdXAoZ3JvdXA6IEhUTUxFbGVtZW50LCBjb250cm9sOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgbGV0IG5vZGU6IEhUTUxFbGVtZW50ID0gY29udHJvbDtcbiAgd2hpbGUgKG5vZGUucGFyZW50RWxlbWVudCAmJiBub2RlLnBhcmVudEVsZW1lbnQgIT09IGdyb3VwKSBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICByZXR1cm4gbm9kZTtcbn1cblxuZnVuY3Rpb24gY2hpbGRJbkNvbnRhaW5lcihjb250YWluZXI6IEhUTUxFbGVtZW50LCBjb250cm9sOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGxldCBub2RlOiBIVE1MRWxlbWVudCA9IGNvbnRyb2w7XG4gIHdoaWxlIChub2RlLnBhcmVudEVsZW1lbnQgJiYgbm9kZS5wYXJlbnRFbGVtZW50ICE9PSBjb250YWluZXIpIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gIHJldHVybiBub2RlLnBhcmVudEVsZW1lbnQgPT09IGNvbnRhaW5lciA/IG5vZGUgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZUFjdGlvbk5vZGUobm9kZTogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgYWxsID0gW25vZGUsIC4uLkFycmF5LmZyb20obm9kZS5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcIipcIikpXTtcbiAgZm9yIChjb25zdCBlbCBvZiBhbGwpIHtcbiAgICBmb3IgKGNvbnN0IGF0dHIgb2YgQXJyYXkuZnJvbShlbC5hdHRyaWJ1dGVzKSkge1xuICAgICAgaWYgKGF0dHIubmFtZS5zdGFydHNXaXRoKFwiZGF0YS1hcHAtYWN0aW9uXCIpKSBlbC5yZW1vdmVBdHRyaWJ1dGUoYXR0ci5uYW1lKTtcbiAgICAgIGlmIChhdHRyLm5hbWUgPT09IFwiaHJlZlwiIHx8IGF0dHIubmFtZSA9PT0gXCJhcmlhLWN1cnJlbnRcIikgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIubmFtZSk7XG4gICAgfVxuICAgIGlmIChlbCBpbnN0YW5jZW9mIEhUTUxCdXR0b25FbGVtZW50KSBlbC50eXBlID0gXCJidXR0b25cIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnRlcmFjdGl2ZVRhcmdldChub2RlOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgaWYgKG1hdGNoZXNDb250cm9sKG5vZGUpKSByZXR1cm4gbm9kZTtcbiAgcmV0dXJuIG5vZGUucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJidXR0b24sYSxbcm9sZT0nYnV0dG9uJ10sW3JvbGU9J2xpbmsnXVwiKSB8fCBub2RlO1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzQ29udHJvbChub2RlOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gbm9kZS5tYXRjaGVzKFwiYnV0dG9uLGEsW3JvbGU9J2J1dHRvbiddLFtyb2xlPSdsaW5rJ11cIik7XG59XG5cbmZ1bmN0aW9uIHNldEFjdGl2ZUF0dHJpYnV0ZXMobm9kZTogSFRNTEVsZW1lbnQsIGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoYWN0aXZlKSB7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIiwgXCJwYWdlXCIpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiLCBcInRydWVcIik7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJkYXRhLXN0YXRlXCIsIFwiYWN0aXZlXCIpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1hY3RpdmVcIiwgXCJ0cnVlXCIpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1zZWxlY3RlZFwiLCBcInRydWVcIik7XG4gIH0gZWxzZSB7XG4gICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIik7XG4gICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpO1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiKTtcbiAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIpO1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1zZWxlY3RlZFwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhcHBseU5hdGl2ZUxpa2VBY3RpdmVTdHlsZSh0YXJnZXQ6IEhUTUxFbGVtZW50LCBhY3RpdmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgY29udGVudCA9IGFjdGl2ZUNvbnRlbnRFbGVtZW50KHRhcmdldCk7XG4gIGNvbnN0IGljb24gPSB0YXJnZXQucXVlcnlTZWxlY3RvcjxTVkdFbGVtZW50PihcInN2Z1wiKTtcbiAgaWYgKGFjdGl2ZSkge1xuICAgIHRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIsIFwiZm9udC1ub3JtYWxcIik7XG4gICAgdGFyZ2V0LmNsYXNzTGlzdC5hZGQoXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIik7XG4gICAgY29udGVudD8uY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tZm9yZWdyb3VuZFwiKTtcbiAgICBjb250ZW50Py5jbGFzc0xpc3QuYWRkKFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiKTtcbiAgICBpY29uPy5jbGFzc0xpc3QuYWRkKFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24taWNvbi1mb3JlZ3JvdW5kXCIpO1xuICB9IGVsc2Uge1xuICAgIHRhcmdldC5jbGFzc0xpc3QuYWRkKFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIsIFwiZm9udC1ub3JtYWxcIik7XG4gICAgdGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIik7XG4gICAgY29udGVudD8uY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tZm9yZWdyb3VuZFwiKTtcbiAgICBjb250ZW50Py5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiKTtcbiAgICBpY29uPy5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24taWNvbi1mb3JlZ3JvdW5kXCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFjdGl2ZUNvbnRlbnRFbGVtZW50KHRhcmdldDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBjb25zdCB0b2tlbkVsZW1lbnQgPSB0YXJnZXQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgXCIudGV4dC10b2tlbi1mb3JlZ3JvdW5kLC50ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1mb3JlZ3JvdW5kXCIsXG4gICk7XG4gIGlmICh0b2tlbkVsZW1lbnQpIHJldHVybiB0b2tlbkVsZW1lbnQ7XG4gIHJldHVybiB0YXJnZXQuZmlyc3RFbGVtZW50Q2hpbGQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IHRhcmdldC5maXJzdEVsZW1lbnRDaGlsZCA6IHRhcmdldDtcbn1cblxuZnVuY3Rpb24gc3luY05hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpOiB2b2lkIHtcbiAgaWYgKGhhc0FjdGl2ZVJlY29yZCgpKSBtdXRlTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG4gIGVsc2UgcmVzdG9yZU5hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xufVxuXG5mdW5jdGlvbiBoYXNBY3RpdmVSZWNvcmQoKTogYm9vbGVhbiB7XG4gIHJldHVybiBBcnJheS5mcm9tKHJlY29yZHMudmFsdWVzKCkpLnNvbWUoKHJlY29yZCkgPT4gcmVjb3JkLm9wdGlvbnMuYWN0aXZlICYmIHJlY29yZC5ub2RlPy5pc0Nvbm5lY3RlZCk7XG59XG5cbmZ1bmN0aW9uIG11dGVOYXRpdmVTaWRlYmFyQWN0aXZlU3RhdGUocm9vdDogUGFyZW50Tm9kZSA9IGRvY3VtZW50KTogdm9pZCB7XG4gIGNvbnN0IGFzaWRlID0gQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGw/LihcImFzaWRlXCIpID8/IFtdKVxuICAgIC5maW5kKChjYW5kaWRhdGUpOiBjYW5kaWRhdGUgaXMgSFRNTEVsZW1lbnQgPT4gY2FuZGlkYXRlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgJiYgISF2aXNpYmxlQm94KGNhbmRpZGF0ZSkpO1xuICBpZiAoIWFzaWRlKSByZXR1cm47XG5cbiAgY29uc3QgY29udHJvbHMgPSBBcnJheS5mcm9tKFxuICAgIGFzaWRlLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiYnV0dG9uLGEsW3JvbGU9J2J1dHRvbiddLFtyb2xlPSdsaW5rJ11cIiksXG4gICk7XG4gIGZvciAoY29uc3QgY29udHJvbCBvZiBjb250cm9scykge1xuICAgIGlmIChjb250cm9sLmNsb3Nlc3QoXCJbZGF0YS1jb2RleHBwLXNpZGViYXItYWN0aW9uXVwiKSkgY29udGludWU7XG4gICAgaWYgKCFpc05hdGl2ZUFjdGl2ZUNvbnRyb2woY29udHJvbCkpIGNvbnRpbnVlO1xuICAgIG11dGVOYXRpdmVBY3RpdmVFbGVtZW50KGNvbnRyb2wpO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgYWN0aXZlU2VsZWN0aW9uRGVzY2VuZGFudHMoY29udHJvbCkpIG11dGVOYXRpdmVBY3RpdmVFbGVtZW50KGNoaWxkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXN0b3JlTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IFtlbGVtZW50LCBzdGF0ZV0gb2YgQXJyYXkuZnJvbShtdXRlZE5hdGl2ZUFjdGl2ZUVsZW1lbnRzLmVudHJpZXMoKSkpIHtcbiAgICBpZiAoZWxlbWVudC5pc0Nvbm5lY3RlZCkge1xuICAgICAgZWxlbWVudC5jbGFzc05hbWUgPSBzdGF0ZS5jbGFzc05hbWU7XG4gICAgICByZXN0b3JlTnVsbGFibGVBdHRyaWJ1dGUoZWxlbWVudCwgXCJhcmlhLWN1cnJlbnRcIiwgc3RhdGUuYXJpYUN1cnJlbnQpO1xuICAgICAgcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQsIFwiYXJpYS1zZWxlY3RlZFwiLCBzdGF0ZS5hcmlhU2VsZWN0ZWQpO1xuICAgICAgcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQsIFwiZGF0YS1zdGF0ZVwiLCBzdGF0ZS5kYXRhU3RhdGUpO1xuICAgICAgcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQsIFwiZGF0YS1hY3RpdmVcIiwgc3RhdGUuZGF0YUFjdGl2ZSk7XG4gICAgICByZXN0b3JlTnVsbGFibGVBdHRyaWJ1dGUoZWxlbWVudCwgXCJkYXRhLXNlbGVjdGVkXCIsIHN0YXRlLmRhdGFTZWxlY3RlZCk7XG4gICAgfVxuICAgIG11dGVkTmF0aXZlQWN0aXZlRWxlbWVudHMuZGVsZXRlKGVsZW1lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG11dGVOYXRpdmVBY3RpdmVFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGlmICghbXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50cy5oYXMoZWxlbWVudCkpIHtcbiAgICBtdXRlZE5hdGl2ZUFjdGl2ZUVsZW1lbnRzLnNldChlbGVtZW50LCB7XG4gICAgICBjbGFzc05hbWU6IGVsZW1lbnQuY2xhc3NOYW1lLFxuICAgICAgYXJpYUN1cnJlbnQ6IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIpLFxuICAgICAgYXJpYVNlbGVjdGVkOiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiksXG4gICAgICBkYXRhU3RhdGU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiKSxcbiAgICAgIGRhdGFBY3RpdmU6IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1hY3RpdmVcIiksXG4gICAgICBkYXRhU2VsZWN0ZWQ6IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwiZGF0YS1zZWxlY3RlZFwiKSxcbiAgICB9KTtcbiAgfVxuXG4gIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIpO1xuICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIik7XG4gIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiKTtcbiAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLWFjdGl2ZVwiKTtcbiAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLXNlbGVjdGVkXCIpO1xuICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXG4gICAgXCJhY3RpdmVcIixcbiAgICBcImJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLFxuICAgIFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiLFxuICAgIFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24taWNvbi1mb3JlZ3JvdW5kXCIsXG4gICk7XG4gIGlmIChtYXRjaGVzQ29udHJvbChlbGVtZW50KSkgZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIsIFwiZm9udC1ub3JtYWxcIik7XG59XG5cbmZ1bmN0aW9uIGFjdGl2ZVNlbGVjdGlvbkRlc2NlbmRhbnRzKGNvbnRyb2w6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnRbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKFxuICAgIGNvbnRyb2wucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXG4gICAgICBcIi5iZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQsLnRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmQsLnRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiLFxuICAgICksXG4gICk7XG59XG5cbmZ1bmN0aW9uIGlzTmF0aXZlQWN0aXZlQ29udHJvbChjb250cm9sOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gY29udHJvbC5nZXRBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIikgPT09IFwicGFnZVwiIHx8XG4gICAgY29udHJvbC5nZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpID09PSBcInRydWVcIiB8fFxuICAgIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiKSA9PT0gXCJhY3RpdmVcIiB8fFxuICAgIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiZGF0YS1hY3RpdmVcIikgPT09IFwidHJ1ZVwiIHx8XG4gICAgY29udHJvbC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXNlbGVjdGVkXCIpID09PSBcInRydWVcIiB8fFxuICAgIGNvbnRyb2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYWN0aXZlXCIpIHx8XG4gICAgY29udHJvbC5jbGFzc0xpc3QuY29udGFpbnMoXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIikgfHxcbiAgICBhY3RpdmVTZWxlY3Rpb25EZXNjZW5kYW50cyhjb250cm9sKS5sZW5ndGggPiAwO1xufVxuXG5mdW5jdGlvbiByZXN0b3JlTnVsbGFibGVBdHRyaWJ1dGUoZWxlbWVudDogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZyB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09PSBudWxsKSBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgZWxzZSBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VBY3Rpb25JY29uKG5vZGU6IEhUTUxFbGVtZW50LCBpY29uU3ZnPzogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHN2ZyA9IHBhcnNlU3ZnKGljb25TdmcgfHwgZGVmYXVsdFNpZGViYXJJY29uU3ZnKCkpO1xuICBjb25zdCBjdXJyZW50ID0gbm9kZS5xdWVyeVNlbGVjdG9yKFwic3ZnXCIpO1xuICBpZiAoY3VycmVudCAmJiBzdmcpIHtcbiAgICBjb3B5SWNvblByZXNlbnRhdGlvbihjdXJyZW50LCBzdmcpO1xuICAgIGN1cnJlbnQucmVwbGFjZVdpdGgoc3ZnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKHN2Zykgbm9kZS5wcmVwZW5kKHN2Zyk7XG59XG5cbmZ1bmN0aW9uIGNvcHlJY29uUHJlc2VudGF0aW9uKGZyb206IFNWR0VsZW1lbnQsIHRvOiBTVkdFbGVtZW50KTogdm9pZCB7XG4gIGZvciAoY29uc3QgYXR0ciBvZiBbXCJjbGFzc1wiLCBcInN0eWxlXCIsIFwid2lkdGhcIiwgXCJoZWlnaHRcIl0pIHtcbiAgICBjb25zdCB2YWx1ZSA9IGZyb20uZ2V0QXR0cmlidXRlKGF0dHIpO1xuICAgIGlmICh2YWx1ZSkgdG8uc2V0QXR0cmlidXRlKGF0dHIsIHZhbHVlKTtcbiAgfVxuICBpZiAoIXRvLmdldEF0dHJpYnV0ZShcIndpZHRoXCIpICYmICF0by5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSkgdG8uc2V0QXR0cmlidXRlKFwid2lkdGhcIiwgXCIxNlwiKTtcbiAgaWYgKCF0by5nZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIikgJiYgIXRvLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpKSB0by5zZXRBdHRyaWJ1dGUoXCJoZWlnaHRcIiwgXCIxNlwiKTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZUFjdGlvbkxhYmVsKG5vZGU6IEhUTUxFbGVtZW50LCBsYWJlbDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHRleHROb2RlczogVGV4dFtdID0gW107XG4gIGNvbnN0IHdhbGtlciA9IGRvY3VtZW50LmNyZWF0ZVRyZWVXYWxrZXIobm9kZSwgTm9kZUZpbHRlci5TSE9XX1RFWFQpO1xuICB3aGlsZSAod2Fsa2VyLm5leHROb2RlKCkpIHtcbiAgICBjb25zdCBjdXJyZW50ID0gd2Fsa2VyLmN1cnJlbnROb2RlO1xuICAgIGlmIChjdXJyZW50IGluc3RhbmNlb2YgVGV4dCAmJiBjbGVhblN0cmluZyhjdXJyZW50LnRleHRDb250ZW50KSkgdGV4dE5vZGVzLnB1c2goY3VycmVudCk7XG4gIH1cbiAgaWYgKHRleHROb2Rlcy5sZW5ndGgpIHtcbiAgICB0ZXh0Tm9kZXNbMF0udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgICBmb3IgKGNvbnN0IGV4dHJhIG9mIHRleHROb2Rlcy5zbGljZSgxKSkgcmVtb3ZlQWNjZXNzb3J5VGV4dE5vZGUoZXh0cmEsIG5vZGUpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHNwYW4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgbm9kZS5hcHBlbmRDaGlsZChzcGFuKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlQWNjZXNzb3J5VGV4dE5vZGUodGV4dDogVGV4dCwgcm9vdDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3Qgb3JpZ2luYWwgPSBjbGVhblN0cmluZyh0ZXh0LnRleHRDb250ZW50KTtcbiAgbGV0IG5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IHRleHQucGFyZW50RWxlbWVudDtcbiAgd2hpbGUgKG5vZGUgJiYgbm9kZSAhPT0gcm9vdCkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBjbGVhblN0cmluZyhub2RlLnRleHRDb250ZW50KTtcbiAgICBjb25zdCBoYXNHcmFwaGljID0gISFub2RlLnF1ZXJ5U2VsZWN0b3IoXCJzdmcsaW1nXCIpO1xuICAgIGlmIChjb250ZW50ID09PSBvcmlnaW5hbCAmJiAhaGFzR3JhcGhpYykge1xuICAgICAgbm9kZS5yZW1vdmUoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgfVxuICB0ZXh0LnRleHRDb250ZW50ID0gXCJcIjtcbn1cblxuZnVuY3Rpb24gcGFyc2VTdmcoc3ZnVGV4dDogc3RyaW5nKTogU1ZHRWxlbWVudCB8IG51bGwge1xuICBjb25zdCB0ZW1wbGF0ZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZW1wbGF0ZVwiKTtcbiAgdGVtcGxhdGUuaW5uZXJIVE1MID0gc3ZnVGV4dC50cmltKCk7XG4gIGNvbnN0IHN2ZyA9IHRlbXBsYXRlLmNvbnRlbnQucXVlcnlTZWxlY3RvcihcInN2Z1wiKTtcbiAgaWYgKCEoc3ZnIGluc3RhbmNlb2YgU1ZHRWxlbWVudCkpIHJldHVybiBudWxsO1xuICBzdmcuc2V0QXR0cmlidXRlKFwiYXJpYS1oaWRkZW5cIiwgXCJ0cnVlXCIpO1xuICBzdmcuc2V0QXR0cmlidXRlKFwiZm9jdXNhYmxlXCIsIFwiZmFsc2VcIik7XG4gIHJldHVybiBzdmc7XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRTaWRlYmFySWNvblN2ZygpOiBzdHJpbmcge1xuICByZXR1cm4gJzxzdmcgd2lkdGg9XCIxNlwiIGhlaWdodD1cIjE2XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPjxwYXRoIGQ9XCJNNCAxMS41IDEyIDVsOCA2LjVcIj48L3BhdGg+PHBhdGggZD1cIk02IDEwLjVWMjBoMTJ2LTkuNVwiPjwvcGF0aD48cGF0aCBkPVwiTTEwIDIwdi01aDR2NVwiPjwvcGF0aD48L3N2Zz4nO1xufVxuXG5mdW5jdGlvbiBjb250cm9sTGFiZWwoZWw6IEhUTUxFbGVtZW50KTogc3RyaW5nIHtcbiAgcmV0dXJuIGNsZWFuU3RyaW5nKGVsLmdldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIikpIHx8XG4gICAgY2xlYW5TdHJpbmcoZWwuZ2V0QXR0cmlidXRlKFwidGl0bGVcIikpIHx8XG4gICAgY2xlYW5TdHJpbmcoZWwudGV4dENvbnRlbnQpO1xufVxuXG5mdW5jdGlvbiBsYWJlbE1hdGNoZXMobGFiZWw6IHN0cmluZywgbWFya2VyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGxhYmVsID09PSBtYXJrZXIgfHwgbGFiZWwuaW5jbHVkZXMobWFya2VyKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGFiZWwodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBjbGVhblN0cmluZyh2YWx1ZSlcbiAgICAudG9Mb2NhbGVMb3dlckNhc2UoKVxuICAgIC5ub3JtYWxpemUoXCJORkRcIilcbiAgICAucmVwbGFjZSgvW1xcdTAzMDAtXFx1MDM2Zl0vZywgXCJcIilcbiAgICAucmVwbGFjZSgvW1x1MjAxOVx1MjAxOGBcdTAwQjRdL2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gY2xlYW5TdHJpbmcodmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIHZhbHVlLnRyaW0oKSA/IHZhbHVlLnRyaW0oKSA6IFwiXCI7XG59XG5cbmZ1bmN0aW9uIHZpc2libGVCb3goZWw6IEhUTUxFbGVtZW50KTogRE9NUmVjdCB8IG51bGwge1xuICBpZiAoIWVsLmlzQ29ubmVjdGVkKSByZXR1cm4gbnVsbDtcbiAgY29uc3Qgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcbiAgaWYgKHN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiIHx8IHN0eWxlLnZpc2liaWxpdHkgPT09IFwiaGlkZGVuXCIpIHJldHVybiBudWxsO1xuICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gIGlmIChyZWN0LndpZHRoIDw9IDAgfHwgcmVjdC5oZWlnaHQgPD0gMCkgcmV0dXJuIG51bGw7XG4gIHJldHVybiByZWN0O1xufVxuXG5mdW5jdGlvbiBjb21wYXJlRG9jdW1lbnRQb3NpdGlvbihhOiBIVE1MRWxlbWVudCwgYjogSFRNTEVsZW1lbnQpOiBudW1iZXIge1xuICBpZiAoYSA9PT0gYikgcmV0dXJuIDA7XG4gIHJldHVybiBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKGIpICYgTm9kZS5ET0NVTUVOVF9QT1NJVElPTl9GT0xMT1dJTkcgPyAtMSA6IDE7XG59XG4iLCAiLyoqXG4gKiBCdWlsdC1pbiBcIlR3ZWFrIE1hbmFnZXJcIiBcdTIwMTQgYXV0by1pbmplY3RlZCBieSB0aGUgcnVudGltZSwgbm90IGEgdXNlciB0d2Vhay5cbiAqIExpc3RzIGRpc2NvdmVyZWQgdHdlYWtzIHdpdGggZW5hYmxlIHRvZ2dsZXMsIG9wZW5zIHRoZSB0d2Vha3MgZGlyLCBsaW5rc1xuICogdG8gbG9ncyBhbmQgY29uZmlnLiBMaXZlcyBpbiB0aGUgcmVuZGVyZXIuXG4gKlxuICogVGhpcyBpcyBpbnZva2VkIGZyb20gcHJlbG9hZC9pbmRleC50cyBBRlRFUiB1c2VyIHR3ZWFrcyBhcmUgbG9hZGVkIHNvIGl0XG4gKiBjYW4gc2hvdyB1cC10by1kYXRlIHN0YXR1cy5cbiAqL1xuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IHJlZ2lzdGVyU2VjdGlvbiB9IGZyb20gXCIuL3NldHRpbmdzLWluamVjdG9yXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtb3VudE1hbmFnZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHR3ZWFrcyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmxpc3QtdHdlYWtzXCIpKSBhcyBBcnJheTx7XG4gICAgbWFuaWZlc3Q6IHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyB2ZXJzaW9uOiBzdHJpbmc7IGRlc2NyaXB0aW9uPzogc3RyaW5nIH07XG4gICAgZW50cnlFeGlzdHM6IGJvb2xlYW47XG4gIH0+O1xuICBjb25zdCBwYXRocyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnVzZXItcGF0aHNcIikpIGFzIHtcbiAgICB1c2VyUm9vdDogc3RyaW5nO1xuICAgIHR3ZWFrc0Rpcjogc3RyaW5nO1xuICAgIGxvZ0Rpcjogc3RyaW5nO1xuICB9O1xuXG4gIHJlZ2lzdGVyU2VjdGlvbih7XG4gICAgaWQ6IFwiY29kZXgtcGx1c3BsdXM6bWFuYWdlclwiLFxuICAgIHRpdGxlOiBcIlR3ZWFrIE1hbmFnZXJcIixcbiAgICBkZXNjcmlwdGlvbjogYCR7dHdlYWtzLmxlbmd0aH0gdHdlYWsocykgaW5zdGFsbGVkLiBVc2VyIGRpcjogJHtwYXRocy51c2VyUm9vdH1gLFxuICAgIHJlbmRlcihyb290KSB7XG4gICAgICByb290LnN0eWxlLmNzc1RleHQgPSBcImRpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjhweDtcIjtcblxuICAgICAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBhY3Rpb25zLnN0eWxlLmNzc1RleHQgPSBcImRpc3BsYXk6ZmxleDtnYXA6OHB4O2ZsZXgtd3JhcDp3cmFwO1wiO1xuICAgICAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICAgICAgYnV0dG9uKFwiT3BlbiB0d2Vha3MgZm9sZGVyXCIsICgpID0+XG4gICAgICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpyZXZlYWxcIiwgcGF0aHMudHdlYWtzRGlyKS5jYXRjaCgoKSA9PiB7fSksXG4gICAgICAgICksXG4gICAgICApO1xuICAgICAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICAgICAgYnV0dG9uKFwiT3BlbiBsb2dzXCIsICgpID0+XG4gICAgICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpyZXZlYWxcIiwgcGF0aHMubG9nRGlyKS5jYXRjaCgoKSA9PiB7fSksXG4gICAgICAgICksXG4gICAgICApO1xuICAgICAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICAgICAgYnV0dG9uKFwiUmVsb2FkIHdpbmRvd1wiLCAoKSA9PiBsb2NhdGlvbi5yZWxvYWQoKSksXG4gICAgICApO1xuICAgICAgcm9vdC5hcHBlbmRDaGlsZChhY3Rpb25zKTtcblxuICAgICAgaWYgKHR3ZWFrcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc3QgZW1wdHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicFwiKTtcbiAgICAgICAgZW1wdHkuc3R5bGUuY3NzVGV4dCA9IFwiY29sb3I6Izg4ODtmb250OjEzcHggc3lzdGVtLXVpO21hcmdpbjo4cHggMDtcIjtcbiAgICAgICAgZW1wdHkudGV4dENvbnRlbnQgPVxuICAgICAgICAgIFwiTm8gdXNlciB0d2Vha3MgeWV0LiBEcm9wIGEgZm9sZGVyIHdpdGggbWFuaWZlc3QuanNvbiArIGluZGV4LmpzIGludG8gdGhlIHR3ZWFrcyBkaXIsIHRoZW4gcmVsb2FkLlwiO1xuICAgICAgICByb290LmFwcGVuZENoaWxkKGVtcHR5KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpO1xuICAgICAgbGlzdC5zdHlsZS5jc3NUZXh0ID0gXCJsaXN0LXN0eWxlOm5vbmU7bWFyZ2luOjA7cGFkZGluZzowO2Rpc3BsYXk6ZmxleDtmbGV4LWRpcmVjdGlvbjpjb2x1bW47Z2FwOjZweDtcIjtcbiAgICAgIGZvciAoY29uc3QgdCBvZiB0d2Vha3MpIHtcbiAgICAgICAgY29uc3QgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibGlcIik7XG4gICAgICAgIGxpLnN0eWxlLmNzc1RleHQgPVxuICAgICAgICAgIFwiZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtqdXN0aWZ5LWNvbnRlbnQ6c3BhY2UtYmV0d2VlbjtwYWRkaW5nOjhweCAxMHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tYm9yZGVyLCMyYTJhMmEpO2JvcmRlci1yYWRpdXM6NnB4O1wiO1xuICAgICAgICBjb25zdCBsZWZ0ID0gdHdlYWtTdW1tYXJ5KHQpO1xuICAgICAgICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHJpZ2h0LnN0eWxlLmNzc1RleHQgPSBcImNvbG9yOiM4ODg7Zm9udDoxMnB4IHN5c3RlbS11aTtcIjtcbiAgICAgICAgcmlnaHQudGV4dENvbnRlbnQgPSB0LmVudHJ5RXhpc3RzID8gXCJsb2FkZWRcIiA6IFwibWlzc2luZyBlbnRyeVwiO1xuICAgICAgICBsaS5hcHBlbmQobGVmdCwgcmlnaHQpO1xuICAgICAgICBsaXN0LmFwcGVuZChsaSk7XG4gICAgICB9XG4gICAgICByb290LmFwcGVuZChsaXN0KTtcbiAgICB9LFxuICB9KTtcbn1cblxuZnVuY3Rpb24gYnV0dG9uKGxhYmVsOiBzdHJpbmcsIG9uY2xpY2s6ICgpID0+IHZvaWQpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBiLnR5cGUgPSBcImJ1dHRvblwiO1xuICBiLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGIuc3R5bGUuY3NzVGV4dCA9XG4gICAgXCJwYWRkaW5nOjZweCAxMHB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tYm9yZGVyLCMzMzMpO2JvcmRlci1yYWRpdXM6NnB4O2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7Y29sb3I6aW5oZXJpdDtmb250OjEycHggc3lzdGVtLXVpO2N1cnNvcjpwb2ludGVyO1wiO1xuICBiLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbmNsaWNrKTtcbiAgcmV0dXJuIGI7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3VtbWFyeSh0d2Vhazoge1xuICBtYW5pZmVzdDogeyBpZDogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IHZlcnNpb246IHN0cmluZzsgZGVzY3JpcHRpb24/OiBzdHJpbmcgfTtcbn0pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuc3R5bGUuY3NzVGV4dCA9IFwiZm9udDo2MDAgMTNweCBzeXN0ZW0tdWk7XCI7XG4gIHRpdGxlLmFwcGVuZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0d2Vhay5tYW5pZmVzdC5uYW1lICsgXCIgXCIpKTtcblxuICBjb25zdCB2ZXJzaW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHZlcnNpb24uc3R5bGUuY3NzVGV4dCA9IFwiY29sb3I6Izg4ODtmb250LXdlaWdodDo0MDA7XCI7XG4gIHZlcnNpb24udGV4dENvbnRlbnQgPSBgdiR7dHdlYWsubWFuaWZlc3QudmVyc2lvbn1gO1xuICB0aXRsZS5hcHBlbmRDaGlsZCh2ZXJzaW9uKTtcblxuICBjb25zdCBkZXNjcmlwdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGRlc2NyaXB0aW9uLnN0eWxlLmNzc1RleHQgPSBcImNvbG9yOiM4ODg7Zm9udDoxMnB4IHN5c3RlbS11aTtcIjtcbiAgZGVzY3JpcHRpb24udGV4dENvbnRlbnQgPSB0d2Vhay5tYW5pZmVzdC5kZXNjcmlwdGlvbiA/PyB0d2Vhay5tYW5pZmVzdC5pZDtcblxuICBsZWZ0LmFwcGVuZCh0aXRsZSwgZGVzY3JpcHRpb24pO1xuICByZXR1cm4gbGVmdDtcbn1c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SSxRQUFRLEVBQUcsUUFBTztBQUMxQyxRQUFNLFdBQVcsQ0FBQyxRQUFpQixZQUFxQjtBQUN0RCxpQ0FBWSxLQUFLLDJCQUEyQixVQUFVLE9BQU87QUFBQSxFQUMvRDtBQUNBLGtCQUFnQixJQUFJLFVBQVUsUUFBUTtBQUN0QywrQkFBWSxHQUFHLDRCQUE0QixRQUFRLEdBQUcsUUFBUTtBQUM5RCxTQUFPO0FBQ1Q7QUFFQSxTQUFTLG1DQUNQLFVBQ0EsaUJBQ1M7QUFDVCxRQUFNLFdBQVcsZ0JBQWdCLElBQUksUUFBUTtBQUM3QyxNQUFJLENBQUMsU0FBVSxRQUFPO0FBQ3RCLGtCQUFnQixPQUFPLFFBQVE7QUFDL0IsK0JBQVksZUFBZSw0QkFBNEIsUUFBUSxHQUFHLFFBQVE7QUFDMUUsU0FBTztBQUNUOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfZWxlY3Ryb24iLCAicm9vdCIsICJzdGF0ZSIsICJjaGVjayIsICJidXR0b24iLCAiY2FyZCIsICJpbXBvcnRfZWxlY3Ryb24iLCAic291cmNlIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm9ic2VydmVyIiwgImVuc3VyZU9ic2VydmVyIiwgInN0YXRlIiwgImltcG9ydF9lbGVjdHJvbiIsICJzYWZlU3RyaW5naWZ5Il0KfQo=
