import { describe, expect, it, vi } from "vitest";

import { buildServer } from "../build-server";
import {
  A2A_ENDPOINT,
  a2aBody,
  postA2a,
  skillMessage,
} from "../test-utils/a2a-request";

const ERROR_INFO = "type.googleapis.com/google.rpc.ErrorInfo";
const TASK_NOT_FOUND = -32001;
const PUSH_NOT_SUPPORTED = -32003;
const UNSUPPORTED = -32004;
const VERSION_NOT_SUPPORTED = -32009;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;

describe("A2A methods and errors", () => {
  it.each([
    ["GetTask", { id: "k1.abc" }, TASK_NOT_FOUND, "TASK_NOT_FOUND"],
    ["CancelTask", { id: "k1.abc" }, TASK_NOT_FOUND, "TASK_NOT_FOUND"],
    [
      "SendStreamingMessage",
      skillMessage("kaiord_list_formats"),
      UNSUPPORTED,
      "UNSUPPORTED_OPERATION",
    ],
    ["SubscribeToTask", { id: "k1.abc" }, UNSUPPORTED, "UNSUPPORTED_OPERATION"],
    ["GetExtendedAgentCard", undefined, UNSUPPORTED, "UNSUPPORTED_OPERATION"],
    [
      "CreateTaskPushNotificationConfig",
      {},
      PUSH_NOT_SUPPORTED,
      "PUSH_NOTIFICATION_NOT_SUPPORTED",
    ],
    [
      "GetTaskPushNotificationConfig",
      {},
      PUSH_NOT_SUPPORTED,
      "PUSH_NOTIFICATION_NOT_SUPPORTED",
    ],
    [
      "ListTaskPushNotificationConfigs",
      {},
      PUSH_NOT_SUPPORTED,
      "PUSH_NOTIFICATION_NOT_SUPPORTED",
    ],
    [
      "DeleteTaskPushNotificationConfig",
      {},
      PUSH_NOT_SUPPORTED,
      "PUSH_NOTIFICATION_NOT_SUPPORTED",
    ],
  ])(
    "should answer %s with %i and an ErrorInfo",
    async (method, params, code, reason) => {
      // Arrange
      const body = a2aBody(method, params);

      // Act
      const { reply } = await postA2a(body);

      // Assert
      expect(reply.error?.code).toBe(code);
      expect(reply.error?.data?.[0]).toEqual({
        "@type": ERROR_INFO,
        reason,
        domain: "a2a-protocol.org",
      });
      expect(reply.result).toBeUndefined();
    }
  );

  it("should answer a SendMessage continuing a task with TASK_NOT_FOUND and run no tool", async () => {
    // Arrange
    const params = skillMessage(
      "kaiord_list_formats",
      {},
      { taskId: "k1.old" }
    );
    const build = vi.fn(buildServer);

    // Act
    const { reply } = await postA2a(a2aBody("SendMessage", params), {
      deps: { buildServer: build },
    });

    // Assert
    expect(reply.error?.code).toBe(TASK_NOT_FOUND);
    expect(build).not.toHaveBeenCalled();
  });

  it("should refuse a non-blocking SendMessage with UNSUPPORTED and run no tool", async () => {
    // Arrange
    const params = {
      ...skillMessage("kaiord_list_formats"),
      configuration: { returnImmediately: true },
    };
    const build = vi.fn(buildServer);

    // Act
    const { reply } = await postA2a(a2aBody("SendMessage", params), {
      deps: { buildServer: build },
    });

    // Assert
    expect(reply.error?.code).toBe(UNSUPPORTED);
    expect(build).not.toHaveBeenCalled();
  });

  it("should list no tasks", async () => {
    // Arrange
    const body = a2aBody("ListTasks", { pageSize: 10 });

    // Act
    const { reply } = await postA2a(body);

    // Assert
    expect(reply.result).toEqual({
      tasks: [],
      nextPageToken: "",
      pageSize: 10,
      totalSize: 0,
    });
  });

  it("should answer an unknown method with METHOD_NOT_FOUND", async () => {
    // Arrange
    const body = a2aBody("Foo");

    // Act
    const { reply } = await postA2a(body);

    // Assert
    expect(reply.error?.code).toBe(METHOD_NOT_FOUND);
  });

  it("should answer a request without jsonrpc 2.0 with INVALID_REQUEST", async () => {
    // Arrange
    const body = JSON.stringify({ id: 1, method: "ListTasks" });

    // Act
    const { reply } = await postA2a(body);

    // Assert
    expect(reply.error?.code).toBe(INVALID_REQUEST);
  });
});

describe("A2A version", () => {
  it("should answer a missing version with VERSION_NOT_SUPPORTED and run no tool", async () => {
    // Arrange
    const body = a2aBody("SendMessage", skillMessage("kaiord_list_formats"));
    const build = vi.fn(buildServer);

    // Act
    const { reply } = await postA2a(body, {
      omitVersion: true,
      deps: { buildServer: build },
    });

    // Assert
    expect(reply.error?.code).toBe(VERSION_NOT_SUPPORTED);
    expect(reply.error?.data?.[0]).toMatchObject({
      reason: "VERSION_NOT_SUPPORTED",
      metadata: { supported: "1.0" },
    });
    expect(build).not.toHaveBeenCalled();
  });

  it("should answer version 0.3 with VERSION_NOT_SUPPORTED", async () => {
    // Arrange
    const headers = { "a2a-version": "0.3" };

    // Act
    const { reply } = await postA2a(a2aBody("ListTasks"), { headers });

    // Assert
    expect(reply.error?.code).toBe(VERSION_NOT_SUPPORTED);
  });

  it("should accept the version as a query parameter", async () => {
    // Arrange
    const url = `${A2A_ENDPOINT}?A2A-Version=1.0`;
    const body = a2aBody("SendMessage", skillMessage("kaiord_list_formats"));

    // Act
    const { reply } = await postA2a(body, { url, omitVersion: true });

    // Assert
    expect(reply.result?.task?.status.state).toBe("TASK_STATE_COMPLETED");
  });
});
