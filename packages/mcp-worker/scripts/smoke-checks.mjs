// The post-deploy checks (design D9), each against a live MCP endpoint.
// A check resolves to nothing on success and throws an Error naming what
// failed otherwise, never quoting a tool result: smoke output carries no
// endpoint content. `call(method, params)` posts one JSON-RPC request.
import { readFileSync } from "node:fs";

import { createFitReader } from "@kaiord/fit";

export const MAX_BODY_BYTES = 65_536;
export const REMOTE_TOOLS = [
  "kaiord_convert",
  "kaiord_diff",
  "kaiord_extract_workout",
  "kaiord_get_format_spec",
  "kaiord_inspect",
  "kaiord_list_formats",
  "kaiord_round_trip_validate",
  "kaiord_validate",
];

const FIXTURES = new URL("../../../test-fixtures/", import.meta.url);
const fixture = (path) => readFileSync(new URL(path, FIXTURES));
const quiet = { debug() {}, info() {}, warn() {}, error() {} };
const STEP_COUNT = 3;

export const SMOKE_KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2025-01-15T10:00:00.000Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Remote smoke",
      sport: "cycling",
      steps: [0, 1, 2].map((stepIndex) => ({
        stepIndex,
        durationType: "time",
        duration: { type: "time", seconds: 300 },
        targetType: "open",
        target: { type: "open" },
        intensity: stepIndex === 1 ? "active" : "warmup",
      })),
    },
  },
};

const HTTP_OK = 200;

// A success-shaped body on a non-200 reply is still a failed request.
const expectStatusOk = (reply, label) => {
  if (reply.status !== HTTP_OK)
    throw new Error(`${label} got HTTP ${reply.status}`);
};

const tool = async (call, name, args) => {
  const reply = await call("tools/call", { name, arguments: args });
  expectStatusOk(reply, name);
  const text = reply.body?.result?.content?.[0]?.text ?? "";
  return { isError: reply.body?.result?.isError === true, text, reply };
};

const expectOk = (result, label) => {
  if (result.isError || result.text === "")
    throw new Error(
      `${label} failed: ${result.isError ? "tool error" : "empty result"}`
    );
};

export const CHECKS = {
  "tools-list": async (call) => {
    const reply = await call("tools/list", {});
    expectStatusOk(reply, "tools/list");
    const names = (reply.body?.result?.tools ?? []).map((t) => t.name).sort();
    if (JSON.stringify(names) !== JSON.stringify(REMOTE_TOOLS))
      throw new Error(`tools/list returned ${JSON.stringify(names)}`);
  },
  "krd-to-fit": async (call) => {
    const input_content = JSON.stringify(SMOKE_KRD);
    const args = { input_content, input_format: "krd", output_format: "fit" };
    const result = await tool(call, "kaiord_convert", args);
    expectOk(result, "KRD to FIT");
    const encoded = result.text.split("\n").at(-1);
    const bytes = new Uint8Array(Buffer.from(encoded, "base64"));
    const workout = (await createFitReader(quiet)(bytes)).extensions
      ?.structured_workout;
    if (
      workout?.name !== "Remote smoke" ||
      workout?.steps?.length !== STEP_COUNT
    )
      throw new Error("the FIT output did not decode to the 3-step workout");
  },
  "round-trip-fit": async (call) => {
    const input_content = fixture("fit/WorkoutRepeatSteps.fit").toString(
      "base64"
    );
    const result = await tool(call, "kaiord_round_trip_validate", {
      input_content,
    });
    expectOk(result, "kaiord_round_trip_validate");
    if (!/passed/i.test(result.text))
      throw new Error("the round trip did not report a pass");
  },
  "zwo-convert": async (call) => {
    const input_content = fixture("zwo/WorkoutIndividualSteps.zwo").toString(
      "utf8"
    );
    const args = { input_content, input_format: "zwo", output_format: "krd" };
    const result = await tool(call, "kaiord_convert", args);
    expectOk(result, "ZWO to KRD");
    if (!result.text.includes('"structured_workout"'))
      throw new Error("the ZWO conversion returned no structured workout");
  },
  "activity-rejected": async (call) => {
    const input_content = fixture("fit/activity_multisport.fit").toString(
      "base64"
    );
    const args = { input_content, input_format: "fit", output_format: "krd" };
    const result = await tool(call, "kaiord_convert", args);
    if (!result.isError || !result.text.includes("recorded_activity"))
      throw new Error("a recorded activity was not rejected");
  },
  "oversized-413": async (call) => {
    const reply = await call("tools/list", {}, { padTo: MAX_BODY_BYTES + 1 });
    if (reply.status !== 413)
      throw new Error(`a ${MAX_BODY_BYTES + 1}-byte body got ${reply.status}`);
  },
};
