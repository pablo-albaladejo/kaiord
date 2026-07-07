import { describe, expect, it, vi } from "vitest";

import type { ChatActionOps } from "./chat-tool-deps";
import { createSetDataRouteTool } from "./set-data-route-tool";

const makeOps = (over: Partial<ChatActionOps> = {}): ChatActionOps => ({
  syncCoaching: vi.fn(),
  createWorkout: vi.fn(),
  logHealthMetric: vi.fn(),
  logIntake: vi.fn(),
  pushToGarmin: vi.fn(),
  setDataRoute: over.setDataRoute ?? vi.fn().mockResolvedValue({ ok: true }),
});

describe("createSetDataRouteTool", () => {
  it("should require confirmation", () => {
    // Arrange
    const tool = createSetDataRouteTool(makeOps());

    // Act

    // Assert
    expect(tool.requiresConfirmation).toBe(true);
    expect(tool.name).toBe("set_data_route");
  });

  it("should delegate an enable_route call to the injected op", async () => {
    // Arrange
    const setDataRoute = vi.fn().mockResolvedValue({ enabled: true });
    const tool = createSetDataRouteTool(makeOps({ setDataRoute }));
    const input = {
      action: "enable_route",
      dataType: "planned-session",
      integrationId: "train2go",
      direction: "import",
    };

    // Act
    const result = await tool.execute(input);

    // Assert
    expect(setDataRoute).toHaveBeenCalledWith(input);
    expect(result).toEqual({ enabled: true });
  });

  it("should delegate a set_source_policy call with a single-source priority order", async () => {
    // Arrange
    const setDataRoute = vi.fn().mockResolvedValue({ mode: "priority" });
    const tool = createSetDataRouteTool(makeOps({ setDataRoute }));
    const input = {
      action: "set_source_policy",
      dataType: "sleep",
      mode: "priority",
      sourceOrder: ["whoop"],
    };

    // Act
    await tool.execute(input);

    // Assert
    expect(setDataRoute).toHaveBeenCalledWith(input);
  });

  it("should reject an input with an unknown action", () => {
    // Arrange
    const tool = createSetDataRouteTool(makeOps());

    // Act
    const parsed = tool.inputSchema.safeParse({
      action: "delete_route",
      dataType: "sleep",
      integrationId: "whoop",
      direction: "import",
    });

    // Assert
    expect(parsed.success).toBe(false);
  });

  it("should reject a priority policy with an empty sourceOrder", () => {
    // Arrange
    const setDataRoute = vi.fn();
    const tool = createSetDataRouteTool(makeOps({ setDataRoute }));

    // Act
    const act = () =>
      tool.execute({
        action: "set_source_policy",
        dataType: "sleep",
        mode: "priority",
        sourceOrder: [],
      });

    // Assert
    expect(act).toThrow();
    expect(setDataRoute).not.toHaveBeenCalled();
  });

  it("should reject enable_route input missing the direction field", () => {
    // Arrange
    const tool = createSetDataRouteTool(makeOps());

    // Act
    const parsed = tool.inputSchema.safeParse({
      action: "enable_route",
      dataType: "sleep",
      integrationId: "whoop",
    });

    // Assert
    expect(parsed.success).toBe(false);
  });
});
