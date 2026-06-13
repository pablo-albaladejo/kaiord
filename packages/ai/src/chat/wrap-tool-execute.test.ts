import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import type { ChatTool } from "./chat-types";
import { wrapToolExecute } from "./wrap-tool-execute";

const makeTool = (
  execute: ChatTool["execute"],
  schema: ChatTool["inputSchema"] = z.object({ days: z.number() })
): ChatTool => ({
  name: "query_workouts",
  description: "test",
  inputSchema: schema,
  requiresConfirmation: false,
  execute,
});

describe("wrapToolExecute", () => {
  it("should forward parsed input to execute on valid input", async () => {
    // Arrange
    const execute = vi.fn().mockResolvedValue({ count: 3 });
    const wrapped = wrapToolExecute(makeTool(execute));

    // Act
    const result = await wrapped({ days: 20 });

    // Assert
    expect(execute).toHaveBeenCalledWith({ days: 20 });
    expect(result).toEqual({ count: 3 });
  });

  it("should not call execute when input fails schema validation", async () => {
    // Arrange
    const execute = vi.fn();
    const wrapped = wrapToolExecute(makeTool(execute));

    // Act
    const result = await wrapped({ days: "twenty" });

    // Assert
    expect(execute).not.toHaveBeenCalled();
    expect(result).toMatchObject({ error: "invalid_input" });
  });

  it("should describe the offending field in the validation error", async () => {
    // Arrange
    const wrapped = wrapToolExecute(makeTool(vi.fn()));

    // Act
    const result = (await wrapped({ days: "bad" })) as { message: string };

    // Assert
    expect(result.message).toContain("days");
  });
});
