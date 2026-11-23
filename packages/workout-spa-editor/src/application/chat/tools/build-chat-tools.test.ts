import {
  buildChatSystemPrompt,
  CHAT_ACTION_TOOL_NAMES,
} from "@kaiord/ai/prompts";
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
  offersTool: () => true,
});

describe("buildChatTools", () => {
  it("should not offer the assistant a Tool an off Capability owns", () => {
    // Arrange
    const deps = {
      ...makeDeps(),
      offersTool: (name: string) => name !== "set_data_route",
    };

    // Act
    const names = buildChatTools(deps).map((t) => t.name);

    // Assert
    expect(names).not.toContain("set_data_route");
    expect(names).toContain("get_data_routes");
  });

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

  it("should name every confirmation-gated tool in the chat system prompt", () => {
    // Arrange
    const prompt = buildChatSystemPrompt();
    const declared: ReadonlyArray<string> = CHAT_ACTION_TOOL_NAMES;

    // Act
    const unnamed = buildChatTools(makeDeps())
      .filter((t) => t.requiresConfirmation)
      .map((t) => t.name)
      .filter((name) => !declared.includes(name) || !prompt.includes(name));

    // Assert
    expect(unnamed).toEqual([]);
  });

  it("should declare exactly the registry's confirmation-gated tools in the prompt tuple", () => {
    // Arrange
    const gated = buildChatTools(makeDeps())
      .filter((t) => t.requiresConfirmation)
      .map((t) => t.name);

    // Act
    const declared = [...CHAT_ACTION_TOOL_NAMES].sort();

    // Assert
    expect(declared).toEqual([...gated].sort());
  });

  it("should hand the model stored health values when the athlete shares them", async () => {
    // Arrange
    const deps = { ...makeDeps(), healthShared: true };
    await deps.persistence.healthWeight.put({
      id: "w1",
      profileId: "p1",
      date: "2026-06-10",
      krd: { weightKilograms: 71.4 },
    } as never);
    const tool = buildChatTools(deps).find((t) => t.name === "query_health");

    // Act
    const result = await tool?.execute({ metric: "weight" });

    // Assert
    expect(JSON.stringify(result)).toContain("71.4");
  });

  it("should answer every health tool without a stored value when the athlete does not share", async () => {
    // Arrange
    const deps = { ...makeDeps(), healthShared: false };
    await deps.persistence.healthWeight.put({
      id: "w1",
      profileId: "p1",
      date: "2026-06-10",
      krd: { weightKilograms: 71.4 },
    } as never);
    const tools = buildChatTools(deps).filter((t) =>
      ["query_health", "query_energy_balance"].includes(t.name)
    );

    // Act
    const results = await Promise.all(
      tools.map((t) => t.execute({ metric: "weight" }))
    );

    // Assert
    expect(results).toHaveLength(2);
    for (const result of results) {
      expect(result).toEqual({
        withheld: true,
        reason: expect.stringContaining("chose not to share"),
      });
    }
  });
});
