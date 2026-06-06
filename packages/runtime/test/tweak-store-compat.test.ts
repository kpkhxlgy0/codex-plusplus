import assert from "node:assert/strict";
import test from "node:test";
import type { TweakStoreEntry } from "../src/tweak-store";
import {
  cleanMinRuntime,
  formatStorePlatforms,
  storeEntryPlatformCompatibility,
  storeEntryRuntimeCompatibility,
} from "../src/tweak-store-compat";

test("formatStorePlatforms renders user-facing platform names", () => {
  assert.equal(formatStorePlatforms(["darwin", "win32", "linux"]), "macOS, Windows, Linux");
  assert.equal(formatStorePlatforms(null), "supported platforms");
});

test("cleanMinRuntime accepts simple >= semver constraints", () => {
  assert.equal(cleanMinRuntime(">=1.2.3"), "1.2.3");
  assert.equal(cleanMinRuntime(">1.2.3"), "1.2.3");
  assert.equal(cleanMinRuntime("v1.2.3"), "1.2.3");
  assert.equal(cleanMinRuntime("latest"), null);
  assert.equal(cleanMinRuntime(undefined), null);
});

test("storeEntryPlatformCompatibility accepts unrestricted and matching entries", () => {
  assert.deepEqual(
    storeEntryPlatformCompatibility(entry({ platforms: undefined }), "darwin"),
    {
      current: "darwin",
      supported: null,
      compatible: true,
      reason: null,
    },
  );

  assert.equal(storeEntryPlatformCompatibility(entry({ platforms: ["linux"] }), "linux").compatible, true);
});

test("storeEntryPlatformCompatibility rejects unsupported platforms", () => {
  const result = storeEntryPlatformCompatibility(entry({ platforms: ["darwin"] }), "linux");

  assert.equal(result.compatible, false);
  assert.equal(result.reason, "Example Tweak is only available on macOS.");
});

test("storeEntryRuntimeCompatibility evaluates minRuntime against current runtime", () => {
  assert.deepEqual(
    storeEntryRuntimeCompatibility(entry({ minRuntime: ">=1.0.0" }), "1.0.1"),
    {
      current: "1.0.1",
      required: "1.0.0",
      compatible: true,
      reason: null,
    },
  );

  const incompatible = storeEntryRuntimeCompatibility(entry({ minRuntime: "1.2.0" }), "1.0.1");
  assert.equal(incompatible.compatible, false);
  assert.equal(incompatible.reason, "Example Tweak requires Codex++ 1.2.0 or newer.");
});

function entry(options: {
  platforms?: TweakStoreEntry["platforms"];
  minRuntime?: unknown;
} = {}): TweakStoreEntry {
  return {
    id: "co.example.tweak",
    repo: "example/tweak",
    approvedCommitSha: "a".repeat(40),
    approvedAt: "2026-06-06T00:00:00.000Z",
    approvedBy: "tester",
    platforms: options.platforms,
    manifest: {
      id: "co.example.tweak",
      name: "Example Tweak",
      version: "1.0.0",
      description: "Test tweak",
      githubRepo: "example/tweak",
      ...(options.minRuntime === undefined ? {} : { minRuntime: options.minRuntime as string }),
    },
  };
}
