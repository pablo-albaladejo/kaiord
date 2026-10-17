import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTextToWorkout = vi.fn();

vi.mock("@kaiord/ai", () => ({
  createTextToWorkout: vi.fn(() => mockTextToWorkout),
}));

vi.mock("@kaiord/ai/providers", () => ({
  createLanguageModel: vi.fn().mockResolvedValue({ modelId: "test-model" }),
}));

const mockPersistence = {
  profiles: { getActiveId: vi.fn(), getById: vi.fn() },
  aiProviders: { getCustomPrompt: vi.fn() },
};

vi.mock("../../adapters/dexie/dexie-persistence-adapter", () => ({
  createDexiePersistence: vi.fn(() => mockPersistence),
}));

vi.mock("../../adapters/telemetry/dexie-usage-telemetry-sink", () => ({
  createDexieUsageTelemetrySink: vi.fn(() => ({ emit: vi.fn() })),
}));

import type { KaiordDatabase } from "../../adapters/dexie/dexie-database";
import { makeWorkoutRecord } from "../../application/test-helpers";
import { PACE_MODEL } from "../../lib/athlete/zone-models";
import type { LlmProviderConfig } from "../../store/ai-store-types";
import type { Profile } from "../../types/profile";
import { createProcessOne } from "./batch-process-one";

const PROVIDER: LlmProviderConfig = {
  id: "p",
  type: "anthropic",
  apiKey: "sk-test",
  model: "m",
  label: "Test",
  isDefault: true,
  createdAt: 0,
};

const PROFILE = {
  id: "athlete",
  sportZones: {
    running: {
      thresholds: { thresholdPace: 300, paceUnit: "min_per_km" },
      heartRateZones: { method: "custom", zones: [] },
    },
  },
} as unknown as Profile;

const WORKOUT = {
  sport: "running",
  steps: [
    {
      stepIndex: 0,
      durationType: "time",
      duration: { type: "time", seconds: 720 },
      targetType: "pace",
      target: { type: "pace", value: { unit: "zone", value: 1 } },
      intensity: "warmup",
    },
  ],
};

describe("createProcessOne (Train2Go coaching path)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTextToWorkout.mockResolvedValue(WORKOUT);
    mockPersistence.profiles.getActiveId.mockResolvedValue("athlete");
    mockPersistence.profiles.getById.mockResolvedValue(PROFILE);
    mockPersistence.aiProviders.getCustomPrompt.mockResolvedValue(
      "Always use pace for running"
    );
  });

  it("should send the coach text with the athlete's zones and custom instructions", async () => {
    // Arrange
    const db = { table: () => ({ put: vi.fn() }) } as unknown as KaiordDatabase;
    const processOne = createProcessOne(PROVIDER, "m", db);
    const workout = makeWorkoutRecord({
      raw: {
        ...makeWorkoutRecord().raw!,
        description: "Rodaje 12' z1 RPE 2-3",
      },
    });

    // Act
    const result = await processOne(workout, false);

    // Assert
    expect(result.ok).toBe(true);
    const [text, options] = mockTextToWorkout.mock.calls[0]!;
    expect(text).toContain("<coach_description>\nRodaje 12' z1 RPE 2-3");
    expect(options.athlete.zonesText).toContain("Threshold Pace: 5:00/km");
    expect(options.athlete.instructions).toBe("Always use pace for running");
    expect(options.athlete.zones.pace).toHaveLength(PACE_MODEL.names.length);
  });
});
