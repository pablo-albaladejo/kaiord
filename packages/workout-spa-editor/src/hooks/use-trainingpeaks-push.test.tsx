import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../types/calendar-record";
import { useTrainingPeaksPush } from "./use-trainingpeaks-push";

const mocks = vi.hoisted(() => ({
  getExtensionId: vi.fn<() => string | undefined>(),
  checkSession: vi.fn(),
  executePush: vi.fn(),
  convert: vi.fn(),
  event: vi.fn(),
}));

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: mocks.getExtensionId },
}));

vi.mock("../adapters/trainingpeaks/trainingpeaks-transport", () => ({
  checkTrainingPeaksSession: mocks.checkSession,
}));

vi.mock("../application/export/execute-workout-push", () => ({
  executeWorkoutPush: mocks.executePush,
}));

vi.mock("@kaiord/trainingpeaks", () => ({
  krdToTrainingPeaksWorkout: mocks.convert,
}));

vi.mock("../contexts", () => ({
  useAnalytics: () => ({ event: mocks.event }),
}));

vi.mock("./use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ profile: { sportZones: [] } }),
}));

vi.mock("./trainingpeaks-push-fn", () => ({
  buildTrainingPeaksPushFn: () => vi.fn(),
  ledgerRepo: {},
  policyRepo: {},
  TRAININGPEAKS_BRIDGE_ID: "trainingpeaks-bridge",
}));

const EXTENSION_ID = "tp-extension";
const ATHLETE_ID = 4242;
const WORKOUT_ID = "987654";

const RECORD = {
  id: "w1",
  profileId: "p1",
  date: "2026-09-08",
  sport: "cycling",
  krd: { type: "workout" },
} as unknown as WorkoutRecord;

describe("useTrainingPeaksPush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getExtensionId.mockReturnValue(EXTENSION_ID);
    mocks.checkSession.mockResolvedValue({
      authenticated: true,
      athleteId: ATHLETE_ID,
    });
    mocks.convert.mockReturnValue({ title: "x" });
    mocks.executePush.mockResolvedValue({ externalId: WORKOUT_ID });
  });

  it("should refuse a record carrying no KRD", async () => {
    // Arrange
    const noKrd = { ...RECORD, krd: undefined } as unknown as WorkoutRecord;

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(noKrd));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: false, message: "Workout has no KRD" });
    expect(mocks.executePush).not.toHaveBeenCalled();
  });

  it("should refuse when the bridge extension was never discovered", async () => {
    // Arrange
    mocks.getExtensionId.mockReturnValue(undefined);

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({
      ok: false,
      message: "TrainingPeaks bridge is not installed",
    });
    expect(mocks.checkSession).not.toHaveBeenCalled();
  });

  it("should ask the athlete to sign in when the session is not authenticated", async () => {
    // Arrange
    mocks.checkSession.mockResolvedValue({ authenticated: false });

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({
      ok: false,
      message: "Sign in to TrainingPeaks and retry",
    });
    expect(mocks.executePush).not.toHaveBeenCalled();
  });

  it("should refuse an authenticated session that names no athlete", async () => {
    // Arrange
    mocks.checkSession.mockResolvedValue({
      authenticated: true,
      athleteId: undefined,
    });

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({
      ok: false,
      message: "Sign in to TrainingPeaks and retry",
    });
  });

  it("should push and return the created workout id", async () => {
    // Arrange
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));

    // Act
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: true, workoutId: WORKOUT_ID });
    expect(mocks.event).toHaveBeenCalledWith("trainingpeaks-workout-pushed", {
      result: "success",
    });
  });

  it("should use the live session's athlete id, not one from storage", async () => {
    // Arrange
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));

    // Act
    await result.current.push();

    // Assert
    expect(mocks.convert).toHaveBeenCalledWith(
      RECORD.krd,
      expect.objectContaining({ athleteId: ATHLETE_ID })
    );
  });

  it("should report success without an id when another caller owned the race", async () => {
    // Arrange
    mocks.executePush.mockResolvedValue({ externalId: undefined });

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: true, workoutId: undefined });
  });

  it("should surface the thrown message and record the failure", async () => {
    // Arrange
    mocks.executePush.mockRejectedValue(
      new Error("402 beyond the account planning horizon")
    );

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({
      ok: false,
      message: "402 beyond the account planning horizon",
    });
    expect(mocks.event).toHaveBeenCalledWith("trainingpeaks-workout-pushed", {
      result: "failure",
    });
  });

  it("should fall back to a generic message when a non-Error is thrown", async () => {
    // Arrange
    mocks.executePush.mockRejectedValue("not an Error");

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({
      ok: false,
      message: "TrainingPeaks push failed",
    });
  });
});
