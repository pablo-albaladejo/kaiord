import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GarminBridgeState } from "../../../contexts";

const mockPushWorkout = vi.fn();
const mockSetPushing = vi.fn();
const mockAnalyticsEvent = vi.fn();

const garminState: Pick<
  GarminBridgeState,
  "pushWorkout" | "setPushing" | "sessionActive"
> = {
  pushWorkout: mockPushWorkout,
  setPushing: mockSetPushing,
  sessionActive: true,
};

vi.mock("../../../contexts", () => ({
  useGarminBridge: vi.fn(() => ({ ...garminState })),
  useAnalytics: vi.fn(() => ({ event: mockAnalyticsEvent, pageView: vi.fn() })),
}));

const workoutState: { currentWorkout: unknown } = {
  currentWorkout: { name: "test workout" },
};

vi.mock("../../../store/workout-store-selectors", () => ({
  useCurrentWorkout: vi.fn(() => workoutState.currentWorkout),
}));

const mockExportGcnWorkout = vi.fn();

vi.mock("../../../utils/export-workout-formats", () => ({
  exportGcnWorkout: (...args: unknown[]) =>
    mockExportGcnWorkout(...args) as unknown,
}));

import { useGarminPush } from "./useGarminPush";

describe("useGarminPush", () => {
  beforeEach(() => {
    garminState.sessionActive = true;
    workoutState.currentWorkout = { name: "test workout" };
    mockPushWorkout.mockResolvedValue(undefined);
    mockExportGcnWorkout.mockResolvedValue({ gcnWorkout: "data" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return a push function", () => {
    // Arrange

    // Act

    const { result } = renderHook(() => useGarminPush());

    // Assert

    expect(result.current.push).toBeTypeOf("function");
  });

  it("should export workout to GCN and push it", async () => {
    // Arrange

    const gcn = { gcnWorkout: "data" };
    mockExportGcnWorkout.mockResolvedValue(gcn);
    const { result } = renderHook(() => useGarminPush());

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    expect(mockExportGcnWorkout).toHaveBeenCalledWith({
      name: "test workout",
    });
    expect(mockPushWorkout).toHaveBeenCalledWith(gcn);
  });

  it("should do nothing when currentWorkout is null", async () => {
    // Arrange

    workoutState.currentWorkout = null;
    const { result } = renderHook(() => useGarminPush());

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    expect(mockExportGcnWorkout).not.toHaveBeenCalled();
    expect(mockPushWorkout).not.toHaveBeenCalled();
  });

  it("should do nothing when session is not active", async () => {
    // Arrange

    garminState.sessionActive = false;
    const { result } = renderHook(() => useGarminPush());

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    expect(mockExportGcnWorkout).not.toHaveBeenCalled();
    expect(mockPushWorkout).not.toHaveBeenCalled();
  });

  it("should set error when exportGcnWorkout throws an Error", async () => {
    // Arrange

    mockExportGcnWorkout.mockRejectedValue(new Error("Conversion failed"));
    const { result } = renderHook(() => useGarminPush());

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Conversion failed",
    });
  });

  it("should set fallback error message when non-Error is thrown", async () => {
    // Arrange

    mockExportGcnWorkout.mockRejectedValue("string error");
    const { result } = renderHook(() => useGarminPush());

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Conversion failed",
    });
  });

  it("should set error when pushWorkout throws", async () => {
    // Arrange

    mockPushWorkout.mockRejectedValue(new Error("Push rejected"));
    const { result } = renderHook(() => useGarminPush());

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Push rejected",
    });
  });

  it("should fire garmin-synced success event after successful push", async () => {
    // Arrange
    // Arrange

    mockPushWorkout.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGarminPush());

    // Act

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    // Assert

    expect(mockAnalyticsEvent).toHaveBeenCalledWith("garmin-synced", {
      result: "success",
    });
  });

  it("should fire garmin-synced failure event when push throws", async () => {
    // Arrange
    // Arrange

    mockPushWorkout.mockRejectedValue(new Error("Push failed"));
    const { result } = renderHook(() => useGarminPush());

    // Act

    // Act

    await act(async () => {
      await result.current.push();
    });

    // Assert

    // Assert

    expect(mockAnalyticsEvent).toHaveBeenCalledWith("garmin-synced", {
      result: "failure",
    });
  });
});
