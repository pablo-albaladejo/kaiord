import type { ChatTool } from "@kaiord/ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { logger } from "../../utils/logger";
import { runConfirmedTool } from "./run-confirmed-tool";

vi.mock("../../utils/logger", () => ({ logger: { error: vi.fn() } }));

const SECRET = "bridge said: token=abc123 for athlete@example.com";

const tool = (execute: ChatTool["execute"]): ChatTool => ({
  name: "log_intake",
  description: "test",
  inputSchema: z.object({}),
  requiresConfirmation: true,
  execute,
});

describe("runConfirmedTool", () => {
  beforeEach(() => vi.mocked(logger.error).mockClear());

  it("should return the tool output when execute resolves", async () => {
    // Arrange
    const tools = [tool(async () => ({ saved: 1 }))];

    // Act
    const result = await runConfirmedTool(tools, "log_intake", {});

    // Assert
    expect(result).toEqual({ output: { saved: 1 }, ok: true });
  });

  it("should give the model an app error code instead of the exception text", async () => {
    // Arrange
    const tools = [
      tool(async () => {
        throw new Error(SECRET);
      }),
    ];

    // Act
    const result = await runConfirmedTool(tools, "log_intake", {});

    // Assert
    expect(result).toEqual({ output: { error: "action_failed" }, ok: false });
    expect(JSON.stringify(result)).not.toContain("abc123");
  });

  it("should report invalid_input when the input fails its schema", async () => {
    // Arrange
    const schema = z.object({ kcal: z.number() });
    const tools = [tool(async (raw) => schema.parse(raw))];

    // Act
    const result = await runConfirmedTool(tools, "log_intake", { kcal: "x" });

    // Assert
    expect(result).toEqual({ output: { error: "invalid_input" }, ok: false });
  });

  it("should report unknown_tool for a name outside the registry", async () => {
    // Arrange
    const tools = [tool(async () => ({}))];

    // Act
    const result = await runConfirmedTool(tools, "drop_tables", {});

    // Assert
    expect(result).toEqual({ output: { error: "unknown_tool" }, ok: false });
  });

  it("should log the cause scrubbed so the failure stays diagnosable", async () => {
    // Arrange
    const tools = [
      tool(async () => {
        throw new Error(SECRET);
      }),
    ];

    // Act
    await runConfirmedTool(tools, "log_intake", {});

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      "[chat-action] failed",
      expect.objectContaining({ toolName: "log_intake", name: "Error" })
    );
    const context = vi.mocked(logger.error).mock.calls[0]?.[1];
    expect(JSON.stringify(context)).not.toContain("athlete@example.com");
  });
});
