import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { buildChatTools } from "./build-chat-tools";

const makeDeps = () => ({
  persistence: createInMemoryPersistence(),
  profileId: "p1",
  today: "2026-06-13",
  actions: {
    syncCoaching: vi.fn(),
    createWorkout: vi.fn(),
    logHealthMetric: vi.fn(),
    logIntake: vi.fn(),
    pushToGarmin: vi.fn(),
    setDataRoute: vi.fn(),
  },
  getMatrixSignals: vi.fn(),
});

describe("buildChatTools", () => {
  it("should assemble the full read + action tool registry", () => {
    // Arrange
    const deps = makeDeps();

    // Act
    const tools = buildChatTools(deps);

    // Assert
    expect(tools.map((t) => t.name).sort()).toEqual([
      "create_workout",
      "get_data_routes",
      "get_today",
      "log_health_metric",
      "log_intake",
      "push_to_garmin",
      "query_coaching",
      "query_energy_balance",
      "query_health",
      "query_workouts",
      "set_data_route",
      "sync_coaching",
    ]);
  });

  it("should mark exactly the six action tools as requiring confirmation", () => {
    // Arrange
    const deps = makeDeps();

    // Act
    const confirmed = buildChatTools(deps)
      .filter((t) => t.requiresConfirmation)
      .map((t) => t.name)
      .sort();

    // Assert
    expect(confirmed).toEqual([
      "create_workout",
      "log_health_metric",
      "log_intake",
      "push_to_garmin",
      "set_data_route",
      "sync_coaching",
    ]);
  });
});
