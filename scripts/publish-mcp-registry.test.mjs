// Tests for publish-mcp-registry.mjs: the registry entry is published only
// after npm has the version, and every failure path is loud.
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";

import { publishMcpRegistry } from "./publish-mcp-registry.mjs";

const NAME = "io.github.pablo-albaladejo/kaiord";

const run = async ({ npmFails = 0, status = 404, publishFails = false }) => {
  const root = mkdtempSync(join(tmpdir(), "mcp-registry-"));
  mkdirSync(join(root, "packages", "mcp"), { recursive: true });
  writeFileSync(
    join(root, "packages", "mcp", "server.json"),
    JSON.stringify({ name: NAME, version: "1.2.3" })
  );
  const calls = [];
  const urls = [];
  let npmLeft = npmFails;
  const exec = (cmd, args) => {
    calls.push([cmd, ...args].join(" "));
    if (cmd === "npm" && npmLeft-- > 0) throw new Error("E404");
    if (args[0] === "publish" && publishFails) throw new Error("boom");
  };
  const fetch = async (url) => (urls.push(url), { status });
  let error;
  try {
    await publishMcpRegistry({
      root,
      exec,
      fetch,
      sleep: async () => {},
      log: () => {},
      publisher: "pub",
      attempts: 4,
    });
  } catch (e) {
    error = e;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  return { calls, urls, error };
};

describe("publishMcpRegistry", () => {
  it("should skip login and publish when the registry already has the version", async () => {
    const { calls, urls, error } = await run({ status: 200 });
    assert.equal(error, undefined);
    assert.deepEqual(calls, ["npm view @kaiord/mcp@1.2.3 version"]);
    assert.match(
      urls[0],
      /io\.github\.pablo-albaladejo%2Fkaiord\/versions\/1\.2\.3$/
    );
  });

  it("should wait for npm, then login and publish in order", async () => {
    const { calls, error } = await run({ npmFails: 3 });
    assert.equal(error, undefined);
    assert.equal(calls.filter((c) => c.startsWith("npm")).length, 4);
    assert.deepEqual(calls.slice(-2), ["pub login github-oidc", "pub publish"]);
  });

  it("should fail without publishing when npm never has the version", async () => {
    const { calls, error } = await run({ npmFails: 99 });
    assert.match(
      error.message,
      /@kaiord\/mcp@1\.2\.3 not on npm after 4 attempts/
    );
    assert.ok(!calls.some((c) => c.startsWith("pub")));
  });

  it("should fail when the registry lookup returns an unexpected status", async () => {
    const { calls, error } = await run({ status: 500 });
    assert.match(error.message, /HTTP 500/);
    assert.ok(!calls.some((c) => c.startsWith("pub")));
  });

  it("should fail when the publish command fails", async () => {
    const { error } = await run({ publishFails: true });
    assert.match(error.message, /boom/);
  });
});
