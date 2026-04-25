import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAnalyticsEvent = vi.fn();

vi.mock("../../../contexts", () => ({
  useAnalytics: vi.fn(() => ({ event: mockAnalyticsEvent, pageView: vi.fn() })),
}));

const mockSetGeneration = vi.fn();
const mockGetSelectedProvider = vi.fn();
const mockGetActiveProfile = vi.fn();

vi.mock("../../../store/ai-store", () => ({
  useAiStore: vi.fn(() => ({
    getSelectedProvider: mockGetSelectedProvider,
    customPrompt: "",
    setGeneration: mockSetGeneration,
  })),
}));

vi.mock("../../../store/profile-store", () => ({
  useProfileStore: vi.fn(() => ({ getActiveProfile: mockGetActiveProfile })),
}));

const mockLoadWorkout = vi.fn();
vi.mock("../../../store/workout-store-selectors", () => ({
  useLoadWorkout: vi.fn(() => mockLoadWorkout),
}));

const mockGenerateWorkoutKrd = vi.fn();
vi.mock("../../../lib/generate-workout", () => ({
  generateWorkoutKrd: (...args: unknown[]) =>
    mockGenerateWorkoutKrd(...args) as unknown,
}));

vi.mock("./zones-formatter", () => ({
  formatZonesContext: vi.fn(() => undefined),
}));

import { useAiGeneration } from "./useAiGeneration";

describe("useAiGeneration — analytics call-site", () => {
  const fakeProvider = { id: "claude", isDefault: true };
  const fakeKrd = { extensions: {} };

  beforeEach(() => {
    mockGetSelectedProvider.mockReturnValue(fakeProvider);
    mockGetActiveProfile.mockReturnValue(null);
    mockGenerateWorkoutKrd.mockResolvedValue(fakeKrd);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fire workout-generated with provider and sport after successful generation", async () => {
    // Arrange
    const { result } = renderHook(() => useAiGeneration());

    // Act
    await act(async () => {
      await result.current.generate("45min sweet spot", "cycling" as never);
    });

    // Assert
    expect(mockAnalyticsEvent).toHaveBeenCalledWith("workout-generated", {
      provider: "claude",
      sport: "cycling",
    });
  });

  it("should fire workout-generated with empty sport when no sport is passed", async () => {
    // Arrange
    const { result } = renderHook(() => useAiGeneration());

    // Act
    await act(async () => {
      await result.current.generate("45min sweet spot");
    });

    // Assert
    expect(mockAnalyticsEvent).toHaveBeenCalledWith("workout-generated", {
      provider: "claude",
      sport: "",
    });
  });

  it("should not fire workout-generated when generation fails", async () => {
    // Arrange
    mockGenerateWorkoutKrd.mockRejectedValue(new Error("API error"));
    const { result } = renderHook(() => useAiGeneration());

    // Act
    await act(async () => {
      await result.current.generate("45min sweet spot");
    });

    // Assert
    expect(mockAnalyticsEvent).not.toHaveBeenCalled();
  });
});
