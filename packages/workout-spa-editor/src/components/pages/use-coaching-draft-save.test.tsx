/**
 * useCoachingDraftSave — persists the current store KRD via
 * `persistCoachingWorkout` and navigates to the real workout URL on success;
 * surfaces an error toast on failure. All collaborators are mocked.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { CoachingActivityForConvert } from "../../application/coaching/convert-coaching-activity-manual-types";
import type { KRD } from "../../types/krd";
import { useCoachingDraftSave } from "./use-coaching-draft-save";

const mockNavigate = vi.fn();
vi.mock("wouter", () => ({
  useLocation: () => ["/workout/new", mockNavigate],
}));

const mockPersist = vi.fn();
vi.mock("../../application/coaching/persist-coaching-workout", () => ({
  persistCoachingWorkout: (...args: unknown[]) => mockPersist(...args),
}));

let mockCurrentWorkout: KRD | null = null;
vi.mock("../../store/selectors/workout-selectors", () => ({
  useCurrentWorkout: () => mockCurrentWorkout,
}));

vi.mock("../../contexts/persistence-context", () => ({
  usePersistence: () => ({ coaching: {}, workouts: {}, sessionMatch: {} }),
}));

vi.mock("../../contexts/analytics-context", () => ({
  useAnalytics: () => ({ pageView: vi.fn(), event: vi.fn() }),
}));

const mockToastError = vi.fn();
vi.mock("../../contexts/ToastContext", () => ({
  useToastContext: () => ({ error: mockToastError }),
}));

const WORKOUT_ID = "w-123";

const fakeKrd = (): KRD => ({
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-04-01T00:00:00Z", sport: "cycling" },
});

const activity = {} as CoachingActivityForConvert;

afterEach(() => {
  vi.clearAllMocks();
  mockCurrentWorkout = null;
});

describe("useCoachingDraftSave", () => {
  it("should report canSave false when there is no current workout", () => {
    // Arrange
    mockCurrentWorkout = null;

    // Act
    const { result } = renderHook(() => useCoachingDraftSave(activity));

    // Assert
    expect(result.current.canSave).toBe(false);
  });

  it("should persist the workout and navigate on a successful save", async () => {
    // Arrange
    mockCurrentWorkout = fakeKrd();
    mockPersist.mockResolvedValue({ workoutId: WORKOUT_ID });
    const { result } = renderHook(() => useCoachingDraftSave(activity));

    // Act
    await act(async () => {
      await result.current.save();
    });

    // Assert
    expect(mockPersist).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith(`/workout/${WORKOUT_ID}`, {
      replace: true,
    });
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("should surface an error toast when persistence fails", async () => {
    // Arrange
    mockCurrentWorkout = fakeKrd();
    mockPersist.mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useCoachingDraftSave(activity));

    // Act
    await act(async () => {
      await result.current.save();
    });

    // Assert
    expect(mockToastError).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
