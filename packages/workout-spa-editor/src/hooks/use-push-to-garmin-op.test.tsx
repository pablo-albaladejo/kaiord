import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePushToGarminOp } from "./use-push-to-garmin-op";

const toast = { success: vi.fn(), error: vi.fn() };
const doPush = vi.fn();

vi.mock("../contexts", () => ({
  useAnalytics: () => ({ event: vi.fn(), pageView: vi.fn() }),
  useGarminBridge: () => ({ pushWorkout: vi.fn(), features: {} }),
}));
vi.mock("../contexts/persistence-context", () => ({
  usePersistence: () => ({}),
}));
vi.mock("../contexts/ToastContext", () => ({
  useToastContext: () => toast,
}));
vi.mock("./garmin-placement-deps", () => ({
  buildPlacementDeps: () => ({}),
}));
vi.mock("./chat/do-push-to-garmin", () => ({
  doPushToGarmin: (...args: unknown[]) => doPush(...args),
}));

const runPush = (profileId: string | null = "p1") => {
  const { result } = renderHook(() => usePushToGarminOp(profileId));
  return result.current({ workoutId: "w1" });
};

describe("usePushToGarminOp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should toast that the workout was sent to Garmin Connect", async () => {
    // Arrange
    doPush.mockResolvedValueOnce({ workoutId: "w1", garminPushId: "9" });

    // Act
    await runPush();

    // Assert
    expect(toast.success).toHaveBeenCalledWith(
      "Workout sent to Garmin Connect"
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("should toast a failure when the push returns an error code", async () => {
    // Arrange
    doPush.mockResolvedValueOnce({ error: "push_failed" });

    // Act
    const output = await runPush();

    // Assert
    expect(output).toEqual({ error: "push_failed" });
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't send the workout to Garmin Connect"
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("should toast a failure and rethrow without an active profile", async () => {
    // Arrange
    const push = runPush(null);

    // Act
    const outcome = push.catch((error: unknown) => error);

    // Assert
    expect(await outcome).toBeInstanceOf(Error);
    expect(doPush).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
