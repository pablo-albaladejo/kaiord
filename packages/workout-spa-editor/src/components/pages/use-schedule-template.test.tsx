/**
 * useScheduleTemplate Hook Tests
 *
 * Verifies that confirmSchedule fires a toast.error when no profile
 * is active (CodeRabbit follow-up from PR #601).
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KRD } from "../../types/krd";
import type { WorkoutTemplate } from "../../types/workout-library";
import { useScheduleTemplate } from "./use-schedule-template";

const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("../../contexts/ToastContext", () => ({
  useToastContext: () => ({
    error: mockToastError,
    success: mockToastSuccess,
    toast: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
    dismissAll: vi.fn(),
  }),
}));

const mockPut = vi.fn();
vi.mock("../../adapters/dexie/dexie-database", () => ({
  db: { table: () => ({ put: mockPut }) },
}));

let mockActiveProfileId: string | null = null;
vi.mock("../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: mockActiveProfileId, profile: null }),
}));

function makeTemplate(): WorkoutTemplate {
  const krd: KRD = {
    version: "1.0",
    type: "structured_workout",
    metadata: { created: "2026-04-01T00:00:00Z", sport: "cycling" },
  };
  return {
    id: "tpl-1",
    name: "Tempo Ride",
    sport: "cycling",
    krd,
    tags: [],
    createdAt: "2026-04-01T00:00:00Z",
    updatedAt: "2026-04-01T00:00:00Z",
  };
}

describe("useScheduleTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveProfileId = null;
  });

  it("should fire toast.error when confirmSchedule runs with no active profile", async () => {
    // Arrange
    mockActiveProfileId = null;
    const { result } = renderHook(() => useScheduleTemplate());
    act(() => {
      result.current.openScheduler(makeTemplate());
    });

    // Act
    await act(async () => {
      await result.current.confirmSchedule("2026-04-07");
    });

    // Assert
    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockToastError).toHaveBeenCalledWith(
      "No active profile",
      "Open the profile manager to select or create one."
    );
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("should persist a workout when confirmSchedule runs with an active profile", async () => {
    // Arrange
    mockActiveProfileId = "00000000-0000-4000-8000-0000000000a1";
    const { result } = renderHook(() => useScheduleTemplate());
    act(() => {
      result.current.openScheduler(makeTemplate());
    });

    // Act
    await act(async () => {
      await result.current.confirmSchedule("2026-04-07");
    });

    // Assert
    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockToastError).not.toHaveBeenCalled();
  });
});
