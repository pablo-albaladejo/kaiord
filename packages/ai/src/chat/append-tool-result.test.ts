import { describe, it, expect } from "vitest";
import type { ModelMessage } from "ai";
import { appendToolResult } from "./append-tool-result";

const base: ModelMessage[] = [{ role: "user", content: "sync please" }];

type ToolResultPart = {
  type: string;
  toolCallId: string;
  toolName: string;
  output: { type: string; value: unknown };
};

const lastToolPart = (messages: ModelMessage[]): ToolResultPart => {
  const last = messages[messages.length - 1];
  return (last.content as unknown as ToolResultPart[])[0];
};

describe("appendToolResult", () => {
  it("should append the approved output as a tool-result message", () => {
    // Arrange
    const resolution = {
      toolCallId: "c1",
      toolName: "sync_coaching",
      status: "approved" as const,
      output: { synced: 4 },
    };

    // Act
    const result = appendToolResult(base, resolution);

    // Assert
    expect(result).toHaveLength(2);
    expect(lastToolPart(result)).toMatchObject({
      toolCallId: "c1",
      toolName: "sync_coaching",
      output: { type: "json", value: { synced: 4 } },
    });
  });

  it("should append a declined sentinel when the user denies", () => {
    // Arrange
    const resolution = {
      toolCallId: "c2",
      toolName: "create_workout",
      status: "declined" as const,
    };

    // Act
    const result = appendToolResult(base, resolution);

    // Assert
    expect(lastToolPart(result).output).toMatchObject({
      value: { declined: true },
    });
  });

  it("should not mutate the input message array", () => {
    // Arrange
    const resolution = {
      toolCallId: "c3",
      toolName: "log_health_metric",
      status: "declined" as const,
    };

    // Act
    appendToolResult(base, resolution);

    // Assert
    expect(base).toHaveLength(1);
  });
});
