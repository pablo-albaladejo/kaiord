// Tests for sync-mcp-server-version.mjs: the release bump carries the
// @kaiord/mcp version into server.json, and the committed pair agrees.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { syncServerVersion } from "./sync-mcp-server-version.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "sync-mcp-server-version.mjs");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const server = (version) => ({
  name: "io.github.pablo-albaladejo/kaiord",
  version,
  packages: [{ registryType: "npm", identifier: "@kaiord/mcp", version }],
  remotes: [{ type: "streamable-http", url: "https://kaiord.com/mcp" }],
});

const withRoot = (pkgVersion, serverJson, run) => {
  const root = mkdtempSync(join(tmpdir(), "kaiord-mcp-sync-"));
  const dir = join(root, "packages", "mcp");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ version: pkgVersion })
  );
  writeFileSync(join(dir, "server.json"), JSON.stringify(serverJson));
  try {
    return run(root, join(dir, "server.json"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

describe("sync-mcp-server-version", () => {
  it("should move both server.json versions to the package version", () => {
    withRoot("10.5.0", server("10.4.0"), (root, path) => {
      const r = spawnSync(process.execPath, [SCRIPT, root], {
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      const synced = readJson(path);
      assert.equal(synced.version, "10.5.0");
      assert.equal(synced.packages[0].version, "10.5.0");
      assert.deepEqual(synced.remotes, server("x").remotes);
    });
  });

  it("should leave a matching server.json byte-identical", () => {
    const text = `${JSON.stringify(server("10.5.0"), null, 2)}\n`;
    withRoot("10.5.0", server("10.5.0"), (root, path) => {
      writeFileSync(path, text);
      const r = spawnSync(process.execPath, [SCRIPT, root], {
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      assert.equal(readFileSync(path, "utf8"), text);
    });
  });

  it("should fail when server.json lists no @kaiord/mcp npm package", () => {
    const bad = { ...server("10.4.0"), packages: [] };
    withRoot("10.5.0", bad, (root) => {
      const r = spawnSync(process.execPath, [SCRIPT, root], {
        encoding: "utf8",
      });
      assert.equal(r.status, 1);
      assert.match(r.stderr, /no npm package @kaiord\/mcp/);
    });
  });

  it("should report whether anything changed", () => {
    assert.equal(syncServerVersion(server("1.0.0"), "1.0.0"), false);
    assert.equal(syncServerVersion(server("1.0.0"), "1.1.0"), true);
  });

  it("should keep the committed server.json on the @kaiord/mcp version", () => {
    const { version } = readJson(join(ROOT, "packages/mcp/package.json"));
    const committed = readJson(join(ROOT, "packages/mcp/server.json"));
    assert.equal(committed.version, version);
    assert.equal(committed.packages[0].version, version);
  });
});
