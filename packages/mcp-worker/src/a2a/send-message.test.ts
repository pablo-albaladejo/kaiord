import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it, vi } from "vitest";

import { buildServer } from "../build-server";
import {
  a2aBody,
  postA2a,
  sendSkill,
  skillMessage,
  userMessage,
} from "../test-utils/a2a-request";
import { fixtureBase64 } from "../test-utils/mcp-request";
import { SKILL_IDS } from "./skills";

const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;
const SKILL_COUNT = 8;
const MAX_CONTEXT_ID = 64;
const NUMERIC_CONTEXT_ID = 42;
const BASE64URL = /^[A-Za-z0-9_-]+$/;

describe("SendMessage over A2A", () => {
  it("should complete a skill and return its text as an artifact", async () => {
    // Arrange
    const skill = "kaiord_list_formats";

    // Act
    const { response, reply } = await sendSkill(skill);

    // Assert
    const task = reply.result?.task;
    expect(response.status).toBe(200);
    expect(task?.status.state).toBe("TASK_STATE_COMPLETED");
    expect(task?.artifacts?.[0]?.artifactId).toBe("result");
    expect(task?.artifacts?.[0]?.name).toBe(skill);
    expect(task?.artifacts?.[0]?.parts[0]?.text).toContain('"fit"');
    expect(task?.artifacts?.[0]?.parts[0]?.mediaType).toBe("text/plain");
  });

  it("should complete when the caller accepts application/json only", async () => {
    // Arrange
    const headers = { accept: "application/json" };

    // Act
    const { reply } = await sendSkill("kaiord_list_formats", {}, { headers });

    // Assert
    expect(reply.error).toBeUndefined();
    expect(reply.result?.task?.status.state).toBe("TASK_STATE_COMPLETED");
  });

  it("should fail a recorded FIT activity through the MCP gate", async () => {
    // Arrange
    const args = {
      input_content: fixtureBase64("fit/activity_multisport.fit"),
      input_format: "fit",
    };

    // Act
    const { reply } = await sendSkill("kaiord_inspect", args);

    // Assert
    const task = reply.result?.task;
    expect(task?.status.state).toBe("TASK_STATE_FAILED");
    expect(task?.status.message.parts[0]?.text).toContain("recorded_activity");
    expect(task?.artifacts).toBeUndefined();
  });

  it("should fail a call that names an input_file path", async () => {
    // Arrange
    const args = { input_file: "/etc/passwd" };

    // Act
    const { reply } = await sendSkill("kaiord_inspect", args);

    // Assert
    expect(reply.result?.task?.status.state).toBe("TASK_STATE_FAILED");
  });

  it("should build a new MCP server per request", async () => {
    // Arrange
    const build = vi.fn(buildServer);
    const deps = { buildServer: build };

    // Act
    await sendSkill("kaiord_list_formats", {}, { deps });
    await sendSkill("kaiord_list_formats", {}, { deps });

    // Assert
    expect(build).toHaveBeenCalledTimes(2);
    expect(build.mock.results[0]?.value).not.toBe(build.mock.results[1]?.value);
  });

  it("should reject a text-only message listing the eight skill ids", async () => {
    // Arrange
    const body = a2aBody("SendMessage", userMessage([{ text: "convert it" }]));
    const build = vi.fn(buildServer);

    // Act
    const { reply } = await postA2a(body, { deps: { buildServer: build } });

    // Assert
    const task = reply.result?.task;
    const text = task?.status.message.parts[0]?.text ?? "";
    expect(task?.status.state).toBe("TASK_STATE_REJECTED");
    expect(SKILL_IDS).toHaveLength(SKILL_COUNT);
    for (const id of SKILL_IDS) expect(text).toContain(id);
    expect(text).toContain('{"skill": "<id>", ...arguments}');
    expect(build).not.toHaveBeenCalled();
  });

  it("should reject an unknown skill before any dispatch", async () => {
    // Arrange
    const build = vi.fn(buildServer);

    // Act
    const { reply } = await sendSkill(
      "kaiord_garmin_push",
      {},
      {
        deps: { buildServer: build },
      }
    );

    // Assert
    expect(reply.result?.task?.status.state).toBe("TASK_STATE_REJECTED");
    expect(build).not.toHaveBeenCalled();
  });
});

