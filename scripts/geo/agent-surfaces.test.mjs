import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { REMOTE_TOOLS, ROWS, checkRow, run } from "./agent-surfaces.mjs";

const ROW = {
  name: "card",
  url: "https://kaiord.com/card.json",
  typePrefix: "application/json",
  cors: true,
  parse: "json",
  predicate: (body) => body.ok === true,
};

const reply =
  (text, { status = 200, type = "application/json", cors = "*" } = {}) =>
  async () =>
    new Response(text, {
      status,
      headers: { "content-type": type, "access-control-allow-origin": cors },
    });

const silent = { log: { log: () => {} } };

describe("agent-surfaces", () => {
  it("should pass a row whose reply matches every expectation", async () => {
    // Arrange
    const fetch = reply('{"ok":true}');

    // Act
    const result = await checkRow(ROW, fetch);

    // Assert
    assert.deepEqual(result, { name: "card", reason: null });
  });

  for (const [label, fetch, reason] of [
    ["a 404", reply("", { status: 404 }), "status 404"],
    [
      "a wrong type",
      reply("{}", { type: "text/html" }),
      'content-type "text/html"',
    ],
    ["missing CORS", reply('{"ok":true}', { cors: "" }), "missing CORS *"],
    ["a non-JSON body", reply("<html>"), "body is not JSON"],
    ["a failed predicate", reply('{"ok":false}'), "body check failed"],
  ]) {
    it(`should report ${label} as a failed row`, async () => {
      // Arrange
      const row = ROW;

      // Act
      const result = await checkRow(row, fetch);

      // Assert
      assert.equal(result.reason, reason);
    });
  }

  it("should report a fetch that throws instead of throwing", async () => {
    // Arrange
    const fetch = async () => {
      throw new Error("offline");
    };

    // Act
    const result = await checkRow(ROW, fetch);

    // Assert
    assert.equal(result.reason, "fetch failed: offline");
  });

  it("should name every failed row and keep checking the others", async () => {
    // Arrange
    const rows = [
      ROW,
      { ...ROW, name: "other" },
      { ...ROW, name: "bad", url: "x" },
    ];
    const fetch = async (url) =>
      url === "x" ? reply("", { status: 500 })() : reply('{"ok":true}')();

    // Act
    const failed = await run({ rows, fetch, ...silent });

    // Assert
    assert.deepEqual(failed, ["bad"]);
  });

  it("should expect the tools the remote worker registers", () => {
    // Arrange
    const path = new URL(
      "../../packages/mcp-worker/src/limits.ts",
      import.meta.url
    );
    const limits = readFileSync(path, "utf8");

    // Act
    const registered = [...limits.matchAll(/"(kaiord_[a-z_]+)"/g)].map(
      (m) => m[1]
    );

    // Assert
    assert.deepEqual([...registered].sort(), REMOTE_TOOLS);
  });

  it("should accept the live tools/list reply shape", () => {
    // Arrange
    const row = ROWS.find((r) => r.method === "POST");
    const body = {
      result: { tools: [...REMOTE_TOOLS].reverse().map((name) => ({ name })) },
    };

    // Act
    const ok = row.predicate(body);

    // Assert
    assert.equal(ok, true);
  });
});
