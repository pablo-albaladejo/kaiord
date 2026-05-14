/**
 * Tests for `useCoachingAi` — the in-flight guard, the success →
 * navigate path, and the cancel-clears-spinner path.
 *
 * The `convertCoachingActivityWithAi` use case is mocked so we exercise
 * the hook's wiring (re-entry guard, processing state, navigate-on-ok)
 * without paying for a full Dexie + LLM round-trip.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AnalyticsProvider } from "../../../contexts/analytics-context";
import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { useCoachingAi } from "./use-coaching-ai-handler";
import type * as AiHelpers from "./use-coaching-ai-helpers";

const navigateMock = vi.fn();
const runConvertMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/calendar", navigateMock],
}));

vi.mock("../../../hooks/use-ai-providers-live", () => ({
  useAiProvidersLive: () => [
    { id: "p-1", type: "openai", model: "gpt-4o-mini", apiKey: "k" },
  ],
}));

vi.mock("./use-coaching-ai-helpers", async (orig) => {
  const actual = (await orig()) as typeof AiHelpers;
  return {
    ...actual,
    runConvertWithAi: (...args: unknown[]) => runConvertMock(...args),
  };
});

const activity: CoachingActivity = {
  id: "train2go:abc",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-13",
  sport: { label: "Cycling", icon: "🚴" },
  title: "Sweet spot",
  duration: "01:00:00",
  effort: 4,
  status: "pending",
  description: "desc",
};

const wrap = (): ((props: { children: ReactNode }) => ReactNode) => {
  const persistence = createInMemoryPersistence();
  return ({ children }) => (
    <AnalyticsProvider analytics={{ event: vi.fn() }}>
      <PersistenceProvider persistence={persistence}>
        <ToastContextProvider>{children}</ToastContextProvider>
      </PersistenceProvider>
    </AnalyticsProvider>
  );
};

describe("useCoachingAi", () => {
  beforeEach(() => {
    navigateMock.mockClear();
    runConvertMock.mockReset();
  });

  it("should navigate to the editor on AI success", async () => {
    // Arrange
    runConvertMock.mockResolvedValue({
      ok: true,
      workoutId: "w-new",
      created: true,
    });
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useCoachingAi(activity, "profile-1", onClose),
      { wrapper: wrap() }
    );

    // Act
    await act(async () => {
      await result.current.startAi();
    });

    // Assert
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(navigateMock).toHaveBeenCalledWith("/workout/w-new");
  });

  it("should expose a typed failure state when the use case rejects", async () => {
    // Arrange
    runConvertMock.mockResolvedValue({
      ok: false,
      reason: "ai-timeout",
    });
    const { result } = renderHook(
      () => useCoachingAi(activity, "profile-1", vi.fn()),
      { wrapper: wrap() }
    );

    // Act
    await act(async () => {
      await result.current.startAi();
    });

    // Assert
    expect(result.current.failure?.reason).toBe("ai-timeout");
  });

  it("should clear the failure state via clearFailure", async () => {
    // Arrange
    runConvertMock.mockResolvedValue({ ok: false, reason: "ai-error" });
    const { result } = renderHook(
      () => useCoachingAi(activity, "profile-1", vi.fn()),
      { wrapper: wrap() }
    );
    await act(async () => {
      await result.current.startAi();
    });

    // Act
    act(() => result.current.clearFailure());

    // Assert
    expect(result.current.failure).toBeNull();
  });

  it("should clear the processing flag when cancelAi is invoked", async () => {
    // Arrange
    let resolveRun: (value: unknown) => void = () => undefined;
    runConvertMock.mockImplementation(
      () => new Promise((res) => (resolveRun = res))
    );
    const { result } = renderHook(
      () => useCoachingAi(activity, "profile-1", vi.fn()),
      { wrapper: wrap() }
    );
    act(() => {
      void result.current.startAi();
    });
    await waitFor(() => expect(result.current.processing).toBe(true));

    // Act
    act(() => result.current.cancelAi());

    // Assert
    expect(result.current.processing).toBe(false);
    // Cleanup: resolve the still-pending mock so the test doesn't leak.
    resolveRun({ ok: false, reason: "ai-cancelled" });
  });
});
