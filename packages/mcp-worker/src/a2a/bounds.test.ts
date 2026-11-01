import { describe, expect, it, vi } from "vitest";

import { buildServer } from "../build-server";
import type { LogEntry } from "../content-free-log";
import { handleRequest } from "../handler";
import { MAX_BODY_BYTES } from "../limits";
import {
  A2A_ENDPOINT,
  a2aBody,
  postA2a,
  sendSkill,
  skillMessage,
} from "../test-utils/a2a-request";

const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_PAYLOAD_TOO_LARGE = 413;
const HTTP_TOO_MANY_REQUESTS = 429;
const SECRET = "SECRET-ATHLETE-NOTE-7f3a";
const SECRET_CONTEXT = "ctx-SECRET-9b1c";

const padded = (size: number): string => {
  const body = a2aBody("ListTasks");
  return body + " ".repeat(size - body.length);
};

const streamRequest = (text: string): Request => {
  const bytes = new TextEncoder().encode(text);
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return new Request(A2A_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", "a2a-version": "1.0" },
    body,
    duplex: "half",
  } as RequestInit);
};

describe("A2A request bounds", () => {
  it("should reject a streamed 65,537-byte body without content-length as 413", async () => {
    // Arrange
    const request = streamRequest(padded(MAX_BODY_BYTES + 1));

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(request.headers.get("content-length")).toBeNull();
    expect(response.status).toBe(HTTP_PAYLOAD_TOO_LARGE);
  });

  it("should accept a request padded to exactly 65,536 bytes", async () => {
    // Arrange
    const request = streamRequest(padded(MAX_BODY_BYTES));

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(response.status).toBe(200);
  });

  it("should reject a batch of two SendMessage requests with 400", async () => {
    // Arrange
    const call = a2aBody("SendMessage", skillMessage("kaiord_list_formats"));
    const build = vi.fn(buildServer);

    // Act
    const { response } = await postA2a(`[${call},${call}]`, {
      deps: { buildServer: build },
    });

    // Assert
    expect(response.status).toBe(400);
    expect(build).not.toHaveBeenCalled();
  });

  it("should answer GET with 405 and Allow: POST", async () => {
    // Arrange
    const request = new Request(A2A_ENDPOINT, { method: "GET" });

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(response.status).toBe(HTTP_METHOD_NOT_ALLOWED);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("should answer 404 under /a2a/", async () => {
    // Arrange
    const request = new Request(`${A2A_ENDPOINT}/tasks`, { method: "POST" });

    // Act
    const response = await handleRequest(request);

    // Assert
    expect(response.status).toBe(404);
  });

  it("should share the per-IP rate limiter with /mcp", async () => {
    // Arrange
    const limit = vi.fn(async () => ({ success: false }));
    const headers = { "cf-connecting-ip": "203.0.113.7" };

    // Act
    const { response } = await postA2a(a2aBody("ListTasks"), {
      headers,
      deps: { rateLimiter: { limit } },
    });

    // Assert
    expect(response.status).toBe(HTTP_TOO_MANY_REQUESTS);
    expect(limit).toHaveBeenCalledWith({ key: "203.0.113.7" });
  });
});

describe("A2A logging", () => {
  it("should log the method and skill id and no input or context id", async () => {
    // Arrange
    const log = vi.fn<(entry: LogEntry) => void>();
    const malformed = Buffer.from(`not a FIT file ${SECRET}`).toString(
      "base64"
    );
    const params = skillMessage(
      "kaiord_convert",
      { input_content: malformed, input_format: "fit", output_format: "krd" },
      { contextId: SECRET_CONTEXT }
    );

    // Act
    const { reply } = await postA2a(a2aBody("SendMessage", params), {
      deps: { log },
    });

    // Assert
    expect(reply.result?.task?.status.state).toBe("TASK_STATE_FAILED");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0]?.[0]).toMatchObject({
      method: "tools/call",
      tool: "kaiord_convert",
    });
    const line = JSON.stringify(log.mock.calls);
    expect(line).not.toContain(SECRET);
    expect(line).not.toContain(malformed);
    expect(line).not.toContain(SECRET_CONTEXT);
  });

  it("should not log a successful skill", async () => {
    // Arrange
    const log = vi.fn<(entry: LogEntry) => void>();

    // Act
    await sendSkill("kaiord_list_formats", {}, { deps: { log } });

    // Assert
    expect(log).not.toHaveBeenCalled();
  });
});
