import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { hasTodayEntry, todayIso, writeIfChanged } from "./observatory-lib.mjs";

const STRIP_TIMESTAMP = /^_Generated .+$/m;

describe("hasTodayEntry", () => {
  it("should return false when the log file does not exist", () => {
    const dir = mkdtempSync(join(tmpdir(), "hasTodayEntry-"));
    const missing = join(dir, "gsc.jsonl");

    assert.equal(hasTodayEntry(missing, "gsc"), false);
    rmSync(dir, { recursive: true });
  });

  it("should return true when today's date and source both match a row", () => {
    const dir = mkdtempSync(join(tmpdir(), "hasTodayEntry-"));
    const log = join(dir, "gsc.jsonl");
    writeFileSync(log, `${JSON.stringify({ date: todayIso(), source: "gsc" })}\n`);

    assert.equal(hasTodayEntry(log, "gsc"), true);
    rmSync(dir, { recursive: true });
  });

  it("should return false when the date matches but the source does not", () => {
    const dir = mkdtempSync(join(tmpdir(), "hasTodayEntry-"));
    const log = join(dir, "gsc.jsonl");
    writeFileSync(log, `${JSON.stringify({ date: todayIso(), source: "bing" })}\n`);

    assert.equal(hasTodayEntry(log, "gsc"), false);
    rmSync(dir, { recursive: true });
  });

  it("should return false when the source matches but the date is not today", () => {
    const dir = mkdtempSync(join(tmpdir(), "hasTodayEntry-"));
    const log = join(dir, "gsc.jsonl");
    writeFileSync(log, `${JSON.stringify({ date: "2020-01-01", source: "gsc" })}\n`);

    assert.equal(hasTodayEntry(log, "gsc"), false);
    rmSync(dir, { recursive: true });
  });
});

describe("writeIfChanged", () => {
  it("should write when the target file does not exist yet", () => {
    const dir = mkdtempSync(join(tmpdir(), "writeIfChanged-"));
    const target = join(dir, "DASHBOARD.md");

    const wrote = writeIfChanged(target, "_Generated 2026-01-01 00:00 UTC_\nbody\n", STRIP_TIMESTAMP);

    assert.equal(wrote, true);
    assert.equal(readFileSync(target, "utf8"), "_Generated 2026-01-01 00:00 UTC_\nbody\n");
    rmSync(dir, { recursive: true });
  });

  it("should skip the write when only the stripped timestamp line differs", () => {
    const dir = mkdtempSync(join(tmpdir(), "writeIfChanged-"));
    const target = join(dir, "DASHBOARD.md");
    writeFileSync(target, "_Generated 2026-01-01 00:00 UTC_\nbody\n");

    const wrote = writeIfChanged(target, "_Generated 2026-01-02 03:04 UTC_\nbody\n", STRIP_TIMESTAMP);

    assert.equal(wrote, false);
    assert.equal(readFileSync(target, "utf8"), "_Generated 2026-01-01 00:00 UTC_\nbody\n");
    rmSync(dir, { recursive: true });
  });

  it("should write when content differs beyond the stripped timestamp line", () => {
    const dir = mkdtempSync(join(tmpdir(), "writeIfChanged-"));
    const target = join(dir, "DASHBOARD.md");
    writeFileSync(target, "_Generated 2026-01-01 00:00 UTC_\nbody\n");

    const wrote = writeIfChanged(target, "_Generated 2026-01-02 03:04 UTC_\nnew body\n", STRIP_TIMESTAMP);

    assert.equal(wrote, true);
    assert.equal(readFileSync(target, "utf8"), "_Generated 2026-01-02 03:04 UTC_\nnew body\n");
    rmSync(dir, { recursive: true });
  });

  it("should propagate a non-ENOENT read error instead of treating it as a first run", () => {
    const dir = mkdtempSync(join(tmpdir(), "writeIfChanged-"));
    const target = join(dir, "DASHBOARD.md");
    writeFileSync(target, "body\n");
    chmodSync(target, 0o000);

    try {
      assert.throws(() => writeIfChanged(target, "body\n", STRIP_TIMESTAMP));
    } finally {
      chmodSync(target, 0o644);
      rmSync(dir, { recursive: true });
    }
  });
});
