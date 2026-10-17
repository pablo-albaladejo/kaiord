import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTextToWorkout = vi.fn();

vi.mock("@kaiord/ai", () => ({
  createTextToWorkout: vi.fn(() => mockTextToWorkout),
}));

vi.mock("@kaiord/core", () => ({
  createWorkoutKRD: vi.fn((workout: unknown) => ({
    version: "1.0",
    workout,
  })),
}));

vi.mock("@kaiord/ai/providers", () => ({
  createLanguageModel: vi.fn().mockResolvedValue({ modelId: "test-model" }),
}));

const mockSink = { emit: vi.fn() };

const mockPersistence = {
  profiles: {
    getActiveId: vi.fn(),
    getById: vi.fn(),
  },
  aiProviders: { getCustomPrompt: vi.fn() },
};

vi.mock("../adapters/dexie/dexie-persistence-adapter", () => ({
  createDexiePersistence: vi.fn(() => mockPersistence),
}));

vi.mock("../adapters/telemetry/dexie-usage-telemetry-sink", () => ({
  createDexieUsageTelemetrySink: vi.fn(() => mockSink),
}));

import { createTextToWorkout } from "@kaiord/ai";
import { createLanguageModel } from "@kaiord/ai/providers";
import { createWorkoutKRD } from "@kaiord/core";

import { createDexieUsageTelemetrySink } from "../adapters/telemetry/dexie-usage-telemetry-sink";
import type { Profile } from "../types/profile";
import type { GenerateWorkoutOptions } from "./generate-workout";
import { generateWorkoutKrd } from "./generate-workout";

const RUNNING_PROFILE = {
  id: "p1",
  sportZones: {
    running: {
      thresholds: {},
      heartRateZones: { method: "custom", zones: [] },
      paceZones: {
        method: "custom",
        zones: [
          {
            zone: 1,
            name: "Easy",
            minPace: 345,
            maxPace: 390,
            unit: "min_per_km",
          },
        ],
      },
    },
  },
} as unknown as Profile;

type SentOptions = {
  sport?: string;
  athlete: {
    zonesText?: string;
    instructions?: string;
    zones: { pace?: Array<{ zone: number }> };
  };
};

const sentOptions = (): SentOptions =>
  mockTextToWorkout.mock.calls[0]![1] as SentOptions;

const baseOptions: GenerateWorkoutOptions = {
  text: "30 minute endurance ride",
  modelId: "claude-sonnet-4-5-20241022",
  provider: {
    id: "test-id",
    type: "anthropic",
    apiKey: "sk-test",
    model: "claude-sonnet-4-5-20241022",
    label: "Test",
    isDefault: true,
    createdAt: 0,
  },
};

describe("generateWorkoutKrd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTextToWorkout.mockResolvedValue({ name: "Ride", steps: [] });
  });

  it("should create language model from provider config and resolved model id", async () => {
    // Arrange

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(createLanguageModel).toHaveBeenCalledWith(
      baseOptions.provider,
      baseOptions.modelId,
      { browser: true }
    );
  });

  it("should call createTextToWorkout with the language model", async () => {
    // Arrange

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(createTextToWorkout).toHaveBeenCalledWith(
      expect.objectContaining({ model: { modelId: "test-model" } })
    );
  });

  it("should build and forward a default usage-telemetry sink so the run is accounted", async () => {
    // Arrange

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(createDexieUsageTelemetrySink).toHaveBeenCalled();
    expect(createTextToWorkout).toHaveBeenCalledWith(
      expect.objectContaining({ telemetry: mockSink })
    );
  });

  it("should prefer an explicitly supplied telemetry sink over the default", async () => {
    // Arrange
    const explicit = { emit: vi.fn() };

    // Act
    await generateWorkoutKrd({ ...baseOptions, telemetry: explicit });

    // Assert
    expect(createTextToWorkout).toHaveBeenCalledWith(
      expect.objectContaining({ telemetry: explicit })
    );
  });

  it("should pass user text as prompt", async () => {
    // Arrange

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(mockTextToWorkout).toHaveBeenCalledWith(
      "30 minute endurance ride",
      expect.objectContaining({ sport: undefined })
    );
  });

  it("should pass sport option when provided", async () => {
    // Arrange

    // Act
    await generateWorkoutKrd({
      ...baseOptions,
      text: "easy run",
      sport: "running",
    });

    // Assert
    expect(sentOptions().sport).toBe("running");
  });

  it("should send the athlete's zones and instructions when supplied", async () => {
    // Arrange
    const athlete = {
      profile: RUNNING_PROFILE,
      customPrompt: "Pace targets on every step",
    };

    // Act
    await generateWorkoutKrd({ ...baseOptions, sport: "running", athlete });

    // Assert
    const sent = sentOptions().athlete;
    expect(sent.zonesText).toContain("Pace zones");
    expect(sent.instructions).toBe("Pace targets on every step");
    expect(sent.zones.pace?.map((z) => z.zone)).toEqual([1]);
    expect(mockPersistence.profiles.getActiveId).not.toHaveBeenCalled();
  });

  it("should load the active profile and custom instructions when the caller passes none", async () => {
    // Arrange
    mockPersistence.profiles.getActiveId.mockResolvedValueOnce("p1");
    mockPersistence.profiles.getById.mockResolvedValueOnce(RUNNING_PROFILE);
    mockPersistence.aiProviders.getCustomPrompt.mockResolvedValueOnce(
      "Prefer ranges"
    );

    // Act
    await generateWorkoutKrd({ ...baseOptions, sport: "running" });

    // Assert
    const sent = sentOptions().athlete;
    expect(mockPersistence.profiles.getById).toHaveBeenCalledWith("p1");
    expect(sent.zonesText).toContain("Pace zones");
    expect(sent.instructions).toBe("Prefer ranges");
  });

  it("should send no zones when there is no active profile", async () => {
    // Arrange
    mockPersistence.profiles.getActiveId.mockResolvedValueOnce(null);
    mockPersistence.aiProviders.getCustomPrompt.mockResolvedValueOnce(null);

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(sentOptions().athlete).toEqual({
      zonesText: undefined,
      instructions: undefined,
      zones: {},
    });
  });

  it("should wrap result with createWorkoutKRD", async () => {
    // Arrange
    const fakeWorkout = { name: "Endurance Ride", steps: [] };
    mockTextToWorkout.mockResolvedValueOnce(fakeWorkout);

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(createWorkoutKRD).toHaveBeenCalledWith(fakeWorkout);
  });
});
