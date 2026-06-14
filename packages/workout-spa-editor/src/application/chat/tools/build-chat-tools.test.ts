import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { buildChatTools } from "./build-chat-tools";

describe("buildChatTools", () => {
  it("should assemble the full read + action tool registry", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const deps = {
      persistence,
      profileId: "p1",
      today: "2026-06-13",
      actions: {
        syncCoaching: vi.fn(),
        createWorkout: vi.fn(),
        logHealthMetric: vi.fn(),
      },
    };

    // Act
    const tools = buildChatTools(deps);

    // Assert
    expect(tools.map((t) => t.name).sort()).toEqual([
      "create_workout",
      "get_today",
      "log_health_metric",
      "query_coaching",
      "query_health",
      "query_workouts",
      "sync_coaching",
    ]);
  });

  it("should mark exactly the three action tools as requiring confirmation", () => {
    // Arrange
    const persistence = createInMemoryPersistence();
    const deps = {
      persistence,
      profileId: "p1",
      today: "2026-06-13",
      actions: {
        syncCoaching: vi.fn(),
        createWorkout: vi.fn(),
        logHealthMetric: vi.fn(),
      },
    };

    // Act
    const confirmed = buildChatTools(deps)
      .filter((t) => t.requiresConfirmation)
      .map((t) => t.name)
      .sort();

    // Assert
    expect(confirmed).toEqual([
      "create_workout",
      "log_health_metric",
      "sync_coaching",
    ]);
  });
});
