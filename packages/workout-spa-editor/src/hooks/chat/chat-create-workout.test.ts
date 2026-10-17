import { describe, expect, it, vi } from "vitest";

const mockGenerate = vi.fn();

vi.mock("../../lib/generate-workout", () => ({
  generateWorkoutKrd: (...args: Array<unknown>) => mockGenerate(...args),
}));

vi.mock("../../components/pages/CreateWorkout/build-workout-record", () => ({
  buildWorkoutRecord: vi.fn(async () => ({ id: "w1", date: "2026-10-17" })),
}));

import type { CreateWorkoutInput } from "../../application/chat/tools/chat-tool-deps";
import type { PersistencePort } from "../../ports/persistence-port";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import { doCreateWorkout } from "./chat-create-workout";

describe("doCreateWorkout", () => {
  it("should generate with the zones of the profile the workout is written to", async () => {
    // Arrange
    mockGenerate.mockResolvedValue({ extensions: {} });
    const persistence = {
      workouts: { put: vi.fn() },
    } as unknown as PersistencePort;
    const provider = { type: "anthropic" } as LlmProviderConfig;

    // Act
    await doCreateWorkout(persistence, "athlete-2", provider, "m", {
      description: "Rodaje 40' Z2",
      sport: "running",
    } as CreateWorkoutInput);

    // Assert
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: "athlete-2" })
    );
  });
});
