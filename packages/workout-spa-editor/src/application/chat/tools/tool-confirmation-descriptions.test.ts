import { describe, expect, it, vi } from "vitest";

import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { buildChatTools } from "./build-chat-tools";

const ASKS_FIRST = "Requires the user to confirm before running.";
const RUNS_UNASKED = /without asking|as soon as it is called|automatically/i;

const tools = () =>
  buildChatTools({
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

describe("chat tool descriptions tell the model the truth about confirmation", () => {
  it.each(tools().map((t) => [t.name, t] as const))(
    "should say %s asks the athlete first exactly when it requires confirmation",
    (_, tool) => {
      // Arrange
      const asks = tool.requiresConfirmation === true;

      // Act
      const says = tool.description.includes(ASKS_FIRST);

      // Assert
      expect(says).toBe(asks);
      expect(tool.description).not.toMatch(RUNS_UNASKED);
    }
  );

  it("should tell the model to pass the coach's numbers to create_workout as written", () => {
    // Arrange
    const createWorkout = tools().find((t) => t.name === "create_workout")!;

    // Act
    const schema = JSON.stringify(
      (
        createWorkout.inputSchema as { toJSONSchema: () => unknown }
      ).toJSONSchema()
    );

    // Assert
    expect(schema).toContain("every number exactly as written");
  });
});
