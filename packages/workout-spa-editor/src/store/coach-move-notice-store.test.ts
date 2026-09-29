import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  useCoachMoveNotice,
  useCoachMoveNoticeStore,
} from "./coach-move-notice-store";

const WEEK = "2026-10-05";
const OTHER_WEEK = "2026-10-12";
const ONE_MOVE = { coachMoves: 1, overriddenLocalMoves: 0 };
const NO_MOVES = { coachMoves: 0, overriddenLocalMoves: 0 };

const report = (moves = ONE_MOVE, week = WEEK) =>
  act(() => useCoachMoveNoticeStore.getState().report("p1", week, moves));
const dismiss = () =>
  act(() => useCoachMoveNoticeStore.getState().dismiss("p1", WEEK));

beforeEach(() => {
  useCoachMoveNoticeStore.setState({ notices: {}, dismissed: {} });
});

describe("coach-move notice store", () => {
  it("should show the moves of the synced week only", () => {
    // Arrange
    const week = renderHook(() => useCoachMoveNotice("p1", WEEK));
    const other = renderHook(() => useCoachMoveNotice("p1", OTHER_WEEK));

    // Act
    report();

    // Assert
    expect(week.result.current).toMatchObject(ONE_MOVE);
    expect(other.result.current).toBeUndefined();
  });

  it("should show nothing for a sync without moves", () => {
    // Arrange
    const { result } = renderHook(() => useCoachMoveNotice("p1", WEEK));

    // Act
    report(NO_MOVES);

    // Assert
    expect(result.current).toBeUndefined();
  });

  it("should stay dismissed until a sync brings new moves", () => {
    // Arrange
    const { result } = renderHook(() => useCoachMoveNotice("p1", WEEK));
    report();
    dismiss();

    // Act
    report(NO_MOVES);
    const afterEmptySync = result.current;
    report();

    // Assert
    expect(afterEmptySync).toBeUndefined();
    expect(result.current).toMatchObject(ONE_MOVE);
  });

  it("should show nothing without an active profile", () => {
    // Arrange
    report();

    // Act
    const { result } = renderHook(() => useCoachMoveNotice(null, WEEK));

    // Assert
    expect(result.current).toBeUndefined();
  });
});
