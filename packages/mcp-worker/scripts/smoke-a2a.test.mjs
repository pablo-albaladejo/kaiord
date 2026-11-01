// Tests for the /a2a smoke checks (task 2.6). A fake A2A endpoint answers
// each check the way a healthy deploy does, and each fault breaks exactly
// one behaviour, so every check is shown to fail on its own.
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { createFitWriter } from "@kaiord/fit";

import { A2A_CHECKS } from "./smoke-a2a-checks.mjs";
import { MAX_BODY_BYTES } from "./smoke-checks.mjs";
import { main, runSmoke } from "./smoke.mjs";

const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const TOOL_CONTENT = "athlete-private workout text";

const task = (state, text) => ({
  task: {
    id: "k1.x",
    contextId: "c",
    status: { state, message: { role: "ROLE_AGENT", parts: [{ text }] } },
    ...(state === "TASK_STATE_COMPLETED"
      ? { artifacts: [{ artifactId: "result", parts: [{ text }] }] }
      : {}),
  },
});

const answerSkill = async ({ skill, ...args }, faults) => {
  if (skill === "kaiord_list_formats")
    return task("TASK_STATE_COMPLETED", faults.emptyList ? "" : "[fit]");
  if (skill === "kaiord_inspect")
    return task(
      faults.breakGate ? "TASK_STATE_COMPLETED" : "TASK_STATE_FAILED",
      TOOL_CONTENT
    );
  const krd = JSON.parse(args.input_content);
  if (faults.breakFit) krd.extensions.structured_workout.steps.pop();
  const fit = Buffer.from(await createFitWriter(quiet)(krd)).toString("base64");
  return task("TASK_STATE_COMPLETED", `Binary output\n${fit}`);
};

const answer = async (method, params, headers, faults) => {
  if (headers["a2a-version"] !== "1.0" && !faults.ignoreVersion)
    return { error: { code: -32009, message: "version" } };
  if (method === "GetTask")
    return faults.pagesAnswer ? {} : { error: { code: -32001, message: "x" } };
  if (method === "ListTasks") return { result: { tasks: [] } };
  const data = params.message.parts.find((part) => "data" in part)?.data;
  if (data === undefined)
    return {
      result: task(
        faults.acceptText ? "TASK_STATE_COMPLETED" : "TASK_STATE_REJECTED",
        ""
      ),
    };
  return { result: await answerSkill(data, faults) };
};

const fakeA2a =
  (faults = {}) =>
  async (url, init) => {
    assert.match(String(url), /\/a2a$/);
    if (new TextEncoder().encode(init.body).byteLength > MAX_BODY_BYTES)
      return new Response("{}", { status: faults.breakCap ? 200 : 413 });
    const { id, method, params } = JSON.parse(init.body);
    const reply = await answer(method, params, init.headers, faults);
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, ...reply }));
  };

const failedChecks = async (faults) =>
  (await runSmoke("https://kaiord.com/a2a", fakeA2a(faults)))
    .filter((result) => !result.ok)
    .map((result) => result.name);

describe("a2a smoke checks", () => {
  it("should pass every check against a healthy endpoint", async () => {
    assert.deepEqual(await failedChecks({}), []);
  });

  for (const [fault, check] of [
    ["pagesAnswer", "get-task-not-found"],
    ["ignoreVersion", "version-required"],
    ["emptyList", "list-formats"],
    ["breakFit", "krd-to-fit"],
    ["breakGate", "activity-failed"],
    ["acceptText", "text-only-rejected"],
    ["breakCap", "oversized-413"],
  ]) {
    it(`should fail only ${check} when the endpoint has ${fault}`, async () => {
      assert.deepEqual(await failedChecks({ [fault]: true }), [check]);
    });
  }

  it("should run exactly the A2A check set for an /a2a URL", async () => {
    const results = await runSmoke("https://kaiord.com/a2a", fakeA2a());
    assert.deepEqual(
      results.map((result) => result.name),
      Object.keys(A2A_CHECKS)
    );
  });

  it("should exit 1 naming the check and printing no tool result", async () => {
    const lines = [];
    const out = { log: (l) => lines.push(l), error: (l) => lines.push(l) };
    const code = await main(
      ["https://kaiord.com/a2a"],
      fakeA2a({ breakGate: true }),
      out
    );
    assert.equal(code, 1);
    assert.ok(lines.includes("smoke failed: activity-failed"));
    assert.ok(lines.every((line) => !line.includes(TOOL_CONTENT)));
  });
});
