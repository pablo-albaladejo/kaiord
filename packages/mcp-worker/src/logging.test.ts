import { afterEach, describe, expect, it, vi } from "vitest";

import type { LogEntry } from "./content-free-log";
import { errorClassOf, writeLog } from "./content-free-log";
import { handleRequest } from "./handler";
import { callTool, postRequest, rpc } from "./test-utils/mcp-request";

const HTTP_INTERNAL_ERROR = 500;
const SECRET = "SECRET-ATHLETE-NOTE-7f3a";

describe("content-free logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should log the tool name and error class and no input of a failing call", async () => {
    // Arrange
    const log = vi.fn<(entry: LogEntry) => void>();
    const console_ = vi.spyOn(console, "error").mockImplementation(() => {});
    const malformed = Buffer.from(`not a FIT file ${SECRET}`).toString(
      "base64"
    );
    const args = {
      input_content: malformed,
      input_format: "fit",
      output_format: "krd",
    };

    // Act
    const { reply } = await callTool("kaiord_convert", args, { log });

    // Assert
    expect(reply.result?.isError).toBe(true);
    expect(log).toHaveBeenCalledTimes(1);
    const line = JSON.stringify(log.mock.calls[0]?.[0]);
    expect(log.mock.calls[0]?.[0]).toEqual({
      event: "tool_error",
      method: "tools/call",
      tool: "kaiord_convert",
      errorClass: "validation",
    });
    expect(line).not.toContain(SECRET);
    expect(line).not.toContain(malformed);
    expect(console_).not.toHaveBeenCalled();
  });

  it("should not echo a tool name outside the remote list", async () => {
    // Arrange
    const log = vi.fn<(entry: LogEntry) => void>();

    // Act
    await callTool(SECRET, { input_content: SECRET }, { log });

    // Assert
    const line = JSON.stringify(log.mock.calls);
    expect(log).toHaveBeenCalled();
    expect(line).not.toContain(SECRET);
    expect(line).toContain('"tool":"unknown"');
  });

  it("should log a JSON-RPC error by method and code only", async () => {
    // Arrange
    const log = vi.fn<(entry: LogEntry) => void>();
    const request = postRequest(rpc("resources/read", { uri: SECRET }));

    // Act
    await handleRequest(request, { log });

    // Assert
    expect(log.mock.calls[0]?.[0]).toMatchObject({
      event: "rpc_error",
      method: "resources/read",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(SECRET);
  });

  it("should answer 500 and log the error class when the server throws", async () => {
    // Arrange
    const log = vi.fn<(entry: LogEntry) => void>();
    const buildServer = () => {
      throw new TypeError(SECRET);
    };

    // Act
    const response = await handleRequest(postRequest(rpc(SECRET)), {
      log,
      buildServer,
    });

    // Assert
    expect(response.status).toBe(HTTP_INTERNAL_ERROR);
    expect(log.mock.calls[0]?.[0]).toEqual({
      event: "request_error",
      method: "unknown",
      errorClass: "TypeError",
    });
  });

  it("should write one JSON line to stderr by default", () => {
    // Arrange
    const console_ = vi.spyOn(console, "error").mockImplementation(() => {});
    const entry: LogEntry = {
      event: "tool_error",
      method: "tools/call",
      tool: "kaiord_inspect",
      errorClass: "validation",
    };

    // Act
    writeLog(entry);

    // Assert
    expect(console_).toHaveBeenCalledWith(JSON.stringify(entry));
  });

  it("should classify a non-Error throw as unknown", () => {
    // Arrange
    const thrown = SECRET;

    // Act
    const errorClass = errorClassOf(thrown);

    // Assert
    expect(errorClass).toBe("unknown");
  });
});
