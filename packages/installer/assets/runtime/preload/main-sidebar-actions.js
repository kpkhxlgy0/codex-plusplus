"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rendererSidebarApi = rendererSidebarApi;
exports.disposeSidebarActionsForTweak = disposeSidebarActionsForTweak;
exports.registerSidebarAction = registerSidebarAction;
exports.findMainSidebarActionSlot = findMainSidebarActionSlot;
const MAIN_SIDEBAR_ACTION_LABELS = [
    "New chat",
    "Quick chat",
    "Search",
    "Plugins",
    "Automations",
    "Automation",
].map(normalizeLabel);
const records = new Map();
let observer = null;
let refreshTimer = null;
function rendererSidebarApi(tweakId) {
    return {
        registerAction(options) {
            return registerSidebarAction(tweakId, options);
        },
    };
}
function disposeSidebarActionsForTweak(tweakId) {
    for (const record of Array.from(records.values())) {
        if (record.tweakId === tweakId)
            disposeRecord(record);
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
        return actionRef(existing);
    }
    const record = {
        tweakId,
        id: normalized.id,
        key,
        options: normalized,
        node: null,
        listener: null,
    };
    records.set(key, record);
    ensureObserver();
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
            scheduleSidebarRefresh();
        },
        setActive(active) {
            record.options = { ...record.options, active };
            renderRecord(record);
        },
        dispose() {
            disposeRecord(record);
            stopObserverIfIdle();
        },
    };
}
function normalizeOptions(options) {
    const id = cleanString(options.id);
    const label = cleanString(options.label);
    if (!id)
        throw new Error("sidebar action id is required");
    if (!label)
        throw new Error("sidebar action label is required");
    return {
        id,
        label,
        tooltip: cleanString(options.tooltip) || label,
        order: Number.isFinite(options.order) ? Number(options.order) : 50,
        active: options.active === true,
        iconSvg: cleanString(options.iconSvg) || undefined,
        onClick: options.onClick,
    };
}
function ensureObserver() {
    if (observer || typeof document === "undefined")
        return;
    observer = new MutationObserver(() => scheduleSidebarRefresh());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleSidebarRefresh, { passive: true });
}
function stopObserverIfIdle() {
    if (records.size > 0)
        return;
    observer?.disconnect();
    observer = null;
    window.removeEventListener("resize", scheduleSidebarRefresh);
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
}
function scheduleSidebarRefresh() {
    if (refreshTimer)
        return;
    refreshTimer = setTimeout(() => {
        refreshTimer = null;
        refreshSidebarActions();
    }, 120);
}
function refreshSidebarActions() {
    if (!records.size)
        return;
    const slot = findMainSidebarActionSlot();
    if (!slot)
        return;
    for (const record of sortedRecords()) {
        if (!record.node || !record.node.isConnected || record.node.parentElement !== slot.container) {
            record.node?.remove();
            record.node = createActionNode(slot.template, record);
        }
        renderRecord(record);
    }
    let anchor = slot.insertAfter;
    for (const record of sortedRecords()) {
        if (!record.node)
            continue;
        if (anchor?.nextSibling !== record.node) {
            slot.container.insertBefore(record.node, anchor ? anchor.nextSibling : slot.container.firstChild);
        }
        anchor = record.node;
    }
}
function sortedRecords() {
    return Array.from(records.values()).sort((a, b) => a.options.order - b.options.order || a.key.localeCompare(b.key));
}
function createActionNode(template, record) {
    const node = template.cloneNode(true);
    sanitizeActionNode(node);
    node.dataset.codexppSidebarAction = record.key;
    node.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void record.options.onClick?.(event);
    });
    const target = interactiveTarget(node);
    if (!hasNativeActivation(target)) {
        target.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ")
                return;
            event.preventDefault();
            event.stopPropagation();
            target.click();
        });
    }
    return node;
}
function renderRecord(record) {
    const node = record.node;
    if (!node)
        return;
    const target = interactiveTarget(node);
    node.dataset.codexppSidebarAction = record.key;
    node.dataset.codexppSidebarActionActive = record.options.active ? "true" : "false";
    target.setAttribute("aria-label", record.options.label);
    target.setAttribute("title", record.options.tooltip);
    target.setAttribute("role", "button");
    target.setAttribute("tabindex", "0");
    setActiveAttributes(node, record.options.active);
    if (target !== node)
        setActiveAttributes(target, record.options.active);
    replaceActionIcon(node, record.options.iconSvg);
    replaceActionLabel(node, record.options.label);
}
function disposeRecord(record) {
    record.node?.remove();
    record.node = null;
    records.delete(record.key);
}
function findMainSidebarActionSlot(root = document) {
    const aside = root.querySelector?.("aside");
    if (!aside)
        return null;
    const controls = visibleControls(aside)
        .map((control) => ({ control, label: normalizeLabel(controlLabel(control)) }))
        .filter((item) => MAIN_SIDEBAR_ACTION_LABELS.some((marker) => labelMatches(item.label, marker)));
    if (!controls.length)
        return null;
    const templateControl = controls[0]?.control;
    if (!templateControl)
        return null;
    const group = actionGroupFor(aside, controls.map((item) => item.control));
    const template = rowInGroup(group, templateControl);
    const rows = controls.map((item) => rowInGroup(group, item.control)).filter(Boolean);
    const insertAfter = rows.sort(compareDocumentPosition).at(-1) ?? template;
    return { container: group, template, insertAfter };
}
function visibleControls(root) {
    return Array.from(root.querySelectorAll("button,a,[role='button'],[role='link']"))
        .filter((control) => {
        if (control.closest("[data-codexpp-sidebar-action]"))
            return false;
        const label = controlLabel(control);
        if (!label)
            return false;
        const box = visibleBox(control);
        return !!box;
    });
}
function actionGroupFor(aside, controls) {
    const first = controls[0];
    if (!first)
        return aside;
    let node = first.parentElement;
    while (node && node !== aside) {
        const count = controls.filter((control) => node?.contains(control)).length;
        if (count >= Math.min(2, controls.length))
            return node;
        node = node.parentElement;
    }
    return first.parentElement || aside;
}
function rowInGroup(group, control) {
    let node = control;
    while (node.parentElement && node.parentElement !== group)
        node = node.parentElement;
    return node;
}
function sanitizeActionNode(node) {
    const all = [node, ...Array.from(node.querySelectorAll("*"))];
    for (const el of all) {
        for (const attr of Array.from(el.attributes)) {
            if (attr.name.startsWith("data-app-action"))
                el.removeAttribute(attr.name);
            if (attr.name === "href" || attr.name === "aria-current")
                el.removeAttribute(attr.name);
        }
        if (el instanceof HTMLButtonElement)
            el.type = "button";
    }
}
function interactiveTarget(node) {
    if (matchesControl(node))
        return node;
    return node.querySelector("button,a,[role='button'],[role='link']") || node;
}
function matchesControl(node) {
    return node.matches("button,a,[role='button'],[role='link']");
}
function hasNativeActivation(node) {
    return node instanceof HTMLButtonElement || (node instanceof HTMLAnchorElement && !!node.href);
}
function setActiveAttributes(node, active) {
    node.toggleAttribute("aria-current", active);
    if (active)
        node.setAttribute("data-state", "active");
    else
        node.removeAttribute("data-state");
}
function replaceActionIcon(node, iconSvg) {
    const svg = parseSvg(iconSvg || defaultSidebarIconSvg());
    const current = node.querySelector("svg");
    if (current && svg) {
        current.replaceWith(svg);
        return;
    }
    if (svg)
        node.prepend(svg);
}
function replaceActionLabel(node, label) {
    const textNodes = [];
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const current = walker.currentNode;
        if (current instanceof Text && cleanString(current.textContent))
            textNodes.push(current);
    }
    if (textNodes.length) {
        textNodes[0].textContent = label;
        for (const extra of textNodes.slice(1))
            extra.textContent = "";
        return;
    }
    const span = document.createElement("span");
    span.textContent = label;
    node.appendChild(span);
}
function parseSvg(svgText) {
    const template = document.createElement("template");
    template.innerHTML = svgText.trim();
    const svg = template.content.querySelector("svg");
    if (!(svg instanceof SVGElement))
        return null;
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    return svg;
}
function defaultSidebarIconSvg() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5"></path><path d="M6 10.5V20h12v-9.5"></path><path d="M10 20v-5h4v5"></path></svg>';
}
function controlLabel(el) {
    return cleanString(el.getAttribute("aria-label")) ||
        cleanString(el.getAttribute("title")) ||
        cleanString(el.textContent);
}
function labelMatches(label, marker) {
    return label === marker || label.includes(marker);
}
function normalizeLabel(value) {
    return cleanString(value)
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[’‘`´]/g, "'")
        .replace(/\s+/g, " ");
}
function cleanString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
}
function visibleBox(el) {
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
function compareDocumentPosition(a, b) {
    if (a === b)
        return 0;
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
//# sourceMappingURL=main-sidebar-actions.js.map