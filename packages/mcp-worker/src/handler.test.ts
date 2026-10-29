import { createFitReader } from "@kaiord/fit";
import { describe, expect, it, vi } from "vitest";

import { buildServer } from "./build-server";
import { handleRequest } from "./handler";
import { MAX_BODY_BYTES, REMOTE_TOOL_NAMES } from "./limits";
import {
  callTool,
  ENDPOINT,
  fixtureBase64,
  fixtureText,
  postRequest,
  rpc,
  type RpcReply,
  THREE_STEP_KRD,
  toolText,
} from "./test-utils/mcp-request";

const HTTP_OK = 200;
const HTTP_ACCEPTED = 202;
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_TOO_MANY_REQUESTS = 429;
const PARSE_ERROR = -32700;
const STEP_COUNT = 3;
const quiet = { debug() {}, info() {}, warn() {}, error() {} };

// JSON allows trailing whitespace, so the padded body stays one valid call.
const padTo = (size: number): string => {
  const body = rpc("tools/list");
  return body + " ".repeat(size - body.length);
};

const streamOf = (text: string): ReadableStream<Uint8Array> => {
  const bytes = new TextEncoder().encode(text);
  const half = Math.floor(bytes.byteLength / 2);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, half));
      controller.enqueue(bytes.slice(half));
      controller.close();
    },
  });
};

describe("handleRequest over MCP", () => {
  it("should list exactly the eight remote tools", async () => {
    // Arrange
    const request = postRequest(rpc("tools/list"));

    // Act
    const response = await handleRequest(request);
    const reply = (await response.json()) as RpcReply;

    // Assert
    expect(response.status).toBe(HTTP_OK);
    const names = reply.result?.tools?.map((tool) => tool.name).sort();
    expect(names).toEqual([...REMOTE_TOOL_NAMES].sort());
  });

  it("should convert KRD to base64 FIT that decodes to the same workout", async () => {
    // Arrange
    const args = {
      input_content: JSON.stringify(THREE_STEP_KRD),
      input_format: "krd",
      output_format: "fit",
    };

    // Act
    const { reply } = await callTool("kaiord_convert", args);
    const encoded = toolText(reply).split("\n").at(-1) ?? "";
    const fit = Buffer.from(encoded, "base64");
    const krd = await createFitReader(quiet)(new Uint8Array(fit));

    // Assert
    expect(reply.result?.isError).toBeUndefined();
    const workout = krd.extensions?.structured_workout as {
      name: string;
      steps: ReadonlyArray<unknown>;
    };
    expect(workout.name).toBe("Remote smoke");
    expect(workout.steps).toHaveLength(STEP_COUNT);
  });

  it("should round-trip validate a FIT workout", async () => {
    // Arrange
    const args = { input_content: fixtureBase64("fit/WorkoutRepeatSteps.fit") };

    // Act
    const { reply } = await callTool("kaiord_round_trip_validate", args);

    // Assert
    expect(reply.result?.isError).toBeUndefined();
    expect(toolText(reply)).toMatch(/pass/i);
  });

  it("should convert a ZWO workout", async () => {
    // Arrange
    const args = {
      input_content: fixtureText("zwo/WorkoutIndividualSteps.zwo"),
      input_format: "zwo",
      output_format: "krd",
    };

    // Act
    const { reply } = await callTool("kaiord_convert", args);

    // Assert
    expect(reply.result?.isError).toBeUndefined();
    expect(toolText(reply)).toContain('"structured_workout"');
  });

  it("should reject a recorded FIT activity naming its type", async () => {
    // Arrange
    const args = {
      input_content: fixtureBase64("fit/activity_multisport.fit"),
      input_format: "fit",
      output_format: "krd",
    };

    // Act
    const { reply } = await callTool("kaiord_convert", args);

    // Assert
    expect(reply.result?.isError).toBe(true);
    expect(toolText(reply)).toContain("recorded_activity");
  });

  it("should serve the bundled format spec as a resource", async () => {
    // Arrange
    const params = { uri: "kaiord://docs/krd-format" };
    const request = postRequest(rpc("resources/read", params));

    // Act
    const reply = (await (await handleRequest(request)).json()) as RpcReply;

    // Assert
    expect(reply.result?.contents?.[0]?.text).toBe(
      fixtureText("../docs/krd-format.md")
    );
  });

  it("should accept a notification without a reply body", async () => {
    // Arrange
    const body = JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    // Act
    const response = await handleRequest(postRequest(body));

    // Assert
    expect(response.status).toBe(HTTP_ACCEPTED);
  });
});

