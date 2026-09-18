import assert from "node:assert/strict";
import test from "node:test";
import * as platform from "../src/platform";

test("Store repair follows upgrades within the same package family", () => {
  const old = "C:\\local\\codex-plusplus\\store-apps\\OpenAI.Codex_1.0.0.0_x64__publisher\\app";
  const current = "C:\\Program Files\\WindowsApps\\OpenAI.Codex_2.0.0.0_x64__publisher";
  const stores = [
    { name: "OpenAI.Codex", installLocation: current },
    { name: "OpenAI.Codex", installLocation: "C:\\WindowsApps\\OpenAI.Codex_3.0.0.0_x64__other" },
  ];
  assert.equal(platform.resolveWindowsStoreRepairRoot(old, stores), current + "\\app");
  assert.equal(platform.resolveWindowsStoreRepairRoot(current.replace("C:\\Program Files\\WindowsApps",
    "C:\\local\\codex-plusplus\\store-apps") + "\\app", stores),
  "C:\\local\\codex-plusplus\\store-apps\\OpenAI.Codex_2.0.0.0_x64__publisher\\app");
  assert.equal(platform.resolveWindowsStoreRepairRoot("C:\\Programs\\Codex", stores), "C:\\Programs\\Codex");
  assert.throws(() => platform.resolveWindowsStoreRepairRoot(old, []), /not installed/i);
});
