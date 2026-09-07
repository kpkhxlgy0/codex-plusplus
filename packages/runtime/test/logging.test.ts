import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendCappedLog } from "../src/logging";

test("small entries in a full log do not cause file-sized I/O on every append", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "codexpp-log-"));
  try {
    const file = join(dir, "preload.log");
    const cap = 64 * 1024;
    writeFileSync(file, "a".repeat(cap));
    let readBytes = 0;
    let writtenBytes = 0;
    let depth = 0;
    // Count at public API boundaries: Node versions differ in whether the
    // whole-file helpers call exported read/write functions internally.
    for (const method of ["readFileSync", "readSync", "writeFileSync", "appendFileSync"] as const) {
      const original = fs[method];
      t.mock.method(fs, method, (...args: unknown[]) => {
        depth++;
        try {
          const result = Reflect.apply(original, fs, args);
          if (depth === 1) {
            if (method === "readFileSync") readBytes += Buffer.byteLength(result);
            else if (method === "readSync") readBytes += result;
            else writtenBytes += Buffer.byteLength(args[1] as Buffer);
          }
          return result;
        } finally {
          depth--;
        }
      });
    }
    for (let i = 0; i < 100; i++) appendCappedLog(file, "b".repeat(200), cap);
    assert.ok(readBytes <= cap, `read ${readBytes} bytes for only 20 KB of new logs`);
    assert.ok(writtenBytes >= 20_000, "the I/O counter must observe the appended bytes");
    assert.ok(writtenBytes <= cap + 20_000, `wrote ${writtenBytes} bytes for only 20 KB of new logs`);
    t.mock.restoreAll();
    assert.ok(fs.statSync(file).size <= cap);
    assert.ok(readFileSync(file, "utf8").endsWith("b".repeat(20_000)));
  } finally {
    t.mock.restoreAll();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("appendCappedLog leaves room for subsequent entries after reaching the cap", () => {
  const dir = mkdtempSync(join(tmpdir(), "codexpp-log-"));
  try {
    const file = join(dir, "preload.log");
    writeFileSync(file, "old\n".repeat(25));
    appendCappedLog(file, "first\n", 100);
    const retained = readFileSync(file, "utf8");
    assert.ok(retained.endsWith("first\n"));
    assert.ok(retained.length > "first\n".length, "keep recent history");
    for (let i = 0; i < 5; i++) appendCappedLog(file, "next\n", 100);
    assert.equal(readFileSync(file, "utf8"), retained + "next\n".repeat(5),
      "small appends must not keep trimming and rewriting the retained history");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("appendCappedLog keeps log files at or below the byte cap", () => {
  const dir = mkdtempSync(join(tmpdir(), "codexpp-log-"));
  try {
    const file = join(dir, "main.log");
    writeFileSync(file, "a".repeat(95));
    appendCappedLog(file, "b".repeat(20), 100);
    const data = readFileSync(file, "utf8");
    assert.ok(Buffer.byteLength(data) <= 100);
    assert.equal(data, `${"a".repeat(30)}${"b".repeat(20)}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("appendCappedLog truncates oversized entries to the byte cap", () => {
  const dir = mkdtempSync(join(tmpdir(), "codexpp-log-"));
  try {
    const file = join(dir, "preload.log");
    appendCappedLog(file, "abcdef", 4);
    assert.equal(readFileSync(file, "utf8"), "cdef");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
