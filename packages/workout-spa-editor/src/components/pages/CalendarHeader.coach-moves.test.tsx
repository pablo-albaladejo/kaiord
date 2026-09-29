import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  CoachMoveNoticeProvider,
  useCoachMoveNoticeActions,
} from "../../contexts/coach-move-notice-context";
import { CalendarHeader } from "./CalendarHeader";

vi.mock("../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1" }),
}));
vi.mock("./use-calendar-send-week", () => ({
  useCalendarSendWeek: () => ({ offered: false, state: { phase: "idle" } }),
}));
vi.mock("./CalendarEmptyBanners", () => ({ CalendarEmptyBanners: () => null }));
vi.mock("../organisms/BatchCostConfirmation", () => ({
  BatchCostConfirmation: () => null,
}));
vi.mock("./CalendarNavRow", () => ({ CalendarNavRow: () => null }));

const WEEK = "2026-10-05";
const state = {
  data: { weekId: "2026-W41", weekStart: WEEK, days: [WEEK] },
  batch: { pending: null },
  latestWorkout: null,
} as unknown as Parameters<typeof CalendarHeader>[0]["state"];
const coaching = { syncSources: [] } as unknown as Parameters<
  typeof CalendarHeader
>[0]["coaching"];

/** Hands the test the provider's actions, as a sync would use them. */
const actions = {
  report: (() => {}) as ReturnType<typeof useCoachMoveNoticeActions>["report"],
};
const Sync = () => {
  actions.report = useCoachMoveNoticeActions().report;
  return null;
};

describe("CalendarHeader coach-move notice", () => {
  it("should show the synced week's coach moves until dismissed", async () => {
    // Arrange
    render(
      <CoachMoveNoticeProvider>
        <CalendarHeader state={state} coaching={coaching} />
        <Sync />
      </CoachMoveNoticeProvider>
    );
    act(() =>
      actions.report("p1", WEEK, { coachMoves: 1, overriddenLocalMoves: 0 })
    );
    const status = screen.getByRole("status");

    // Act
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    // Assert
    expect(status).toHaveTextContent(
      "1 session moved to the coach's new date."
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
