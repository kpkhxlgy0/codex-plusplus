import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  codexPpSettingsLabelsFrom,
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
    "Account", "General", "Appearance", "Connections", "Git", "Environments", "Worktrees", "Archived chats",
  ].map(normalizeCodexPpSettingsLabel);

  assert.deepEqual(codexPpSettingsLabelScore(labels), { core: 2, total: 8 });
});

test("codexPpSettingsLabelScore does not recognize settings words inside chat titles", () => {
  const labels = ["General discussion", "Configuration guide", "Git notes"]
    .map(normalizeCodexPpSettingsLabel);

  assert.deepEqual(codexPpSettingsLabelScore(labels), { core: 0, total: 0 });
});

test("hasNativeSettingsSectionHeaders recognizes native Codex section headers", () => {
  withDom('<nav id="sidebar"><div class="text-token-input-placeholder-foreground">Personal</div></nav>', (root) => {
    assert.equal(hasNativeSettingsSectionHeaders(root), true);
  });
});

test("hasNativeSettingsSectionHeaders ignores Codex++ injected headers", () => {
  withDom(`<nav id="sidebar"><div data-codexpp="native-nav-header"
    class="text-token-input-placeholder-foreground">Personal</div></nav>`, (root) => {
    assert.equal(hasNativeSettingsSectionHeaders(root), false);
  });
});

test("isSettingsSidebarCandidate accepts the grouped settings nav", () => {
  withDom(`<nav id="sidebar">${buttons("Account", "General", "Appearance", "Connections", "Git", "Environments")}
    </nav>`, (root) => {
    assert.equal(isSettingsSidebarCandidate(root), true);
  });
});

test("isSettingsSidebarCandidate accepts Chinese settings sections", () => {
  withDom(`<nav id="sidebar">${buttons("通用", "外观", "配置", "MCP 服务器")}</nav>`, (root) => {
    assert.equal(isSettingsSidebarCandidate(root), true);
  });
});

test("isSettingsSidebarCandidate rejects the main app sidebar", () => {
  withDom(`<nav id="sidebar">${buttons("New chat", "Search", "Projects", "Settings")}</nav>`, (root) => {
    assert.equal(isSettingsSidebarCandidate(root), false);
  });
});

test("isSettingsSidebarCandidate rejects main navigation with exact settings-named chats", () => {
  withDom(`<nav id="sidebar">${buttons("New chat", "Search", "General", "Appearance", "Git")}</nav>`, (root) => {
    assert.equal(isSettingsSidebarCandidate(root), false);
  });
});

for (const container of ["nav", "aside", 'div role="navigation"']) {
  const tag = container.split(" ")[0];
  test(`isSettingsSidebarCandidate rejects nested chats inside a main ${container}`, () => {
    withDom(`<${container}>${buttons("New chat", "Search")}
      <div id="sidebar">${buttons("General", "Appearance", "Git")}</div></${tag}>`, (root) => {
      assert.equal(isSettingsSidebarCandidate(root), false);
    });
  });
}

test("isSettingsSidebarCandidate checks outer sidebar anchors beyond a nested chat nav", () => {
  withDom(`<aside>${buttons("New chat", "Search")}<nav>
    <div id="sidebar">${buttons("General", "Appearance", "Git")}</div></nav></aside>`, (root) => {
    assert.equal(isSettingsSidebarCandidate(root), false);
  });
});

test("isSettingsSidebarCandidate ignores main navigation outside the settings sidebar", () => {
  withDom(`<aside>${buttons("New chat", "Search", "Settings")}</aside>
    <section><nav id="sidebar">${buttons("General", "Appearance", "Git")}</nav><main>Settings</main></section>`,
  (root) => {
    assert.equal(isSettingsSidebarCandidate(root), true);
  });
});

test("isSettingsSidebarCandidate does not treat Plugins and Settings alone as main navigation", () => {
  withDom(`<nav id="sidebar">${buttons("General", "Appearance", "Git", "Plugins", "Settings")}</nav>`, (root) => {
    assert.equal(isSettingsSidebarCandidate(root), true);
  });
});

