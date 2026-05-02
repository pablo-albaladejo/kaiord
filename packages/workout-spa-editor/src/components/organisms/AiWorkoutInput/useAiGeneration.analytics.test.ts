import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAnalyticsEvent = vi.fn();

vi.mock("../../../contexts", () => ({
  useAnalytics: vi.fn(() => ({ event: mockAnalyticsEvent, pageView: vi.fn() })),
}));

const mockSetGeneration = vi.fn();
const mockSelectForGeneration = vi.fn();

vi.mock("../../../store/ai-runtime-store", () => ({
  useAiRuntimeStore: Object.assign(
    vi.fn((selector?: (s: unknown) => unknown) => {
      const state = {
        selectedProviderId: "claude",
        generation: { status: "idle" },
        selectForGeneration: mockSelectForGeneration,
        setGeneration: mockSetGeneration,
      };
      return selector ? selector(state) : state;
    }),
    {}
  ),
}));

import type { LlmProviderConfig } from "../../../store/ai-store-types";

const mockProviders = vi.fn<() => LlmProviderConfig[]>();
vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => mockProviders(),
}));

vi.mock("../../../hooks/use-ai-custom-prompt-live", () => ({
  useAiCustomPromptLive: () => null,
}));

const mockGetActiveProfile = vi.fn();
vi.mock("../../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: vi.fn(() => ({
    id: null,
    profile: mockGetActiveProfile(),
  })),
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
  const fakeProvider = {
    id: "claude",
    type: "anthropic" as const,
    apiKey: "k",
    model: "claude-sonnet-4-5",
    label: "Claude",
    isDefault: true,
    createdAt: 0,
  };
  const fakeKrd = { extensions: {} };

  beforeEach(() => {
    mockProviders.mockReturnValue([fakeProvider]);
    mockGetActiveProfile.mockReturnValue(null);
    mockGenerateWorkoutKrd.mockResolvedValue(fakeKrd);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fires workout-generated with provider and sport after successful generation", async () => {
    const { result } = renderHook(() => useAiGeneration());

    await act(async () => {
      await result.current.generate("45min sweet spot", "cycling" as never);
    });

    expect(mockAnalyticsEvent).toHaveBeenCalledWith("workout-generated", {
      provider: "claude",
      sport: "cycling",
    });
  });

  it("fires workout-generated with empty sport when no sport is passed", async () => {
    const { result } = renderHook(() => useAiGeneration());

    await act(async () => {
      await result.current.generate("45min sweet spot");
    });

    expect(mockAnalyticsEvent).toHaveBeenCalledWith("workout-generated", {
      provider: "claude",
      sport: "",
    });
  });

  it("does not fire workout-generated when generation fails", async () => {
    mockGenerateWorkoutKrd.mockRejectedValue(new Error("API error"));
    const { result } = renderHook(() => useAiGeneration());

    await act(async () => {
      await result.current.generate("45min sweet spot");
    });

    expect(mockAnalyticsEvent).not.toHaveBeenCalled();
  });
});
