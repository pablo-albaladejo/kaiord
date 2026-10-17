import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";

const zone = (value: number) => ({
  type: "pace",
  value: { unit: "zone", value },
});

type StepSpec = { seconds: number; intensity: string; target: unknown };

const step = ({ seconds, intensity, target }: StepSpec) => ({
  stepIndex: 0,
  durationType: "time",
  duration: { type: "time", seconds },
  targetType: target ? "pace" : "open",
  target: target ?? { type: "open" },
  intensity,
});

// What a model following the parser rules emits for a runner: zone numbers.
const MODEL_OUTPUT = {
  sport: "running",
  steps: [
    step({ seconds: 720, intensity: "warmup", target: zone(1) }),
    step({
      seconds: 30,
      intensity: "interval",
      target: {
        type: "pace",
        value: { unit: "zone", min: 4, max: 5 },
      },
    }),
    step({ seconds: 120, intensity: "recovery", target: null }),
  ],
};

vi.mock("@kaiord/ai/providers", () => ({
  createLanguageModel: vi.fn(
    async () =>
      new MockLanguageModelV4({
        doGenerate: {
          content: [{ type: "text", text: JSON.stringify(MODEL_OUTPUT) }],
          finishReason: { unified: "stop", raw: "stop" },
          usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
          warnings: [],
        } as never,
      })
  ),
}));

import type { Profile } from "../types/profile";
import { garminPaceZonesFor } from "../utils/garmin-pace-zones";
import { generateWorkoutKrd } from "./generate-workout";

const RUNNER_WITHOUT_ZONES = { id: "r", sportZones: {} } as unknown as Profile;

describe("generateWorkoutKrd for a runner without pace zones", () => {
  it("should produce a workout the Garmin push accepts", async () => {
    // Arrange
    const options = {
      text: "Rodaje 12' z1 + 30\" fuerte + R: 2'",
      provider: { type: "anthropic" } as never,
      modelId: "m",
      sport: "running" as const,
      athlete: { profile: RUNNER_WITHOUT_ZONES, customPrompt: null },
      telemetry: { emit: vi.fn() },
    };

    // Act
    const krd = await generateWorkoutKrd(options);

    // Assert
    expect(() => garminPaceZonesFor(krd, RUNNER_WITHOUT_ZONES)).not.toThrow();
    expect(garminPaceZonesFor(krd, RUNNER_WITHOUT_ZONES)).toBeUndefined();
  });
});
