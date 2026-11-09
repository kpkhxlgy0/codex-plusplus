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
            .filter((el) => isNativeVisibleSettingsControl(el, root))
            .map(codexPpControlLabel)
            .filter(Boolean)),
    ];
}
function isNativeVisibleSettingsControl(el, root) {
    if (el.closest("[data-codexpp],[hidden],[inert],[aria-hidden='true']"))
        return false;
    if (!codexPpVisibleBox(el))
        return false;
    for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse")
            return false;
        if (node === root)
            break;
    }
    return true;
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
    return label === marker;
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
function hasMainAppSidebarSignals(labels) {
    const hasMainAnchor = labels.some((label) => CODEXPP_MAIN_APP_NAV_LABELS.includes(label) &&
        !["plugins", "插件", "settings", "设置"].includes(label));
    return hasMainAnchor && codexPpMarkerCount(labels, CODEXPP_MAIN_APP_NAV_LABELS) >= 2;
}
function isInMainAppSidebar(el, labels) {
    if (hasMainAppSidebarSignals(labels))
        return true;
    // Chat lists can resemble settings on their own. Keep their native navigation
    // ancestors in scope without inspecting unrelated app navigation elsewhere.
    let nav = el.parentElement?.closest("nav,aside,[role='navigation']") ?? null;
    while (nav) {
        if (hasMainAppSidebarSignals(codexPpSettingsLabelsFrom(nav)))
            return true;
        nav = nav.parentElement?.closest("nav,aside,[role='navigation']") ?? null;
    }
    return false;
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
    // Use the same exclusions when selecting a host and validating injected
    // groups. Otherwise cleanup removes groups that the next pass reinserts.
    // The generic vertical-scroll-fade-mask class also appears in Settings;
    // only the composer/overlay-specific markers above identify forbidden hosts.
    if (isForbiddenSettingsSidebarSurface(el))
        return false;
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
    if (isInMainAppSidebar(el, labels))
        return false;
    return isCodexPpSettingsLabelSet(labels);
}
//# sourceMappingURL=settings-dom-heuristics.js.map