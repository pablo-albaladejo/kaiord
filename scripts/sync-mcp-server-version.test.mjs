// Tests for sync-mcp-server-version.mjs: the release bump carries the
// @kaiord/mcp version into server.json and the published server card, and
// the committed files agree.
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

import {
  syncCardVersion,
  syncServerVersion,
} from "./sync-mcp-server-version.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(ROOT, "scripts", "sync-mcp-server-version.mjs");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const CARD = "packages/landing/public/.well-known/mcp/server-card.json";

const server = (version) => ({
  name: "io.github.pablo-albaladejo/kaiord",
  version,
  packages: [{ registryType: "npm", identifier: "@kaiord/mcp", version }],
  remotes: [{ type: "streamable-http", url: "https://kaiord.com/mcp" }],
});

const card = (version) => ({
  name: "io.github.pablo-albaladejo/kaiord",
  version,
  serverInfo: { name: "kaiord", version },
  remotes: [{ type: "streamable-http", url: "https://kaiord.com/mcp" }],
});

const withRoot = (pkgVersion, serverJson, run, cardJson = card("10.4.0")) => {
  const root = mkdtempSync(join(tmpdir(), "kaiord-mcp-sync-"));
  const dir = join(root, "packages", "mcp");
  mkdirSync(dir, { recursive: true });
  mkdirSync(dirname(join(root, CARD)), { recursive: true });
  writeFileSync(join(root, CARD), JSON.stringify(cardJson));
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

  it("should move both server card versions to the package version", () => {
    withRoot("10.5.0", server("10.4.0"), (root) => {
      const r = spawnSync(process.execPath, [SCRIPT, root], {
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      const synced = readJson(join(root, CARD));
      assert.equal(synced.version, "10.5.0");
      assert.equal(synced.serverInfo.version, "10.5.0");
      assert.deepEqual(synced.remotes, card("x").remotes);
    });
  });

  it("should sync a stale card even when server.json already matches", () => {
    withRoot("10.5.0", server("10.5.0"), (root) => {
      const r = spawnSync(process.execPath, [SCRIPT, root], {
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /synced to 10\.5\.0/);
      assert.equal(readJson(join(root, CARD)).version, "10.5.0");
    });
  });

  it("should leave matching files byte-identical", () => {
    const text = `${JSON.stringify(server("10.5.0"), null, 2)}\n`;
    const cardText = `${JSON.stringify(card("10.5.0"), null, 2)}\n`;
    withRoot("10.5.0", server("10.5.0"), (root, path) => {
      writeFileSync(path, text);
      writeFileSync(join(root, CARD), cardText);
      const r = spawnSync(process.execPath, [SCRIPT, root], {
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /already at 10\.5\.0/);
      assert.equal(readFileSync(path, "utf8"), text);
      assert.equal(readFileSync(join(root, CARD), "utf8"), cardText);
    });
  });

  it("should fail when the server card has no serverInfo", () => {
    const { serverInfo: _drop, ...bad } = card("10.4.0");
    withRoot(
      "10.5.0",
      server("10.4.0"),
      (root) => {
        const r = spawnSync(process.execPath, [SCRIPT, root], {
          encoding: "utf8",
        });
        assert.equal(r.status, 1);
        assert.match(r.stderr, /server-card.json has no serverInfo/);
      },
      bad
    );
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
    assert.equal(syncCardVersion(card("1.0.0"), "1.0.0"), false);
    assert.equal(syncCardVersion(card("1.0.0"), "1.1.0"), true);
  });

  it("should keep the committed server.json on the @kaiord/mcp version", () => {
    const { version } = readJson(join(ROOT, "packages/mcp/package.json"));
    const committed = readJson(join(ROOT, "packages/mcp/server.json"));
    assert.equal(committed.version, version);
    assert.equal(committed.packages[0].version, version);
  });

  it("should keep the committed server card on the @kaiord/mcp version", () => {
    const { version } = readJson(join(ROOT, "packages/mcp/package.json"));
    const committed = readJson(join(ROOT, CARD));
    assert.equal(committed.version, version);
    assert.equal(committed.serverInfo.version, version);
  });
});
