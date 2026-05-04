import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CalendarHeader } from "./CalendarHeader";

vi.mock("./CalendarEmptyBanners", () => ({
  CalendarEmptyBanners: () => <div data-testid="mock-empty-banners" />,
}));

vi.mock("../organisms/BatchCostConfirmation", () => ({
  BatchCostConfirmation: ({ open }: { open: boolean }) => (
    <div data-testid="mock-cost-confirmation" data-open={open} />
  ),
}));

vi.mock("../molecules/WorkoutCard/WeekNavigation", () => ({
  WeekNavigation: ({ weekId }: { weekId: string }) => (
    <div data-testid="mock-week-nav">{weekId}</div>
  ),
}));

vi.mock("../molecules/CoachingCard/CoachingSyncButton", () => ({
  CoachingSyncButton: ({
    label,
    onSync,
  }: {
    label: string;
    onSync: () => void;
  }) => (
    <button data-testid={`mock-sync-${label}`} onClick={onSync}>
      {label}
    </button>
  ),
}));

const baseState = {
  data: {
    weekId: "2026-W16",
    rawCount: 2,
    days: ["2026-04-13"],
  },
  batch: {
    message: null,
    dismissMessage: vi.fn(),
    isProcessing: false,
    progress: null,
    requestStart: vi.fn(),
    cancel: vi.fn(),
    pending: null,
    confirmStart: vi.fn(),
    cancelRequest: vi.fn(),
  },
  hasAnyWorkouts: true,
  hasWeekWorkouts: true,
  hasReadyWorkouts: false,
  hasAiProvider: true,
  extensionInstalled: true,
  latestWorkout: null,
  handleGoToLatest: vi.fn(),
  // biome-ignore — partial type for test
} as unknown as Parameters<typeof CalendarHeader>[0]["state"];

describe("CalendarHeader", () => {
  it("should render empty banners, cost confirmation, and week navigation", () => {
    // Arrange

    // Act

    render(
      <CalendarHeader
        state={baseState}
        coaching={
          {
            syncSources: [],
          } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"]
        }
      />
    );

    // Assert

    expect(screen.getByTestId("mock-empty-banners")).toBeInTheDocument();
    expect(screen.getByTestId("mock-cost-confirmation")).toBeInTheDocument();
    expect(screen.getByTestId("mock-week-nav")).toHaveTextContent("2026-W16");
  });

  it("should render a sync button per LINKED coaching source (gates on linked)", () => {
    // Arrange

    const coaching = {
      syncSources: [
        {
          id: "s1",
          linked: true,
          connected: true,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Garmin",
        },
        {
          id: "s2",
          linked: true,
          connected: false,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Train2Go",
        },
        {
          id: "s3",
          linked: false,
          connected: false,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Unlinked",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];

    // Act

    render(<CalendarHeader state={baseState} coaching={coaching} />);

    // Assert

    expect(screen.getByTestId("mock-sync-Garmin")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sync-Train2Go")).toBeInTheDocument();
    // The unlinked source must NOT render a Sync button.
    expect(screen.queryByTestId("mock-sync-Unlinked")).not.toBeInTheDocument();
  });

  it("should bypass staleness gate via Manual Sync button", async () => {
    // The staleness gate (lastSyncedAt < 10 minutes blocks auto-sync) lives
    // inside useCoachingActivities, NOT inside CalendarHeader. The CalendarHeader
    // wires the Sync button directly to src.sync(weekStart) — clicking it always
    // fires sync, regardless of when the last sync ran.
    // Arrange

    const sync = vi.fn();
    const weekStart = "2026-04-13";
    const stateAtWeek = {
      ...baseState,
      data: { ...baseState.data, days: [weekStart] },
    } as unknown as Parameters<typeof CalendarHeader>[0]["state"];
    const coaching = {
      syncSources: [
        {
          id: "train2go",
          linked: true,
          connected: true,
          loading: false,
          error: null,
          sync,
          connect: vi.fn(),
          label: "Train2Go",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];
    const user = userEvent.setup();
    render(<CalendarHeader state={stateAtWeek} coaching={coaching} />);

    // Act

    await user.click(screen.getByTestId("mock-sync-Train2Go"));

    // Assert

    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith(weekStart);
  });

  it("should hide the Sync button when active profile has no linked accounts", () => {
    // Models switching from a Train2Go-linked profile to one with no linked
    // accounts via two distinct mounts (D4 in design.md): avoids relying on
    // useLiveQuery / useActiveProfile flush ordering on rerender.
    // Arrange

    const linkedCoaching = {
      syncSources: [
        {
          id: "train2go",
          linked: true,
          connected: true,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Train2Go",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];

    // Act

    const { unmount } = render(
      <CalendarHeader state={baseState} coaching={linkedCoaching} />
    );

    // Assert

    expect(screen.getByTestId("mock-sync-Train2Go")).toBeInTheDocument();

    unmount();

    const unlinkedCoaching = {
      syncSources: [
        {
          id: "train2go",
          linked: false,
          connected: false,
          loading: false,
          error: null,
          sync: vi.fn(),
          connect: vi.fn(),
          label: "Train2Go",
        },
      ],
    } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"];
    render(<CalendarHeader state={baseState} coaching={unlinkedCoaching} />);

    expect(screen.queryByTestId("mock-sync-Train2Go")).not.toBeInTheDocument();
  });

  it("should pass batch.pending presence to the cost confirmation's open prop", () => {
    // Arrange

    const stateWithPending = {
      ...baseState,
      batch: {
        ...baseState.batch,
        pending: {
          provider: { type: "anthropic" },
          workouts: [],
        },
      },
    } as unknown as Parameters<typeof CalendarHeader>[0]["state"];

    // Act

    render(
      <CalendarHeader
        state={stateWithPending}
        coaching={
          {
            syncSources: [],
          } as unknown as Parameters<typeof CalendarHeader>[0]["coaching"]
        }
      />
    );

    // Assert

    expect(screen.getByTestId("mock-cost-confirmation").dataset.open).toBe(
      "true"
    );
  });
});
