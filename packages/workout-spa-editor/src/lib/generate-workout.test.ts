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

vi.mock("./provider-factory", () => ({
  createLanguageModel: vi.fn().mockResolvedValue({ modelId: "test-model" }),
}));

import { createTextToWorkout } from "@kaiord/ai";
import { createWorkoutKRD } from "@kaiord/core";

import type { GenerateWorkoutOptions } from "./generate-workout";
import { generateWorkoutKrd } from "./generate-workout";
import { createLanguageModel } from "./provider-factory";

const OVER_LIMIT_PROMPT_LENGTH = 600;

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
      baseOptions.modelId
    );
  });

  it("should call createTextToWorkout with the language model", async () => {
    // Arrange

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(createTextToWorkout).toHaveBeenCalledWith({
      model: { modelId: "test-model" },
    });
  });

  it("should pass user text as prompt", async () => {
    // Arrange

    // Act
    await generateWorkoutKrd(baseOptions);

    // Assert
    expect(mockTextToWorkout).toHaveBeenCalledWith("30 minute endurance ride", {
      sport: undefined,
    });
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
    expect(mockTextToWorkout).toHaveBeenCalledWith("easy run", {
      sport: "running",
    });
  });

  it("should append zones context to prompt when provided", async () => {
    // Arrange
    await generateWorkoutKrd({
      ...baseOptions,
      zonesContext: "FTP: 250W\nPower zones: Z1: 0-137W",
    });

    // Act
    const prompt = mockTextToWorkout.mock.calls[0][0] as string;

    // Assert
    expect(prompt).toContain("30 minute endurance ride");
    expect(prompt).toContain("Training zones:");
    expect(prompt).toContain("FTP: 250W");
  });

  it("should append custom prompt when provided", async () => {
    // Arrange
    await generateWorkoutKrd({
      ...baseOptions,
      customPrompt: "focus on sweet spot",
    });

    // Act
    const prompt = mockTextToWorkout.mock.calls[0][0] as string;

    // Assert
    expect(prompt).toContain("Additional instructions:");
    expect(prompt).toContain("focus on sweet spot");
  });

  it("should truncate custom prompt to 500 characters", async () => {
    // Arrange
    const longPrompt = "a".repeat(OVER_LIMIT_PROMPT_LENGTH);
    await generateWorkoutKrd({
      ...baseOptions,
      customPrompt: longPrompt,
    });
    const prompt = mockTextToWorkout.mock.calls[0][0] as string;

    // Act
    const additionalSection = prompt.split("Additional instructions:\n")[1];

    // Assert
    expect(additionalSection).toHaveLength(500);
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