describe("handleRequest routing", () => {
  it("should answer GET with 405 and Allow: POST", async () => {
    // Arrange
    const request = new Request(ENDPOINT, { method: "GET" });

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(response.status).toBe(HTTP_METHOD_NOT_ALLOWED);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("should answer another path with 404", async () => {
    // Arrange
    const request = new Request("https://kaiord.com/other", { method: "POST" });

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(response.status).toBe(404);
  });
});

describe("handleRequest body bounds", () => {
  it("should reject a 65,537-byte body with a content-length as 413", async () => {
    // Arrange
    const body = padTo(MAX_BODY_BYTES + 1);
    const request = postRequest(body, { "content-length": `${body.length}` });
    const build = vi.fn(buildServer);

    // Act
    const response = await handleRequest(request, { buildServer: build });

    // Assert
    expect(response.status).toBe(HTTP_PAYLOAD_TOO_LARGE);
    expect(build).not.toHaveBeenCalled();
  });

  it("should reject a streamed 65,537-byte body without content-length as 413", async () => {
    // Arrange
    const request = postRequest(streamOf(padTo(MAX_BODY_BYTES + 1)));

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(request.headers.get("content-length")).toBeNull();
    expect(response.status).toBe(HTTP_PAYLOAD_TOO_LARGE);
  });

  it("should accept a tools/list padded to exactly 65,536 bytes", async () => {
    // Arrange
    const body = padTo(MAX_BODY_BYTES);
    const request = postRequest(streamOf(body));

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(new TextEncoder().encode(body).byteLength).toBe(MAX_BODY_BYTES);
    expect(response.status).toBe(HTTP_OK);
  });

  it("should reject a batch with 400 and run no tool", async () => {
    // Arrange
    const call = { name: "kaiord_list_formats", arguments: {} };
    const batch = `[${rpc("tools/call", call, 1)},${rpc("tools/call", call, 2)}]`;
    const build = vi.fn(buildServer);

    // Act
    const response = await handleRequest(postRequest(batch), {
      buildServer: build,
    });

    // Assert
    expect(response.status).toBe(400);
    expect(build).not.toHaveBeenCalled();
  });

  it("should answer invalid JSON with a 400 parse error", async () => {
    // Arrange
    const request = postRequest("{not json");

    // Act
    const response = await handleRequest(request);
    const reply = (await response.json()) as RpcReply;

    // Assert
    expect(response.status).toBe(400);
    expect(reply.error?.code).toBe(PARSE_ERROR);
  });

  it("should answer a JSON primitive with 400", async () => {
    // Arrange
    const request = postRequest("42");

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(response.status).toBe(400);
  });
});

describe("handleRequest state and rate limit", () => {
  it("should build a new server per request and send no session id", async () => {
    // Arrange
    const build = vi.fn(buildServer);
    const deps = { buildServer: build };

    // Act
    const first = await handleRequest(postRequest(rpc("tools/list")), deps);
    const second = await handleRequest(postRequest(rpc("tools/list")), deps);

    // Assert
    expect(build).toHaveBeenCalledTimes(2);
    expect(build.mock.results[0]?.value).not.toBe(build.mock.results[1]?.value);
    expect(first.headers.get("mcp-session-id")).toBeNull();
    expect(second.headers.get("mcp-session-id")).toBeNull();
  });

  it("should answer 429 when the limiter reports the client over its limit", async () => {
    // Arrange
    const limit = vi.fn(async () => ({ success: false }));
    const headers = { "cf-connecting-ip": "203.0.113.7" };
    const request = postRequest(rpc("tools/list"), headers);

    // Act
    const response = await handleRequest(request, { rateLimiter: { limit } });

    // Assert
    expect(response.status).toBe(HTTP_TOO_MANY_REQUESTS);
    expect(limit).toHaveBeenCalledWith({ key: "203.0.113.7" });
  });

  it("should serve the request when the limiter admits it", async () => {
    // Arrange
    const limit = vi.fn(async () => ({ success: true }));
    const request = postRequest(rpc("tools/list"));

    // Act
    const response = await handleRequest(request, { rateLimiter: { limit } });

    // Assert
    expect(response.status).toBe(HTTP_OK);
    expect(limit).toHaveBeenCalledWith({ key: "unknown" });
  });
});
