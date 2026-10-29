// Tests for scripts/smoke.mjs and scripts/smoke-checks.mjs (task 3.5).
//
// A fake endpoint stands in for the Worker: it answers each check the way a
// healthy deploy does (its FIT output is written by the real @kaiord/fit
// writer), and each `break*` option breaks exactly one behaviour.
import { strict as assert } from "node:assert";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { createFitWriter } from "@kaiord/fit";

import {
  CHECKS,
  MAX_BODY_BYTES,
  REMOTE_TOOLS,
  SMOKE_KRD,
} from "./smoke-checks.mjs";
import { endpointOf, main, runSmoke } from "./smoke.mjs";

const SMOKE = join(dirname(fileURLToPath(import.meta.url)), "smoke.mjs");
const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const silent = { log() {}, error() {} };
const CHECK_NAMES = Object.keys(CHECKS);

const toolReply = (text, isError) => ({
  result: {
    content: [{ type: "text", text }],
    ...(isError ? { isError } : {}),
  },
});

const answerTool = async ({ name, arguments: args }, faults) => {
  if (name === "kaiord_round_trip_validate")
    return toolReply("Round-trip validation passed. No violations.");
  if (args.input_format === "zwo")
    return toolReply(faults.breakZwo ? "" : '{"type":"structured_workout"}');
  if (args.input_format === "fit")
    return faults.breakGate
      ? toolReply("{}")
      : toolReply("KRD type recorded_activity is not accepted remotely", true);
  const krd = JSON.parse(args.input_content);
  if (faults.breakFit) krd.extensions.structured_workout.steps.pop();
  const fit = await createFitWriter(quiet)(krd);
  return toolReply(
    `Binary output, base64-encoded\n${Buffer.from(fit).toString("base64")}`
  );
};

const fakeEndpoint =
  (faults = {}) =>
  async (_url, init) => {
    if (new TextEncoder().encode(init.body).byteLength > MAX_BODY_BYTES)
      return new Response("{}", { status: faults.breakCap ? 200 : 413 });
    const { id, method, params } = JSON.parse(init.body);
    const tools = REMOTE_TOOLS.slice(faults.dropTool ? 1 : 0).map((name) => ({
      name,
    }));
    const reply =
      method === "tools/list"
        ? { result: { tools } }
        : await answerTool(params, faults);
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, ...reply }), {
      status: 200,
    });
  };

const failedChecks = async (faults) =>
  (await runSmoke("https://kaiord.com/mcp", fakeEndpoint(faults)))
    .filter((r) => !r.ok)
    .map((r) => r.name);

describe("smoke checks", () => {
  it("should pass every check against a healthy endpoint", async () => {
    assert.deepEqual(await failedChecks({}), []);
  });

  for (const [fault, check] of [
    ["dropTool", "tools-list"],
    ["breakFit", "krd-to-fit"],
    ["breakZwo", "zwo-convert"],
    ["breakGate", "activity-rejected"],
    ["breakCap", "oversized-413"],
  ]) {
    it(`should fail only ${check} when the endpoint has ${fault}`, async () => {
      assert.deepEqual(await failedChecks({ [fault]: true }), [check]);
    });
  }

  it("should keep the smoke workout at three steps", () => {
    assert.equal(SMOKE_KRD.extensions.structured_workout.steps.length, 3);
  });
});

describe("smoke CLI", () => {
  it("should resolve the endpoint from a base URL or the full URL", () => {
    assert.equal(endpointOf("https://kaiord.com"), "https://kaiord.com/mcp");
    assert.equal(
      endpointOf("https://kaiord.com/mcp"),
      "https://kaiord.com/mcp"
    );
  });

  it("should return 2 without a URL", async () => {
    assert.equal(await main([], fakeEndpoint(), silent), 2);
  });

  it("should return 1 and name the failed check", async () => {
    const lines = [];
    const out = { log: () => {}, error: (line) => lines.push(line) };
    const code = await main(
      ["https://kaiord.com"],
      fakeEndpoint({ breakCap: true }),
      out
    );
    assert.equal(code, 1);
    assert.deepEqual(lines, ["smoke failed: oversized-413"]);
  });

  it("should exit 0 as a plain node script against a live server", async () => {
    const fake = fakeEndpoint();
    const server = createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const response = await fake(req.url, {
        body: Buffer.concat(chunks).toString("utf8"),
      });
      res.writeHead(response.status, { "content-type": "application/json" });
      res.end(await response.text());
    });
    await new Promise((done) => server.listen(0, "127.0.0.1", done));
    const url = `http://127.0.0.1:${server.address().port}/mcp`;
    const child = spawn(process.execPath, [SMOKE, url], { stdio: "pipe" });
    let stdout = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    const code = await new Promise((done) => child.on("close", done));
    server.close();
    assert.equal(code, 0, stdout);
    for (const name of CHECK_NAMES)
      assert.match(stdout, new RegExp(`PASS ${name}`));
  });
});
