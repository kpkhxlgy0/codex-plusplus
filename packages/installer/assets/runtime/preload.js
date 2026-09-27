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
var NATIVE_SELECTION_CLASSES = [
  "bg-primary-ghost-hover",
  "hover:bg-primary-ghost-hover",
  "data-[state=open]:bg-primary-ghost-hover",
  "bg-token-list-hover-background",
  "hover:bg-token-list-hover-background",
  "text-emphasis",
  "text-default",
  "text-token-list-active-selection-foreground",
  "text-token-foreground",
  "text-codex-icon-active",
  "text-token-list-active-selection-icon-foreground"
];
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
  nativeNavSelection: /* @__PURE__ */ new Map(),
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
  if (state.activePage && state.contentHost) {
    if (state.panelHost?.parentElement !== state.contentHost) {
      plog("active panel removed; restoring native settings");
      restoreCodexView();
    } else {
      hideNativeContentChildren(state.contentHost);
    }
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
    restoreCodexView();
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
  btn.className = "focus-visible:outline-token-border relative px-row-x py-row-y cursor-interaction shrink-0 items-center overflow-hidden rounded-lg text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 gap-2 flex w-full hover:bg-primary-ghost-hover data-[state=open]:bg-primary-ghost-hover hover:bg-token-list-hover-background font-normal";
  const inner = document.createElement("div");
  inner.className = "flex min-w-0 items-center text-base gap-2 flex-1 text-default text-token-foreground";
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
  if (!mute) {
    for (const [btn, snapshot] of state.nativeNavSelection) {
      if (snapshot.ariaCurrent === null) btn.removeAttribute("aria-current");
      else btn.setAttribute("aria-current", snapshot.ariaCurrent);
      for (const [element, classes] of snapshot.classSnapshots) {
        for (const name of NATIVE_SELECTION_CLASSES) element.classList.toggle(name, classes.has(name));
      }
    }
    state.nativeNavSelection.clear();
    return;
  }
  const root = state.sidebarRoot;
  if (!root) return;
  const buttons = Array.from(root.querySelectorAll("button"));
  for (const btn of buttons) {
    if (btn.dataset.codexpp) continue;
    const active = btn.getAttribute("aria-current") === "page" || btn.classList.contains("bg-primary-ghost-hover") || btn.classList.contains("bg-token-list-hover-background");
    if (!active && !state.nativeNavSelection.has(btn)) continue;
    let snapshot = state.nativeNavSelection.get(btn);
    if (!snapshot) {
      snapshot = { ariaCurrent: btn.getAttribute("aria-current"), classSnapshots: /* @__PURE__ */ new Map() };
      state.nativeNavSelection.set(btn, snapshot);
    }
    captureNativeSelectionClasses(snapshot, btn);
    btn.removeAttribute("aria-current");
    btn.classList.remove("bg-primary-ghost-hover", "bg-token-list-hover-background");
    btn.classList.add(
      "hover:bg-primary-ghost-hover",
      "data-[state=open]:bg-primary-ghost-hover",
      "hover:bg-token-list-hover-background"
    );
    const inner = btn.firstElementChild;
    if (inner) {
      captureNativeSelectionClasses(snapshot, inner);
      inner.classList.remove("text-emphasis", "text-token-list-active-selection-foreground");
      inner.classList.add("text-default", "text-token-foreground");
    }
    for (const icon of Array.from(btn.querySelectorAll("*"))) {
      if (!icon.classList.contains("text-codex-icon-active") && !icon.classList.contains("text-token-list-active-selection-icon-foreground")) continue;
      captureNativeSelectionClasses(snapshot, icon);
      icon.classList.remove("text-codex-icon-active", "text-token-list-active-selection-icon-foreground");
    }
  }
}
function captureNativeSelectionClasses(snapshot, element) {
  if (snapshot.classSnapshots.has(element)) return;
  snapshot.classSnapshots.set(
    element,
    new Set(NATIVE_SELECTION_CLASSES.filter((name) => element.classList.contains(name)))
  );
}
function applyNavActive(btn, active) {
  const inner = btn.firstElementChild;
  if (active) {
    btn.classList.remove(
      "hover:bg-primary-ghost-hover",
      "data-[state=open]:bg-primary-ghost-hover",
      "hover:bg-token-list-hover-background",
      "font-normal"
    );
    btn.classList.add("bg-primary-ghost-hover", "bg-token-list-hover-background");
    btn.setAttribute("aria-current", "page");
    if (inner) {
      inner.classList.remove("text-default", "text-token-foreground");
      inner.classList.add("text-emphasis", "text-token-list-active-selection-foreground");
      inner.querySelector("svg")?.classList.add("text-codex-icon-active", "text-token-list-active-selection-icon-foreground");
    }
  } else {
    btn.classList.add(
      "hover:bg-primary-ghost-hover",
      "data-[state=open]:bg-primary-ghost-hover",
      "hover:bg-token-list-hover-background",
      "font-normal"
    );
    btn.classList.remove("bg-primary-ghost-hover", "bg-token-list-hover-background");
    btn.removeAttribute("aria-current");
    if (inner) {
      inner.classList.add("text-default", "text-token-foreground");
      inner.classList.remove("text-emphasis", "text-token-list-active-selection-foreground");
      inner.querySelector("svg")?.classList.remove("text-codex-icon-active", "text-token-list-active-selection-icon-foreground");
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
  hideNativeContentChildren(content);
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
function hideNativeContentChildren(content) {
  for (const child of Array.from(content.children)) {
    if (child.dataset.codexpp === "tweaks-panel") continue;
    if (!state.hiddenContent.has(child)) state.hiddenContent.set(child, child.style.display);
    if (child.style.display !== "none") child.style.display = "none";
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
  pill.setAttribute("aria-hidden", "true");
  const knob = document.createElement("span");
  knob.className = "rounded-full border border-control-thumb-on-accent bg-control-thumb-on-accent shadow-sm transition-transform duration-200 ease-out h-4 w-4";
  pill.appendChild(knob);
  const apply = (on) => {
    btn.setAttribute("aria-checked", String(on));
    btn.dataset.state = on ? "checked" : "unchecked";
    btn.className = "inline-flex items-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-full cursor-interaction";
    pill.className = `relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-out h-5 w-8 ${on ? "bg-chart-blue bg-token-charts-blue" : "bg-text/10 bg-token-foreground/20"}`;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL3ByZWxvYWQvaW5kZXgudHMiLCAiLi4vc3JjL3ByZWxvYWQvcmVhY3QtaG9vay50cyIsICIuLi9zcmMvcHJlbG9hZC9zZXR0aW5ncy1pbmplY3Rvci50cyIsICIuLi9zcmMvdHdlYWstc3RvcmUudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3MtZG9tLWhldXJpc3RpY3MudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3MtaWNvbnMudHMiLCAiLi4vc3JjL3ByZWxvYWQvc2V0dGluZ3Mtc3ZnLnRzIiwgIi4uL3NyYy9wcmVsb2FkL3R3ZWFrLWhvc3QudHMiLCAiLi4vc3JjL3ByZWxvYWQvZWxlbWVudC13YWl0ZXIudHMiLCAiLi4vc3JjL3ByZWxvYWQvdHdlYWstbW9kdWxlLWxvYWRlci50cyIsICIuLi9zcmMvcHJlbG9hZC9tYWluLXNpZGViYXItYWN0aW9ucy50cyIsICIuLi9zcmMvcHJlbG9hZC9tYW5hZ2VyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIFJlbmRlcmVyIHByZWxvYWQgZW50cnkuIFJ1bnMgaW4gYW4gaXNvbGF0ZWQgd29ybGQgYmVmb3JlIENvZGV4J3MgcGFnZSBKUy5cbiAqIFJlc3BvbnNpYmlsaXRpZXM6XG4gKiAgIDEuIEluc3RhbGwgYSBSZWFjdCBEZXZUb29scy1zaGFwZWQgZ2xvYmFsIGhvb2sgdG8gY2FwdHVyZSB0aGUgcmVuZGVyZXJcbiAqICAgICAgcmVmZXJlbmNlIHdoZW4gUmVhY3QgbW91bnRzLiBXZSB1c2UgdGhpcyBmb3IgZmliZXIgd2Fsa2luZy5cbiAqICAgMi4gQWZ0ZXIgRE9NQ29udGVudExvYWRlZCwga2ljayBvZmYgc2V0dGluZ3MtaW5qZWN0aW9uIGxvZ2ljLlxuICogICAzLiBEaXNjb3ZlciByZW5kZXJlci1zY29wZWQgdHdlYWtzICh2aWEgSVBDIHRvIG1haW4pIGFuZCBzdGFydCB0aGVtLlxuICogICA0LiBMaXN0ZW4gZm9yIGBjb2RleHBwOnR3ZWFrcy1jaGFuZ2VkYCBmcm9tIG1haW4gKGZpbGVzeXN0ZW0gd2F0Y2hlcikgYW5kXG4gKiAgICAgIGhvdC1yZWxvYWQgdHdlYWtzIHdpdGhvdXQgZHJvcHBpbmcgdGhlIHBhZ2UuXG4gKi9cblxuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGluc3RhbGxSZWFjdEhvb2sgfSBmcm9tIFwiLi9yZWFjdC1ob29rXCI7XG5pbXBvcnQgeyBzdGFydFNldHRpbmdzSW5qZWN0b3IgfSBmcm9tIFwiLi9zZXR0aW5ncy1pbmplY3RvclwiO1xuaW1wb3J0IHsgc3RhcnRUd2Vha0hvc3QsIHRlYXJkb3duVHdlYWtIb3N0IH0gZnJvbSBcIi4vdHdlYWstaG9zdFwiO1xuaW1wb3J0IHsgbW91bnRNYW5hZ2VyIH0gZnJvbSBcIi4vbWFuYWdlclwiO1xuXG5jb25zdCBCUk9XU0VSX1VJX0NPTk5FQ1RfUE9SVCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWNvbm5lY3QtYXBwLWhvc3RcIjtcbmNvbnN0IEJST1dTRVJfVUlfQlJJREdFX1JFUVVFU1QgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVxdWVzdFwiO1xuY29uc3QgQlJPV1NFUl9VSV9CUklER0VfUkVTUE9OU0UgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVzcG9uc2VcIjtcbmNvbnN0IEJST1dTRVJfVUlfTUVTU0FHRV9GT1JfVklFVyA9IFwiY29kZXhwcDpicm93c2VyLXVpLW1lc3NhZ2UtZm9yLXZpZXdcIjtcbmNvbnN0IEJST1dTRVJfVUlfV09SS0VSX01FU1NBR0UgPSBcImNvZGV4cHA6YnJvd3Nlci11aS13b3JrZXItbWVzc2FnZVwiO1xuY29uc3QgQlJPV1NFUl9VSV9TWVNURU1fVEhFTUUgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1zeXN0ZW0tdGhlbWVcIjtcblxuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVyA9IFwiY29kZXhfZGVza3RvcDptZXNzYWdlLWZyb20tdmlld1wiO1xuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZPUl9WSUVXID0gXCJjb2RleF9kZXNrdG9wOm1lc3NhZ2UtZm9yLXZpZXdcIjtcbmNvbnN0IERFU0tUT1BfU0hPV19DT05URVhUX01FTlUgPSBcImNvZGV4X2Rlc2t0b3A6c2hvdy1jb250ZXh0LW1lbnVcIjtcbmNvbnN0IERFU0tUT1BfU0hPV19BUFBMSUNBVElPTl9NRU5VID0gXCJjb2RleF9kZXNrdG9wOnNob3ctYXBwbGljYXRpb24tbWVudVwiO1xuY29uc3QgREVTS1RPUF9HRVRfU0VOVFJZX0lOSVRfT1BUSU9OUyA9IFwiY29kZXhfZGVza3RvcDpnZXQtc2VudHJ5LWluaXQtb3B0aW9uc1wiO1xuY29uc3QgREVTS1RPUF9HRVRfQlVJTERfRkxBVk9SID0gXCJjb2RleF9kZXNrdG9wOmdldC1idWlsZC1mbGF2b3JcIjtcbmNvbnN0IERFU0tUT1BfR0VUX1VTRVNfT1dMX0FQUF9TSEVMTCA9IFwiY29kZXhfZGVza3RvcDpnZXQtdXNlcy1vd2wtYXBwLXNoZWxsXCI7XG5jb25zdCBERVNLVE9QX0dFVF9TWVNURU1fVEhFTUVfVkFSSUFOVCA9IFwiY29kZXhfZGVza3RvcDpnZXQtc3lzdGVtLXRoZW1lLXZhcmlhbnRcIjtcbmNvbnN0IERFU0tUT1BfR0VUX1NIQVJFRF9PQkpFQ1RfU05BUFNIT1QgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LXNoYXJlZC1vYmplY3Qtc25hcHNob3RcIjtcbmNvbnN0IERFU0tUT1BfR0VUX0ZBU1RfTU9ERV9ST0xMT1VUX01FVFJJQ1MgPSBcImNvZGV4X2Rlc2t0b3A6Z2V0LWZhc3QtbW9kZS1yb2xsb3V0LW1ldHJpY3NcIjtcbmNvbnN0IERFU0tUT1BfU1lTVEVNX1RIRU1FX1VQREFURUQgPSBcImNvZGV4X2Rlc2t0b3A6c3lzdGVtLXRoZW1lLXZhcmlhbnQtdXBkYXRlZFwiO1xuY29uc3QgREVTS1RPUF9UUklHR0VSX1NFTlRSWV9URVNUID0gXCJjb2RleF9kZXNrdG9wOnRyaWdnZXItc2VudHJ5LXRlc3RcIjtcblxudHlwZSBNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lciA9IChtZXNzYWdlOiB1bmtub3duKSA9PiB1bmtub3duO1xuXG50eXBlIENvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcyA9IHtcbiAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI/OiAodHJhbnNmb3JtZXI6IE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyKSA9PiAoKSA9PiB2b2lkO1xuICB0cmFuc2Zvcm1NZXNzYWdlRnJvbVZpZXc/OiAobWVzc2FnZTogdW5rbm93bikgPT4gdW5rbm93bjtcbn07XG5cbmZ1bmN0aW9uIGRlc2t0b3BXb3JrZXJGcm9tVmlld0NoYW5uZWwod29ya2VySWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgY29kZXhfZGVza3RvcDp3b3JrZXI6JHt3b3JrZXJJZH06ZnJvbS12aWV3YDtcbn1cblxuZnVuY3Rpb24gZGVza3RvcFdvcmtlckZvclZpZXdDaGFubmVsKHdvcmtlcklkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYGNvZGV4X2Rlc2t0b3A6d29ya2VyOiR7d29ya2VySWR9OmZvci12aWV3YDtcbn1cblxuLy8gRmlsZS1sb2cgcHJlbG9hZCBwcm9ncmVzcyBzbyB3ZSBjYW4gZGlhZ25vc2Ugd2l0aG91dCBEZXZUb29scy4gQmVzdC1lZmZvcnQ6XG4vLyBmYWlsdXJlcyBoZXJlIG11c3QgbmV2ZXIgdGhyb3cgYmVjYXVzZSB3ZSdkIHRha2UgdGhlIHBhZ2UgZG93biB3aXRoIHVzLlxuLy9cbi8vIENvZGV4J3MgcmVuZGVyZXIgaXMgc2FuZGJveGVkIChzYW5kYm94OiB0cnVlKSwgc28gYHJlcXVpcmUoXCJub2RlOmZzXCIpYCBpc1xuLy8gdW5hdmFpbGFibGUuIFdlIGZvcndhcmQgbG9nIGxpbmVzIHRvIG1haW4gdmlhIElQQzsgbWFpbiB3cml0ZXMgdGhlIGZpbGUuXG5mdW5jdGlvbiBmaWxlTG9nKHN0YWdlOiBzdHJpbmcsIGV4dHJhPzogdW5rbm93bik6IHZvaWQge1xuICBjb25zdCBtc2cgPSBgW2NvZGV4LXBsdXNwbHVzIHByZWxvYWRdICR7c3RhZ2V9JHtcbiAgICBleHRyYSA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IFwiIFwiICsgc2FmZVN0cmluZ2lmeShleHRyYSlcbiAgfWA7XG4gIHRyeSB7XG4gICAgaWYgKHN0YWdlLmluY2x1ZGVzKFwiRkFJTEVEXCIpKSBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgZWxzZSBjb25zb2xlLmluZm8obXNnKTtcbiAgfSBjYXRjaCB7fVxuICB0cnkge1xuICAgIGlwY1JlbmRlcmVyLnNlbmQoXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsIFwiaW5mb1wiLCBtc2cpO1xuICB9IGNhdGNoIHt9XG59XG5mdW5jdGlvbiBzYWZlU3RyaW5naWZ5KHY6IHVua25vd24pOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiB0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiBKU09OLnN0cmluZ2lmeSh2KTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFN0cmluZyh2KTtcbiAgfVxufVxuXG5maWxlTG9nKFwicHJlbG9hZCBlbnRyeVwiLCB7IHVybDogbG9jYXRpb24uaHJlZiB9KTtcblxudHJ5IHtcbiAgaW5zdGFsbEJyb3dzZXJVaUhvc3RCcmlkZ2UoKTtcbiAgZmlsZUxvZyhcImJyb3dzZXIgVUkgaG9zdCBicmlkZ2UgaW5zdGFsbGVkXCIpO1xufSBjYXRjaCAoZSkge1xuICBmaWxlTG9nKFwiYnJvd3NlciBVSSBob3N0IGJyaWRnZSBGQUlMRURcIiwgU3RyaW5nKGUpKTtcbn1cblxuLy8gUmVhY3QgaG9vayBtdXN0IGJlIGluc3RhbGxlZCAqYmVmb3JlKiBDb2RleCdzIGJ1bmRsZSBydW5zLlxudHJ5IHtcbiAgaW5zdGFsbFJlYWN0SG9vaygpO1xuICBmaWxlTG9nKFwicmVhY3QgaG9vayBpbnN0YWxsZWRcIik7XG59IGNhdGNoIChlKSB7XG4gIGZpbGVMb2coXCJyZWFjdCBob29rIEZBSUxFRFwiLCBTdHJpbmcoZSkpO1xufVxuXG5xdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSBcImxvYWRpbmdcIikge1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGJvb3QsIHsgb25jZTogdHJ1ZSB9KTtcbiAgfSBlbHNlIHtcbiAgICBib290KCk7XG4gIH1cbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICBmaWxlTG9nKFwiYm9vdCBzdGFydFwiLCB7IHJlYWR5U3RhdGU6IGRvY3VtZW50LnJlYWR5U3RhdGUgfSk7XG4gIHRyeSB7XG4gICAgc3RhcnRTZXR0aW5nc0luamVjdG9yKCk7XG4gICAgZmlsZUxvZyhcInNldHRpbmdzIGluamVjdG9yIHN0YXJ0ZWRcIik7XG4gICAgYXdhaXQgc3RhcnRUd2Vha0hvc3QoKTtcbiAgICBmaWxlTG9nKFwidHdlYWsgaG9zdCBzdGFydGVkXCIpO1xuICAgIGF3YWl0IG1vdW50TWFuYWdlcigpO1xuICAgIGZpbGVMb2coXCJtYW5hZ2VyIG1vdW50ZWRcIik7XG4gICAgc3Vic2NyaWJlUmVsb2FkKCk7XG4gICAgZmlsZUxvZyhcImJvb3QgY29tcGxldGVcIik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBmaWxlTG9nKFwiYm9vdCBGQUlMRURcIiwgU3RyaW5nKChlIGFzIEVycm9yKT8uc3RhY2sgPz8gZSkpO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHByZWxvYWQgYm9vdCBmYWlsZWQ6XCIsIGUpO1xuICB9XG59XG5cbi8vIEhvdCByZWxvYWQ6IGdhdGVkIGJlaGluZCBhIHNtYWxsIGluLWZsaWdodCBsb2NrIHNvIGEgZmx1cnJ5IG9mIGZzIGV2ZW50c1xuLy8gZG9lc24ndCByZWVudHJhbnRseSB0ZWFyIGRvd24gdGhlIGhvc3QgbWlkLWxvYWQuXG5sZXQgcmVsb2FkaW5nOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGw7XG5mdW5jdGlvbiBzdWJzY3JpYmVSZWxvYWQoKTogdm9pZCB7XG4gIGlwY1JlbmRlcmVyLm9uKFwiY29kZXhwcDp0d2Vha3MtY2hhbmdlZFwiLCAoKSA9PiB7XG4gICAgaWYgKHJlbG9hZGluZykgcmV0dXJuO1xuICAgIHJlbG9hZGluZyA9IChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zb2xlLmluZm8oXCJbY29kZXgtcGx1c3BsdXNdIGhvdC1yZWxvYWRpbmcgdHdlYWtzXCIpO1xuICAgICAgICB0ZWFyZG93blR3ZWFrSG9zdCgpO1xuICAgICAgICBhd2FpdCBzdGFydFR3ZWFrSG9zdCgpO1xuICAgICAgICBhd2FpdCBtb3VudE1hbmFnZXIoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIltjb2RleC1wbHVzcGx1c10gaG90IHJlbG9hZCBmYWlsZWQ6XCIsIGUpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgcmVsb2FkaW5nID0gbnVsbDtcbiAgICAgIH1cbiAgICB9KSgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbEJyb3dzZXJVaUhvc3RCcmlkZ2UoKTogdm9pZCB7XG4gIGNvbnN0IHdvcmtlckxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkPigpO1xuXG4gIGlwY1JlbmRlcmVyLm9uKEJST1dTRVJfVUlfQ09OTkVDVF9QT1JULCAoZXZlbnQpID0+IHtcbiAgICBjb25zdCBbcG9ydF0gPSBldmVudC5wb3J0cztcbiAgICBpZiAoIXBvcnQpIHJldHVybjtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoeyB0eXBlOiBcImNvbm5lY3QtYXBwLWhvc3RcIiwgcG9ydCB9LCBcIipcIiwgW3BvcnRdKTtcbiAgfSk7XG5cbiAgaXBjUmVuZGVyZXIub24oQlJPV1NFUl9VSV9CUklER0VfUkVRVUVTVCwgYXN5bmMgKF9ldmVudCwgcGF5bG9hZCkgPT4ge1xuICAgIGNvbnN0IHJlcXVlc3QgPSBwYXlsb2FkICYmIHR5cGVvZiBwYXlsb2FkID09PSBcIm9iamVjdFwiXG4gICAgICA/IHBheWxvYWQgYXMgeyBpZD86IHVua25vd247IG1ldGhvZD86IHVua25vd247IGFyZ3M/OiB1bmtub3duIH1cbiAgICAgIDoge307XG4gICAgY29uc3QgaWQgPSB0eXBlb2YgcmVxdWVzdC5pZCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QuaWQgOiBcIlwiO1xuICAgIGNvbnN0IG1ldGhvZCA9IHR5cGVvZiByZXF1ZXN0Lm1ldGhvZCA9PT0gXCJzdHJpbmdcIiA/IHJlcXVlc3QubWV0aG9kIDogXCJcIjtcbiAgICBjb25zdCBhcmdzID0gQXJyYXkuaXNBcnJheShyZXF1ZXN0LmFyZ3MpID8gcmVxdWVzdC5hcmdzIDogW107XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgcnVuQnJvd3NlclVpQnJpZGdlTWV0aG9kKG1ldGhvZCwgYXJncywgd29ya2VyTGlzdGVuZXJzKTtcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9CUklER0VfUkVTUE9OU0UsIHsgaWQsIG9rOiB0cnVlLCB2YWx1ZSB9KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfQlJJREdFX1JFU1BPTlNFLCB7XG4gICAgICAgIGlkLFxuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGlwY1JlbmRlcmVyLm9uKERFU0tUT1BfTUVTU0FHRV9GT1JfVklFVywgKF9ldmVudCwgbWVzc2FnZSkgPT4ge1xuICAgIGlwY1JlbmRlcmVyLnNlbmQoQlJPV1NFUl9VSV9NRVNTQUdFX0ZPUl9WSUVXLCBtZXNzYWdlKTtcbiAgfSk7XG5cbiAgaXBjUmVuZGVyZXIub24oREVTS1RPUF9TWVNURU1fVEhFTUVfVVBEQVRFRCwgKF9ldmVudCwgdmFsdWUpID0+IHtcbiAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfU1lTVEVNX1RIRU1FLCB2YWx1ZSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Ccm93c2VyVWlCcmlkZ2VNZXRob2QoXG4gIG1ldGhvZDogc3RyaW5nLFxuICBhcmdzOiB1bmtub3duW10sXG4gIHdvcmtlckxpc3RlbmVyczogTWFwPHN0cmluZywgKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZD4sXG4pOiBQcm9taXNlPHVua25vd24+IHtcbiAgc3dpdGNoIChtZXRob2QpIHtcbiAgICBjYXNlIFwic25hcHNob3RcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TSEFSRURfT0JKRUNUX1NOQVBTSE9UKSA/PyB7fTtcbiAgICBjYXNlIFwic3lzdGVtVGhlbWVcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TWVNURU1fVEhFTUVfVkFSSUFOVCk7XG4gICAgY2FzZSBcInNlbnRyeU9wdGlvbnNcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9TRU5UUllfSU5JVF9PUFRJT05TKTtcbiAgICBjYXNlIFwiYnVpbGRGbGF2b3JcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9CVUlMRF9GTEFWT1IpO1xuICAgIGNhc2UgXCJ1c2VzT3dsQXBwU2hlbGxcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5zZW5kU3luYyhERVNLVE9QX0dFVF9VU0VTX09XTF9BUFBfU0hFTEwpID09PSB0cnVlO1xuICAgIGNhc2UgXCJzZW5kTWVzc2FnZUZyb21WaWV3XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfTUVTU0FHRV9GUk9NX1ZJRVcsIHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhhcmdzWzBdKSk7XG4gICAgY2FzZSBcInNlbmRXb3JrZXJNZXNzYWdlRnJvbVZpZXdcIjpcbiAgICAgIHJldHVybiBpcGNSZW5kZXJlci5pbnZva2UoZGVza3RvcFdvcmtlckZyb21WaWV3Q2hhbm5lbChTdHJpbmcoYXJnc1swXSkpLCBhcmdzWzFdKTtcbiAgICBjYXNlIFwic3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIjpcbiAgICAgIHJldHVybiBzdWJzY3JpYmVCcm93c2VyVWlXb3JrZXJNZXNzYWdlcyhTdHJpbmcoYXJnc1swXSksIHdvcmtlckxpc3RlbmVycyk7XG4gICAgY2FzZSBcInVuc3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIjpcbiAgICAgIHJldHVybiB1bnN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFN0cmluZyhhcmdzWzBdKSwgd29ya2VyTGlzdGVuZXJzKTtcbiAgICBjYXNlIFwic2hvd0NvbnRleHRNZW51XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfU0hPV19DT05URVhUX01FTlUsIGFyZ3NbMF0pO1xuICAgIGNhc2UgXCJzaG93QXBwbGljYXRpb25NZW51XCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfU0hPV19BUFBMSUNBVElPTl9NRU5VLCB7XG4gICAgICAgIG1lbnVJZDogYXJnc1swXSxcbiAgICAgICAgeDogYXJnc1sxXSxcbiAgICAgICAgeTogYXJnc1syXSxcbiAgICAgIH0pO1xuICAgIGNhc2UgXCJnZXRGYXN0TW9kZVJvbGxvdXRNZXRyaWNzXCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfR0VUX0ZBU1RfTU9ERV9ST0xMT1VUX01FVFJJQ1MsIGFyZ3NbMF0pO1xuICAgIGNhc2UgXCJ0cmlnZ2VyU2VudHJ5VGVzdEVycm9yXCI6XG4gICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKERFU0tUT1BfVFJJR0dFUl9TRU5UUllfVEVTVCk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBDb2RleCsrIGJyb3dzZXIgVUkgYnJpZGdlIG1ldGhvZDogJHttZXRob2R9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2U6IHVua25vd24pOiB1bmtub3duIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBob29rcyA9IChnbG9iYWxUaGlzIGFzIHR5cGVvZiBnbG9iYWxUaGlzICYge1xuICAgICAgX19jb2RleFBsdXNQbHVzQnJpZGdlSG9va3M/OiBDb2RleFBsdXNQbHVzQnJpZGdlSG9va3M7XG4gICAgICBfX2NvZGV4cHBCcmlkZ2VIb29rcz86IENvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcztcbiAgICB9KS5fX2NvZGV4UGx1c1BsdXNCcmlkZ2VIb29rc1xuICAgICAgPz8gKGdsb2JhbFRoaXMgYXMgdHlwZW9mIGdsb2JhbFRoaXMgJiB7XG4gICAgICAgIF9fY29kZXhwcEJyaWRnZUhvb2tzPzogQ29kZXhQbHVzUGx1c0JyaWRnZUhvb2tzO1xuICAgICAgfSkuX19jb2RleHBwQnJpZGdlSG9va3M7XG4gICAgaWYgKHR5cGVvZiBob29rcz8udHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3ICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBtZXNzYWdlO1xuICAgIGNvbnN0IHRyYW5zZm9ybWVkID0gaG9va3MudHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2UpO1xuICAgIHJldHVybiB0cmFuc2Zvcm1lZCA9PT0gdW5kZWZpbmVkID8gbWVzc2FnZSA6IHRyYW5zZm9ybWVkO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGZpbGVMb2coXCJtZXNzYWdlLWZyb20tdmlldyB0cmFuc2Zvcm0gRkFJTEVEXCIsIFN0cmluZygoZXJyb3IgYXMgRXJyb3IpPy5zdGFjayA/PyBlcnJvcikpO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFxuICB3b3JrZXJJZDogc3RyaW5nLFxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxuKTogYm9vbGVhbiB7XG4gIGlmICghL15bYS16QS1aMC05Ll86LV0rJC8udGVzdCh3b3JrZXJJZCkpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgd29ya2VyIGlkXCIpO1xuICBpZiAod29ya2VyTGlzdGVuZXJzLmhhcyh3b3JrZXJJZCkpIHJldHVybiB0cnVlO1xuICBjb25zdCBsaXN0ZW5lciA9IChfZXZlbnQ6IHVua25vd24sIG1lc3NhZ2U6IHVua25vd24pID0+IHtcbiAgICBpcGNSZW5kZXJlci5zZW5kKEJST1dTRVJfVUlfV09SS0VSX01FU1NBR0UsIHdvcmtlcklkLCBtZXNzYWdlKTtcbiAgfTtcbiAgd29ya2VyTGlzdGVuZXJzLnNldCh3b3JrZXJJZCwgbGlzdGVuZXIpO1xuICBpcGNSZW5kZXJlci5vbihkZXNrdG9wV29ya2VyRm9yVmlld0NoYW5uZWwod29ya2VySWQpLCBsaXN0ZW5lcik7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB1bnN1YnNjcmliZUJyb3dzZXJVaVdvcmtlck1lc3NhZ2VzKFxuICB3b3JrZXJJZDogc3RyaW5nLFxuICB3b3JrZXJMaXN0ZW5lcnM6IE1hcDxzdHJpbmcsICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ+LFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxpc3RlbmVyID0gd29ya2VyTGlzdGVuZXJzLmdldCh3b3JrZXJJZCk7XG4gIGlmICghbGlzdGVuZXIpIHJldHVybiB0cnVlO1xuICB3b3JrZXJMaXN0ZW5lcnMuZGVsZXRlKHdvcmtlcklkKTtcbiAgaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoZGVza3RvcFdvcmtlckZvclZpZXdDaGFubmVsKHdvcmtlcklkKSwgbGlzdGVuZXIpO1xuICByZXR1cm4gdHJ1ZTtcbn1cbiIsICIvKipcbiAqIEluc3RhbGwgYSBtaW5pbWFsIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXy4gUmVhY3QgY2FsbHNcbiAqIGBob29rLmluamVjdChyZW5kZXJlckludGVybmFscylgIGR1cmluZyBgY3JlYXRlUm9vdGAvYGh5ZHJhdGVSb290YC4gVGhlXG4gKiBcImludGVybmFsc1wiIG9iamVjdCBleHBvc2VzIGZpbmRGaWJlckJ5SG9zdEluc3RhbmNlLCB3aGljaCBsZXRzIHVzIHR1cm4gYVxuICogRE9NIG5vZGUgaW50byBhIFJlYWN0IGZpYmVyIFx1MjAxNCBuZWNlc3NhcnkgZm9yIG91ciBTZXR0aW5ncyBpbmplY3Rvci5cbiAqXG4gKiBXZSBkb24ndCB3YW50IHRvIGJyZWFrIHJlYWwgUmVhY3QgRGV2VG9vbHMgaWYgdGhlIHVzZXIgb3BlbnMgaXQ7IHdlIGluc3RhbGxcbiAqIG9ubHkgaWYgbm8gaG9vayBleGlzdHMgeWV0LCBhbmQgd2UgZm9yd2FyZCBjYWxscyB0byBhIGRvd25zdHJlYW0gaG9vayBpZlxuICogb25lIGlzIGxhdGVyIGFzc2lnbmVkLlxuICovXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIF9fUkVBQ1RfREVWVE9PTFNfR0xPQkFMX0hPT0tfXz86IFJlYWN0RGV2dG9vbHNIb29rO1xuICAgIF9fY29kZXhwcF9fPzoge1xuICAgICAgaG9vazogUmVhY3REZXZ0b29sc0hvb2s7XG4gICAgICByZW5kZXJlcnM6IE1hcDxudW1iZXIsIFJlbmRlcmVySW50ZXJuYWxzPjtcbiAgICB9O1xuICB9XG59XG5cbmludGVyZmFjZSBSZW5kZXJlckludGVybmFscyB7XG4gIGZpbmRGaWJlckJ5SG9zdEluc3RhbmNlPzogKG46IE5vZGUpID0+IHVua25vd247XG4gIHZlcnNpb24/OiBzdHJpbmc7XG4gIGJ1bmRsZVR5cGU/OiBudW1iZXI7XG4gIHJlbmRlcmVyUGFja2FnZU5hbWU/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBSZWFjdERldnRvb2xzSG9vayB7XG4gIHN1cHBvcnRzRmliZXI6IHRydWU7XG4gIHJlbmRlcmVyczogTWFwPG51bWJlciwgUmVuZGVyZXJJbnRlcm5hbHM+O1xuICBvbihldmVudDogc3RyaW5nLCBmbjogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCk6IHZvaWQ7XG4gIG9mZihldmVudDogc3RyaW5nLCBmbjogKC4uLmE6IHVua25vd25bXSkgPT4gdm9pZCk6IHZvaWQ7XG4gIGVtaXQoZXZlbnQ6IHN0cmluZywgLi4uYTogdW5rbm93bltdKTogdm9pZDtcbiAgaW5qZWN0KHJlbmRlcmVyOiBSZW5kZXJlckludGVybmFscyk6IG51bWJlcjtcbiAgb25TY2hlZHVsZUZpYmVyUm9vdD8oKTogdm9pZDtcbiAgb25Db21taXRGaWJlclJvb3Q/KCk6IHZvaWQ7XG4gIG9uQ29tbWl0RmliZXJVbm1vdW50PygpOiB2b2lkO1xuICBjaGVja0RDRT8oKTogdm9pZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxSZWFjdEhvb2soKTogdm9pZCB7XG4gIGlmICh3aW5kb3cuX19SRUFDVF9ERVZUT09MU19HTE9CQUxfSE9PS19fKSByZXR1cm47XG4gIGNvbnN0IHJlbmRlcmVycyA9IG5ldyBNYXA8bnVtYmVyLCBSZW5kZXJlckludGVybmFscz4oKTtcbiAgbGV0IG5leHRJZCA9IDE7XG4gIGNvbnN0IGxpc3RlbmVycyA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8KC4uLmE6IHVua25vd25bXSkgPT4gdm9pZD4+KCk7XG5cbiAgY29uc3QgaG9vazogUmVhY3REZXZ0b29sc0hvb2sgPSB7XG4gICAgc3VwcG9ydHNGaWJlcjogdHJ1ZSxcbiAgICByZW5kZXJlcnMsXG4gICAgaW5qZWN0KHJlbmRlcmVyKSB7XG4gICAgICBjb25zdCBpZCA9IG5leHRJZCsrO1xuICAgICAgcmVuZGVyZXJzLnNldChpZCwgcmVuZGVyZXIpO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZGVidWcoXG4gICAgICAgIFwiW2NvZGV4LXBsdXNwbHVzXSBSZWFjdCByZW5kZXJlciBhdHRhY2hlZDpcIixcbiAgICAgICAgcmVuZGVyZXIucmVuZGVyZXJQYWNrYWdlTmFtZSxcbiAgICAgICAgcmVuZGVyZXIudmVyc2lvbixcbiAgICAgICk7XG4gICAgICByZXR1cm4gaWQ7XG4gICAgfSxcbiAgICBvbihldmVudCwgZm4pIHtcbiAgICAgIGxldCBzID0gbGlzdGVuZXJzLmdldChldmVudCk7XG4gICAgICBpZiAoIXMpIGxpc3RlbmVycy5zZXQoZXZlbnQsIChzID0gbmV3IFNldCgpKSk7XG4gICAgICBzLmFkZChmbik7XG4gICAgfSxcbiAgICBvZmYoZXZlbnQsIGZuKSB7XG4gICAgICBsaXN0ZW5lcnMuZ2V0KGV2ZW50KT8uZGVsZXRlKGZuKTtcbiAgICB9LFxuICAgIGVtaXQoZXZlbnQsIC4uLmFyZ3MpIHtcbiAgICAgIGxpc3RlbmVycy5nZXQoZXZlbnQpPy5mb3JFYWNoKChmbikgPT4gZm4oLi4uYXJncykpO1xuICAgIH0sXG4gICAgb25Db21taXRGaWJlclJvb3QoKSB7fSxcbiAgICBvbkNvbW1pdEZpYmVyVW5tb3VudCgpIHt9LFxuICAgIG9uU2NoZWR1bGVGaWJlclJvb3QoKSB7fSxcbiAgICBjaGVja0RDRSgpIHt9LFxuICB9O1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh3aW5kb3csIFwiX19SRUFDVF9ERVZUT09MU19HTE9CQUxfSE9PS19fXCIsIHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IHRydWUsIC8vIGFsbG93IHJlYWwgRGV2VG9vbHMgdG8gb3ZlcndyaXRlIGlmIHVzZXIgaW5zdGFsbHMgaXRcbiAgICB2YWx1ZTogaG9vayxcbiAgfSk7XG5cbiAgd2luZG93Ll9fY29kZXhwcF9fID0geyBob29rLCByZW5kZXJlcnMgfTtcbn1cblxuLyoqIFJlc29sdmUgdGhlIFJlYWN0IGZpYmVyIGZvciBhIERPTSBub2RlLCBpZiBhbnkgcmVuZGVyZXIgaGFzIG9uZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaWJlckZvck5vZGUobm9kZTogTm9kZSk6IHVua25vd24gfCBudWxsIHtcbiAgY29uc3QgcmVuZGVyZXJzID0gd2luZG93Ll9fY29kZXhwcF9fPy5yZW5kZXJlcnM7XG4gIGlmIChyZW5kZXJlcnMpIHtcbiAgICBmb3IgKGNvbnN0IHIgb2YgcmVuZGVyZXJzLnZhbHVlcygpKSB7XG4gICAgICBjb25zdCBmID0gci5maW5kRmliZXJCeUhvc3RJbnN0YW5jZT8uKG5vZGUpO1xuICAgICAgaWYgKGYpIHJldHVybiBmO1xuICAgIH1cbiAgfVxuICAvLyBGYWxsYmFjazogcmVhZCB0aGUgUmVhY3QgaW50ZXJuYWwgcHJvcGVydHkgZGlyZWN0bHkgZnJvbSB0aGUgRE9NIG5vZGUuXG4gIC8vIFJlYWN0IHN0b3JlcyBmaWJlcnMgYXMgYSBwcm9wZXJ0eSB3aG9zZSBrZXkgc3RhcnRzIHdpdGggXCJfX3JlYWN0RmliZXJcIi5cbiAgZm9yIChjb25zdCBrIG9mIE9iamVjdC5rZXlzKG5vZGUpKSB7XG4gICAgaWYgKGsuc3RhcnRzV2l0aChcIl9fcmVhY3RGaWJlclwiKSkgcmV0dXJuIChub2RlIGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4pW2tdO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgIi8qKlxuICogU2V0dGluZ3MgaW5qZWN0b3IgZm9yIENvZGV4J3MgU2V0dGluZ3MgcGFnZS5cbiAqXG4gKiBDb2RleCdzIHNldHRpbmdzIGlzIGEgcm91dGVkIHBhZ2UgKFVSTCBzdGF5cyBhdCBgL2luZGV4Lmh0bWw/aG9zdElkPWxvY2FsYClcbiAqIE5PVCBhIG1vZGFsIGRpYWxvZy4gVGhlIHNpZGViYXIgaXMgYSBncm91cGVkIHNldHRpbmdzIG5hdiAoUGVyc29uYWwsXG4gKiBJbnRlZ3JhdGlvbnMsIENvZGluZywgQXJjaGl2ZWQpIHdpdGggbmF0aXZlIHNlY3Rpb24gaGVhZGVycyBhYm92ZSBzdGFja3Mgb2ZcbiAqIGJ1dHRvbnMuIFRoZXJlIGFyZSBubyBzdGFibGUgYHJvbGVgIC8gYGFyaWEtbGFiZWxgIC8gYGRhdGEtdGVzdGlkYCBob29rcyBvblxuICogdGhlIHNoZWxsIHNvIHdlIGlkZW50aWZ5IHRoZSBzaWRlYmFyIGJ5IHRleHQtY29udGVudCBtYXRjaCBhZ2FpbnN0IGtub3duIGl0ZW1cbiAqIGxhYmVscyAoR2VuZXJhbCwgQXBwZWFyYW5jZSwgQ29uZmlndXJhdGlvbiwgXHUyMDI2KS5cbiAqXG4gKiBMYXlvdXQgd2UgaW5qZWN0OlxuICpcbiAqICAgUGVyc29uYWwgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBDb2RleCBncm91cCBsYWJlbClcbiAqICAgW0NvZGV4J3MgZXhpc3RpbmcgaXRlbXMgZ3JvdXBdXG4gKiAgIENvZGV4KysgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUgQ29kZXggZ3JvdXAgbGFiZWwpXG4gKiAgIFx1MjREOCBDb25maWdcbiAqICAgXHUyNjMwIFR3ZWFrc1xuICogICBcdTI1QzcgVHdlYWsgU3RvcmVcbiAqXG4gKiBDbGlja2luZyBDb25maWcgLyBUd2Vha3MgLyBUd2VhayBTdG9yZSBoaWRlcyBDb2RleCdzIGNvbnRlbnQgcGFuZWwgY2hpbGRyZW4gYW5kIHJlbmRlcnNcbiAqIG91ciBvd24gYG1haW4tc3VyZmFjZWAgcGFuZWwgaW4gdGhlaXIgcGxhY2UuIENsaWNraW5nIGFueSBvZiBDb2RleCdzXG4gKiBzaWRlYmFyIGl0ZW1zIHJlc3RvcmVzIHRoZSBvcmlnaW5hbCB2aWV3LlxuICovXG5cbmltcG9ydCB7IGlwY1JlbmRlcmVyIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgdHlwZSB7XG4gIFNldHRpbmdzU2VjdGlvbixcbiAgU2V0dGluZ3NQYWdlLFxuICBTZXR0aW5nc0hhbmRsZSxcbiAgVHdlYWtNYW5pZmVzdCxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcbmltcG9ydCB7XG4gIGJ1aWxkVHdlYWtQdWJsaXNoSXNzdWVVcmwsXG4gIHR5cGUgVHdlYWtTdG9yZUVudHJ5LFxuICB0eXBlIFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbixcbn0gZnJvbSBcIi4uL3R3ZWFrLXN0b3JlXCI7XG5pbXBvcnQge1xuICBjb2RleFBwU2V0dGluZ3NMYWJlbHNGcm9tLFxuICBjb2RleFBwU2V0dGluZ3NMYWJlbFNjb3JlLFxuICBjb21wYWN0U2V0dGluZ3NUZXh0LFxuICBoYXNOYXRpdmVTZXR0aW5nc1NlY3Rpb25IZWFkZXJzLFxuICBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0LFxuICBpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2UsXG4gIGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlLFxufSBmcm9tIFwiLi9zZXR0aW5ncy1kb20taGV1cmlzdGljc1wiO1xuaW1wb3J0IHtcbiAgY29uZmlnSWNvblN2ZyxcbiAgZGVmYXVsdFBhZ2VJY29uU3ZnLFxuICByZWZyZXNoSWNvblN2ZyxcbiAgc3RvcmVJY29uU3ZnLFxuICB0d2Vha3NJY29uU3ZnLFxufSBmcm9tIFwiLi9zZXR0aW5ncy1pY29uc1wiO1xuaW1wb3J0IHsgYXBwZW5kU3ZnSHRtbCwgc3ZnRWxlbWVudCB9IGZyb20gXCIuL3NldHRpbmdzLXN2Z1wiO1xuXG5jb25zdCBDT0RFWF9QTFVTUExVU19SRUxFQVNFU19VUkwgPSBcImh0dHBzOi8vZ2l0aHViLmNvbS9rcGtoeGxneTAvY29kZXgtcGx1c3BsdXMvcmVsZWFzZXNcIjtcblxuLy8gTWlycm9ycyB0aGUgcnVudGltZSdzIG1haW4tc2lkZSBMaXN0ZWRUd2VhayBzaGFwZSAoa2VwdCBpbiBzeW5jIG1hbnVhbGx5KS5cbmludGVyZmFjZSBMaXN0ZWRUd2VhayB7XG4gIG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0O1xuICBlbnRyeTogc3RyaW5nO1xuICBkaXI6IHN0cmluZztcbiAgZW50cnlFeGlzdHM6IGJvb2xlYW47XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZTogVHdlYWtVcGRhdGVDaGVjayB8IG51bGw7XG59XG5cbmludGVyZmFjZSBUd2Vha1VwZGF0ZUNoZWNrIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHJlcG86IHN0cmluZztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgbGF0ZXN0VGFnOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQ29kZXhQbHVzUGx1c0NvbmZpZyB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgYXV0b1VwZGF0ZTogYm9vbGVhbjtcbiAgdXBkYXRlQ2hhbm5lbDogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gIHVwZGF0ZVJlcG86IHN0cmluZztcbiAgdXBkYXRlUmVmOiBzdHJpbmc7XG4gIHVwZGF0ZUNoZWNrOiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sgfCBudWxsO1xuICBzZWxmVXBkYXRlOiBTZWxmVXBkYXRlU3RhdGUgfCBudWxsO1xuICBpbnN0YWxsYXRpb25Tb3VyY2U6IEluc3RhbGxhdGlvblNvdXJjZTtcbn1cblxuaW50ZXJmYWNlIENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB7XG4gIGNoZWNrZWRBdDogc3RyaW5nO1xuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nO1xuICBsYXRlc3RWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlTm90ZXM6IHN0cmluZyB8IG51bGw7XG4gIHVwZGF0ZUF2YWlsYWJsZTogYm9vbGVhbjtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbnR5cGUgU2VsZlVwZGF0ZUNoYW5uZWwgPSBcInN0YWJsZVwiIHwgXCJwcmVyZWxlYXNlXCIgfCBcImN1c3RvbVwiO1xudHlwZSBTZWxmVXBkYXRlU3RhdHVzID0gXCJjaGVja2luZ1wiIHwgXCJ1cC10by1kYXRlXCIgfCBcInVwZGF0ZWRcIiB8IFwiZmFpbGVkXCIgfCBcImRpc2FibGVkXCI7XG5cbmludGVyZmFjZSBTZWxmVXBkYXRlU3RhdGUge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7XG4gIHN0YXR1czogU2VsZlVwZGF0ZVN0YXR1cztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgdGFyZ2V0UmVmOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZXBvOiBzdHJpbmc7XG4gIGNoYW5uZWw6IFNlbGZVcGRhdGVDaGFubmVsO1xuICBzb3VyY2VSb290OiBzdHJpbmc7XG4gIGluc3RhbGxhdGlvblNvdXJjZT86IEluc3RhbGxhdGlvblNvdXJjZTtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJbnN0YWxsYXRpb25Tb3VyY2Uge1xuICBraW5kOiBcImdpdGh1Yi1zb3VyY2VcIiB8IFwiaG9tZWJyZXdcIiB8IFwibG9jYWwtZGV2XCIgfCBcInNvdXJjZS1hcmNoaXZlXCIgfCBcInVua25vd25cIjtcbiAgbGFiZWw6IHN0cmluZztcbiAgZGV0YWlsOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBXYXRjaGVySGVhbHRoIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHN0YXR1czogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCI7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgd2F0Y2hlcjogc3RyaW5nO1xuICBjaGVja3M6IFdhdGNoZXJIZWFsdGhDaGVja1tdO1xufVxuXG5pbnRlcmZhY2UgV2F0Y2hlckhlYWx0aENoZWNrIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzdGF0dXM6IFwib2tcIiB8IFwid2FyblwiIHwgXCJlcnJvclwiO1xuICBkZXRhaWw6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXcge1xuICBzY2hlbWFWZXJzaW9uOiAxO1xuICBnZW5lcmF0ZWRBdD86IHN0cmluZztcbiAgc291cmNlVXJsOiBzdHJpbmc7XG4gIGZldGNoZWRBdDogc3RyaW5nO1xuICBlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlWaWV3W107XG59XG5cbmludGVyZmFjZSBUd2Vha1N0b3JlRW50cnlWaWV3IGV4dGVuZHMgVHdlYWtTdG9yZUVudHJ5IHtcbiAgaW5zdGFsbGVkOiB7XG4gICAgdmVyc2lvbjogc3RyaW5nO1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gIH0gfCBudWxsO1xuICBwbGF0Zm9ybT86IHtcbiAgICBjdXJyZW50OiBzdHJpbmc7XG4gICAgc3VwcG9ydGVkOiBzdHJpbmdbXSB8IG51bGw7XG4gICAgY29tcGF0aWJsZTogYm9vbGVhbjtcbiAgICByZWFzb246IHN0cmluZyB8IG51bGw7XG4gIH07XG4gIHJ1bnRpbWU/OiB7XG4gICAgY3VycmVudDogc3RyaW5nO1xuICAgIHJlcXVpcmVkOiBzdHJpbmcgfCBudWxsO1xuICAgIGNvbXBhdGlibGU6IGJvb2xlYW47XG4gICAgcmVhc29uOiBzdHJpbmcgfCBudWxsO1xuICB9O1xufVxuXG4vKipcbiAqIEEgdHdlYWstcmVnaXN0ZXJlZCBwYWdlLiBXZSBjYXJyeSB0aGUgb3duaW5nIHR3ZWFrJ3MgbWFuaWZlc3Qgc28gd2UgY2FuXG4gKiByZXNvbHZlIHJlbGF0aXZlIGljb25VcmxzIGFuZCBzaG93IGF1dGhvcnNoaXAgaW4gdGhlIHBhZ2UgaGVhZGVyLlxuICovXG5pbnRlcmZhY2UgUmVnaXN0ZXJlZFBhZ2Uge1xuICAvKiogRnVsbHktcXVhbGlmaWVkIGlkOiBgPHR3ZWFrSWQ+OjxwYWdlSWQ+YC4gKi9cbiAgaWQ6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgcGFnZTogU2V0dGluZ3NQYWdlO1xuICAvKiogUGVyLXBhZ2UgRE9NIHRlYXJkb3duIHJldHVybmVkIGJ5IGBwYWdlLnJlbmRlcmAsIGlmIGFueS4gKi9cbiAgdGVhcmRvd24/OiAoKCkgPT4gdm9pZCkgfCBudWxsO1xuICAvKiogVGhlIGluamVjdGVkIHNpZGViYXIgYnV0dG9uIChzbyB3ZSBjYW4gdXBkYXRlIGl0cyBhY3RpdmUgc3RhdGUpLiAqL1xuICBuYXZCdXR0b24/OiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG59XG5cbi8qKiBXaGF0IHBhZ2UgaXMgY3VycmVudGx5IHNlbGVjdGVkIGluIG91ciBpbmplY3RlZCBuYXYuICovXG50eXBlIEFjdGl2ZVBhZ2UgPVxuICB8IHsga2luZDogXCJjb25maWdcIiB9XG4gIHwgeyBraW5kOiBcInN0b3JlXCIgfVxuICB8IHsga2luZDogXCJ0d2Vha3NcIiB9XG4gIHwgeyBraW5kOiBcInJlZ2lzdGVyZWRcIjsgaWQ6IHN0cmluZyB9O1xuXG5pbnRlcmZhY2UgTmF0aXZlTmF2U2VsZWN0aW9uIHtcbiAgYXJpYUN1cnJlbnQ6IHN0cmluZyB8IG51bGw7XG4gIGNsYXNzU25hcHNob3RzOiBNYXA8RWxlbWVudCwgU2V0PHN0cmluZz4+O1xufVxuXG5jb25zdCBOQVRJVkVfU0VMRUNUSU9OX0NMQVNTRVMgPSBbXG4gIFwiYmctcHJpbWFyeS1naG9zdC1ob3ZlclwiLFxuICBcImhvdmVyOmJnLXByaW1hcnktZ2hvc3QtaG92ZXJcIixcbiAgXCJkYXRhLVtzdGF0ZT1vcGVuXTpiZy1wcmltYXJ5LWdob3N0LWhvdmVyXCIsXG4gIFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIsXG4gIFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIsXG4gIFwidGV4dC1lbXBoYXNpc1wiLFxuICBcInRleHQtZGVmYXVsdFwiLFxuICBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIixcbiAgXCJ0ZXh0LXRva2VuLWZvcmVncm91bmRcIixcbiAgXCJ0ZXh0LWNvZGV4LWljb24tYWN0aXZlXCIsXG4gIFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24taWNvbi1mb3JlZ3JvdW5kXCIsXG5dIGFzIGNvbnN0O1xuXG5pbnRlcmZhY2UgSW5qZWN0b3JTdGF0ZSB7XG4gIHNlY3Rpb25zOiBNYXA8c3RyaW5nLCBTZXR0aW5nc1NlY3Rpb24+O1xuICBwYWdlczogTWFwPHN0cmluZywgUmVnaXN0ZXJlZFBhZ2U+O1xuICBsaXN0ZWRUd2Vha3M6IExpc3RlZFR3ZWFrW107XG4gIC8qKiBPdXRlciB3cmFwcGVyIHRoYXQgaG9sZHMgQ29kZXgncyBpdGVtcyBncm91cCArIG91ciBpbmplY3RlZCBncm91cHMuICovXG4gIG91dGVyV3JhcHBlcjogSFRNTEVsZW1lbnQgfCBudWxsO1xuICAvKiogT3VyIFwiR2VuZXJhbFwiIGxhYmVsIGZvciBDb2RleCdzIG5hdGl2ZSBzZXR0aW5ncyBncm91cC4gKi9cbiAgbmF0aXZlTmF2SGVhZGVyOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIC8qKiBPdXIgXCJDb2RleCsrXCIgbmF2IGdyb3VwIChDb25maWcvVHdlYWtzKS4gKi9cbiAgbmF2R3JvdXA6IEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgbmF2QnV0dG9uczogeyBjb25maWc6IEhUTUxCdXR0b25FbGVtZW50OyB0d2Vha3M6IEhUTUxCdXR0b25FbGVtZW50OyBzdG9yZTogSFRNTEJ1dHRvbkVsZW1lbnQgfSB8IG51bGw7XG4gIC8qKiBTaWRlYmFyIHVwZGF0ZSBwaWxsIHNob3duIG9ubHkgd2hlbiBHaXRIdWIgaGFzIGEgbmV3ZXIgQ29kZXgrKyByZWxlYXNlLiAqL1xuICBjb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCB8IG51bGw7XG4gIC8qKiBPdXIgXCJUd2Vha3NcIiBuYXYgZ3JvdXAgKHBlci10d2VhayBwYWdlcykuIENyZWF0ZWQgbGF6aWx5LiAqL1xuICBwYWdlc0dyb3VwOiBIVE1MRWxlbWVudCB8IG51bGw7XG4gIHBhZ2VzR3JvdXBLZXk6IHN0cmluZyB8IG51bGw7XG4gIHBhbmVsSG9zdDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBjb250ZW50SG9zdDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBoaWRkZW5Db250ZW50OiBNYXA8SFRNTEVsZW1lbnQsIHN0cmluZz47XG4gIG9ic2VydmVyOiBNdXRhdGlvbk9ic2VydmVyIHwgbnVsbDtcbiAgZmluZ2VycHJpbnQ6IHN0cmluZyB8IG51bGw7XG4gIHNpZGViYXJEdW1wZWQ6IGJvb2xlYW47XG4gIGFjdGl2ZVBhZ2U6IEFjdGl2ZVBhZ2UgfCBudWxsO1xuICBzaWRlYmFyUm9vdDogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBzaWRlYmFyUmVzdG9yZUhhbmRsZXI6ICgoZTogRXZlbnQpID0+IHZvaWQpIHwgbnVsbDtcbiAgbmF0aXZlTmF2U2VsZWN0aW9uOiBNYXA8SFRNTEJ1dHRvbkVsZW1lbnQsIE5hdGl2ZU5hdlNlbGVjdGlvbj47XG4gIHNldHRpbmdzU3VyZmFjZVZpc2libGU6IGJvb2xlYW47XG4gIHNldHRpbmdzU3VyZmFjZUhpZGVUaW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD4gfCBudWxsO1xuICB0d2Vha1N0b3JlOiBUd2Vha1N0b3JlUmVnaXN0cnlWaWV3IHwgbnVsbDtcbiAgdHdlYWtTdG9yZVByb21pc2U6IFByb21pc2U8VHdlYWtTdG9yZVJlZ2lzdHJ5Vmlldz4gfCBudWxsO1xuICB0d2Vha1N0b3JlRXJyb3I6IHVua25vd247XG59XG5cbmNvbnN0IHN0YXRlOiBJbmplY3RvclN0YXRlID0ge1xuICBzZWN0aW9uczogbmV3IE1hcCgpLFxuICBwYWdlczogbmV3IE1hcCgpLFxuICBsaXN0ZWRUd2Vha3M6IFtdLFxuICBvdXRlcldyYXBwZXI6IG51bGwsXG4gIG5hdGl2ZU5hdkhlYWRlcjogbnVsbCxcbiAgbmF2R3JvdXA6IG51bGwsXG4gIG5hdkJ1dHRvbnM6IG51bGwsXG4gIGNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b246IG51bGwsXG4gIHBhZ2VzR3JvdXA6IG51bGwsXG4gIHBhZ2VzR3JvdXBLZXk6IG51bGwsXG4gIHBhbmVsSG9zdDogbnVsbCxcbiAgY29udGVudEhvc3Q6IG51bGwsXG4gIGhpZGRlbkNvbnRlbnQ6IG5ldyBNYXAoKSxcbiAgb2JzZXJ2ZXI6IG51bGwsXG4gIGZpbmdlcnByaW50OiBudWxsLFxuICBzaWRlYmFyRHVtcGVkOiBmYWxzZSxcbiAgYWN0aXZlUGFnZTogbnVsbCxcbiAgc2lkZWJhclJvb3Q6IG51bGwsXG4gIHNpZGViYXJSZXN0b3JlSGFuZGxlcjogbnVsbCxcbiAgbmF0aXZlTmF2U2VsZWN0aW9uOiBuZXcgTWFwKCksXG4gIHNldHRpbmdzU3VyZmFjZVZpc2libGU6IGZhbHNlLFxuICBzZXR0aW5nc1N1cmZhY2VIaWRlVGltZXI6IG51bGwsXG4gIHR3ZWFrU3RvcmU6IG51bGwsXG4gIHR3ZWFrU3RvcmVQcm9taXNlOiBudWxsLFxuICB0d2Vha1N0b3JlRXJyb3I6IG51bGwsXG59O1xuXG5sZXQgc2NoZWR1bGVkSW5qZWN0RnJhbWU6IG51bWJlciB8IG51bGwgPSBudWxsO1xubGV0IGxhc3RTaWRlYmFyTWlzc2luZ0xvZ0F0ID0gMDtcblxuZnVuY3Rpb24gcGxvZyhtc2c6IHN0cmluZywgZXh0cmE/OiB1bmtub3duKTogdm9pZCB7XG4gIGlwY1JlbmRlcmVyLnNlbmQoXG4gICAgXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsXG4gICAgXCJpbmZvXCIsXG4gICAgYFtzZXR0aW5ncy1pbmplY3Rvcl0gJHttc2d9JHtleHRyYSA9PT0gdW5kZWZpbmVkID8gXCJcIiA6IFwiIFwiICsgc2FmZVN0cmluZ2lmeShleHRyYSl9YCxcbiAgKTtcbn1cbmZ1bmN0aW9uIHNhZmVTdHJpbmdpZnkodjogdW5rbm93bik6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2ID09PSBcInN0cmluZ1wiID8gdiA6IEpTT04uc3RyaW5naWZ5KHYpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gU3RyaW5nKHYpO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBwdWJsaWMgQVBJIFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRTZXR0aW5nc0luamVjdG9yKCk6IHZvaWQge1xuICBpZiAoc3RhdGUub2JzZXJ2ZXIpIHJldHVybjtcblxuICBjb25zdCBvYnMgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgc2NoZWR1bGVJbmplY3QoKTtcbiAgfSk7XG4gIG9icy5vYnNlcnZlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG4gIHN0YXRlLm9ic2VydmVyID0gb2JzO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicG9wc3RhdGVcIiwgb25OYXYpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImhhc2hjaGFuZ2VcIiwgb25OYXYpO1xuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25Eb2N1bWVudENsaWNrLCB0cnVlKTtcbiAgZm9yIChjb25zdCBtIG9mIFtcInB1c2hTdGF0ZVwiLCBcInJlcGxhY2VTdGF0ZVwiXSBhcyBjb25zdCkge1xuICAgIGNvbnN0IG9yaWcgPSBoaXN0b3J5W21dO1xuICAgIGhpc3RvcnlbbV0gPSBmdW5jdGlvbiAodGhpczogSGlzdG9yeSwgLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2Ygb3JpZz4pIHtcbiAgICAgIGNvbnN0IHIgPSBvcmlnLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KGBjb2RleHBwLSR7bX1gKSk7XG4gICAgICByZXR1cm4gcjtcbiAgICB9IGFzIHR5cGVvZiBvcmlnO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGBjb2RleHBwLSR7bX1gLCBvbk5hdik7XG4gIH1cblxuICBydW5JbmplY3RBbmREdW1wKCk7XG4gIGxldCB0aWNrcyA9IDA7XG4gIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIHRpY2tzKys7XG4gICAgc2NoZWR1bGVJbmplY3QoKTtcbiAgICBpZiAodGlja3MgPiA2MCkgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XG4gIH0sIDUwMCk7XG59XG5cbmZ1bmN0aW9uIG9uTmF2KCk6IHZvaWQge1xuICBzdGF0ZS5maW5nZXJwcmludCA9IG51bGw7XG4gIHJ1bkluamVjdEFuZER1bXAoKTtcbn1cblxuZnVuY3Rpb24gcnVuSW5qZWN0QW5kRHVtcCgpOiB2b2lkIHtcbiAgaWYgKHNjaGVkdWxlZEluamVjdEZyYW1lICE9PSBudWxsKSB7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoc2NoZWR1bGVkSW5qZWN0RnJhbWUpO1xuICAgIHNjaGVkdWxlZEluamVjdEZyYW1lID0gbnVsbDtcbiAgfVxuICB0cnlJbmplY3QoKTtcbiAgbWF5YmVEdW1wRG9tKCk7XG59XG5cbmZ1bmN0aW9uIHNjaGVkdWxlSW5qZWN0KCk6IHZvaWQge1xuICBpZiAoc2NoZWR1bGVkSW5qZWN0RnJhbWUgIT09IG51bGwpIHJldHVybjtcbiAgc2NoZWR1bGVkSW5qZWN0RnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIHNjaGVkdWxlZEluamVjdEZyYW1lID0gbnVsbDtcbiAgICB0cnlJbmplY3QoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG9uRG9jdW1lbnRDbGljayhlOiBNb3VzZUV2ZW50KTogdm9pZCB7XG4gIGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0IGluc3RhbmNlb2YgRWxlbWVudCA/IGUudGFyZ2V0IDogbnVsbDtcbiAgY29uc3QgY29udHJvbCA9IHRhcmdldD8uY2xvc2VzdChcIltyb2xlPSdsaW5rJ10sYnV0dG9uLGFcIik7XG4gIGlmICghKGNvbnRyb2wgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHJldHVybjtcbiAgaWYgKGNvbXBhY3RTZXR0aW5nc1RleHQoY29udHJvbC50ZXh0Q29udGVudCB8fCBcIlwiKSAhPT0gXCJCYWNrIHRvIGFwcFwiKSByZXR1cm47XG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHNldFNldHRpbmdzU3VyZmFjZVZpc2libGUoZmFsc2UsIFwiYmFjay10by1hcHBcIik7XG4gIH0sIDApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJTZWN0aW9uKHNlY3Rpb246IFNldHRpbmdzU2VjdGlvbik6IFNldHRpbmdzSGFuZGxlIHtcbiAgc3RhdGUuc2VjdGlvbnMuc2V0KHNlY3Rpb24uaWQsIHNlY3Rpb24pO1xuICBpZiAoc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJ0d2Vha3NcIikgcmVyZW5kZXIoKTtcbiAgcmV0dXJuIHtcbiAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICBzdGF0ZS5zZWN0aW9ucy5kZWxldGUoc2VjdGlvbi5pZCk7XG4gICAgICBpZiAoc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJ0d2Vha3NcIikgcmVyZW5kZXIoKTtcbiAgICB9LFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJTZWN0aW9ucygpOiB2b2lkIHtcbiAgc3RhdGUuc2VjdGlvbnMuY2xlYXIoKTtcbiAgLy8gRHJvcCByZWdpc3RlcmVkIHBhZ2VzIHRvbyBcdTIwMTQgdGhleSdyZSBvd25lZCBieSB0d2Vha3MgdGhhdCBqdXN0IGdvdFxuICAvLyB0b3JuIGRvd24gYnkgdGhlIGhvc3QuIFJ1biBhbnkgdGVhcmRvd25zIGJlZm9yZSBmb3JnZXR0aW5nIHRoZW0uXG4gIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkge1xuICAgIHRyeSB7XG4gICAgICBwLnRlYXJkb3duPy4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBwbG9nKFwicGFnZSB0ZWFyZG93biBmYWlsZWRcIiwgeyBpZDogcC5pZCwgZXJyOiBTdHJpbmcoZSkgfSk7XG4gICAgfVxuICB9XG4gIHN0YXRlLnBhZ2VzLmNsZWFyKCk7XG4gIHN5bmNQYWdlc0dyb3VwKCk7XG4gIC8vIElmIHdlIHdlcmUgb24gYSByZWdpc3RlcmVkIHBhZ2UgdGhhdCBubyBsb25nZXIgZXhpc3RzLCBmYWxsIGJhY2sgdG9cbiAgLy8gcmVzdG9yaW5nIENvZGV4J3Mgdmlldy5cbiAgaWYgKFxuICAgIHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwicmVnaXN0ZXJlZFwiICYmXG4gICAgIXN0YXRlLnBhZ2VzLmhhcyhzdGF0ZS5hY3RpdmVQYWdlLmlkKVxuICApIHtcbiAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gIH0gZWxzZSBpZiAoc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJ0d2Vha3NcIikge1xuICAgIHJlcmVuZGVyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlciBhIHR3ZWFrLW93bmVkIHNldHRpbmdzIHBhZ2UuIFRoZSBydW50aW1lIGluamVjdHMgYSBzaWRlYmFyIGVudHJ5XG4gKiB1bmRlciBhIFwiVFdFQUtTXCIgZ3JvdXAgaGVhZGVyICh3aGljaCBhcHBlYXJzIG9ubHkgd2hlbiBhdCBsZWFzdCBvbmUgcGFnZVxuICogaXMgcmVnaXN0ZXJlZCkgYW5kIHJvdXRlcyBjbGlja3MgdG8gdGhlIHBhZ2UncyBgcmVuZGVyKHJvb3QpYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUGFnZShcbiAgdHdlYWtJZDogc3RyaW5nLFxuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdCxcbiAgcGFnZTogU2V0dGluZ3NQYWdlLFxuKTogU2V0dGluZ3NIYW5kbGUge1xuICBjb25zdCBpZCA9IHBhZ2UuaWQ7IC8vIGFscmVhZHkgbmFtZXNwYWNlZCBieSB0d2Vhay1ob3N0IGFzIGAke3R3ZWFrSWR9OiR7cGFnZS5pZH1gXG4gIGNvbnN0IGVudHJ5OiBSZWdpc3RlcmVkUGFnZSA9IHsgaWQsIHR3ZWFrSWQsIG1hbmlmZXN0LCBwYWdlIH07XG4gIHN0YXRlLnBhZ2VzLnNldChpZCwgZW50cnkpO1xuICBwbG9nKFwicmVnaXN0ZXJQYWdlXCIsIHsgaWQsIHRpdGxlOiBwYWdlLnRpdGxlLCB0d2Vha0lkIH0pO1xuICBzeW5jUGFnZXNHcm91cCgpO1xuICAvLyBJZiB0aGUgdXNlciB3YXMgYWxyZWFkeSBvbiB0aGlzIHBhZ2UgKGhvdCByZWxvYWQpLCByZS1tb3VudCBpdHMgYm9keS5cbiAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwicmVnaXN0ZXJlZFwiICYmIHN0YXRlLmFjdGl2ZVBhZ2UuaWQgPT09IGlkKSB7XG4gICAgcmVyZW5kZXIoKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHVucmVnaXN0ZXI6ICgpID0+IHtcbiAgICAgIGNvbnN0IGUgPSBzdGF0ZS5wYWdlcy5nZXQoaWQpO1xuICAgICAgaWYgKCFlKSByZXR1cm47XG4gICAgICB0cnkge1xuICAgICAgICBlLnRlYXJkb3duPy4oKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIHN0YXRlLnBhZ2VzLmRlbGV0ZShpZCk7XG4gICAgICBzeW5jUGFnZXNHcm91cCgpO1xuICAgICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2U/LmtpbmQgPT09IFwicmVnaXN0ZXJlZFwiICYmIHN0YXRlLmFjdGl2ZVBhZ2UuaWQgPT09IGlkKSB7XG4gICAgICAgIHJlc3RvcmVDb2RleFZpZXcoKTtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuXG4vKiogQ2FsbGVkIGJ5IHRoZSB0d2VhayBob3N0IGFmdGVyIGZldGNoaW5nIHRoZSB0d2VhayBsaXN0IGZyb20gbWFpbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRMaXN0ZWRUd2Vha3MobGlzdDogTGlzdGVkVHdlYWtbXSk6IHZvaWQge1xuICBzdGF0ZS5saXN0ZWRUd2Vha3MgPSBsaXN0O1xuICBpZiAoc3RhdGUuYWN0aXZlUGFnZT8ua2luZCA9PT0gXCJ0d2Vha3NcIikgcmVyZW5kZXIoKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIGluamVjdGlvbiBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gdHJ5SW5qZWN0KCk6IHZvaWQge1xuICByZW1vdmVNaXNwbGFjZWRTZXR0aW5nc0dyb3VwcygpO1xuXG4gIGNvbnN0IGl0ZW1zR3JvdXAgPSBmaW5kU2lkZWJhckl0ZW1zR3JvdXAoKTtcbiAgaWYgKCFpdGVtc0dyb3VwKSB7XG4gICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2UgJiYgKCFzdGF0ZS5zaWRlYmFyUm9vdD8uaXNDb25uZWN0ZWQgfHwgIXN0YXRlLmNvbnRlbnRIb3N0Py5pc0Nvbm5lY3RlZCkpIHtcbiAgICAgIHJlc3RvcmVDb2RleFZpZXcoKTtcbiAgICB9XG4gICAgc2NoZWR1bGVTZXR0aW5nc1N1cmZhY2VIaWRkZW4oKTtcbiAgICBsb2dTaWRlYmFyTWlzc2luZygpO1xuICAgIHJldHVybjtcbiAgfVxuICBsYXN0U2lkZWJhck1pc3NpbmdMb2dBdCA9IDA7XG4gIGlmIChzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIpIHtcbiAgICBjbGVhclRpbWVvdXQoc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyKTtcbiAgICBzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIgPSBudWxsO1xuICB9XG4gIHNldFNldHRpbmdzU3VyZmFjZVZpc2libGUodHJ1ZSwgXCJzaWRlYmFyLWZvdW5kXCIpO1xuICAvLyBDb2RleCdzIG5hdGl2ZSBzZXR0aW5ncyBncm91cHMgbGl2ZSBpbnNpZGUgdGhlIHNjcm9sbGFibGUgbmF2IHN0YWNrLiBJZiB3ZVxuICAvLyBhcHBlbmQgb3V0c2lkZSB0aGF0IHN0YWNrLCB0aGUgZmxleC0xIHNjcm9sbGVyIHB1c2hlcyBDb2RleCsrIHRvIHRoZSBib3R0b21cbiAgLy8gb2YgdGhlIHNpZGViYXIgYW5kIGNyZWF0ZXMgYSBsYXJnZSB2aXN1YWwgZ2FwIGFmdGVyIHRoZSBsYXN0IG5hdGl2ZSBncm91cC5cbiAgY29uc3Qgb3V0ZXIgPSBmaW5kU2lkZWJhckluamVjdGlvblJvb3QoaXRlbXNHcm91cCk7XG4gIGlmICghaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUoaXRlbXNHcm91cCkgfHwgIWlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKG91dGVyKSkge1xuICAgIHNjaGVkdWxlU2V0dGluZ3NTdXJmYWNlSGlkZGVuKCk7XG4gICAgcGxvZyhcInJlamVjdGVkIG5vbi1zZXR0aW5ncyBzaWRlYmFyIGNhbmRpZGF0ZVwiLCB7XG4gICAgICBpdGVtc0dyb3VwOiBkZXNjcmliZShpdGVtc0dyb3VwKSxcbiAgICAgIG91dGVyOiBkZXNjcmliZShvdXRlciksXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzdGF0ZS5hY3RpdmVQYWdlICYmIChzdGF0ZS5zaWRlYmFyUm9vdCAhPT0gb3V0ZXIgfHwgc3RhdGUuY29udGVudEhvc3QgIT09IGZpbmRDb250ZW50QXJlYSgpKSkge1xuICAgIHJlc3RvcmVDb2RleFZpZXcoKTtcbiAgfVxuICBpZiAoc3RhdGUuYWN0aXZlUGFnZSAmJiBzdGF0ZS5jb250ZW50SG9zdCkge1xuICAgIGlmIChzdGF0ZS5wYW5lbEhvc3Q/LnBhcmVudEVsZW1lbnQgIT09IHN0YXRlLmNvbnRlbnRIb3N0KSB7XG4gICAgICBwbG9nKFwiYWN0aXZlIHBhbmVsIHJlbW92ZWQ7IHJlc3RvcmluZyBuYXRpdmUgc2V0dGluZ3NcIik7XG4gICAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVOYXRpdmVDb250ZW50Q2hpbGRyZW4oc3RhdGUuY29udGVudEhvc3QpO1xuICAgIH1cbiAgfVxuICBzdGF0ZS5zaWRlYmFyUm9vdCA9IG91dGVyO1xuICByZW1vdmVTZXR0aW5nc0dyb3Vwc091dHNpZGVSb290KG91dGVyKTtcbiAgc3luY05hdGl2ZVNldHRpbmdzSGVhZGVyKGl0ZW1zR3JvdXAsIG91dGVyKTtcblxuICBpZiAoc3RhdGUubmF2R3JvdXAgJiYgb3V0ZXIuY29udGFpbnMoc3RhdGUubmF2R3JvdXApKSB7XG4gICAgc3luY1BhZ2VzR3JvdXAoKTtcbiAgICAvLyBDb2RleCByZS1yZW5kZXJzIGl0cyBuYXRpdmUgc2lkZWJhciBidXR0b25zIG9uIGl0cyBvd24gc3RhdGUgY2hhbmdlcy5cbiAgICAvLyBJZiBvbmUgb2Ygb3VyIHBhZ2VzIGlzIGFjdGl2ZSwgcmUtc3RyaXAgQ29kZXgncyBhY3RpdmUgc3R5bGluZyBzb1xuICAgIC8vIEdlbmVyYWwgZG9lc24ndCByZWFwcGVhciBhcyBzZWxlY3RlZC5cbiAgICBpZiAoc3RhdGUuYWN0aXZlUGFnZSAhPT0gbnVsbCkgc3luY0NvZGV4TmF0aXZlTmF2QWN0aXZlKHRydWUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFNpZGViYXIgd2FzIGVpdGhlciBmcmVzaGx5IG1vdW50ZWQgKFNldHRpbmdzIGp1c3Qgb3BlbmVkKSBvciByZS1tb3VudGVkXG4gIC8vIChjbG9zZWQgYW5kIHJlLW9wZW5lZCwgb3IgbmF2aWdhdGVkIGF3YXkgYW5kIGJhY2spLiBJbiBhbGwgb2YgdGhvc2VcbiAgLy8gY2FzZXMgQ29kZXggcmVzZXRzIHRvIGl0cyBkZWZhdWx0IHBhZ2UgKEdlbmVyYWwpLCBidXQgb3VyIGluLW1lbW9yeVxuICAvLyBgYWN0aXZlUGFnZWAgbWF5IHN0aWxsIHJlZmVyZW5jZSB0aGUgbGFzdCB0d2Vhay9wYWdlIHRoZSB1c2VyIGhhZCBvcGVuXG4gIC8vIFx1MjAxNCB3aGljaCB3b3VsZCBjYXVzZSB0aGF0IG5hdiBidXR0b24gdG8gcmVuZGVyIHdpdGggdGhlIGFjdGl2ZSBzdHlsaW5nXG4gIC8vIGV2ZW4gdGhvdWdoIENvZGV4IGlzIHNob3dpbmcgR2VuZXJhbC4gQ2xlYXIgaXQgc28gYHN5bmNQYWdlc0dyb3VwYCAvXG4gIC8vIGBzZXROYXZBY3RpdmVgIHN0YXJ0IGZyb20gYSBuZXV0cmFsIHN0YXRlLiBUaGUgcGFuZWxIb3N0IHJlZmVyZW5jZSBpc1xuICAvLyBhbHNvIHN0YWxlIChpdHMgRE9NIHdhcyBkaXNjYXJkZWQgd2l0aCB0aGUgcHJldmlvdXMgY29udGVudCBhcmVhKS5cbiAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2UgIT09IG51bGwgfHwgc3RhdGUucGFuZWxIb3N0ICE9PSBudWxsIHx8IHN0YXRlLmNvbnRlbnRIb3N0ICE9PSBudWxsKSB7XG4gICAgcGxvZyhcInNpZGViYXIgcmUtbW91bnQgZGV0ZWN0ZWQ7IGNsZWFyaW5nIHN0YWxlIGFjdGl2ZSBzdGF0ZVwiLCB7XG4gICAgICBwcmV2QWN0aXZlOiBzdGF0ZS5hY3RpdmVQYWdlLFxuICAgIH0pO1xuICAgIHJlc3RvcmVDb2RleFZpZXcoKTtcbiAgfVxuXG4gIGNvbnN0IGV4aXN0aW5nQ29kZXhQcE5hdkdyb3VwID1cbiAgICBvdXRlci5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PignOnNjb3BlID4gW2RhdGEtY29kZXhwcD1cIm5hdi1ncm91cFwiXScpID8/XG4gICAgb3V0ZXIucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJ1tkYXRhLWNvZGV4cHA9XCJuYXYtZ3JvdXBcIl0nKTtcblxuICBpZiAoZXhpc3RpbmdDb2RleFBwTmF2R3JvdXApIHtcbiAgICBzdGF0ZS5uYXZHcm91cCA9IGV4aXN0aW5nQ29kZXhQcE5hdkdyb3VwO1xuICAgIHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24gPSBleGlzdGluZ0NvZGV4UHBOYXZHcm91cC5xdWVyeVNlbGVjdG9yPEhUTUxCdXR0b25FbGVtZW50PihcbiAgICAgIFwiW2RhdGEtY29kZXhwcC1zaWRlYmFyLXVwZGF0ZV1cIixcbiAgICApO1xuICAgIHN0YXRlLnNpZGViYXJSb290ID0gb3V0ZXI7XG4gICAgc3luY1BhZ2VzR3JvdXAoKTtcbiAgICByZWZyZXNoU2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oKTtcbiAgICBpZiAoc3RhdGUuYWN0aXZlUGFnZSAhPT0gbnVsbCkgc3luY0NvZGV4TmF0aXZlTmF2QWN0aXZlKHRydWUpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFx1MjUwMFx1MjUwMCBHcm91cCBjb250YWluZXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZ3JvdXAuZGF0YXNldC5jb2RleHBwID0gXCJuYXYtZ3JvdXBcIjtcbiAgZ3JvdXAuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0xXCI7XG5cbiAgY29uc3QgdXBkYXRlQnV0dG9uID0gc2lkZWJhclVwZGF0ZVBpbGxCdXR0b24oKTtcbiAgc3RhdGUuY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbiA9IHVwZGF0ZUJ1dHRvbjtcbiAgZ3JvdXAuYXBwZW5kQ2hpbGQoc2lkZWJhckdyb3VwSGVhZGVyKFwiQ29kZXgrK1wiLCB1cGRhdGVCdXR0b24pKTtcbiAgcmVmcmVzaFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKCk7XG5cbiAgLy8gXHUyNTAwXHUyNTAwIFNpZGViYXIgaXRlbXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGNvbmZpZ0J0biA9IG1ha2VTaWRlYmFySXRlbShcIkNvbmZpZ1wiLCBjb25maWdJY29uU3ZnKCkpO1xuICBjb25zdCB0d2Vha3NCdG4gPSBtYWtlU2lkZWJhckl0ZW0oXCJUd2Vha3NcIiwgdHdlYWtzSWNvblN2ZygpKTtcbiAgY29uc3Qgc3RvcmVCdG4gPSBtYWtlU2lkZWJhckl0ZW0oXCJUd2VhayBTdG9yZVwiLCBzdG9yZUljb25TdmcoKSk7XG4gIGFwcGVuZFNpZGViYXJTdG9yZVVwZGF0ZUJhZGdlKHN0b3JlQnRuKTtcblxuICBjb25maWdCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgYWN0aXZhdGVQYWdlKHsga2luZDogXCJjb25maWdcIiB9KTtcbiAgfSk7XG4gIHR3ZWFrc0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcInR3ZWFrc1wiIH0pO1xuICB9KTtcbiAgc3RvcmVCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgYWN0aXZhdGVQYWdlKHsga2luZDogXCJzdG9yZVwiIH0pO1xuICB9KTtcblxuICBjb25zdCBpdGVtcyA9IHNpZGViYXJHcm91cEl0ZW1zKCk7XG4gIGl0ZW1zLmFwcGVuZENoaWxkKGNvbmZpZ0J0bik7XG4gIGl0ZW1zLmFwcGVuZENoaWxkKHR3ZWFrc0J0bik7XG4gIGl0ZW1zLmFwcGVuZENoaWxkKHN0b3JlQnRuKTtcbiAgZ3JvdXAuYXBwZW5kQ2hpbGQoaXRlbXMpO1xuICBvdXRlci5hcHBlbmRDaGlsZChncm91cCk7XG5cbiAgc3RhdGUubmF2R3JvdXAgPSBncm91cDtcbiAgc3RhdGUubmF2QnV0dG9ucyA9IHsgY29uZmlnOiBjb25maWdCdG4sIHR3ZWFrczogdHdlYWtzQnRuLCBzdG9yZTogc3RvcmVCdG4gfTtcbiAgcGxvZyhcIm5hdiBncm91cCBpbmplY3RlZFwiLCB7IG91dGVyVGFnOiBvdXRlci50YWdOYW1lIH0pO1xuICBzeW5jUGFnZXNHcm91cCgpO1xufVxuXG5mdW5jdGlvbiBsb2dTaWRlYmFyTWlzc2luZygpOiB2b2lkIHtcbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgaWYgKG5vdyAtIGxhc3RTaWRlYmFyTWlzc2luZ0xvZ0F0IDwgNTAwMCkgcmV0dXJuO1xuICBsYXN0U2lkZWJhck1pc3NpbmdMb2dBdCA9IG5vdztcbiAgcGxvZyhcInNpZGViYXIgbm90IGZvdW5kXCIpO1xufVxuXG5mdW5jdGlvbiBzeW5jTmF0aXZlU2V0dGluZ3NIZWFkZXIoaXRlbXNHcm91cDogSFRNTEVsZW1lbnQsIG91dGVyOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBpZiAoc3RhdGUubmF0aXZlTmF2SGVhZGVyICYmIG91dGVyLmNvbnRhaW5zKHN0YXRlLm5hdGl2ZU5hdkhlYWRlcikpIHJldHVybjtcbiAgaWYgKG91dGVyID09PSBpdGVtc0dyb3VwKSByZXR1cm47XG4gIGlmIChoYXNOYXRpdmVTZXR0aW5nc1NlY3Rpb25IZWFkZXJzKG91dGVyKSkgcmV0dXJuO1xuXG4gIGNvbnN0IGhlYWRlciA9IHNpZGViYXJHcm91cEhlYWRlcihcIkdlbmVyYWxcIik7XG4gIGhlYWRlci5kYXRhc2V0LmNvZGV4cHAgPSBcIm5hdGl2ZS1uYXYtaGVhZGVyXCI7XG4gIG91dGVyLmluc2VydEJlZm9yZShoZWFkZXIsIGl0ZW1zR3JvdXApO1xuICBzdGF0ZS5uYXRpdmVOYXZIZWFkZXIgPSBoZWFkZXI7XG59XG5cbmZ1bmN0aW9uIGZpbmRTaWRlYmFySW5qZWN0aW9uUm9vdChpdGVtc0dyb3VwOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgb3duU2Nyb2xsYWJsZSA9IHNtYWxsZXN0U2V0dGluZ3NTY3JvbGxhYmxlKFtpdGVtc0dyb3VwXSk7XG4gIGlmIChvd25TY3JvbGxhYmxlKSByZXR1cm4gb3duU2Nyb2xsYWJsZTtcblxuICBjb25zdCBkZXNjZW5kYW50U2Nyb2xsYWJsZSA9IHNtYWxsZXN0U2V0dGluZ3NTY3JvbGxhYmxlKFxuICAgIEFycmF5LmZyb20oaXRlbXNHcm91cC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImRpdixuYXYsYXNpZGVcIikpLFxuICApO1xuICBpZiAoZGVzY2VuZGFudFNjcm9sbGFibGUpIHJldHVybiBkZXNjZW5kYW50U2Nyb2xsYWJsZTtcblxuICBjb25zdCBhbmNlc3RvcnM6IEhUTUxFbGVtZW50W10gPSBbXTtcbiAgbGV0IG5vZGUgPSBpdGVtc0dyb3VwLnBhcmVudEVsZW1lbnQ7XG4gIGZvciAobGV0IGRlcHRoID0gMDsgbm9kZSAmJiBkZXB0aCA8IDU7IGRlcHRoKyspIHtcbiAgICBhbmNlc3RvcnMucHVzaChub2RlKTtcbiAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICB9XG4gIGNvbnN0IGFuY2VzdG9yU2Nyb2xsYWJsZSA9IHNtYWxsZXN0U2V0dGluZ3NTY3JvbGxhYmxlKGFuY2VzdG9ycyk7XG4gIGlmIChhbmNlc3RvclNjcm9sbGFibGUpIHJldHVybiBhbmNlc3RvclNjcm9sbGFibGU7XG5cbiAgcmV0dXJuIGl0ZW1zR3JvdXAucGFyZW50RWxlbWVudCA/PyBpdGVtc0dyb3VwO1xufVxuXG5mdW5jdGlvbiBzbWFsbGVzdFNldHRpbmdzU2Nyb2xsYWJsZShub2RlczogSFRNTEVsZW1lbnRbXSk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGxldCBiZXN0OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBsZXQgYmVzdEFyZWEgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG5cbiAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG4gICAgaWYgKCFub2RlLmNsYXNzTGlzdC5jb250YWlucyhcIm92ZXJmbG93LXktYXV0b1wiKSkgY29udGludWU7XG4gICAgaWYgKCFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShub2RlKSkgY29udGludWU7XG4gICAgY29uc3QgcmVjdCA9IG5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgYXJlYSA9IHJlY3Qud2lkdGggKiByZWN0LmhlaWdodDtcbiAgICBpZiAoYXJlYSA8IGJlc3RBcmVhKSB7XG4gICAgICBiZXN0ID0gbm9kZTtcbiAgICAgIGJlc3RBcmVhID0gYXJlYTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYmVzdDtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlU2V0dGluZ3NHcm91cHNPdXRzaWRlUm9vdChyb290OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBncm91cHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICBcIltkYXRhLWNvZGV4cHA9J25hdi1ncm91cCddLCBbZGF0YS1jb2RleHBwPSdwYWdlcy1ncm91cCddLCBbZGF0YS1jb2RleHBwPSduYXRpdmUtbmF2LWhlYWRlciddXCIsXG4gICk7XG4gIGZvciAoY29uc3QgZ3JvdXAgb2YgQXJyYXkuZnJvbShncm91cHMpKSB7XG4gICAgaWYgKGdyb3VwLnBhcmVudEVsZW1lbnQgPT09IHJvb3QpIGNvbnRpbnVlO1xuICAgIHJlc2V0Q29kZXhQcEluamVjdGVkU2V0dGluZ3NHcm91cFN0YXRlKGdyb3VwKTtcbiAgICBncm91cC5yZW1vdmUoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaWRlYmFyR3JvdXBIZWFkZXIodGV4dDogc3RyaW5nLCB0cmFpbGluZz86IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBoZWFkZXIuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgcHItMC41IHBsLTIgc2VsZWN0LW5vbmVcIjtcbiAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgbGFiZWwuY2xhc3NOYW1lID0gXCJtaW4tdy0wIGZsZXgtMSB0cnVuY2F0ZSB0ZXh0LWJhc2UgdGV4dC10b2tlbi1pbnB1dC1wbGFjZWhvbGRlci1mb3JlZ3JvdW5kIG9wYWNpdHktNzVcIjtcbiAgbGFiZWwudGV4dENvbnRlbnQgPSB0ZXh0O1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQobGFiZWwpO1xuICBpZiAodHJhaWxpbmcpIHtcbiAgICBjb25zdCB0cmFpbGluZ1dyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHRyYWlsaW5nV3JhcC5jbGFzc05hbWUgPSBcInNocmluay0wXCI7XG4gICAgdHJhaWxpbmdXcmFwLmFwcGVuZENoaWxkKHRyYWlsaW5nKTtcbiAgICBoZWFkZXIuYXBwZW5kQ2hpbGQodHJhaWxpbmdXcmFwKTtcbiAgfVxuICByZXR1cm4gaGVhZGVyO1xufVxuXG5mdW5jdGlvbiBzaWRlYmFyR3JvdXBJdGVtcygpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGl0ZW1zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaXRlbXMuZGF0YXNldC5jb2RleHBwID0gXCJncm91cC1pdGVtc1wiO1xuICBpdGVtcy5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLXB4XCI7XG4gIHJldHVybiBpdGVtcztcbn1cblxuZnVuY3Rpb24gc2NoZWR1bGVTZXR0aW5nc1N1cmZhY2VIaWRkZW4oKTogdm9pZCB7XG4gIGlmICghc3RhdGUuc2V0dGluZ3NTdXJmYWNlVmlzaWJsZSB8fCBzdGF0ZS5zZXR0aW5nc1N1cmZhY2VIaWRlVGltZXIpIHJldHVybjtcbiAgc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgc3RhdGUuc2V0dGluZ3NTdXJmYWNlSGlkZVRpbWVyID0gbnVsbDtcbiAgICBjb25zdCBzaWRlYmFyID0gZmluZFNpZGViYXJJdGVtc0dyb3VwKCk7XG4gICAgaWYgKHNpZGViYXIgJiYgaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUoc2lkZWJhcikpIHJldHVybjtcbiAgICBpZiAoaXNTZXR0aW5nc1RleHRWaXNpYmxlKCkpIHJldHVybjtcbiAgICBzZXRTZXR0aW5nc1N1cmZhY2VWaXNpYmxlKGZhbHNlLCBcInNpZGViYXItbm90LWZvdW5kXCIpO1xuICB9LCAxNTAwKTtcbn1cblxuZnVuY3Rpb24gaXNTZXR0aW5nc1RleHRWaXNpYmxlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNDb2RleFBwU2V0dGluZ3NMYWJlbFNldChjb2RleFBwU2V0dGluZ3NMYWJlbHNGcm9tKGRvY3VtZW50KSk7XG59XG5cbmZ1bmN0aW9uIHNldFNldHRpbmdzU3VyZmFjZVZpc2libGUodmlzaWJsZTogYm9vbGVhbiwgcmVhc29uOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLnNldHRpbmdzU3VyZmFjZVZpc2libGUgPT09IHZpc2libGUpIHJldHVybjtcbiAgc3RhdGUuc2V0dGluZ3NTdXJmYWNlVmlzaWJsZSA9IHZpc2libGU7XG4gIGlmICh2aXNpYmxlKSB3YXJtVHdlYWtTdG9yZSgpO1xuICB0cnkge1xuICAgICh3aW5kb3cgYXMgV2luZG93ICYgeyBfX2NvZGV4cHBTZXR0aW5nc1N1cmZhY2VWaXNpYmxlPzogYm9vbGVhbiB9KS5fX2NvZGV4cHBTZXR0aW5nc1N1cmZhY2VWaXNpYmxlID0gdmlzaWJsZTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5jb2RleHBwU2V0dGluZ3NTdXJmYWNlID0gdmlzaWJsZSA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiO1xuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KFxuICAgICAgbmV3IEN1c3RvbUV2ZW50KFwiY29kZXhwcDpzZXR0aW5ncy1zdXJmYWNlXCIsIHtcbiAgICAgICAgZGV0YWlsOiB7IHZpc2libGUsIHJlYXNvbiB9LFxuICAgICAgfSksXG4gICAgKTtcbiAgfSBjYXRjaCB7fVxuICBwbG9nKFwic2V0dGluZ3Mgc3VyZmFjZVwiLCB7IHZpc2libGUsIHJlYXNvbiwgdXJsOiBsb2NhdGlvbi5ocmVmIH0pO1xufVxuXG4vKipcbiAqIFJlbmRlciAob3IgcmUtcmVuZGVyKSB0aGUgc2Vjb25kIHNpZGViYXIgZ3JvdXAgb2YgcGVyLXR3ZWFrIHBhZ2VzLiBUaGVcbiAqIGdyb3VwIGlzIGNyZWF0ZWQgbGF6aWx5IGFuZCByZW1vdmVkIHdoZW4gdGhlIGxhc3QgcGFnZSB1bnJlZ2lzdGVycywgc29cbiAqIHVzZXJzIHdpdGggbm8gcGFnZS1yZWdpc3RlcmluZyB0d2Vha3MgbmV2ZXIgc2VlIGFuIGVtcHR5IFwiVHdlYWtzXCIgaGVhZGVyLlxuICovXG5mdW5jdGlvbiBzeW5jUGFnZXNHcm91cCgpOiB2b2lkIHtcbiAgY29uc3Qgb3V0ZXIgPSBzdGF0ZS5zaWRlYmFyUm9vdDtcbiAgaWYgKCFvdXRlcikgcmV0dXJuO1xuICBpZiAoIWlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKG91dGVyKSkge1xuICAgIHN0YXRlLnNpZGViYXJSb290ID0gbnVsbDtcbiAgICBzdGF0ZS5wYWdlc0dyb3VwID0gbnVsbDtcbiAgICBzdGF0ZS5wYWdlc0dyb3VwS2V5ID0gbnVsbDtcbiAgICBmb3IgKGNvbnN0IHAgb2Ygc3RhdGUucGFnZXMudmFsdWVzKCkpIHAubmF2QnV0dG9uID0gbnVsbDtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcGFnZXMgPSBbLi4uc3RhdGUucGFnZXMudmFsdWVzKCldO1xuXG4gIC8vIEJ1aWxkIGEgZGV0ZXJtaW5pc3RpYyBmaW5nZXJwcmludCBvZiB0aGUgZGVzaXJlZCBncm91cCBzdGF0ZS4gSWYgdGhlXG4gIC8vIGN1cnJlbnQgRE9NIGdyb3VwIGFscmVhZHkgbWF0Y2hlcywgdGhpcyBpcyBhIG5vLW9wIFx1MjAxNCBjcml0aWNhbCwgYmVjYXVzZVxuICAvLyBzeW5jUGFnZXNHcm91cCBpcyBjYWxsZWQgb24gZXZlcnkgTXV0YXRpb25PYnNlcnZlciB0aWNrIGFuZCBhbnkgRE9NXG4gIC8vIHdyaXRlIHdvdWxkIHJlLXRyaWdnZXIgdGhhdCBvYnNlcnZlciAoaW5maW5pdGUgbG9vcCwgYXBwIGZyZWV6ZSkuXG4gIGNvbnN0IGRlc2lyZWRLZXkgPSBwYWdlcy5sZW5ndGggPT09IDBcbiAgICA/IFwiRU1QVFlcIlxuICAgIDogcGFnZXMubWFwKChwKSA9PiBgJHtwLmlkfXwke3AucGFnZS50aXRsZX18JHtwLnBhZ2UuaWNvblN2ZyA/PyBcIlwifWApLmpvaW4oXCJcXG5cIik7XG4gIGNvbnN0IGdyb3VwQXR0YWNoZWQgPSAhIXN0YXRlLnBhZ2VzR3JvdXAgJiYgb3V0ZXIuY29udGFpbnMoc3RhdGUucGFnZXNHcm91cCk7XG4gIGlmIChzdGF0ZS5wYWdlc0dyb3VwS2V5ID09PSBkZXNpcmVkS2V5ICYmIChwYWdlcy5sZW5ndGggPT09IDAgPyAhZ3JvdXBBdHRhY2hlZCA6IGdyb3VwQXR0YWNoZWQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHBhZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChzdGF0ZS5wYWdlc0dyb3VwKSB7XG4gICAgICBzdGF0ZS5wYWdlc0dyb3VwLnJlbW92ZSgpO1xuICAgICAgc3RhdGUucGFnZXNHcm91cCA9IG51bGw7XG4gICAgfVxuICAgIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkgcC5uYXZCdXR0b24gPSBudWxsO1xuICAgIHN0YXRlLnBhZ2VzR3JvdXBLZXkgPSBkZXNpcmVkS2V5O1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBncm91cCA9IHN0YXRlLnBhZ2VzR3JvdXA7XG4gIGlmICghZ3JvdXAgfHwgIW91dGVyLmNvbnRhaW5zKGdyb3VwKSkge1xuICAgIGdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBncm91cC5kYXRhc2V0LmNvZGV4cHAgPSBcInBhZ2VzLWdyb3VwXCI7XG4gICAgZ3JvdXAuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0xXCI7XG4gICAgZ3JvdXAuYXBwZW5kQ2hpbGQoc2lkZWJhckdyb3VwSGVhZGVyKFwiVHdlYWtzXCIpKTtcbiAgICBncm91cC5hcHBlbmRDaGlsZChzaWRlYmFyR3JvdXBJdGVtcygpKTtcbiAgICBvdXRlci5hcHBlbmRDaGlsZChncm91cCk7XG4gICAgc3RhdGUucGFnZXNHcm91cCA9IGdyb3VwO1xuICB9XG5cbiAgbGV0IGl0ZW1zID0gZ3JvdXAucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJzpzY29wZSA+IFtkYXRhLWNvZGV4cHA9XCJncm91cC1pdGVtc1wiXScpO1xuICBpZiAoIWl0ZW1zKSB7XG4gICAgaXRlbXMgPSBzaWRlYmFyR3JvdXBJdGVtcygpO1xuICAgIHdoaWxlIChncm91cC5jaGlsZHJlbi5sZW5ndGggPiAxKSBpdGVtcy5hcHBlbmRDaGlsZChncm91cC5jaGlsZHJlblsxXSk7XG4gICAgZ3JvdXAuYXBwZW5kQ2hpbGQoaXRlbXMpO1xuICB9XG4gIGl0ZW1zLnJlcGxhY2VDaGlsZHJlbigpO1xuXG4gIGZvciAoY29uc3QgcCBvZiBwYWdlcykge1xuICAgIGNvbnN0IGljb24gPSBwLnBhZ2UuaWNvblN2ZyA/PyBkZWZhdWx0UGFnZUljb25TdmcoKTtcbiAgICBjb25zdCBidG4gPSBtYWtlU2lkZWJhckl0ZW0ocC5wYWdlLnRpdGxlLCBpY29uKTtcbiAgICBidG4uZGF0YXNldC5jb2RleHBwID0gYG5hdi1wYWdlLSR7cC5pZH1gO1xuICAgIGJ0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBhY3RpdmF0ZVBhZ2UoeyBraW5kOiBcInJlZ2lzdGVyZWRcIiwgaWQ6IHAuaWQgfSk7XG4gICAgfSk7XG4gICAgcC5uYXZCdXR0b24gPSBidG47XG4gICAgaXRlbXMuYXBwZW5kQ2hpbGQoYnRuKTtcbiAgfVxuICBzdGF0ZS5wYWdlc0dyb3VwS2V5ID0gZGVzaXJlZEtleTtcbiAgcGxvZyhcInBhZ2VzIGdyb3VwIHN5bmNlZFwiLCB7XG4gICAgY291bnQ6IHBhZ2VzLmxlbmd0aCxcbiAgICBpZHM6IHBhZ2VzLm1hcCgocCkgPT4gcC5pZCksXG4gIH0pO1xuICAvLyBSZWZsZWN0IGN1cnJlbnQgYWN0aXZlIHN0YXRlIGFjcm9zcyB0aGUgcmVidWlsdCBidXR0b25zLlxuICBzZXROYXZBY3RpdmUoc3RhdGUuYWN0aXZlUGFnZSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VTaWRlYmFySXRlbShsYWJlbDogc3RyaW5nLCBpY29uU3ZnOiBzdHJpbmcpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIC8vIENsYXNzIHN0cmluZyBjb3BpZWQgdmVyYmF0aW0gZnJvbSBDb2RleCdzIHNpZGViYXIgYnV0dG9ucyAoR2VuZXJhbCBldGMpLlxuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5kYXRhc2V0LmNvZGV4cHAgPSBgbmF2LSR7bGFiZWwudG9Mb3dlckNhc2UoKX1gO1xuICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCBsYWJlbCk7XG4gIGJ0bi5jbGFzc05hbWUgPVxuICAgIFwiZm9jdXMtdmlzaWJsZTpvdXRsaW5lLXRva2VuLWJvcmRlciByZWxhdGl2ZSBweC1yb3cteCBweS1yb3cteSBjdXJzb3ItaW50ZXJhY3Rpb24gc2hyaW5rLTAgaXRlbXMtY2VudGVyIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIHRleHQtbGVmdCB0ZXh0LXNtIGZvY3VzLXZpc2libGU6b3V0bGluZSBmb2N1cy12aXNpYmxlOm91dGxpbmUtMiBmb2N1cy12aXNpYmxlOm91dGxpbmUtb2Zmc2V0LTIgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNTAgZ2FwLTIgZmxleCB3LWZ1bGwgaG92ZXI6YmctcHJpbWFyeS1naG9zdC1ob3ZlciBkYXRhLVtzdGF0ZT1vcGVuXTpiZy1wcmltYXJ5LWdob3N0LWhvdmVyIGhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZCBmb250LW5vcm1hbFwiO1xuXG4gIGNvbnN0IGlubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaW5uZXIuY2xhc3NOYW1lID1cbiAgICBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgdGV4dC1iYXNlIGdhcC0yIGZsZXgtMSB0ZXh0LWRlZmF1bHQgdGV4dC10b2tlbi1mb3JlZ3JvdW5kXCI7XG4gIGFwcGVuZFN2Z0h0bWwoaW5uZXIsIGljb25TdmcpO1xuICBjb25zdCB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHRleHQuY2xhc3NOYW1lID0gXCJ0cnVuY2F0ZVwiO1xuICB0ZXh0LnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGlubmVyLmFwcGVuZENoaWxkKHRleHQpO1xuICBidG4uYXBwZW5kQ2hpbGQoaW5uZXIpO1xuICByZXR1cm4gYnRuO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRTaWRlYmFyU3RvcmVVcGRhdGVCYWRnZShidG46IEhUTUxCdXR0b25FbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGlubmVyID0gYnRuLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKCFpbm5lcikgcmV0dXJuO1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBiYWRnZS5kYXRhc2V0LmNvZGV4cHBTdG9yZVVwZGF0ZUJhZGdlID0gXCJ0cnVlXCI7XG4gIGJhZGdlLmhpZGRlbiA9IHRydWU7XG4gIGJhZGdlLnRpdGxlID0gXCJJbnN0YWxsZWQgdHdlYWtzIHdpdGggYXBwcm92ZWQgdXBkYXRlc1wiO1xuICBiYWRnZS5jbGFzc05hbWUgPSBcImlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiO1xuICBPYmplY3QuYXNzaWduKGJhZGdlLnN0eWxlLCB7XG4gICAgcG9zaXRpb246IFwiYWJzb2x1dGVcIixcbiAgICByaWdodDogXCIxMnB4XCIsXG4gICAgdG9wOiBcIjUwJVwiLFxuICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKC01MCUpXCIsXG4gICAgekluZGV4OiBcIjFcIixcbiAgfSk7XG4gIGFwcGx5U3RvcmVVcGRhdGVCYWRnZVN0eWxlKGJhZGdlLCBudWxsKTtcbiAgYnRuLmFwcGVuZENoaWxkKGJhZGdlKTtcbn1cblxuLyoqIEludGVybmFsIGtleSBmb3IgdGhlIGJ1aWx0LWluIG5hdiBidXR0b25zLiAqL1xudHlwZSBCdWlsdGluUGFnZSA9IFwiY29uZmlnXCIgfCBcInR3ZWFrc1wiIHwgXCJzdG9yZVwiO1xuXG5mdW5jdGlvbiBzZXROYXZBY3RpdmUoYWN0aXZlOiBBY3RpdmVQYWdlIHwgbnVsbCk6IHZvaWQge1xuICAvLyBCdWlsdC1pbiAoQ29uZmlnL1R3ZWFrcykgYnV0dG9ucy5cbiAgaWYgKHN0YXRlLm5hdkJ1dHRvbnMpIHtcbiAgICBjb25zdCBidWlsdGluOiBCdWlsdGluUGFnZSB8IG51bGwgPVxuICAgICAgYWN0aXZlPy5raW5kID09PSBcImNvbmZpZ1wiID8gXCJjb25maWdcIiA6XG4gICAgICBhY3RpdmU/LmtpbmQgPT09IFwidHdlYWtzXCIgPyBcInR3ZWFrc1wiIDpcbiAgICAgIGFjdGl2ZT8ua2luZCA9PT0gXCJzdG9yZVwiID8gXCJzdG9yZVwiIDogbnVsbDtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGJ0bl0gb2YgT2JqZWN0LmVudHJpZXMoc3RhdGUubmF2QnV0dG9ucykgYXMgW0J1aWx0aW5QYWdlLCBIVE1MQnV0dG9uRWxlbWVudF1bXSkge1xuICAgICAgYXBwbHlOYXZBY3RpdmUoYnRuLCBrZXkgPT09IGJ1aWx0aW4pO1xuICAgIH1cbiAgfVxuICAvLyBQZXItcGFnZSByZWdpc3RlcmVkIGJ1dHRvbnMuXG4gIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkge1xuICAgIGlmICghcC5uYXZCdXR0b24pIGNvbnRpbnVlO1xuICAgIGNvbnN0IGlzQWN0aXZlID0gYWN0aXZlPy5raW5kID09PSBcInJlZ2lzdGVyZWRcIiAmJiBhY3RpdmUuaWQgPT09IHAuaWQ7XG4gICAgYXBwbHlOYXZBY3RpdmUocC5uYXZCdXR0b24sIGlzQWN0aXZlKTtcbiAgfVxuICAvLyBDb2RleCdzIG93biBzaWRlYmFyIGJ1dHRvbnMgKEdlbmVyYWwsIEFwcGVhcmFuY2UsIGV0YykuIFdoZW4gb25lIG9mXG4gIC8vIG91ciBwYWdlcyBpcyBhY3RpdmUsIENvZGV4IHN0aWxsIGhhcyBhcmlhLWN1cnJlbnQ9XCJwYWdlXCIgYW5kIHRoZVxuICAvLyBhY3RpdmUtYmcgY2xhc3Mgb24gd2hpY2hldmVyIGl0ZW0gaXQgY29uc2lkZXJlZCB0aGUgcm91dGUgXHUyMDE0IHR5cGljYWxseVxuICAvLyBHZW5lcmFsLiBUaGF0IG1ha2VzIGJvdGggYnV0dG9ucyBsb29rIHNlbGVjdGVkLiBTdHJpcCBDb2RleCdzIGFjdGl2ZVxuICAvLyBzdHlsaW5nIHdoaWxlIG9uZSBvZiBvdXJzIGlzIGFjdGl2ZTsgcmVzdG9yZSBpdCB3aGVuIG5vbmUgaXMuXG4gIHN5bmNDb2RleE5hdGl2ZU5hdkFjdGl2ZShhY3RpdmUgIT09IG51bGwpO1xufVxuXG4vKipcbiAqIE11dGUgQ29kZXgncyBvd24gYWN0aXZlLXN0YXRlIHN0eWxpbmcgb24gaXRzIHNpZGViYXIgYnV0dG9ucy4gV2UgZG9uJ3RcbiAqIHRvdWNoIENvZGV4J3MgUmVhY3Qgc3RhdGUuIE91ciBjYXB0dXJlLXBoYXNlIG5hdGl2ZS1jbGljayBsaXN0ZW5lciByZXN0b3Jlc1xuICogdGhlIHNhdmVkIHN0eWxpbmcgYmVmb3JlIENvZGV4J3Mgcm91dGUgaGFuZGxlciBydW5zLCBzbyBzZWxlY3RpbmcgdGhlIHNhbWVcbiAqIG5hdGl2ZSBpdGVtIGFsc28gd29ya3Mgd2hlbiBSZWFjdCBkb2VzIG5vdCByZS1yZW5kZXIgaXQuXG4gKlxuICogYG11dGU9dHJ1ZWAgIFx1MjE5MiBzYXZlIGFuZCBzdHJpcCBuYXRpdmUgc2VsZWN0aW9uIHN0eWxpbmdcbiAqIGBtdXRlPWZhbHNlYCBcdTIxOTIgcmVzdG9yZSB0aGUgc2F2ZWQgc3R5bGluZywgaW5jbHVkaW5nIHNhbWUtaXRlbSBjbGlja3Mgd2l0aG91dCBhIFJlYWN0IHJlLXJlbmRlclxuICovXG5mdW5jdGlvbiBzeW5jQ29kZXhOYXRpdmVOYXZBY3RpdmUobXV0ZTogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoIW11dGUpIHtcbiAgICBmb3IgKGNvbnN0IFtidG4sIHNuYXBzaG90XSBvZiBzdGF0ZS5uYXRpdmVOYXZTZWxlY3Rpb24pIHtcbiAgICAgIGlmIChzbmFwc2hvdC5hcmlhQ3VycmVudCA9PT0gbnVsbCkgYnRuLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKTtcbiAgICAgIGVsc2UgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiLCBzbmFwc2hvdC5hcmlhQ3VycmVudCk7XG4gICAgICBmb3IgKGNvbnN0IFtlbGVtZW50LCBjbGFzc2VzXSBvZiBzbmFwc2hvdC5jbGFzc1NuYXBzaG90cykge1xuICAgICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgTkFUSVZFX1NFTEVDVElPTl9DTEFTU0VTKSBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUobmFtZSwgY2xhc3Nlcy5oYXMobmFtZSkpO1xuICAgICAgfVxuICAgIH1cbiAgICBzdGF0ZS5uYXRpdmVOYXZTZWxlY3Rpb24uY2xlYXIoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgcm9vdCA9IHN0YXRlLnNpZGViYXJSb290O1xuICBpZiAoIXJvb3QpIHJldHVybjtcbiAgY29uc3QgYnV0dG9ucyA9IEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxCdXR0b25FbGVtZW50PihcImJ1dHRvblwiKSk7XG4gIGZvciAoY29uc3QgYnRuIG9mIGJ1dHRvbnMpIHtcbiAgICAvLyBTa2lwIG91ciBvd24gYnV0dG9ucy5cbiAgICBpZiAoYnRuLmRhdGFzZXQuY29kZXhwcCkgY29udGludWU7XG4gICAgY29uc3QgYWN0aXZlID0gYnRuLmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSA9PT0gXCJwYWdlXCIgfHxcbiAgICAgIGJ0bi5jbGFzc0xpc3QuY29udGFpbnMoXCJiZy1wcmltYXJ5LWdob3N0LWhvdmVyXCIpIHx8XG4gICAgICBidG4uY2xhc3NMaXN0LmNvbnRhaW5zKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIGlmICghYWN0aXZlICYmICFzdGF0ZS5uYXRpdmVOYXZTZWxlY3Rpb24uaGFzKGJ0bikpIGNvbnRpbnVlO1xuICAgIGxldCBzbmFwc2hvdCA9IHN0YXRlLm5hdGl2ZU5hdlNlbGVjdGlvbi5nZXQoYnRuKTtcbiAgICBpZiAoIXNuYXBzaG90KSB7XG4gICAgICBzbmFwc2hvdCA9IHsgYXJpYUN1cnJlbnQ6IGJ0bi5nZXRBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIiksIGNsYXNzU25hcHNob3RzOiBuZXcgTWFwKCkgfTtcbiAgICAgIHN0YXRlLm5hdGl2ZU5hdlNlbGVjdGlvbi5zZXQoYnRuLCBzbmFwc2hvdCk7XG4gICAgfVxuICAgIGNhcHR1cmVOYXRpdmVTZWxlY3Rpb25DbGFzc2VzKHNuYXBzaG90LCBidG4pO1xuICAgIGJ0bi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIik7XG4gICAgYnRuLmNsYXNzTGlzdC5yZW1vdmUoXCJiZy1wcmltYXJ5LWdob3N0LWhvdmVyXCIsIFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIGJ0bi5jbGFzc0xpc3QuYWRkKFwiaG92ZXI6YmctcHJpbWFyeS1naG9zdC1ob3ZlclwiLCBcImRhdGEtW3N0YXRlPW9wZW5dOmJnLXByaW1hcnktZ2hvc3QtaG92ZXJcIixcbiAgICAgIFwiaG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIGNvbnN0IGlubmVyID0gYnRuLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICBpZiAoaW5uZXIpIHtcbiAgICAgIGNhcHR1cmVOYXRpdmVTZWxlY3Rpb25DbGFzc2VzKHNuYXBzaG90LCBpbm5lcik7XG4gICAgICBpbm5lci5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC1lbXBoYXNpc1wiLCBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgICBpbm5lci5jbGFzc0xpc3QuYWRkKFwidGV4dC1kZWZhdWx0XCIsIFwidGV4dC10b2tlbi1mb3JlZ3JvdW5kXCIpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGljb24gb2YgQXJyYXkuZnJvbShidG4ucXVlcnlTZWxlY3RvckFsbDxFbGVtZW50PihcIipcIikpKSB7XG4gICAgICBpZiAoIWljb24uY2xhc3NMaXN0LmNvbnRhaW5zKFwidGV4dC1jb2RleC1pY29uLWFjdGl2ZVwiKSAmJlxuICAgICAgICAgICFpY29uLmNsYXNzTGlzdC5jb250YWlucyhcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKSkgY29udGludWU7XG4gICAgICBjYXB0dXJlTmF0aXZlU2VsZWN0aW9uQ2xhc3NlcyhzbmFwc2hvdCwgaWNvbik7XG4gICAgICBpY29uLmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LWNvZGV4LWljb24tYWN0aXZlXCIsIFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24taWNvbi1mb3JlZ3JvdW5kXCIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjYXB0dXJlTmF0aXZlU2VsZWN0aW9uQ2xhc3NlcyhzbmFwc2hvdDogTmF0aXZlTmF2U2VsZWN0aW9uLCBlbGVtZW50OiBFbGVtZW50KTogdm9pZCB7XG4gIGlmIChzbmFwc2hvdC5jbGFzc1NuYXBzaG90cy5oYXMoZWxlbWVudCkpIHJldHVybjtcbiAgc25hcHNob3QuY2xhc3NTbmFwc2hvdHMuc2V0KGVsZW1lbnQsXG4gICAgbmV3IFNldChOQVRJVkVfU0VMRUNUSU9OX0NMQVNTRVMuZmlsdGVyKChuYW1lKSA9PiBlbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhuYW1lKSkpKTtcbn1cblxuZnVuY3Rpb24gYXBwbHlOYXZBY3RpdmUoYnRuOiBIVE1MQnV0dG9uRWxlbWVudCwgYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGlubmVyID0gYnRuLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgaWYgKGFjdGl2ZSkge1xuICAgICAgYnRuLmNsYXNzTGlzdC5yZW1vdmUoXCJob3ZlcjpiZy1wcmltYXJ5LWdob3N0LWhvdmVyXCIsIFwiZGF0YS1bc3RhdGU9b3Blbl06YmctcHJpbWFyeS1naG9zdC1ob3ZlclwiLFxuICAgICAgICBcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoXCJiZy1wcmltYXJ5LWdob3N0LWhvdmVyXCIsIFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgICAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiLCBcInBhZ2VcIik7XG4gICAgICBpZiAoaW5uZXIpIHtcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LnJlbW92ZShcInRleHQtZGVmYXVsdFwiLCBcInRleHQtdG9rZW4tZm9yZWdyb3VuZFwiKTtcbiAgICAgICAgaW5uZXIuY2xhc3NMaXN0LmFkZChcInRleHQtZW1waGFzaXNcIiwgXCJ0ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1mb3JlZ3JvdW5kXCIpO1xuICAgICAgICBpbm5lclxuICAgICAgICAgIC5xdWVyeVNlbGVjdG9yKFwic3ZnXCIpXG4gICAgICAgICAgPy5jbGFzc0xpc3QuYWRkKFwidGV4dC1jb2RleC1pY29uLWFjdGl2ZVwiLCBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYnRuLmNsYXNzTGlzdC5hZGQoXCJob3ZlcjpiZy1wcmltYXJ5LWdob3N0LWhvdmVyXCIsIFwiZGF0YS1bc3RhdGU9b3Blbl06YmctcHJpbWFyeS1naG9zdC1ob3ZlclwiLFxuICAgICAgICBcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xuICAgICAgYnRuLmNsYXNzTGlzdC5yZW1vdmUoXCJiZy1wcmltYXJ5LWdob3N0LWhvdmVyXCIsIFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgICAgYnRuLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKTtcbiAgICAgIGlmIChpbm5lcikge1xuICAgICAgICBpbm5lci5jbGFzc0xpc3QuYWRkKFwidGV4dC1kZWZhdWx0XCIsIFwidGV4dC10b2tlbi1mb3JlZ3JvdW5kXCIpO1xuICAgICAgICBpbm5lci5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC1lbXBoYXNpc1wiLCBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgICAgIGlubmVyXG4gICAgICAgICAgLnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIilcbiAgICAgICAgICA/LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LWNvZGV4LWljb24tYWN0aXZlXCIsIFwidGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24taWNvbi1mb3JlZ3JvdW5kXCIpO1xuICAgICAgfVxuICAgIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIGFjdGl2YXRpb24gXHUyNTAwXHUyNTAwXG5cbmZ1bmN0aW9uIGFjdGl2YXRlUGFnZShwYWdlOiBBY3RpdmVQYWdlKTogdm9pZCB7XG4gIGNvbnN0IGNvbnRlbnQgPSBmaW5kQ29udGVudEFyZWEoKTtcbiAgaWYgKCFjb250ZW50KSB7XG4gICAgaWYgKHN0YXRlLmFjdGl2ZVBhZ2UpIHJlc3RvcmVDb2RleFZpZXcoKTtcbiAgICBwbG9nKFwiYWN0aXZhdGU6IGNvbnRlbnQgYXJlYSBub3QgZm91bmRcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzdGF0ZS5jb250ZW50SG9zdCAmJiBzdGF0ZS5jb250ZW50SG9zdCAhPT0gY29udGVudCkgcmVzdG9yZUNvZGV4VmlldygpO1xuICBzdGF0ZS5hY3RpdmVQYWdlID0gcGFnZTtcbiAgc3RhdGUuY29udGVudEhvc3QgPSBjb250ZW50O1xuICBwbG9nKFwiYWN0aXZhdGVcIiwgeyBwYWdlIH0pO1xuXG4gIC8vIEhpZGUgQ29kZXgncyBjb250ZW50IGNoaWxkcmVuLCBzaG93IG91cnMuXG4gIGhpZGVOYXRpdmVDb250ZW50Q2hpbGRyZW4oY29udGVudCk7XG4gIGxldCBwYW5lbCA9IGNvbnRlbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oJ1tkYXRhLWNvZGV4cHA9XCJ0d2Vha3MtcGFuZWxcIl0nKTtcbiAgaWYgKCFwYW5lbCkge1xuICAgIHBhbmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBwYW5lbC5kYXRhc2V0LmNvZGV4cHAgPSBcInR3ZWFrcy1wYW5lbFwiO1xuICAgIHBhbmVsLnN0eWxlLmNzc1RleHQgPSBcIndpZHRoOjEwMCU7aGVpZ2h0OjEwMCU7b3ZlcmZsb3c6YXV0bztcIjtcbiAgICBjb250ZW50LmFwcGVuZENoaWxkKHBhbmVsKTtcbiAgfVxuICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICBzdGF0ZS5wYW5lbEhvc3QgPSBwYW5lbDtcbiAgcmVyZW5kZXIoKTtcbiAgc2V0TmF2QWN0aXZlKHBhZ2UpO1xuICAvLyByZXN0b3JlIENvZGV4J3Mgdmlldy4gUmUtcmVnaXN0ZXIgaWYgbmVlZGVkLlxuICBjb25zdCBzaWRlYmFyID0gc3RhdGUuc2lkZWJhclJvb3Q7XG4gIGlmIChzaWRlYmFyKSB7XG4gICAgaWYgKHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlcikge1xuICAgICAgc2lkZWJhci5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyLCB0cnVlKTtcbiAgICB9XG4gICAgY29uc3QgaGFuZGxlciA9IChlOiBFdmVudCkgPT4ge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gZS50YXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgICAgaWYgKCF0YXJnZXQpIHJldHVybjtcbiAgICAgIGlmIChzdGF0ZS5uYXZHcm91cD8uY29udGFpbnModGFyZ2V0KSkgcmV0dXJuOyAvLyBvdXIgYnV0dG9uc1xuICAgICAgaWYgKHN0YXRlLnBhZ2VzR3JvdXA/LmNvbnRhaW5zKHRhcmdldCkpIHJldHVybjsgLy8gb3VyIHBhZ2UgYnV0dG9uc1xuICAgICAgaWYgKHRhcmdldC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zZXR0aW5ncy1zZWFyY2hdXCIpKSByZXR1cm47XG4gICAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgfTtcbiAgICBzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIgPSBoYW5kbGVyO1xuICAgIHNpZGViYXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGhhbmRsZXIsIHRydWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhpZGVOYXRpdmVDb250ZW50Q2hpbGRyZW4oY29udGVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBjaGlsZCBvZiBBcnJheS5mcm9tKGNvbnRlbnQuY2hpbGRyZW4pIGFzIEhUTUxFbGVtZW50W10pIHtcbiAgICBpZiAoY2hpbGQuZGF0YXNldC5jb2RleHBwID09PSBcInR3ZWFrcy1wYW5lbFwiKSBjb250aW51ZTtcbiAgICBpZiAoIXN0YXRlLmhpZGRlbkNvbnRlbnQuaGFzKGNoaWxkKSkgc3RhdGUuaGlkZGVuQ29udGVudC5zZXQoY2hpbGQsIGNoaWxkLnN0eWxlLmRpc3BsYXkpO1xuICAgIGlmIChjaGlsZC5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikgY2hpbGQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc3RvcmVDb2RleFZpZXcoKTogdm9pZCB7XG4gIHBsb2coXCJyZXN0b3JlIGNvZGV4IHZpZXdcIik7XG4gIGlmIChzdGF0ZS5wYW5lbEhvc3QpIHN0YXRlLnBhbmVsSG9zdC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gIHN0YXRlLnBhbmVsSG9zdCA9IG51bGw7XG4gIGZvciAoY29uc3QgW2NoaWxkLCBkaXNwbGF5XSBvZiBzdGF0ZS5oaWRkZW5Db250ZW50KSBjaGlsZC5zdHlsZS5kaXNwbGF5ID0gZGlzcGxheTtcbiAgc3RhdGUuaGlkZGVuQ29udGVudC5jbGVhcigpO1xuICBzdGF0ZS5jb250ZW50SG9zdCA9IG51bGw7XG4gIHN0YXRlLmFjdGl2ZVBhZ2UgPSBudWxsO1xuICBzZXROYXZBY3RpdmUobnVsbCk7XG4gIGlmIChzdGF0ZS5zaWRlYmFyUm9vdCAmJiBzdGF0ZS5zaWRlYmFyUmVzdG9yZUhhbmRsZXIpIHtcbiAgICBzdGF0ZS5zaWRlYmFyUm9vdC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgXCJjbGlja1wiLFxuICAgICAgc3RhdGUuc2lkZWJhclJlc3RvcmVIYW5kbGVyLFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICAgIHN0YXRlLnNpZGViYXJSZXN0b3JlSGFuZGxlciA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVyZW5kZXIoKTogdm9pZCB7XG4gIGlmICghc3RhdGUuYWN0aXZlUGFnZSkgcmV0dXJuO1xuICBjb25zdCBob3N0ID0gc3RhdGUucGFuZWxIb3N0O1xuICBpZiAoIWhvc3QpIHJldHVybjtcbiAgaG9zdC5yZXBsYWNlQ2hpbGRyZW4oKTtcblxuICBjb25zdCBhcCA9IHN0YXRlLmFjdGl2ZVBhZ2U7XG4gIGlmIChhcC5raW5kID09PSBcInJlZ2lzdGVyZWRcIikge1xuICAgIGNvbnN0IGVudHJ5ID0gc3RhdGUucGFnZXMuZ2V0KGFwLmlkKTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXN0b3JlQ29kZXhWaWV3KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHJvb3QgPSBwYW5lbFNoZWxsKGVudHJ5LnBhZ2UudGl0bGUsIGVudHJ5LnBhZ2UuZGVzY3JpcHRpb24pO1xuICAgIGhvc3QuYXBwZW5kQ2hpbGQocm9vdC5vdXRlcik7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFRlYXIgZG93biBhbnkgcHJpb3IgcmVuZGVyIGJlZm9yZSByZS1yZW5kZXJpbmcgKGhvdCByZWxvYWQpLlxuICAgICAgdHJ5IHsgZW50cnkudGVhcmRvd24/LigpOyB9IGNhdGNoIHt9XG4gICAgICBlbnRyeS50ZWFyZG93biA9IG51bGw7XG4gICAgICBjb25zdCByZXQgPSBlbnRyeS5wYWdlLnJlbmRlcihyb290LnNlY3Rpb25zV3JhcCk7XG4gICAgICBpZiAodHlwZW9mIHJldCA9PT0gXCJmdW5jdGlvblwiKSBlbnRyeS50ZWFyZG93biA9IHJldDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zdCBlcnIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgZXJyLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi1jaGFydHMtcmVkIHRleHQtc21cIjtcbiAgICAgIGVyci50ZXh0Q29udGVudCA9IGBFcnJvciByZW5kZXJpbmcgcGFnZTogJHsoZSBhcyBFcnJvcikubWVzc2FnZX1gO1xuICAgICAgcm9vdC5zZWN0aW9uc1dyYXAuYXBwZW5kQ2hpbGQoZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgdGl0bGUgPVxuICAgIGFwLmtpbmQgPT09IFwidHdlYWtzXCIgPyBcIlR3ZWFrc1wiIDpcbiAgICBhcC5raW5kID09PSBcInN0b3JlXCIgPyBcIlR3ZWFrIFN0b3JlXCIgOiBcIkNvZGV4KytcIjtcbiAgY29uc3Qgc3VidGl0bGUgPVxuICAgIGFwLmtpbmQgPT09IFwidHdlYWtzXCJcbiAgICAgID8gXCJNYW5hZ2UgeW91ciBpbnN0YWxsZWQgQ29kZXgrKyB0d2Vha3MuXCJcbiAgICAgIDogYXAua2luZCA9PT0gXCJzdG9yZVwiXG4gICAgICAgID8gXCJJbnN0YWxsIHJldmlld2VkIHR3ZWFrcyBwaW5uZWQgdG8gYXBwcm92ZWQgR2l0SHViIGNvbW1pdHMuXCJcbiAgICAgICAgOiBcIkNoZWNraW5nIGluc3RhbGxlZCBDb2RleCsrIHZlcnNpb24uXCI7XG4gIGNvbnN0IHJvb3QgPSBwYW5lbFNoZWxsKHRpdGxlLCBzdWJ0aXRsZSk7XG4gIGhvc3QuYXBwZW5kQ2hpbGQocm9vdC5vdXRlcik7XG4gIGlmIChhcC5raW5kID09PSBcInR3ZWFrc1wiKSByZW5kZXJUd2Vha3NQYWdlKHJvb3Quc2VjdGlvbnNXcmFwKTtcbiAgZWxzZSBpZiAoYXAua2luZCA9PT0gXCJzdG9yZVwiKSByZW5kZXJUd2Vha1N0b3JlUGFnZShyb290LnNlY3Rpb25zV3JhcCwgcm9vdC5oZWFkZXJBY3Rpb25zKTtcbiAgZWxzZSByZW5kZXJDb25maWdQYWdlKHJvb3Quc2VjdGlvbnNXcmFwLCByb290LnN1YnRpdGxlKTtcbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIHBhZ2VzIFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiByZW5kZXJDb25maWdQYWdlKFxuICBzZWN0aW9uc1dyYXA6IEhUTUxFbGVtZW50LFxuICBzdWJ0aXRsZT86IEhUTUxFbGVtZW50LFxuKTogdm9pZCB7XG4gIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJDb2RleCsrIFVwZGF0ZXNcIikpO1xuICBjb25zdCBjYXJkID0gcm91bmRlZENhcmQoKTtcbiAgY2FyZC5kYXRhc2V0LmNvZGV4cHBDb25maWdDYXJkID0gXCJ0cnVlXCI7XG4gIGNvbnN0IGxvYWRpbmcgPSByb3dTaW1wbGUoXCJMb2FkaW5nIHVwZGF0ZSBzZXR0aW5nc1wiLCBcIkNoZWNraW5nIGN1cnJlbnQgQ29kZXgrKyBjb25maWd1cmF0aW9uLlwiKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChsb2FkaW5nKTtcbiAgc2VjdGlvbi5hcHBlbmRDaGlsZChjYXJkKTtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNlY3Rpb24pO1xuXG4gIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAuaW52b2tlKFwiY29kZXhwcDpnZXQtY29uZmlnXCIpXG4gICAgLnRoZW4oKGNvbmZpZykgPT4ge1xuICAgICAgaWYgKHN1YnRpdGxlKSB7XG4gICAgICAgIHN1YnRpdGxlLnRleHRDb250ZW50ID0gYFlvdSBoYXZlIENvZGV4KysgJHsoY29uZmlnIGFzIENvZGV4UGx1c1BsdXNDb25maWcpLnZlcnNpb259IGluc3RhbGxlZC5gO1xuICAgICAgfVxuICAgICAgY2FyZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICByZW5kZXJDb2RleFBsdXNQbHVzQ29uZmlnKGNhcmQsIGNvbmZpZyBhcyBDb2RleFBsdXNQbHVzQ29uZmlnKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgaWYgKHN1YnRpdGxlKSBzdWJ0aXRsZS50ZXh0Q29udGVudCA9IFwiQ291bGQgbm90IGxvYWQgaW5zdGFsbGVkIENvZGV4KysgdmVyc2lvbi5cIjtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDb3VsZCBub3QgbG9hZCB1cGRhdGUgc2V0dGluZ3NcIiwgU3RyaW5nKGUpKSk7XG4gICAgfSk7XG5cbiAgY29uc3Qgd2F0Y2hlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWN0aW9uXCIpO1xuICB3YXRjaGVyLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICB3YXRjaGVyLmFwcGVuZENoaWxkKHNlY3Rpb25UaXRsZShcIkF1dG8tUmVwYWlyIFdhdGNoZXJcIikpO1xuICBjb25zdCB3YXRjaGVyQ2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIHdhdGNoZXJDYXJkLmFwcGVuZENoaWxkKHJvd1NpbXBsZShcIkNoZWNraW5nIHdhdGNoZXJcIiwgXCJWZXJpZnlpbmcgdGhlIHVwZGF0ZXIgcmVwYWlyIHNlcnZpY2UuXCIpKTtcbiAgd2F0Y2hlci5hcHBlbmRDaGlsZCh3YXRjaGVyQ2FyZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZCh3YXRjaGVyKTtcbiAgcmVuZGVyV2F0Y2hlckhlYWx0aENhcmQod2F0Y2hlckNhcmQpO1xuXG4gIGNvbnN0IG1haW50ZW5hbmNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gIG1haW50ZW5hbmNlLmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMlwiO1xuICBtYWludGVuYW5jZS5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJNYWludGVuYW5jZVwiKSk7XG4gIGNvbnN0IG1haW50ZW5hbmNlQ2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIG1haW50ZW5hbmNlQ2FyZC5hcHBlbmRDaGlsZCh1bmluc3RhbGxSb3coKSk7XG4gIG1haW50ZW5hbmNlQ2FyZC5hcHBlbmRDaGlsZChyZXBvcnRCdWdSb3coKSk7XG4gIG1haW50ZW5hbmNlLmFwcGVuZENoaWxkKG1haW50ZW5hbmNlQ2FyZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZChtYWludGVuYW5jZSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvZGV4UGx1c1BsdXNDb25maWcoY2FyZDogSFRNTEVsZW1lbnQsIGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IHZvaWQge1xuICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjb25maWcudXBkYXRlQ2hlY2spO1xuICBjYXJkLmFwcGVuZENoaWxkKGF1dG9VcGRhdGVSb3coY29uZmlnKSk7XG4gIGNhcmQuYXBwZW5kQ2hpbGQodXBkYXRlQ2hhbm5lbFJvdyhjb25maWcpKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChpbnN0YWxsYXRpb25Tb3VyY2VSb3coY29uZmlnLmluc3RhbGxhdGlvblNvdXJjZSkpO1xuICBjYXJkLmFwcGVuZENoaWxkKHNlbGZVcGRhdGVTdGF0dXNSb3coY29uZmlnLnNlbGZVcGRhdGUpKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChjaGVja0ZvclVwZGF0ZXNSb3coY29uZmlnKSk7XG4gIGlmIChjb25maWcudXBkYXRlQ2hlY2spIGNhcmQuYXBwZW5kQ2hpbGQocmVsZWFzZU5vdGVzUm93KGNvbmZpZy51cGRhdGVDaGVjaykpO1xufVxuXG5mdW5jdGlvbiBhdXRvVXBkYXRlUm93KGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gXCJBdXRvbWF0aWNhbGx5IHJlZnJlc2ggQ29kZXgrK1wiO1xuICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGVzYy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XG4gIGRlc2MudGV4dENvbnRlbnQgPSBgSW5zdGFsbGVkIHZlcnNpb24gdiR7Y29uZmlnLnZlcnNpb259LiBUaGUgd2F0Y2hlciBjaGVja3MgaG91cmx5IGFuZCBjYW4gcmVmcmVzaCB0aGUgQ29kZXgrKyBydW50aW1lIGF1dG9tYXRpY2FsbHkuYDtcbiAgbGVmdC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIGxlZnQuYXBwZW5kQ2hpbGQoZGVzYyk7XG4gIHJvdy5hcHBlbmRDaGlsZChsZWZ0KTtcbiAgcm93LmFwcGVuZENoaWxkKFxuICAgIHN3aXRjaENvbnRyb2woY29uZmlnLmF1dG9VcGRhdGUsIGFzeW5jIChuZXh0KSA9PiB7XG4gICAgICBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnNldC1hdXRvLXVwZGF0ZVwiLCBuZXh0KTtcbiAgICB9KSxcbiAgKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gdXBkYXRlQ2hhbm5lbFJvdyhjb25maWc6IENvZGV4UGx1c1BsdXNDb25maWcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGFjdGlvblJvdyhcIlJlbGVhc2UgY2hhbm5lbFwiLCB1cGRhdGVDaGFubmVsU3VtbWFyeShjb25maWcpKTtcbiAgY29uc3QgYWN0aW9uID0gcm93LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1yb3ctYWN0aW9uc11cIik7XG4gIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XG4gIHNlbGVjdC5jbGFzc05hbWUgPVxuICAgIFwiaC04IHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdHJhbnNwYXJlbnQgcHgtMiB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5IGZvY3VzOm91dGxpbmUtbm9uZVwiO1xuICBmb3IgKGNvbnN0IFt2YWx1ZSwgbGFiZWxdIG9mIFtcbiAgICBbXCJzdGFibGVcIiwgXCJTdGFibGVcIl0sXG4gICAgW1wicHJlcmVsZWFzZVwiLCBcIlByZXJlbGVhc2VcIl0sXG4gICAgW1wiY3VzdG9tXCIsIFwiQ3VzdG9tXCJdLFxuICBdIGFzIGNvbnN0KSB7XG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICBvcHRpb24udmFsdWUgPSB2YWx1ZTtcbiAgICBvcHRpb24udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgICBvcHRpb24uc2VsZWN0ZWQgPSBjb25maWcudXBkYXRlQ2hhbm5lbCA9PT0gdmFsdWU7XG4gICAgc2VsZWN0LmFwcGVuZENoaWxkKG9wdGlvbik7XG4gIH1cbiAgc2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xuICAgIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAgIC5pbnZva2UoXCJjb2RleHBwOnNldC11cGRhdGUtY29uZmlnXCIsIHsgdXBkYXRlQ2hhbm5lbDogc2VsZWN0LnZhbHVlIH0pXG4gICAgICAudGhlbigoKSA9PiByZWZyZXNoQ29uZmlnQ2FyZChyb3cpKVxuICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwic2V0IHVwZGF0ZSBjaGFubmVsIGZhaWxlZFwiLCBTdHJpbmcoZSkpKTtcbiAgfSk7XG4gIGFjdGlvbj8uYXBwZW5kQ2hpbGQoc2VsZWN0KTtcbiAgaWYgKGNvbmZpZy51cGRhdGVDaGFubmVsID09PSBcImN1c3RvbVwiKSB7XG4gICAgYWN0aW9uPy5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJFZGl0XCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgcmVwbyA9IHdpbmRvdy5wcm9tcHQoXCJHaXRIdWIgcmVwb1wiLCBjb25maWcudXBkYXRlUmVwbyB8fCBcImtwa2h4bGd5MC9jb2RleC1wbHVzcGx1c1wiKTtcbiAgICAgICAgaWYgKHJlcG8gPT09IG51bGwpIHJldHVybjtcbiAgICAgICAgY29uc3QgcmVmID0gd2luZG93LnByb21wdChcIkdpdCByZWZcIiwgY29uZmlnLnVwZGF0ZVJlZiB8fCBcIm1hc3RlclwiKTtcbiAgICAgICAgaWYgKHJlZiA9PT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAgICAgLmludm9rZShcImNvZGV4cHA6c2V0LXVwZGF0ZS1jb25maWdcIiwge1xuICAgICAgICAgICAgdXBkYXRlQ2hhbm5lbDogXCJjdXN0b21cIixcbiAgICAgICAgICAgIHVwZGF0ZVJlcG86IHJlcG8sXG4gICAgICAgICAgICB1cGRhdGVSZWY6IHJlZixcbiAgICAgICAgICB9KVxuICAgICAgICAgIC50aGVuKCgpID0+IHJlZnJlc2hDb25maWdDYXJkKHJvdykpXG4gICAgICAgICAgLmNhdGNoKChlKSA9PiBwbG9nKFwic2V0IGN1c3RvbSB1cGRhdGUgc291cmNlIGZhaWxlZFwiLCBTdHJpbmcoZSkpKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gaW5zdGFsbGF0aW9uU291cmNlUm93KHNvdXJjZTogSW5zdGFsbGF0aW9uU291cmNlKTogSFRNTEVsZW1lbnQge1xuICByZXR1cm4gcm93U2ltcGxlKFwiSW5zdGFsbGF0aW9uIHNvdXJjZVwiLCBgJHtzb3VyY2UubGFiZWx9OiAke3NvdXJjZS5kZXRhaWx9YCk7XG59XG5cbmZ1bmN0aW9uIHNlbGZVcGRhdGVTdGF0dXNSb3coc3RhdGU6IFNlbGZVcGRhdGVTdGF0ZSB8IG51bGwpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IHJvd1NpbXBsZShcIkxhc3QgQ29kZXgrKyB1cGRhdGVcIiwgc2VsZlVwZGF0ZVN1bW1hcnkoc3RhdGUpKTtcbiAgY29uc3QgbGVmdCA9IHJvdy5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChsZWZ0ICYmIHN0YXRlKSBsZWZ0LnByZXBlbmQoc3RhdHVzQmFkZ2Uoc2VsZlVwZGF0ZVN0YXR1c1RvbmUoc3RhdGUuc3RhdHVzKSwgc2VsZlVwZGF0ZVN0YXR1c0xhYmVsKHN0YXRlLnN0YXR1cykpKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gY2hlY2tGb3JVcGRhdGVzUm93KGNvbmZpZzogQ29kZXhQbHVzUGx1c0NvbmZpZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgY2hlY2sgPSBjb25maWcudXBkYXRlQ2hlY2s7XG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC1jb2wgZ2FwLTFcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICB0aXRsZS50ZXh0Q29udGVudCA9IGNoZWNrPy51cGRhdGVBdmFpbGFibGUgPyBcIkNvZGV4KysgdXBkYXRlIGF2YWlsYWJsZVwiIDogXCJDaGVjayBmb3IgQ29kZXgrKyB1cGRhdGVzXCI7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcbiAgZGVzYy50ZXh0Q29udGVudCA9IHVwZGF0ZVN1bW1hcnkoY2hlY2spO1xuICBsZWZ0LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgbGVmdC5hcHBlbmRDaGlsZChkZXNjKTtcbiAgcm93LmFwcGVuZENoaWxkKGxlZnQpO1xuXG4gIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgaWYgKGNoZWNrPy5yZWxlYXNlVXJsKSB7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJSZWxlYXNlIE5vdGVzXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgY2hlY2sucmVsZWFzZVVybCk7XG4gICAgICB9KSxcbiAgICApO1xuICB9XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIkNoZWNrIE5vd1wiLCAoKSA9PiB7XG4gICAgICByb3cuc3R5bGUub3BhY2l0eSA9IFwiMC42NVwiO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpjaGVjay1jb2RleHBwLXVwZGF0ZVwiLCB0cnVlKVxuICAgICAgICAudGhlbigoY2hlY2spID0+IHtcbiAgICAgICAgICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihjaGVjayBhcyBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2spO1xuICAgICAgICAgIHJlZnJlc2hDb25maWdDYXJkKHJvdyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZSkgPT4gcGxvZyhcIkNvZGV4KysgcmVsZWFzZSBjaGVjayBmYWlsZWRcIiwgU3RyaW5nKGUpKSlcbiAgICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICAgIHJvdy5zdHlsZS5vcGFjaXR5ID0gXCJcIjtcbiAgICAgICAgfSk7XG4gICAgfSksXG4gICk7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIkRvd25sb2FkIFVwZGF0ZVwiLCAoKSA9PiB7XG4gICAgICByb3cuc3R5bGUub3BhY2l0eSA9IFwiMC42NVwiO1xuICAgICAgY29uc3QgYnV0dG9ucyA9IGFjdGlvbnMucXVlcnlTZWxlY3RvckFsbChcImJ1dHRvblwiKTtcbiAgICAgIGJ1dHRvbnMuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gdHJ1ZSkpO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDpydW4tY29kZXhwcC11cGRhdGVcIilcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbih0cnVlKTtcbiAgICAgICAgICByZWZyZXNoQ29uZmlnQ2FyZChyb3cpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgICAgICBwbG9nKFwiQ29kZXgrKyBzZWxmLXVwZGF0ZSBmYWlsZWRcIiwgU3RyaW5nKGUpKTtcbiAgICAgICAgICB2b2lkIHJlZnJlc2hDb25maWdDYXJkKHJvdyk7XG4gICAgICAgIH0pXG4gICAgICAgIC5maW5hbGx5KCgpID0+IHtcbiAgICAgICAgICByb3cuc3R5bGUub3BhY2l0eSA9IFwiXCI7XG4gICAgICAgICAgYnV0dG9ucy5mb3JFYWNoKChidXR0b24pID0+IChidXR0b24uZGlzYWJsZWQgPSBmYWxzZSkpO1xuICAgICAgICB9KTtcbiAgICB9KSxcbiAgKTtcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiByZWxlYXNlTm90ZXNSb3coY2hlY2s6IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LWNvbCBnYXAtMiBwLTNcIjtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcInRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBcIkxhdGVzdCByZWxlYXNlIG5vdGVzXCI7XG4gIHJvdy5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBib2R5LmNsYXNzTmFtZSA9XG4gICAgXCJtYXgtaC02MCBvdmVyZmxvdy1hdXRvIHJvdW5kZWQtbWQgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tZm9yZWdyb3VuZC81IHAtMyB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgYm9keS5hcHBlbmRDaGlsZChyZW5kZXJSZWxlYXNlTm90ZXNNYXJrZG93bihjaGVjay5yZWxlYXNlTm90ZXM/LnRyaW0oKSB8fCBjaGVjay5lcnJvciB8fCBcIk5vIHJlbGVhc2Ugbm90ZXMgYXZhaWxhYmxlLlwiKSk7XG4gIHJvdy5hcHBlbmRDaGlsZChib2R5KTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gcmVuZGVyUmVsZWFzZU5vdGVzTWFya2Rvd24obWFya2Rvd246IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvb3QuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sIGdhcC0yXCI7XG4gIGNvbnN0IGxpbmVzID0gbWFya2Rvd24ucmVwbGFjZSgvXFxyXFxuPy9nLCBcIlxcblwiKS5zcGxpdChcIlxcblwiKTtcbiAgbGV0IHBhcmFncmFwaDogc3RyaW5nW10gPSBbXTtcbiAgbGV0IGxpc3Q6IEhUTUxPTGlzdEVsZW1lbnQgfCBIVE1MVUxpc3RFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIGxldCBjb2RlTGluZXM6IHN0cmluZ1tdIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3QgZmx1c2hQYXJhZ3JhcGggPSAoKSA9PiB7XG4gICAgaWYgKHBhcmFncmFwaC5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBjb25zdCBwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgcC5jbGFzc05hbWUgPSBcIm0tMCBsZWFkaW5nLTVcIjtcbiAgICBhcHBlbmRJbmxpbmVNYXJrZG93bihwLCBwYXJhZ3JhcGguam9pbihcIiBcIikudHJpbSgpKTtcbiAgICByb290LmFwcGVuZENoaWxkKHApO1xuICAgIHBhcmFncmFwaCA9IFtdO1xuICB9O1xuICBjb25zdCBmbHVzaExpc3QgPSAoKSA9PiB7XG4gICAgaWYgKCFsaXN0KSByZXR1cm47XG4gICAgcm9vdC5hcHBlbmRDaGlsZChsaXN0KTtcbiAgICBsaXN0ID0gbnVsbDtcbiAgfTtcbiAgY29uc3QgZmx1c2hDb2RlID0gKCkgPT4ge1xuICAgIGlmICghY29kZUxpbmVzKSByZXR1cm47XG4gICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICBwcmUuY2xhc3NOYW1lID1cbiAgICAgIFwibS0wIG92ZXJmbG93LWF1dG8gcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIHAtMiB0ZXh0LXhzIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gICAgY29uc3QgY29kZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjb2RlXCIpO1xuICAgIGNvZGUudGV4dENvbnRlbnQgPSBjb2RlTGluZXMuam9pbihcIlxcblwiKTtcbiAgICBwcmUuYXBwZW5kQ2hpbGQoY29kZSk7XG4gICAgcm9vdC5hcHBlbmRDaGlsZChwcmUpO1xuICAgIGNvZGVMaW5lcyA9IG51bGw7XG4gIH07XG5cbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgaWYgKGxpbmUudHJpbSgpLnN0YXJ0c1dpdGgoXCJgYGBcIikpIHtcbiAgICAgIGlmIChjb2RlTGluZXMpIGZsdXNoQ29kZSgpO1xuICAgICAgZWxzZSB7XG4gICAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICAgIGZsdXNoTGlzdCgpO1xuICAgICAgICBjb2RlTGluZXMgPSBbXTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoY29kZUxpbmVzKSB7XG4gICAgICBjb2RlTGluZXMucHVzaChsaW5lKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIHtcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICBmbHVzaExpc3QoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRpbmcgPSAvXigjezEsM30pXFxzKyguKykkLy5leGVjKHRyaW1tZWQpO1xuICAgIGlmIChoZWFkaW5nKSB7XG4gICAgICBmbHVzaFBhcmFncmFwaCgpO1xuICAgICAgZmx1c2hMaXN0KCk7XG4gICAgICBjb25zdCBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChoZWFkaW5nWzFdLmxlbmd0aCA9PT0gMSA/IFwiaDNcIiA6IFwiaDRcIik7XG4gICAgICBoLmNsYXNzTmFtZSA9IFwibS0wIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgICAgIGFwcGVuZElubGluZU1hcmtkb3duKGgsIGhlYWRpbmdbMl0pO1xuICAgICAgcm9vdC5hcHBlbmRDaGlsZChoKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHVub3JkZXJlZCA9IC9eWy0qXVxccysoLispJC8uZXhlYyh0cmltbWVkKTtcbiAgICBjb25zdCBvcmRlcmVkID0gL15cXGQrWy4pXVxccysoLispJC8uZXhlYyh0cmltbWVkKTtcbiAgICBpZiAodW5vcmRlcmVkIHx8IG9yZGVyZWQpIHtcbiAgICAgIGZsdXNoUGFyYWdyYXBoKCk7XG4gICAgICBjb25zdCB3YW50T3JkZXJlZCA9IEJvb2xlYW4ob3JkZXJlZCk7XG4gICAgICBpZiAoIWxpc3QgfHwgKHdhbnRPcmRlcmVkICYmIGxpc3QudGFnTmFtZSAhPT0gXCJPTFwiKSB8fCAoIXdhbnRPcmRlcmVkICYmIGxpc3QudGFnTmFtZSAhPT0gXCJVTFwiKSkge1xuICAgICAgICBmbHVzaExpc3QoKTtcbiAgICAgICAgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQod2FudE9yZGVyZWQgPyBcIm9sXCIgOiBcInVsXCIpO1xuICAgICAgICBsaXN0LmNsYXNzTmFtZSA9IHdhbnRPcmRlcmVkXG4gICAgICAgICAgPyBcIm0tMCBsaXN0LWRlY2ltYWwgc3BhY2UteS0xIHBsLTUgbGVhZGluZy01XCJcbiAgICAgICAgICA6IFwibS0wIGxpc3QtZGlzYyBzcGFjZS15LTEgcGwtNSBsZWFkaW5nLTVcIjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgYXBwZW5kSW5saW5lTWFya2Rvd24obGksICh1bm9yZGVyZWQgPz8gb3JkZXJlZCk/LlsxXSA/PyBcIlwiKTtcbiAgICAgIGxpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgY29uc3QgcXVvdGUgPSAvXj5cXHM/KC4rKSQvLmV4ZWModHJpbW1lZCk7XG4gICAgaWYgKHF1b3RlKSB7XG4gICAgICBmbHVzaFBhcmFncmFwaCgpO1xuICAgICAgZmx1c2hMaXN0KCk7XG4gICAgICBjb25zdCBibG9ja3F1b3RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJsb2NrcXVvdGVcIik7XG4gICAgICBibG9ja3F1b3RlLmNsYXNzTmFtZSA9IFwibS0wIGJvcmRlci1sLTIgYm9yZGVyLXRva2VuLWJvcmRlciBwbC0zIGxlYWRpbmctNVwiO1xuICAgICAgYXBwZW5kSW5saW5lTWFya2Rvd24oYmxvY2txdW90ZSwgcXVvdGVbMV0pO1xuICAgICAgcm9vdC5hcHBlbmRDaGlsZChibG9ja3F1b3RlKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHBhcmFncmFwaC5wdXNoKHRyaW1tZWQpO1xuICB9XG5cbiAgZmx1c2hQYXJhZ3JhcGgoKTtcbiAgZmx1c2hMaXN0KCk7XG4gIGZsdXNoQ29kZSgpO1xuICByZXR1cm4gcm9vdDtcbn1cblxuZnVuY3Rpb24gYXBwZW5kSW5saW5lTWFya2Rvd24ocGFyZW50OiBIVE1MRWxlbWVudCwgdGV4dDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHBhdHRlcm4gPSAvKGAoW15gXSspYHxcXFsoW15cXF1dKylcXF1cXCgoaHR0cHM/OlxcL1xcL1teXFxzKV0rKVxcKXxcXCpcXCooW14qXSspXFwqXFwqfFxcKihbXipdKylcXCopL2c7XG4gIGxldCBsYXN0SW5kZXggPSAwO1xuICBmb3IgKGNvbnN0IG1hdGNoIG9mIHRleHQubWF0Y2hBbGwocGF0dGVybikpIHtcbiAgICBpZiAobWF0Y2guaW5kZXggPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgYXBwZW5kVGV4dChwYXJlbnQsIHRleHQuc2xpY2UobGFzdEluZGV4LCBtYXRjaC5pbmRleCkpO1xuICAgIGlmIChtYXRjaFsyXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBjb2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNvZGVcIik7XG4gICAgICBjb2RlLmNsYXNzTmFtZSA9XG4gICAgICAgIFwicm91bmRlZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIHB4LTEgcHktMC41IHRleHQteHMgdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgICAgIGNvZGUudGV4dENvbnRlbnQgPSBtYXRjaFsyXTtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChjb2RlKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzNdICE9PSB1bmRlZmluZWQgJiYgbWF0Y2hbNF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgYS5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1wcmltYXJ5IHVuZGVybGluZSB1bmRlcmxpbmUtb2Zmc2V0LTJcIjtcbiAgICAgIGEuaHJlZiA9IG1hdGNoWzRdO1xuICAgICAgYS50YXJnZXQgPSBcIl9ibGFua1wiO1xuICAgICAgYS5yZWwgPSBcIm5vb3BlbmVyIG5vcmVmZXJyZXJcIjtcbiAgICAgIGEudGV4dENvbnRlbnQgPSBtYXRjaFszXTtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChhKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzVdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHN0cm9uZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHJvbmdcIik7XG4gICAgICBzdHJvbmcuY2xhc3NOYW1lID0gXCJmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICAgICAgc3Ryb25nLnRleHRDb250ZW50ID0gbWF0Y2hbNV07XG4gICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoc3Ryb25nKTtcbiAgICB9IGVsc2UgaWYgKG1hdGNoWzZdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImVtXCIpO1xuICAgICAgZW0udGV4dENvbnRlbnQgPSBtYXRjaFs2XTtcbiAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbSk7XG4gICAgfVxuICAgIGxhc3RJbmRleCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICB9XG4gIGFwcGVuZFRleHQocGFyZW50LCB0ZXh0LnNsaWNlKGxhc3RJbmRleCkpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRUZXh0KHBhcmVudDogSFRNTEVsZW1lbnQsIHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICBpZiAodGV4dCkgcGFyZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyV2F0Y2hlckhlYWx0aENhcmQoY2FyZDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgdm9pZCBpcGNSZW5kZXJlclxuICAgIC5pbnZva2UoXCJjb2RleHBwOmdldC13YXRjaGVyLWhlYWx0aFwiKVxuICAgIC50aGVuKChoZWFsdGgpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgcmVuZGVyV2F0Y2hlckhlYWx0aChjYXJkLCBoZWFsdGggYXMgV2F0Y2hlckhlYWx0aCk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDb3VsZCBub3QgY2hlY2sgd2F0Y2hlclwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyV2F0Y2hlckhlYWx0aChjYXJkOiBIVE1MRWxlbWVudCwgaGVhbHRoOiBXYXRjaGVySGVhbHRoKTogdm9pZCB7XG4gIGNhcmQuYXBwZW5kQ2hpbGQod2F0Y2hlclN1bW1hcnlSb3coaGVhbHRoKSk7XG4gIGZvciAoY29uc3QgY2hlY2sgb2YgaGVhbHRoLmNoZWNrcykge1xuICAgIGlmIChjaGVjay5zdGF0dXMgPT09IFwib2tcIikgY29udGludWU7XG4gICAgY2FyZC5hcHBlbmRDaGlsZCh3YXRjaGVyQ2hlY2tSb3coY2hlY2spKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3YXRjaGVyU3VtbWFyeVJvdyhoZWFsdGg6IFdhdGNoZXJIZWFsdGgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBwLTNcIjtcbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgaXRlbXMtc3RhcnQgZ2FwLTNcIjtcbiAgbGVmdC5hcHBlbmRDaGlsZChzdGF0dXNCYWRnZShoZWFsdGguc3RhdHVzLCBoZWFsdGgud2F0Y2hlcikpO1xuICBjb25zdCBzdGFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHN0YWNrLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJtaW4tdy0wIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBoZWFsdGgudGl0bGU7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeSBtaW4tdy0wIHRleHQtc21cIjtcbiAgZGVzYy50ZXh0Q29udGVudCA9IGAke2hlYWx0aC5zdW1tYXJ5fSBDaGVja2VkICR7bmV3IERhdGUoaGVhbHRoLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX0uYDtcbiAgc3RhY2suYXBwZW5kQ2hpbGQodGl0bGUpO1xuICBzdGFjay5hcHBlbmRDaGlsZChkZXNjKTtcbiAgbGVmdC5hcHBlbmRDaGlsZChzdGFjayk7XG4gIHJvdy5hcHBlbmRDaGlsZChsZWZ0KTtcblxuICBjb25zdCBhY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhY3Rpb24uY2xhc3NOYW1lID0gXCJmbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBhY3Rpb24uYXBwZW5kQ2hpbGQoXG4gICAgY29tcGFjdEJ1dHRvbihcIkNoZWNrIE5vd1wiLCAoKSA9PiB7XG4gICAgICBjb25zdCBjYXJkID0gcm93LnBhcmVudEVsZW1lbnQ7XG4gICAgICBpZiAoIWNhcmQpIHJldHVybjtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDaGVja2luZyB3YXRjaGVyXCIsIFwiVmVyaWZ5aW5nIHRoZSB1cGRhdGVyIHJlcGFpciBzZXJ2aWNlLlwiKSk7XG4gICAgICByZW5kZXJXYXRjaGVySGVhbHRoQ2FyZChjYXJkKTtcbiAgICB9KSxcbiAgKTtcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbik7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHdhdGNoZXJDaGVja1JvdyhjaGVjazogV2F0Y2hlckhlYWx0aENoZWNrKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCByb3cgPSByb3dTaW1wbGUoY2hlY2submFtZSwgY2hlY2suZGV0YWlsKTtcbiAgY29uc3QgbGVmdCA9IHJvdy5maXJzdEVsZW1lbnRDaGlsZCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmIChsZWZ0KSBsZWZ0LnByZXBlbmQoc3RhdHVzQmFkZ2UoY2hlY2suc3RhdHVzKSk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIHN0YXR1c0JhZGdlKHN0YXR1czogXCJva1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIGxhYmVsPzogc3RyaW5nKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBjb25zdCB0b25lID1cbiAgICBzdGF0dXMgPT09IFwib2tcIlxuICAgICAgPyBcImJvcmRlci10b2tlbi1jaGFydHMtZ3JlZW4gdGV4dC10b2tlbi1jaGFydHMtZ3JlZW5cIlxuICAgICAgOiBzdGF0dXMgPT09IFwid2FyblwiXG4gICAgICAgID8gXCJib3JkZXItdG9rZW4tY2hhcnRzLXllbGxvdyB0ZXh0LXRva2VuLWNoYXJ0cy15ZWxsb3dcIlxuICAgICAgICA6IFwiYm9yZGVyLXRva2VuLWNoYXJ0cy1yZWQgdGV4dC10b2tlbi1jaGFydHMtcmVkXCI7XG4gIGJhZGdlLmNsYXNzTmFtZSA9IGBpbmxpbmUtZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgcm91bmRlZC1mdWxsIGJvcmRlciBweC0yIHB5LTAuNSB0ZXh0LXhzIGZvbnQtbWVkaXVtICR7dG9uZX1gO1xuICBiYWRnZS50ZXh0Q29udGVudCA9IGxhYmVsIHx8IChzdGF0dXMgPT09IFwib2tcIiA/IFwiT0tcIiA6IHN0YXR1cyA9PT0gXCJ3YXJuXCIgPyBcIlJldmlld1wiIDogXCJFcnJvclwiKTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVTdW1tYXJ5KGNoZWNrOiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sgfCBudWxsKTogc3RyaW5nIHtcbiAgaWYgKCFjaGVjaykgcmV0dXJuIFwiTm8gdXBkYXRlIGNoZWNrIGhhcyBydW4geWV0LlwiO1xuICBjb25zdCBsYXRlc3QgPSBjaGVjay5sYXRlc3RWZXJzaW9uID8gYExhdGVzdCB2JHtjaGVjay5sYXRlc3RWZXJzaW9ufS4gYCA6IFwiXCI7XG4gIGNvbnN0IGNoZWNrZWQgPSBgQ2hlY2tlZCAke25ldyBEYXRlKGNoZWNrLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKX0uYDtcbiAgaWYgKGNoZWNrLmVycm9yKSByZXR1cm4gYCR7bGF0ZXN0fSR7Y2hlY2tlZH0gJHtjaGVjay5lcnJvcn1gO1xuICByZXR1cm4gYCR7bGF0ZXN0fSR7Y2hlY2tlZH1gO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDaGFubmVsU3VtbWFyeShjb25maWc6IENvZGV4UGx1c1BsdXNDb25maWcpOiBzdHJpbmcge1xuICBpZiAoY29uZmlnLnVwZGF0ZUNoYW5uZWwgPT09IFwiY3VzdG9tXCIpIHtcbiAgICByZXR1cm4gYCR7Y29uZmlnLnVwZGF0ZVJlcG8gfHwgXCJrcGtoeGxneTAvY29kZXgtcGx1c3BsdXNcIn0gJHtjb25maWcudXBkYXRlUmVmIHx8IFwiKG5vIHJlZiBzZXQpXCJ9YDtcbiAgfVxuICBpZiAoY29uZmlnLnVwZGF0ZUNoYW5uZWwgPT09IFwicHJlcmVsZWFzZVwiKSB7XG4gICAgcmV0dXJuIFwiVXNlIHRoZSBuZXdlc3QgcHVibGlzaGVkIEdpdEh1YiByZWxlYXNlLCBpbmNsdWRpbmcgcHJlcmVsZWFzZXMuXCI7XG4gIH1cbiAgcmV0dXJuIFwiVXNlIHRoZSBsYXRlc3Qgc3RhYmxlIEdpdEh1YiByZWxlYXNlLlwiO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlU3VtbWFyeShzdGF0ZTogU2VsZlVwZGF0ZVN0YXRlIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghc3RhdGUpIHJldHVybiBcIk5vIGF1dG9tYXRpYyBDb2RleCsrIHVwZGF0ZSBoYXMgcnVuIHlldC5cIjtcbiAgY29uc3QgY2hlY2tlZCA9IG5ldyBEYXRlKHN0YXRlLmNvbXBsZXRlZEF0ID8/IHN0YXRlLmNoZWNrZWRBdCkudG9Mb2NhbGVTdHJpbmcoKTtcbiAgY29uc3QgdGFyZ2V0ID0gc3RhdGUubGF0ZXN0VmVyc2lvbiA/IGAgVGFyZ2V0IHYke3N0YXRlLmxhdGVzdFZlcnNpb259LmAgOiBzdGF0ZS50YXJnZXRSZWYgPyBgIFRhcmdldCAke3N0YXRlLnRhcmdldFJlZn0uYCA6IFwiXCI7XG4gIGNvbnN0IHNvdXJjZSA9IHN0YXRlLmluc3RhbGxhdGlvblNvdXJjZT8ubGFiZWwgPz8gXCJ1bmtub3duIHNvdXJjZVwiO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImZhaWxlZFwiKSByZXR1cm4gYEZhaWxlZCAke2NoZWNrZWR9LiR7dGFyZ2V0fSAke3N0YXRlLmVycm9yID8/IFwiVW5rbm93biBlcnJvclwifWA7XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwidXBkYXRlZFwiKSByZXR1cm4gYFVwZGF0ZWQgJHtjaGVja2VkfS4ke3RhcmdldH0gU291cmNlOiAke3NvdXJjZX0uYDtcbiAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gXCJ1cC10by1kYXRlXCIpIHJldHVybiBgVXAgdG8gZGF0ZSAke2NoZWNrZWR9LiR7dGFyZ2V0fSBTb3VyY2U6ICR7c291cmNlfS5gO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImRpc2FibGVkXCIpIHJldHVybiBgU2tpcHBlZCAke2NoZWNrZWR9OyBhdXRvbWF0aWMgcmVmcmVzaCBpcyBkaXNhYmxlZC5gO1xuICByZXR1cm4gYENoZWNraW5nIGZvciB1cGRhdGVzLiBTb3VyY2U6ICR7c291cmNlfS5gO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlU3RhdHVzVG9uZShzdGF0dXM6IFNlbGZVcGRhdGVTdGF0dXMpOiBcIm9rXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiB7XG4gIGlmIChzdGF0dXMgPT09IFwiZmFpbGVkXCIpIHJldHVybiBcImVycm9yXCI7XG4gIGlmIChzdGF0dXMgPT09IFwiZGlzYWJsZWRcIiB8fCBzdGF0dXMgPT09IFwiY2hlY2tpbmdcIikgcmV0dXJuIFwid2FyblwiO1xuICByZXR1cm4gXCJva1wiO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlU3RhdHVzTGFiZWwoc3RhdHVzOiBTZWxmVXBkYXRlU3RhdHVzKTogc3RyaW5nIHtcbiAgaWYgKHN0YXR1cyA9PT0gXCJ1cC10by1kYXRlXCIpIHJldHVybiBcIlVwIHRvIGRhdGVcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJ1cGRhdGVkXCIpIHJldHVybiBcIlVwZGF0ZWRcIjtcbiAgaWYgKHN0YXR1cyA9PT0gXCJmYWlsZWRcIikgcmV0dXJuIFwiRmFpbGVkXCI7XG4gIGlmIChzdGF0dXMgPT09IFwiZGlzYWJsZWRcIikgcmV0dXJuIFwiRGlzYWJsZWRcIjtcbiAgcmV0dXJuIFwiQ2hlY2tpbmdcIjtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaENvbmZpZ0NhcmQocm93OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBjYXJkID0gcm93LmNsb3Nlc3QoXCJbZGF0YS1jb2RleHBwLWNvbmZpZy1jYXJkXVwiKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gIGlmICghY2FyZCkgcmV0dXJuO1xuICBjYXJkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJSZWZyZXNoaW5nXCIsIFwiTG9hZGluZyBjdXJyZW50IENvZGV4KysgdXBkYXRlIHN0YXR1cy5cIikpO1xuICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgLmludm9rZShcImNvZGV4cHA6Z2V0LWNvbmZpZ1wiKVxuICAgIC50aGVuKChjb25maWcpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgcmVuZGVyQ29kZXhQbHVzUGx1c0NvbmZpZyhjYXJkLCBjb25maWcgYXMgQ29kZXhQbHVzUGx1c0NvbmZpZyk7XG4gICAgfSlcbiAgICAuY2F0Y2goKGUpID0+IHtcbiAgICAgIGNhcmQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgY2FyZC5hcHBlbmRDaGlsZChyb3dTaW1wbGUoXCJDb3VsZCBub3QgcmVmcmVzaCB1cGRhdGUgc2V0dGluZ3NcIiwgU3RyaW5nKGUpKSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHVuaW5zdGFsbFJvdygpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHJvdyA9IGFjdGlvblJvdyhcbiAgICBcIlVuaW5zdGFsbCBDb2RleCsrXCIsXG4gICAgXCJDb3BpZXMgdGhlIHVuaW5zdGFsbCBjb21tYW5kLiBSdW4gaXQgZnJvbSBhIHRlcm1pbmFsIGFmdGVyIHF1aXR0aW5nIENvZGV4LlwiLFxuICApO1xuICBjb25zdCBhY3Rpb24gPSByb3cucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXJvdy1hY3Rpb25zXVwiKTtcbiAgYWN0aW9uPy5hcHBlbmRDaGlsZChcbiAgICBjb21wYWN0QnV0dG9uKFwiQ29weSBDb21tYW5kXCIsICgpID0+IHtcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAgICAgLmludm9rZShcImNvZGV4cHA6Y29weS10ZXh0XCIsIFwibm9kZSB+Ly5jb2RleC1wbHVzcGx1cy9zb3VyY2UvcGFja2FnZXMvaW5zdGFsbGVyL2Rpc3QvY2xpLmpzIHVuaW5zdGFsbFwiKVxuICAgICAgICAuY2F0Y2goKGUpID0+IHBsb2coXCJjb3B5IHVuaW5zdGFsbCBjb21tYW5kIGZhaWxlZFwiLCBTdHJpbmcoZSkpKTtcbiAgICB9KSxcbiAgKTtcbiAgcmV0dXJuIHJvdztcbn1cblxuZnVuY3Rpb24gcmVwb3J0QnVnUm93KCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gYWN0aW9uUm93KFxuICAgIFwiUmVwb3J0IGEgYnVnXCIsXG4gICAgXCJPcGVuIGEgR2l0SHViIGlzc3VlIHdpdGggcnVudGltZSwgaW5zdGFsbGVyLCBvciB0d2Vhay1tYW5hZ2VyIGRldGFpbHMuXCIsXG4gICk7XG4gIGNvbnN0IGFjdGlvbiA9IHJvdy5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtcm93LWFjdGlvbnNdXCIpO1xuICBhY3Rpb24/LmFwcGVuZENoaWxkKFxuICAgIGNvbXBhY3RCdXR0b24oXCJPcGVuIElzc3VlXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHRpdGxlID0gZW5jb2RlVVJJQ29tcG9uZW50KFwiW0J1Z106IFwiKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBlbmNvZGVVUklDb21wb25lbnQoXG4gICAgICAgIFtcbiAgICAgICAgICBcIiMjIFdoYXQgaGFwcGVuZWQ/XCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIFN0ZXBzIHRvIHJlcHJvZHVjZVwiLFxuICAgICAgICAgIFwiMS4gXCIsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBcIiMjIEVudmlyb25tZW50XCIsXG4gICAgICAgICAgXCItIENvZGV4KysgdmVyc2lvbjogXCIsXG4gICAgICAgICAgXCItIENvZGV4IGFwcCB2ZXJzaW9uOiBcIixcbiAgICAgICAgICBcIi0gT1M6IFwiLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgXCIjIyBMb2dzXCIsXG4gICAgICAgICAgXCJBdHRhY2ggcmVsZXZhbnQgbGluZXMgZnJvbSB0aGUgQ29kZXgrKyBsb2cgZGlyZWN0b3J5LlwiLFxuICAgICAgICBdLmpvaW4oXCJcXG5cIiksXG4gICAgICApO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsXG4gICAgICAgIGBodHRwczovL2dpdGh1Yi5jb20va3BraHhsZ3kwL2NvZGV4LXBsdXNwbHVzL2lzc3Vlcy9uZXc/dGl0bGU9JHt0aXRsZX0mYm9keT0ke2JvZHl9YCxcbiAgICAgICk7XG4gICAgfSksXG4gICk7XG4gIHJldHVybiByb3c7XG59XG5cbmZ1bmN0aW9uIGFjdGlvblJvdyh0aXRsZVRleHQ6IHN0cmluZywgZGVzY3JpcHRpb246IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHRpdGxlLnRleHRDb250ZW50ID0gdGl0bGVUZXh0O1xuICBjb25zdCBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGVzYy5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgbWluLXctMCB0ZXh0LXNtXCI7XG4gIGRlc2MudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcbiAgbGVmdC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIGxlZnQuYXBwZW5kQ2hpbGQoZGVzYyk7XG4gIHJvdy5hcHBlbmRDaGlsZChsZWZ0KTtcbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGFjdGlvbnMuZGF0YXNldC5jb2RleHBwUm93QWN0aW9ucyA9IFwidHJ1ZVwiO1xuICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgcm93LmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuICByZXR1cm4gcm93O1xufVxuXG5mdW5jdGlvbiByZW5kZXJUd2Vha1N0b3JlUGFnZShcbiAgc2VjdGlvbnNXcmFwOiBIVE1MRWxlbWVudCxcbiAgaGVhZGVyQWN0aW9ucz86IEhUTUxFbGVtZW50LFxuKTogdm9pZCB7XG4gIGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTRcIjtcblxuICBjb25zdCBzb3VyY2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgc291cmNlLmhpZGRlbiA9IHRydWU7XG4gIHNvdXJjZS5kYXRhc2V0LmNvZGV4cHBTdG9yZVNvdXJjZSA9IFwidHJ1ZVwiO1xuICBzb3VyY2UudGV4dENvbnRlbnQgPSBcIkxvYWRpbmcgbGl2ZSByZWdpc3RyeVwiO1xuXG4gIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgY29uc3QgcmVmcmVzaEJ0biA9IHN0b3JlSWNvbkJ1dHRvbihyZWZyZXNoSWNvblN2ZygpLCBcIlJlZnJlc2ggdHdlYWsgc3RvcmVcIiwgKCkgPT4ge1xuICAgIHJlZnJlc2hCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHVwZGF0ZVN0b3JlVXBkYXRlQmFkZ2UobnVsbCk7XG4gICAgZ3JpZC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkKTtcbiAgICByZWZyZXNoVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlLCByZWZyZXNoQnRuLCB0cnVlKTtcbiAgfSk7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQocmVmcmVzaEJ0bik7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3RvcmVUb29sYmFyQnV0dG9uKFwiUHVibGlzaCBUd2Vha1wiLCBvcGVuUHVibGlzaFR3ZWFrRGlhbG9nLCBcInByaW1hcnlcIikpO1xuICBpZiAoaGVhZGVyQWN0aW9ucykge1xuICAgIGhlYWRlckFjdGlvbnMucmVwbGFjZUNoaWxkcmVuKGFjdGlvbnMpO1xuICB9XG5cbiAgY29uc3QgZ3JpZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGdyaWQuZGF0YXNldC5jb2RleHBwU3RvcmVHcmlkID0gXCJ0cnVlXCI7XG4gIGdyaWQuY2xhc3NOYW1lID0gXCJncmlkIGdhcC00XCI7XG4gIGlmIChzdGF0ZS50d2Vha1N0b3JlKSB7XG4gICAgZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZSA9IEpTT04uc3RyaW5naWZ5KHN0YXRlLnR3ZWFrU3RvcmUpO1xuICAgIHJlbmRlclR3ZWFrU3RvcmVHcmlkKGdyaWQsIHNvdXJjZSk7XG4gIH0gZWxzZSB7XG4gICAgcmVuZGVyVHdlYWtTdG9yZUdob3N0R3JpZChncmlkKTtcbiAgfVxuICBzZWN0aW9uLmFwcGVuZENoaWxkKHNvdXJjZSk7XG4gIHNlY3Rpb24uYXBwZW5kQ2hpbGQoZ3JpZCk7XG4gIHNlY3Rpb25zV3JhcC5hcHBlbmRDaGlsZChzZWN0aW9uKTtcbiAgcmVmcmVzaFR3ZWFrU3RvcmVHcmlkKGdyaWQsIHNvdXJjZSwgcmVmcmVzaEJ0bik7XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hUd2Vha1N0b3JlR3JpZChcbiAgZ3JpZDogSFRNTEVsZW1lbnQsXG4gIHNvdXJjZTogSFRNTEVsZW1lbnQsXG4gIHJlZnJlc2hCdG4/OiBIVE1MQnV0dG9uRWxlbWVudCxcbiAgZm9yY2UgPSBmYWxzZSxcbik6IHZvaWQge1xuICB2b2lkIGdldFR3ZWFrU3RvcmUoZm9yY2UpXG4gICAgLnRoZW4oKHN0b3JlKSA9PiB7XG4gICAgICBncmlkLmRhdGFzZXQuY29kZXhwcFN0b3JlID0gSlNPTi5zdHJpbmdpZnkoc3RvcmUpO1xuICAgICAgcmVuZGVyVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlKTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZSA9IFwiXCI7XG4gICAgICBncmlkLnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtYnVzeVwiKTtcbiAgICAgIHNvdXJjZS50ZXh0Q29udGVudCA9IFwiTGl2ZSByZWdpc3RyeSB1bmF2YWlsYWJsZVwiO1xuICAgICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShudWxsKTtcbiAgICAgIGdyaWQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgZ3JpZC5hcHBlbmRDaGlsZChzdG9yZU1lc3NhZ2VDYXJkKFwiQ291bGQgbm90IGxvYWQgdHdlYWsgc3RvcmVcIiwgU3RyaW5nKGUpKSk7XG4gICAgfSlcbiAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICBpZiAocmVmcmVzaEJ0bikgcmVmcmVzaEJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB3YXJtVHdlYWtTdG9yZSgpOiB2b2lkIHtcbiAgaWYgKHN0YXRlLnR3ZWFrU3RvcmUgfHwgc3RhdGUudHdlYWtTdG9yZVByb21pc2UpIHJldHVybjtcbiAgdm9pZCBnZXRUd2Vha1N0b3JlKCkudGhlbigoc3RvcmUpID0+IHtcbiAgICB1cGRhdGVTdG9yZVVwZGF0ZUJhZGdlKG91dGRhdGVkSW5zdGFsbGVkU3RvcmVDb3VudChzdG9yZS5lbnRyaWVzKSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRUd2Vha1N0b3JlKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc+IHtcbiAgaWYgKCFmb3JjZSkge1xuICAgIGlmIChzdGF0ZS50d2Vha1N0b3JlKSByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHN0YXRlLnR3ZWFrU3RvcmUpO1xuICAgIGlmIChzdGF0ZS50d2Vha1N0b3JlUHJvbWlzZSkgcmV0dXJuIHN0YXRlLnR3ZWFrU3RvcmVQcm9taXNlO1xuICB9XG4gIHN0YXRlLnR3ZWFrU3RvcmVFcnJvciA9IG51bGw7XG4gIGNvbnN0IHByb21pc2UgPSBpcGNSZW5kZXJlclxuICAgIC5pbnZva2UoXCJjb2RleHBwOmdldC10d2Vhay1zdG9yZVwiKVxuICAgIC50aGVuKChzdG9yZSkgPT4ge1xuICAgICAgc3RhdGUudHdlYWtTdG9yZSA9IHN0b3JlIGFzIFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXc7XG4gICAgICByZXR1cm4gc3RhdGUudHdlYWtTdG9yZTtcbiAgICB9KVxuICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgc3RhdGUudHdlYWtTdG9yZUVycm9yID0gZTtcbiAgICAgIHRocm93IGU7XG4gICAgfSlcbiAgICAuZmluYWxseSgoKSA9PiB7XG4gICAgICBpZiAoc3RhdGUudHdlYWtTdG9yZVByb21pc2UgPT09IHByb21pc2UpIHN0YXRlLnR3ZWFrU3RvcmVQcm9taXNlID0gbnVsbDtcbiAgICB9KTtcbiAgc3RhdGUudHdlYWtTdG9yZVByb21pc2UgPSBwcm9taXNlO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyVHdlYWtTdG9yZUdyaWQoZ3JpZDogSFRNTEVsZW1lbnQsIHNvdXJjZTogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3Qgc3RvcmUgPSBwYXJzZVN0b3JlRGF0YXNldChncmlkKTtcbiAgaWYgKCFzdG9yZSkgcmV0dXJuO1xuICBjb25zdCBlbnRyaWVzID0gc3RvcmUuZW50cmllcztcbiAgZ3JpZC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XG4gIHNvdXJjZS50ZXh0Q29udGVudCA9IGBSZWZyZXNoZWQgJHtuZXcgRGF0ZShzdG9yZS5mZXRjaGVkQXQpLnRvTG9jYWxlU3RyaW5nKCl9YDtcbiAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShvdXRkYXRlZEluc3RhbGxlZFN0b3JlQ291bnQoZW50cmllcykpO1xuICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgaWYgKHN0b3JlLmVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgZ3JpZC5hcHBlbmRDaGlsZChzdG9yZU1lc3NhZ2VDYXJkKFwiTm8gdHdlYWtzIHlldFwiLCBcIlVzZSBQdWJsaXNoIFR3ZWFrIHRvIHN1Ym1pdCB0aGUgZmlyc3Qgb25lLlwiKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykgZ3JpZC5hcHBlbmRDaGlsZCh0d2Vha1N0b3JlQ2FyZChlbnRyeSkpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVN0b3JlRGF0YXNldChncmlkOiBIVE1MRWxlbWVudCk6IFR3ZWFrU3RvcmVSZWdpc3RyeVZpZXcgfCBudWxsIHtcbiAgY29uc3QgcmF3ID0gZ3JpZC5kYXRhc2V0LmNvZGV4cHBTdG9yZTtcbiAgaWYgKCFyYXcpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJhdykgYXMgVHdlYWtTdG9yZVJlZ2lzdHJ5VmlldztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHdlYWtTdG9yZUNhcmQoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeVZpZXcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHNoZWxsID0gdHdlYWtTdG9yZUNhcmRTaGVsbCgpO1xuICBjb25zdCB7IGNhcmQsIGxlZnQsIHN0YWNrLCB2ZXJzaW9ucywgYWN0aW9ucyB9ID0gc2hlbGw7XG5cbiAgbGVmdC5pbnNlcnRCZWZvcmUoc3RvcmVBdmF0YXIoZW50cnkpLCBzdGFjayk7XG5cbiAgY29uc3QgdGl0bGVSb3cgPSB0d2Vha1N0b3JlVGl0bGVSb3coKTtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1sZyBmb250LXNlbWlib2xkIGxlYWRpbmctNyB0ZXh0LXRva2VuLWZvcmVncm91bmRcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBlbnRyeS5tYW5pZmVzdC5uYW1lO1xuICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHZlcmlmaWVkU2FmZUJhZGdlKCkpO1xuICBzdGFjay5hcHBlbmRDaGlsZCh0aXRsZVJvdyk7XG5cbiAgaWYgKGVudHJ5Lm1hbmlmZXN0LmRlc2NyaXB0aW9uKSB7XG4gICAgY29uc3QgZGVzYyA9IHR3ZWFrU3RvcmVEZXNjcmlwdGlvbigpO1xuICAgIGRlc2MudGV4dENvbnRlbnQgPSBlbnRyeS5tYW5pZmVzdC5kZXNjcmlwdGlvbjtcbiAgICBzdGFjay5hcHBlbmRDaGlsZChkZXNjKTtcbiAgfVxuXG4gIHN0YWNrLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVSZWFkTW9yZUJ1dHRvbihlbnRyeS5yZXBvKSk7XG4gIHZlcnNpb25zLmFwcGVuZENoaWxkKHR3ZWFrU3RvcmVWZXJzaW9uQmFkZ2UoZW50cnkpKTtcblxuICBpZiAoZW50cnkucmVsZWFzZVVybCkge1xuICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICBjb21wYWN0QnV0dG9uKFwiUmVsZWFzZVwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIGVudHJ5LnJlbGVhc2VVcmwpO1xuICAgICAgfSksXG4gICAgKTtcbiAgfVxuICBjb25zdCBoYXNVcGRhdGUgPSAhIWVudHJ5Lmluc3RhbGxlZCAmJiBlbnRyeS5pbnN0YWxsZWQudmVyc2lvbiAhPT0gZW50cnkubWFuaWZlc3QudmVyc2lvbjtcbiAgaWYgKGVudHJ5Lmluc3RhbGxlZCAmJiAhaGFzVXBkYXRlKSB7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c1BpbGwoXCJJbnN0YWxsZWRcIikpO1xuICB9IGVsc2UgaWYgKGVudHJ5LnBsYXRmb3JtICYmICFlbnRyeS5wbGF0Zm9ybS5jb21wYXRpYmxlKSB7XG4gICAgY2FyZC5jbGFzc0xpc3QuYWRkKFwib3BhY2l0eS03MFwiKTtcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKHN0b3JlU3RhdHVzUGlsbChwbGF0Zm9ybUxvY2tlZExhYmVsKGVudHJ5LnBsYXRmb3JtKSkpO1xuICB9IGVsc2UgaWYgKGVudHJ5LnJ1bnRpbWUgJiYgIWVudHJ5LnJ1bnRpbWUuY29tcGF0aWJsZSkge1xuICAgIGNhcmQuY2xhc3NMaXN0LmFkZChcIm9wYWNpdHktNzBcIik7XG4gICAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c1BpbGwocnVudGltZUxvY2tlZExhYmVsKGVudHJ5LnJ1bnRpbWUpKSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgaW5zdGFsbExhYmVsID0gZW50cnkuaW5zdGFsbGVkID8gXCJVcGRhdGVcIiA6IFwiSW5zdGFsbFwiO1xuICAgIGlmIChoYXNVcGRhdGUpIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3RvcmVTdGF0dXNQaWxsKFwiVXBkYXRlIGF2YWlsYWJsZVwiLCBcImluZm9cIikpO1xuICAgIGNvbnN0IGluc3RhbGxCdXR0b24gPSBzdG9yZUluc3RhbGxCdXR0b24oaW5zdGFsbExhYmVsLCAoYnV0dG9uKSA9PiB7XG4gICAgICBjb25zdCBncmlkID0gY2FyZC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zdG9yZS1ncmlkXVwiKSBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgICBjb25zdCBzb3VyY2UgPSBncmlkPy5wYXJlbnRFbGVtZW50Py5xdWVyeVNlbGVjdG9yKFwiW2RhdGEtY29kZXhwcC1zdG9yZS1zb3VyY2VdXCIpIGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICAgIHNob3dTdG9yZUJ1dHRvbkxvYWRpbmcoYnV0dG9uLCBlbnRyeS5pbnN0YWxsZWQgPyBcIlVwZGF0aW5nXCIgOiBcIkluc3RhbGxpbmdcIik7XG4gICAgICBhY3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIikuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gdHJ1ZSkpO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlclxuICAgICAgICAuaW52b2tlKFwiY29kZXhwcDppbnN0YWxsLXN0b3JlLXR3ZWFrXCIsIGVudHJ5LmlkKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgc2hvd1N0b3JlVG9hc3QoYCR7ZW50cnkubWFuaWZlc3QubmFtZX0gaW5zdGFsbGVkLmApO1xuICAgICAgICAgIHNob3dTdG9yZUJ1dHRvbkluc3RhbGxlZChidXR0b24pO1xuICAgICAgICAgIHZlcnNpb25zLnJlcGxhY2VDaGlsZHJlbih0d2Vha1N0b3JlVmVyc2lvbkJhZGdlKGVudHJ5LCBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uKSk7XG4gICAgICAgICAgdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShNYXRoLm1heCgwLCBjdXJyZW50U3RvcmVVcGRhdGVCYWRnZUNvdW50KCkgLSAxKSk7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBhY3Rpb25zLnJlcGxhY2VDaGlsZHJlbihzdG9yZVN0YXR1c1BpbGwoXCJJbnN0YWxsZWRcIikpO1xuICAgICAgICAgICAgaWYgKGdyaWQgJiYgc291cmNlKSByZWZyZXNoVHdlYWtTdG9yZUdyaWQoZ3JpZCwgc291cmNlLCB1bmRlZmluZWQsIHRydWUpO1xuICAgICAgICAgIH0sIDkwMCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZSkgPT4ge1xuICAgICAgICAgIHJlc2V0U3RvcmVJbnN0YWxsQnV0dG9uKGJ1dHRvbiwgaW5zdGFsbExhYmVsKTtcbiAgICAgICAgICBhY3Rpb25zLnF1ZXJ5U2VsZWN0b3JBbGwoXCJidXR0b25cIikuZm9yRWFjaCgoYnV0dG9uKSA9PiAoYnV0dG9uLmRpc2FibGVkID0gZmFsc2UpKTtcbiAgICAgICAgICBzaG93U3RvcmVDYXJkTWVzc2FnZShjYXJkLCBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UgPz8gZSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICBhY3Rpb25zLmFwcGVuZENoaWxkKGluc3RhbGxCdXR0b24pO1xuICB9XG4gIHJldHVybiBjYXJkO1xufVxuXG5mdW5jdGlvbiBwbGF0Zm9ybUxvY2tlZExhYmVsKHBsYXRmb3JtOiBOb25OdWxsYWJsZTxUd2Vha1N0b3JlRW50cnlWaWV3W1wicGxhdGZvcm1cIl0+KTogc3RyaW5nIHtcbiAgY29uc3Qgc3VwcG9ydGVkID0gcGxhdGZvcm0uc3VwcG9ydGVkID8/IFtdO1xuICBpZiAoc3VwcG9ydGVkLmluY2x1ZGVzKFwid2luMzJcIikpIHJldHVybiBcIldpbmRvd3Mgb25seVwiO1xuICBpZiAoc3VwcG9ydGVkLmluY2x1ZGVzKFwiZGFyd2luXCIpKSByZXR1cm4gXCJtYWNPUyBvbmx5XCI7XG4gIGlmIChzdXBwb3J0ZWQuaW5jbHVkZXMoXCJsaW51eFwiKSkgcmV0dXJuIFwiTGludXggb25seVwiO1xuICByZXR1cm4gXCJVbmF2YWlsYWJsZVwiO1xufVxuXG5mdW5jdGlvbiBydW50aW1lTG9ja2VkTGFiZWwocnVudGltZTogTm9uTnVsbGFibGU8VHdlYWtTdG9yZUVudHJ5Vmlld1tcInJ1bnRpbWVcIl0+KTogc3RyaW5nIHtcbiAgcmV0dXJuIHJ1bnRpbWUucmVxdWlyZWQgPyBgUmVxdWlyZXMgQ29kZXgrKyAke3J1bnRpbWUucmVxdWlyZWR9YCA6IFwiUmVxdWlyZXMgbmV3ZXIgQ29kZXgrK1wiO1xufVxuXG5mdW5jdGlvbiBzaG93U3RvcmVDYXJkTWVzc2FnZShjYXJkOiBIVE1MRWxlbWVudCwgbWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGNhcmQucXVlcnlTZWxlY3RvcihcIltkYXRhLWNvZGV4cHAtc3RvcmUtY2FyZC1tZXNzYWdlXVwiKT8ucmVtb3ZlKCk7XG4gIGNvbnN0IG5vdGljZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG5vdGljZS5kYXRhc2V0LmNvZGV4cHBTdG9yZUNhcmRNZXNzYWdlID0gXCJ0cnVlXCI7XG4gIG5vdGljZS5jbGFzc05hbWUgPVxuICAgIFwicm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlci81MCBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcHgtMyBweS0yIHRleHQtc20gbGVhZGluZy01IHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZFwiO1xuICBub3RpY2UudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xuICBjb25zdCBhY3Rpb25zID0gY2FyZC5sYXN0RWxlbWVudENoaWxkO1xuICBpZiAoYWN0aW9ucykgY2FyZC5pbnNlcnRCZWZvcmUobm90aWNlLCBhY3Rpb25zKTtcbiAgZWxzZSBjYXJkLmFwcGVuZENoaWxkKG5vdGljZSk7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3RvcmVDYXJkU2hlbGwoKToge1xuICBjYXJkOiBIVE1MRWxlbWVudDtcbiAgbGVmdDogSFRNTEVsZW1lbnQ7XG4gIHN0YWNrOiBIVE1MRWxlbWVudDtcbiAgdmVyc2lvbnM6IEhUTUxFbGVtZW50O1xuICBhY3Rpb25zOiBIVE1MRWxlbWVudDtcbn0ge1xuICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY2FyZC5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlci80MCBmbGV4IG1pbi1oLVsxOTBweF0gZmxleC1jb2wganVzdGlmeS1iZXR3ZWVuIGdhcC00IHJvdW5kZWQtMnhsIGJvcmRlciBwLTQgdHJhbnNpdGlvbi1jb2xvcnMgaG92ZXI6YmctdG9rZW4tZm9yZWdyb3VuZC81XCI7XG5cbiAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGxlZnQuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGl0ZW1zLXN0YXJ0IGdhcC0zXCI7XG4gIGNvbnN0IHN0YWNrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc3RhY2suY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGZsZXgtY29sIGdhcC0yXCI7XG4gIGxlZnQuYXBwZW5kQ2hpbGQoc3RhY2spO1xuICBjYXJkLmFwcGVuZENoaWxkKGxlZnQpO1xuXG4gIGNvbnN0IGZvb3RlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGZvb3Rlci5jbGFzc05hbWUgPSBcIm10LWF1dG8gZmxleCBtaW4tdy0wIGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yXCI7XG4gIGNvbnN0IHZlcnNpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdmVyc2lvbnMuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGl0ZW1zLWNlbnRlciBnYXAtMlwiO1xuICBmb290ZXIuYXBwZW5kQ2hpbGQodmVyc2lvbnMpO1xuICBjb25zdCBhY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYWN0aW9ucy5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktZW5kIGdhcC0yXCI7XG4gIGZvb3Rlci5hcHBlbmRDaGlsZChhY3Rpb25zKTtcbiAgY2FyZC5hcHBlbmRDaGlsZChmb290ZXIpO1xuXG4gIHJldHVybiB7IGNhcmQsIGxlZnQsIHN0YWNrLCB2ZXJzaW9ucywgYWN0aW9ucyB9O1xufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlVGl0bGVSb3coKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCB0aXRsZVJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlUm93LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGl0ZW1zLXN0YXJ0IGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiO1xuICByZXR1cm4gdGl0bGVSb3c7XG59XG5cbmZ1bmN0aW9uIHR3ZWFrU3RvcmVEZXNjcmlwdGlvbigpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjLmNsYXNzTmFtZSA9IFwibGluZS1jbGFtcC0zIG1pbi13LTAgdGV4dC1zbSBsZWFkaW5nLTUgdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICByZXR1cm4gZGVzYztcbn1cblxuZnVuY3Rpb24gdHdlYWtTdG9yZVJlYWRNb3JlQnV0dG9uKHJlcG86IHN0cmluZyk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgcmVhZE1vcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICByZWFkTW9yZS50eXBlID0gXCJidXR0b25cIjtcbiAgcmVhZE1vcmUuY2xhc3NOYW1lID1cbiAgICBcImlubGluZS1mbGV4IHctZml0IGl0ZW1zLWNlbnRlciBnYXAtMSB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1saW5rLWZvcmVncm91bmQgaG92ZXI6dW5kZXJsaW5lXCI7XG4gIHJlYWRNb3JlLnRleHRDb250ZW50ID0gXCJSZWFkIE1vcmVcIjtcbiAgYXBwZW5kU3ZnSHRtbChcbiAgICByZWFkTW9yZSxcbiAgICBgPHN2ZyB3aWR0aD1cIjE0XCIgaGVpZ2h0PVwiMTRcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cIm5vbmVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk02IDMuNWg2LjVWMTBNMTIuMjUgMy43NSA0IDEyXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS40NVwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YCxcbiAgKTtcbiAgcmVhZE1vcmUuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgYGh0dHBzOi8vZ2l0aHViLmNvbS8ke3JlcG99YCk7XG4gIH0pO1xuICByZXR1cm4gcmVhZE1vcmU7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclR3ZWFrU3RvcmVHaG9zdEdyaWQoZ3JpZDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgZ3JpZC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIiwgXCJ0cnVlXCIpO1xuICBncmlkLnRleHRDb250ZW50ID0gXCJcIjtcbiAgZ3JpZC5hcHBlbmRDaGlsZCh0d2Vha1N0b3JlR2hvc3RDYXJkKCkpO1xufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlR2hvc3RDYXJkKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgeyBjYXJkLCBsZWZ0LCBzdGFjaywgdmVyc2lvbnMsIGFjdGlvbnMgfSA9IHR3ZWFrU3RvcmVDYXJkU2hlbGwoKTtcbiAgY2FyZC5jbGFzc0xpc3QuYWRkKFwicG9pbnRlci1ldmVudHMtbm9uZVwiKTtcbiAgY2FyZC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG5cbiAgbGVmdC5pbnNlcnRCZWZvcmUoc3RvcmVBdmF0YXJHaG9zdCgpLCBzdGFjayk7XG5cbiAgY29uc3QgdGl0bGVSb3cgPSB0d2Vha1N0b3JlVGl0bGVSb3coKTtcbiAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZS5jbGFzc05hbWUgPSBcIm1pbi13LTAgdGV4dC1sZyBmb250LXNlbWlib2xkIGxlYWRpbmctNyB0ZXh0LXRva2VuLWZvcmVncm91bmRcIjtcbiAgdGl0bGUuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcIm15LTEgaC01IHctNDQgcm91bmRlZC1tZFwiKSk7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodmVyaWZpZWRTYWZlR2hvc3RCYWRnZSgpKTtcbiAgc3RhY2suYXBwZW5kQ2hpbGQodGl0bGVSb3cpO1xuXG4gIGNvbnN0IGRlc2MgPSB0d2Vha1N0b3JlRGVzY3JpcHRpb24oKTtcbiAgZGVzYy5hcHBlbmRDaGlsZChnaG9zdEJsb2NrKFwibXQtMSBoLTMgdy1mdWxsIHJvdW5kZWRcIikpO1xuICBkZXNjLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJtdC0yIGgtMyB3LTExLzEyIHJvdW5kZWRcIikpO1xuICBkZXNjLmFwcGVuZENoaWxkKGdob3N0QmxvY2soXCJtdC0yIGgtMyB3LTcvMTIgcm91bmRlZFwiKSk7XG4gIHN0YWNrLmFwcGVuZENoaWxkKGRlc2MpO1xuXG4gIGNvbnN0IHJlYWRNb3JlID0gdHdlYWtTdG9yZVJlYWRNb3JlQnV0dG9uKFwiXCIpO1xuICByZWFkTW9yZS5yZXBsYWNlQ2hpbGRyZW4oZ2hvc3RCbG9jayhcImgtNSB3LTI0IHJvdW5kZWRcIikpO1xuICBzdGFjay5hcHBlbmRDaGlsZChyZWFkTW9yZSk7XG5cbiAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQoc3RvcmVWZXJzaW9uR2hvc3RCYWRnZSgpKTtcbiAgYWN0aW9ucy5hcHBlbmRDaGlsZChzdG9yZVN0YXR1c0dob3N0UGlsbCgpKTtcbiAgcmV0dXJuIGNhcmQ7XG59XG5cbmZ1bmN0aW9uIHN0b3JlQXZhdGFyR2hvc3QoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBhdmF0YXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBhdmF0YXIuY2xhc3NOYW1lID1cbiAgICBcImZsZXggaC0xMCB3LTEwIHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBvdmVyZmxvdy1oaWRkZW4gcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlci1kZWZhdWx0IGJnLXRyYW5zcGFyZW50IHRleHQtdG9rZW4tZGVzY3JpcHRpb24tZm9yZWdyb3VuZFwiO1xuICBhdmF0YXIuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcImgtZnVsbCB3LWZ1bGxcIikpO1xuICByZXR1cm4gYXZhdGFyO1xufVxuXG5mdW5jdGlvbiB2ZXJpZmllZFNhZmVHaG9zdEJhZGdlKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFkZ2UgPSB2ZXJpZmllZFNhZmVCYWRnZSgpO1xuICBiYWRnZS5yZXBsYWNlQ2hpbGRyZW4oZ2hvc3RCbG9jayhcImgtWzEzcHhdIHctWzEzcHhdIHJvdW5kZWQtc21cIiksIGdob3N0QmxvY2soXCJoLTMgdy0yMCByb3VuZGVkXCIpKTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiBzdG9yZVN0YXR1c0dob3N0UGlsbCgpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IHBpbGwgPSBzdG9yZVN0YXR1c1BpbGwoXCJJbnN0YWxsZWRcIik7XG4gIHBpbGwuY2xhc3NMaXN0LmFkZChcImFuaW1hdGUtcHVsc2VcIik7XG4gIHBpbGwuc3R5bGUuY29sb3IgPSBcInRyYW5zcGFyZW50XCI7XG4gIHJldHVybiBwaWxsO1xufVxuXG5mdW5jdGlvbiBzdG9yZVZlcnNpb25HaG9zdEJhZGdlKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFkZ2UgPSBzdG9yZVZlcnNpb25CYWRnZVNoZWxsKGZhbHNlKTtcbiAgYmFkZ2UuYXBwZW5kQ2hpbGQoZ2hvc3RCbG9jayhcImgtMyB3LTM2IHJvdW5kZWRcIikpO1xuICByZXR1cm4gYmFkZ2U7XG59XG5cbmZ1bmN0aW9uIGdob3N0QmxvY2soY2xhc3NOYW1lOiBzdHJpbmcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGJsb2NrID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgYmxvY2suY2xhc3NOYW1lID0gYGFuaW1hdGUtcHVsc2UgYmctdG9rZW4tZm9yZWdyb3VuZC8xMCAke2NsYXNzTmFtZX1gO1xuICBibG9jay5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gIHJldHVybiBibG9jaztcbn1cblxuZnVuY3Rpb24gc3RvcmVBdmF0YXIoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeVZpZXcpOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGF2YXRhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGF2YXRhci5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBoLTEwIHctMTAgc2hyaW5rLTAgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIG92ZXJmbG93LWhpZGRlbiByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLWRlZmF1bHQgYmctdHJhbnNwYXJlbnQgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCI7XG4gIGNvbnN0IGluaXRpYWwgPSAoZW50cnkubWFuaWZlc3QubmFtZT8uWzBdID8/IFwiP1wiKS50b1VwcGVyQ2FzZSgpO1xuICBjb25zdCBmYWxsYmFjayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBmYWxsYmFjay50ZXh0Q29udGVudCA9IGluaXRpYWw7XG4gIGF2YXRhci5hcHBlbmRDaGlsZChmYWxsYmFjayk7XG4gIGNvbnN0IGljb25VcmwgPSBzdG9yZUVudHJ5SWNvblVybChlbnRyeSk7XG4gIGlmIChpY29uVXJsKSB7XG4gICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICBpbWcuYWx0ID0gXCJcIjtcbiAgICBpbWcuY2xhc3NOYW1lID0gXCJoLWZ1bGwgdy1mdWxsIG9iamVjdC1jb3ZlclwiO1xuICAgIGltZy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgaW1nLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcbiAgICAgIGZhbGxiYWNrLnJlbW92ZSgpO1xuICAgICAgaW1nLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgIH0pO1xuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKCkgPT4ge1xuICAgICAgaW1nLnJlbW92ZSgpO1xuICAgIH0pO1xuICAgIGltZy5zcmMgPSBpY29uVXJsO1xuICAgIGF2YXRhci5hcHBlbmRDaGlsZChpbWcpO1xuICB9XG4gIHJldHVybiBhdmF0YXI7XG59XG5cbmZ1bmN0aW9uIHN0b3JlRW50cnlJY29uVXJsKGVudHJ5OiBUd2Vha1N0b3JlRW50cnlWaWV3KTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGljb25VcmwgPSBlbnRyeS5tYW5pZmVzdC5pY29uVXJsPy50cmltKCk7XG4gIGlmICghaWNvblVybCkgcmV0dXJuIG51bGw7XG4gIGlmICgvXihodHRwcz86fGRhdGE6KS9pLnRlc3QoaWNvblVybCkpIHJldHVybiBpY29uVXJsO1xuICBjb25zdCByZWwgPSBpY29uVXJsLnJlcGxhY2UoL15cXC4/XFwvLywgXCJcIik7XG4gIGlmICghcmVsIHx8IHJlbC5zdGFydHNXaXRoKFwiLi4vXCIpKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vJHtlbnRyeS5yZXBvfS8ke2VudHJ5LmFwcHJvdmVkQ29tbWl0U2hhfS8ke3JlbH1gO1xufVxuXG5mdW5jdGlvbiBzaWRlYmFyVXBkYXRlUGlsbEJ1dHRvbigpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmRhdGFzZXQuY29kZXhwcFNpZGViYXJVcGRhdGUgPSBcInRydWVcIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgXCJ1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB3aGl0ZXNwYWNlLW5vd3JhcFwiO1xuICBPYmplY3QuYXNzaWduKGJ0bi5zdHlsZSwge1xuICAgIGRpc3BsYXk6IFwibm9uZVwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjk5OTlweFwiLFxuICAgIGJvcmRlcjogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogXCIjMEE4NEZGXCIsXG4gICAgY29sb3I6IFwiI0ZGRkZGRlwiLFxuICAgIHBhZGRpbmc6IFwiMCA4cHhcIixcbiAgICBmb250U2l6ZTogXCIxMHB4XCIsXG4gICAgZm9udFdlaWdodDogXCI3MDBcIixcbiAgICBsaW5lSGVpZ2h0OiBcIjIwcHhcIixcbiAgICBsZXR0ZXJTcGFjaW5nOiBcIjBcIixcbiAgICB0ZXh0VHJhbnNmb3JtOiBcIm5vbmVcIixcbiAgICBib3hTaGFkb3c6IFwiMCAxcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4xOClcIixcbiAgfSk7XG4gIGJ0bi50ZXh0Q29udGVudCA9IFwiVXBkYXRlXCI7XG4gIGJ0bi50aXRsZSA9IFwiT3BlbiBDb2RleCsrIHVwZGF0ZVwiO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZW50ZXJcIiwgKCkgPT4ge1xuICAgIGJ0bi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjMDA3MUUzXCI7XG4gIH0pO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbGVhdmVcIiwgKCkgPT4ge1xuICAgIGJ0bi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjMEE4NEZGXCI7XG4gIH0pO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgYnRuLmRhdGFzZXQuY29kZXhwcFJlbGVhc2VVcmwgfHwgQ09ERVhfUExVU1BMVVNfUkVMRUFTRVNfVVJMKTtcbiAgfSk7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihmb3JjZSA9IGZhbHNlKTogdm9pZCB7XG4gIGNvbnN0IGJ0biA9IHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b247XG4gIGlmICghYnRuKSByZXR1cm47XG4gIHZvaWQgaXBjUmVuZGVyZXJcbiAgICAuaW52b2tlKFwiY29kZXhwcDpjaGVjay1jb2RleHBwLXVwZGF0ZVwiLCBmb3JjZSlcbiAgICAudGhlbigoY2hlY2spID0+IHNldFNpZGViYXJDb2RleFBsdXNQbHVzVXBkYXRlQnV0dG9uKGNoZWNrIGFzIENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjaykpXG4gICAgLmNhdGNoKChlKSA9PiB7XG4gICAgICBwbG9nKFwiQ29kZXgrKyBzaWRlYmFyIHJlbGVhc2UgY2hlY2sgZmFpbGVkXCIsIFN0cmluZyhlKSk7XG4gICAgICBzZXRTaWRlYmFyQ29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbihudWxsKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gc2V0U2lkZWJhckNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24oY2hlY2s6IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgYnRuID0gc3RhdGUuY29kZXhQbHVzUGx1c1VwZGF0ZUJ1dHRvbjtcbiAgaWYgKCFidG4pIHJldHVybjtcbiAgY29uc3QgdXBkYXRlQXZhaWxhYmxlID0gY2hlY2s/LnVwZGF0ZUF2YWlsYWJsZSA9PT0gdHJ1ZTtcbiAgYnRuLnN0eWxlLmRpc3BsYXkgPSB1cGRhdGVBdmFpbGFibGUgPyBcImlubGluZS1mbGV4XCIgOiBcIm5vbmVcIjtcbiAgYnRuLmhpZGRlbiA9ICF1cGRhdGVBdmFpbGFibGU7XG4gIGJ0bi5kYXRhc2V0LmNvZGV4cHBSZWxlYXNlVXJsID0gY2hlY2s/LnJlbGVhc2VVcmwgfHwgQ09ERVhfUExVU1BMVVNfUkVMRUFTRVNfVVJMO1xuICBidG4udGl0bGUgPVxuICAgIHVwZGF0ZUF2YWlsYWJsZSAmJiBjaGVjaz8ubGF0ZXN0VmVyc2lvblxuICAgICAgPyBgT3BlbiBDb2RleCsrICR7Y2hlY2subGF0ZXN0VmVyc2lvbn0gdXBkYXRlYFxuICAgICAgOiBcIk9wZW4gQ29kZXgrKyB1cGRhdGVcIjtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU3RvcmVVcGRhdGVCYWRnZShjb3VudDogbnVtYmVyIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBiYWRnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiW2RhdGEtY29kZXhwcC1zdG9yZS11cGRhdGUtYmFkZ2VdXCIpO1xuICBpZiAoIWJhZGdlKSByZXR1cm47XG4gIGJhZGdlLmRhdGFzZXQuY29kZXhwcFN0b3JlVXBkYXRlQ291bnQgPSBjb3VudCA9PT0gbnVsbCA/IFwiXCIgOiBTdHJpbmcoY291bnQpO1xuICBhcHBseVN0b3JlVXBkYXRlQmFkZ2VTdHlsZShiYWRnZSwgY291bnQpO1xuICBiYWRnZS5oaWRkZW4gPSBjb3VudCA9PT0gbnVsbCB8fCBjb3VudCA8PSAwO1xuICBiYWRnZS50ZXh0Q29udGVudCA9IGNvdW50ICYmIGNvdW50ID4gMCA/IFN0cmluZyhjb3VudCkgOiBcIlwiO1xuICBiYWRnZS50aXRsZSA9XG4gICAgY291bnQgJiYgY291bnQgPiAwXG4gICAgICA/IGAke2NvdW50fSBpbnN0YWxsZWQgdHdlYWske2NvdW50ID09PSAxID8gXCJcIiA6IFwic1wifSBjYW4gYmUgdXBkYXRlZGBcbiAgICAgIDogXCJJbnN0YWxsZWQgdHdlYWtzIGFyZSB1cCB0byBkYXRlXCI7XG59XG5cbmZ1bmN0aW9uIGFwcGx5U3RvcmVVcGRhdGVCYWRnZVN0eWxlKGJhZGdlOiBIVE1MRWxlbWVudCwgY291bnQ6IG51bWJlciB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgaGFzVXBkYXRlcyA9ICEhY291bnQgJiYgY291bnQgPiAwO1xuICBPYmplY3QuYXNzaWduKGJhZGdlLnN0eWxlLCB7XG4gICAgbWluV2lkdGg6IFwiMjRweFwiLFxuICAgIGhlaWdodDogXCIyMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjk5OTlweFwiLFxuICAgIGJvcmRlcjogXCIwXCIsXG4gICAgYmFja2dyb3VuZDogaGFzVXBkYXRlcyA/IFwiIzBBODRGRlwiIDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGNvbG9yOiBcIiNGRkZGRkZcIixcbiAgICBwYWRkaW5nOiBcIjAgN3B4XCIsXG4gICAgZm9udFNpemU6IFwiMTJweFwiLFxuICAgIGZvbnRXZWlnaHQ6IFwiNzAwXCIsXG4gICAgbGluZUhlaWdodDogXCIyMHB4XCIsXG4gICAgbGV0dGVyU3BhY2luZzogXCIwXCIsXG4gICAgYm94U2hhZG93OiBoYXNVcGRhdGVzID8gXCIwIDFweCAycHggcmdiYSgwLCAwLCAwLCAwLjIyKVwiIDogXCJub25lXCIsXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjdXJyZW50U3RvcmVVcGRhdGVCYWRnZUNvdW50KCk6IG51bWJlciB7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXN0b3JlLXVwZGF0ZS1iYWRnZV1cIik7XG4gIGNvbnN0IHJhdyA9IGJhZGdlPy5kYXRhc2V0LmNvZGV4cHBTdG9yZVVwZGF0ZUNvdW50O1xuICBjb25zdCBwYXJzZWQgPSByYXcgPyBOdW1iZXIocmF3KSA6IDA7XG4gIHJldHVybiBOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSA/IHBhcnNlZCA6IDA7XG59XG5cbmZ1bmN0aW9uIG91dGRhdGVkSW5zdGFsbGVkU3RvcmVDb3VudChlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlWaWV3W10pOiBudW1iZXIge1xuICByZXR1cm4gZW50cmllcy5maWx0ZXIoKGVudHJ5KSA9PiAhIWVudHJ5Lmluc3RhbGxlZCAmJiBlbnRyeS5pbnN0YWxsZWQudmVyc2lvbiAhPT0gZW50cnkubWFuaWZlc3QudmVyc2lvbikubGVuZ3RoO1xufVxuXG5mdW5jdGlvbiBzdG9yZVRvb2xiYXJCdXR0b24oXG4gIGxhYmVsOiBzdHJpbmcsXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4gIHZhcmlhbnQ6IFwicHJpbWFyeVwiIHwgXCJzZWNvbmRhcnlcIiA9IFwic2Vjb25kYXJ5XCIsXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgdmFyaWFudCA9PT0gXCJwcmltYXJ5XCJcbiAgICAgID8gXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBoLTggaXRlbXMtY2VudGVyIGdhcC0xIHdoaXRlc3BhY2Utbm93cmFwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIgYmctdG9rZW4tYmctZm9nIHB4LTIgcHktMCB0ZXh0LXNtIHRleHQtdG9rZW4tYnV0dG9uLXRlcnRpYXJ5LWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNDBcIlxuICAgICAgOiBcImJvcmRlci10b2tlbi1ib3JkZXIgdXNlci1zZWxlY3Qtbm9uZSBuby1kcmFnIGN1cnNvci1pbnRlcmFjdGlvbiBmbGV4IGgtOCBpdGVtcy1jZW50ZXIgZ2FwLTEgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRyYW5zcGFyZW50IGJnLXRva2VuLWZvcmVncm91bmQvNSBweC0yIHB5LTAgdGV4dC1zbSB0ZXh0LXRva2VuLWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI7XG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljaygpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gc3RvcmVJY29uQnV0dG9uKFxuICBpY29uU3ZnOiBzdHJpbmcsXG4gIGxhYmVsOiBzdHJpbmcsXG4gIG9uQ2xpY2s6ICgpID0+IHZvaWQsXG4pOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gIGJ0bi50eXBlID0gXCJidXR0b25cIjtcbiAgYnRuLmNsYXNzTmFtZSA9XG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBoLTggdy04IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdHJhbnNwYXJlbnQgYmctdG9rZW4tZm9yZWdyb3VuZC81IHAtMCB0ZXh0LXRva2VuLWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1mb3JlZ3JvdW5kLzEwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI7XG4gIGFwcGVuZFN2Z0h0bWwoYnRuLCBpY29uU3ZnKTtcbiAgYnRuLnNldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIiwgbGFiZWwpO1xuICBidG4udGl0bGUgPSBsYWJlbDtcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIG9uQ2xpY2soKTtcbiAgfSk7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIHZlcmlmaWVkU2FmZUJhZGdlKCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgYmFkZ2UuY2xhc3NOYW1lID1cbiAgICBcImlubGluZS1mbGV4IGgtNiBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSByb3VuZGVkLW1kIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyLzMwIGJnLXRyYW5zcGFyZW50IHB4LTIgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmRcIjtcbiAgYXBwZW5kU3ZnSHRtbChcbiAgICBiYWRnZSxcbiAgICBgPHN2ZyB3aWR0aD1cIjEzXCIgaGVpZ2h0PVwiMTNcIiB2aWV3Qm94PVwiMCAwIDE0IDE0XCIgZmlsbD1cIm5vbmVcIiBjbGFzcz1cInRleHQtYmx1ZS01MDBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk03IDEuNzUgMTEuMjUgMy40djMuMmMwIDIuNi0xLjY1IDQuMjUtNC4yNSA1LjQtMi42LTEuMTUtNC4yNS0yLjgtNC4yNS01LjRWMy40TDcgMS43NVpcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjE1XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNNC44NSA3LjA1IDYuMyA4LjQ1bDIuODUtMy4wNVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuMjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDwvc3ZnPmAsXG4gICk7XG4gIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgdGV4dC50ZXh0Q29udGVudCA9IFwiVmVyaWZpZWQgYXMgc2FmZVwiO1xuICBiYWRnZS5hcHBlbmRDaGlsZCh0ZXh0KTtcbiAgcmV0dXJuIGJhZGdlO1xufVxuXG5mdW5jdGlvbiB0d2Vha1N0b3JlVmVyc2lvbkJhZGdlKGVudHJ5OiBUd2Vha1N0b3JlRW50cnlWaWV3LCBpbnN0YWxsZWRPdmVycmlkZT86IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgaW5zdGFsbGVkID0gaW5zdGFsbGVkT3ZlcnJpZGUgPz8gZW50cnkuaW5zdGFsbGVkPy52ZXJzaW9uID8/IG51bGw7XG4gIGNvbnN0IGxhdGVzdCA9IGVudHJ5Lm1hbmlmZXN0LnZlcnNpb247XG4gIGNvbnN0IGhhc1VwZGF0ZSA9ICEhaW5zdGFsbGVkICYmIGluc3RhbGxlZCAhPT0gbGF0ZXN0O1xuICBjb25zdCBiYWRnZSA9IHN0b3JlVmVyc2lvbkJhZGdlU2hlbGwoaGFzVXBkYXRlKTtcbiAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgbGFiZWwuY2xhc3NOYW1lID0gXCJ0cnVuY2F0ZVwiO1xuICBsYWJlbC50ZXh0Q29udGVudCA9IGluc3RhbGxlZFxuICAgID8gYEluc3RhbGxlZCB2JHtpbnN0YWxsZWR9IFx1MDBCNyBMYXRlc3QgdiR7bGF0ZXN0fWBcbiAgICA6IGBMYXRlc3QgdiR7bGF0ZXN0fWA7XG4gIGJhZGdlLnRpdGxlID0gaW5zdGFsbGVkXG4gICAgPyBgSW5zdGFsbGVkIHZlcnNpb24gJHtpbnN0YWxsZWR9LiBMYXRlc3QgYXBwcm92ZWQgdmVyc2lvbiAke2xhdGVzdH0uYFxuICAgIDogYExhdGVzdCBhcHByb3ZlZCB2ZXJzaW9uICR7bGF0ZXN0fS5gO1xuICBiYWRnZS5hcHBlbmRDaGlsZChsYWJlbCk7XG4gIHJldHVybiBiYWRnZTtcbn1cblxuZnVuY3Rpb24gc3RvcmVWZXJzaW9uQmFkZ2VTaGVsbChoYXNVcGRhdGU6IGJvb2xlYW4pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIGJhZGdlLmNsYXNzTmFtZSA9IFtcbiAgICBcImlubGluZS1mbGV4IGgtOCBtaW4tdy0wIG1heC13LWZ1bGwgaXRlbXMtY2VudGVyIHJvdW5kZWQtbGcgYm9yZGVyIHB4LTIuNSB0ZXh0LXhzIGZvbnQtbWVkaXVtXCIsXG4gICAgaGFzVXBkYXRlXG4gICAgICA/IFwiYm9yZGVyLWJsdWUtNTAwLzMwIGJnLWJsdWUtNTAwLzEwIHRleHQtdG9rZW4tZm9yZWdyb3VuZFwiXG4gICAgICA6IFwiYm9yZGVyLXRva2VuLWJvcmRlci80MCBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCIsXG4gIF0uam9pbihcIiBcIik7XG4gIHJldHVybiBiYWRnZTtcbn1cblxuZnVuY3Rpb24gc3RvcmVTdGF0dXNQaWxsKGxhYmVsOiBzdHJpbmcsIHRvbmU6IFwibmV1dHJhbFwiIHwgXCJpbmZvXCIgPSBcIm5ldXRyYWxcIik6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgcGlsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBwaWxsLmNsYXNzTmFtZSA9IFtcbiAgICBcImlubGluZS1mbGV4IGgtOCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBweC0zIHRleHQtc20gZm9udC1tZWRpdW1cIixcbiAgICB0b25lID09PSBcImluZm9cIlxuICAgICAgPyBcImJvcmRlciBib3JkZXItYmx1ZS01MDAvMzAgYmctYmx1ZS01MDAvMTAgdGV4dC10b2tlbi1mb3JlZ3JvdW5kXCJcbiAgICAgIDogXCJiZy10b2tlbi1mb3JlZ3JvdW5kLzUgdGV4dC10b2tlbi1kZXNjcmlwdGlvbi1mb3JlZ3JvdW5kXCIsXG4gIF0uam9pbihcIiBcIik7XG4gIHBpbGwudGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgcmV0dXJuIHBpbGw7XG59XG5cbmZ1bmN0aW9uIHN0b3JlSW5zdGFsbEJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbkNsaWNrOiAoYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCkgPT4gdm9pZCk6IEhUTUxCdXR0b25FbGVtZW50IHtcbiAgY29uc3QgYnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYnRuLnR5cGUgPSBcImJ1dHRvblwiO1xuICBidG4uY2xhc3NOYW1lID1cbiAgICBzdG9yZUluc3RhbGxCdXR0b25DbGFzcygpO1xuICBidG4udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgYnRuLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIG9uQ2xpY2soYnRuKTtcbiAgfSk7XG4gIHJldHVybiBidG47XG59XG5cbmZ1bmN0aW9uIHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKGV4dHJhID0gXCJcIik6IHN0cmluZyB7XG4gIHJldHVybiBbXG4gICAgXCJib3JkZXItdG9rZW4tYm9yZGVyIHVzZXItc2VsZWN0LW5vbmUgbm8tZHJhZyBjdXJzb3ItaW50ZXJhY3Rpb24gZmxleCBoLTggbWluLXctWzgycHhdIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBnYXAtMS41IHdoaXRlc3BhY2Utbm93cmFwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1ibHVlLTUwMC80MCBiZy1ibHVlLTUwMCBweC0zIHB5LTAgdGV4dC1zbSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLWZvcmVncm91bmQgc2hhZG93LXNtIHRyYW5zaXRpb24tY29sb3JzIGVuYWJsZWQ6aG92ZXI6YmctYmx1ZS02MDAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktODBcIixcbiAgICBleHRyYSxcbiAgXS5maWx0ZXIoQm9vbGVhbikuam9pbihcIiBcIik7XG59XG5cbmZ1bmN0aW9uIHNob3dTdG9yZUJ1dHRvbkxvYWRpbmcoYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICBidXR0b24uY2xhc3NOYW1lID0gc3RvcmVJbnN0YWxsQnV0dG9uQ2xhc3MoKTtcbiAgYnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcbiAgYnV0dG9uLnNldEF0dHJpYnV0ZShcImFyaWEtYnVzeVwiLCBcInRydWVcIik7XG4gIGJ1dHRvbi5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgYXBwZW5kU3ZnSHRtbChcbiAgICBidXR0b24sXG4gICAgYDxzdmcgY2xhc3M9XCJhbmltYXRlLXNwaW5cIiB3aWR0aD1cIjE0XCIgaGVpZ2h0PVwiMTRcIiB2aWV3Qm94PVwiMCAwIDE2IDE2XCIgZmlsbD1cIm5vbmVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPGNpcmNsZSBjeD1cIjhcIiBjeT1cIjhcIiByPVwiNS41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIG9wYWNpdHk9XCIuMjVcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNMTMuNSA4QTUuNSA1LjUgMCAwIDAgOCAyLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YCxcbiAgKTtcbiAgY29uc3QgdGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICB0ZXh0LnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGJ1dHRvbi5hcHBlbmRDaGlsZCh0ZXh0KTtcbn1cblxuZnVuY3Rpb24gc2hvd1N0b3JlQnV0dG9uSW5zdGFsbGVkKGJ1dHRvbjogSFRNTEJ1dHRvbkVsZW1lbnQpOiB2b2lkIHtcbiAgYnV0dG9uLmNsYXNzTmFtZSA9IHN0b3JlSW5zdGFsbEJ1dHRvbkNsYXNzKFwiYm9yZGVyLWJsdWUtNTAwIGJnLWJsdWUtNTAwXCIpO1xuICBidXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICBidXR0b24ucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1idXN5XCIpO1xuICBidXR0b24ucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGFwcGVuZFN2Z0h0bWwoXG4gICAgYnV0dG9uLFxuICAgIGA8c3ZnIHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHZpZXdCb3g9XCIwIDAgMTYgMTZcIiBmaWxsPVwibm9uZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTMuNzUgOC4xNSA2LjY1IDExIDEyLjI1IDVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjhcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDwvc3ZnPmAsXG4gICk7XG4gIGNvbnN0IHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgdGV4dC50ZXh0Q29udGVudCA9IFwiSW5zdGFsbGVkXCI7XG4gIGJ1dHRvbi5hcHBlbmRDaGlsZCh0ZXh0KTtcbn1cblxuZnVuY3Rpb24gcmVzZXRTdG9yZUluc3RhbGxCdXR0b24oYnV0dG9uOiBIVE1MQnV0dG9uRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICBidXR0b24uY2xhc3NOYW1lID0gc3RvcmVJbnN0YWxsQnV0dG9uQ2xhc3MoKTtcbiAgYnV0dG9uLmRpc2FibGVkID0gZmFsc2U7XG4gIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLWJ1c3lcIik7XG4gIGJ1dHRvbi50ZXh0Q29udGVudCA9IGxhYmVsO1xufVxuXG5mdW5jdGlvbiBzaG93U3RvcmVUb2FzdChtZXNzYWdlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbGV0IGhvc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIltkYXRhLWNvZGV4cHAtc3RvcmUtdG9hc3QtaG9zdF1cIik7XG4gIGlmICghaG9zdCkge1xuICAgIGhvc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGhvc3QuZGF0YXNldC5jb2RleHBwU3RvcmVUb2FzdEhvc3QgPSBcInRydWVcIjtcbiAgICBob3N0LmNsYXNzTmFtZSA9IFwicG9pbnRlci1ldmVudHMtbm9uZSBmaXhlZCBib3R0b20tNSByaWdodC01IHotWzk5OTldIGZsZXggZmxleC1jb2wgaXRlbXMtZW5kIGdhcC0yXCI7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChob3N0KTtcbiAgfVxuICBjb25zdCB0b2FzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRvYXN0LmNsYXNzTmFtZSA9XG4gICAgXCJ0cmFuc2xhdGUteS0yIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci10b2tlbi1ib3JkZXIvNTAgYmctdG9rZW4tbWFpbi1zdXJmYWNlLXByaW1hcnkgcHgtMyBweS0yIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC10b2tlbi1mb3JlZ3JvdW5kIG9wYWNpdHktMCBzaGFkb3ctbGcgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMjAwXCI7XG4gIHRvYXN0LnRleHRDb250ZW50ID0gbWVzc2FnZTtcbiAgaG9zdC5hcHBlbmRDaGlsZCh0b2FzdCk7XG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7XG4gICAgdG9hc3QuY2xhc3NMaXN0LnJlbW92ZShcInRyYW5zbGF0ZS15LTJcIiwgXCJvcGFjaXR5LTBcIik7XG4gIH0pO1xuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0b2FzdC5jbGFzc0xpc3QuYWRkKFwidHJhbnNsYXRlLXktMlwiLCBcIm9wYWNpdHktMFwiKTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHRvYXN0LnJlbW92ZSgpO1xuICAgICAgaWYgKGhvc3QgJiYgaG9zdC5jaGlsZEVsZW1lbnRDb3VudCA9PT0gMCkgaG9zdC5yZW1vdmUoKTtcbiAgICB9LCAyMjApO1xuICB9LCAyNjAwKTtcbn1cblxuZnVuY3Rpb24gc3RvcmVNZXNzYWdlQ2FyZCh0aXRsZTogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgY2FyZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNhcmQuY2xhc3NOYW1lID1cbiAgICBcImJvcmRlci10b2tlbi1ib3JkZXIvNDAgZmxleCBtaW4taC1bODRweF0gZmxleC1jb2wganVzdGlmeS1jZW50ZXIgZ2FwLTEgcm91bmRlZC0yeGwgYm9yZGVyIHAtNCB0ZXh0LXNtXCI7XG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0LmNsYXNzTmFtZSA9IFwiZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdC50ZXh0Q29udGVudCA9IHRpdGxlO1xuICBjYXJkLmFwcGVuZENoaWxkKHQpO1xuICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBkLmNsYXNzTmFtZSA9IFwidGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICAgIGQudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcbiAgICBjYXJkLmFwcGVuZENoaWxkKGQpO1xuICB9XG4gIHJldHVybiBjYXJkO1xufVxuXG5mdW5jdGlvbiByZW5kZXJUd2Vha3NQYWdlKHNlY3Rpb25zV3JhcDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3Qgb3BlbkJ0biA9IG9wZW5JblBsYWNlQnV0dG9uKFwiT3BlbiBUd2Vha3MgRm9sZGVyXCIsICgpID0+IHtcbiAgICB2b2lkIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6cmV2ZWFsXCIsIHR3ZWFrc1BhdGgoKSk7XG4gIH0pO1xuICBjb25zdCByZWxvYWRCdG4gPSBvcGVuSW5QbGFjZUJ1dHRvbihcIkZvcmNlIFJlbG9hZFwiLCAoKSA9PiB7XG4gICAgLy8gRnVsbCBwYWdlIHJlZnJlc2ggXHUyMDE0IHNhbWUgYXMgRGV2VG9vbHMgQ21kLVIgLyBvdXIgQ0RQIFBhZ2UucmVsb2FkLlxuICAgIC8vIE1haW4gcmUtZGlzY292ZXJzIHR3ZWFrcyBmaXJzdCBzbyB0aGUgbmV3IHJlbmRlcmVyIGNvbWVzIHVwIHdpdGggYVxuICAgIC8vIGZyZXNoIHR3ZWFrIHNldDsgdGhlbiBsb2NhdGlvbi5yZWxvYWQgcmVzdGFydHMgdGhlIHJlbmRlcmVyIHNvIHRoZVxuICAgIC8vIHByZWxvYWQgcmUtaW5pdGlhbGl6ZXMgYWdhaW5zdCBpdC5cbiAgICB2b2lkIGlwY1JlbmRlcmVyXG4gICAgICAuaW52b2tlKFwiY29kZXhwcDpyZWxvYWQtdHdlYWtzXCIpXG4gICAgICAuY2F0Y2goKGUpID0+IHBsb2coXCJmb3JjZSByZWxvYWQgKG1haW4pIGZhaWxlZFwiLCBTdHJpbmcoZSkpKVxuICAgICAgLmZpbmFsbHkoKCkgPT4ge1xuICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgIH0pO1xuICB9KTtcbiAgLy8gRHJvcCB0aGUgZGlhZ29uYWwtYXJyb3cgaWNvbiBmcm9tIHRoZSByZWxvYWQgYnV0dG9uIFx1MjAxNCBpdCBpbXBsaWVzIFwib3BlblxuICAvLyBvdXQgb2YgYXBwXCIgd2hpY2ggZG9lc24ndCBmaXQuIFJlcGxhY2UgaXRzIHRyYWlsaW5nIHN2ZyB3aXRoIGEgcmVmcmVzaC5cbiAgY29uc3QgcmVsb2FkU3ZnID0gcmVsb2FkQnRuLnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIik7XG4gIGlmIChyZWxvYWRTdmcpIHtcbiAgICBjb25zdCBpY29uID0gc3ZnRWxlbWVudChcbiAgICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tMnhzXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+YCArXG4gICAgICBgPHBhdGggZD1cIk00IDEwYTYgNiAwIDAgMSAxMC4yNC00LjI0TDE2IDcuNU0xNiA0djMuNWgtMy41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgICAgYDxwYXRoIGQ9XCJNMTYgMTBhNiA2IDAgMCAxLTEwLjI0IDQuMjRMNCAxMi41TTQgMTZ2LTMuNWgzLjVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgICBgPC9zdmc+YCxcbiAgICApO1xuICAgIGlmIChpY29uKSByZWxvYWRTdmcucmVwbGFjZVdpdGgoaWNvbik7XG4gIH1cblxuICBjb25zdCB0cmFpbGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRyYWlsaW5nLmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgdHJhaWxpbmcuYXBwZW5kQ2hpbGQocmVsb2FkQnRuKTtcbiAgdHJhaWxpbmcuYXBwZW5kQ2hpbGQob3BlbkJ0bik7XG5cbiAgaWYgKHN0YXRlLmxpc3RlZFR3ZWFrcy5sZW5ndGggPT09IDApIHtcbiAgICBjb25zdCBzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNlY3Rpb25cIik7XG4gICAgc2VjdGlvbi5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgICBzZWN0aW9uLmFwcGVuZENoaWxkKHNlY3Rpb25UaXRsZShcIkluc3RhbGxlZCBUd2Vha3NcIiwgdHJhaWxpbmcpKTtcbiAgICBjb25zdCBjYXJkID0gcm91bmRlZENhcmQoKTtcbiAgICBjYXJkLmFwcGVuZENoaWxkKFxuICAgICAgcm93U2ltcGxlKFxuICAgICAgICBcIk5vIHR3ZWFrcyBpbnN0YWxsZWRcIixcbiAgICAgICAgYERyb3AgYSB0d2VhayBmb2xkZXIgaW50byAke3R3ZWFrc1BhdGgoKX0gYW5kIHJlbG9hZC5gLFxuICAgICAgKSxcbiAgICApO1xuICAgIHNlY3Rpb24uYXBwZW5kQ2hpbGQoY2FyZCk7XG4gICAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHNlY3Rpb24pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIEdyb3VwIHJlZ2lzdGVyZWQgU2V0dGluZ3NTZWN0aW9ucyBieSB0d2VhayBpZCAocHJlZml4IHNwbGl0IGF0IFwiOlwiKS5cbiAgY29uc3Qgc2VjdGlvbnNCeVR3ZWFrID0gbmV3IE1hcDxzdHJpbmcsIFNldHRpbmdzU2VjdGlvbltdPigpO1xuICBmb3IgKGNvbnN0IHMgb2Ygc3RhdGUuc2VjdGlvbnMudmFsdWVzKCkpIHtcbiAgICBjb25zdCB0d2Vha0lkID0gcy5pZC5zcGxpdChcIjpcIilbMF07XG4gICAgaWYgKCFzZWN0aW9uc0J5VHdlYWsuaGFzKHR3ZWFrSWQpKSBzZWN0aW9uc0J5VHdlYWsuc2V0KHR3ZWFrSWQsIFtdKTtcbiAgICBzZWN0aW9uc0J5VHdlYWsuZ2V0KHR3ZWFrSWQpIS5wdXNoKHMpO1xuICB9XG5cbiAgY29uc3QgcGFnZXNCeVR3ZWFrID0gbmV3IE1hcDxzdHJpbmcsIFJlZ2lzdGVyZWRQYWdlW10+KCk7XG4gIGZvciAoY29uc3QgcCBvZiBzdGF0ZS5wYWdlcy52YWx1ZXMoKSkge1xuICAgIGlmICghcGFnZXNCeVR3ZWFrLmhhcyhwLnR3ZWFrSWQpKSBwYWdlc0J5VHdlYWsuc2V0KHAudHdlYWtJZCwgW10pO1xuICAgIHBhZ2VzQnlUd2Vhay5nZXQocC50d2Vha0lkKSEucHVzaChwKTtcbiAgfVxuXG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic2VjdGlvblwiKTtcbiAgd3JhcC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLTJcIjtcbiAgd3JhcC5hcHBlbmRDaGlsZChzZWN0aW9uVGl0bGUoXCJJbnN0YWxsZWQgVHdlYWtzXCIsIHRyYWlsaW5nKSk7XG5cbiAgY29uc3QgY2FyZCA9IHJvdW5kZWRDYXJkKCk7XG4gIGZvciAoY29uc3QgdCBvZiBzdGF0ZS5saXN0ZWRUd2Vha3MpIHtcbiAgICBjYXJkLmFwcGVuZENoaWxkKFxuICAgICAgdHdlYWtSb3coXG4gICAgICAgIHQsXG4gICAgICAgIHNlY3Rpb25zQnlUd2Vhay5nZXQodC5tYW5pZmVzdC5pZCkgPz8gW10sXG4gICAgICAgIHBhZ2VzQnlUd2Vhay5nZXQodC5tYW5pZmVzdC5pZCkgPz8gW10sXG4gICAgICApLFxuICAgICk7XG4gIH1cbiAgd3JhcC5hcHBlbmRDaGlsZChjYXJkKTtcbiAgc2VjdGlvbnNXcmFwLmFwcGVuZENoaWxkKHdyYXApO1xufVxuXG5mdW5jdGlvbiB0d2Vha1JvdyhcbiAgdDogTGlzdGVkVHdlYWssXG4gIHNlY3Rpb25zOiBTZXR0aW5nc1NlY3Rpb25bXSxcbiAgcGFnZXM6IFJlZ2lzdGVyZWRQYWdlW10sXG4pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IG0gPSB0Lm1hbmlmZXN0O1xuXG4gIC8vIE91dGVyIGNlbGwgd3JhcHMgdGhlIGhlYWRlciByb3cgKyAob3B0aW9uYWwpIG5lc3RlZCBzZWN0aW9ucyBzbyB0aGVcbiAgLy8gcGFyZW50IGNhcmQncyBkaXZpZGVyIHN0YXlzIGJldHdlZW4gKnR3ZWFrcyosIG5vdCBiZXR3ZWVuIGhlYWRlciBhbmRcbiAgLy8gYm9keSBvZiB0aGUgc2FtZSB0d2Vhay5cbiAgY29uc3QgY2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGNlbGwuY2xhc3NOYW1lID0gXCJmbGV4IGZsZXgtY29sXCI7XG4gIGlmICghdC5lbmFibGVkKSBjZWxsLnN0eWxlLm9wYWNpdHkgPSBcIjAuN1wiO1xuXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRlci5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuXG4gIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBsZWZ0LmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtMSBpdGVtcy1zdGFydCBnYXAtM1wiO1xuXG4gIC8vIFx1MjUwMFx1MjUwMCBBdmF0YXIgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4gIGNvbnN0IGF2YXRhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGF2YXRhci5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgcm91bmRlZC1tZCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBvdmVyZmxvdy1oaWRkZW4gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBhdmF0YXIuc3R5bGUud2lkdGggPSBcIjU2cHhcIjtcbiAgYXZhdGFyLnN0eWxlLmhlaWdodCA9IFwiNTZweFwiO1xuICBhdmF0YXIuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCJ2YXIoLS1jb2xvci10b2tlbi1iZy1mb2csIHRyYW5zcGFyZW50KVwiO1xuICBpZiAobS5pY29uVXJsKSB7XG4gICAgY29uc3QgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICBpbWcuYWx0ID0gXCJcIjtcbiAgICBpbWcuY2xhc3NOYW1lID0gXCJzaXplLWZ1bGwgb2JqZWN0LWNvbnRhaW5cIjtcbiAgICAvLyBJbml0aWFsOiBzaG93IGZhbGxiYWNrIGluaXRpYWwgaW4gY2FzZSB0aGUgaWNvbiBmYWlscyB0byBsb2FkLlxuICAgIGNvbnN0IGluaXRpYWwgPSAobS5uYW1lPy5bMF0gPz8gXCI/XCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3QgZmFsbGJhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICBmYWxsYmFjay5jbGFzc05hbWUgPSBcInRleHQteGwgZm9udC1tZWRpdW1cIjtcbiAgICBmYWxsYmFjay50ZXh0Q29udGVudCA9IGluaXRpYWw7XG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKGZhbGxiYWNrKTtcbiAgICBpbWcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIGltZy5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG4gICAgICBmYWxsYmFjay5yZW1vdmUoKTtcbiAgICAgIGltZy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICB9KTtcbiAgICBpbWcuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsICgpID0+IHtcbiAgICAgIGltZy5yZW1vdmUoKTtcbiAgICB9KTtcbiAgICB2b2lkIHJlc29sdmVJY29uVXJsKG0uaWNvblVybCwgdC5kaXIpLnRoZW4oKHVybCkgPT4ge1xuICAgICAgaWYgKHVybCkgaW1nLnNyYyA9IHVybDtcbiAgICAgIGVsc2UgaW1nLnJlbW92ZSgpO1xuICAgIH0pO1xuICAgIGF2YXRhci5hcHBlbmRDaGlsZChpbWcpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGluaXRpYWwgPSAobS5uYW1lPy5bMF0gPz8gXCI/XCIpLnRvVXBwZXJDYXNlKCk7XG4gICAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgIHNwYW4uY2xhc3NOYW1lID0gXCJ0ZXh0LXhsIGZvbnQtbWVkaXVtXCI7XG4gICAgc3Bhbi50ZXh0Q29udGVudCA9IGluaXRpYWw7XG4gICAgYXZhdGFyLmFwcGVuZENoaWxkKHNwYW4pO1xuICB9XG4gIGxlZnQuYXBwZW5kQ2hpbGQoYXZhdGFyKTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVGV4dCBzdGFjayBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbiAgY29uc3Qgc3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMC41XCI7XG5cbiAgY29uc3QgdGl0bGVSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZVJvdy5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI7XG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBuYW1lLmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIG5hbWUudGV4dENvbnRlbnQgPSBtLm5hbWU7XG4gIHRpdGxlUm93LmFwcGVuZENoaWxkKG5hbWUpO1xuICBpZiAobS52ZXJzaW9uKSB7XG4gICAgY29uc3QgdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgdmVyLmNsYXNzTmFtZSA9XG4gICAgICBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgdGV4dC14cyBmb250LW5vcm1hbCB0YWJ1bGFyLW51bXNcIjtcbiAgICB2ZXIudGV4dENvbnRlbnQgPSBgdiR7bS52ZXJzaW9ufWA7XG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQodmVyKTtcbiAgfVxuICBpZiAodC51cGRhdGU/LnVwZGF0ZUF2YWlsYWJsZSkge1xuICAgIGNvbnN0IGJhZGdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgYmFkZ2UuY2xhc3NOYW1lID1cbiAgICAgIFwicm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLWZvcmVncm91bmQvNSBweC0yIHB5LTAuNSB0ZXh0LVsxMXB4XSBmb250LW1lZGl1bSB0ZXh0LXRva2VuLXRleHQtcHJpbWFyeVwiO1xuICAgIGJhZGdlLnRleHRDb250ZW50ID0gXCJVcGRhdGUgQXZhaWxhYmxlXCI7XG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuICB9XG4gIHN0YWNrLmFwcGVuZENoaWxkKHRpdGxlUm93KTtcblxuICBpZiAobS5kZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGRlc2MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGRlc2MuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICAgIGRlc2MudGV4dENvbnRlbnQgPSBtLmRlc2NyaXB0aW9uO1xuICAgIHN0YWNrLmFwcGVuZENoaWxkKGRlc2MpO1xuICB9XG5cbiAgY29uc3QgbWV0YSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIG1ldGEuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXhzIHRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIjtcbiAgY29uc3QgYXV0aG9yRWwgPSByZW5kZXJBdXRob3IobS5hdXRob3IpO1xuICBpZiAoYXV0aG9yRWwpIG1ldGEuYXBwZW5kQ2hpbGQoYXV0aG9yRWwpO1xuICBpZiAobS5naXRodWJSZXBvKSB7XG4gICAgaWYgKG1ldGEuY2hpbGRyZW4ubGVuZ3RoID4gMCkgbWV0YS5hcHBlbmRDaGlsZChkb3QoKSk7XG4gICAgY29uc3QgcmVwbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgcmVwby50eXBlID0gXCJidXR0b25cIjtcbiAgICByZXBvLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggdGV4dC10b2tlbi10ZXh0LWxpbmstZm9yZWdyb3VuZCBob3Zlcjp1bmRlcmxpbmVcIjtcbiAgICByZXBvLnRleHRDb250ZW50ID0gbS5naXRodWJSZXBvO1xuICAgIHJlcG8uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdm9pZCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm9wZW4tZXh0ZXJuYWxcIiwgYGh0dHBzOi8vZ2l0aHViLmNvbS8ke20uZ2l0aHViUmVwb31gKTtcbiAgICB9KTtcbiAgICBtZXRhLmFwcGVuZENoaWxkKHJlcG8pO1xuICB9XG4gIGlmIChtLmhvbWVwYWdlKSB7XG4gICAgaWYgKG1ldGEuY2hpbGRyZW4ubGVuZ3RoID4gMCkgbWV0YS5hcHBlbmRDaGlsZChkb3QoKSk7XG4gICAgY29uc3QgbGluayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgIGxpbmsuaHJlZiA9IG0uaG9tZXBhZ2U7XG4gICAgbGluay50YXJnZXQgPSBcIl9ibGFua1wiO1xuICAgIGxpbmsucmVsID0gXCJub3JlZmVycmVyXCI7XG4gICAgbGluay5jbGFzc05hbWUgPSBcImlubGluZS1mbGV4IHRleHQtdG9rZW4tdGV4dC1saW5rLWZvcmVncm91bmQgaG92ZXI6dW5kZXJsaW5lXCI7XG4gICAgbGluay50ZXh0Q29udGVudCA9IFwiSG9tZXBhZ2VcIjtcbiAgICBtZXRhLmFwcGVuZENoaWxkKGxpbmspO1xuICB9XG4gIGlmIChtZXRhLmNoaWxkcmVuLmxlbmd0aCA+IDApIHN0YWNrLmFwcGVuZENoaWxkKG1ldGEpO1xuXG4gIC8vIFRhZ3Mgcm93IChpZiBhbnkpIFx1MjAxNCBzbWFsbCBwaWxsIGNoaXBzIGJlbG93IHRoZSBtZXRhIGxpbmUuXG4gIGlmIChtLnRhZ3MgJiYgbS50YWdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCB0YWdzUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0YWdzUm93LmNsYXNzTmFtZSA9IFwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGdhcC0xIHB0LTAuNVwiO1xuICAgIGZvciAoY29uc3QgdGFnIG9mIG0udGFncykge1xuICAgICAgY29uc3QgcGlsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgcGlsbC5jbGFzc05hbWUgPVxuICAgICAgICBcInJvdW5kZWQtZnVsbCBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10b2tlbi1mb3JlZ3JvdW5kLzUgcHgtMiBweS0wLjUgdGV4dC1bMTFweF0gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICAgICAgcGlsbC50ZXh0Q29udGVudCA9IHRhZztcbiAgICAgIHRhZ3NSb3cuYXBwZW5kQ2hpbGQocGlsbCk7XG4gICAgfVxuICAgIHN0YWNrLmFwcGVuZENoaWxkKHRhZ3NSb3cpO1xuICB9XG5cbiAgbGVmdC5hcHBlbmRDaGlsZChzdGFjayk7XG4gIGhlYWRlci5hcHBlbmRDaGlsZChsZWZ0KTtcblxuICAvLyBcdTI1MDBcdTI1MDAgVG9nZ2xlIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHJpZ2h0LmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTIgcHQtMC41XCI7XG4gIGlmICh0LmVuYWJsZWQgJiYgcGFnZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGNvbmZpZ3VyZUJ0biA9IGNvbXBhY3RCdXR0b24oXCJDb25maWd1cmVcIiwgKCkgPT4ge1xuICAgICAgYWN0aXZhdGVQYWdlKHsga2luZDogXCJyZWdpc3RlcmVkXCIsIGlkOiBwYWdlc1swXSEuaWQgfSk7XG4gICAgfSk7XG4gICAgY29uZmlndXJlQnRuLnRpdGxlID0gcGFnZXMubGVuZ3RoID09PSAxXG4gICAgICA/IGBPcGVuICR7cGFnZXNbMF0hLnBhZ2UudGl0bGV9YFxuICAgICAgOiBgT3BlbiAke3BhZ2VzLm1hcCgocCkgPT4gcC5wYWdlLnRpdGxlKS5qb2luKFwiLCBcIil9YDtcbiAgICByaWdodC5hcHBlbmRDaGlsZChjb25maWd1cmVCdG4pO1xuICB9XG4gIGlmICh0LnVwZGF0ZT8udXBkYXRlQXZhaWxhYmxlICYmIHQudXBkYXRlLnJlbGVhc2VVcmwpIHtcbiAgICByaWdodC5hcHBlbmRDaGlsZChcbiAgICAgIGNvbXBhY3RCdXR0b24oXCJSZXZpZXcgUmVsZWFzZVwiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIHQudXBkYXRlIS5yZWxlYXNlVXJsKTtcbiAgICAgIH0pLFxuICAgICk7XG4gIH1cbiAgcmlnaHQuYXBwZW5kQ2hpbGQoXG4gICAgc3dpdGNoQ29udHJvbCh0LmVuYWJsZWQsIGFzeW5jIChuZXh0KSA9PiB7XG4gICAgICBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnNldC10d2Vhay1lbmFibGVkXCIsIG0uaWQsIG5leHQpO1xuICAgICAgLy8gVGhlIG1haW4gcHJvY2VzcyBicm9hZGNhc3RzIGEgcmVsb2FkIHdoaWNoIHdpbGwgcmUtZmV0Y2ggdGhlIGxpc3RcbiAgICAgIC8vIGFuZCByZS1yZW5kZXIuIFdlIGRvbid0IG9wdGltaXN0aWNhbGx5IHRvZ2dsZSB0byBhdm9pZCBkcmlmdC5cbiAgICB9KSxcbiAgKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKHJpZ2h0KTtcblxuICBjZWxsLmFwcGVuZENoaWxkKGhlYWRlcik7XG5cbiAgLy8gSWYgdGhlIHR3ZWFrIGlzIGVuYWJsZWQgYW5kIHJlZ2lzdGVyZWQgc2V0dGluZ3Mgc2VjdGlvbnMsIHJlbmRlciB0aG9zZVxuICAvLyBib2RpZXMgYXMgbmVzdGVkIHJvd3MgYmVuZWF0aCB0aGUgaGVhZGVyIGluc2lkZSB0aGUgc2FtZSBjZWxsLlxuICBpZiAodC5lbmFibGVkICYmIHNlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBuZXN0ZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIG5lc3RlZC5jbGFzc05hbWUgPVxuICAgICAgXCJmbGV4IGZsZXgtY29sIGRpdmlkZS15LVswLjVweF0gZGl2aWRlLXRva2VuLWJvcmRlciBib3JkZXItdC1bMC41cHhdIGJvcmRlci10b2tlbi1ib3JkZXJcIjtcbiAgICBmb3IgKGNvbnN0IHMgb2Ygc2VjdGlvbnMpIHtcbiAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgYm9keS5jbGFzc05hbWUgPSBcInAtM1wiO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcy5yZW5kZXIoYm9keSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGJvZHkudGV4dENvbnRlbnQgPSBgRXJyb3IgcmVuZGVyaW5nIHR3ZWFrIHNlY3Rpb246ICR7KGUgYXMgRXJyb3IpLm1lc3NhZ2V9YDtcbiAgICAgIH1cbiAgICAgIG5lc3RlZC5hcHBlbmRDaGlsZChib2R5KTtcbiAgICB9XG4gICAgY2VsbC5hcHBlbmRDaGlsZChuZXN0ZWQpO1xuICB9XG5cbiAgcmV0dXJuIGNlbGw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckF1dGhvcihhdXRob3I6IFR3ZWFrTWFuaWZlc3RbXCJhdXRob3JcIl0pOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBpZiAoIWF1dGhvcikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgd3JhcC5jbGFzc05hbWUgPSBcImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMVwiO1xuICBpZiAodHlwZW9mIGF1dGhvciA9PT0gXCJzdHJpbmdcIikge1xuICAgIHdyYXAudGV4dENvbnRlbnQgPSBgYnkgJHthdXRob3J9YDtcbiAgICByZXR1cm4gd3JhcDtcbiAgfVxuICB3cmFwLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiYnkgXCIpKTtcbiAgaWYgKGF1dGhvci51cmwpIHtcbiAgICBjb25zdCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgYS5ocmVmID0gYXV0aG9yLnVybDtcbiAgICBhLnRhcmdldCA9IFwiX2JsYW5rXCI7XG4gICAgYS5yZWwgPSBcIm5vcmVmZXJyZXJcIjtcbiAgICBhLmNsYXNzTmFtZSA9IFwiaW5saW5lLWZsZXggdGV4dC10b2tlbi10ZXh0LWxpbmstZm9yZWdyb3VuZCBob3Zlcjp1bmRlcmxpbmVcIjtcbiAgICBhLnRleHRDb250ZW50ID0gYXV0aG9yLm5hbWU7XG4gICAgd3JhcC5hcHBlbmRDaGlsZChhKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgc3Bhbi50ZXh0Q29udGVudCA9IGF1dGhvci5uYW1lO1xuICAgIHdyYXAuYXBwZW5kQ2hpbGQoc3Bhbik7XG4gIH1cbiAgcmV0dXJuIHdyYXA7XG59XG5cbmZ1bmN0aW9uIG9wZW5QdWJsaXNoVHdlYWtEaWFsb2coKTogdm9pZCB7XG4gIGNvbnN0IGV4aXN0aW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCJbZGF0YS1jb2RleHBwLXB1Ymxpc2gtZGlhbG9nXVwiKTtcbiAgZXhpc3Rpbmc/LnJlbW92ZSgpO1xuXG4gIGNvbnN0IG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBvdmVybGF5LmRhdGFzZXQuY29kZXhwcFB1Ymxpc2hEaWFsb2cgPSBcInRydWVcIjtcbiAgb3ZlcmxheS5jbGFzc05hbWUgPSBcImZpeGVkIGluc2V0LTAgei1bOTk5OV0gZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXIgYmctYmxhY2svNDAgcC00XCI7XG5cbiAgY29uc3QgZGlhbG9nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgZGlhbG9nLmNsYXNzTmFtZSA9XG4gICAgXCJmbGV4IHctZnVsbCBtYXgtdy14bCBmbGV4LWNvbCBnYXAtNCByb3VuZGVkLWxnIGJvcmRlciBib3JkZXItdG9rZW4tYm9yZGVyIGJnLXRva2VuLW1haW4tc3VyZmFjZS1wcmltYXJ5IHAtNCBzaGFkb3cteGxcIjtcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChkaWFsb2cpO1xuXG4gIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRlci5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtc3RhcnQganVzdGlmeS1iZXR3ZWVuIGdhcC0zXCI7XG4gIGNvbnN0IHRpdGxlU3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZVN0YWNrLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHRpdGxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgdGl0bGUuY2xhc3NOYW1lID0gXCJ0ZXh0LWJhc2UgZm9udC1tZWRpdW0gdGV4dC10b2tlbi10ZXh0LXByaW1hcnlcIjtcbiAgdGl0bGUudGV4dENvbnRlbnQgPSBcIlB1Ymxpc2ggVHdlYWtcIjtcbiAgY29uc3Qgc3VidGl0bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdWJ0aXRsZS5jbGFzc05hbWUgPSBcInRleHQtc20gdGV4dC10b2tlbi10ZXh0LXNlY29uZGFyeVwiO1xuICBzdWJ0aXRsZS50ZXh0Q29udGVudCA9IFwiU3VibWl0IGEgR2l0SHViIHJlcG8gZm9yIGFkbWluIHJldmlldy4gQ29kZXgrKyByZWNvcmRzIHRoZSBleGFjdCBjb21taXQgYWRtaW5zIG11c3QgcmV2aWV3IGFuZCBwaW4uXCI7XG4gIHRpdGxlU3RhY2suYXBwZW5kQ2hpbGQodGl0bGUpO1xuICB0aXRsZVN0YWNrLmFwcGVuZENoaWxkKHN1YnRpdGxlKTtcbiAgaGVhZGVyLmFwcGVuZENoaWxkKHRpdGxlU3RhY2spO1xuICBoZWFkZXIuYXBwZW5kQ2hpbGQoY29tcGFjdEJ1dHRvbihcIkRpc21pc3NcIiwgKCkgPT4gb3ZlcmxheS5yZW1vdmUoKSkpO1xuICBkaWFsb2cuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcblxuICBjb25zdCByZXBvSW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gIHJlcG9JbnB1dC50eXBlID0gXCJ0ZXh0XCI7XG4gIHJlcG9JbnB1dC5wbGFjZWhvbGRlciA9IFwib3duZXIvcmVwbyBvciBodHRwczovL2dpdGh1Yi5jb20vb3duZXIvcmVwb1wiO1xuICByZXBvSW5wdXQuY2xhc3NOYW1lID1cbiAgICBcImgtMTAgcm91bmRlZC1sZyBib3JkZXIgYm9yZGVyLXRva2VuLWJvcmRlciBiZy10cmFuc3BhcmVudCBweC0zIHRleHQtc20gdGV4dC10b2tlbi10ZXh0LXByaW1hcnkgZm9jdXM6b3V0bGluZS1ub25lXCI7XG4gIGRpYWxvZy5hcHBlbmRDaGlsZChyZXBvSW5wdXQpO1xuXG4gIGNvbnN0IHN0YXR1cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHN0YXR1cy5jbGFzc05hbWUgPSBcIm1pbi1oLTUgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIHN0YXR1cy50ZXh0Q29udGVudCA9IFwiVGhlIG1hbmlmZXN0IHNob3VsZCBpbmNsdWRlIGFuIGljb25Vcmwgc3VpdGFibGUgZm9yIHRoZSBzdG9yZS5cIjtcbiAgZGlhbG9nLmFwcGVuZENoaWxkKHN0YXR1cyk7XG5cbiAgY29uc3QgYWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGFjdGlvbnMuY2xhc3NOYW1lID0gXCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWVuZCBnYXAtMlwiO1xuICBjb25zdCBzdWJtaXQgPSBjb21wYWN0QnV0dG9uKFwiT3BlbiBSZXZpZXcgSXNzdWVcIiwgKCkgPT4ge1xuICAgIHZvaWQgc3VibWl0UHVibGlzaFR3ZWFrKHJlcG9JbnB1dCwgc3RhdHVzKTtcbiAgfSk7XG4gIGFjdGlvbnMuYXBwZW5kQ2hpbGQoc3VibWl0KTtcbiAgZGlhbG9nLmFwcGVuZENoaWxkKGFjdGlvbnMpO1xuXG4gIG92ZXJsYXkuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgaWYgKGUudGFyZ2V0ID09PSBvdmVybGF5KSBvdmVybGF5LnJlbW92ZSgpO1xuICB9KTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChvdmVybGF5KTtcbiAgcmVwb0lucHV0LmZvY3VzKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN1Ym1pdFB1Ymxpc2hUd2VhayhcbiAgcmVwb0lucHV0OiBIVE1MSW5wdXRFbGVtZW50LFxuICBzdGF0dXM6IEhUTUxFbGVtZW50LFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIHN0YXR1cy5jbGFzc05hbWUgPSBcIm1pbi1oLTUgdGV4dC1zbSB0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5XCI7XG4gIHN0YXR1cy50ZXh0Q29udGVudCA9IFwiUmVzb2x2aW5nIHRoZSByZXBvIGNvbW1pdCB0byByZXZpZXcuXCI7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3VibWlzc2lvbiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgIFwiY29kZXhwcDpwcmVwYXJlLXR3ZWFrLXN0b3JlLXN1Ym1pc3Npb25cIixcbiAgICAgIHJlcG9JbnB1dC52YWx1ZSxcbiAgICApIGFzIFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbjtcbiAgICBjb25zdCB1cmwgPSBidWlsZFR3ZWFrUHVibGlzaElzc3VlVXJsKHN1Ym1pc3Npb24pO1xuICAgIGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCB1cmwpO1xuICAgIHN0YXR1cy50ZXh0Q29udGVudCA9IGBHaXRIdWIgcmV2aWV3IGlzc3VlIG9wZW5lZCBmb3IgJHtzdWJtaXNzaW9uLmNvbW1pdFNoYS5zbGljZSgwLCA3KX0uYDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHN0YXR1cy5jbGFzc05hbWUgPSBcIm1pbi1oLTUgdGV4dC1zbSB0ZXh0LXRva2VuLWNoYXJ0cy1yZWRcIjtcbiAgICBzdGF0dXMudGV4dENvbnRlbnQgPSBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UgPz8gZSk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIGNvbXBvbmVudHMgXHUyNTAwXHUyNTAwXG5cbi8qKiBUaGUgZnVsbCBwYW5lbCBzaGVsbCAodG9vbGJhciArIHNjcm9sbCArIGhlYWRpbmcgKyBzZWN0aW9ucyB3cmFwKS4gKi9cbmZ1bmN0aW9uIHBhbmVsU2hlbGwoXG4gIHRpdGxlOiBzdHJpbmcsXG4gIHN1YnRpdGxlPzogc3RyaW5nLFxuICBvcHRpb25zPzogeyB3aWRlPzogYm9vbGVhbiB9LFxuKToge1xuICBvdXRlcjogSFRNTEVsZW1lbnQ7XG4gIHNlY3Rpb25zV3JhcDogSFRNTEVsZW1lbnQ7XG4gIHN1YnRpdGxlPzogSFRNTEVsZW1lbnQ7XG4gIGhlYWRlckFjdGlvbnM6IEhUTUxFbGVtZW50O1xuICBoZWFkZXJUaXRsZUFjdGlvbnM6IEhUTUxFbGVtZW50O1xufSB7XG4gIGNvbnN0IG91dGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgb3V0ZXIuY2xhc3NOYW1lID0gXCJtYWluLXN1cmZhY2UgZmxleCBoLWZ1bGwgbWluLWgtMCBmbGV4LWNvbFwiO1xuXG4gIGNvbnN0IHRvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0b29sYmFyLmNsYXNzTmFtZSA9XG4gICAgXCJkcmFnZ2FibGUgZmxleCBpdGVtcy1jZW50ZXIgcHgtcGFuZWwgZWxlY3Ryb246aC10b29sYmFyIGV4dGVuc2lvbjpoLXRvb2xiYXItc21cIjtcbiAgb3V0ZXIuYXBwZW5kQ2hpbGQodG9vbGJhcik7XG5cbiAgY29uc3Qgc2Nyb2xsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgc2Nyb2xsLmNsYXNzTmFtZSA9IFwiZmxleC0xIG92ZXJmbG93LXktYXV0byBwLXBhbmVsXCI7XG4gIG91dGVyLmFwcGVuZENoaWxkKHNjcm9sbCk7XG5cbiAgY29uc3QgaW5uZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBpbm5lci5jbGFzc05hbWUgPVxuICAgIG9wdGlvbnM/LndpZGVcbiAgICAgID8gXCJteC1hdXRvIGZsZXggdy1mdWxsIG1heC13LTV4bCBmbGV4LWNvbCBlbGVjdHJvbjptaW4tdy1bY2FsYygzMjBweCp2YXIoLS1jb2RleC13aW5kb3ctem9vbSkpXVwiXG4gICAgICA6IFwibXgtYXV0byBmbGV4IHctZnVsbCBmbGV4LWNvbCBtYXgtdy0yeGwgZWxlY3Ryb246bWluLXctW2NhbGMoMzIwcHgqdmFyKC0tY29kZXgtd2luZG93LXpvb20pKV1cIjtcbiAgc2Nyb2xsLmFwcGVuZENoaWxkKGlubmVyKTtcblxuICBjb25zdCBoZWFkZXJXcmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyV3JhcC5jbGFzc05hbWUgPSBcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBwYi1wYW5lbFwiO1xuICBjb25zdCBoZWFkZXJJbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRlcklubmVyLmNsYXNzTmFtZSA9IFwiZmxleCBtaW4tdy0wIGZsZXgtMSBmbGV4LWNvbCBnYXAtMS41IHBiLXBhbmVsXCI7XG4gIGNvbnN0IHRpdGxlTGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlTGluZS5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgY29uc3QgaGVhZGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIGhlYWRpbmcuY2xhc3NOYW1lID0gXCJlbGVjdHJvbjpoZWFkaW5nLWxnIGhlYWRpbmctYmFzZSB0cnVuY2F0ZVwiO1xuICBoZWFkaW5nLnRleHRDb250ZW50ID0gdGl0bGU7XG4gIHRpdGxlTGluZS5hcHBlbmRDaGlsZChoZWFkaW5nKTtcbiAgY29uc3QgaGVhZGVyVGl0bGVBY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyVGl0bGVBY3Rpb25zLmNsYXNzTmFtZSA9IFwiZmxleCBzaHJpbmstMCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgdGl0bGVMaW5lLmFwcGVuZENoaWxkKGhlYWRlclRpdGxlQWN0aW9ucyk7XG4gIGhlYWRlcklubmVyLmFwcGVuZENoaWxkKHRpdGxlTGluZSk7XG4gIGxldCBzdWJ0aXRsZUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICBpZiAoc3VidGl0bGUpIHtcbiAgICBjb25zdCBzdWIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHN1Yi5jbGFzc05hbWUgPSBcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnkgdGV4dC1zbVwiO1xuICAgIHN1Yi50ZXh0Q29udGVudCA9IHN1YnRpdGxlO1xuICAgIGhlYWRlcklubmVyLmFwcGVuZENoaWxkKHN1Yik7XG4gICAgc3VidGl0bGVFbGVtZW50ID0gc3ViO1xuICB9XG4gIGhlYWRlcldyYXAuYXBwZW5kQ2hpbGQoaGVhZGVySW5uZXIpO1xuICBjb25zdCBoZWFkZXJBY3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgaGVhZGVyQWN0aW9ucy5jbGFzc05hbWUgPSBcImZsZXggc2hyaW5rLTAgaXRlbXMtY2VudGVyIGdhcC0yXCI7XG4gIGhlYWRlcldyYXAuYXBwZW5kQ2hpbGQoaGVhZGVyQWN0aW9ucyk7XG4gIGlubmVyLmFwcGVuZENoaWxkKGhlYWRlcldyYXApO1xuXG4gIGNvbnN0IHNlY3Rpb25zV3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHNlY3Rpb25zV3JhcC5jbGFzc05hbWUgPSBcImZsZXggZmxleC1jb2wgZ2FwLVt2YXIoLS1wYWRkaW5nLXBhbmVsKV1cIjtcbiAgaW5uZXIuYXBwZW5kQ2hpbGQoc2VjdGlvbnNXcmFwKTtcblxuICByZXR1cm4geyBvdXRlciwgc2VjdGlvbnNXcmFwLCBzdWJ0aXRsZTogc3VidGl0bGVFbGVtZW50LCBoZWFkZXJBY3Rpb25zLCBoZWFkZXJUaXRsZUFjdGlvbnMgfTtcbn1cblxuZnVuY3Rpb24gc2VjdGlvblRpdGxlKHRleHQ6IHN0cmluZywgdHJhaWxpbmc/OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3QgdGl0bGVSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0aXRsZVJvdy5jbGFzc05hbWUgPVxuICAgIFwiZmxleCBoLXRvb2xiYXIgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBweC0wIHB5LTBcIjtcbiAgY29uc3QgdGl0bGVJbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlSW5uZXIuY2xhc3NOYW1lID0gXCJmbGV4IG1pbi13LTAgZmxleC0xIGZsZXgtY29sIGdhcC0xXCI7XG4gIGNvbnN0IHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICB0LmNsYXNzTmFtZSA9IFwidGV4dC1iYXNlIGZvbnQtbWVkaXVtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gIHQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICB0aXRsZUlubmVyLmFwcGVuZENoaWxkKHQpO1xuICB0aXRsZVJvdy5hcHBlbmRDaGlsZCh0aXRsZUlubmVyKTtcbiAgaWYgKHRyYWlsaW5nKSB7XG4gICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHJpZ2h0LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIjtcbiAgICByaWdodC5hcHBlbmRDaGlsZCh0cmFpbGluZyk7XG4gICAgdGl0bGVSb3cuYXBwZW5kQ2hpbGQocmlnaHQpO1xuICB9XG4gIHJldHVybiB0aXRsZVJvdztcbn1cblxuLyoqXG4gKiBDb2RleCdzIFwiT3BlbiBjb25maWcudG9tbFwiLXN0eWxlIHRyYWlsaW5nIGJ1dHRvbjogZ2hvc3QgYm9yZGVyLCBtdXRlZFxuICogbGFiZWwsIHRvcC1yaWdodCBkaWFnb25hbCBhcnJvdyBpY29uLiBNYXJrdXAgbWlycm9ycyBDb25maWd1cmF0aW9uIHBhbmVsLlxuICovXG5mdW5jdGlvbiBvcGVuSW5QbGFjZUJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbkNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciB1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xIGJvcmRlciB3aGl0ZXNwYWNlLW5vd3JhcCBmb2N1czpvdXRsaW5lLW5vbmUgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGRpc2FibGVkOm9wYWNpdHktNDAgcm91bmRlZC1sZyB0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmQgZW5hYmxlZDpob3ZlcjpiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmQgZGF0YS1bc3RhdGU9b3Blbl06YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kIGJvcmRlci10cmFuc3BhcmVudCBoLXRva2VuLWJ1dHRvbi1jb21wb3NlciBweC0yIHB5LTAgdGV4dC1iYXNlIGxlYWRpbmctWzE4cHhdXCI7XG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBhcHBlbmRTdmdIdG1sKFxuICAgIGJ0bixcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLTJ4c1wiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTE0LjMzNDkgMTMuMzMwMVY2LjYwNjQ1TDUuNDcwNjUgMTUuNDcwN0M1LjIxMDk1IDE1LjczMDQgNC43ODg5NSAxNS43MzA0IDQuNTI5MjUgMTUuNDcwN0M0LjI2OTU1IDE1LjIxMSA0LjI2OTU1IDE0Ljc4OSA0LjUyOTI1IDE0LjUyOTNMMTMuMzkzNSA1LjY2NTA0SDYuNjYwMTFDNi4yOTI4NCA1LjY2NTA0IDUuOTk1MDcgNS4zNjcyNyA1Ljk5NTA3IDVDNS45OTUwNyA0LjYzMjczIDYuMjkyODQgNC4zMzQ5NiA2LjY2MDExIDQuMzM0OTZIMTQuOTk5OUwxNS4xMzM3IDQuMzQ4NjNDMTUuNDM2OSA0LjQxMDU3IDE1LjY2NSA0LjY3ODU3IDE1LjY2NSA1VjEzLjMzMDFDMTUuNjY0OSAxMy42OTczIDE1LjM2NzIgMTMuOTk1MSAxNC45OTk5IDEzLjk5NTFDMTQuNjMyNyAxMy45OTUxIDE0LjMzNSAxMy42OTczIDE0LjMzNDkgMTMuMzMwMVpcIiBmaWxsPVwiY3VycmVudENvbG9yXCI+PC9wYXRoPmAgK1xuICAgIGA8L3N2Zz5gLFxuICApO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljaygpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gY29tcGFjdEJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbkNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciB1c2VyLXNlbGVjdC1ub25lIG5vLWRyYWcgY3Vyc29yLWludGVyYWN0aW9uIGlubGluZS1mbGV4IGgtOCBpdGVtcy1jZW50ZXIgd2hpdGVzcGFjZS1ub3dyYXAgcm91bmRlZC1sZyBib3JkZXIgcHgtMiB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5IGVuYWJsZWQ6aG92ZXI6YmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBkaXNhYmxlZDpvcGFjaXR5LTQwXCI7XG4gIGJ0bi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgb25DbGljaygpO1xuICB9KTtcbiAgcmV0dXJuIGJ0bjtcbn1cblxuZnVuY3Rpb24gcm91bmRlZENhcmQoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgY2FyZC5jbGFzc05hbWUgPVxuICAgIFwiYm9yZGVyLXRva2VuLWJvcmRlciBmbGV4IGZsZXgtY29sIGRpdmlkZS15LVswLjVweF0gZGl2aWRlLXRva2VuLWJvcmRlciByb3VuZGVkLWxnIGJvcmRlclwiO1xuICBjYXJkLnNldEF0dHJpYnV0ZShcbiAgICBcInN0eWxlXCIsXG4gICAgXCJiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb2xvci1iYWNrZ3JvdW5kLXBhbmVsLCB2YXIoLS1jb2xvci10b2tlbi1iZy1mb2cpKTtcIixcbiAgKTtcbiAgcmV0dXJuIGNhcmQ7XG59XG5cbmZ1bmN0aW9uIHJvd1NpbXBsZSh0aXRsZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IEhUTUxFbGVtZW50IHtcbiAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgcm93LmNsYXNzTmFtZSA9IFwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC00IHAtM1wiO1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgbGVmdC5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBpdGVtcy1jZW50ZXIgZ2FwLTNcIjtcbiAgY29uc3Qgc3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBzdGFjay5jbGFzc05hbWUgPSBcImZsZXggbWluLXctMCBmbGV4LWNvbCBnYXAtMVwiO1xuICBpZiAodGl0bGUpIHtcbiAgICBjb25zdCB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICB0LmNsYXNzTmFtZSA9IFwibWluLXctMCB0ZXh0LXNtIHRleHQtdG9rZW4tdGV4dC1wcmltYXJ5XCI7XG4gICAgdC50ZXh0Q29udGVudCA9IHRpdGxlO1xuICAgIHN0YWNrLmFwcGVuZENoaWxkKHQpO1xuICB9XG4gIGlmIChkZXNjcmlwdGlvbikge1xuICAgIGNvbnN0IGQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIGQuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLXRleHQtc2Vjb25kYXJ5IG1pbi13LTAgdGV4dC1zbVwiO1xuICAgIGQudGV4dENvbnRlbnQgPSBkZXNjcmlwdGlvbjtcbiAgICBzdGFjay5hcHBlbmRDaGlsZChkKTtcbiAgfVxuICBsZWZ0LmFwcGVuZENoaWxkKHN0YWNrKTtcbiAgcm93LmFwcGVuZENoaWxkKGxlZnQpO1xuICByZXR1cm4gcm93O1xufVxuXG4vKipcbiAqIENvZGV4LXN0eWxlZCB0b2dnbGUgc3dpdGNoLiBNYXJrdXAgbWlycm9ycyB0aGUgR2VuZXJhbCA+IFBlcm1pc3Npb25zIHJvd1xuICogc3dpdGNoIHdlIGNhcHR1cmVkOiBvdXRlciBidXR0b24gKHJvbGU9c3dpdGNoKSwgaW5uZXIgcGlsbCwgc2xpZGluZyBrbm9iLlxuICovXG5mdW5jdGlvbiBzd2l0Y2hDb250cm9sKFxuICBpbml0aWFsOiBib29sZWFuLFxuICBvbkNoYW5nZTogKG5leHQ6IGJvb2xlYW4pID0+IHZvaWQgfCBQcm9taXNlPHZvaWQ+LFxuKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBidG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICBidG4udHlwZSA9IFwiYnV0dG9uXCI7XG4gIGJ0bi5zZXRBdHRyaWJ1dGUoXCJyb2xlXCIsIFwic3dpdGNoXCIpO1xuXG4gIGNvbnN0IHBpbGwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgcGlsbC5zZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiLCBcInRydWVcIik7XG4gIGNvbnN0IGtub2IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAga25vYi5jbGFzc05hbWUgPVxuICAgIFwicm91bmRlZC1mdWxsIGJvcmRlciBib3JkZXItY29udHJvbC10aHVtYi1vbi1hY2NlbnQgYmctY29udHJvbC10aHVtYi1vbi1hY2NlbnQgc2hhZG93LXNtIHRyYW5zaXRpb24tdHJhbnNmb3JtIGR1cmF0aW9uLTIwMCBlYXNlLW91dCBoLTQgdy00XCI7XG4gIHBpbGwuYXBwZW5kQ2hpbGQoa25vYik7XG5cbiAgY29uc3QgYXBwbHkgPSAob246IGJvb2xlYW4pOiB2b2lkID0+IHtcbiAgICBidG4uc2V0QXR0cmlidXRlKFwiYXJpYS1jaGVja2VkXCIsIFN0cmluZyhvbikpO1xuICAgIGJ0bi5kYXRhc2V0LnN0YXRlID0gb24gPyBcImNoZWNrZWRcIiA6IFwidW5jaGVja2VkXCI7XG4gICAgYnRuLmNsYXNzTmFtZSA9XG4gICAgICBcImlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LXNtIGZvY3VzLXZpc2libGU6b3V0bGluZS1ub25lIGZvY3VzLXZpc2libGU6cmluZy0yIGZvY3VzLXZpc2libGU6cmluZy1yaW5nIGZvY3VzLXZpc2libGU6cm91bmRlZC1mdWxsIGN1cnNvci1pbnRlcmFjdGlvblwiO1xuICAgIHBpbGwuY2xhc3NOYW1lID0gYHJlbGF0aXZlIGlubGluZS1mbGV4IHNocmluay0wIGl0ZW1zLWNlbnRlciByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1jb2xvcnMgZHVyYXRpb24tMjAwIGVhc2Utb3V0IGgtNSB3LTggJHtcbiAgICAgIG9uID8gXCJiZy1jaGFydC1ibHVlIGJnLXRva2VuLWNoYXJ0cy1ibHVlXCIgOiBcImJnLXRleHQvMTAgYmctdG9rZW4tZm9yZWdyb3VuZC8yMFwiXG4gICAgfWA7XG4gICAgcGlsbC5kYXRhc2V0LnN0YXRlID0gb24gPyBcImNoZWNrZWRcIiA6IFwidW5jaGVja2VkXCI7XG4gICAga25vYi5kYXRhc2V0LnN0YXRlID0gb24gPyBcImNoZWNrZWRcIiA6IFwidW5jaGVja2VkXCI7XG4gICAga25vYi5zdHlsZS50cmFuc2Zvcm0gPSBvbiA/IFwidHJhbnNsYXRlWCgxNHB4KVwiIDogXCJ0cmFuc2xhdGVYKDJweClcIjtcbiAgfTtcbiAgYXBwbHkoaW5pdGlhbCk7XG5cbiAgYnRuLmFwcGVuZENoaWxkKHBpbGwpO1xuICBidG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jIChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgY29uc3QgbmV4dCA9IGJ0bi5nZXRBdHRyaWJ1dGUoXCJhcmlhLWNoZWNrZWRcIikgIT09IFwidHJ1ZVwiO1xuICAgIGFwcGx5KG5leHQpO1xuICAgIGJ0bi5kaXNhYmxlZCA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IG9uQ2hhbmdlKG5leHQpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBidG4uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gYnRuO1xufVxuXG5mdW5jdGlvbiBkb3QoKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gIHMuY2xhc3NOYW1lID0gXCJ0ZXh0LXRva2VuLWRlc2NyaXB0aW9uLWZvcmVncm91bmRcIjtcbiAgcy50ZXh0Q29udGVudCA9IFwiXHUwMEI3XCI7XG4gIHJldHVybiBzO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlSWNvblVybChcbiAgdXJsOiBzdHJpbmcsXG4gIHR3ZWFrRGlyOiBzdHJpbmcsXG4pOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgaWYgKC9eKGh0dHBzPzp8ZGF0YTopLy50ZXN0KHVybCkpIHJldHVybiB1cmw7XG4gIC8vIFJlbGF0aXZlIHBhdGggXHUyMTkyIGFzayBtYWluIHRvIHJlYWQgdGhlIGZpbGUgYW5kIHJldHVybiBhIGRhdGE6IFVSTC5cbiAgLy8gUmVuZGVyZXIgaXMgc2FuZGJveGVkIHNvIGZpbGU6Ly8gd29uJ3QgbG9hZCBkaXJlY3RseS5cbiAgY29uc3QgcmVsID0gdXJsLnN0YXJ0c1dpdGgoXCIuL1wiKSA/IHVybC5zbGljZSgyKSA6IHVybDtcbiAgdHJ5IHtcbiAgICByZXR1cm4gKGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgIFwiY29kZXhwcDpyZWFkLXR3ZWFrLWFzc2V0XCIsXG4gICAgICB0d2Vha0RpcixcbiAgICAgIHJlbCxcbiAgICApKSBhcyBzdHJpbmc7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBwbG9nKFwiaWNvbiBsb2FkIGZhaWxlZFwiLCB7IHVybCwgdHdlYWtEaXIsIGVycjogU3RyaW5nKGUpIH0pO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBET00gaGV1cmlzdGljcyBcdTI1MDBcdTI1MDBcblxuZnVuY3Rpb24gZmluZFNpZGViYXJJdGVtc0dyb3VwKCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IGNhY2hlZCA9IGNhY2hlZFNpZGViYXJJdGVtc0dyb3VwKCk7XG4gIGlmIChjYWNoZWQpIHJldHVybiBjYWNoZWQ7XG5cbiAgY29uc3QgY2FuZGlkYXRlcyA9IEFycmF5LmZyb20oXG4gICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCJhc2lkZSxuYXYsW3JvbGU9J25hdmlnYXRpb24nXSxkaXZcIiksXG4gICk7XG5cbiAgbGV0IGJlc3Q6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIGxldCBiZXN0U2NvcmUgPSAtMTtcbiAgbGV0IGJlc3RBcmVhID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuXG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICBpZiAoY2FuZGlkYXRlLmRhdGFzZXQuY29kZXhwcCkgY29udGludWU7XG4gICAgaWYgKCFpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShjYW5kaWRhdGUpKSBjb250aW51ZTtcblxuICAgIGNvbnN0IGxhYmVscyA9IGNvZGV4UHBTZXR0aW5nc0xhYmVsc0Zyb20oY2FuZGlkYXRlKTtcbiAgICBjb25zdCBzY29yZSA9IGNvZGV4UHBTZXR0aW5nc0xhYmVsU2NvcmUobGFiZWxzKTtcbiAgICBjb25zdCByZWN0ID0gY2FuZGlkYXRlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IGFyZWEgPSByZWN0LndpZHRoICogcmVjdC5oZWlnaHQ7XG4gICAgY29uc3Qgd2VpZ2h0ZWQgPSBzY29yZS5jb3JlICogMTAwICsgc2NvcmUudG90YWw7XG5cbiAgICBpZiAod2VpZ2h0ZWQgPiBiZXN0U2NvcmUgfHwgKHdlaWdodGVkID09PSBiZXN0U2NvcmUgJiYgYXJlYSA8IGJlc3RBcmVhKSkge1xuICAgICAgYmVzdCA9IGNhbmRpZGF0ZTtcbiAgICAgIGJlc3RTY29yZSA9IHdlaWdodGVkO1xuICAgICAgYmVzdEFyZWEgPSBhcmVhO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBiZXN0O1xufVxuXG5mdW5jdGlvbiBjYWNoZWRTaWRlYmFySXRlbXNHcm91cCgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgIHN0YXRlLnNpZGViYXJSb290LFxuICAgIHN0YXRlLm5hdkdyb3VwPy5wYXJlbnRFbGVtZW50ID8/IG51bGwsXG4gICAgc3RhdGUucGFnZXNHcm91cD8ucGFyZW50RWxlbWVudCA/PyBudWxsLFxuICBdO1xuXG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICBpZiAoIWNhbmRpZGF0ZSkgY29udGludWU7XG4gICAgaWYgKCFjYW5kaWRhdGUuaXNDb25uZWN0ZWQpIGNvbnRpbnVlO1xuICAgIGlmIChpc1NldHRpbmdzU2lkZWJhckNhbmRpZGF0ZShjYW5kaWRhdGUpKSByZXR1cm4gY2FuZGlkYXRlO1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZU1pc3BsYWNlZFNldHRpbmdzR3JvdXBzKCk6IHZvaWQge1xuICBjb25zdCBncm91cHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICBcIltkYXRhLWNvZGV4cHA9J25hdi1ncm91cCddLCBbZGF0YS1jb2RleHBwPSdwYWdlcy1ncm91cCddLCBbZGF0YS1jb2RleHBwPSduYXRpdmUtbmF2LWhlYWRlciddXCIsXG4gICk7XG4gIGZvciAoY29uc3QgZ3JvdXAgb2YgQXJyYXkuZnJvbShncm91cHMpKSB7XG4gICAgaWYgKGlzQ29kZXhQcEluamVjdGVkU2V0dGluZ3NHcm91cFBsYWNlbWVudFZhbGlkKGdyb3VwKSkgY29udGludWU7XG4gICAgcmVzZXRDb2RleFBwSW5qZWN0ZWRTZXR0aW5nc0dyb3VwU3RhdGUoZ3JvdXApO1xuICAgIGdyb3VwLnJlbW92ZSgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQ29kZXhQcEluamVjdGVkU2V0dGluZ3NHcm91cFBsYWNlbWVudFZhbGlkKGdyb3VwOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICBpZiAoaXNGb3JiaWRkZW5TZXR0aW5nc1NpZGViYXJTdXJmYWNlKGdyb3VwKSkgcmV0dXJuIGZhbHNlO1xuXG4gIGxldCBub2RlID0gZ3JvdXAucGFyZW50RWxlbWVudDtcbiAgZm9yIChsZXQgZGVwdGggPSAwOyBub2RlICYmIGRlcHRoIDwgNDsgZGVwdGgrKykge1xuICAgIGlmIChpc0ZvcmJpZGRlblNldHRpbmdzU2lkZWJhclN1cmZhY2Uobm9kZSkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUobm9kZSkpIHJldHVybiB0cnVlO1xuICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlc2V0Q29kZXhQcEluamVjdGVkU2V0dGluZ3NHcm91cFN0YXRlKGdyb3VwOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBpZiAoc3RhdGUubmF2R3JvdXAgPT09IGdyb3VwIHx8IChzdGF0ZS5uYXZHcm91cCAmJiBncm91cC5jb250YWlucyhzdGF0ZS5uYXZHcm91cCkpKSB7XG4gICAgc3RhdGUubmF2R3JvdXAgPSBudWxsO1xuICAgIHN0YXRlLm5hdkJ1dHRvbnMgPSBudWxsO1xuICAgIHN0YXRlLmNvZGV4UGx1c1BsdXNVcGRhdGVCdXR0b24gPSBudWxsO1xuICB9XG4gIGlmIChzdGF0ZS5wYWdlc0dyb3VwID09PSBncm91cCB8fCAoc3RhdGUucGFnZXNHcm91cCAmJiBncm91cC5jb250YWlucyhzdGF0ZS5wYWdlc0dyb3VwKSkpIHtcbiAgICBzdGF0ZS5wYWdlc0dyb3VwID0gbnVsbDtcbiAgICBzdGF0ZS5wYWdlc0dyb3VwS2V5ID0gbnVsbDtcbiAgICBmb3IgKGNvbnN0IHAgb2Ygc3RhdGUucGFnZXMudmFsdWVzKCkpIHAubmF2QnV0dG9uID0gbnVsbDtcbiAgfVxuICBpZiAoc3RhdGUubmF0aXZlTmF2SGVhZGVyID09PSBncm91cCB8fCAoc3RhdGUubmF0aXZlTmF2SGVhZGVyICYmIGdyb3VwLmNvbnRhaW5zKHN0YXRlLm5hdGl2ZU5hdkhlYWRlcikpKSB7XG4gICAgc3RhdGUubmF0aXZlTmF2SGVhZGVyID0gbnVsbDtcbiAgfVxuICBpZiAoc3RhdGUuc2lkZWJhclJvb3QgJiYgc3RhdGUuc2lkZWJhclJvb3QuY29udGFpbnMoZ3JvdXApKSB7XG4gICAgc3RhdGUuc2lkZWJhclJvb3QgPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmRDb250ZW50QXJlYSgpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBjb25zdCBzaWRlYmFyID0gZmluZFNpZGViYXJJdGVtc0dyb3VwKCk7XG4gIGlmICghc2lkZWJhcikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHdvcmtzcGFjZVJvdyA9IHNpZGViYXIuY2xvc2VzdDxIVE1MRWxlbWVudD4oJ1tkYXRhLWFwcC1zaGVsbC13b3Jrc3BhY2Utcm93XScpO1xuICBpZiAod29ya3NwYWNlUm93KSB7XG4gICAgY29uc3Qgc3VyZmFjZXMgPSBBcnJheS5mcm9tKFxuICAgICAgd29ya3NwYWNlUm93LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KCdbZGF0YS1hcHAtc2hlbGwtbWFpbi1zdXJmYWNlPVwiZGVmYXVsdFwiXScpLFxuICAgICkuZmlsdGVyKChzdXJmYWNlKSA9PlxuICAgICAgc3VyZmFjZS5jbG9zZXN0KCdbZGF0YS1hcHAtc2hlbGwtd29ya3NwYWNlLXJvd10nKSA9PT0gd29ya3NwYWNlUm93ICYmXG4gICAgICAhc3VyZmFjZS5jb250YWlucyhzaWRlYmFyKSAmJiAhc2lkZWJhci5jb250YWlucyhzdXJmYWNlKSk7XG4gICAgY29uc3QgYXJlYXMgPSBzdXJmYWNlcy5mbGF0TWFwKChzdXJmYWNlKSA9PlxuICAgICAgQXJyYXkuZnJvbShzdXJmYWNlLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KCdbZGF0YS1hcHAtc2hlbGwtZm9jdXMtYXJlYT1cIm1haW5cIl0nKSlcbiAgICAgICAgLmZpbHRlcigoYXJlYSkgPT4gYXJlYS5jbG9zZXN0KCdbZGF0YS1hcHAtc2hlbGwtbWFpbi1zdXJmYWNlPVwiZGVmYXVsdFwiXScpID09PSBzdXJmYWNlKVxuICAgICAgICAuZmlsdGVyKChhcmVhKSA9PiBpc1Zpc2libGVTZXR0aW5nc0NvbnRlbnQoYXJlYSwgd29ya3NwYWNlUm93KSkpO1xuICAgIGlmIChhcmVhcy5sZW5ndGggPT09IDEpIHJldHVybiBhcmVhc1swXTtcbiAgICBwbG9nKFwiY29udGVudCBhcmVhIHJlamVjdGVkXCIsIHtcbiAgICAgIHJlYXNvbjogYXJlYXMubGVuZ3RoID09PSAwID8gXCJubyB2aXNpYmxlIG5hdGl2ZSBtYWluIGluIHNldHRpbmdzIHJvd1wiIDogXCJhbWJpZ3VvdXMgbmF0aXZlIG1haW4gaW4gc2V0dGluZ3Mgcm93XCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBuYXZSb290ID0gc2lkZWJhci5jbG9zZXN0PEhUTUxFbGVtZW50PignbmF2LCBhc2lkZSwgW3JvbGU9XCJuYXZpZ2F0aW9uXCJdLCAub3ZlcmZsb3cteS1hdXRvJyk7XG4gIGNvbnN0IGxlZ2FjeVJvdyA9IG5hdlJvb3Q/LnBhcmVudEVsZW1lbnQ7XG4gIGlmICghbmF2Um9vdCB8fCAhaXNTZXR0aW5nc1NpZGViYXJDYW5kaWRhdGUobmF2Um9vdCkgfHwgIWxlZ2FjeVJvdyB8fCBsZWdhY3lSb3cgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICBwbG9nKFwiY29udGVudCBhcmVhIHJlamVjdGVkXCIsIHsgcmVhc29uOiBcIm5vIGlkZW50aWZpYWJsZSBsZWdhY3kgc2V0dGluZ3Mgcm93XCIgfSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgY2FuZGlkYXRlcyA9IEFycmF5LmZyb20obGVnYWN5Um93LmNoaWxkcmVuKVxuICAgIC5maWx0ZXIoKGNoaWxkKTogY2hpbGQgaXMgSFRNTEVsZW1lbnQgPT4gY2hpbGQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCAmJiAhY2hpbGQuY29udGFpbnMobmF2Um9vdCkpXG4gICAgLmZpbHRlcigoY2hpbGQpID0+IHtcbiAgICAgIGNvbnN0IHJlY3QgPSBjaGlsZC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHJldHVybiByZWN0LndpZHRoID4gMzAwICYmIHJlY3QuaGVpZ2h0ID4gMjAwO1xuICAgIH0pXG4gICAgLmZpbHRlcigoY2hpbGQpID0+IGlzVmlzaWJsZVNldHRpbmdzQ29udGVudChjaGlsZCwgbGVnYWN5Um93KSlcbiAgICAuZmlsdGVyKChjaGlsZCkgPT4gZ2V0Q29tcHV0ZWRTdHlsZShjaGlsZCkucG9zaXRpb24gIT09IFwiYWJzb2x1dGVcIik7XG4gIGlmIChjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMSkgcmV0dXJuIGNhbmRpZGF0ZXNbMF07XG4gIHBsb2coXCJjb250ZW50IGFyZWEgcmVqZWN0ZWRcIiwge1xuICAgIHJlYXNvbjogY2FuZGlkYXRlcy5sZW5ndGggPyBcImFtYmlndW91cyBsZWdhY3kgc2libGluZ3NcIiA6IFwibm8gdmlzaWJsZSBsZWdhY3kgY29udGVudFwiLFxuICB9KTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGlzVmlzaWJsZVNldHRpbmdzQ29udGVudChub2RlOiBIVE1MRWxlbWVudCwgYm91bmRhcnk6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIGlmICghbm9kZS5pc0Nvbm5lY3RlZCkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGxldCBjdXJyZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBub2RlOyBjdXJyZW50OyBjdXJyZW50ID0gY3VycmVudC5wYXJlbnRFbGVtZW50KSB7XG4gICAgaWYgKGN1cnJlbnQuaGlkZGVuIHx8IGN1cnJlbnQuaGFzQXR0cmlidXRlKFwiaW5lcnRcIikgfHwgY3VycmVudC5nZXRBdHRyaWJ1dGUoXCJhcmlhLWhpZGRlblwiKSA9PT0gXCJ0cnVlXCIpIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoY3VycmVudCk7XG4gICAgaWYgKHN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiIHx8IHN0eWxlLnZpc2liaWxpdHkgPT09IFwiaGlkZGVuXCIgfHwgc3R5bGUudmlzaWJpbGl0eSA9PT0gXCJjb2xsYXBzZVwiKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnQgPT09IGJvdW5kYXJ5KSBicmVhaztcbiAgfVxuICBjb25zdCByZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHJlY3Qud2lkdGggPiAwICYmIHJlY3QuaGVpZ2h0ID4gMDtcbn1cblxuZnVuY3Rpb24gbWF5YmVEdW1wRG9tKCk6IHZvaWQge1xuICB0cnkge1xuICAgIGNvbnN0IHNpZGViYXIgPSBmaW5kU2lkZWJhckl0ZW1zR3JvdXAoKTtcbiAgICBpZiAoc2lkZWJhciAmJiAhc3RhdGUuc2lkZWJhckR1bXBlZCkge1xuICAgICAgc3RhdGUuc2lkZWJhckR1bXBlZCA9IHRydWU7XG4gICAgICBpZiAoaXNTZXR0aW5nc0RvbUR1bXBFbmFibGVkKCkpIHtcbiAgICAgICAgY29uc3Qgc2JSb290ID0gc2lkZWJhci5wYXJlbnRFbGVtZW50ID8/IHNpZGViYXI7XG4gICAgICAgIHBsb2coYGNvZGV4IHNpZGViYXIgSFRNTGAsIHNiUm9vdC5vdXRlckhUTUwuc2xpY2UoMCwgMzIwMDApKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgY29udGVudCA9IGZpbmRDb250ZW50QXJlYSgpO1xuICAgIGlmICghY29udGVudCkge1xuICAgICAgaWYgKHN0YXRlLmZpbmdlcnByaW50ICE9PSBsb2NhdGlvbi5ocmVmKSB7XG4gICAgICAgIHN0YXRlLmZpbmdlcnByaW50ID0gbG9jYXRpb24uaHJlZjtcbiAgICAgICAgcGxvZyhcImRvbSBwcm9iZSAobm8gY29udGVudClcIiwge1xuICAgICAgICAgIHVybDogbG9jYXRpb24uaHJlZixcbiAgICAgICAgICBzaWRlYmFyOiBzaWRlYmFyID8gZGVzY3JpYmUoc2lkZWJhcikgOiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IHBhbmVsOiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAgIGZvciAoY29uc3QgY2hpbGQgb2YgQXJyYXkuZnJvbShjb250ZW50LmNoaWxkcmVuKSBhcyBIVE1MRWxlbWVudFtdKSB7XG4gICAgICBpZiAoY2hpbGQuZGF0YXNldC5jb2RleHBwID09PSBcInR3ZWFrcy1wYW5lbFwiKSBjb250aW51ZTtcbiAgICAgIGlmIChjaGlsZC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikgY29udGludWU7XG4gICAgICBwYW5lbCA9IGNoaWxkO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGFjdGl2ZU5hdiA9IHNpZGViYXJcbiAgICAgID8gQXJyYXkuZnJvbShzaWRlYmFyLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiYnV0dG9uLCBhXCIpKS5maW5kKFxuICAgICAgICAgIChiKSA9PlxuICAgICAgICAgICAgYi5nZXRBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIikgPT09IFwicGFnZVwiIHx8XG4gICAgICAgICAgICBiLmdldEF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIpID09PSBcInRydWVcIiB8fFxuICAgICAgICAgICAgYi5nZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpID09PSBcInRydWVcIiB8fFxuICAgICAgICAgICAgYi5jbGFzc0xpc3QuY29udGFpbnMoXCJhY3RpdmVcIiksXG4gICAgICAgIClcbiAgICAgIDogbnVsbDtcbiAgICBjb25zdCBoZWFkaW5nID0gcGFuZWw/LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgXCJoMSwgaDIsIGgzLCBbY2xhc3MqPSdoZWFkaW5nJ11cIixcbiAgICApO1xuICAgIGNvbnN0IGZpbmdlcnByaW50ID0gYCR7YWN0aXZlTmF2Py50ZXh0Q29udGVudCA/PyBcIlwifXwke2hlYWRpbmc/LnRleHRDb250ZW50ID8/IFwiXCJ9fCR7cGFuZWw/LmNoaWxkcmVuLmxlbmd0aCA/PyAwfWA7XG4gICAgaWYgKHN0YXRlLmZpbmdlcnByaW50ID09PSBmaW5nZXJwcmludCkgcmV0dXJuO1xuICAgIHN0YXRlLmZpbmdlcnByaW50ID0gZmluZ2VycHJpbnQ7XG4gICAgcGxvZyhcImRvbSBwcm9iZVwiLCB7XG4gICAgICB1cmw6IGxvY2F0aW9uLmhyZWYsXG4gICAgICBhY3RpdmVOYXY6IGFjdGl2ZU5hdj8udGV4dENvbnRlbnQ/LnRyaW0oKSA/PyBudWxsLFxuICAgICAgaGVhZGluZzogaGVhZGluZz8udGV4dENvbnRlbnQ/LnRyaW0oKSA/PyBudWxsLFxuICAgICAgY29udGVudDogZGVzY3JpYmUoY29udGVudCksXG4gICAgfSk7XG4gICAgaWYgKHBhbmVsICYmIGlzU2V0dGluZ3NEb21EdW1wRW5hYmxlZCgpKSB7XG4gICAgICBjb25zdCBodG1sID0gcGFuZWwub3V0ZXJIVE1MO1xuICAgICAgcGxvZyhcbiAgICAgICAgYGNvZGV4IHBhbmVsIEhUTUwgKCR7YWN0aXZlTmF2Py50ZXh0Q29udGVudD8udHJpbSgpID8/IFwiP1wifSlgLFxuICAgICAgICBodG1sLnNsaWNlKDAsIDMyMDAwKSxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgcGxvZyhcImRvbSBwcm9iZSBmYWlsZWRcIiwgU3RyaW5nKGUpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1NldHRpbmdzRG9tRHVtcEVuYWJsZWQoKTogYm9vbGVhbiB7XG4gIHJldHVybiAod2luZG93IGFzIFdpbmRvdyAmIHsgX19jb2RleHBwRHVtcFNldHRpbmdzRG9tPzogYm9vbGVhbiB9KS5fX2NvZGV4cHBEdW1wU2V0dGluZ3NEb20gPT09IHRydWU7XG59XG5cbmZ1bmN0aW9uIGRlc2NyaWJlKGVsOiBIVE1MRWxlbWVudCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgcmV0dXJuIHtcbiAgICB0YWc6IGVsLnRhZ05hbWUsXG4gICAgY2xzOiBlbC5jbGFzc05hbWUuc2xpY2UoMCwgMTIwKSxcbiAgICBpZDogZWwuaWQgfHwgdW5kZWZpbmVkLFxuICAgIGNoaWxkcmVuOiBlbC5jaGlsZHJlbi5sZW5ndGgsXG4gICAgcmVjdDogKCgpID0+IHtcbiAgICAgIGNvbnN0IHIgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIHJldHVybiB7IHc6IE1hdGgucm91bmQoci53aWR0aCksIGg6IE1hdGgucm91bmQoci5oZWlnaHQpIH07XG4gICAgfSkoKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gdHdlYWtzUGF0aCgpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgICh3aW5kb3cgYXMgdW5rbm93biBhcyB7IF9fY29kZXhwcF90d2Vha3NfZGlyX18/OiBzdHJpbmcgfSkuX19jb2RleHBwX3R3ZWFrc19kaXJfXyA/P1xuICAgIFwiPHVzZXIgZGlyPi90d2Vha3NcIlxuICApO1xufVxuIiwgImltcG9ydCB0eXBlIHsgVHdlYWtNYW5pZmVzdCB9IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RXRUFLX1NUT1JFX0lOREVYX1VSTCA9XG4gIFwiaHR0cHM6Ly9rcGtoeGxneTAuZ2l0aHViLmlvL2NvZGV4LXBsdXNwbHVzL3N0b3JlL2luZGV4Lmpzb25cIjtcbmV4cG9ydCBjb25zdCBUV0VBS19TVE9SRV9SRVZJRVdfSVNTVUVfVVJMID1cbiAgXCJodHRwczovL2dpdGh1Yi5jb20va3BraHhsZ3kwL2NvZGV4LXBsdXNwbHVzL2lzc3Vlcy9uZXdcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlUmVnaXN0cnkge1xuICBzY2hlbWFWZXJzaW9uOiAxO1xuICBnZW5lcmF0ZWRBdD86IHN0cmluZztcbiAgZW50cmllczogVHdlYWtTdG9yZUVudHJ5W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHdlYWtTdG9yZUVudHJ5IHtcbiAgaWQ6IHN0cmluZztcbiAgbWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3Q7XG4gIHJlcG86IHN0cmluZztcbiAgYXBwcm92ZWRDb21taXRTaGE6IHN0cmluZztcbiAgYXBwcm92ZWRBdDogc3RyaW5nO1xuICBhcHByb3ZlZEJ5OiBzdHJpbmc7XG4gIHBsYXRmb3Jtcz86IFR3ZWFrU3RvcmVQbGF0Zm9ybVtdO1xuICByZWxlYXNlVXJsPzogc3RyaW5nO1xuICByZXZpZXdVcmw/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFR3ZWFrU3RvcmVQbGF0Zm9ybSA9IFwiZGFyd2luXCIgfCBcIndpbjMyXCIgfCBcImxpbnV4XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHdlYWtTdG9yZVB1Ymxpc2hTdWJtaXNzaW9uIHtcbiAgcmVwbzogc3RyaW5nO1xuICBkZWZhdWx0QnJhbmNoOiBzdHJpbmc7XG4gIGNvbW1pdFNoYTogc3RyaW5nO1xuICBjb21taXRVcmw6IHN0cmluZztcbiAgbWFuaWZlc3Q/OiB7XG4gICAgaWQ/OiBzdHJpbmc7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICB2ZXJzaW9uPzogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIGljb25Vcmw/OiBzdHJpbmc7XG4gIH07XG59XG5cbmNvbnN0IEdJVEhVQl9SRVBPX1JFID0gL15bQS1aYS16MC05Xy4tXStcXC9bQS1aYS16MC05Xy4tXSskLztcbmNvbnN0IEZVTExfU0hBX1JFID0gL15bYS1mMC05XXs0MH0kL2k7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHaXRIdWJSZXBvKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByYXcgPSBpbnB1dC50cmltKCk7XG4gIGlmICghcmF3KSB0aHJvdyBuZXcgRXJyb3IoXCJHaXRIdWIgcmVwbyBpcyByZXF1aXJlZFwiKTtcblxuICBjb25zdCBzc2ggPSAvXmdpdEBnaXRodWJcXC5jb206KFteL10rXFwvW14vXSs/KSg/OlxcLmdpdCk/JC9pLmV4ZWMocmF3KTtcbiAgaWYgKHNzaCkgcmV0dXJuIG5vcm1hbGl6ZVJlcG9QYXJ0KHNzaFsxXSk7XG5cbiAgaWYgKC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QocmF3KSkge1xuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmF3KTtcbiAgICBpZiAodXJsLmhvc3RuYW1lICE9PSBcImdpdGh1Yi5jb21cIikgdGhyb3cgbmV3IEVycm9yKFwiT25seSBnaXRodWIuY29tIHJlcG9zaXRvcmllcyBhcmUgc3VwcG9ydGVkXCIpO1xuICAgIGNvbnN0IHBhcnRzID0gdXJsLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpLnNwbGl0KFwiL1wiKTtcbiAgICBpZiAocGFydHMubGVuZ3RoIDwgMikgdGhyb3cgbmV3IEVycm9yKFwiR2l0SHViIHJlcG8gVVJMIG11c3QgaW5jbHVkZSBvd25lciBhbmQgcmVwb3NpdG9yeVwiKTtcbiAgICByZXR1cm4gbm9ybWFsaXplUmVwb1BhcnQoYCR7cGFydHNbMF19LyR7cGFydHNbMV19YCk7XG4gIH1cblxuICByZXR1cm4gbm9ybWFsaXplUmVwb1BhcnQocmF3KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0b3JlUmVnaXN0cnkoaW5wdXQ6IHVua25vd24pOiBUd2Vha1N0b3JlUmVnaXN0cnkge1xuICBjb25zdCByZWdpc3RyeSA9IGlucHV0IGFzIFBhcnRpYWw8VHdlYWtTdG9yZVJlZ2lzdHJ5PiB8IG51bGw7XG4gIGlmICghcmVnaXN0cnkgfHwgcmVnaXN0cnkuc2NoZW1hVmVyc2lvbiAhPT0gMSB8fCAhQXJyYXkuaXNBcnJheShyZWdpc3RyeS5lbnRyaWVzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIHR3ZWFrIHN0b3JlIHJlZ2lzdHJ5XCIpO1xuICB9XG4gIGNvbnN0IGVudHJpZXMgPSByZWdpc3RyeS5lbnRyaWVzLm1hcChub3JtYWxpemVTdG9yZUVudHJ5KTtcbiAgZW50cmllcy5zb3J0KChhLCBiKSA9PiBhLm1hbmlmZXN0Lm5hbWUubG9jYWxlQ29tcGFyZShiLm1hbmlmZXN0Lm5hbWUpKTtcbiAgcmV0dXJuIHtcbiAgICBzY2hlbWFWZXJzaW9uOiAxLFxuICAgIGdlbmVyYXRlZEF0OiB0eXBlb2YgcmVnaXN0cnkuZ2VuZXJhdGVkQXQgPT09IFwic3RyaW5nXCIgPyByZWdpc3RyeS5nZW5lcmF0ZWRBdCA6IHVuZGVmaW5lZCxcbiAgICBlbnRyaWVzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2h1ZmZsZVN0b3JlRW50cmllczxUPihcbiAgZW50cmllczogcmVhZG9ubHkgVFtdLFxuICByYW5kb21JbmRleDogKGV4Y2x1c2l2ZU1heDogbnVtYmVyKSA9PiBudW1iZXIgPSAoZXhjbHVzaXZlTWF4KSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBleGNsdXNpdmVNYXgpLFxuKTogVFtdIHtcbiAgY29uc3Qgc2h1ZmZsZWQgPSBbLi4uZW50cmllc107XG4gIGZvciAobGV0IGkgPSBzaHVmZmxlZC5sZW5ndGggLSAxOyBpID4gMDsgaSAtPSAxKSB7XG4gICAgY29uc3QgaiA9IHJhbmRvbUluZGV4KGkgKyAxKTtcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoaikgfHwgaiA8IDAgfHwgaiA+IGkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgc2h1ZmZsZSByYW5kb21JbmRleCByZXR1cm5lZCAke2p9OyBleHBlY3RlZCBhbiBpbnRlZ2VyIGZyb20gMCB0byAke2l9YCk7XG4gICAgfVxuICAgIFtzaHVmZmxlZFtpXSwgc2h1ZmZsZWRbal1dID0gW3NodWZmbGVkW2pdLCBzaHVmZmxlZFtpXV07XG4gIH1cbiAgcmV0dXJuIHNodWZmbGVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3RvcmVFbnRyeShpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVFbnRyeSB7XG4gIGNvbnN0IGVudHJ5ID0gaW5wdXQgYXMgUGFydGlhbDxUd2Vha1N0b3JlRW50cnk+IHwgbnVsbDtcbiAgaWYgKCFlbnRyeSB8fCB0eXBlb2YgZW50cnkgIT09IFwib2JqZWN0XCIpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdHdlYWsgc3RvcmUgZW50cnlcIik7XG4gIGNvbnN0IHJlcG8gPSBub3JtYWxpemVHaXRIdWJSZXBvKFN0cmluZyhlbnRyeS5yZXBvID8/IGVudHJ5Lm1hbmlmZXN0Py5naXRodWJSZXBvID8/IFwiXCIpKTtcbiAgY29uc3QgbWFuaWZlc3QgPSBlbnRyeS5tYW5pZmVzdCBhcyBUd2Vha01hbmlmZXN0IHwgdW5kZWZpbmVkO1xuICBpZiAoIW1hbmlmZXN0Py5pZCB8fCAhbWFuaWZlc3QubmFtZSB8fCAhbWFuaWZlc3QudmVyc2lvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgZm9yICR7cmVwb30gaXMgbWlzc2luZyBtYW5pZmVzdCBmaWVsZHNgKTtcbiAgfVxuICBpZiAobm9ybWFsaXplR2l0SHViUmVwbyhtYW5pZmVzdC5naXRodWJSZXBvKSAhPT0gcmVwbykge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgJHttYW5pZmVzdC5pZH0gcmVwbyBkb2VzIG5vdCBtYXRjaCBtYW5pZmVzdCBnaXRodWJSZXBvYCk7XG4gIH1cbiAgaWYgKCFpc0Z1bGxDb21taXRTaGEoU3RyaW5nKGVudHJ5LmFwcHJvdmVkQ29tbWl0U2hhID8/IFwiXCIpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgJHttYW5pZmVzdC5pZH0gbXVzdCBwaW4gYSBmdWxsIGFwcHJvdmVkIGNvbW1pdCBTSEFgKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiBtYW5pZmVzdC5pZCxcbiAgICBtYW5pZmVzdCxcbiAgICByZXBvLFxuICAgIGFwcHJvdmVkQ29tbWl0U2hhOiBTdHJpbmcoZW50cnkuYXBwcm92ZWRDb21taXRTaGEpLFxuICAgIGFwcHJvdmVkQXQ6IHR5cGVvZiBlbnRyeS5hcHByb3ZlZEF0ID09PSBcInN0cmluZ1wiID8gZW50cnkuYXBwcm92ZWRBdCA6IFwiXCIsXG4gICAgYXBwcm92ZWRCeTogdHlwZW9mIGVudHJ5LmFwcHJvdmVkQnkgPT09IFwic3RyaW5nXCIgPyBlbnRyeS5hcHByb3ZlZEJ5IDogXCJcIixcbiAgICBwbGF0Zm9ybXM6IG5vcm1hbGl6ZVN0b3JlUGxhdGZvcm1zKChlbnRyeSBhcyB7IHBsYXRmb3Jtcz86IHVua25vd24gfSkucGxhdGZvcm1zKSxcbiAgICByZWxlYXNlVXJsOiBvcHRpb25hbEdpdGh1YlVybChlbnRyeS5yZWxlYXNlVXJsKSxcbiAgICByZXZpZXdVcmw6IG9wdGlvbmFsR2l0aHViVXJsKGVudHJ5LnJldmlld1VybCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUFyY2hpdmVVcmwoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSk6IHN0cmluZyB7XG4gIGlmICghaXNGdWxsQ29tbWl0U2hhKGVudHJ5LmFwcHJvdmVkQ29tbWl0U2hhKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgJHtlbnRyeS5pZH0gaXMgbm90IHBpbm5lZCB0byBhIGZ1bGwgY29tbWl0IFNIQWApO1xuICB9XG4gIHJldHVybiBgaHR0cHM6Ly9jb2RlbG9hZC5naXRodWIuY29tLyR7ZW50cnkucmVwb30vdGFyLmd6LyR7ZW50cnkuYXBwcm92ZWRDb21taXRTaGF9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVHdlYWtQdWJsaXNoSXNzdWVVcmwoc3VibWlzc2lvbjogVHdlYWtTdG9yZVB1Ymxpc2hTdWJtaXNzaW9uKTogc3RyaW5nIHtcbiAgY29uc3QgcmVwbyA9IG5vcm1hbGl6ZUdpdEh1YlJlcG8oc3VibWlzc2lvbi5yZXBvKTtcbiAgaWYgKCFpc0Z1bGxDb21taXRTaGEoc3VibWlzc2lvbi5jb21taXRTaGEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiU3VibWlzc2lvbiBtdXN0IGluY2x1ZGUgdGhlIGZ1bGwgY29tbWl0IFNIQSB0byByZXZpZXdcIik7XG4gIH1cbiAgY29uc3QgdGl0bGUgPSBgVHdlYWsgc3RvcmUgcmV2aWV3OiAke3JlcG99YDtcbiAgY29uc3QgYm9keSA9IFtcbiAgICBcIiMjIFR3ZWFrIHJlcG9cIixcbiAgICBgaHR0cHM6Ly9naXRodWIuY29tLyR7cmVwb31gLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb21taXQgdG8gcmV2aWV3XCIsXG4gICAgc3VibWlzc2lvbi5jb21taXRTaGEsXG4gICAgc3VibWlzc2lvbi5jb21taXRVcmwsXG4gICAgXCJcIixcbiAgICBcIkRvIG5vdCBhcHByb3ZlIGEgZGlmZmVyZW50IGNvbW1pdC4gSWYgdGhlIGF1dGhvciBwdXNoZXMgY2hhbmdlcywgYXNrIHRoZW0gdG8gcmVzdWJtaXQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE1hbmlmZXN0XCIsXG4gICAgYC0gaWQ6ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8uaWQgPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgYC0gbmFtZTogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5uYW1lID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIHZlcnNpb246ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8udmVyc2lvbiA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSBkZXNjcmlwdGlvbjogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5kZXNjcmlwdGlvbiA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSBpY29uVXJsOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/Lmljb25VcmwgPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgXCJcIixcbiAgICBcIiMjIEFkbWluIGNoZWNrbGlzdFwiLFxuICAgIFwiLSBbIF0gbWFuaWZlc3QuanNvbiBpcyB2YWxpZFwiLFxuICAgIFwiLSBbIF0gbWFuaWZlc3QuaWNvblVybCBpcyB1c2FibGUgYXMgdGhlIHN0b3JlIGljb25cIixcbiAgICBcIi0gWyBdIHNvdXJjZSB3YXMgcmV2aWV3ZWQgYXQgdGhlIGV4YWN0IGNvbW1pdCBhYm92ZVwiLFxuICAgIFwiLSBbIF0gYHN0b3JlL2luZGV4Lmpzb25gIGVudHJ5IHBpbnMgYGFwcHJvdmVkQ29tbWl0U2hhYCB0byB0aGUgZXhhY3QgY29tbWl0IGFib3ZlXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChUV0VBS19TVE9SRV9SRVZJRVdfSVNTVUVfVVJMKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJ0ZW1wbGF0ZVwiLCBcInR3ZWFrLXN0b3JlLXJldmlldy5tZFwiKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJ0aXRsZVwiLCB0aXRsZSk7XG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KFwiYm9keVwiLCBib2R5KTtcbiAgcmV0dXJuIHVybC50b1N0cmluZygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGdWxsQ29tbWl0U2hhKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIEZVTExfU0hBX1JFLnRlc3QodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZXBvUGFydCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcmVwbyA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9cXC5naXQkL2ksIFwiXCIpLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpO1xuICBpZiAoIUdJVEhVQl9SRVBPX1JFLnRlc3QocmVwbykpIHRocm93IG5ldyBFcnJvcihcIkdpdEh1YiByZXBvIG11c3QgYmUgaW4gb3duZXIvcmVwbyBmb3JtXCIpO1xuICByZXR1cm4gcmVwbztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3RvcmVQbGF0Zm9ybXMoaW5wdXQ6IHVua25vd24pOiBUd2Vha1N0b3JlUGxhdGZvcm1bXSB8IHVuZGVmaW5lZCB7XG4gIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSB0aHJvdyBuZXcgRXJyb3IoXCJTdG9yZSBlbnRyeSBwbGF0Zm9ybXMgbXVzdCBiZSBhbiBhcnJheVwiKTtcbiAgY29uc3QgYWxsb3dlZCA9IG5ldyBTZXQ8VHdlYWtTdG9yZVBsYXRmb3JtPihbXCJkYXJ3aW5cIiwgXCJ3aW4zMlwiLCBcImxpbnV4XCJdKTtcbiAgY29uc3QgcGxhdGZvcm1zID0gQXJyYXkuZnJvbShuZXcgU2V0KGlucHV0Lm1hcCgodmFsdWUpID0+IHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8ICFhbGxvd2VkLmhhcyh2YWx1ZSBhcyBUd2Vha1N0b3JlUGxhdGZvcm0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHN0b3JlIHBsYXRmb3JtOiAke1N0cmluZyh2YWx1ZSl9YCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZSBhcyBUd2Vha1N0b3JlUGxhdGZvcm07XG4gIH0pKSk7XG4gIHJldHVybiBwbGF0Zm9ybXMubGVuZ3RoID4gMCA/IHBsYXRmb3JtcyA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gb3B0aW9uYWxHaXRodWJVcmwodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8ICF2YWx1ZS50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwodmFsdWUpO1xuICBpZiAodXJsLnByb3RvY29sICE9PSBcImh0dHBzOlwiIHx8IHVybC5ob3N0bmFtZSAhPT0gXCJnaXRodWIuY29tXCIpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbn1cbiIsICJleHBvcnQgZnVuY3Rpb24gY29tcGFjdFNldHRpbmdzVGV4dCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIFN0cmluZyh2YWx1ZSB8fCBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNOYXRpdmVTZXR0aW5nc1NlY3Rpb25IZWFkZXJzKHJvb3Q6IEhUTUxFbGVtZW50KTogYm9vbGVhbiB7XG4gIGNvbnN0IGhlYWRpbmdzID0gbmV3IFNldChbXCJQZXJzb25hbFwiLCBcIkludGVncmF0aW9uc1wiLCBcIkNvZGluZ1wiLCBcIkFyY2hpdmVkXCJdKTtcbiAgcmV0dXJuIEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImRpdixzcGFuXCIpKS5zb21lKChlbCkgPT4ge1xuICAgIGlmIChlbC5kYXRhc2V0LmNvZGV4cHApIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIWhlYWRpbmdzLmhhcyhjb21wYWN0U2V0dGluZ3NUZXh0KGVsLnRleHRDb250ZW50IHx8IFwiXCIpKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMoXCJ0ZXh0LXRva2VuLWlucHV0LXBsYWNlaG9sZGVyLWZvcmVncm91bmRcIikgfHxcbiAgICAgIGVsLmNsYXNzTGlzdC5jb250YWlucyhcInRleHQtdG9rZW4tdGV4dC1zZWNvbmRhcnlcIikgfHxcbiAgICAgIGVsLmNsYXNzTmFtZS5pbmNsdWRlcyhcInRleHQtdG9rZW5cIik7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBjb21wYWN0U2V0dGluZ3NUZXh0KHZhbHVlKVxuICAgIC50b0xvY2FsZUxvd2VyQ2FzZSgpXG4gICAgLm5vcm1hbGl6ZShcIk5GRFwiKVxuICAgIC5yZXBsYWNlKC9bXFx1MDMwMC1cXHUwMzZmXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9bXHUyMDE5XHUyMDE4YFx1MDBCNF0vZywgXCInXCIpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnRyaW0oKTtcbn1cblxuY29uc3QgQ09ERVhQUF9DT1JFX1NFVFRJTkdTX0xBQkVMUyA9IFtcbiAgXCJHZW5lcmFsXCIsXG4gIFwiXHU1RTM4XHU4OUM0XCIsXG4gIFwiXHU5MDFBXHU3NTI4XCIsXG4gIFwiQXBwZWFyYW5jZVwiLFxuICBcIlx1NTkxNlx1ODlDMlwiLFxuICBcIkNvbmZpZ3VyYXRpb25cIixcbiAgXCJcdTkxNERcdTdGNkVcIixcbiAgXCJcdTlFRDhcdThCQTRcdTY3NDNcdTk2NTBcIixcbiAgXCJQZXJzb25hbGl6YXRpb25cIixcbiAgXCJcdTRFMkFcdTYwMjdcdTUzMTZcIixcbl0ubWFwKG5vcm1hbGl6ZUNvZGV4UHBTZXR0aW5nc0xhYmVsKTtcblxuY29uc3QgQ09ERVhQUF9FWFRFTkRFRF9TRVRUSU5HU19MQUJFTFMgPSBbXG4gIFwiQWNjb3VudFwiLFxuICBcIlx1OEQyNlx1NjIzN1wiLFxuICBcIlx1OEQyNlx1NTNGN1wiLFxuICBcIkdlbmVyYWxcIixcbiAgXCJcdTVFMzhcdTg5QzRcIixcbiAgXCJcdTkwMUFcdTc1MjhcIixcbiAgXCJBcHBlYXJhbmNlXCIsXG4gIFwiXHU1OTE2XHU4OUMyXCIsXG4gIFwiQ29uZmlndXJhdGlvblwiLFxuICBcIlx1OTE0RFx1N0Y2RVwiLFxuICBcIlx1OUVEOFx1OEJBNFx1Njc0M1x1OTY1MFwiLFxuICBcIlBlcnNvbmFsaXphdGlvblwiLFxuICBcIlx1NEUyQVx1NjAyN1x1NTMxNlwiLFxuICBcIktleWJvYXJkIHNob3J0Y3V0c1wiLFxuICBcIkFyY2hpdmVkIGNoYXRzXCIsXG4gIFwiVXNhZ2VcIixcbiAgXCJDb21wdXRlciB1c2VcIixcbiAgXCJCcm93c2VyIHVzZVwiLFxuICBcIk1DUCBzZXJ2ZXJzXCIsXG4gIFwiTUNQIFNlcnZlcnNcIixcbiAgXCJNQ1AgXHU2NzBEXHU1MkExXHU1NjY4XCIsXG4gIFwiR2l0XCIsXG4gIFwiRW52aXJvbm1lbnRzXCIsXG4gIFwiXHU3M0FGXHU1ODgzXCIsXG4gIFwiQ2xvdWQgRW52aXJvbm1lbnRzXCIsXG4gIFwiV29ya3RyZWVzXCIsXG4gIFwiQ29ubmVjdGlvbnNcIixcbiAgXCJQbHVnaW5zXCIsXG4gIFwiU2tpbGxzXCIsXG5dLm1hcChub3JtYWxpemVDb2RleFBwU2V0dGluZ3NMYWJlbCk7XG5cbmNvbnN0IENPREVYUFBfU0VUVElOR1NfT05MWV9MQUJFTFMgPSBbXG4gIFwiR2VuZXJhbFwiLFxuICBcIlx1NUUzOFx1ODlDNFwiLFxuICBcIlx1OTAxQVx1NzUyOFwiLFxuICBcIkFwcGVhcmFuY2VcIixcbiAgXCJcdTU5MTZcdTg5QzJcIixcbiAgXCJDb25maWd1cmF0aW9uXCIsXG4gIFwiXHU5MTREXHU3RjZFXCIsXG4gIFwiXHU5RUQ4XHU4QkE0XHU2NzQzXHU5NjUwXCIsXG4gIFwiUGVyc29uYWxpemF0aW9uXCIsXG4gIFwiXHU0RTJBXHU2MDI3XHU1MzE2XCIsXG4gIFwiS2V5Ym9hcmQgc2hvcnRjdXRzXCIsXG4gIFwiQXJjaGl2ZWQgY2hhdHNcIixcbiAgXCJVc2FnZVwiLFxuICBcIkNvbXB1dGVyIHVzZVwiLFxuICBcIkJyb3dzZXIgdXNlXCIsXG4gIFwiTUNQIHNlcnZlcnNcIixcbiAgXCJNQ1AgU2VydmVyc1wiLFxuICBcIk1DUCBcdTY3MERcdTUyQTFcdTU2NjhcIixcbiAgXCJHaXRcIixcbiAgXCJFbnZpcm9ubWVudHNcIixcbiAgXCJcdTczQUZcdTU4ODNcIixcbiAgXCJDbG91ZCBFbnZpcm9ubWVudHNcIixcbiAgXCJXb3JrdHJlZXNcIixcbiAgXCJDb25uZWN0aW9uc1wiLFxuXS5tYXAobm9ybWFsaXplQ29kZXhQcFNldHRpbmdzTGFiZWwpO1xuXG5jb25zdCBDT0RFWFBQX01BSU5fQVBQX05BVl9MQUJFTFMgPSBbXG4gIFwiTmV3IGNoYXRcIixcbiAgXCJRdWljayBjaGF0XCIsXG4gIFwiXHU1RkVCXHU5MDFGXHU1QkY5XHU4QkREXCIsXG4gIFwiU2VhcmNoXCIsXG4gIFwiXHU2NDFDXHU3RDIyXCIsXG4gIFwiUGx1Z2luc1wiLFxuICBcIlx1NjNEMlx1NEVGNlwiLFxuICBcIkF1dG9tYXRpb25zXCIsXG4gIFwiQXV0b21hdGlvblwiLFxuICBcIlx1ODFFQVx1NTJBOFx1NTMxNlwiLFxuICBcIkNoYXRzXCIsXG4gIFwiQ2hhdFwiLFxuICBcIlx1NUJGOVx1OEJERFwiLFxuICBcIlByb2plY3RzXCIsXG4gIFwiXHU5ODc5XHU3NkVFXCIsXG4gIFwiUGlubmVkXCIsXG4gIFwiU2V0dGluZ3NcIixcbiAgXCJcdThCQkVcdTdGNkVcIixcbiAgXCJXb3JrIGxvY2FsbHlcIixcbl0ubWFwKG5vcm1hbGl6ZUNvZGV4UHBTZXR0aW5nc0xhYmVsKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvZGV4UHBDb250cm9sTGFiZWwoZWw6IEhUTUxFbGVtZW50KTogc3RyaW5nIHtcbiAgcmV0dXJuIG5vcm1hbGl6ZUNvZGV4UHBTZXR0aW5nc0xhYmVsKFxuICAgIGVsLmdldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIikgfHxcbiAgICAgIGVsLmdldEF0dHJpYnV0ZShcInRpdGxlXCIpIHx8XG4gICAgICBlbC50ZXh0Q29udGVudCB8fFxuICAgICAgXCJcIixcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvZGV4UHBTZXR0aW5nc0xhYmVsc0Zyb20ocm9vdDogUGFyZW50Tm9kZSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgY29udHJvbHMgPSBBcnJheS5mcm9tKFxuICAgIHJvb3QucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCJidXR0b24sYSxbcm9sZT0nYnV0dG9uJ10sW3JvbGU9J2xpbmsnXVwiKSxcbiAgKTtcblxuICByZXR1cm4gW1xuICAgIC4uLm5ldyBTZXQoXG4gICAgICBjb250cm9sc1xuICAgICAgICAubWFwKGNvZGV4UHBDb250cm9sTGFiZWwpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbiksXG4gICAgKSxcbiAgXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvZGV4UHBTZXR0aW5nc0xhYmVsU2NvcmUobGFiZWxzOiBzdHJpbmdbXSk6IHsgY29yZTogbnVtYmVyOyB0b3RhbDogbnVtYmVyIH0ge1xuICBjb25zdCBjb3JlID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHRvdGFsID0gbmV3IFNldDxzdHJpbmc+KCk7XG5cbiAgZm9yIChjb25zdCBsYWJlbCBvZiBsYWJlbHMpIHtcbiAgICBmb3IgKGNvbnN0IG1hcmtlciBvZiBDT0RFWFBQX0NPUkVfU0VUVElOR1NfTEFCRUxTKSB7XG4gICAgICBpZiAoY29kZXhQcExhYmVsTWF0Y2hlc01hcmtlcihsYWJlbCwgbWFya2VyKSkgY29yZS5hZGQobWFya2VyKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG1hcmtlciBvZiBDT0RFWFBQX0VYVEVOREVEX1NFVFRJTkdTX0xBQkVMUykge1xuICAgICAgaWYgKGNvZGV4UHBMYWJlbE1hdGNoZXNNYXJrZXIobGFiZWwsIG1hcmtlcikpIHRvdGFsLmFkZChtYXJrZXIpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7IGNvcmU6IGNvcmUuc2l6ZSwgdG90YWw6IHRvdGFsLnNpemUgfTtcbn1cblxuZnVuY3Rpb24gY29kZXhQcExhYmVsTWF0Y2hlc01hcmtlcihsYWJlbDogc3RyaW5nLCBtYXJrZXI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbGFiZWwgPT09IG1hcmtlciB8fCBsYWJlbC5pbmNsdWRlcyhtYXJrZXIpO1xufVxuXG5mdW5jdGlvbiBjb2RleFBwTWFya2VyQ291bnQobGFiZWxzOiBzdHJpbmdbXSwgbWFya2Vyczogc3RyaW5nW10pOiBudW1iZXIge1xuICBjb25zdCBtYXRjaGVkID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgbGFiZWwgb2YgbGFiZWxzKSB7XG4gICAgZm9yIChjb25zdCBtYXJrZXIgb2YgbWFya2Vycykge1xuICAgICAgaWYgKGNvZGV4UHBMYWJlbE1hdGNoZXNNYXJrZXIobGFiZWwsIG1hcmtlcikpIG1hdGNoZWQuYWRkKG1hcmtlcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVkLnNpemU7XG59XG5cbmZ1bmN0aW9uIGhhc0NvZGV4UHBTZXR0aW5nc09ubHlTaWduYWwobGFiZWxzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gY29kZXhQcE1hcmtlckNvdW50KGxhYmVscywgQ09ERVhQUF9TRVRUSU5HU19PTkxZX0xBQkVMUykgPiAwO1xufVxuXG5mdW5jdGlvbiBoYXNNYWluQXBwU2lkZWJhclNpZ25hbHMobGFiZWxzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICByZXR1cm4gY29kZXhQcE1hcmtlckNvdW50KGxhYmVscywgQ09ERVhQUF9NQUlOX0FQUF9OQVZfTEFCRUxTKSA+PSAyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb2RleFBwU2V0dGluZ3NMYWJlbFNldChsYWJlbHM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNjb3JlID0gY29kZXhQcFNldHRpbmdzTGFiZWxTY29yZShsYWJlbHMpO1xuICByZXR1cm4gc2NvcmUuY29yZSA+PSAyICYmIHNjb3JlLnRvdGFsID49IDM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2RleFBwVmlzaWJsZUJveChlbDogSFRNTEVsZW1lbnQpOiBET01SZWN0IHwgbnVsbCB7XG4gIGlmICghZWwuaXNDb25uZWN0ZWQpIHJldHVybiBudWxsO1xuICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWwpO1xuICBpZiAoc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIgfHwgc3R5bGUudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIikgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBpZiAocmVjdC53aWR0aCA8PSAwIHx8IHJlY3QuaGVpZ2h0IDw9IDApIHJldHVybiBudWxsO1xuICByZXR1cm4gcmVjdDtcbn1cblxuY29uc3QgRk9SQklEREVOX1NFVFRJTkdTX1NJREVCQVJfU0VMRUNUT1IgPSBbXG4gIFwiW2RhdGEtY29tcG9zZXItb3ZlcmxheS1mbG9hdGluZy11aT0ndHJ1ZSddXCIsXG4gIFwiW2RhdGEtY29kZXhwcC1zbGFzaC1tZW51PSd0cnVlJ11cIixcbiAgXCJbZGF0YS1jb2RleHBwLW92ZXJsYXktbm9pc2U9J3RydWUnXVwiLFxuICBcIi5jb21wb3Nlci1ob21lLXRvcC1tZW51XCIsXG4gIFwiW2NsYXNzKj0nW2NvbnRhaW5lci1uYW1lOmhvbWUtbWFpbi1jb250ZW50XSddXCIsXG5dLmpvaW4oXCIsXCIpO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNGb3JiaWRkZW5TZXR0aW5nc1NpZGViYXJTdXJmYWNlKG5vZGU6IEVsZW1lbnQgfCBudWxsKTogYm9vbGVhbiB7XG4gIGlmICghbm9kZSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBlbCA9IG5vZGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCA/IG5vZGUgOiBub2RlLnBhcmVudEVsZW1lbnQ7XG4gIGlmICghZWwpIHJldHVybiBmYWxzZTtcbiAgaWYgKGVsLmNsb3Nlc3QoRk9SQklEREVOX1NFVFRJTkdTX1NJREVCQVJfU0VMRUNUT1IpKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGVsLnF1ZXJ5U2VsZWN0b3IoXCJbZGF0YS1saXN0LW5hdmlnYXRpb24taXRlbT0ndHJ1ZSddLCBbY21kay1pdGVtXVwiKSkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU2V0dGluZ3NTaWRlYmFyQ2FuZGlkYXRlKGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAvLyBVc2UgdGhlIHNhbWUgZXhjbHVzaW9ucyB3aGVuIHNlbGVjdGluZyBhIGhvc3QgYW5kIHZhbGlkYXRpbmcgaW5qZWN0ZWRcbiAgLy8gZ3JvdXBzLiBPdGhlcndpc2UgY2xlYW51cCByZW1vdmVzIGdyb3VwcyB0aGF0IHRoZSBuZXh0IHBhc3MgcmVpbnNlcnRzLlxuICAvLyBUaGUgZ2VuZXJpYyB2ZXJ0aWNhbC1zY3JvbGwtZmFkZS1tYXNrIGNsYXNzIGFsc28gYXBwZWFycyBpbiBTZXR0aW5ncztcbiAgLy8gb25seSB0aGUgY29tcG9zZXIvb3ZlcmxheS1zcGVjaWZpYyBtYXJrZXJzIGFib3ZlIGlkZW50aWZ5IGZvcmJpZGRlbiBob3N0cy5cbiAgaWYgKGlzRm9yYmlkZGVuU2V0dGluZ3NTaWRlYmFyU3VyZmFjZShlbCkpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgcmVjdCA9IGNvZGV4UHBWaXNpYmxlQm94KGVsKTtcbiAgaWYgKCFyZWN0KSByZXR1cm4gZmFsc2U7XG5cbiAgLy8gQ3VycmVudCBDb2RleCBTZXR0aW5ncyBzaWRlYmFyOiBsZWZ0IGNvbHVtbiwgbm90IHRoZSBtYWluIGNvbnRlbnQgcGFuZWwuXG4gIGlmIChyZWN0LndpZHRoIDwgMTIwIHx8IHJlY3Qud2lkdGggPiA2MjApIHJldHVybiBmYWxzZTtcbiAgaWYgKHJlY3QuaGVpZ2h0IDwgODApIHJldHVybiBmYWxzZTtcbiAgaWYgKHJlY3QubGVmdCA+IHdpbmRvdy5pbm5lcldpZHRoICogMC42NSkgcmV0dXJuIGZhbHNlO1xuXG4gIGNvbnN0IGxhYmVscyA9IGNvZGV4UHBTZXR0aW5nc0xhYmVsc0Zyb20oZWwpO1xuICBpZiAoaGFzTWFpbkFwcFNpZGViYXJTaWduYWxzKGxhYmVscykgJiYgIWhhc0NvZGV4UHBTZXR0aW5nc09ubHlTaWduYWwobGFiZWxzKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBpc0NvZGV4UHBTZXR0aW5nc0xhYmVsU2V0KGxhYmVscyk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ0ljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk0zIDVoOU0xNSA1aDJNMyAxMGgyTTggMTBoOU0zIDE1aDExTTE3IDE1aDBcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xuICAgIGA8Y2lyY2xlIGN4PVwiMTNcIiBjeT1cIjVcIiByPVwiMS42XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcbiAgICBgPGNpcmNsZSBjeD1cIjZcIiBjeT1cIjEwXCIgcj1cIjEuNlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIi8+YCArXG4gICAgYDxjaXJjbGUgY3g9XCIxNVwiIGN5PVwiMTVcIiByPVwiMS42XCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcbiAgICBgPC9zdmc+YFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdHdlYWtzSWNvblN2ZygpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGA8c3ZnIHdpZHRoPVwiMjBcIiBoZWlnaHQ9XCIyMFwiIHZpZXdCb3g9XCIwIDAgMjAgMjBcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiBjbGFzcz1cImljb24tc20gaW5saW5lLWJsb2NrIGFsaWduLW1pZGRsZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPmAgK1xuICAgIGA8cGF0aCBkPVwiTTEwIDIuNSBMMTEuNCA4LjYgTDE3LjUgMTAgTDExLjQgMTEuNCBMMTAgMTcuNSBMOC42IDExLjQgTDIuNSAxMCBMOC42IDguNiBaXCIgZmlsbD1cImN1cnJlbnRDb2xvclwiLz5gICtcbiAgICBgPHBhdGggZD1cIk0xNS41IDMgTDE2IDUgTDE4IDUuNSBMMTYgNiBMMTUuNSA4IEwxNSA2IEwxMyA1LjUgTDE1IDUgWlwiIGZpbGw9XCJjdXJyZW50Q29sb3JcIiBvcGFjaXR5PVwiMC43XCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk00IDguMiA1LjEgNC41QTEuNSAxLjUgMCAwIDEgNi41NSAzLjRoNi45YTEuNSAxLjUgMCAwIDEgMS40NSAxLjFMMTYgOC4yXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIi8+YCArXG4gICAgYDxwYXRoIGQ9XCJNNC41IDhoMTF2Ny41QTEuNSAxLjUgMCAwIDEgMTQgMTdINmExLjUgMS41IDAgMCAxLTEuNS0xLjVWOFpcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPHBhdGggZD1cIk03LjUgOHYxYTIuNSAyLjUgMCAwIDAgNSAwVjhcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0UGFnZUljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjIwXCIgaGVpZ2h0PVwiMjBcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgY2xhc3M9XCJpY29uLXNtIGlubGluZS1ibG9jayBhbGlnbi1taWRkbGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk01IDNoN2wzIDN2MTFhMSAxIDAgMCAxLTEgMUg1YTEgMSAwIDAgMS0xLTFWNGExIDEgMCAwIDEgMS0xWlwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjEuNVwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTEyIDN2M2ExIDEgMCAwIDAgMSAxaDJcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIxLjVcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz5gICtcbiAgICBgPHBhdGggZD1cIk03IDExaDZNNyAxNGg0XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiLz5gICtcbiAgICBgPC9zdmc+YFxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaEljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBgPHN2ZyB3aWR0aD1cIjE4XCIgaGVpZ2h0PVwiMThcIiB2aWV3Qm94PVwiMCAwIDIwIDIwXCIgZmlsbD1cIm5vbmVcIiBjbGFzcz1cImljb24teHNcIiBhcmlhLWhpZGRlbj1cInRydWVcIj5gICtcbiAgICBgPHBhdGggZD1cIk00LjQgOS4zNUE1LjY1IDUuNjUgMCAwIDEgMTQgNS4zTDE1Ljc1IDdNMTUuNzUgMy43NVY3aC0zLjI1XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8cGF0aCBkPVwiTTE1LjYgMTAuNjVBNS42NSA1LjY1IDAgMCAxIDYgMTQuN0w0LjI1IDEzTTQuMjUgMTYuMjVWMTNINy41XCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMS41XCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPmAgK1xuICAgIGA8L3N2Zz5gXG4gICk7XG59XG4iLCAiZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFN2Z0h0bWwocGFyZW50OiBIVE1MRWxlbWVudCwgc3ZnOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgZWwgPSBzdmdFbGVtZW50KHN2Zyk7XG4gIGlmIChlbCkgcGFyZW50LmFwcGVuZENoaWxkKGVsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN2Z0VsZW1lbnQoc3ZnOiBzdHJpbmcpOiBFbGVtZW50IHwgbnVsbCB7XG4gIGNvbnN0IHRlbXBsYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRlbXBsYXRlXCIpO1xuICB0ZW1wbGF0ZS5pbm5lckhUTUwgPSBzdmcudHJpbSgpO1xuICBjb25zdCBlbCA9IHRlbXBsYXRlLmNvbnRlbnQuZmlyc3RFbGVtZW50Q2hpbGQ7XG4gIGlmICghZWwgfHwgZWwudGFnTmFtZS50b0xvd2VyQ2FzZSgpICE9PSBcInN2Z1wiKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGVsO1xufVxuIiwgIi8qKlxuICogUmVuZGVyZXItc2lkZSB0d2VhayBob3N0LiBXZTpcbiAqICAgMS4gQXNrIG1haW4gZm9yIHRoZSB0d2VhayBsaXN0ICh3aXRoIHJlc29sdmVkIGVudHJ5IHBhdGgpLlxuICogICAyLiBGb3IgZWFjaCByZW5kZXJlci1zY29wZWQgKG9yIFwiYm90aFwiKSB0d2VhaywgZmV0Y2ggaXRzIHNvdXJjZSB2aWEgSVBDXG4gKiAgICAgIGFuZCBleGVjdXRlIGl0IGFzIGEgQ29tbW9uSlMtc2hhcGVkIGZ1bmN0aW9uLlxuICogICAzLiBQcm92aWRlIGl0IHRoZSByZW5kZXJlciBoYWxmIG9mIHRoZSBBUEkuXG4gKlxuICogQ29kZXggcnVucyB0aGUgcmVuZGVyZXIgd2l0aCBzYW5kYm94OiB0cnVlLCBzbyBOb2RlJ3MgYHJlcXVpcmUoKWAgaXNcbiAqIHJlc3RyaWN0ZWQgdG8gYSB0aW55IHdoaXRlbGlzdCAoZWxlY3Ryb24gKyBhIGZldyBwb2x5ZmlsbHMpLiBUaGF0IG1lYW5zIHdlXG4gKiBjYW5ub3QgYHJlcXVpcmUoKWAgYXJiaXRyYXJ5IHR3ZWFrIGZpbGVzIGZyb20gZGlzay4gSW5zdGVhZCB3ZSBwdWxsIHRoZVxuICogc291cmNlIHN0cmluZyBmcm9tIG1haW4gYW5kIGV2YWx1YXRlIGl0IHdpdGggYG5ldyBGdW5jdGlvbmAgaW5zaWRlIHRoZVxuICogcHJlbG9hZCBjb250ZXh0LiBUd2VhayBhdXRob3JzIHdobyBuZWVkIG5wbSBkZXBzIG11c3QgYnVuZGxlIHRoZW0gaW4uXG4gKi9cblxuaW1wb3J0IHsgaXBjUmVuZGVyZXIgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IHJlZ2lzdGVyU2VjdGlvbiwgcmVnaXN0ZXJQYWdlLCBjbGVhclNlY3Rpb25zLCBzZXRMaXN0ZWRUd2Vha3MgfSBmcm9tIFwiLi9zZXR0aW5ncy1pbmplY3RvclwiO1xuaW1wb3J0IHsgZmliZXJGb3JOb2RlIH0gZnJvbSBcIi4vcmVhY3QtaG9va1wiO1xuaW1wb3J0IHsgd2FpdEZvckVsZW1lbnQsIGNhbmNlbEFsbEVsZW1lbnRXYWl0ZXJzIH0gZnJvbSBcIi4vZWxlbWVudC13YWl0ZXJcIjtcbmltcG9ydCB7IGNyZWF0ZVR3ZWFrTW9kdWxlTG9hZGVyIH0gZnJvbSBcIi4vdHdlYWstbW9kdWxlLWxvYWRlclwiO1xuaW1wb3J0IHsgZGlzcG9zZVNpZGViYXJBY3Rpb25zRm9yVHdlYWssIHJlbmRlcmVyU2lkZWJhckFwaSB9IGZyb20gXCIuL21haW4tc2lkZWJhci1hY3Rpb25zXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENvZGV4Q2RwU3RhdHVzLFxuICBDb2RleENkcFRhcmdldCxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMsXG4gIENvZGV4TW9kZWxPYmplY3RSZXN1bHQsXG4gIENvZGV4TW9kZWxUZXh0UmVzdWx0LFxuICBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXMsXG4gIENvZGV4UnVudGltZUluZm8sXG4gIENvZGV4Vmlld1JlZixcbiAgQ29kZXhXaW5kb3dSZWYsXG4gIE5hdGl2ZUhlbHBlclJlZixcbiAgTmF0aXZlTW9kdWxlS2luZCxcbiAgTmF0aXZlTW9kdWxlUmVmLFxuICBOYXRpdmVQYW5lbFJlZixcbiAgTmF0aXZlVmlld1JlZixcbiAgVHdlYWtNYW5pZmVzdCxcbiAgVHdlYWtBcGksXG4gIFJlYWN0RmliZXJOb2RlLFxuICBUd2Vhayxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuaW50ZXJmYWNlIExpc3RlZFR3ZWFrIHtcbiAgbWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3Q7XG4gIGVudHJ5OiBzdHJpbmc7XG4gIGRpcjogc3RyaW5nO1xuICBlbnRyeUV4aXN0czogYm9vbGVhbjtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgdXBkYXRlOiB7XG4gICAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gICAgcmVwbzogc3RyaW5nO1xuICAgIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gICAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgICBsYXRlc3RUYWc6IHN0cmluZyB8IG51bGw7XG4gICAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gICAgZXJyb3I/OiBzdHJpbmc7XG4gIH0gfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgVXNlclBhdGhzIHtcbiAgdXNlclJvb3Q6IHN0cmluZztcbiAgcnVudGltZURpcjogc3RyaW5nO1xuICB0d2Vha3NEaXI6IHN0cmluZztcbiAgbG9nRGlyOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBFbGVjdHJvbkJyaWRnZSB7XG4gIGdldEJ1aWxkRmxhdm9yPzogKCkgPT4gc3RyaW5nIHwgbnVsbDtcbiAgdXNlc093bEFwcFNoZWxsPzogKCkgPT4gYm9vbGVhbjtcbn1cblxuY29uc3QgbG9hZGVkID0gbmV3IE1hcDxzdHJpbmcsIHsgc3RvcD86ICgpID0+IHZvaWQgfT4oKTtcbnR5cGUgTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIgPSAobWVzc2FnZTogdW5rbm93bikgPT4gdW5rbm93biB8IHVuZGVmaW5lZDtcbmNvbnN0IG1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycyA9IG5ldyBTZXQ8TWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI+KCk7XG5cbmluc3RhbGxCcmlkZ2VIb29rcygpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RhcnRUd2Vha0hvc3QoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHR3ZWFrcyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmxpc3QtdHdlYWtzXCIpKSBhcyBMaXN0ZWRUd2Vha1tdO1xuICBjb25zdCBwYXRocyA9IChhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnVzZXItcGF0aHNcIikpIGFzIFVzZXJQYXRocztcbiAgLy8gUHVzaCB0aGUgbGlzdCB0byB0aGUgc2V0dGluZ3MgaW5qZWN0b3Igc28gdGhlIFR3ZWFrcyBwYWdlIGNhbiByZW5kZXJcbiAgLy8gY2FyZHMgZXZlbiBiZWZvcmUgYW55IHR3ZWFrJ3Mgc3RhcnQoKSBydW5zIChhbmQgZm9yIGRpc2FibGVkIHR3ZWFrc1xuICAvLyB0aGF0IHdlIG5ldmVyIGxvYWQpLlxuICBzZXRMaXN0ZWRUd2Vha3ModHdlYWtzKTtcbiAgLy8gU3Rhc2ggZm9yIHRoZSBzZXR0aW5ncyBpbmplY3RvcidzIGVtcHR5LXN0YXRlIG1lc3NhZ2UuXG4gICh3aW5kb3cgYXMgdW5rbm93biBhcyB7IF9fY29kZXhwcF90d2Vha3NfZGlyX18/OiBzdHJpbmcgfSkuX19jb2RleHBwX3R3ZWFrc19kaXJfXyA9XG4gICAgcGF0aHMudHdlYWtzRGlyO1xuXG4gIGZvciAoY29uc3QgdCBvZiB0d2Vha3MpIHtcbiAgICBpZiAodC5tYW5pZmVzdC5zY29wZSA9PT0gXCJtYWluXCIpIGNvbnRpbnVlO1xuICAgIGlmICghdC5lbnRyeUV4aXN0cykgY29udGludWU7XG4gICAgaWYgKCF0LmVuYWJsZWQpIGNvbnRpbnVlO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBsb2FkVHdlYWsodCwgcGF0aHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHR3ZWFrIGxvYWQgZmFpbGVkOlwiLCB0Lm1hbmlmZXN0LmlkLCBlKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlwY1JlbmRlcmVyLnNlbmQoXG4gICAgICAgICAgXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsXG4gICAgICAgICAgXCJlcnJvclwiLFxuICAgICAgICAgIFwidHdlYWsgbG9hZCBmYWlsZWQ6IFwiICsgdC5tYW5pZmVzdC5pZCArIFwiOiBcIiArIFN0cmluZygoZSBhcyBFcnJvcik/LnN0YWNrID8/IGUpLFxuICAgICAgICApO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgfVxuXG4gIGNvbnNvbGUuaW5mbyhcbiAgICBgW2NvZGV4LXBsdXNwbHVzXSByZW5kZXJlciBob3N0IGxvYWRlZCAke2xvYWRlZC5zaXplfSB0d2VhayhzKTpgLFxuICAgIFsuLi5sb2FkZWQua2V5cygpXS5qb2luKFwiLCBcIikgfHwgXCIobm9uZSlcIixcbiAgKTtcbiAgaXBjUmVuZGVyZXIuc2VuZChcbiAgICBcImNvZGV4cHA6cHJlbG9hZC1sb2dcIixcbiAgICBcImluZm9cIixcbiAgICBgcmVuZGVyZXIgaG9zdCBsb2FkZWQgJHtsb2FkZWQuc2l6ZX0gdHdlYWsocyk6ICR7Wy4uLmxvYWRlZC5rZXlzKCldLmpvaW4oXCIsIFwiKSB8fCBcIihub25lKVwifWAsXG4gICk7XG59XG5cbi8qKlxuICogU3RvcCBldmVyeSByZW5kZXJlci1zY29wZSB0d2VhayBzbyBhIHN1YnNlcXVlbnQgYHN0YXJ0VHdlYWtIb3N0KClgIHdpbGxcbiAqIHJlLWV2YWx1YXRlIGZyZXNoIHNvdXJjZS4gTW9kdWxlIGNhY2hlIGlzbid0IHJlbGV2YW50IHNpbmNlIHdlIGV2YWxcbiAqIHNvdXJjZSBzdHJpbmdzIGRpcmVjdGx5IFx1MjAxNCBlYWNoIGxvYWQgY3JlYXRlcyBhIGZyZXNoIHNjb3BlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVhcmRvd25Ud2Vha0hvc3QoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgW2lkLCB0XSBvZiBsb2FkZWQpIHtcbiAgICB0cnkge1xuICAgICAgdC5zdG9wPy4oKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbY29kZXgtcGx1c3BsdXNdIHR3ZWFrIHN0b3AgZmFpbGVkOlwiLCBpZCwgZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWRpc3Bvc2UtdHdlYWtcIiwgaWQpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgIHZvaWQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtZGlzcG9zZS10d2Vha1wiLCBpZCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgZGlzcG9zZVNpZGViYXJBY3Rpb25zRm9yVHdlYWsoaWQpO1xuICAgIH1cbiAgfVxuICBsb2FkZWQuY2xlYXIoKTtcbiAgY2FuY2VsQWxsRWxlbWVudFdhaXRlcnMoXCJ0d2VhayBob3N0IHRlYXJkb3duXCIpO1xuICBjbGVhclNlY3Rpb25zKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRUd2Vhayh0OiBMaXN0ZWRUd2VhaywgcGF0aHM6IFVzZXJQYXRocyk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzb3VyY2UgPSAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgIFwiY29kZXhwcDpyZWFkLXR3ZWFrLXNvdXJjZVwiLFxuICAgIHQuZW50cnksXG4gICkpIGFzIHN0cmluZztcblxuICAvLyBFdmFsdWF0ZSBhcyBDSlMtc2hhcGVkOiBwcm92aWRlIG1vZHVsZS9leHBvcnRzL2FwaS4gVHdlYWsgY29kZSBtYXkgdXNlXG4gIC8vIGBtb2R1bGUuZXhwb3J0cyA9IHsgc3RhcnQsIHN0b3AgfWAgb3IgYGV4cG9ydHMuc3RhcnQgPSAuLi5gIG9yIHB1cmUgRVNNXG4gIC8vIGRlZmF1bHQgZXhwb3J0IHNoYXBlICh3ZSBhY2NlcHQgYm90aCkuXG4gIGNvbnN0IGxvYWRlciA9IGNyZWF0ZVR3ZWFrTW9kdWxlTG9hZGVyKHtcbiAgICBtYW5pZmVzdElkOiB0Lm1hbmlmZXN0LmlkLFxuICAgIGVudHJ5OiB0LmVudHJ5LFxuICAgIGRpcjogdC5kaXIsXG4gICAgcmVhZFNvdXJjZTogcmVhZFR3ZWFrU291cmNlU3luYyxcbiAgICBmYWxsYmFja1JlcXVpcmU6IHJlbmRlcmVyRmFsbGJhY2tSZXF1aXJlLFxuICAgIGNvbnNvbGUsXG4gIH0pO1xuICBjb25zdCBtb2QgPSBsb2FkZXIubG9hZEVudHJ5KHNvdXJjZSkgYXMgeyBkZWZhdWx0PzogVHdlYWsgfSAmIFR3ZWFrO1xuICBjb25zdCB0d2VhazogVHdlYWsgPSAobW9kIGFzIHsgZGVmYXVsdD86IFR3ZWFrIH0pLmRlZmF1bHQgPz8gKG1vZCBhcyBUd2Vhayk7XG4gIGlmICh0eXBlb2YgdHdlYWs/LnN0YXJ0ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrICR7dC5tYW5pZmVzdC5pZH0gaGFzIG5vIHN0YXJ0KClgKTtcbiAgfVxuICBjb25zdCBhcGkgPSBtYWtlUmVuZGVyZXJBcGkodC5tYW5pZmVzdCwgcGF0aHMpO1xuICBhd2FpdCB0d2Vhay5zdGFydChhcGkpO1xuICBsb2FkZWQuc2V0KHQubWFuaWZlc3QuaWQsIHsgc3RvcDogdHdlYWsuc3RvcD8uYmluZCh0d2VhaykgfSk7XG59XG5cbmZ1bmN0aW9uIHJlYWRUd2Vha1NvdXJjZVN5bmMoZW50cnlQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXN1bHQgPSBpcGNSZW5kZXJlci5zZW5kU3luYyhcImNvZGV4cHA6cmVhZC10d2Vhay1zb3VyY2Utc3luY1wiLCBlbnRyeVBhdGgpIGFzXG4gICAgfCB7IG9rOiB0cnVlOyBzb3VyY2U6IHN0cmluZyB9XG4gICAgfCB7IG9rOiBmYWxzZTsgZXJyb3I/OiBzdHJpbmcgfTtcbiAgaWYgKHJlc3VsdD8ub2sgPT09IHRydWUpIHJldHVybiByZXN1bHQuc291cmNlO1xuICB0aHJvdyBuZXcgRXJyb3IocmVzdWx0Py5lcnJvciB8fCBgVW5hYmxlIHRvIHJlYWQgdHdlYWsgc291cmNlOiAke2VudHJ5UGF0aH1gKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJGYWxsYmFja1JlcXVpcmUocmVxdWVzdDogc3RyaW5nKTogdW5rbm93biB7XG4gIGNvbnN0IGZhbGxiYWNrID0gKGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyB7IHJlcXVpcmU/OiAoaWQ6IHN0cmluZykgPT4gdW5rbm93biB9KS5yZXF1aXJlO1xuICBpZiAodHlwZW9mIGZhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxsYmFjayhyZXF1ZXN0KTtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIGBSZW5kZXJlciB0d2VhayByZXF1aXJlIG9ubHkgc3VwcG9ydHMgcmVsYXRpdmUgZmlsZXM7IGJ1bmRsZSBkZXBlbmRlbmN5IFwiJHtyZXF1ZXN0fVwiIGludG8gdGhlIHR3ZWFrIGVudHJ5YCxcbiAgKTtcbn1cblxuZnVuY3Rpb24gbWFrZVJlbmRlcmVyQXBpKG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0LCBwYXRoczogVXNlclBhdGhzKTogVHdlYWtBcGkge1xuICBjb25zdCBpZCA9IG1hbmlmZXN0LmlkO1xuICBjb25zdCBsb2cgPSAobGV2ZWw6IFwiZGVidWdcIiB8IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIC4uLmE6IHVua25vd25bXSkgPT4ge1xuICAgIGNvbnN0IGNvbnNvbGVGbiA9XG4gICAgICBsZXZlbCA9PT0gXCJkZWJ1Z1wiID8gY29uc29sZS5kZWJ1Z1xuICAgICAgOiBsZXZlbCA9PT0gXCJ3YXJuXCIgPyBjb25zb2xlLndhcm5cbiAgICAgIDogbGV2ZWwgPT09IFwiZXJyb3JcIiA/IGNvbnNvbGUuZXJyb3JcbiAgICAgIDogY29uc29sZS5sb2c7XG4gICAgY29uc29sZUZuKGBbY29kZXgtcGx1c3BsdXNdWyR7aWR9XWAsIC4uLmEpO1xuICAgIC8vIEFsc28gbWlycm9yIHRvIG1haW4ncyBsb2cgZmlsZSBzbyB3ZSBjYW4gZGlhZ25vc2UgdHdlYWsgYmVoYXZpb3JcbiAgICAvLyB3aXRob3V0IGF0dGFjaGluZyBEZXZUb29scy4gU3RyaW5naWZ5IGVhY2ggYXJnIGRlZmVuc2l2ZWx5LlxuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGEubWFwKCh2KSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikgcmV0dXJuIHY7XG4gICAgICAgIGlmICh2IGluc3RhbmNlb2YgRXJyb3IpIHJldHVybiBgJHt2Lm5hbWV9OiAke3YubWVzc2FnZX1gO1xuICAgICAgICB0cnkgeyByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7IH0gY2F0Y2ggeyByZXR1cm4gU3RyaW5nKHYpOyB9XG4gICAgICB9KTtcbiAgICAgIGlwY1JlbmRlcmVyLnNlbmQoXG4gICAgICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxuICAgICAgICBsZXZlbCxcbiAgICAgICAgYFt0d2VhayAke2lkfV0gJHtwYXJ0cy5qb2luKFwiIFwiKX1gLFxuICAgICAgKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8qIHN3YWxsb3cgXHUyMDE0IG5ldmVyIGxldCBsb2dnaW5nIGJyZWFrIGEgdHdlYWsgKi9cbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBtYW5pZmVzdCxcbiAgICBwcm9jZXNzOiBcInJlbmRlcmVyXCIsXG4gICAgbG9nOiB7XG4gICAgICBkZWJ1ZzogKC4uLmEpID0+IGxvZyhcImRlYnVnXCIsIC4uLmEpLFxuICAgICAgaW5mbzogKC4uLmEpID0+IGxvZyhcImluZm9cIiwgLi4uYSksXG4gICAgICB3YXJuOiAoLi4uYSkgPT4gbG9nKFwid2FyblwiLCAuLi5hKSxcbiAgICAgIGVycm9yOiAoLi4uYSkgPT4gbG9nKFwiZXJyb3JcIiwgLi4uYSksXG4gICAgfSxcbiAgICBzdG9yYWdlOiByZW5kZXJlclN0b3JhZ2UoaWQpLFxuICAgIHNldHRpbmdzOiB7XG4gICAgICByZWdpc3RlcjogKHMpID0+IHJlZ2lzdGVyU2VjdGlvbih7IC4uLnMsIGlkOiBgJHtpZH06JHtzLmlkfWAgfSksXG4gICAgICByZWdpc3RlclBhZ2U6IChwKSA9PlxuICAgICAgICByZWdpc3RlclBhZ2UoaWQsIG1hbmlmZXN0LCB7IC4uLnAsIGlkOiBgJHtpZH06JHtwLmlkfWAgfSksXG4gICAgfSxcbiAgICByZWFjdDoge1xuICAgICAgZ2V0RmliZXI6IChuKSA9PiBmaWJlckZvck5vZGUobikgYXMgUmVhY3RGaWJlck5vZGUgfCBudWxsLFxuICAgICAgZmluZE93bmVyQnlOYW1lOiAobiwgbmFtZSkgPT4ge1xuICAgICAgICBsZXQgZiA9IGZpYmVyRm9yTm9kZShuKSBhcyBSZWFjdEZpYmVyTm9kZSB8IG51bGw7XG4gICAgICAgIHdoaWxlIChmKSB7XG4gICAgICAgICAgY29uc3QgdCA9IGYudHlwZSBhcyB7IGRpc3BsYXlOYW1lPzogc3RyaW5nOyBuYW1lPzogc3RyaW5nIH0gfCBudWxsO1xuICAgICAgICAgIGlmICh0ICYmICh0LmRpc3BsYXlOYW1lID09PSBuYW1lIHx8IHQubmFtZSA9PT0gbmFtZSkpIHJldHVybiBmO1xuICAgICAgICAgIGYgPSBmLnJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH0sXG4gICAgICB3YWl0Rm9yRWxlbWVudCxcbiAgICB9LFxuICAgIGJyaWRnZToge1xuICAgICAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI6ICh0cmFuc2Zvcm1lcikgPT4ge1xuICAgICAgICBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuYWRkKHRyYW5zZm9ybWVyKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICAgICAgICBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuZGVsZXRlKHRyYW5zZm9ybWVyKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICB9LFxuICAgIGlwYzoge1xuICAgICAgb246IChjLCBoKSA9PiB7XG4gICAgICAgIGNvbnN0IHdyYXBwZWQgPSAoX2U6IHVua25vd24sIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gaCguLi5hcmdzKTtcbiAgICAgICAgaXBjUmVuZGVyZXIub24oYGNvZGV4cHA6JHtpZH06JHtjfWAsIHdyYXBwZWQpO1xuICAgICAgICByZXR1cm4gKCkgPT4gaXBjUmVuZGVyZXIucmVtb3ZlTGlzdGVuZXIoYGNvZGV4cHA6JHtpZH06JHtjfWAsIHdyYXBwZWQpO1xuICAgICAgfSxcbiAgICAgIHNlbmQ6IChjLCAuLi5hcmdzKSA9PiBpcGNSZW5kZXJlci5zZW5kKGBjb2RleHBwOiR7aWR9OiR7Y31gLCAuLi5hcmdzKSxcbiAgICAgIGludm9rZTogPFQ+KGM6IHN0cmluZywgLi4uYXJnczogdW5rbm93bltdKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoYGNvZGV4cHA6JHtpZH06JHtjfWAsIC4uLmFyZ3MpIGFzIFByb21pc2U8VD4sXG4gICAgfSxcbiAgICBmczogcmVuZGVyZXJGcyhpZCwgcGF0aHMpLFxuICAgIG1vZGVsOiByZW5kZXJlck1vZGVsQXBpKGlkKSxcbiAgICBjb2RleDogcmVuZGVyZXJDb2RleEFwaShpZCksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxCcmlkZ2VIb29rcygpOiB2b2lkIHtcbiAgY29uc3QgaG9va3MgPSB7XG4gICAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIodHJhbnNmb3JtZXI6IE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyKSB7XG4gICAgICBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuYWRkKHRyYW5zZm9ybWVyKTtcbiAgICAgIHJldHVybiAoKSA9PiBtZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuZGVsZXRlKHRyYW5zZm9ybWVyKTtcbiAgICB9LFxuICAgIHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhtZXNzYWdlOiB1bmtub3duKSB7XG4gICAgICBsZXQgY3VycmVudCA9IG1lc3NhZ2U7XG4gICAgICBmb3IgKGNvbnN0IHRyYW5zZm9ybWVyIG9mIEFycmF5LmZyb20obWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzKSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSB0cmFuc2Zvcm1lcihjdXJyZW50KTtcbiAgICAgICAgICBpZiAobmV4dCAhPT0gdW5kZWZpbmVkKSBjdXJyZW50ID0gbmV4dDtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbY29kZXgtcGx1c3BsdXNdIG1lc3NhZ2UtZnJvbS12aWV3IHRyYW5zZm9ybWVyIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlwY1JlbmRlcmVyLnNlbmQoXG4gICAgICAgICAgICAgIFwiY29kZXhwcDpwcmVsb2FkLWxvZ1wiLFxuICAgICAgICAgICAgICBcIndhcm5cIixcbiAgICAgICAgICAgICAgXCJtZXNzYWdlLWZyb20tdmlldyB0cmFuc2Zvcm1lciBmYWlsZWQ6IFwiICsgU3RyaW5nKChlcnJvciBhcyBFcnJvcik/LnN0YWNrID8/IGVycm9yKSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gY3VycmVudDtcbiAgICB9LFxuICB9O1xuICBjb25zdCB0YXJnZXQgPSB3aW5kb3cgYXMgdW5rbm93biBhcyB7XG4gICAgX19jb2RleFBsdXNQbHVzQnJpZGdlSG9va3M/OiB0eXBlb2YgaG9va3M7XG4gICAgX19jb2RleHBwQnJpZGdlSG9va3M/OiB0eXBlb2YgaG9va3M7XG4gIH07XG4gIHRhcmdldC5fX2NvZGV4UGx1c1BsdXNCcmlkZ2VIb29rcyA9IGhvb2tzO1xuICB0YXJnZXQuX19jb2RleHBwQnJpZGdlSG9va3MgPSBob29rcztcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJDb2RleEFwaSh0d2Vha0lkOiBzdHJpbmcpOiBOb25OdWxsYWJsZTxUd2Vha0FwaVtcImNvZGV4XCJdPiB7XG4gIHJldHVybiB7XG4gICAgcnVudGltZToge1xuICAgICAgZ2V0SW5mbzogYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBpbmZvID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC1ydW50aW1lLWluZm9cIikgYXMgQ29kZXhSdW50aW1lSW5mbztcbiAgICAgICAgY29uc3QgYnJpZGdlID0gcmVuZGVyZXJFbGVjdHJvbkJyaWRnZSgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLmluZm8sXG4gICAgICAgICAgYnVpbGRGbGF2b3I6IGJyaWRnZT8uZ2V0QnVpbGRGbGF2b3I/LigpID8/IGluZm8uYnVpbGRGbGF2b3IsXG4gICAgICAgICAgdXNlc093bEFwcFNoZWxsOiBicmlkZ2U/LnVzZXNPd2xBcHBTaGVsbD8uKCkgPz8gaW5mby51c2VzT3dsQXBwU2hlbGwsXG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgZ2V0Q2FwYWJpbGl0aWVzOiAoKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXJ1bnRpbWUtY2FwYWJpbGl0aWVzXCIpIGFzIFByb21pc2U8Q29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzPixcbiAgICB9LFxuICAgIHNpZGViYXI6IHJlbmRlcmVyU2lkZWJhckFwaSh0d2Vha0lkKSxcbiAgICB3aW5kb3dzOiB7XG4gICAgICBjcmVhdGU6IChvcHRpb25zKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1jcmVhdGVcIiwgb3B0aW9ucykgYXMgUHJvbWlzZTxDb2RleFdpbmRvd1JlZj4sXG4gICAgICBnZXRQcmltYXJ5OiAoKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1wcmltYXJ5XCIpIGFzIFByb21pc2U8Q29kZXhXaW5kb3dSZWYgfCBudWxsPixcbiAgICAgIGZvY3VzOiAod2luZG93SWQpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWZvY3VzXCIsIHdpbmRvd0lkKSBhcyBQcm9taXNlPGJvb2xlYW4+LFxuICAgICAgc2hvdzogKHdpbmRvd0lkKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1zaG93XCIsIHdpbmRvd0lkKSBhcyBQcm9taXNlPGJvb2xlYW4+LFxuICAgIH0sXG4gICAgdmlld3M6IHtcbiAgICAgIGNyZWF0ZTogYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgcmVmID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICAgIFwiY29kZXhwcDpjb2RleC12aWV3LWNyZWF0ZVwiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHdlYkNvbnRlbnRzSWQ6IG51bWJlcjsgcGFyZW50V2luZG93SWQ6IG51bWJlciB8IG51bGwgfTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyQ29kZXhWaWV3UmVmKHR3ZWFrSWQsIHJlZi5pZCwgcmVmLndlYkNvbnRlbnRzSWQsIHJlZi5wYXJlbnRXaW5kb3dJZCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgY2RwOiB7XG4gICAgICBnZXRTdGF0dXM6ICgpID0+XG4gICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtY2RwLXN0YXR1c1wiKSBhcyBQcm9taXNlPENvZGV4Q2RwU3RhdHVzPixcbiAgICAgIGxpc3RUYXJnZXRzOiAoKSA9PlxuICAgICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LWNkcC10YXJnZXRzXCIpIGFzIFByb21pc2U8Q29kZXhDZHBUYXJnZXRbXT4sXG4gICAgfSxcbiAgICBuYXRpdmU6IHtcbiAgICAgIGxvYWRNb2R1bGU6IGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgICBcImNvZGV4cHA6bmF0aXZlLWxvYWQtbW9kdWxlXCIsXG4gICAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgICBvcHRpb25zLFxuICAgICAgICApIGFzIHsgaWQ6IHN0cmluZzsga2luZDogTmF0aXZlTW9kdWxlS2luZCB9O1xuICAgICAgICByZXR1cm4gcmVuZGVyZXJOYXRpdmVNb2R1bGVSZWYodHdlYWtJZCwgcmVmLmlkLCByZWYua2luZCk7XG4gICAgICB9LFxuICAgICAgY3JlYXRlUGFuZWw6IGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlZiA9IGF3YWl0IGlwY1JlbmRlcmVyLmludm9rZShcbiAgICAgICAgICBcImNvZGV4cHA6bmF0aXZlLWNyZWF0ZS1wYW5lbFwiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHdpbmRvd0lkOiBudW1iZXIgfCBudWxsIH07XG4gICAgICAgIHJldHVybiByZW5kZXJlck5hdGl2ZVBhbmVsUmVmKHR3ZWFrSWQsIHJlZi5pZCwgcmVmLndpbmRvd0lkKTtcbiAgICAgIH0sXG4gICAgICBhdHRhY2hWaWV3OiBhc3luYyAob3B0aW9ucykgPT4ge1xuICAgICAgICBjb25zdCByZWYgPSBhd2FpdCBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgICAgXCJjb2RleHBwOm5hdGl2ZS1hdHRhY2gtdmlld1wiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmcgfTtcbiAgICAgICAgcmV0dXJuIHJlbmRlcmVyTmF0aXZlVmlld1JlZih0d2Vha0lkLCByZWYuaWQpO1xuICAgICAgfSxcbiAgICAgIGxhdW5jaEhlbHBlcjogYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICAgICAgY29uc3QgcmVmID0gYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFxuICAgICAgICAgIFwiY29kZXhwcDpuYXRpdmUtbGF1bmNoLWhlbHBlclwiLFxuICAgICAgICAgIHR3ZWFrSWQsXG4gICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgKSBhcyB7IGlkOiBzdHJpbmc7IHBpZDogbnVtYmVyIH07XG4gICAgICAgIHJldHVybiByZW5kZXJlck5hdGl2ZUhlbHBlclJlZih0d2Vha0lkLCByZWYuaWQsIHJlZi5waWQpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIGNyZWF0ZUJyb3dzZXJWaWV3OiAoX29wdGlvbnMpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImFwaS5jb2RleC5jcmVhdGVCcm93c2VyVmlldyBpcyBtYWluLW9ubHk7IHVzZSBhIG1haW4tc2NvcGVkIHR3ZWFrXCIpO1xuICAgIH0sXG4gICAgY3JlYXRlV2luZG93OiAob3B0aW9ucykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWNyZWF0ZVwiLCBvcHRpb25zKSBhcyBQcm9taXNlPENvZGV4V2luZG93UmVmPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJNb2RlbEFwaSh0d2Vha0lkOiBzdHJpbmcpOiBOb25OdWxsYWJsZTxUd2Vha0FwaVtcIm1vZGVsXCJdPiB7XG4gIHJldHVybiB7XG4gICAgZ2VuZXJhdGVUZXh0OiAob3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDptb2RlbC1nZW5lcmF0ZS10ZXh0XCIsXG4gICAgICAgIHR3ZWFrSWQsXG4gICAgICAgIG9wdGlvbnMsXG4gICAgICApIGFzIFByb21pc2U8Q29kZXhNb2RlbFRleHRSZXN1bHQ+LFxuICAgIGdlbmVyYXRlT2JqZWN0OiA8VCA9IHVua25vd24+KG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZU9iamVjdE9wdGlvbnMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDptb2RlbC1nZW5lcmF0ZS1vYmplY3RcIixcbiAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgb3B0aW9ucyxcbiAgICAgICkgYXMgUHJvbWlzZTxDb2RleE1vZGVsT2JqZWN0UmVzdWx0PFQ+PixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJDb2RleFZpZXdSZWYoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgaWQ6IHN0cmluZyxcbiAgd2ViQ29udGVudHNJZDogbnVtYmVyLFxuICBwYXJlbnRXaW5kb3dJZDogbnVtYmVyIHwgbnVsbCxcbik6IENvZGV4Vmlld1JlZiB7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgd2ViQ29udGVudHNJZCxcbiAgICBwYXJlbnRXaW5kb3dJZCxcbiAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJzZXRCb3VuZHNcIiwgYm91bmRzKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIHNldFZpc2libGU6ICh2aXNpYmxlKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwic2V0VmlzaWJsZVwiLCB2aXNpYmxlKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGJyaW5nVG9Gcm9udDogKCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcImJyaW5nVG9Gcm9udFwiKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIGxvYWRSb3V0ZTogKHJvdXRlLCBob3N0SWQpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJsb2FkUm91dGVcIiwgcm91dGUsIGhvc3RJZCkgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBsb2FkVXJsOiAodXJsKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpjb2RleC12aWV3LWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwibG9hZFVybFwiLCB1cmwpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgZGlzcG9zZTogKCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsIHR3ZWFrSWQsIGlkLCBcImRpc3Bvc2VcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVNb2R1bGVSZWYoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgaWQ6IHN0cmluZyxcbiAga2luZDogTmF0aXZlTW9kdWxlS2luZCxcbik6IE5hdGl2ZU1vZHVsZVJlZiB7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAga2luZCxcbiAgICByZXF1ZXN0OiAobWV0aG9kLCBwYXlsb2FkLCB0aW1lb3V0TXMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDpuYXRpdmUtbW9kdWxlLXJlcXVlc3RcIixcbiAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgaWQsXG4gICAgICAgIG1ldGhvZCxcbiAgICAgICAgcGF5bG9hZCxcbiAgICAgICAgdGltZW91dE1zLFxuICAgICAgKSxcbiAgICBkaXNwb3NlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtbW9kdWxlLWRpc3Bvc2VcIiwgdHdlYWtJZCwgaWQpIGFzIFByb21pc2U8dm9pZD4sXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVyTmF0aXZlUGFuZWxSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCB3aW5kb3dJZDogbnVtYmVyIHwgbnVsbCk6IE5hdGl2ZVBhbmVsUmVmIHtcbiAgcmV0dXJuIHtcbiAgICBpZCxcbiAgICB3aW5kb3dJZCxcbiAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwicGFuZWxcIiwgaWQsIFwic2V0Qm91bmRzXCIsIGJvdW5kcykgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBzaG93OiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcInNob3dcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBoaWRlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcImhpZGVcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBkaXNwb3NlOiAoKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLCB0d2Vha0lkLCBcInBhbmVsXCIsIGlkLCBcImRpc3Bvc2VcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVWaWV3UmVmKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IE5hdGl2ZVZpZXdSZWYge1xuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIHNldEJvdW5kczogKGJvdW5kcykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWluc3RhbmNlLWNhbGxcIiwgdHdlYWtJZCwgXCJ2aWV3XCIsIGlkLCBcInNldEJvdW5kc1wiLCBib3VuZHMpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgc2V0VmlzaWJsZTogKHZpc2libGUpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsIHR3ZWFrSWQsIFwidmlld1wiLCBpZCwgXCJzZXRWaXNpYmxlXCIsIHZpc2libGUpIGFzIFByb21pc2U8dm9pZD4sXG4gICAgZGlzcG9zZTogKCkgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6bmF0aXZlLWluc3RhbmNlLWNhbGxcIiwgdHdlYWtJZCwgXCJ2aWV3XCIsIGlkLCBcImRpc3Bvc2VcIikgYXMgUHJvbWlzZTx2b2lkPixcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyZXJOYXRpdmVIZWxwZXJSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCBwaWQ6IG51bWJlcik6IE5hdGl2ZUhlbHBlclJlZiB7XG4gIHJldHVybiB7XG4gICAgaWQsXG4gICAgcGlkLFxuICAgIHNlbmQ6IChtZXNzYWdlKSA9PlxuICAgICAgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpuYXRpdmUtaGVscGVyLWNhbGxcIiwgdHdlYWtJZCwgaWQsIFwic2VuZFwiLCBtZXNzYWdlKSBhcyBQcm9taXNlPHZvaWQ+LFxuICAgIHJlcXVlc3Q6IChtZXNzYWdlLCB0aW1lb3V0TXMpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXG4gICAgICAgIFwiY29kZXhwcDpuYXRpdmUtaGVscGVyLWNhbGxcIixcbiAgICAgICAgdHdlYWtJZCxcbiAgICAgICAgaWQsXG4gICAgICAgIFwicmVxdWVzdFwiLFxuICAgICAgICBtZXNzYWdlLFxuICAgICAgICB0aW1lb3V0TXMsXG4gICAgICApLFxuICAgIHN0b3A6ICgpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOm5hdGl2ZS1oZWxwZXItY2FsbFwiLCB0d2Vha0lkLCBpZCwgXCJzdG9wXCIpIGFzIFByb21pc2U8dm9pZD4sXG4gIH07XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVyRWxlY3Ryb25CcmlkZ2UoKTogRWxlY3Ryb25CcmlkZ2UgfCBudWxsIHtcbiAgY29uc3QgdmFsdWUgPSAod2luZG93IGFzIHVua25vd24gYXMgeyBlbGVjdHJvbkJyaWRnZT86IHVua25vd24gfSkuZWxlY3Ryb25CcmlkZ2U7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZSBhcyBFbGVjdHJvbkJyaWRnZSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlcmVyU3RvcmFnZShpZDogc3RyaW5nKSB7XG4gIGNvbnN0IGtleSA9IGBjb2RleHBwOnN0b3JhZ2U6JHtpZH1gO1xuICBjb25zdCByZWFkID0gKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KSA/PyBcInt9XCIpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfTtcbiAgY29uc3Qgd3JpdGUgPSAodjogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeSh2KSk7XG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4oazogc3RyaW5nLCBkPzogVCkgPT4gKGsgaW4gcmVhZCgpID8gKHJlYWQoKVtrXSBhcyBUKSA6IChkIGFzIFQpKSxcbiAgICBzZXQ6IChrOiBzdHJpbmcsIHY6IHVua25vd24pID0+IHtcbiAgICAgIGNvbnN0IG8gPSByZWFkKCk7XG4gICAgICBvW2tdID0gdjtcbiAgICAgIHdyaXRlKG8pO1xuICAgIH0sXG4gICAgZGVsZXRlOiAoazogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBvID0gcmVhZCgpO1xuICAgICAgZGVsZXRlIG9ba107XG4gICAgICB3cml0ZShvKTtcbiAgICB9LFxuICAgIGFsbDogKCkgPT4gcmVhZCgpLFxuICB9O1xufVxuXG5mdW5jdGlvbiByZW5kZXJlckZzKGlkOiBzdHJpbmcsIF9wYXRoczogVXNlclBhdGhzKSB7XG4gIC8vIFNhbmRib3hlZCByZW5kZXJlciBjYW4ndCB1c2UgTm9kZSBmcyBkaXJlY3RseSBcdTIwMTQgcHJveHkgdGhyb3VnaCBtYWluIElQQy5cbiAgcmV0dXJuIHtcbiAgICBkYXRhRGlyOiBgPHJlbW90ZT4vdHdlYWstZGF0YS8ke2lkfWAsXG4gICAgcmVhZDogKHA6IHN0cmluZykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dHdlYWstZnNcIiwgXCJyZWFkXCIsIGlkLCBwKSBhcyBQcm9taXNlPHN0cmluZz4sXG4gICAgd3JpdGU6IChwOiBzdHJpbmcsIGM6IHN0cmluZykgPT5cbiAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6dHdlYWstZnNcIiwgXCJ3cml0ZVwiLCBpZCwgcCwgYykgYXMgUHJvbWlzZTx2b2lkPixcbiAgICBleGlzdHM6IChwOiBzdHJpbmcpID0+XG4gICAgICBpcGNSZW5kZXJlci5pbnZva2UoXCJjb2RleHBwOnR3ZWFrLWZzXCIsIFwiZXhpc3RzXCIsIGlkLCBwKSBhcyBQcm9taXNlPGJvb2xlYW4+LFxuICB9O1xufVxuIiwgImludGVyZmFjZSBFbGVtZW50V2FpdGVyIHtcbiAgc2VsZWN0b3I6IHN0cmluZztcbiAgcmVzb2x2ZTogKGVsOiBFbGVtZW50KSA9PiB2b2lkO1xuICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQ7XG4gIHRpbWVyOiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0Pjtcbn1cblxuY29uc3QgZWxlbWVudFdhaXRlcnMgPSBuZXcgU2V0PEVsZW1lbnRXYWl0ZXI+KCk7XG5sZXQgb2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbmxldCBmcmFtZTogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiB3YWl0Rm9yRWxlbWVudChcbiAgc2VsZWN0b3I6IHN0cmluZyxcbiAgdGltZW91dE1zID0gNTAwMCxcbik6IFByb21pc2U8RWxlbWVudD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICByZXNvbHZlKGV4aXN0aW5nKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB3YWl0ZXI6IEVsZW1lbnRXYWl0ZXIgPSB7XG4gICAgICBzZWxlY3RvcixcbiAgICAgIHJlc29sdmUsXG4gICAgICByZWplY3QsXG4gICAgICB0aW1lcjogc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGVsZW1lbnRXYWl0ZXJzLmRlbGV0ZSh3YWl0ZXIpO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGB0aW1lb3V0IHdhaXRpbmcgZm9yICR7c2VsZWN0b3J9YCkpO1xuICAgICAgICBkaXNjb25uZWN0SWZJZGxlKCk7XG4gICAgICB9LCBNYXRoLm1heCgwLCB0aW1lb3V0TXMpKSxcbiAgICB9O1xuXG4gICAgZWxlbWVudFdhaXRlcnMuYWRkKHdhaXRlcik7XG4gICAgZW5zdXJlT2JzZXJ2ZXIoKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5jZWxBbGxFbGVtZW50V2FpdGVycyhyZWFzb246IHN0cmluZyk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHdhaXRlciBvZiBBcnJheS5mcm9tKGVsZW1lbnRXYWl0ZXJzKSkge1xuICAgIGNsZWFyVGltZW91dCh3YWl0ZXIudGltZXIpO1xuICAgIGVsZW1lbnRXYWl0ZXJzLmRlbGV0ZSh3YWl0ZXIpO1xuICAgIHdhaXRlci5yZWplY3QobmV3IEVycm9yKGAke3JlYXNvbn06ICR7d2FpdGVyLnNlbGVjdG9yfWApKTtcbiAgfVxuICBkaXNjb25uZWN0SWZJZGxlKCk7XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU9ic2VydmVyKCk6IHZvaWQge1xuICBpZiAob2JzZXJ2ZXIpIHJldHVybjtcbiAgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgc2NoZWR1bGVDaGVjaygpO1xuICB9KTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xufVxuXG5mdW5jdGlvbiBzY2hlZHVsZUNoZWNrKCk6IHZvaWQge1xuICBpZiAoZnJhbWUgIT09IG51bGwpIHJldHVybjtcbiAgZnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgIGZyYW1lID0gbnVsbDtcbiAgICBjaGVja1dhaXRlcnMoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNoZWNrV2FpdGVycygpOiB2b2lkIHtcbiAgZm9yIChjb25zdCB3YWl0ZXIgb2YgQXJyYXkuZnJvbShlbGVtZW50V2FpdGVycykpIHtcbiAgICBjb25zdCBlbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iod2FpdGVyLnNlbGVjdG9yKTtcbiAgICBpZiAoIWVsKSBjb250aW51ZTtcbiAgICBjbGVhclRpbWVvdXQod2FpdGVyLnRpbWVyKTtcbiAgICBlbGVtZW50V2FpdGVycy5kZWxldGUod2FpdGVyKTtcbiAgICB3YWl0ZXIucmVzb2x2ZShlbCk7XG4gIH1cbiAgZGlzY29ubmVjdElmSWRsZSgpO1xufVxuXG5mdW5jdGlvbiBkaXNjb25uZWN0SWZJZGxlKCk6IHZvaWQge1xuICBpZiAoZWxlbWVudFdhaXRlcnMuc2l6ZSA+IDApIHJldHVybjtcbiAgaWYgKGZyYW1lICE9PSBudWxsKSB7XG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICAgIGZyYW1lID0gbnVsbDtcbiAgfVxuICBvYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICBvYnNlcnZlciA9IG51bGw7XG59XG4iLCAiZXhwb3J0IGludGVyZmFjZSBUd2Vha01vZHVsZUxvYWRlck9wdGlvbnMge1xuICBtYW5pZmVzdElkOiBzdHJpbmc7XG4gIGVudHJ5OiBzdHJpbmc7XG4gIGRpcjogc3RyaW5nO1xuICByZWFkU291cmNlOiAoZmlsZW5hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xuICBmYWxsYmFja1JlcXVpcmU/OiAocmVxdWVzdDogc3RyaW5nKSA9PiB1bmtub3duO1xuICBjb25zb2xlPzogQ29uc29sZTtcbn1cblxuaW50ZXJmYWNlIFR3ZWFrTW9kdWxlUmVjb3JkIHtcbiAgaWQ6IHN0cmluZztcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgZGlybmFtZTogc3RyaW5nO1xuICBleHBvcnRzOiB1bmtub3duO1xuICBsb2FkZWQ6IGJvb2xlYW47XG59XG5cbnR5cGUgVHdlYWtSZXF1aXJlID0gKChyZXF1ZXN0OiBzdHJpbmcpID0+IHVua25vd24pICYge1xuICByZXNvbHZlOiAocmVxdWVzdDogc3RyaW5nKSA9PiBzdHJpbmc7XG59O1xuXG5jb25zdCBNT0RVTEVfRklMRV9FWFRFTlNJT05TID0gW1wiLmpzXCIsIFwiLmNqc1wiLCBcIi5qc29uXCJdO1xuY29uc3QgTU9EVUxFX0lOREVYX0ZJTEVTID0gW1wiaW5kZXguanNcIiwgXCJpbmRleC5janNcIiwgXCJpbmRleC5qc29uXCJdO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVHdlYWtNb2R1bGVMb2FkZXIob3B0aW9uczogVHdlYWtNb2R1bGVMb2FkZXJPcHRpb25zKSB7XG4gIGNvbnN0IHR3ZWFrRGlyID0gbm9ybWFsaXplQWJzb2x1dGVQYXRoKG9wdGlvbnMuZGlyKTtcbiAgY29uc3QgZW50cnkgPSBub3JtYWxpemVBYnNvbHV0ZVBhdGgob3B0aW9ucy5lbnRyeSk7XG4gIGNvbnN0IG1vZHVsZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFR3ZWFrTW9kdWxlUmVjb3JkPigpO1xuXG4gIGFzc2VydEluc2lkZVR3ZWFrRGlyKHR3ZWFrRGlyLCBlbnRyeSk7XG5cbiAgY29uc3QgbG9hZE1vZHVsZSA9IChmaWxlbmFtZTogc3RyaW5nLCBzb3VyY2VPdmVycmlkZT86IHN0cmluZyk6IHVua25vd24gPT4ge1xuICAgIGNvbnN0IHJlc29sdmVkID0gbm9ybWFsaXplQWJzb2x1dGVQYXRoKGZpbGVuYW1lKTtcbiAgICBhc3NlcnRJbnNpZGVUd2Vha0Rpcih0d2Vha0RpciwgcmVzb2x2ZWQpO1xuXG4gICAgY29uc3QgZXhpc3RpbmcgPSBtb2R1bGVDYWNoZS5nZXQocmVzb2x2ZWQpO1xuICAgIGlmIChleGlzdGluZykgcmV0dXJuIGV4aXN0aW5nLmV4cG9ydHM7XG5cbiAgICBpZiAocmVzb2x2ZWQuZW5kc1dpdGgoXCIuanNvblwiKSkge1xuICAgICAgY29uc3Qgc291cmNlID0gc291cmNlT3ZlcnJpZGUgPz8gb3B0aW9ucy5yZWFkU291cmNlKHJlc29sdmVkKTtcbiAgICAgIGNvbnN0IG1vZHVsZSA9IGNyZWF0ZU1vZHVsZVJlY29yZChyZXNvbHZlZCwgSlNPTi5wYXJzZShzb3VyY2UpIGFzIHVua25vd24pO1xuICAgICAgbW9kdWxlLmxvYWRlZCA9IHRydWU7XG4gICAgICBtb2R1bGVDYWNoZS5zZXQocmVzb2x2ZWQsIG1vZHVsZSk7XG4gICAgICByZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gICAgfVxuXG4gICAgY29uc3QgbW9kdWxlID0gY3JlYXRlTW9kdWxlUmVjb3JkKHJlc29sdmVkLCB7fSk7XG4gICAgbW9kdWxlQ2FjaGUuc2V0KHJlc29sdmVkLCBtb2R1bGUpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHNvdXJjZU92ZXJyaWRlID8/IG9wdGlvbnMucmVhZFNvdXJjZShyZXNvbHZlZCk7XG4gICAgY29uc3QgbG9jYWxSZXF1aXJlID0gbWFrZVJlcXVpcmUocmVzb2x2ZWQpO1xuXG4gICAgdHJ5IHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8taW1wbGllZC1ldmFsLCBuby1uZXctZnVuY1xuICAgICAgY29uc3QgZm4gPSBuZXcgRnVuY3Rpb24oXG4gICAgICAgIFwibW9kdWxlXCIsXG4gICAgICAgIFwiZXhwb3J0c1wiLFxuICAgICAgICBcInJlcXVpcmVcIixcbiAgICAgICAgXCJfX2ZpbGVuYW1lXCIsXG4gICAgICAgIFwiX19kaXJuYW1lXCIsXG4gICAgICAgIFwiY29uc29sZVwiLFxuICAgICAgICBgJHtzb3VyY2V9XFxuLy8jIHNvdXJjZVVSTD0ke3NvdXJjZVVybChvcHRpb25zLm1hbmlmZXN0SWQsIHJlc29sdmVkKX1gLFxuICAgICAgKTtcbiAgICAgIGZuKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIGxvY2FsUmVxdWlyZSwgcmVzb2x2ZWQsIG1vZHVsZS5kaXJuYW1lLCBvcHRpb25zLmNvbnNvbGUgPz8gY29uc29sZSk7XG4gICAgICBtb2R1bGUubG9hZGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbW9kdWxlQ2FjaGUuZGVsZXRlKHJlc29sdmVkKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCByZXNvbHZlTW9kdWxlID0gKHJlcXVlc3Q6IHN0cmluZywgcGFyZW50RmlsZW5hbWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gICAgaWYgKCFpc1JlbGF0aXZlUmVxdWVzdChyZXF1ZXN0KSkge1xuICAgICAgaWYgKG9wdGlvbnMuZmFsbGJhY2tSZXF1aXJlKSByZXR1cm4gcmVxdWVzdDtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYFJlbmRlcmVyIHR3ZWFrIHJlcXVpcmUgb25seSBzdXBwb3J0cyByZWxhdGl2ZSBmaWxlczsgYnVuZGxlIGRlcGVuZGVuY3kgXCIke3JlcXVlc3R9XCIgaW50byB0aGUgdHdlYWsgZW50cnlgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBiYXNlID0gZGlybmFtZVBhdGgocGFyZW50RmlsZW5hbWUpO1xuICAgIGNvbnN0IHRhcmdldCA9IG5vcm1hbGl6ZUFic29sdXRlUGF0aChqb2luUGF0aChiYXNlLCByZXF1ZXN0KSk7XG4gICAgYXNzZXJ0SW5zaWRlVHdlYWtEaXIodHdlYWtEaXIsIHRhcmdldCk7XG5cbiAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBtb2R1bGVDYW5kaWRhdGVzKHRhcmdldCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9wdGlvbnMucmVhZFNvdXJjZShjYW5kaWRhdGUpO1xuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIFRyeSB0aGUgbmV4dCBDb21tb25KUyBjYW5kaWRhdGUuXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgZmluZCBtb2R1bGUgXCIke3JlcXVlc3R9XCIgZnJvbSAke3BhcmVudEZpbGVuYW1lfWApO1xuICB9O1xuXG4gIGNvbnN0IG1ha2VSZXF1aXJlID0gKHBhcmVudEZpbGVuYW1lOiBzdHJpbmcpOiBUd2Vha1JlcXVpcmUgPT4ge1xuICAgIGNvbnN0IHJlcXVpcmVGbiA9ICgocmVxdWVzdDogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoIWlzUmVsYXRpdmVSZXF1ZXN0KHJlcXVlc3QpKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmZhbGxiYWNrUmVxdWlyZSkgcmV0dXJuIG9wdGlvbnMuZmFsbGJhY2tSZXF1aXJlKHJlcXVlc3QpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFJlbmRlcmVyIHR3ZWFrIHJlcXVpcmUgb25seSBzdXBwb3J0cyByZWxhdGl2ZSBmaWxlczsgYnVuZGxlIGRlcGVuZGVuY3kgXCIke3JlcXVlc3R9XCIgaW50byB0aGUgdHdlYWsgZW50cnlgLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY29uc3QgZmlsZW5hbWUgPSByZXNvbHZlTW9kdWxlKHJlcXVlc3QsIHBhcmVudEZpbGVuYW1lKTtcbiAgICAgIHJldHVybiBsb2FkTW9kdWxlKGZpbGVuYW1lKTtcbiAgICB9KSBhcyBUd2Vha1JlcXVpcmU7XG4gICAgcmVxdWlyZUZuLnJlc29sdmUgPSAocmVxdWVzdDogc3RyaW5nKSA9PiByZXNvbHZlTW9kdWxlKHJlcXVlc3QsIHBhcmVudEZpbGVuYW1lKTtcbiAgICByZXR1cm4gcmVxdWlyZUZuO1xuICB9O1xuXG4gIHJldHVybiB7XG4gICAgbG9hZEVudHJ5KHNvdXJjZU92ZXJyaWRlPzogc3RyaW5nKTogdW5rbm93biB7XG4gICAgICByZXR1cm4gbG9hZE1vZHVsZShlbnRyeSwgc291cmNlT3ZlcnJpZGUpO1xuICAgIH0sXG5cbiAgICByZXNvbHZlKHJlcXVlc3Q6IHN0cmluZywgcGFyZW50RmlsZW5hbWUgPSBlbnRyeSk6IHN0cmluZyB7XG4gICAgICByZXR1cm4gcmVzb2x2ZU1vZHVsZShyZXF1ZXN0LCBwYXJlbnRGaWxlbmFtZSk7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTW9kdWxlUmVjb3JkKGZpbGVuYW1lOiBzdHJpbmcsIGV4cG9ydHM6IHVua25vd24pOiBUd2Vha01vZHVsZVJlY29yZCB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGZpbGVuYW1lLFxuICAgIGZpbGVuYW1lLFxuICAgIGRpcm5hbWU6IGRpcm5hbWVQYXRoKGZpbGVuYW1lKSxcbiAgICBleHBvcnRzLFxuICAgIGxvYWRlZDogZmFsc2UsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1vZHVsZUNhbmRpZGF0ZXModGFyZ2V0OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IGV4dCA9IGV4dGVuc2lvbk9mKHRhcmdldCk7XG4gIGlmIChleHQpIHJldHVybiBbdGFyZ2V0XTtcbiAgcmV0dXJuIFtcbiAgICB0YXJnZXQsXG4gICAgLi4uTU9EVUxFX0ZJTEVfRVhURU5TSU9OUy5tYXAoKGV4dGVuc2lvbikgPT4gYCR7dGFyZ2V0fSR7ZXh0ZW5zaW9ufWApLFxuICAgIC4uLk1PRFVMRV9JTkRFWF9GSUxFUy5tYXAoKGZpbGUpID0+IGAke3RhcmdldH0vJHtmaWxlfWApLFxuICBdO1xufVxuXG5mdW5jdGlvbiBpc1JlbGF0aXZlUmVxdWVzdChyZXF1ZXN0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHJlcXVlc3QgPT09IFwiLlwiIHx8IHJlcXVlc3QgPT09IFwiLi5cIiB8fCByZXF1ZXN0LnN0YXJ0c1dpdGgoXCIuL1wiKSB8fCByZXF1ZXN0LnN0YXJ0c1dpdGgoXCIuLi9cIik7XG59XG5cbmZ1bmN0aW9uIHNvdXJjZVVybChtYW5pZmVzdElkOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYGNvZGV4cHAtdHdlYWs6Ly8ke2VuY29kZVVSSUNvbXBvbmVudChtYW5pZmVzdElkKX0vJHtlbmNvZGVVUklDb21wb25lbnQoZmlsZW5hbWUpfWA7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEluc2lkZVR3ZWFrRGlyKHR3ZWFrRGlyOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKCFpc1BhdGhJbnNpZGVPckVxdWFsKHR3ZWFrRGlyLCBmaWxlbmFtZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwYXRoIG91dHNpZGUgdHdlYWsgZGlyXCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzUGF0aEluc2lkZU9yRXF1YWwocGFyZW50OiBzdHJpbmcsIGNoaWxkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50UGF0aCA9IG5vcm1hbGl6ZUZvckNvbXBhcmUocGFyZW50KTtcbiAgY29uc3QgY2hpbGRQYXRoID0gbm9ybWFsaXplRm9yQ29tcGFyZShjaGlsZCk7XG4gIHJldHVybiBjaGlsZFBhdGggPT09IHBhcmVudFBhdGggfHwgY2hpbGRQYXRoLnN0YXJ0c1dpdGgoYCR7cGFyZW50UGF0aH0vYCk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZvckNvbXBhcmUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVBYnNvbHV0ZVBhdGgodmFsdWUpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiAvXltBLVphLXpdOlxcLy8udGVzdChub3JtYWxpemVkKSA/IG5vcm1hbGl6ZWQudG9Mb3dlckNhc2UoKSA6IG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUFic29sdXRlUGF0aChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3Qgbm9ybWFsaXplZCA9IFN0cmluZyhpbnB1dCB8fCBcIlwiKS5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKTtcbiAgbGV0IHByZWZpeCA9IFwiXCI7XG4gIGxldCByZXN0ID0gbm9ybWFsaXplZDtcblxuICBjb25zdCBkcml2ZU1hdGNoID0gcmVzdC5tYXRjaCgvXihbQS1aYS16XTopKD86XFwvfCQpLyk7XG4gIGlmIChkcml2ZU1hdGNoKSB7XG4gICAgcHJlZml4ID0gZHJpdmVNYXRjaFsxXSA/PyBcIlwiO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKHByZWZpeC5sZW5ndGgpO1xuICB9IGVsc2UgaWYgKHJlc3Quc3RhcnRzV2l0aChcIi9cIikpIHtcbiAgICBwcmVmaXggPSBcIi9cIjtcbiAgICByZXN0ID0gcmVzdC5zbGljZSgxKTtcbiAgfVxuXG4gIGNvbnN0IHBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICBmb3IgKGNvbnN0IHBhcnQgb2YgcmVzdC5zcGxpdChcIi9cIikpIHtcbiAgICBpZiAoIXBhcnQgfHwgcGFydCA9PT0gXCIuXCIpIGNvbnRpbnVlO1xuICAgIGlmIChwYXJ0ID09PSBcIi4uXCIpIHtcbiAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiAwKSBwYXJ0cy5wb3AoKTtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwicGF0aCB0cmF2ZXJzYWxcIik7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgcGFydHMucHVzaChwYXJ0KTtcbiAgfVxuXG4gIGlmIChwcmVmaXggPT09IFwiL1wiKSByZXR1cm4gYC8ke3BhcnRzLmpvaW4oXCIvXCIpfWA7XG4gIGlmIChwcmVmaXgpIHJldHVybiBgJHtwcmVmaXh9LyR7cGFydHMuam9pbihcIi9cIil9YC5yZXBsYWNlKC9cXC8kLywgXCIvXCIpO1xuICByZXR1cm4gcGFydHMuam9pbihcIi9cIik7XG59XG5cbmZ1bmN0aW9uIGpvaW5QYXRoKGJhc2U6IHN0cmluZywgcmVxdWVzdDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke2Jhc2UucmVwbGFjZSgvXFwvKyQvLCBcIlwiKX0vJHtyZXF1ZXN0fWA7XG59XG5cbmZ1bmN0aW9uIGRpcm5hbWVQYXRoKGZpbGVuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQWJzb2x1dGVQYXRoKGZpbGVuYW1lKTtcbiAgY29uc3QgaW5kZXggPSBub3JtYWxpemVkLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgaWYgKGluZGV4IDw9IDApIHJldHVybiBub3JtYWxpemVkLnN0YXJ0c1dpdGgoXCIvXCIpID8gXCIvXCIgOiBcIi5cIjtcbiAgcmV0dXJuIG5vcm1hbGl6ZWQuc2xpY2UoMCwgaW5kZXgpO1xufVxuXG5mdW5jdGlvbiBleHRlbnNpb25PZihmaWxlbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgYmFzZW5hbWUgPSBmaWxlbmFtZS5zbGljZShmaWxlbmFtZS5sYXN0SW5kZXhPZihcIi9cIikgKyAxKTtcbiAgY29uc3QgaW5kZXggPSBiYXNlbmFtZS5sYXN0SW5kZXhPZihcIi5cIik7XG4gIHJldHVybiBpbmRleCA+IDAgPyBiYXNlbmFtZS5zbGljZShpbmRleCkgOiBcIlwiO1xufVxuIiwgImltcG9ydCB0eXBlIHtcbiAgQ29kZXhTaWRlYmFyQWN0aW9uT3B0aW9ucyxcbiAgQ29kZXhTaWRlYmFyQWN0aW9uUmVmLFxuICBDb2RleFNpZGViYXJBY3Rpb25VcGRhdGUsXG4gIENvZGV4U2lkZWJhckFwaSxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuaW50ZXJmYWNlIFNpZGViYXJBY3Rpb25SZWNvcmQge1xuICB0d2Vha0lkOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIGtleTogc3RyaW5nO1xuICBvcHRpb25zOiBSZXF1aXJlZDxQaWNrPENvZGV4U2lkZWJhckFjdGlvbk9wdGlvbnMsIFwiaWRcIiB8IFwibGFiZWxcIiB8IFwidG9vbHRpcFwiIHwgXCJwbGFjZW1lbnRcIiB8IFwib3JkZXJcIiB8IFwiYWN0aXZlXCI+PiAmXG4gICAgUGljazxDb2RleFNpZGViYXJBY3Rpb25PcHRpb25zLCBcImljb25TdmdcIiB8IFwib25DbGlja1wiPjtcbiAgbm9kZTogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBsaXN0ZW5lcjogKChldmVudDogTW91c2VFdmVudCkgPT4gdm9pZCkgfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgU2lkZWJhclNsb3Qge1xuICBjb250YWluZXI6IEhUTUxFbGVtZW50O1xuICB0ZW1wbGF0ZTogSFRNTEVsZW1lbnQ7XG4gIGluc2VydEJlZm9yZTogSFRNTEVsZW1lbnQgfCBudWxsO1xuICBpbnNlcnRBZnRlcjogSFRNTEVsZW1lbnQgfCBudWxsO1xufVxuXG5pbnRlcmZhY2UgTXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50IHtcbiAgY2xhc3NOYW1lOiBzdHJpbmc7XG4gIGFyaWFDdXJyZW50OiBzdHJpbmcgfCBudWxsO1xuICBhcmlhU2VsZWN0ZWQ6IHN0cmluZyB8IG51bGw7XG4gIGRhdGFTdGF0ZTogc3RyaW5nIHwgbnVsbDtcbiAgZGF0YUFjdGl2ZTogc3RyaW5nIHwgbnVsbDtcbiAgZGF0YVNlbGVjdGVkOiBzdHJpbmcgfCBudWxsO1xufVxuXG5jb25zdCBNQUlOX1NJREVCQVJfQUNUSU9OX0xBQkVMUyA9IFtcbiAgXCJOZXcgY2hhdFwiLFxuICBcIlF1aWNrIGNoYXRcIixcbiAgXCJTZWFyY2hcIixcbiAgXCJQbHVnaW5zXCIsXG4gIFwiQXV0b21hdGlvbnNcIixcbiAgXCJBdXRvbWF0aW9uXCIsXG5dLm1hcChub3JtYWxpemVMYWJlbCk7XG5cbmNvbnN0IHJlY29yZHMgPSBuZXcgTWFwPHN0cmluZywgU2lkZWJhckFjdGlvblJlY29yZD4oKTtcbmNvbnN0IG11dGVkTmF0aXZlQWN0aXZlRWxlbWVudHMgPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBNdXRlZE5hdGl2ZUFjdGl2ZUVsZW1lbnQ+KCk7XG5sZXQgb2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbmxldCBkZWxlZ2F0ZWRFdmVudHNJbnN0YWxsZWQgPSBmYWxzZTtcbmxldCByZWZyZXNoVGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJlclNpZGViYXJBcGkodHdlYWtJZDogc3RyaW5nKTogQ29kZXhTaWRlYmFyQXBpIHtcbiAgcmV0dXJuIHtcbiAgICByZWdpc3RlckFjdGlvbihvcHRpb25zKSB7XG4gICAgICByZXR1cm4gcmVnaXN0ZXJTaWRlYmFyQWN0aW9uKHR3ZWFrSWQsIG9wdGlvbnMpO1xuICAgIH0sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNwb3NlU2lkZWJhckFjdGlvbnNGb3JUd2Vhayh0d2Vha0lkOiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChjb25zdCByZWNvcmQgb2YgQXJyYXkuZnJvbShyZWNvcmRzLnZhbHVlcygpKSkge1xuICAgIGlmIChyZWNvcmQudHdlYWtJZCA9PT0gdHdlYWtJZCkgZGlzcG9zZVJlY29yZChyZWNvcmQpO1xuICB9XG4gIHN0b3BPYnNlcnZlcklmSWRsZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJTaWRlYmFyQWN0aW9uKFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIG9wdGlvbnM6IENvZGV4U2lkZWJhckFjdGlvbk9wdGlvbnMsXG4pOiBDb2RleFNpZGViYXJBY3Rpb25SZWYge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplT3B0aW9ucyhvcHRpb25zKTtcbiAgY29uc3Qga2V5ID0gYCR7dHdlYWtJZH06JHtub3JtYWxpemVkLmlkfWA7XG4gIGNvbnN0IGV4aXN0aW5nID0gcmVjb3Jkcy5nZXQoa2V5KTtcbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgZXhpc3Rpbmcub3B0aW9ucyA9IG5vcm1hbGl6ZWQ7XG4gICAgcmVuZGVyUmVjb3JkKGV4aXN0aW5nKTtcbiAgICBzeW5jTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG4gICAgcmV0dXJuIGFjdGlvblJlZihleGlzdGluZyk7XG4gIH1cblxuICBjb25zdCByZWNvcmQ6IFNpZGViYXJBY3Rpb25SZWNvcmQgPSB7XG4gICAgdHdlYWtJZCxcbiAgICBpZDogbm9ybWFsaXplZC5pZCxcbiAgICBrZXksXG4gICAgb3B0aW9uczogbm9ybWFsaXplZCxcbiAgICBub2RlOiBudWxsLFxuICAgIGxpc3RlbmVyOiBudWxsLFxuICB9O1xuICByZWNvcmRzLnNldChrZXksIHJlY29yZCk7XG4gIGVuc3VyZU9ic2VydmVyKCk7XG4gIHNjaGVkdWxlU2lkZWJhclJlZnJlc2goKTtcbiAgcmV0dXJuIGFjdGlvblJlZihyZWNvcmQpO1xufVxuXG5mdW5jdGlvbiBhY3Rpb25SZWYocmVjb3JkOiBTaWRlYmFyQWN0aW9uUmVjb3JkKTogQ29kZXhTaWRlYmFyQWN0aW9uUmVmIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogcmVjb3JkLmlkLFxuICAgIHVwZGF0ZSh1cGRhdGU6IENvZGV4U2lkZWJhckFjdGlvblVwZGF0ZSkge1xuICAgICAgY29uc3QgbWVyZ2VkID0gbm9ybWFsaXplT3B0aW9ucyh7IC4uLnJlY29yZC5vcHRpb25zLCAuLi51cGRhdGUsIGlkOiByZWNvcmQuaWQgfSk7XG4gICAgICByZWNvcmQub3B0aW9ucyA9IG1lcmdlZDtcbiAgICAgIHJlbmRlclJlY29yZChyZWNvcmQpO1xuICAgICAgc3luY05hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xuICAgICAgc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCgpO1xuICAgIH0sXG4gICAgc2V0QWN0aXZlKGFjdGl2ZSkge1xuICAgICAgcmVjb3JkLm9wdGlvbnMgPSB7IC4uLnJlY29yZC5vcHRpb25zLCBhY3RpdmUgfTtcbiAgICAgIHJlbmRlclJlY29yZChyZWNvcmQpO1xuICAgICAgc3luY05hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xuICAgIH0sXG4gICAgZGlzcG9zZSgpIHtcbiAgICAgIGRpc3Bvc2VSZWNvcmQocmVjb3JkKTtcbiAgICAgIHN0b3BPYnNlcnZlcklmSWRsZSgpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZU9wdGlvbnMob3B0aW9uczogQ29kZXhTaWRlYmFyQWN0aW9uT3B0aW9ucyk6IFNpZGViYXJBY3Rpb25SZWNvcmRbXCJvcHRpb25zXCJdIHtcbiAgY29uc3QgaWQgPSBjbGVhblN0cmluZyhvcHRpb25zLmlkKTtcbiAgY29uc3QgbGFiZWwgPSBjbGVhblN0cmluZyhvcHRpb25zLmxhYmVsKTtcbiAgaWYgKCFpZCkgdGhyb3cgbmV3IEVycm9yKFwic2lkZWJhciBhY3Rpb24gaWQgaXMgcmVxdWlyZWRcIik7XG4gIGlmICghbGFiZWwpIHRocm93IG5ldyBFcnJvcihcInNpZGViYXIgYWN0aW9uIGxhYmVsIGlzIHJlcXVpcmVkXCIpO1xuICByZXR1cm4ge1xuICAgIGlkLFxuICAgIGxhYmVsLFxuICAgIHRvb2x0aXA6IGNsZWFuU3RyaW5nKG9wdGlvbnMudG9vbHRpcCkgfHwgbGFiZWwsXG4gICAgcGxhY2VtZW50OiBvcHRpb25zLnBsYWNlbWVudCA9PT0gXCJzdGFydFwiID8gXCJzdGFydFwiIDogXCJlbmRcIixcbiAgICBvcmRlcjogTnVtYmVyLmlzRmluaXRlKG9wdGlvbnMub3JkZXIpID8gTnVtYmVyKG9wdGlvbnMub3JkZXIpIDogNTAsXG4gICAgYWN0aXZlOiBvcHRpb25zLmFjdGl2ZSA9PT0gdHJ1ZSxcbiAgICBpY29uU3ZnOiBjbGVhblN0cmluZyhvcHRpb25zLmljb25TdmcpIHx8IHVuZGVmaW5lZCxcbiAgICBvbkNsaWNrOiBvcHRpb25zLm9uQ2xpY2ssXG4gIH07XG59XG5cbmZ1bmN0aW9uIGVuc3VyZU9ic2VydmVyKCk6IHZvaWQge1xuICBpZiAob2JzZXJ2ZXIgfHwgdHlwZW9mIGRvY3VtZW50ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm47XG4gIG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4gc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCgpKTtcbiAgb2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCBzY2hlZHVsZVNpZGViYXJSZWZyZXNoLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gIGVuc3VyZURlbGVnYXRlZFNpZGViYXJFdmVudHMoKTtcbn1cblxuZnVuY3Rpb24gc3RvcE9ic2VydmVySWZJZGxlKCk6IHZvaWQge1xuICBpZiAocmVjb3Jkcy5zaXplID4gMCkgcmV0dXJuO1xuICBvYnNlcnZlcj8uZGlzY29ubmVjdCgpO1xuICBvYnNlcnZlciA9IG51bGw7XG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHNjaGVkdWxlU2lkZWJhclJlZnJlc2gpO1xuICByZW1vdmVEZWxlZ2F0ZWRTaWRlYmFyRXZlbnRzKCk7XG4gIGlmIChyZWZyZXNoVGltZXIpIHtcbiAgICBjbGVhclRpbWVvdXQocmVmcmVzaFRpbWVyKTtcbiAgICByZWZyZXNoVGltZXIgPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVuc3VyZURlbGVnYXRlZFNpZGViYXJFdmVudHMoKTogdm9pZCB7XG4gIGlmIChkZWxlZ2F0ZWRFdmVudHNJbnN0YWxsZWQgfHwgdHlwZW9mIGRvY3VtZW50ID09PSBcInVuZGVmaW5lZFwiKSByZXR1cm47XG4gIGRlbGVnYXRlZEV2ZW50c0luc3RhbGxlZCA9IHRydWU7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkRlbGVnYXRlZFNpZGViYXJBY3Rpb25DbGljaywgdHJ1ZSk7XG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbktleWRvd24sIHRydWUpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVEZWxlZ2F0ZWRTaWRlYmFyRXZlbnRzKCk6IHZvaWQge1xuICBpZiAoIWRlbGVnYXRlZEV2ZW50c0luc3RhbGxlZCB8fCB0eXBlb2YgZG9jdW1lbnQgPT09IFwidW5kZWZpbmVkXCIpIHJldHVybjtcbiAgZGVsZWdhdGVkRXZlbnRzSW5zdGFsbGVkID0gZmFsc2U7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBvbkRlbGVnYXRlZFNpZGViYXJBY3Rpb25DbGljaywgdHJ1ZSk7XG4gIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbktleWRvd24sIHRydWUpO1xufVxuXG5mdW5jdGlvbiBvbkRlbGVnYXRlZFNpZGViYXJBY3Rpb25DbGljayhldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuICBjb25zdCBhY3Rpb24gPSBzaWRlYmFyQWN0aW9uTm9kZUZvckV2ZW50KGV2ZW50KTtcbiAgaWYgKCFhY3Rpb24pIHJldHVybjtcbiAgY29uc3QgcmVjb3JkID0gcmVjb3Jkcy5nZXQoYWN0aW9uLmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb24gfHwgXCJcIik7XG4gIGlmICghcmVjb3JkKSByZXR1cm47XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICB2b2lkIHJlY29yZC5vcHRpb25zLm9uQ2xpY2s/LihldmVudCk7XG59XG5cbmZ1bmN0aW9uIG9uRGVsZWdhdGVkU2lkZWJhckFjdGlvbktleWRvd24oZXZlbnQ6IEtleWJvYXJkRXZlbnQpOiB2b2lkIHtcbiAgaWYgKGV2ZW50LmtleSAhPT0gXCJFbnRlclwiICYmIGV2ZW50LmtleSAhPT0gXCIgXCIpIHJldHVybjtcbiAgY29uc3QgYWN0aW9uID0gc2lkZWJhckFjdGlvbk5vZGVGb3JFdmVudChldmVudCk7XG4gIGlmICghYWN0aW9uKSByZXR1cm47XG4gIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICBpbnRlcmFjdGl2ZVRhcmdldChhY3Rpb24pLmNsaWNrKCk7XG59XG5cbmZ1bmN0aW9uIHNpZGViYXJBY3Rpb25Ob2RlRm9yRXZlbnQoZXZlbnQ6IEV2ZW50KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgdGFyZ2V0ID0gZXZlbnRUYXJnZXRFbGVtZW50KGV2ZW50KTtcbiAgY29uc3QgYWN0aW9uID0gdGFyZ2V0Py5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zaWRlYmFyLWFjdGlvbl1cIik7XG4gIHJldHVybiBkb21FbGVtZW50KGFjdGlvbik7XG59XG5cbmZ1bmN0aW9uIGV2ZW50VGFyZ2V0RWxlbWVudChldmVudDogRXZlbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICByZXR1cm4gZG9tRWxlbWVudChldmVudC50YXJnZXQpO1xufVxuXG5mdW5jdGlvbiBkb21FbGVtZW50KHZhbHVlOiB1bmtub3duKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgIT09IFwib2JqZWN0XCIpIHJldHVybiBudWxsO1xuICBjb25zdCBlbGVtZW50ID0gdmFsdWUgYXMgSFRNTEVsZW1lbnQ7XG4gIGlmICh0eXBlb2YgZWxlbWVudC5jbG9zZXN0ICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBudWxsO1xuICBpZiAodHlwZW9mIGVsZW1lbnQuZ2V0QXR0cmlidXRlICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBudWxsO1xuICByZXR1cm4gZWxlbWVudDtcbn1cblxuZnVuY3Rpb24gc2NoZWR1bGVTaWRlYmFyUmVmcmVzaCgpOiB2b2lkIHtcbiAgaWYgKHJlZnJlc2hUaW1lcikgcmV0dXJuO1xuICByZWZyZXNoVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICByZWZyZXNoVGltZXIgPSBudWxsO1xuICAgIHJlZnJlc2hTaWRlYmFyQWN0aW9ucygpO1xuICB9LCAxMjApO1xufVxuXG5mdW5jdGlvbiByZWZyZXNoU2lkZWJhckFjdGlvbnMoKTogdm9pZCB7XG4gIGlmICghcmVjb3Jkcy5zaXplKSByZXR1cm47XG4gIGNvbnN0IHNsb3QgPSBmaW5kTWFpblNpZGViYXJBY3Rpb25TbG90KCk7XG4gIGlmICghc2xvdCkgcmV0dXJuO1xuXG4gIGNvbnN0IHNvcnRlZCA9IHNvcnRlZFJlY29yZHMoKTtcbiAgZm9yIChjb25zdCByZWNvcmQgb2Ygc29ydGVkKSB7XG4gICAgaWYgKCFyZWNvcmQubm9kZSB8fCAhcmVjb3JkLm5vZGUuaXNDb25uZWN0ZWQgfHwgcmVjb3JkLm5vZGUucGFyZW50RWxlbWVudCAhPT0gc2xvdC5jb250YWluZXIpIHtcbiAgICAgIHJlY29yZC5ub2RlPy5yZW1vdmUoKTtcbiAgICAgIHJlY29yZC5ub2RlID0gY3JlYXRlQWN0aW9uTm9kZShzbG90LnRlbXBsYXRlLCByZWNvcmQpO1xuICAgIH1cbiAgICByZW5kZXJSZWNvcmQocmVjb3JkKTtcbiAgfVxuXG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIHNvcnRlZCkge1xuICAgIGlmIChyZWNvcmQubm9kZT8ucGFyZW50RWxlbWVudCA9PT0gc2xvdC5jb250YWluZXIpIHJlY29yZC5ub2RlLnJlbW92ZSgpO1xuICB9XG5cbiAgbGV0IGFuY2hvciA9IHNsb3QuaW5zZXJ0QWZ0ZXI7XG4gIGZvciAoY29uc3QgcmVjb3JkIG9mIHNvcnRlZC5maWx0ZXIoKGl0ZW0pID0+IGl0ZW0ub3B0aW9ucy5wbGFjZW1lbnQgPT09IFwic3RhcnRcIikpIHtcbiAgICBpZiAoIXJlY29yZC5ub2RlKSBjb250aW51ZTtcbiAgICBzbG90LmNvbnRhaW5lci5pbnNlcnRCZWZvcmUocmVjb3JkLm5vZGUsIGFuY2hvciA/IGFuY2hvci5uZXh0U2libGluZyA6IHNsb3QuY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgIGFuY2hvciA9IHJlY29yZC5ub2RlO1xuICB9XG5cbiAgZm9yIChjb25zdCByZWNvcmQgb2Ygc29ydGVkLmZpbHRlcigoaXRlbSkgPT4gaXRlbS5vcHRpb25zLnBsYWNlbWVudCA9PT0gXCJlbmRcIikpIHtcbiAgICBpZiAoIXJlY29yZC5ub2RlKSBjb250aW51ZTtcbiAgICBzbG90LmNvbnRhaW5lci5pbnNlcnRCZWZvcmUocmVjb3JkLm5vZGUsIGFuY2hvciA/IGFuY2hvci5uZXh0U2libGluZyA6IHNsb3QuY29udGFpbmVyLmZpcnN0Q2hpbGQpO1xuICAgIGFuY2hvciA9IHJlY29yZC5ub2RlO1xuICB9XG5cbiAgc3luY05hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xufVxuXG5mdW5jdGlvbiBzb3J0ZWRSZWNvcmRzKCk6IFNpZGViYXJBY3Rpb25SZWNvcmRbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKHJlY29yZHMudmFsdWVzKCkpLnNvcnQoKGEsIGIpID0+XG4gICAgYS5vcHRpb25zLm9yZGVyIC0gYi5vcHRpb25zLm9yZGVyIHx8IGEua2V5LmxvY2FsZUNvbXBhcmUoYi5rZXkpLFxuICApO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVBY3Rpb25Ob2RlKHRlbXBsYXRlOiBIVE1MRWxlbWVudCwgcmVjb3JkOiBTaWRlYmFyQWN0aW9uUmVjb3JkKTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBub2RlID0gdGVtcGxhdGUuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxFbGVtZW50O1xuICBzYW5pdGl6ZUFjdGlvbk5vZGUobm9kZSk7XG4gIG5vZGUuZGF0YXNldC5jb2RleHBwU2lkZWJhckFjdGlvbiA9IHJlY29yZC5rZXk7XG4gIHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiByZW5kZXJSZWNvcmQocmVjb3JkOiBTaWRlYmFyQWN0aW9uUmVjb3JkKTogdm9pZCB7XG4gIGNvbnN0IG5vZGUgPSByZWNvcmQubm9kZTtcbiAgaWYgKCFub2RlKSByZXR1cm47XG4gIGNvbnN0IHRhcmdldCA9IGludGVyYWN0aXZlVGFyZ2V0KG5vZGUpO1xuICBub2RlLmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb24gPSByZWNvcmQua2V5O1xuICBub2RlLmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb25BY3RpdmUgPSByZWNvcmQub3B0aW9ucy5hY3RpdmUgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgaWYgKHRhcmdldCAhPT0gbm9kZSkgdGFyZ2V0LmRhdGFzZXQuY29kZXhwcFNpZGViYXJBY3Rpb25BY3RpdmUgPSByZWNvcmQub3B0aW9ucy5hY3RpdmUgPyBcInRydWVcIiA6IFwiZmFsc2VcIjtcbiAgYXBwbHlQbGFjZW1lbnRTdHlsZShub2RlLCByZWNvcmQpO1xuICB0YXJnZXQuc2V0QXR0cmlidXRlKFwiYXJpYS1sYWJlbFwiLCByZWNvcmQub3B0aW9ucy5sYWJlbCk7XG4gIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCByZWNvcmQub3B0aW9ucy50b29sdGlwKTtcbiAgdGFyZ2V0LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJidXR0b25cIik7XG4gIHRhcmdldC5zZXRBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiLCBcIjBcIik7XG4gIHNldEFjdGl2ZUF0dHJpYnV0ZXMobm9kZSwgcmVjb3JkLm9wdGlvbnMuYWN0aXZlKTtcbiAgaWYgKHRhcmdldCAhPT0gbm9kZSkgc2V0QWN0aXZlQXR0cmlidXRlcyh0YXJnZXQsIHJlY29yZC5vcHRpb25zLmFjdGl2ZSk7XG4gIGFwcGx5TmF0aXZlTGlrZUFjdGl2ZVN0eWxlKHRhcmdldCwgcmVjb3JkLm9wdGlvbnMuYWN0aXZlKTtcbiAgcmVwbGFjZUFjdGlvbkljb24obm9kZSwgcmVjb3JkLm9wdGlvbnMuaWNvblN2Zyk7XG4gIHJlcGxhY2VBY3Rpb25MYWJlbChub2RlLCByZWNvcmQub3B0aW9ucy5sYWJlbCk7XG4gIGFwcGx5TmF0aXZlTGlrZUFjdGl2ZVN0eWxlKHRhcmdldCwgcmVjb3JkLm9wdGlvbnMuYWN0aXZlKTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZVJlY29yZChyZWNvcmQ6IFNpZGViYXJBY3Rpb25SZWNvcmQpOiB2b2lkIHtcbiAgcmVjb3JkLm5vZGU/LnJlbW92ZSgpO1xuICByZWNvcmQubm9kZSA9IG51bGw7XG4gIHJlY29yZHMuZGVsZXRlKHJlY29yZC5rZXkpO1xuICBzeW5jTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKCk7XG59XG5cbmZ1bmN0aW9uIGFwcGx5UGxhY2VtZW50U3R5bGUobm9kZTogSFRNTEVsZW1lbnQsIHJlY29yZDogU2lkZWJhckFjdGlvblJlY29yZCk6IHZvaWQge1xuICBpZiAocmVjb3JkLm9wdGlvbnMucGxhY2VtZW50ID09PSBcInN0YXJ0XCIpIHtcbiAgICBub2RlLnN0eWxlLm9yZGVyID0gU3RyaW5nKC0xMDAwMCArIHJlY29yZC5vcHRpb25zLm9yZGVyKTtcbiAgfSBlbHNlIHtcbiAgICBub2RlLnN0eWxlLnJlbW92ZVByb3BlcnR5KFwib3JkZXJcIik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRNYWluU2lkZWJhckFjdGlvblNsb3Qocm9vdDogUGFyZW50Tm9kZSA9IGRvY3VtZW50KTogU2lkZWJhclNsb3QgfCBudWxsIHtcbiAgY29uc3QgYXNpZGUgPSBBcnJheS5mcm9tKHJvb3QucXVlcnlTZWxlY3RvckFsbD8uKFwiYXNpZGVcIikgPz8gW10pXG4gICAgLmZpbmQoKGNhbmRpZGF0ZSk6IGNhbmRpZGF0ZSBpcyBIVE1MRWxlbWVudCA9PiBjYW5kaWRhdGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCAmJiAhIXZpc2libGVCb3goY2FuZGlkYXRlKSk7XG4gIGlmICghYXNpZGUpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IGNvbnRyb2xzID0gdmlzaWJsZUNvbnRyb2xzKGFzaWRlKVxuICAgIC5tYXAoKGNvbnRyb2wpID0+ICh7IGNvbnRyb2wsIGxhYmVsOiBub3JtYWxpemVMYWJlbChjb250cm9sTGFiZWwoY29udHJvbCkpIH0pKVxuICAgIC5maWx0ZXIoKGl0ZW0pID0+IE1BSU5fU0lERUJBUl9BQ1RJT05fTEFCRUxTLnNvbWUoKG1hcmtlcikgPT4gbGFiZWxNYXRjaGVzKGl0ZW0ubGFiZWwsIG1hcmtlcikpKTtcbiAgaWYgKCFjb250cm9scy5sZW5ndGgpIHJldHVybiBudWxsO1xuXG4gIGNvbnN0IHNvcnRlZENvbnRyb2xzID0gY29udHJvbHNcbiAgICAubWFwKChpdGVtKSA9PiBpdGVtLmNvbnRyb2wpXG4gICAgLnNvcnQoY29tcGFyZURvY3VtZW50UG9zaXRpb24pO1xuICBjb25zdCB0ZW1wbGF0ZUNvbnRyb2wgPSBzb3J0ZWRDb250cm9sc1swXTtcbiAgaWYgKCF0ZW1wbGF0ZUNvbnRyb2wpIHJldHVybiBudWxsO1xuICBjb25zdCBncm91cCA9IGFjdGlvbkdyb3VwRm9yKGFzaWRlLCBzb3J0ZWRDb250cm9scyk7XG4gIGNvbnN0IHRlbXBsYXRlID0gcm93SW5Hcm91cChncm91cCwgdGVtcGxhdGVDb250cm9sKTtcbiAgY29uc3Qgcm93cyA9IHNvcnRlZENvbnRyb2xzLm1hcCgoY29udHJvbCkgPT4gcm93SW5Hcm91cChncm91cCwgY29udHJvbCkpLmZpbHRlcihCb29sZWFuKTtcbiAgY29uc3Qgc29ydGVkUm93cyA9IHJvd3Muc29ydChjb21wYXJlRG9jdW1lbnRQb3NpdGlvbik7XG4gIGNvbnN0IGluc2VydEJlZm9yZSA9IHNvcnRlZFJvd3NbMF0gPz8gdGVtcGxhdGU7XG4gIGNvbnN0IGluc2VydEFmdGVyID0gc29ydGVkUm93cy5hdCgtMSkgPz8gdGVtcGxhdGU7XG4gIHJldHVybiB7IGNvbnRhaW5lcjogZ3JvdXAsIHRlbXBsYXRlLCBpbnNlcnRCZWZvcmUsIGluc2VydEFmdGVyIH07XG59XG5cbmZ1bmN0aW9uIHZpc2libGVDb250cm9scyhyb290OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50W10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShyb290LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiYnV0dG9uLGEsW3JvbGU9J2J1dHRvbiddLFtyb2xlPSdsaW5rJ11cIikpXG4gICAgLmZpbHRlcigoY29udHJvbCkgPT4ge1xuICAgICAgaWYgKGNvbnRyb2wuY2xvc2VzdChcIltkYXRhLWNvZGV4cHAtc2lkZWJhci1hY3Rpb25dXCIpKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBsYWJlbCA9IGNvbnRyb2xMYWJlbChjb250cm9sKTtcbiAgICAgIGlmICghbGFiZWwpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGJveCA9IHZpc2libGVCb3goY29udHJvbCk7XG4gICAgICByZXR1cm4gISFib3g7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGFjdGlvbkdyb3VwRm9yKGFzaWRlOiBIVE1MRWxlbWVudCwgY29udHJvbHM6IEhUTUxFbGVtZW50W10pOiBIVE1MRWxlbWVudCB7XG4gIGNvbnN0IGZpcnN0ID0gY29udHJvbHNbMF07XG4gIGlmICghZmlyc3QpIHJldHVybiBhc2lkZTtcbiAgbGV0IG5vZGU6IEhUTUxFbGVtZW50IHwgbnVsbCA9IGZpcnN0LnBhcmVudEVsZW1lbnQ7XG4gIHdoaWxlIChub2RlICYmIG5vZGUgIT09IGFzaWRlKSB7XG4gICAgY29uc3QgY2hpbGRSb3dzID0gY29udHJvbHNcbiAgICAgIC5tYXAoKGNvbnRyb2wpID0+IGNoaWxkSW5Db250YWluZXIobm9kZSBhcyBIVE1MRWxlbWVudCwgY29udHJvbCkpXG4gICAgICAuZmlsdGVyKEJvb2xlYW4pO1xuICAgIGlmIChuZXcgU2V0KGNoaWxkUm93cykuc2l6ZSA+PSBNYXRoLm1pbigyLCBjb250cm9scy5sZW5ndGgpKSByZXR1cm4gbm9kZTtcbiAgICBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICB9XG4gIHJldHVybiBmaXJzdC5wYXJlbnRFbGVtZW50IHx8IGFzaWRlO1xufVxuXG5mdW5jdGlvbiByb3dJbkdyb3VwKGdyb3VwOiBIVE1MRWxlbWVudCwgY29udHJvbDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGxldCBub2RlOiBIVE1MRWxlbWVudCA9IGNvbnRyb2w7XG4gIHdoaWxlIChub2RlLnBhcmVudEVsZW1lbnQgJiYgbm9kZS5wYXJlbnRFbGVtZW50ICE9PSBncm91cCkgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgcmV0dXJuIG5vZGU7XG59XG5cbmZ1bmN0aW9uIGNoaWxkSW5Db250YWluZXIoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgY29udHJvbDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICBsZXQgbm9kZTogSFRNTEVsZW1lbnQgPSBjb250cm9sO1xuICB3aGlsZSAobm9kZS5wYXJlbnRFbGVtZW50ICYmIG5vZGUucGFyZW50RWxlbWVudCAhPT0gY29udGFpbmVyKSBub2RlID0gbm9kZS5wYXJlbnRFbGVtZW50O1xuICByZXR1cm4gbm9kZS5wYXJlbnRFbGVtZW50ID09PSBjb250YWluZXIgPyBub2RlIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gc2FuaXRpemVBY3Rpb25Ob2RlKG5vZGU6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGFsbCA9IFtub2RlLCAuLi5BcnJheS5mcm9tKG5vZGUucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCIqXCIpKV07XG4gIGZvciAoY29uc3QgZWwgb2YgYWxsKSB7XG4gICAgZm9yIChjb25zdCBhdHRyIG9mIEFycmF5LmZyb20oZWwuYXR0cmlidXRlcykpIHtcbiAgICAgIGlmIChhdHRyLm5hbWUuc3RhcnRzV2l0aChcImRhdGEtYXBwLWFjdGlvblwiKSkgZWwucmVtb3ZlQXR0cmlidXRlKGF0dHIubmFtZSk7XG4gICAgICBpZiAoYXR0ci5uYW1lID09PSBcImhyZWZcIiB8fCBhdHRyLm5hbWUgPT09IFwiYXJpYS1jdXJyZW50XCIpIGVsLnJlbW92ZUF0dHJpYnV0ZShhdHRyLm5hbWUpO1xuICAgIH1cbiAgICBpZiAoZWwgaW5zdGFuY2VvZiBIVE1MQnV0dG9uRWxlbWVudCkgZWwudHlwZSA9IFwiYnV0dG9uXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gaW50ZXJhY3RpdmVUYXJnZXQobm9kZTogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB7XG4gIGlmIChtYXRjaGVzQ29udHJvbChub2RlKSkgcmV0dXJuIG5vZGU7XG4gIHJldHVybiBub2RlLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiYnV0dG9uLGEsW3JvbGU9J2J1dHRvbiddLFtyb2xlPSdsaW5rJ11cIikgfHwgbm9kZTtcbn1cblxuZnVuY3Rpb24gbWF0Y2hlc0NvbnRyb2wobm9kZTogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIG5vZGUubWF0Y2hlcyhcImJ1dHRvbixhLFtyb2xlPSdidXR0b24nXSxbcm9sZT0nbGluayddXCIpO1xufVxuXG5mdW5jdGlvbiBzZXRBY3RpdmVBdHRyaWJ1dGVzKG5vZGU6IEhUTUxFbGVtZW50LCBhY3RpdmU6IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKGFjdGl2ZSkge1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIsIFwicGFnZVwiKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImFyaWEtc2VsZWN0ZWRcIiwgXCJ0cnVlXCIpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKFwiZGF0YS1zdGF0ZVwiLCBcImFjdGl2ZVwiKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIsIFwidHJ1ZVwiKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZShcImRhdGEtc2VsZWN0ZWRcIiwgXCJ0cnVlXCIpO1xuICB9IGVsc2Uge1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIpO1xuICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiKTtcbiAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIik7XG4gICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLWFjdGl2ZVwiKTtcbiAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc2VsZWN0ZWRcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwbHlOYXRpdmVMaWtlQWN0aXZlU3R5bGUodGFyZ2V0OiBIVE1MRWxlbWVudCwgYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IGNvbnRlbnQgPSBhY3RpdmVDb250ZW50RWxlbWVudCh0YXJnZXQpO1xuICBjb25zdCBpY29uID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3I8U1ZHRWxlbWVudD4oXCJzdmdcIik7XG4gIGlmIChhY3RpdmUpIHtcbiAgICB0YXJnZXQuY2xhc3NMaXN0LnJlbW92ZShcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xuICAgIHRhcmdldC5jbGFzc0xpc3QuYWRkKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIGNvbnRlbnQ/LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXRva2VuLWZvcmVncm91bmRcIik7XG4gICAgY29udGVudD8uY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgaWNvbj8uY2xhc3NMaXN0LmFkZChcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuY2xhc3NMaXN0LmFkZChcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xuICAgIHRhcmdldC5jbGFzc0xpc3QucmVtb3ZlKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpO1xuICAgIGNvbnRlbnQ/LmNsYXNzTGlzdC5hZGQoXCJ0ZXh0LXRva2VuLWZvcmVncm91bmRcIik7XG4gICAgY29udGVudD8uY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIik7XG4gICAgaWNvbj8uY2xhc3NMaXN0LnJlbW92ZShcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBhY3RpdmVDb250ZW50RWxlbWVudCh0YXJnZXQ6IEhUTUxFbGVtZW50KTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgdG9rZW5FbGVtZW50ID0gdGFyZ2V0LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgIFwiLnRleHQtdG9rZW4tZm9yZWdyb3VuZCwudGV4dC10b2tlbi1saXN0LWFjdGl2ZS1zZWxlY3Rpb24tZm9yZWdyb3VuZFwiLFxuICApO1xuICBpZiAodG9rZW5FbGVtZW50KSByZXR1cm4gdG9rZW5FbGVtZW50O1xuICByZXR1cm4gdGFyZ2V0LmZpcnN0RWxlbWVudENoaWxkIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgPyB0YXJnZXQuZmlyc3RFbGVtZW50Q2hpbGQgOiB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIHN5bmNOYXRpdmVTaWRlYmFyQWN0aXZlU3RhdGUoKTogdm9pZCB7XG4gIGlmIChoYXNBY3RpdmVSZWNvcmQoKSkgbXV0ZU5hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpO1xuICBlbHNlIHJlc3RvcmVOYXRpdmVTaWRlYmFyQWN0aXZlU3RhdGUoKTtcbn1cblxuZnVuY3Rpb24gaGFzQWN0aXZlUmVjb3JkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gQXJyYXkuZnJvbShyZWNvcmRzLnZhbHVlcygpKS5zb21lKChyZWNvcmQpID0+IHJlY29yZC5vcHRpb25zLmFjdGl2ZSAmJiByZWNvcmQubm9kZT8uaXNDb25uZWN0ZWQpO1xufVxuXG5mdW5jdGlvbiBtdXRlTmF0aXZlU2lkZWJhckFjdGl2ZVN0YXRlKHJvb3Q6IFBhcmVudE5vZGUgPSBkb2N1bWVudCk6IHZvaWQge1xuICBjb25zdCBhc2lkZSA9IEFycmF5LmZyb20ocm9vdC5xdWVyeVNlbGVjdG9yQWxsPy4oXCJhc2lkZVwiKSA/PyBbXSlcbiAgICAuZmluZCgoY2FuZGlkYXRlKTogY2FuZGlkYXRlIGlzIEhUTUxFbGVtZW50ID0+IGNhbmRpZGF0ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmICEhdmlzaWJsZUJveChjYW5kaWRhdGUpKTtcbiAgaWYgKCFhc2lkZSkgcmV0dXJuO1xuXG4gIGNvbnN0IGNvbnRyb2xzID0gQXJyYXkuZnJvbShcbiAgICBhc2lkZS5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcImJ1dHRvbixhLFtyb2xlPSdidXR0b24nXSxbcm9sZT0nbGluayddXCIpLFxuICApO1xuICBmb3IgKGNvbnN0IGNvbnRyb2wgb2YgY29udHJvbHMpIHtcbiAgICBpZiAoY29udHJvbC5jbG9zZXN0KFwiW2RhdGEtY29kZXhwcC1zaWRlYmFyLWFjdGlvbl1cIikpIGNvbnRpbnVlO1xuICAgIGlmICghaXNOYXRpdmVBY3RpdmVDb250cm9sKGNvbnRyb2wpKSBjb250aW51ZTtcbiAgICBtdXRlTmF0aXZlQWN0aXZlRWxlbWVudChjb250cm9sKTtcbiAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGFjdGl2ZVNlbGVjdGlvbkRlc2NlbmRhbnRzKGNvbnRyb2wpKSBtdXRlTmF0aXZlQWN0aXZlRWxlbWVudChjaGlsZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzdG9yZU5hdGl2ZVNpZGViYXJBY3RpdmVTdGF0ZSgpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBbZWxlbWVudCwgc3RhdGVdIG9mIEFycmF5LmZyb20obXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50cy5lbnRyaWVzKCkpKSB7XG4gICAgaWYgKGVsZW1lbnQuaXNDb25uZWN0ZWQpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NOYW1lID0gc3RhdGUuY2xhc3NOYW1lO1xuICAgICAgcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQsIFwiYXJpYS1jdXJyZW50XCIsIHN0YXRlLmFyaWFDdXJyZW50KTtcbiAgICAgIHJlc3RvcmVOdWxsYWJsZUF0dHJpYnV0ZShlbGVtZW50LCBcImFyaWEtc2VsZWN0ZWRcIiwgc3RhdGUuYXJpYVNlbGVjdGVkKTtcbiAgICAgIHJlc3RvcmVOdWxsYWJsZUF0dHJpYnV0ZShlbGVtZW50LCBcImRhdGEtc3RhdGVcIiwgc3RhdGUuZGF0YVN0YXRlKTtcbiAgICAgIHJlc3RvcmVOdWxsYWJsZUF0dHJpYnV0ZShlbGVtZW50LCBcImRhdGEtYWN0aXZlXCIsIHN0YXRlLmRhdGFBY3RpdmUpO1xuICAgICAgcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQsIFwiZGF0YS1zZWxlY3RlZFwiLCBzdGF0ZS5kYXRhU2VsZWN0ZWQpO1xuICAgIH1cbiAgICBtdXRlZE5hdGl2ZUFjdGl2ZUVsZW1lbnRzLmRlbGV0ZShlbGVtZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtdXRlTmF0aXZlQWN0aXZlRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBpZiAoIW11dGVkTmF0aXZlQWN0aXZlRWxlbWVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgbXV0ZWROYXRpdmVBY3RpdmVFbGVtZW50cy5zZXQoZWxlbWVudCwge1xuICAgICAgY2xhc3NOYW1lOiBlbGVtZW50LmNsYXNzTmFtZSxcbiAgICAgIGFyaWFDdXJyZW50OiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSxcbiAgICAgIGFyaWFTZWxlY3RlZDogZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpLFxuICAgICAgZGF0YVN0YXRlOiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIiksXG4gICAgICBkYXRhQWN0aXZlOiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIpLFxuICAgICAgZGF0YVNlbGVjdGVkOiBlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtc2VsZWN0ZWRcIiksXG4gICAgfSk7XG4gIH1cblxuICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKTtcbiAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJhcmlhLXNlbGVjdGVkXCIpO1xuICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIik7XG4gIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1hY3RpdmVcIik7XG4gIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1zZWxlY3RlZFwiKTtcbiAgZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKFxuICAgIFwiYWN0aXZlXCIsXG4gICAgXCJiZy10b2tlbi1saXN0LWhvdmVyLWJhY2tncm91bmRcIixcbiAgICBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWZvcmVncm91bmRcIixcbiAgICBcInRleHQtdG9rZW4tbGlzdC1hY3RpdmUtc2VsZWN0aW9uLWljb24tZm9yZWdyb3VuZFwiLFxuICApO1xuICBpZiAobWF0Y2hlc0NvbnRyb2woZWxlbWVudCkpIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImhvdmVyOmJnLXRva2VuLWxpc3QtaG92ZXItYmFja2dyb3VuZFwiLCBcImZvbnQtbm9ybWFsXCIpO1xufVxuXG5mdW5jdGlvbiBhY3RpdmVTZWxlY3Rpb25EZXNjZW5kYW50cyhjb250cm9sOiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50W10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShcbiAgICBjb250cm9sLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFxuICAgICAgXCIuYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kLC50ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1mb3JlZ3JvdW5kLC50ZXh0LXRva2VuLWxpc3QtYWN0aXZlLXNlbGVjdGlvbi1pY29uLWZvcmVncm91bmRcIixcbiAgICApLFxuICApO1xufVxuXG5mdW5jdGlvbiBpc05hdGl2ZUFjdGl2ZUNvbnRyb2woY29udHJvbDogSFRNTEVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiYXJpYS1jdXJyZW50XCIpID09PSBcInBhZ2VcIiB8fFxuICAgIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiYXJpYS1zZWxlY3RlZFwiKSA9PT0gXCJ0cnVlXCIgfHxcbiAgICBjb250cm9sLmdldEF0dHJpYnV0ZShcImRhdGEtc3RhdGVcIikgPT09IFwiYWN0aXZlXCIgfHxcbiAgICBjb250cm9sLmdldEF0dHJpYnV0ZShcImRhdGEtYWN0aXZlXCIpID09PSBcInRydWVcIiB8fFxuICAgIGNvbnRyb2wuZ2V0QXR0cmlidXRlKFwiZGF0YS1zZWxlY3RlZFwiKSA9PT0gXCJ0cnVlXCIgfHxcbiAgICBjb250cm9sLmNsYXNzTGlzdC5jb250YWlucyhcImFjdGl2ZVwiKSB8fFxuICAgIGNvbnRyb2wuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYmctdG9rZW4tbGlzdC1ob3Zlci1iYWNrZ3JvdW5kXCIpIHx8XG4gICAgYWN0aXZlU2VsZWN0aW9uRGVzY2VuZGFudHMoY29udHJvbCkubGVuZ3RoID4gMDtcbn1cblxuZnVuY3Rpb24gcmVzdG9yZU51bGxhYmxlQXR0cmlidXRlKGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfCBudWxsKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gbnVsbCkgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIGVsc2UgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlQWN0aW9uSWNvbihub2RlOiBIVE1MRWxlbWVudCwgaWNvblN2Zz86IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBzdmcgPSBwYXJzZVN2ZyhpY29uU3ZnIHx8IGRlZmF1bHRTaWRlYmFySWNvblN2ZygpKTtcbiAgY29uc3QgY3VycmVudCA9IG5vZGUucXVlcnlTZWxlY3RvcihcInN2Z1wiKTtcbiAgaWYgKGN1cnJlbnQgJiYgc3ZnKSB7XG4gICAgY29weUljb25QcmVzZW50YXRpb24oY3VycmVudCwgc3ZnKTtcbiAgICBjdXJyZW50LnJlcGxhY2VXaXRoKHN2Zyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChzdmcpIG5vZGUucHJlcGVuZChzdmcpO1xufVxuXG5mdW5jdGlvbiBjb3B5SWNvblByZXNlbnRhdGlvbihmcm9tOiBTVkdFbGVtZW50LCB0bzogU1ZHRWxlbWVudCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IGF0dHIgb2YgW1wiY2xhc3NcIiwgXCJzdHlsZVwiLCBcIndpZHRoXCIsIFwiaGVpZ2h0XCJdKSB7XG4gICAgY29uc3QgdmFsdWUgPSBmcm9tLmdldEF0dHJpYnV0ZShhdHRyKTtcbiAgICBpZiAodmFsdWUpIHRvLnNldEF0dHJpYnV0ZShhdHRyLCB2YWx1ZSk7XG4gIH1cbiAgaWYgKCF0by5nZXRBdHRyaWJ1dGUoXCJ3aWR0aFwiKSAmJiAhdG8uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikpIHRvLnNldEF0dHJpYnV0ZShcIndpZHRoXCIsIFwiMTZcIik7XG4gIGlmICghdG8uZ2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIpICYmICF0by5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSkgdG8uc2V0QXR0cmlidXRlKFwiaGVpZ2h0XCIsIFwiMTZcIik7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VBY3Rpb25MYWJlbChub2RlOiBIVE1MRWxlbWVudCwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCB0ZXh0Tm9kZXM6IFRleHRbXSA9IFtdO1xuICBjb25zdCB3YWxrZXIgPSBkb2N1bWVudC5jcmVhdGVUcmVlV2Fsa2VyKG5vZGUsIE5vZGVGaWx0ZXIuU0hPV19URVhUKTtcbiAgd2hpbGUgKHdhbGtlci5uZXh0Tm9kZSgpKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHdhbGtlci5jdXJyZW50Tm9kZTtcbiAgICBpZiAoY3VycmVudCBpbnN0YW5jZW9mIFRleHQgJiYgY2xlYW5TdHJpbmcoY3VycmVudC50ZXh0Q29udGVudCkpIHRleHROb2Rlcy5wdXNoKGN1cnJlbnQpO1xuICB9XG4gIGlmICh0ZXh0Tm9kZXMubGVuZ3RoKSB7XG4gICAgdGV4dE5vZGVzWzBdLnRleHRDb250ZW50ID0gbGFiZWw7XG4gICAgZm9yIChjb25zdCBleHRyYSBvZiB0ZXh0Tm9kZXMuc2xpY2UoMSkpIHJlbW92ZUFjY2Vzc29yeVRleHROb2RlKGV4dHJhLCBub2RlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICBzcGFuLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIG5vZGUuYXBwZW5kQ2hpbGQoc3Bhbik7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUFjY2Vzc29yeVRleHROb2RlKHRleHQ6IFRleHQsIHJvb3Q6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IG9yaWdpbmFsID0gY2xlYW5TdHJpbmcodGV4dC50ZXh0Q29udGVudCk7XG4gIGxldCBub2RlOiBIVE1MRWxlbWVudCB8IG51bGwgPSB0ZXh0LnBhcmVudEVsZW1lbnQ7XG4gIHdoaWxlIChub2RlICYmIG5vZGUgIT09IHJvb3QpIHtcbiAgICBjb25zdCBjb250ZW50ID0gY2xlYW5TdHJpbmcobm9kZS50ZXh0Q29udGVudCk7XG4gICAgY29uc3QgaGFzR3JhcGhpYyA9ICEhbm9kZS5xdWVyeVNlbGVjdG9yKFwic3ZnLGltZ1wiKTtcbiAgICBpZiAoY29udGVudCA9PT0gb3JpZ2luYWwgJiYgIWhhc0dyYXBoaWMpIHtcbiAgICAgIG5vZGUucmVtb3ZlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG5vZGUgPSBub2RlLnBhcmVudEVsZW1lbnQ7XG4gIH1cbiAgdGV4dC50ZXh0Q29udGVudCA9IFwiXCI7XG59XG5cbmZ1bmN0aW9uIHBhcnNlU3ZnKHN2Z1RleHQ6IHN0cmluZyk6IFNWR0VsZW1lbnQgfCBudWxsIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGVtcGxhdGVcIik7XG4gIHRlbXBsYXRlLmlubmVySFRNTCA9IHN2Z1RleHQudHJpbSgpO1xuICBjb25zdCBzdmcgPSB0ZW1wbGF0ZS5jb250ZW50LnF1ZXJ5U2VsZWN0b3IoXCJzdmdcIik7XG4gIGlmICghKHN2ZyBpbnN0YW5jZW9mIFNWR0VsZW1lbnQpKSByZXR1cm4gbnVsbDtcbiAgc3ZnLnNldEF0dHJpYnV0ZShcImFyaWEtaGlkZGVuXCIsIFwidHJ1ZVwiKTtcbiAgc3ZnLnNldEF0dHJpYnV0ZShcImZvY3VzYWJsZVwiLCBcImZhbHNlXCIpO1xuICByZXR1cm4gc3ZnO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0U2lkZWJhckljb25TdmcoKTogc3RyaW5nIHtcbiAgcmV0dXJuICc8c3ZnIHdpZHRoPVwiMTZcIiBoZWlnaHQ9XCIxNlwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIj48cGF0aCBkPVwiTTQgMTEuNSAxMiA1bDggNi41XCI+PC9wYXRoPjxwYXRoIGQ9XCJNNiAxMC41VjIwaDEydi05LjVcIj48L3BhdGg+PHBhdGggZD1cIk0xMCAyMHYtNWg0djVcIj48L3BhdGg+PC9zdmc+Jztcbn1cblxuZnVuY3Rpb24gY29udHJvbExhYmVsKGVsOiBIVE1MRWxlbWVudCk6IHN0cmluZyB7XG4gIHJldHVybiBjbGVhblN0cmluZyhlbC5nZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIpKSB8fFxuICAgIGNsZWFuU3RyaW5nKGVsLmdldEF0dHJpYnV0ZShcInRpdGxlXCIpKSB8fFxuICAgIGNsZWFuU3RyaW5nKGVsLnRleHRDb250ZW50KTtcbn1cblxuZnVuY3Rpb24gbGFiZWxNYXRjaGVzKGxhYmVsOiBzdHJpbmcsIG1hcmtlcjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBsYWJlbCA9PT0gbWFya2VyIHx8IGxhYmVsLmluY2x1ZGVzKG1hcmtlcik7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxhYmVsKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gY2xlYW5TdHJpbmcodmFsdWUpXG4gICAgLnRvTG9jYWxlTG93ZXJDYXNlKClcbiAgICAubm9ybWFsaXplKFwiTkZEXCIpXG4gICAgLnJlcGxhY2UoL1tcXHUwMzAwLVxcdTAzNmZdL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1tcdTIwMTlcdTIwMThgXHUwMEI0XS9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGNsZWFuU3RyaW5nKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS50cmltKCkgPyB2YWx1ZS50cmltKCkgOiBcIlwiO1xufVxuXG5mdW5jdGlvbiB2aXNpYmxlQm94KGVsOiBIVE1MRWxlbWVudCk6IERPTVJlY3QgfCBudWxsIHtcbiAgaWYgKCFlbC5pc0Nvbm5lY3RlZCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XG4gIGlmIChzdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiB8fCBzdHlsZS52aXNpYmlsaXR5ID09PSBcImhpZGRlblwiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICBpZiAocmVjdC53aWR0aCA8PSAwIHx8IHJlY3QuaGVpZ2h0IDw9IDApIHJldHVybiBudWxsO1xuICByZXR1cm4gcmVjdDtcbn1cblxuZnVuY3Rpb24gY29tcGFyZURvY3VtZW50UG9zaXRpb24oYTogSFRNTEVsZW1lbnQsIGI6IEhUTUxFbGVtZW50KTogbnVtYmVyIHtcbiAgaWYgKGEgPT09IGIpIHJldHVybiAwO1xuICByZXR1cm4gYS5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbihiKSAmIE5vZGUuRE9DVU1FTlRfUE9TSVRJT05fRk9MTE9XSU5HID8gLTEgOiAxO1xufVxuIiwgIi8qKlxuICogQnVpbHQtaW4gXCJUd2VhayBNYW5hZ2VyXCIgXHUyMDE0IGF1dG8taW5qZWN0ZWQgYnkgdGhlIHJ1bnRpbWUsIG5vdCBhIHVzZXIgdHdlYWsuXG4gKiBMaXN0cyBkaXNjb3ZlcmVkIHR3ZWFrcyB3aXRoIGVuYWJsZSB0b2dnbGVzLCBvcGVucyB0aGUgdHdlYWtzIGRpciwgbGlua3NcbiAqIHRvIGxvZ3MgYW5kIGNvbmZpZy4gTGl2ZXMgaW4gdGhlIHJlbmRlcmVyLlxuICpcbiAqIFRoaXMgaXMgaW52b2tlZCBmcm9tIHByZWxvYWQvaW5kZXgudHMgQUZURVIgdXNlciB0d2Vha3MgYXJlIGxvYWRlZCBzbyBpdFxuICogY2FuIHNob3cgdXAtdG8tZGF0ZSBzdGF0dXMuXG4gKi9cbmltcG9ydCB7IGlwY1JlbmRlcmVyIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgeyByZWdpc3RlclNlY3Rpb24gfSBmcm9tIFwiLi9zZXR0aW5ncy1pbmplY3RvclwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbW91bnRNYW5hZ2VyKCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB0d2Vha3MgPSAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDpsaXN0LXR3ZWFrc1wiKSkgYXMgQXJyYXk8e1xuICAgIG1hbmlmZXN0OiB7IGlkOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgdmVyc2lvbjogc3RyaW5nOyBkZXNjcmlwdGlvbj86IHN0cmluZyB9O1xuICAgIGVudHJ5RXhpc3RzOiBib29sZWFuO1xuICB9PjtcbiAgY29uc3QgcGF0aHMgPSAoYXdhaXQgaXBjUmVuZGVyZXIuaW52b2tlKFwiY29kZXhwcDp1c2VyLXBhdGhzXCIpKSBhcyB7XG4gICAgdXNlclJvb3Q6IHN0cmluZztcbiAgICB0d2Vha3NEaXI6IHN0cmluZztcbiAgICBsb2dEaXI6IHN0cmluZztcbiAgfTtcblxuICByZWdpc3RlclNlY3Rpb24oe1xuICAgIGlkOiBcImNvZGV4LXBsdXNwbHVzOm1hbmFnZXJcIixcbiAgICB0aXRsZTogXCJUd2VhayBNYW5hZ2VyXCIsXG4gICAgZGVzY3JpcHRpb246IGAke3R3ZWFrcy5sZW5ndGh9IHR3ZWFrKHMpIGluc3RhbGxlZC4gVXNlciBkaXI6ICR7cGF0aHMudXNlclJvb3R9YCxcbiAgICByZW5kZXIocm9vdCkge1xuICAgICAgcm9vdC5zdHlsZS5jc3NUZXh0ID0gXCJkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo4cHg7XCI7XG5cbiAgICAgIGNvbnN0IGFjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgYWN0aW9ucy5zdHlsZS5jc3NUZXh0ID0gXCJkaXNwbGF5OmZsZXg7Z2FwOjhweDtmbGV4LXdyYXA6d3JhcDtcIjtcbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGJ1dHRvbihcIk9wZW4gdHdlYWtzIGZvbGRlclwiLCAoKSA9PlxuICAgICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6cmV2ZWFsXCIsIHBhdGhzLnR3ZWFrc0RpcikuY2F0Y2goKCkgPT4ge30pLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGJ1dHRvbihcIk9wZW4gbG9nc1wiLCAoKSA9PlxuICAgICAgICAgIGlwY1JlbmRlcmVyLmludm9rZShcImNvZGV4cHA6cmV2ZWFsXCIsIHBhdGhzLmxvZ0RpcikuY2F0Y2goKCkgPT4ge30pLFxuICAgICAgICApLFxuICAgICAgKTtcbiAgICAgIGFjdGlvbnMuYXBwZW5kQ2hpbGQoXG4gICAgICAgIGJ1dHRvbihcIlJlbG9hZCB3aW5kb3dcIiwgKCkgPT4gbG9jYXRpb24ucmVsb2FkKCkpLFxuICAgICAgKTtcbiAgICAgIHJvb3QuYXBwZW5kQ2hpbGQoYWN0aW9ucyk7XG5cbiAgICAgIGlmICh0d2Vha3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnN0IGVtcHR5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInBcIik7XG4gICAgICAgIGVtcHR5LnN0eWxlLmNzc1RleHQgPSBcImNvbG9yOiM4ODg7Zm9udDoxM3B4IHN5c3RlbS11aTttYXJnaW46OHB4IDA7XCI7XG4gICAgICAgIGVtcHR5LnRleHRDb250ZW50ID1cbiAgICAgICAgICBcIk5vIHVzZXIgdHdlYWtzIHlldC4gRHJvcCBhIGZvbGRlciB3aXRoIG1hbmlmZXN0Lmpzb24gKyBpbmRleC5qcyBpbnRvIHRoZSB0d2Vha3MgZGlyLCB0aGVuIHJlbG9hZC5cIjtcbiAgICAgICAgcm9vdC5hcHBlbmRDaGlsZChlbXB0eSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ1bFwiKTtcbiAgICAgIGxpc3Quc3R5bGUuY3NzVGV4dCA9IFwibGlzdC1zdHlsZTpub25lO21hcmdpbjowO3BhZGRpbmc6MDtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo2cHg7XCI7XG4gICAgICBmb3IgKGNvbnN0IHQgb2YgdHdlYWtzKSB7XG4gICAgICAgIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBsaS5zdHlsZS5jc3NUZXh0ID1cbiAgICAgICAgICBcImRpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OnNwYWNlLWJldHdlZW47cGFkZGluZzo4cHggMTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJvcmRlciwjMmEyYTJhKTtib3JkZXItcmFkaXVzOjZweDtcIjtcbiAgICAgICAgY29uc3QgbGVmdCA9IHR3ZWFrU3VtbWFyeSh0KTtcbiAgICAgICAgY29uc3QgcmlnaHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICByaWdodC5zdHlsZS5jc3NUZXh0ID0gXCJjb2xvcjojODg4O2ZvbnQ6MTJweCBzeXN0ZW0tdWk7XCI7XG4gICAgICAgIHJpZ2h0LnRleHRDb250ZW50ID0gdC5lbnRyeUV4aXN0cyA/IFwibG9hZGVkXCIgOiBcIm1pc3NpbmcgZW50cnlcIjtcbiAgICAgICAgbGkuYXBwZW5kKGxlZnQsIHJpZ2h0KTtcbiAgICAgICAgbGlzdC5hcHBlbmQobGkpO1xuICAgICAgfVxuICAgICAgcm9vdC5hcHBlbmQobGlzdCk7XG4gICAgfSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJ1dHRvbihsYWJlbDogc3RyaW5nLCBvbmNsaWNrOiAoKSA9PiB2b2lkKTogSFRNTEJ1dHRvbkVsZW1lbnQge1xuICBjb25zdCBiID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgYi50eXBlID0gXCJidXR0b25cIjtcbiAgYi50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBiLnN0eWxlLmNzc1RleHQgPVxuICAgIFwicGFkZGluZzo2cHggMTBweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJvcmRlciwjMzMzKTtib3JkZXItcmFkaXVzOjZweDtiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O2NvbG9yOmluaGVyaXQ7Zm9udDoxMnB4IHN5c3RlbS11aTtjdXJzb3I6cG9pbnRlcjtcIjtcbiAgYi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgb25jbGljayk7XG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiB0d2Vha1N1bW1hcnkodHdlYWs6IHtcbiAgbWFuaWZlc3Q6IHsgaWQ6IHN0cmluZzsgbmFtZTogc3RyaW5nOyB2ZXJzaW9uOiBzdHJpbmc7IGRlc2NyaXB0aW9uPzogc3RyaW5nIH07XG59KTogSFRNTEVsZW1lbnQge1xuICBjb25zdCBsZWZ0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gIHRpdGxlLnN0eWxlLmNzc1RleHQgPSBcImZvbnQ6NjAwIDEzcHggc3lzdGVtLXVpO1wiO1xuICB0aXRsZS5hcHBlbmQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodHdlYWsubWFuaWZlc3QubmFtZSArIFwiIFwiKSk7XG5cbiAgY29uc3QgdmVyc2lvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICB2ZXJzaW9uLnN0eWxlLmNzc1RleHQgPSBcImNvbG9yOiM4ODg7Zm9udC13ZWlnaHQ6NDAwO1wiO1xuICB2ZXJzaW9uLnRleHRDb250ZW50ID0gYHYke3R3ZWFrLm1hbmlmZXN0LnZlcnNpb259YDtcbiAgdGl0bGUuYXBwZW5kQ2hpbGQodmVyc2lvbik7XG5cbiAgY29uc3QgZGVzY3JpcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICBkZXNjcmlwdGlvbi5zdHlsZS5jc3NUZXh0ID0gXCJjb2xvcjojODg4O2ZvbnQ6MTJweCBzeXN0ZW0tdWk7XCI7XG4gIGRlc2NyaXB0aW9uLnRleHRDb250ZW50ID0gdHdlYWsubWFuaWZlc3QuZGVzY3JpcHRpb24gPz8gdHdlYWsubWFuaWZlc3QuaWQ7XG5cbiAgbGVmdC5hcHBlbmQodGl0bGUsIGRlc2NyaXB0aW9uKTtcbiAgcmV0dXJuIGxlZnQ7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7QUFXQSxJQUFBQSxtQkFBNEI7OztBQzZCckIsU0FBUyxtQkFBeUI7QUFDdkMsTUFBSSxPQUFPLCtCQUFnQztBQUMzQyxRQUFNLFlBQVksb0JBQUksSUFBK0I7QUFDckQsTUFBSSxTQUFTO0FBQ2IsUUFBTSxZQUFZ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Q1gsQ0FBQztBQUFBLElBQ0gsS0FBSztBQUNILGFBQU8sNkJBQVksT0FBTyx1Q0FBdUMsS0FBSyxDQUFDLENBQUM7QUFBQSxJQUMxRSxLQUFLO0FBQ0gsYUFBTyw2QkFBWSxPQUFPLDJCQUEyQjtBQUFBLElBQ3ZEO0FBQ0UsWUFBTSxJQUFJLE1BQU0sNkNBQTZDLE1BQU0sRUFBRTtBQUFBLEVBQ3pFO0FBQ0Y7QUFFQSxTQUFTLHlCQUF5QixTQUEyQjtBQUMzRCxNQUFJO0FBQ0YsVUFBTSxRQUFTLFdBR1osOEJBQ0csV0FFRDtBQUNMLFFBQUksT0FBTyxPQUFPLDZCQUE2QixXQUFZLFFBQU87QUFDbEUsVUFBTSxjQUFjLE1BQU0seUJBQXlCLE9BQU87QUFDMUQsV0FBTyxnQkFBZ0IsU0FBWSxVQUFVO0FBQUEsRUFDL0MsU0FBUyxPQUFPO0FBQ2QsWUFBUSxzQ0FBc0MsT0FBUSxPQUFpQixTQUFTLEtBQUssQ0FBQztBQUN0RixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsU0FBUyxpQ0FDUCxVQUNBLGlCQUNTO0FBQ1QsTUFBSSxDQUFDLHFCQUFxQixLQUFLLFFBQVEsRUFBRyxPQUFNLElBQUksTUFBTSxtQkFBbUI7QUFDN0UsTUFBSSxnQkFBZ0IsSUFBSSxRQUFRLEVBQUcsUUFBTztBQUMxQyxRQUFNLFdBQVcsQ0FBQyxRQUFpQixZQUFxQjtBQUN0RCxpQ0FBWSxLQUFLLDJCQUEyQixVQUFVLE9BQU87QUFBQSxFQUMvRDtBQUNBLGtCQUFnQixJQUFJLFVBQVUsUUFBUTtBQUN0QywrQkFBWSxHQUFHLDRCQUE0QixRQUFRLEdBQUcsUUFBUTtBQUM5RCxTQUFPO0FBQ1Q7QUFFQSxTQUFTLG1DQUNQLFVBQ0EsaUJBQ1M7QUFDVCxRQUFNLFdBQVcsZ0JBQWdCLElBQUksUUFBUTtBQUM3QyxNQUFJLENBQUMsU0FBVSxRQUFPO0FBQ3RCLGtCQUFnQixPQUFPLFFBQVE7QUFDL0IsK0JBQVksZUFBZSw0QkFBNEIsUUFBUSxHQUFHLFFBQVE7QUFDMUUsU0FBTztBQUNUOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfZWxlY3Ryb24iLCAicm9vdCIsICJzdGF0ZSIsICJjaGVjayIsICJidXR0b24iLCAiY2FyZCIsICJpbXBvcnRfZWxlY3Ryb24iLCAic291cmNlIiwgIm1vZHVsZSIsICJleHBvcnRzIiwgIm9ic2VydmVyIiwgImVuc3VyZU9ic2VydmVyIiwgInN0YXRlIiwgImltcG9ydF9lbGVjdHJvbiIsICJzYWZlU3RyaW5naWZ5Il0KfQo=
