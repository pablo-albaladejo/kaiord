import { beforeEach, describe, expect, it, vi } from "vitest";

import { startTraceRun } from "../application/trace/trace-run";
import { createInMemoryTraceRepository } from "../test-utils/in-memory-trace-repository";

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

// The schemas the App parses with stay real; only the model is stubbed.
vi.mock("@kaiord/ai/providers", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createLanguageModel: vi.fn().mockResolvedValue({ modelId: "test-model" }),
}));

const mockSink = { emit: vi.fn() };

const mockPersistence = {
  traces: createInMemoryTraceRepository(),
  profiles: {
    getActiveId: vi.fn(),
    getById: vi.fn(),
  },
  aiProviders: { getCustomPrompt: vi.fn() },
};

import { createTextToWorkout } from "@kaiord/ai";
import { createLanguageModel } from "@kaiord/ai/providers";
import { createWorkoutKRD } from "@kaiord/core";

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
  deps: { persistence: mockPersistence as never, usage: mockSink },
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

  it("should leave one Trace of its own and forward usage without its id", async () => {
    // Arrange
    await mockPersistence.traces.clear();
    const event = { type: "run_finished", requests: [] } as never;
    await generateWorkoutKrd(baseOptions);
    const [[config]] = vi.mocked(createTextToWorkout).mock.calls as unknown as [
      [{ telemetry: { emit: (e: never) => void } }],
    ];

    // Act
    config.telemetry.emit(event);
    const traces = await mockPersistence.traces.list();

    // Assert
    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({ feature: "generation", outcome: "ok" });
    expect(traces[0]?.sent).toEqual([
      { to: "anthropic", kinds: ["workoutDescription"] },
    ]);
    expect(mockSink.emit).toHaveBeenCalledWith(event);
  });

  it("should report into the run it is given and leave no Trace of its own", async () => {
    // Arrange
    await mockPersistence.traces.clear();
    const trace = startTraceRun({
      feature: "batch",
      traces: mockPersistence.traces,
    });

    // Act
    await generateWorkoutKrd({ ...baseOptions, trace });

    // Assert
    expect(await mockPersistence.traces.list()).toHaveLength(0);
  });

  it("should record a failed run in its Trace and still throw", async () => {
    // Arrange
    await mockPersistence.traces.clear();
    mockTextToWorkout.mockRejectedValueOnce(new Error("provider down"));

    // Act
    const run = generateWorkoutKrd(baseOptions);

    // Assert
    await expect(run).rejects.toThrow("provider down");
    const [trace] = await mockPersistence.traces.list();
    expect(trace?.outcome).toBe("failed");
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

  it("should forward the abort signal and the progress listener to the run", async () => {
    // Arrange
    const abortSignal = new AbortController().signal;
    const onProgress = vi.fn();

    // Act
    await generateWorkoutKrd({ ...baseOptions, abortSignal, onProgress });

    // Assert
    expect(mockTextToWorkout).toHaveBeenCalledWith(
      baseOptions.text,
      expect.objectContaining({ signal: abortSignal, onProgress })
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

  it("should load the named profile instead of the active one", async () => {
    // Arrange
    mockPersistence.profiles.getById.mockResolvedValueOnce(RUNNING_PROFILE);
    mockPersistence.aiProviders.getCustomPrompt.mockResolvedValueOnce(null);

    // Act
    await generateWorkoutKrd({
      ...baseOptions,
      sport: "running",
      profileId: "p2",
    });

    // Assert
    expect(mockPersistence.profiles.getActiveId).not.toHaveBeenCalled();
    expect(mockPersistence.profiles.getById).toHaveBeenCalledWith("p2");
    expect(sentOptions().athlete.zonesText).toContain("Pace zones");
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
