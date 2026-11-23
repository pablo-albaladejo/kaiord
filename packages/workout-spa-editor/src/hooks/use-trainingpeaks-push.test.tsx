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
  ledgerRepo: { findByNaturalKey: async () => undefined },
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
    expect(outcome).toEqual({ ok: false, reason: "no-steps" });
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
      reason: "install",
    });
    expect(mocks.checkSession).not.toHaveBeenCalled();
  });

  it("should ask the athlete to sign in only when TrainingPeaks refused the sign-in", async () => {
    // Arrange
    mocks.checkSession.mockResolvedValue({
      authenticated: false,
      needsReauth: true,
    });

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: false, reason: "sign-in" });
    expect(mocks.executePush).not.toHaveBeenCalled();
  });

  it.each([
    {
      scenario: "an older extension omits why it is not authenticated",
      session: { authenticated: false },
    },
    {
      scenario: "the session is authenticated but names no athlete",
      session: { authenticated: true, athleteId: undefined },
    },
  ])(
    "should not state a cause it did not verify when $scenario",
    async ({ session }) => {
      // Arrange
      mocks.checkSession.mockResolvedValue(session);

      // Act
      const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
      const outcome = await result.current.push();

      // Assert
      expect(outcome).toEqual({ ok: false, reason: "not-answering" });
      expect(mocks.executePush).not.toHaveBeenCalled();
    }
  );

  it("should not ask to sign in when TrainingPeaks failed to answer the session check", async () => {
    // Arrange
    mocks.checkSession.mockResolvedValue({
      authenticated: false,
      needsReauth: false,
    });

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: false, reason: "not-answering" });
    expect(mocks.executePush).not.toHaveBeenCalled();
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

  it("should place the workout on the day it has in Kaiord", async () => {
    // Arrange
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));

    // Act
    await result.current.push();

    // Assert
    expect(mocks.convert).toHaveBeenCalledWith(
      RECORD.krd,
      expect.objectContaining({ workoutDay: "2026-09-08" })
    );
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

  it("should say TrainingPeaks is not answering, never the thrown text, and record the failure", async () => {
    // Arrange
    mocks.executePush.mockRejectedValue(new Error("Workout push failed: 500"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: false, reason: "not-answering" });
    expect(mocks.event).toHaveBeenCalledWith("trainingpeaks-workout-pushed", {
      result: "failure",
    });
  });

  it("should ask to sign in when the bridge says the Session is gone", async () => {
    // Arrange
    mocks.executePush.mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { needsReauth: true })
    );
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: false, reason: "sign-in" });
  });

  it("should keep the thrown text in the console only", async () => {
    // Arrange
    mocks.executePush.mockRejectedValue(new Error("Workout push failed: 500"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    await result.current.push();

    // Assert
    expect(spy).toHaveBeenCalledWith(
      "[failure]",
      expect.objectContaining({ message: "Workout push failed: 500" })
    );
  });

  it("should name the planning horizon when TrainingPeaks refuses the day with a 402", async () => {
    // Arrange
    mocks.executePush.mockRejectedValue(
      Object.assign(new Error("TrainingPeaks refused the date"), {
        status: 402,
      })
    );

    // Act
    const { result } = renderHook(() => useTrainingPeaksPush(RECORD));
    const outcome = await result.current.push();

    // Assert
    expect(outcome).toEqual({ ok: false, reason: "horizon" });
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
      reason: "not-answering",
    });
  });
});
