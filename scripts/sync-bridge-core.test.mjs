import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncBridgeCore, BRIDGE_CORE_MASTERS } from "./sync-bridge-core.mjs";

const FIXTURE_MASTERS = [
  {
    master: "alpha.js",
    dest: "alpha.js",
    bridges: ["one-bridge", "two-bridge"],
  },
  { master: "beta.js", dest: "beta.js", bridges: ["one-bridge"] },
  {
    master: "test/mock.js",
    dest: "test/mock.js",
    bridges: ["one-bridge", "two-bridge"],
  },
];

describe("syncBridgeCore", () => {
  let root;
  let mastersDir;
  let packagesDir;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "bridge-core-sync-"));
    mastersDir = join(root, "_shared", "bridge-core");
    packagesDir = join(root, "packages");
    mkdirSync(join(mastersDir, "test"), { recursive: true });
    mkdirSync(join(packagesDir, "one-bridge"), { recursive: true });
    mkdirSync(join(packagesDir, "two-bridge"), { recursive: true });
    writeFileSync(join(mastersDir, "alpha.js"), "alpha();\n");
    writeFileSync(join(mastersDir, "beta.js"), "beta();\n");
    writeFileSync(join(mastersDir, "test/mock.js"), "mock();\n");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("copies every master byte-for-byte to every listed bridge", () => {
    const copied = syncBridgeCore({
      mastersDir,
      packagesDir,
      masters: FIXTURE_MASTERS,
    });

    assert.equal(
      readFileSync(join(packagesDir, "one-bridge", "alpha.js"), "utf8"),
      "alpha();\n"
    );
    assert.equal(
      readFileSync(join(packagesDir, "two-bridge", "alpha.js"), "utf8"),
      "alpha();\n"
    );
    assert.equal(copied.length, 5);
  });

  it("skips bridges outside a master's consumer set", () => {
    syncBridgeCore({ mastersDir, packagesDir, masters: FIXTURE_MASTERS });

    assert.throws(() =>
      readFileSync(join(packagesDir, "two-bridge", "beta.js"))
    );
  });

  it("creates nested destination directories (test/ masters)", () => {
    syncBridgeCore({ mastersDir, packagesDir, masters: FIXTURE_MASTERS });

    assert.equal(
      readFileSync(join(packagesDir, "two-bridge", "test/mock.js"), "utf8"),
      "mock();\n"
    );
  });

  it("throws when a master file is missing", () => {
    rmSync(join(mastersDir, "beta.js"));

    assert.throws(
      () =>
        syncBridgeCore({ mastersDir, packagesDir, masters: FIXTURE_MASTERS }),
      /beta\.js/
    );
  });
});

describe("BRIDGE_CORE_MASTERS table", () => {
  it("declares a non-empty consumer set and destination per master", () => {
    assert.ok(BRIDGE_CORE_MASTERS.length >= 6);
    for (const entry of BRIDGE_CORE_MASTERS) {
      assert.ok(entry.master, "master path required");
      assert.ok(entry.dest, "dest path required");
      assert.ok(entry.bridges.length > 0, `${entry.master} has no bridges`);
      for (const bridge of entry.bridges) {
        assert.match(bridge, /^(garmin|train2go|whoop|tanita)-bridge$/);
      }
    }
  });

  it("vendors the snapshot popup module only to snapshot bridges", () => {
    const snapshot = BRIDGE_CORE_MASTERS.find(
      (e) => e.master === "bridge-popup-snapshot.js"
    );
    assert.deepEqual(snapshot.bridges, ["garmin-bridge", "train2go-bridge"]);
  });
});
