import type {
  CodexSidebarActionOptions,
  CodexSidebarActionRef,
  CodexSidebarActionUpdate,
  CodexSidebarApi,
} from "@codex-plusplus/sdk";

interface SidebarActionRecord {
  tweakId: string;
  id: string;
  key: string;
  options: Required<Pick<CodexSidebarActionOptions, "id" | "label" | "tooltip" | "placement" | "order" | "active">> &
    Pick<CodexSidebarActionOptions, "iconSvg" | "onClick">;
  node: HTMLElement | null;
  listener: ((event: MouseEvent) => void) | null;
}

interface SidebarSlot {
  container: HTMLElement;
  template: HTMLElement;
  insertBefore: HTMLElement | null;
  insertAfter: HTMLElement | null;
}

interface MutedNativeActiveElement {
  className: string;
  ariaCurrent: string | null;
  ariaSelected: string | null;
  dataState: string | null;
  dataActive: string | null;
  dataSelected: string | null;
}

const MAIN_SIDEBAR_ACTION_LABELS = [
  "New chat",
  "Quick chat",
  "Search",
  "Plugins",
  "Automations",
  "Automation",
].map(normalizeLabel);

const records = new Map<string, SidebarActionRecord>();
const mutedNativeActiveElements = new Map<HTMLElement, MutedNativeActiveElement>();
let observer: MutationObserver | null = null;
let delegatedEventsInstalled = false;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export function rendererSidebarApi(tweakId: string): CodexSidebarApi {
  return {
    registerAction(options) {
      return registerSidebarAction(tweakId, options);
    },
  };
}

export function disposeSidebarActionsForTweak(tweakId: string): void {
  for (const record of Array.from(records.values())) {
    if (record.tweakId === tweakId) disposeRecord(record);
  }
  stopObserverIfIdle();
}

export function registerSidebarAction(
  tweakId: string,
  options: CodexSidebarActionOptions,
): CodexSidebarActionRef {
  const normalized = normalizeOptions(options);
  const key = `${tweakId}:${normalized.id}`;
  const existing = records.get(key);
  if (existing) {
    existing.options = normalized;
    renderRecord(existing);
    syncNativeSidebarActiveState();
    return actionRef(existing);
  }

  const record: SidebarActionRecord = {
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

function actionRef(record: SidebarActionRecord): CodexSidebarActionRef {
  return {
    id: record.id,
    update(update: CodexSidebarActionUpdate) {
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
    },
  };
}

function normalizeOptions(options: CodexSidebarActionOptions): SidebarActionRecord["options"] {
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
    iconSvg: cleanString(options.iconSvg) || undefined,
    onClick: options.onClick,
  };
}

function ensureObserver(): void {
  if (observer || typeof document === "undefined") return;
  observer = new MutationObserver(() => scheduleSidebarRefresh());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", scheduleSidebarRefresh, { passive: true });
  ensureDelegatedSidebarEvents();
}

function stopObserverIfIdle(): void {
  if (records.size > 0) return;
  observer?.disconnect();
  observer = null;
  window.removeEventListener("resize", scheduleSidebarRefresh);
  removeDelegatedSidebarEvents();
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function ensureDelegatedSidebarEvents(): void {
  if (delegatedEventsInstalled || typeof document === "undefined") return;
  delegatedEventsInstalled = true;
  document.addEventListener("click", onDelegatedSidebarActionClick, true);
  document.addEventListener("keydown", onDelegatedSidebarActionKeydown, true);
}

function removeDelegatedSidebarEvents(): void {
  if (!delegatedEventsInstalled || typeof document === "undefined") return;
  delegatedEventsInstalled = false;
  document.removeEventListener("click", onDelegatedSidebarActionClick, true);
  document.removeEventListener("keydown", onDelegatedSidebarActionKeydown, true);
}

function onDelegatedSidebarActionClick(event: MouseEvent): void {
  const action = sidebarActionNodeForEvent(event);
  if (!action) return;
  const record = records.get(action.dataset.codexppSidebarAction || "");
  if (!record) return;
  event.preventDefault();
  event.stopPropagation();
  void record.options.onClick?.(event);
}

function onDelegatedSidebarActionKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" && event.key !== " ") return;
  const action = sidebarActionNodeForEvent(event);
  if (!action) return;
  event.preventDefault();
  event.stopPropagation();
  interactiveTarget(action).click();
}

function sidebarActionNodeForEvent(event: Event): HTMLElement | null {
  const target = eventTargetElement(event);
  const action = target?.closest("[data-codexpp-sidebar-action]");
  return domElement(action);
}

function eventTargetElement(event: Event): HTMLElement | null {
  return domElement(event.target);
}

function domElement(value: unknown): HTMLElement | null {
  if (!value || typeof value !== "object") return null;
  const element = value as HTMLElement;
  if (typeof element.closest !== "function") return null;
  if (typeof element.getAttribute !== "function") return null;
  return element;
}

function scheduleSidebarRefresh(): void {
  if (refreshTimer) return;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    refreshSidebarActions();
  }, 120);
}

