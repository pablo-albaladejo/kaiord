import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCoachMoveNoticeStore } from "../../store/coach-move-notice-store";
import { CalendarHeader } from "./CalendarHeader";

vi.mock("../../hooks/use-active-profile-live", () => ({
  useActiveProfileLive: () => ({ id: "p1" }),
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

beforeEach(() => {
  useCoachMoveNoticeStore.setState({ notices: {}, dismissed: {} });
});

describe("CalendarHeader coach-move notice", () => {
  it("should show the synced week's coach moves until dismissed", async () => {
    // Arrange
    render(<CalendarHeader state={state} coaching={coaching} />);
    act(() =>
      useCoachMoveNoticeStore
        .getState()
        .report("p1", WEEK, { coachMoves: 1, overriddenLocalMoves: 0 })
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