for (const attribute of [
  "hidden", "inert", 'aria-hidden="true"', 'style="display:none"',
  'style="visibility:hidden"', 'style="visibility:collapse"',
]) {
  test(`codexPpSettingsLabelsFrom ignores controls under ${attribute}`, () => {
    withDom(`<nav id="sidebar">${buttons("Account")}<div ${attribute}>
      <div>${buttons("General", "Appearance", "Git")}</div></div></nav>`, (root) => {
      assert.deepEqual(codexPpSettingsLabelsFrom(root), ["account"]);
      assert.equal(isSettingsSidebarCandidate(root), false);
    });
  });
}

test("codexPpSettingsLabelsFrom honors hidden controls and root visibility", () => {
  withDom(`<nav id="sidebar" inert>${buttons("General", "Appearance", "Git")}</nav>`, (root) => {
    assert.deepEqual(codexPpSettingsLabelsFrom(root), []);
    assert.equal(isSettingsSidebarCandidate(root), false);
  });
  withDom(`<nav id="sidebar"><button hidden>General</button><button inert>Appearance</button>
    <button aria-hidden="true">Git</button></nav>`, (root) => {
    assert.deepEqual(codexPpSettingsLabelsFrom(root), []);
  });
});

test("codexPpSettingsLabelsFrom ignores zero-size controls", () => {
  withDom(`<nav id="sidebar"><button data-width="0">General</button>
    <button data-height="0">Appearance</button><button>Git</button></nav>`, (root) => {
    assert.deepEqual(codexPpSettingsLabelsFrom(root), ["git"]);
    assert.equal(isSettingsSidebarCandidate(root), false);
  });
});

test("codexPpSettingsLabelsFrom ignores injected settings labels and nested tweak controls", () => {
  withDom(`<nav id="sidebar">${buttons("General")}
    <button data-codexpp="nav-page-test">Appearance</button>
    <div data-codexpp="pages-group"><div>${buttons("Configuration", "Git")}</div></div></nav>`, (root) => {
    assert.deepEqual(codexPpSettingsLabelsFrom(root), ["general"]);
    assert.equal(isSettingsSidebarCandidate(root), false);
  });
});

test("codexPpSettingsLabelsFrom preserves native accessible labels and deduplicates them", () => {
  withDom(`<nav id="sidebar"><button aria-label="  General  "><svg></svg></button>
    <a title="Appearance"><svg></svg></a><div role="button">Git</div><div role="link">General</div></nav>`,
  (root) => {
    assert.deepEqual(codexPpSettingsLabelsFrom(root), ["general", "appearance", "git"]);
    assert.equal(isSettingsSidebarCandidate(root), true);
  });
});

test("isSettingsSidebarCandidate ignores hidden main navigation anchors", () => {
  withDom(`<nav id="sidebar"><div hidden>${buttons("New chat", "Search")}</div>
    ${buttons("General", "Appearance", "Git")}</nav>`, (root) => {
    assert.equal(isSettingsSidebarCandidate(root), true);
  });
});

test("isSettingsSidebarCandidate rejects right-side or hidden candidates", () => {
  for (const attribute of ['data-left="900"', 'style="display:none"']) {
    withDom(`<nav id="sidebar" ${attribute}>${buttons("General", "Appearance", "Git")}</nav>`, (root) => {
      assert.equal(isSettingsSidebarCandidate(root), false);
    });
  }
});

function buttons(...labels: string[]): string {
  return labels.map((label) => `<button>${label}</button>`).join("");
}

function withDom(markup: string, fn: (root: HTMLElement) => void): void {
  const dom = new JSDOM(`<!doctype html><body>${markup}</body>`);
  const { window } = dom;
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    return new window.DOMRect(
      Number(this.dataset.left ?? 0), 0,
      Number(this.dataset.width ?? 300), Number(this.dataset.height ?? 640),
    );
  };
  const names = ["window", "HTMLElement", "getComputedStyle"] as const;
  const previous = names.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: window },
    HTMLElement: { configurable: true, value: window.HTMLElement },
    getComputedStyle: { configurable: true, value: window.getComputedStyle.bind(window) },
  });
  try {
    fn(window.document.getElementById("sidebar")!);
  } finally {
    names.forEach((name, index) => {
      const descriptor = previous[index];
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
    window.close();
  }
}
