import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  REMOTE_TOOLS,
  ROWS,
  cardMatchesTools,
  checkRow,
  isAgentCard,
  isAiCatalog,
  isApiCatalog,
  isCompletedTask,
  isPoppy,
  isServerCard,
  isSkillsIndex,
  run,
} from "./agent-surfaces.mjs";

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

  for (const [file, predicate] of [
    ["mcp/server-card.json", isServerCard],
    ["ai-catalog.json", isAiCatalog],
    ["agent-skills/index.json", isSkillsIndex],
    ["api-catalog", isApiCatalog],
    ["poppy.json", isPoppy],
    ["agent-card.json", isAgentCard],
  ]) {
    it(`should accept the published ${file} and reject an empty object`, () => {
      // Arrange
      const path = new URL(
        `../../packages/landing/public/.well-known/${file}`,
        import.meta.url
      );
      const published = JSON.parse(readFileSync(path, "utf8"));

      // Act
      const verdicts = [predicate(published), predicate({})];

      // Assert
      assert.deepEqual(verdicts, [true, false]);
    });
  }

  it("should reject an api-catalog anchor with no card of its own", () => {
    // Arrange
    const context = {
      anchor: "https://kaiord.com/a2a",
      "service-desc": [
        { href: "https://kaiord.com/.well-known/mcp/server-card.json" },
      ],
    };

    // Act
    const ok = isApiCatalog({ linkset: [context] });

    // Assert
    assert.equal(ok, false);
  });

  it("should fail a row whose reply stalls past the deadline", async () => {
    // Arrange
    // A stalled socket keeps the event loop alive; the signal's own timer
    // is unref'd, so the fake holds a ref'd handle the way a socket would.
    const fetch = (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        const socket = setInterval(() => {}, 1_000);
        signal.addEventListener("abort", () => {
          clearInterval(socket);
          reject(signal.reason);
        });
      });

    // Act
    const result = await checkRow(ROW, fetch, 10);

    // Assert
    assert.match(result.reason, /^fetch failed: /);
  });

  const toolsReply = (names) => ({
    result: { tools: names.map((name) => ({ name })) },
  });
  const cardOf = (ids) => ({ skills: ids.map((id) => ({ id })) });

  it("should reject an agent card on another protocol binding", () => {
    // Arrange
    const card = {
      supportedInterfaces: [
        { url: "https://kaiord.com/a2a", protocolBinding: "GRPC" },
      ],
    };

    // Act
    const ok = isAgentCard(card);

    // Assert
    assert.equal(ok, false);
  });

  it("should reject a catalog that lost the A2A anchor", () => {
    // Arrange
    const catalog = {
      linkset: [
        {
          anchor: "https://kaiord.com/mcp",
          "service-desc": [
            { href: "https://kaiord.com/.well-known/mcp/server-card.json" },
          ],
        },
      ],
    };

    // Act
    const ok = isApiCatalog(catalog);

    // Assert
    assert.equal(ok, false);
  });

  it("should send SendMessage with the version header and no contextId", () => {
    // Arrange
    const row = ROWS.find((r) => r.name === "POST /a2a SendMessage");

    // Act
    const { params } = JSON.parse(row.body);

    // Assert
    assert.equal(row.url, "https://kaiord.com/a2a");
    assert.equal(row.headers["A2A-Version"], "1.0");
    assert.deepEqual(params.message.parts, [
      { data: { skill: "kaiord_list_formats" } },
    ]);
    assert.equal("contextId" in params.message, false);
  });

  for (const [label, body, expected] of [
    [
      "a completed task with text",
      {
        result: {
          task: {
            status: { state: "TASK_STATE_COMPLETED" },
            artifacts: [{ parts: [{ text: "formats" }] }],
          },
        },
      },
      true,
    ],
    [
      "a completed task with empty text",
      {
        result: {
          task: {
            status: { state: "TASK_STATE_COMPLETED" },
            artifacts: [{ parts: [{ text: "" }] }],
          },
        },
      },
      false,
    ],
    [
      "a failed task",
      {
        result: {
          task: {
            status: { state: "TASK_STATE_FAILED" },
            artifacts: [{ parts: [{ text: "x" }] }],
          },
        },
      },
      false,
    ],
    ["a JSON-RPC error", { error: { code: -32009 } }, false],
  ]) {
    it(`should judge ${label} as ${expected}`, () => {
      // Arrange
      const judge = isCompletedTask;

      // Act
      const ok = judge(body);

      // Assert
      assert.equal(ok, expected);
    });
  }

  it("should compare card skills with live tools in any order", () => {
    // Arrange
    const card = cardOf(["b", "a"]);

    // Act
    const verdicts = [
      cardMatchesTools(card, toolsReply(["a", "b"])),
      cardMatchesTools(card, toolsReply(["a"])),
      cardMatchesTools(cardOf([]), toolsReply([])),
      cardMatchesTools(card, {}),
    ];

    // Assert
    assert.deepEqual(verdicts, [true, false, false, false]);
  });

  it("should fetch both replies for the card-vs-tools row", async () => {
    // Arrange
    const row = ROWS.find((r) => r.joins);
    const card = JSON.stringify(cardOf(REMOTE_TOOLS));
    const tools = JSON.stringify(toolsReply(REMOTE_TOOLS));
    const fetch = async (url) =>
      url.endsWith("/mcp") ? reply(tools)() : reply(card)();

    // Act
    const result = await checkRow(row, fetch);

    // Assert
    assert.equal(result.reason, null);
  });

  it("should fail the card-vs-tools row when the tools reply fails", async () => {
    // Arrange
    const row = ROWS.find((r) => r.joins);
    const card = JSON.stringify(cardOf(REMOTE_TOOLS));
    const fetch = async (url) =>
      url.endsWith("/mcp") ? reply("", { status: 500 })() : reply(card)();

    // Act
    const result = await checkRow(row, fetch);

    // Assert
    assert.equal(result.reason, "joined reply: status 500");
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
