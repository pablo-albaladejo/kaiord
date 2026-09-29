import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WorkoutRecord } from "../../../types/calendar-record";
import { useGarminPlacement } from "./useGarminPlacement";

const ENTRY = { workoutScheduleId: "5000", date: "2026-10-04" };
const push = vi.fn();
const actions = {
  confirm: vi.fn(),
  dismissable: vi.fn(),
  dismiss: vi.fn(),
};

vi.mock("./useGarminPush", () => ({ useGarminPush: () => ({ push }) }));
vi.mock("./useGarminPlacementActions", () => ({
  useGarminPlacementActions: () => actions,
}));

const WORKOUT = { id: "workout-1" } as WorkoutRecord;

describe("useGarminPlacement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockResolvedValue({ kind: "duplicate-left", dates: [ENTRY.date] });
    actions.dismissable.mockResolvedValue([ENTRY]);
    actions.confirm.mockResolvedValue({ kind: "scheduled" });
  });

  it("should keep the last result and the entries the athlete may dismiss", async () => {
    // Arrange
    const { result } = renderHook(() => useGarminPlacement(WORKOUT));

    // Act
    await act(() => result.current.send());

    // Assert
    expect(result.current.result).toEqual({
      kind: "duplicate-left",
      dates: [ENTRY.date],
    });
    expect(result.current.removable).toEqual([ENTRY]);
    expect(result.current.busy).toBe(false);
  });

  it("should send anyway with the override flag", async () => {
    // Arrange
    const { result } = renderHook(() => useGarminPlacement(WORKOUT));

    // Act
    await act(() => result.current.sendAnyway());

    // Assert
    expect(push).toHaveBeenCalledWith({ sendAnyway: true });
  });

  it("should replace the result with the confirmed placement", async () => {
    // Arrange
    const { result } = renderHook(() => useGarminPlacement(WORKOUT));

    // Act
    await act(() => result.current.confirm());

    // Assert
    expect(result.current.result).toEqual({ kind: "scheduled" });
  });

  it("should refresh the dismissable entries after a dismissal", async () => {
    // Arrange
    const { result } = renderHook(() => useGarminPlacement(WORKOUT));
    await act(() => result.current.send());
    actions.dismissable.mockResolvedValue([]);

    // Act
    await act(() => result.current.dismiss(ENTRY.workoutScheduleId));

    // Assert
    expect(actions.dismiss).toHaveBeenCalledWith(ENTRY.workoutScheduleId);
    expect(result.current.removable).toEqual([]);
  });

  it("should clear the dismissable entries when nothing was pushed", async () => {
    // Arrange
    push.mockResolvedValue(undefined);
    const { result } = renderHook(() => useGarminPlacement(WORKOUT));

    // Act
    await act(() => result.current.send());

    // Assert
    expect(result.current.result).toBeUndefined();
    expect(result.current.removable).toEqual([]);
  });
});
