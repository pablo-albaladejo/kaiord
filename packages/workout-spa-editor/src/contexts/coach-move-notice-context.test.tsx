import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import {
  CoachMoveNoticeProvider,
  useCoachMoveNotice,
  useCoachMoveNoticeActions,
} from "./coach-move-notice-context";

const WEEK = "2026-10-05";
const OTHER_WEEK = "2026-10-12";
const ONE_MOVE = { coachMoves: 1, overriddenLocalMoves: 0 };
const NO_MOVES = { coachMoves: 0, overriddenLocalMoves: 0 };

const wrapper = ({ children }: { children: ReactNode }) => (
  <CoachMoveNoticeProvider>{children}</CoachMoveNoticeProvider>
);

const renderNotice = (profileId: string | null = "p1") =>
  renderHook(
    () => ({
      week: useCoachMoveNotice(profileId, WEEK),
      other: useCoachMoveNotice(profileId, OTHER_WEEK),
      actions: useCoachMoveNoticeActions(),
    }),
    { wrapper }
  );

type Rendered = ReturnType<typeof renderNotice>["result"];
const report = (r: Rendered, moves = ONE_MOVE) =>
  act(() => r.current.actions.report("p1", WEEK, moves));

describe("coach-move notice", () => {
  it("should show the moves of the synced week only", () => {
    // Arrange
    const { result } = renderNotice();

    // Act
    report(result);

    // Assert
    expect(result.current.week).toMatchObject(ONE_MOVE);
    expect(result.current.other).toBeUndefined();
  });

  it("should show nothing for a sync without moves", () => {
    // Arrange
    const { result } = renderNotice();

    // Act
    report(result, NO_MOVES);

    // Assert
    expect(result.current.week).toBeUndefined();
  });

  it("should stay dismissed until a sync brings new moves", () => {
    // Arrange
    const { result } = renderNotice();
    report(result);
    act(() => result.current.actions.dismiss("p1", WEEK));

    // Act
    report(result, NO_MOVES);
    const afterEmptySync = result.current.week;
    report(result);

    // Assert
    expect(afterEmptySync).toBeUndefined();
    expect(result.current.week).toMatchObject(ONE_MOVE);
  });

  it("should show nothing without an active profile", () => {
    // Arrange
    const { result } = renderNotice(null);

    // Act
    report(result);

    // Assert
    expect(result.current.week).toBeUndefined();
  });

  it("should show nothing and ignore reports outside the provider", () => {
    // Arrange
    const { result } = renderHook(() => ({
      week: useCoachMoveNotice("p1", WEEK),
      actions: useCoachMoveNoticeActions(),
    }));

    // Act
    act(() => result.current.actions.report("p1", WEEK, ONE_MOVE));

    // Assert
    expect(result.current.week).toBeUndefined();
  });
});
