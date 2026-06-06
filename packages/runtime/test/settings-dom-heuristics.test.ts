import assert from "node:assert/strict";
import test from "node:test";
import {
  codexPpSettingsLabelScore,
  compactSettingsText,
  hasNativeSettingsSectionHeaders,
  isSettingsSidebarCandidate,
  normalizeCodexPpSettingsLabel,
} from "../src/preload/settings-dom-heuristics";

test("compactSettingsText collapses settings label whitespace", () => {
  assert.equal(compactSettingsText("  Keyboard\n shortcuts\t"), "Keyboard shortcuts");
});

test("normalizeCodexPpSettingsLabel lowercases and normalizes punctuation", () => {
  assert.equal(normalizeCodexPpSettingsLabel("  User’s  Settings  "), "user's settings");
});

test("codexPpSettingsLabelScore recognizes 1.0.1 settings sections", () => {
  const labels = [
    "Account",
    "General",
    "Appearance",
    "Connections",
    "Git",
    "Environments",
    "Worktrees",
    "Archived chats",
  ].map(normalizeCodexPpSettingsLabel);

  assert.deepEqual(codexPpSettingsLabelScore(labels), { core: 2, total: 8 });
});

test("hasNativeSettingsSectionHeaders recognizes native Codex section headers", () => {
  const root = fakeElement({
    children: [
      fakeElement({
        textContent: "Personal",
        classes: ["text-token-input-placeholder-foreground"],
      }),
    ],
  });

  assert.equal(hasNativeSettingsSectionHeaders(root), true);
});

test("hasNativeSettingsSectionHeaders ignores Codex++ injected headers", () => {
  const root = fakeElement({
    children: [
      fakeElement({
        textContent: "Personal",
        classes: ["text-token-input-placeholder-foreground"],
        dataset: { codexpp: "native-nav-header" },
      }),
    ],
  });

  assert.equal(hasNativeSettingsSectionHeaders(root), false);
});

test("isSettingsSidebarCandidate accepts the grouped settings nav", () => {
  withDomGlobals(() => {
    const nav = fakeElement({
      rect: { width: 300, height: 640, left: 0 },
      controls: [
        control("Account"),
        control("General"),
        control("Appearance"),
        control("Connections"),
        control("Git"),
        control("Environments"),
      ],
    });

    assert.equal(isSettingsSidebarCandidate(nav), true);
  });
});

test("isSettingsSidebarCandidate rejects the main app sidebar", () => {
  withDomGlobals(() => {
    const nav = fakeElement({
      rect: { width: 280, height: 640, left: 0 },
      controls: [
        control("New chat"),
        control("Search"),
        control("Projects"),
        control("Settings"),
      ],
    });

    assert.equal(isSettingsSidebarCandidate(nav), false);
  });
});

test("isSettingsSidebarCandidate rejects right-side or hidden candidates", () => {
  withDomGlobals(() => {
    assert.equal(
      isSettingsSidebarCandidate(fakeElement({
        rect: { width: 300, height: 640, left: 900 },
        controls: [control("General"), control("Appearance"), control("Git")],
      })),
      false,
    );

    assert.equal(
      isSettingsSidebarCandidate(fakeElement({
        display: "none",
        rect: { width: 300, height: 640, left: 0 },
        controls: [control("General"), control("Appearance"), control("Git")],
      })),
      false,
    );
  });
});

interface FakeElementOptions {
  textContent?: string;
  dataset?: Record<string, string>;
  classes?: string[];
  children?: HTMLElement[];
  controls?: HTMLElement[];
  rect?: { width: number; height: number; left: number };
  display?: string;
  visibility?: string;
}

function fakeElement(options: FakeElementOptions = {}): HTMLElement {
  const children = options.children ?? [];
  const controls = options.controls ?? [];
  const classes = new Set(options.classes ?? []);
  return {
    isConnected: true,
    textContent: options.textContent ?? "",
    dataset: options.dataset ?? {},
    className: [...classes].join(" "),
    classList: {
      contains: (name: string) => classes.has(name),
    },
    getAttribute: () => null,
    querySelectorAll: (selector: string) => {
      if (selector === "div,span") return children;
      if (selector === "button,a,[role='button'],[role='link']") return controls;
      return [];
    },
    getBoundingClientRect: () => ({
      width: options.rect?.width ?? 300,
      height: options.rect?.height ?? 640,
      left: options.rect?.left ?? 0,
    }),
    __style: {
      display: options.display ?? "block",
      visibility: options.visibility ?? "visible",
    },
  } as unknown as HTMLElement;
}

function control(label: string): HTMLElement {
  return {
    textContent: label,
    getAttribute: (name: string) => name === "aria-label" ? label : null,
  } as unknown as HTMLElement;
}

function withDomGlobals(fn: () => void): void {
  const prevWindow = (globalThis as unknown as { window?: unknown }).window;
  const prevGetComputedStyle = (globalThis as unknown as { getComputedStyle?: unknown }).getComputedStyle;
  (globalThis as unknown as { window: { innerWidth: number } }).window = { innerWidth: 1200 };
  (globalThis as unknown as { getComputedStyle: (el: unknown) => { display: string; visibility: string } })
    .getComputedStyle = (el: unknown) => {
      const style = (el as { __style?: { display: string; visibility: string } }).__style;
      return style ?? { display: "block", visibility: "visible" };
    };
  try {
    fn();
  } finally {
    (globalThis as unknown as { window?: unknown }).window = prevWindow;
    (globalThis as unknown as { getComputedStyle?: unknown }).getComputedStyle = prevGetComputedStyle;
  }
}