function refreshSidebarActions(): void {
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

function sortedRecords(): SidebarActionRecord[] {
  return Array.from(records.values()).sort((a, b) =>
    a.options.order - b.options.order || a.key.localeCompare(b.key),
  );
}

function createActionNode(template: HTMLElement, record: SidebarActionRecord): HTMLElement {
  const node = template.cloneNode(true) as HTMLElement;
  sanitizeActionNode(node);
  node.dataset.codexppSidebarAction = record.key;
  return node;
}

function renderRecord(record: SidebarActionRecord): void {
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

function disposeRecord(record: SidebarActionRecord): void {
  record.node?.remove();
  record.node = null;
  records.delete(record.key);
  syncNativeSidebarActiveState();
}

function applyPlacementStyle(node: HTMLElement, record: SidebarActionRecord): void {
  if (record.options.placement === "start") {
    node.style.order = String(-10000 + record.options.order);
  } else {
    node.style.removeProperty("order");
  }
}

export function findMainSidebarActionSlot(root: ParentNode = document): SidebarSlot | null {
  const aside = Array.from(root.querySelectorAll?.("aside") ?? [])
    .find((candidate): candidate is HTMLElement => candidate instanceof HTMLElement && !!visibleBox(candidate));
  if (!aside) return null;

  const controls = visibleControls(aside)
    .map((control) => ({ control, label: normalizeLabel(controlLabel(control)) }))
    .filter((item) => MAIN_SIDEBAR_ACTION_LABELS.some((marker) => labelMatches(item.label, marker)));
  if (!controls.length) return null;

  const sortedControls = controls
    .map((item) => item.control)
    .sort(compareDocumentPosition);
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

function visibleControls(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("button,a,[role='button'],[role='link']"))
    .filter((control) => {
      if (control.closest("[data-codexpp-sidebar-action]")) return false;
      const label = controlLabel(control);
      if (!label) return false;
      const box = visibleBox(control);
      return !!box;
    });
}

function actionGroupFor(aside: HTMLElement, controls: HTMLElement[]): HTMLElement {
  const first = controls[0];
  if (!first) return aside;
  let node: HTMLElement | null = first.parentElement;
  while (node && node !== aside) {
    const childRows = controls
      .map((control) => childInContainer(node as HTMLElement, control))
      .filter(Boolean);
    if (new Set(childRows).size >= Math.min(2, controls.length)) return node;
    node = node.parentElement;
  }
  return first.parentElement || aside;
}

function rowInGroup(group: HTMLElement, control: HTMLElement): HTMLElement {
  let node: HTMLElement = control;
  while (node.parentElement && node.parentElement !== group) node = node.parentElement;
  return node;
}

function childInContainer(container: HTMLElement, control: HTMLElement): HTMLElement | null {
  let node: HTMLElement = control;
  while (node.parentElement && node.parentElement !== container) node = node.parentElement;
  return node.parentElement === container ? node : null;
}

function sanitizeActionNode(node: HTMLElement): void {
  const all = [node, ...Array.from(node.querySelectorAll<HTMLElement>("*"))];
  for (const el of all) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("data-app-action")) el.removeAttribute(attr.name);
      if (attr.name === "href" || attr.name === "aria-current") el.removeAttribute(attr.name);
    }
    if (el instanceof HTMLButtonElement) el.type = "button";
  }
}

function interactiveTarget(node: HTMLElement): HTMLElement {
  if (matchesControl(node)) return node;
  return node.querySelector<HTMLElement>("button,a,[role='button'],[role='link']") || node;
}

function matchesControl(node: HTMLElement): boolean {
  return node.matches("button,a,[role='button'],[role='link']");
}

