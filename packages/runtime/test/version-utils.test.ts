import assert from "node:assert/strict";
import test from "node:test";
import { compareVersions, normalizeVersion } from "../src/version-utils";

test("normalizeVersion strips leading v and whitespace", () => {
  assert.equal(normalizeVersion(" v1.2.3 "), "1.2.3");
});

test("compareVersions compares major minor patch values", () => {
  assert.equal(compareVersions("1.2.3", "1.2.3"), 0);
  assert.equal(compareVersions("1.2.4", "1.2.3"), 1);
  assert.equal(compareVersions("2.0.0", "1.9.9"), 1);
  assert.equal(compareVersions("1.2.3", "1.3.0"), -1);
});

test("compareVersions treats malformed values as equal", () => {
  assert.equal(compareVersions("next", "1.2.3"), 0);
  assert.equal(compareVersions("1.2", "1.2.3"), 0);
});
