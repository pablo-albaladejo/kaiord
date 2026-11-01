// The post-deploy checks for /a2a (task 2.6), each against a live A2A
// endpoint. Like the MCP checks, a failure names what failed and never
// quotes a tool result. `call(method, params, options)` posts one request.
import { readFileSync } from "node:fs";

import { createFitReader } from "@kaiord/fit";

import { MAX_BODY_BYTES, SMOKE_KRD } from "./smoke-checks.mjs";

const ACCEPT = "application/json";
const FIXTURES = new URL("../../../test-fixtures/", import.meta.url);
const base64 = (path) =>
  readFileSync(new URL(path, FIXTURES)).toString("base64");
const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const STEP_COUNT = 3;

// `version: null` sends no A2A-Version; `padTo` pads with JSON whitespace.
export const createA2aCaller = (endpoint, fetchImpl) => {
  let id = 0;
  return async (method, params, { padTo, version = "1.0" } = {}) => {
    id += 1;
    let body = JSON.stringify({ jsonrpc: "2.0", id, method, params });
    if (padTo !== undefined) body += " ".repeat(padTo - body.length);
    const headers = { "content-type": "application/json", accept: ACCEPT };
    if (version !== null) headers["a2a-version"] = version;
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers,
      body,
    });
    let parsed;
    try {
      parsed = JSON.parse(await response.text());
    } catch {
      parsed = undefined;
    }
    return { status: response.status, body: parsed };
  };
};

const message = (parts) => ({
  message: { messageId: "smoke", role: "ROLE_USER", parts },
});

const send = async (call, skill, args = {}) => {
  const reply = await call(
    "SendMessage",
    message([{ data: { skill, ...args } }])
  );
  if (reply.status !== 200)
    throw new Error(`${skill} got HTTP ${reply.status}`);
  const task = reply.body?.result?.task;
  if (task === undefined) throw new Error(`${skill} returned no task`);
  return task;
};

const expectState = (task, state, label) => {
  if (task.status?.state !== state)
    throw new Error(
      `${label} ended ${task.status?.state ?? "without a state"}`
    );
};

const expectCode = (reply, code, label) => {
  if (reply.body?.error?.code !== code)
    throw new Error(`${label} got ${reply.body?.error?.code ?? reply.status}`);
};

export const A2A_CHECKS = {
  "get-task-not-found": async (call) => {
    expectCode(await call("GetTask", { id: "k1.smoke" }), -32001, "GetTask");
  },
  "version-required": async (call) => {
    const reply = await call("ListTasks", {}, { version: null });
    expectCode(reply, -32009, "a request without A2A-Version");
  },
  "list-formats": async (call) => {
    const task = await send(call, "kaiord_list_formats");
    expectState(task, "TASK_STATE_COMPLETED", "kaiord_list_formats");
    if (!task.artifacts?.[0]?.parts?.[0]?.text)
      throw new Error("kaiord_list_formats returned an empty artifact");
  },
  "krd-to-fit": async (call) => {
    const input_content = JSON.stringify(SMOKE_KRD);
    const args = { input_content, input_format: "krd", output_format: "fit" };
    const task = await send(call, "kaiord_convert", args);
    expectState(task, "TASK_STATE_COMPLETED", "KRD to FIT");
    const text = task.artifacts?.[0]?.parts?.[0]?.text ?? "";
    const bytes = new Uint8Array(
      Buffer.from(text.split("\n").at(-1), "base64")
    );
    const steps = (await createFitReader(quiet)(bytes)).extensions
      ?.structured_workout?.steps;
    if (steps?.length !== STEP_COUNT)
      throw new Error("the FIT output did not decode to the 3-step workout");
  },
  "activity-failed": async (call) => {
    const args = { input_content: base64("fit/activity_multisport.fit") };
    const task = await send(call, "kaiord_inspect", {
      ...args,
      input_format: "fit",
    });
    expectState(task, "TASK_STATE_FAILED", "a recorded activity");
  },
  "text-only-rejected": async (call) => {
    const reply = await call("SendMessage", message([{ text: "convert" }]));
    const state = reply.body?.result?.task?.status?.state;
    if (state !== "TASK_STATE_REJECTED")
      throw new Error(`a text-only message ended ${state ?? reply.status}`);
  },
  "oversized-413": async (call) => {
    const reply = await call("ListTasks", {}, { padTo: MAX_BODY_BYTES + 1 });
    if (reply.status !== 413)
      throw new Error(`a ${MAX_BODY_BYTES + 1}-byte body got ${reply.status}`);
  },
};