function setActiveAttributes(node: HTMLElement, active: boolean): void {
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

function applyNativeLikeActiveStyle(target: HTMLElement, active: boolean): void {
  const content = activeContentElement(target);
  const icon = target.querySelector<SVGElement>("svg");
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

function activeContentElement(target: HTMLElement): HTMLElement | null {
  const tokenElement = target.querySelector<HTMLElement>(
    ".text-token-foreground,.text-token-list-active-selection-foreground",
  );
  if (tokenElement) return tokenElement;
  return target.firstElementChild instanceof HTMLElement ? target.firstElementChild : target;
}

function syncNativeSidebarActiveState(): void {
  if (hasActiveRecord()) muteNativeSidebarActiveState();
  else restoreNativeSidebarActiveState();
}

function hasActiveRecord(): boolean {
  return Array.from(records.values()).some((record) => record.options.active && record.node?.isConnected);
}

function muteNativeSidebarActiveState(root: ParentNode = document): void {
  const aside = Array.from(root.querySelectorAll?.("aside") ?? [])
    .find((candidate): candidate is HTMLElement => candidate instanceof HTMLElement && !!visibleBox(candidate));
  if (!aside) return;

  const controls = Array.from(
    aside.querySelectorAll<HTMLElement>("button,a,[role='button'],[role='link']"),
  );
  for (const control of controls) {
    if (control.closest("[data-codexpp-sidebar-action]")) continue;
    if (!isNativeActiveControl(control)) continue;
    muteNativeActiveElement(control);
    for (const child of activeSelectionDescendants(control)) muteNativeActiveElement(child);
  }
}

function restoreNativeSidebarActiveState(): void {
  for (const [element, state] of Array.from(mutedNativeActiveElements.entries())) {
    if (element.isConnected) {
      element.className = state.className;
      restoreNullableAttribute(element, "aria-current", state.ariaCurrent);
      restoreNullableAttribute(element, "aria-selected", state.ariaSelected);
      restoreNullableAttribute(element, "data-state", state.dataState);
      restoreNullableAttribute(element, "data-active", state.dataActive);
      restoreNullableAttribute(element, "data-selected", state.dataSelected);
    }
    mutedNativeActiveElements.delete(element);
  }
}

function muteNativeActiveElement(element: HTMLElement): void {
  if (!mutedNativeActiveElements.has(element)) {
    mutedNativeActiveElements.set(element, {
      className: element.className,
      ariaCurrent: element.getAttribute("aria-current"),
      ariaSelected: element.getAttribute("aria-selected"),
      dataState: element.getAttribute("data-state"),
      dataActive: element.getAttribute("data-active"),
      dataSelected: element.getAttribute("data-selected"),
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
    "text-token-list-active-selection-icon-foreground",
  );
  if (matchesControl(element)) element.classList.add("hover:bg-token-list-hover-background", "font-normal");
}

function activeSelectionDescendants(control: HTMLElement): HTMLElement[] {
  return Array.from(
    control.querySelectorAll<HTMLElement>(
      ".bg-token-list-hover-background,.text-token-list-active-selection-foreground,.text-token-list-active-selection-icon-foreground",
    ),
  );
}

function isNativeActiveControl(control: HTMLElement): boolean {
  return control.getAttribute("aria-current") === "page" ||
    control.getAttribute("aria-selected") === "true" ||
    control.getAttribute("data-state") === "active" ||
    control.getAttribute("data-active") === "true" ||
    control.getAttribute("data-selected") === "true" ||
    control.classList.contains("active") ||
    control.classList.contains("bg-token-list-hover-background") ||
    activeSelectionDescendants(control).length > 0;
}

function restoreNullableAttribute(element: HTMLElement, name: string, value: string | null): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function replaceActionIcon(node: HTMLElement, iconSvg?: string): void {
  const svg = parseSvg(iconSvg || defaultSidebarIconSvg());
  const current = node.querySelector("svg");
  if (current && svg) {
    copyIconPresentation(current, svg);
    current.replaceWith(svg);
    return;
  }
  if (svg) node.prepend(svg);
}

function copyIconPresentation(from: SVGElement, to: SVGElement): void {
  for (const attr of ["class", "style", "width", "height"]) {
    const value = from.getAttribute(attr);
    if (value) to.setAttribute(attr, value);
  }
  if (!to.getAttribute("width") && !to.getAttribute("class")) to.setAttribute("width", "16");
  if (!to.getAttribute("height") && !to.getAttribute("class")) to.setAttribute("height", "16");
}

function replaceActionLabel(node: HTMLElement, label: string): void {
  const textNodes: Text[] = [];
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

function removeAccessoryTextNode(text: Text, root: HTMLElement): void {
  const original = cleanString(text.textContent);
  let node: HTMLElement | null = text.parentElement;
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

function parseSvg(svgText: string): SVGElement | null {
  const template = document.createElement("template");
  template.innerHTML = svgText.trim();
  const svg = template.content.querySelector("svg");
  if (!(svg instanceof SVGElement)) return null;
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}

function defaultSidebarIconSvg(): string {
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5"></path><path d="M6 10.5V20h12v-9.5"></path><path d="M10 20v-5h4v5"></path></svg>';
}

function controlLabel(el: HTMLElement): string {
  return cleanString(el.getAttribute("aria-label")) ||
    cleanString(el.getAttribute("title")) ||
    cleanString(el.textContent);
}

function labelMatches(label: string, marker: string): boolean {
  return label === marker || label.includes(marker);
}

function normalizeLabel(value: string): string {
  return cleanString(value)
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ");
}

function cleanString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function visibleBox(el: HTMLElement): DOMRect | null {
  if (!el.isConnected) return null;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function compareDocumentPosition(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0;
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
