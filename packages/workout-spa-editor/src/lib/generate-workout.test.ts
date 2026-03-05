import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("./provider-factory", () => ({
  createLanguageModel: vi.fn().mockResolvedValue({ modelId: "test-model" }),
}));

import { createTextToWorkout } from "@kaiord/ai";
import { createWorkoutKRD } from "@kaiord/core";
import { createLanguageModel } from "./provider-factory";
import { generateWorkoutKrd } from "./generate-workout";
import type { GenerateWorkoutOptions } from "./generate-workout";

const baseOptions: GenerateWorkoutOptions = {
  text: "30 minute endurance ride",
  provider: {
    id: "test-id",
    type: "anthropic",
    apiKey: "sk-test",
    model: "claude-sonnet-4-5-20241022",
    label: "Test",
    isDefault: true,
  },
};

describe("generateWorkoutKrd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTextToWorkout.mockResolvedValue({ name: "Ride", steps: [] });
  });

  it("should create language model from provider config", async () => {
    await generateWorkoutKrd(baseOptions);

    expect(createLanguageModel).toHaveBeenCalledWith(baseOptions.provider);
  });

  it("should call createTextToWorkout with the language model", async () => {
    await generateWorkoutKrd(baseOptions);

    expect(createTextToWorkout).toHaveBeenCalledWith({
      model: { modelId: "test-model" },
    });
  });

  it("should pass user text as prompt", async () => {
    await generateWorkoutKrd(baseOptions);

    expect(mockTextToWorkout).toHaveBeenCalledWith("30 minute endurance ride", {
      sport: undefined,
    });
  });

  it("should pass sport option when provided", async () => {
    await generateWorkoutKrd({
      ...baseOptions,
      text: "easy run",
      sport: "running",
    });

    expect(mockTextToWorkout).toHaveBeenCalledWith("easy run", {
      sport: "running",
    });
  });

  it("should append zones context to prompt when provided", async () => {
    await generateWorkoutKrd({
      ...baseOptions,
      zonesContext: "FTP: 250W\nPower zones: Z1: 0-137W",
    });

    const prompt = mockTextToWorkout.mock.calls[0][0] as string;
    expect(prompt).toContain("30 minute endurance ride");
    expect(prompt).toContain("Training zones:");
    expect(prompt).toContain("FTP: 250W");
  });

  it("should append custom prompt when provided", async () => {
    await generateWorkoutKrd({
      ...baseOptions,
      customPrompt: "focus on sweet spot",
    });

    const prompt = mockTextToWorkout.mock.calls[0][0] as string;
    expect(prompt).toContain("Additional instructions:");
    expect(prompt).toContain("focus on sweet spot");
  });

  it("should truncate custom prompt to 500 characters", async () => {
    const longPrompt = "a".repeat(600);

    await generateWorkoutKrd({
      ...baseOptions,
      customPrompt: longPrompt,
    });

    const prompt = mockTextToWorkout.mock.calls[0][0] as string;
    const additionalSection = prompt.split("Additional instructions:\n")[1];
    expect(additionalSection).toHaveLength(500);
  });

  it("should wrap result with createWorkoutKRD", async () => {
    const fakeWorkout = { name: "Endurance Ride", steps: [] };
    mockTextToWorkout.mockResolvedValueOnce(fakeWorkout);

    await generateWorkoutKrd(baseOptions);

    expect(createWorkoutKRD).toHaveBeenCalledWith(fakeWorkout);
  });
});
