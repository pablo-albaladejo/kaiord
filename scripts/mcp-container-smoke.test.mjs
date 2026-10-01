// Tests for scripts/mcp-container-smoke.mjs using node:test.
//
// The checker takes the server command as argv, so these run it against
// scripts/fixtures/fake-mcp-server.mjs instead of a container: no Docker, no
// image build, and every failure mode reachable on demand through
// FAKE_MCP_MODE. What is under test is the checker's judgement — that each
// way a real image can come up broken is actually reported, and that a
// healthy server passes.

import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHECKER = resolve(__dirname, "mcp-container-smoke.mjs");
const FAKE_SERVER = resolve(__dirname, "fixtures", "fake-mcp-server.mjs");

function runChecker(mode) {
  const result = spawnSync(
    process.execPath,
    [CHECKER, process.execPath, FAKE_SERVER],
    {
      encoding: "utf8",
      env: { ...process.env, FAKE_MCP_MODE: mode },
      timeout: 30_000,
    }
  );
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

test("passes against a server that behaves", () => {
  const { status, output } = runChecker("ok");

  assert.equal(status, 0, output);
  assert.match(output, /MCP container smoke test passed/);
  assert.match(output, /2 tools, all described/);
});

test("fails when the server identifies as something else", () => {
  const { status, output } = runChecker("wrong-name");

  assert.equal(status, 1);
  assert.match(output, /expected serverInfo\.name kaiord-mcp/);
});

test("fails when the tool surface came up empty", () => {
  const { status, output } = runChecker("no-tools");

  assert.equal(status, 1);
  assert.match(output, /advertised no tools/);
});

test("fails when a tool ships without a description", () => {
  const { status, output } = runChecker("undescribed");

  assert.equal(status, 1);
  assert.match(output, /tools with no description: kaiord_convert/);
});

test("fails when an expected tool is absent", () => {
  const { status, output } = runChecker("missing-tool");

  assert.equal(status, 1);
  assert.match(output, /kaiord_convert is missing from the tool list/);
});

// The failure this check exists for: an image with no JVM converts every
// format except ZWO, and blames the file rather than the missing runtime.
test("fails when ZWO conversion cannot reach a JVM", () => {
  const { status, output } = runChecker("no-jvm");

  assert.equal(status, 1);
  assert.match(output, /is a JVM on the image\?/);
  assert.match(output, /does not conform to XSD schema/);
});

test("fails when the conversion does not come back as KRD JSON", () => {
  const { status, output } = runChecker("bad-krd");

  assert.equal(status, 1);
  assert.match(output, /did not return KRD JSON/);
});

test("fails when the KRD it just produced does not validate", () => {
  const { status, output } = runChecker("invalid-krd");

  assert.equal(status, 1);
  assert.match(output, /kaiord_validate rejected the KRD/);
});

// stdout belongs to the JSON-RPC frame; the server logs to stderr for exactly
// this reason, and a regression there desynchronises every MCP client.
test("fails when the server writes plain text to stdout", () => {
  const { status, output } = runChecker("stdout-noise");

  assert.equal(status, 1);
  assert.match(output, /non-JSON line on stdout/);
});

test("fails when the server command cannot be run at all", () => {
  const result = spawnSync(
    process.execPath,
    [CHECKER, join(__dirname, "does-not-exist-kaiord-mcp")],
    { encoding: "utf8", timeout: 30_000 }
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  assert.equal(result.status, 1, output);
  assert.match(output, /could not run/);
});
