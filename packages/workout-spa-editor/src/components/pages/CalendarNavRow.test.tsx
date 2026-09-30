import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CoachingSyncState } from "../../hooks/use-coaching-activities";
import { CalendarNavRow } from "./CalendarNavRow";

vi.mock("../molecules/WorkoutCard/WeekNavigation", () => ({
  WeekNavigation: () => null,
}));
vi.mock("../molecules/CreateWorkoutCta/CreateWorkoutCta", () => ({
  CreateWorkoutCta: () => null,
}));

const DAY = "2026-10-05";

const source = (over: Partial<CoachingSyncState>): CoachingSyncState => ({
  id: "train2go",
  label: "Train2Go",
  linked: false,
  connected: true,
  loading: false,
  error: null,
  lastSyncedAt: undefined,
  sync: vi.fn(async () => undefined),
  connect: vi.fn(async () => undefined),
  ...over,
});

const renderRow = (src: CoachingSyncState) =>
  render(
    <CalendarNavRow
      weekId="2026-W41"
      days={[DAY]}
      coaching={
        { syncSources: [src] } as unknown as Parameters<
          typeof CalendarNavRow
        >[0]["coaching"]
      }
    />
  );

describe("CalendarNavRow coaching sources", () => {
  it("should offer to connect an installed source this profile has not linked", async () => {
    // Arrange
    const src = source({ linked: false, connected: true });
    renderRow(src);

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: "Connect to Train2Go" })
    );

    // Assert
    expect(src.connect).toHaveBeenCalledOnce();
    expect(src.sync).not.toHaveBeenCalled();
  });

  it("should show the sync control for a linked source with a live session", async () => {
    // Arrange
    const src = source({ linked: true, connected: true });
    renderRow(src);

    // Act
    await userEvent.click(screen.getByRole("button", { name: /Sync/ }));

    // Assert
    expect(src.sync).toHaveBeenCalledExactlyOnceWith(DAY);
    expect(
      screen.queryByRole("button", { name: "Connect to Train2Go" })
    ).not.toBeInTheDocument();
  });
});
