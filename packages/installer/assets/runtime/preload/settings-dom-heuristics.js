"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compactSettingsText = compactSettingsText;
exports.hasNativeSettingsSectionHeaders = hasNativeSettingsSectionHeaders;
exports.normalizeCodexPpSettingsLabel = normalizeCodexPpSettingsLabel;
exports.codexPpControlLabel = codexPpControlLabel;
exports.codexPpSettingsLabelsFrom = codexPpSettingsLabelsFrom;
exports.codexPpSettingsLabelScore = codexPpSettingsLabelScore;
exports.isCodexPpSettingsLabelSet = isCodexPpSettingsLabelSet;
exports.codexPpVisibleBox = codexPpVisibleBox;
exports.isForbiddenSettingsSidebarSurface = isForbiddenSettingsSidebarSurface;
exports.isSettingsSidebarCandidate = isSettingsSidebarCandidate;
function compactSettingsText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
}
function hasNativeSettingsSectionHeaders(root) {
    const headings = new Set(["Personal", "Integrations", "Coding", "Archived"]);
    return Array.from(root.querySelectorAll("div,span")).some((el) => {
        if (el.dataset.codexpp)
            return false;
        if (!headings.has(compactSettingsText(el.textContent || "")))
            return false;
        return el.classList.contains("text-token-input-placeholder-foreground") ||
            el.classList.contains("text-token-text-secondary") ||
            el.className.includes("text-token");
    });
}
function normalizeCodexPpSettingsLabel(value) {
    return compactSettingsText(value)
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’‘`´]/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}
const CODEXPP_CORE_SETTINGS_LABELS = [
    "General",
    "常规",
    "通用",
    "Appearance",
    "外观",
    "Configuration",
    "配置",
    "默认权限",
    "Personalization",
    "个性化",
].map(normalizeCodexPpSettingsLabel);
const CODEXPP_EXTENDED_SETTINGS_LABELS = [
    "Account",
    "账户",
    "账号",
    "General",
    "常规",
    "通用",
    "Appearance",
    "外观",
    "Configuration",
    "配置",
    "默认权限",
    "Personalization",
    "个性化",
    "Keyboard shortcuts",
    "Archived chats",
    "Usage",
    "Computer use",
    "Browser use",
    "MCP servers",
    "MCP Servers",
    "MCP 服务器",
    "Git",
    "Environments",
    "环境",
    "Cloud Environments",
    "Worktrees",
    "Connections",
    "Plugins",
    "Skills",
].map(normalizeCodexPpSettingsLabel);
const CODEXPP_SETTINGS_ONLY_LABELS = [
    "General",
    "常规",
    "通用",
    "Appearance",
    "外观",
    "Configuration",
    "配置",
    "默认权限",
    "Personalization",
    "个性化",
    "Keyboard shortcuts",
    "Archived chats",
    "Usage",
    "Computer use",
    "Browser use",
    "MCP servers",
    "MCP Servers",
    "MCP 服务器",
    "Git",
    "Environments",
    "环境",
    "Cloud Environments",
    "Worktrees",
    "Connections",
].map(normalizeCodexPpSettingsLabel);
const CODEXPP_MAIN_APP_NAV_LABELS = [
    "New chat",
    "Quick chat",
    "快速对话",
    "Search",
    "搜索",
    "Plugins",
    "插件",
    "Automations",
    "Automation",
    "自动化",
    "Chats",
    "Chat",
    "对话",
    "Projects",
    "项目",
    "Pinned",
    "Settings",
    "设置",
    "Work locally",
].map(normalizeCodexPpSettingsLabel);
function codexPpControlLabel(el) {
    return normalizeCodexPpSettingsLabel(el.getAttribute("aria-label") ||
        el.getAttribute("title") ||
        el.textContent ||
        "");
}
function codexPpSettingsLabelsFrom(root) {
    const controls = Array.from(root.querySelectorAll("button,a,[role='button'],[role='link']"));
    return [
        ...new Set(controls
            .map(codexPpControlLabel)
            .filter(Boolean)),
    ];
}
function codexPpSettingsLabelScore(labels) {
    const core = new Set();
    const total = new Set();
    for (const label of labels) {
        for (const marker of CODEXPP_CORE_SETTINGS_LABELS) {
            if (codexPpLabelMatchesMarker(label, marker))
                core.add(marker);
        }
        for (const marker of CODEXPP_EXTENDED_SETTINGS_LABELS) {
            if (codexPpLabelMatchesMarker(label, marker))
                total.add(marker);
        }
    }
    return { core: core.size, total: total.size };
}
function codexPpLabelMatchesMarker(label, marker) {
    return label === marker || label.includes(marker);
}
function codexPpMarkerCount(labels, markers) {
    const matched = new Set();
    for (const label of labels) {
        for (const marker of markers) {
            if (codexPpLabelMatchesMarker(label, marker))
                matched.add(marker);
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
    if (!el.isConnected)
        return null;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden")
        return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0)
        return null;
    return rect;
}
const FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR = [
    "[data-composer-overlay-floating-ui='true']",
    "[data-codexpp-slash-menu='true']",
    "[data-codexpp-overlay-noise='true']",
    ".composer-home-top-menu",
    ".vertical-scroll-fade-mask",
    "[class*='[container-name:home-main-content]']",
].join(",");
function isForbiddenSettingsSidebarSurface(node) {
    if (!node)
        return false;
    const el = node instanceof HTMLElement ? node : node.parentElement;
    if (!el)
        return false;
    if (el.closest(FORBIDDEN_SETTINGS_SIDEBAR_SELECTOR))
        return true;
    if (el.querySelector("[data-list-navigation-item='true'], [cmdk-item]"))
        return true;
    return false;
}
function isSettingsSidebarCandidate(el) {
    const rect = codexPpVisibleBox(el);
    if (!rect)
        return false;
    // Current Codex Settings sidebar: left column, not the main content panel.
    if (rect.width < 120 || rect.width > 620)
        return false;
    if (rect.height < 80)
        return false;
    if (rect.left > window.innerWidth * 0.65)
        return false;
    const labels = codexPpSettingsLabelsFrom(el);
    if (hasMainAppSidebarSignals(labels) && !hasCodexPpSettingsOnlySignal(labels)) {
        return false;
    }
    return isCodexPpSettingsLabelSet(labels);
}
//# sourceMappingURL=settings-dom-heuristics.js.map