describe("SendMessage task shape", () => {
  it("should echo a client context id", async () => {
    // Arrange
    const params = skillMessage(
      "kaiord_list_formats",
      {},
      { contextId: "ctx-1" }
    );

    // Act
    const { reply } = await postA2a(a2aBody("SendMessage", params));

    // Assert
    expect(reply.result?.task?.contextId).toBe("ctx-1");
  });

  it.each([
    ["x".repeat(MAX_CONTEXT_ID + 1)],
    ["has space"],
    [NUMERIC_CONTEXT_ID],
  ])(
    "should reject the context id %s with -32602 and no task",
    async (contextId) => {
      // Arrange
      const params = skillMessage("kaiord_list_formats", {}, { contextId });

      // Act
      const { reply } = await postA2a(a2aBody("SendMessage", params));

      // Assert
      expect(reply.error?.code).toBe(INVALID_PARAMS);
      expect(reply.result).toBeUndefined();
    }
  );

  it("should generate a base64url context id when absent", async () => {
    // Arrange
    const skill = "kaiord_list_formats";

    // Act
    const { reply } = await sendSkill(skill);

    // Assert
    expect(reply.result?.task?.contextId).toMatch(BASE64URL);
  });

  it("should give a k1. id of 12 random bytes and an agent status message", async () => {
    // Arrange
    const skill = "kaiord_list_formats";

    // Act
    const { reply } = await sendSkill(skill);

    // Assert
    const task = reply.result?.task;
    expect(task?.id).toMatch(/^k1\.[A-Za-z0-9_-]{16}$/);
    expect(task?.status.message.role).toBe("ROLE_AGENT");
    expect(task?.status.message.taskId).toBe(task?.id);
    expect(Number.isNaN(Date.parse(task?.status.timestamp ?? ""))).toBe(false);
  });

  it("should echo only allowlisted fields of the user message", async () => {
    // Arrange
    const params = skillMessage(
      "kaiord_list_formats",
      {},
      {
        metadata: { secret: "s" },
        extensions: ["x"],
      }
    );

    // Act
    const { reply } = await postA2a(a2aBody("SendMessage", params));

    // Assert
    const history = reply.result?.task?.history ?? [];
    expect(history).toHaveLength(1);
    expect(Object.keys(history[0] ?? {}).sort()).toEqual([
      "contextId",
      "messageId",
      "parts",
      "role",
    ]);
  });

  it("should answer a message without parts with -32602", async () => {
    // Arrange
    const body = a2aBody("SendMessage", { message: { messageId: "m1" } });

    // Act
    const { reply } = await postA2a(body);

    // Assert
    expect(reply.error?.code).toBe(INVALID_PARAMS);
  });
});

describe("SendMessage tool reply mapping", () => {
  it("should fail the task with the tool's text when validation fails", async () => {
    // Arrange
    const args = { input_content: '{"version":"1.0"}' };

    // Act
    const { reply } = await sendSkill("kaiord_validate", args);

    // Assert
    const task = reply.result?.task;
    expect(task?.status.state).toBe("TASK_STATE_FAILED");
    expect(task?.status.message.parts[0]?.text).not.toBe("");
  });

  it("should answer -32603 with no result when the server build throws", async () => {
    // Arrange
    const deps = {
      buildServer: () => {
        throw new Error("boom");
      },
      log: () => undefined,
    };

    // Act
    const { reply } = await sendSkill("kaiord_list_formats", {}, { deps });

    // Assert
    expect(reply.error?.code).toBe(INTERNAL_ERROR);
    expect(reply.result).toBeUndefined();
  });

  it("should answer -32602 with no result when tools/call is a JSON-RPC error", async () => {
    // Arrange
    const deps = {
      buildServer: () => new McpServer({ name: "empty", version: "0.0.0" }),
      log: () => undefined,
    };

    // Act
    const { reply } = await sendSkill("kaiord_list_formats", {}, { deps });

    // Assert
    expect(reply.error?.code).toBe(INVALID_PARAMS);
    expect(reply.result).toBeUndefined();
  });
});
