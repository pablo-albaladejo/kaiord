import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { GarminBridgeState } from "../../../contexts";

const mockPushWorkout = vi.fn();
const mockSetPushing = vi.fn();

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
    const { result } = renderHook(() => useGarminPush());

    expect(result.current.push).toBeTypeOf("function");
  });

  it("should export workout to GCN and push it", async () => {
    const gcn = { gcnWorkout: "data" };
    mockExportGcnWorkout.mockResolvedValue(gcn);
    const { result } = renderHook(() => useGarminPush());

    await act(async () => {
      await result.current.push();
    });

    expect(mockExportGcnWorkout).toHaveBeenCalledWith({
      name: "test workout",
    });
    expect(mockPushWorkout).toHaveBeenCalledWith(gcn);
  });

  it("should do nothing when currentWorkout is null", async () => {
    workoutState.currentWorkout = null;
    const { result } = renderHook(() => useGarminPush());

    await act(async () => {
      await result.current.push();
    });

    expect(mockExportGcnWorkout).not.toHaveBeenCalled();
    expect(mockPushWorkout).not.toHaveBeenCalled();
  });

  it("should do nothing when session is not active", async () => {
    garminState.sessionActive = false;
    const { result } = renderHook(() => useGarminPush());

    await act(async () => {
      await result.current.push();
    });

    expect(mockExportGcnWorkout).not.toHaveBeenCalled();
    expect(mockPushWorkout).not.toHaveBeenCalled();
  });

  it("should set error when exportGcnWorkout throws an Error", async () => {
    mockExportGcnWorkout.mockRejectedValue(new Error("Conversion failed"));
    const { result } = renderHook(() => useGarminPush());

    await act(async () => {
      await result.current.push();
    });

    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Conversion failed",
    });
  });

  it("should set fallback error message when non-Error is thrown", async () => {
    mockExportGcnWorkout.mockRejectedValue("string error");
    const { result } = renderHook(() => useGarminPush());

    await act(async () => {
      await result.current.push();
    });

    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Conversion failed",
    });
  });

  it("should set error when pushWorkout throws", async () => {
    mockPushWorkout.mockRejectedValue(new Error("Push rejected"));
    const { result } = renderHook(() => useGarminPush());

    await act(async () => {
      await result.current.push();
    });

    expect(mockSetPushing).toHaveBeenCalledWith({
      status: "error",
      message: "Push rejected",
    });
  });
});
