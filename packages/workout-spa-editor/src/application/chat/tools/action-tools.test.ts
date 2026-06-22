import { describe, expect, it, vi } from "vitest";

import {
  createCreateWorkoutTool,
  createLogHealthMetricTool,
  createSyncCoachingTool,
} from "./action-tools";
import type { ChatActionOps } from "./chat-tool-deps";

const makeOps = (over: Partial<ChatActionOps> = {}): ChatActionOps => ({
  syncCoaching: over.syncCoaching ?? vi.fn().mockResolvedValue({ synced: 0 }),
  createWorkout: over.createWorkout ?? vi.fn().mockResolvedValue({ id: "w" }),
  logHealthMetric:
    over.logHealthMetric ?? vi.fn().mockResolvedValue({ ok: true }),
  logIntake: over.logIntake ?? vi.fn().mockResolvedValue({ id: "i" }),
});

describe("action tools", () => {
  it("should require confirmation for every action tool", () => {
    // Arrange
    const ops = makeOps();

    // Act
    const tools = [
      createSyncCoachingTool(ops),
      createCreateWorkoutTool(ops),
      createLogHealthMetricTool(ops),
    ];

    // Assert
    expect(tools.every((t) => t.requiresConfirmation)).toBe(true);
  });

  it("should delegate sync_coaching execution to the injected op", async () => {
    // Arrange
    const syncCoaching = vi.fn().mockResolvedValue({ synced: 3 });
    const tool = createSyncCoachingTool(makeOps({ syncCoaching }));

    // Act
    const result = await tool.execute({});

    // Assert
    expect(syncCoaching).toHaveBeenCalledOnce();
    expect(result).toEqual({ synced: 3 });
  });

  it("should pass the parsed input to createWorkout", async () => {
    // Arrange
    const createWorkout = vi.fn().mockResolvedValue({ id: "w1" });
    const tool = createCreateWorkoutTool(makeOps({ createWorkout }));

    // Act
    await tool.execute({ description: "easy ride", date: "2026-06-13" });

    // Assert
    expect(createWorkout).toHaveBeenCalledWith({
      description: "easy ride",
      date: "2026-06-13",
    });
  });

  it("should reject a log_health_metric input with an unknown metric", () => {
    // Arrange
    const tool = createLogHealthMetricTool(makeOps());

    // Act
    const parsed = tool.inputSchema.safeParse({
      metric: "calories",
      day: "2026-06-13",
      value: 1,
    });

    // Assert
    expect(parsed.success).toBe(false);
  });
});
