import { describe, expect, it, vi } from "vitest";

import type { ChatActionOps } from "./chat-tool-deps";
import { createLogIntakeTool } from "./log-intake-tool";

const makeOps = (over: Partial<ChatActionOps> = {}): ChatActionOps => ({
  syncCoaching: over.syncCoaching ?? vi.fn().mockResolvedValue({ synced: 0 }),
  createWorkout: over.createWorkout ?? vi.fn().mockResolvedValue({ id: "w" }),
  logHealthMetric:
    over.logHealthMetric ?? vi.fn().mockResolvedValue({ ok: true }),
  logIntake: over.logIntake ?? vi.fn().mockResolvedValue({ id: "i" }),
});

describe("createLogIntakeTool", () => {
  it("should require confirmation before running", () => {
    // Arrange
    const tool = createLogIntakeTool(makeOps());

    // Act
    const requires = tool.requiresConfirmation;

    // Assert
    expect(requires).toBe(true);
  });

  it("should pass the parsed input to logIntake", async () => {
    // Arrange
    const logIntake = vi.fn().mockResolvedValue({ id: "i1" });
    const tool = createLogIntakeTool(makeOps({ logIntake }));

    // Act
    await tool.execute({
      date: "2026-06-21",
      kcal: 600,
      proteinG: 40,
      carbG: 60,
      fatG: 20,
      mealSlot: "lunch",
    });

    // Assert
    expect(logIntake).toHaveBeenCalledWith({
      date: "2026-06-21",
      kcal: 600,
      proteinG: 40,
      carbG: 60,
      fatG: 20,
      mealSlot: "lunch",
    });
  });

  it("should reject an intake input with a negative kcal", () => {
    // Arrange
    const tool = createLogIntakeTool(makeOps());

    // Act
    const parsed = tool.inputSchema.safeParse({
      date: "2026-06-21",
      kcal: -10,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
    });

    // Assert
    expect(parsed.success).toBe(false);
  });

  it("should reject an intake input with an unknown meal slot", () => {
    // Arrange
    const tool = createLogIntakeTool(makeOps());

    // Act
    const parsed = tool.inputSchema.safeParse({
      date: "2026-06-21",
      kcal: 100,
      proteinG: 0,
      carbG: 0,
      fatG: 0,
      mealSlot: "brunch",
    });

    // Assert
    expect(parsed.success).toBe(false);
  });
});
