import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTextToWorkout = vi.fn();
const healthRequest = vi.fn();

vi.mock("@kaiord/ai", () => ({
  createTextToWorkout: vi.fn(() => mockTextToWorkout),
}));

// The schemas the App parses with stay real; only the model is stubbed.
vi.mock("@kaiord/ai/providers", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  createLanguageModel: vi.fn().mockResolvedValue({ modelId: "test-model" }),
}));

vi.mock("./health-sharing-gate", () => ({
  askGenerationHealth: (providerType: string) =>
    healthRequest({ flow: "generation", providerType }),
}));

import { createLanguageModel } from "@kaiord/ai/providers";

import { createInMemoryTraceRepository } from "../test-utils/in-memory-trace-repository";
import type { Profile } from "../types/profile";
import type { GenerateWorkoutOptions } from "./generate-workout";
import { generateWorkoutKrd } from "./generate-workout";

const LTHR = 168;
const ZONE_TOP = 140;

const zones = (maxBpm: number) => ({
  method: "custom",
  zones: [{ zone: 2, name: "Aerobic", minBpm: 120, maxBpm }],
});

const profileWith = (maxBpm: number) =>
  ({
    id: "p1",
    sportZones: {
      cycling: {
        thresholds: { lthr: maxBpm > 0 ? LTHR : undefined, ftp: 250 },
        heartRateZones: zones(maxBpm),
        powerZones: {
          method: "custom",
          zones: [
            { zone: 2, name: "Endurance", minPercent: 56, maxPercent: 75 },
          ],
        },
      },
    },
  }) as unknown as Profile;

const options = (profile: Profile): GenerateWorkoutOptions => ({
  deps: {
    persistence: { traces: createInMemoryTraceRepository() } as never,
    usage: { emit: vi.fn() },
  },
  text: "1h endurance ride",
  provider: { id: "a", type: "anthropic", apiKey: "k" } as never,
  modelId: "claude",
  sport: "cycling",
  athlete: { profile, customPrompt: null },
});

const sentZones = () =>
  (mockTextToWorkout.mock.calls[0]?.[1] as { athlete: { zonesText?: string } })
    .athlete.zonesText ?? "";

describe("generateWorkoutKrd and heart-rate data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTextToWorkout.mockResolvedValue({
      name: "Ride",
      sport: "cycling",
      steps: [],
    });
  });

  it("should ask before a generation that carries heart-rate data, and send it when shared", async () => {
    // Arrange
    healthRequest.mockResolvedValue("send");

    // Act
    await generateWorkoutKrd(options(profileWith(ZONE_TOP)));

    // Assert
    expect(healthRequest).toHaveBeenCalledWith({
      flow: "generation",
      providerType: "anthropic",
    });
    expect(sentZones()).toContain("LTHR: 168bpm");
    expect(sentZones()).toContain("120-140bpm");
  });

  it("should generate without the heart-rate threshold and zones when not shared, keeping power", async () => {
    // Arrange
    healthRequest.mockResolvedValue("withhold");

    // Act
    await generateWorkoutKrd(options(profileWith(ZONE_TOP)));

    // Assert
    expect(sentZones()).not.toContain("bpm");
    expect(sentZones()).toContain("FTP: 250W");
    expect(vi.mocked(createLanguageModel)).toHaveBeenCalled();
  });

  it("should not ask when the profile holds no heart-rate data", async () => {
    // Arrange
    healthRequest.mockResolvedValue("withhold");

    // Act
    await generateWorkoutKrd(options(profileWith(0)));

    // Assert
    expect(healthRequest).not.toHaveBeenCalled();
    expect(sentZones()).toContain("FTP: 250W");
  });

  it("should use the answer a caller already holds instead of asking again", async () => {
    // Arrange
    healthRequest.mockResolvedValue("send");

    // Act
    await generateWorkoutKrd({
      ...options(profileWith(ZONE_TOP)),
      askHealth: async () => "withhold",
    });

    // Assert
    expect(healthRequest).not.toHaveBeenCalled();
    expect(sentZones()).not.toContain("bpm");
  });
});
