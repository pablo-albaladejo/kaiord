import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PushWorkoutResult } from "../application/integrations/integration-ports";
import { runPush } from "./use-garmin-bridge-action-helpers";

const executePush = vi.hoisted(() => vi.fn());

vi.mock("./garmin-bridge-operations", () => ({
  executePush,
  evaluatePingResult: vi.fn(),
}));

vi.mock("../adapters/bridge/bridge-discovery", () => ({
  bridgeDiscovery: { getExtensionId: () => "ext-1" },
}));

const pushWith = async (result: PushWorkoutResult) => {
  executePush.mockResolvedValue(result);
  const setPushing = vi.fn();
  const redetect = vi.fn(async () => {});
  const outcome = await runPush({}, setPushing, redetect);
  return { outcome, setPushing, redetect };
};

describe("runPush", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("should ask for a retry after the extension was updated", async () => {
    // Arrange
    const result: PushWorkoutResult = { status: "invalidated" };

    // Act
    const { outcome, setPushing, redetect } = await pushWith(result);

    // Assert
    expect(setPushing).toHaveBeenLastCalledWith({
      status: "error",
      reason: "updated",
    });
    expect(redetect).toHaveBeenCalled();
    expect(outcome).toEqual({ success: false, garminWorkoutId: null });
  });

  it("should carry the bridge's reason and keep its text out of the push state", async () => {
    // Arrange
    const result: PushWorkoutResult = {
      status: "error",
      reason: "not-answering",
      detail: "Push failed: 500",
      redetect: false,
    };

    // Act
    const { setPushing } = await pushWith(result);

    // Assert
    expect(setPushing).toHaveBeenLastCalledWith({
      status: "error",
      reason: "not-answering",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[failure]",
      expect.objectContaining({ message: "Push failed: 500" })
    );
  });

  it("should ask to sign in and redetect on an auth-shaped failure", async () => {
    // Arrange
    const result: PushWorkoutResult = {
      status: "error",
      reason: "sign-in",
      detail: "Unauthorized",
      redetect: true,
    };

    // Act
    const { setPushing, redetect } = await pushWith(result);

    // Assert
    expect(setPushing).toHaveBeenLastCalledWith({
      status: "error",
      reason: "sign-in",
    });
    expect(redetect).toHaveBeenCalled();
  });
});
