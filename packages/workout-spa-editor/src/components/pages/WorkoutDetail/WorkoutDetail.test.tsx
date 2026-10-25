import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewModel } from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { ExportLedgerEntry } from "../../../types/export-ledger";
import WorkoutDetail from "./WorkoutDetail";

let mockRecord: WorkoutRecord | undefined;
let mockLoading = false;
let mockModel: ReviewModel | null = null;
let mockSearch = "";
const navigateMock = vi.fn();

vi.mock("wouter", () => ({
  useLocation: () => ["/workout/view/w1", navigateMock],
  useSearch: () => mockSearch,
}));

const PLACEMENT_ROW = { kaiordRecordId: "w1" } as unknown as ExportLedgerEntry;
const pushButtonProps = vi.fn();

vi.mock("./use-workout-detail-record", () => ({
  useWorkoutDetailRecord: () => ({
    record: mockRecord,
    placementRow: PLACEMENT_ROW,
    loading: mockLoading,
  }),
}));

vi.mock("./use-delete-workout-with-undo", () => ({
  useDeleteWorkoutWithUndo: () => vi.fn(),
}));

vi.mock("./use-move-workout", () => ({
  useMoveWorkout: () => vi.fn(),
}));

vi.mock("./use-workout-detail-model", () => ({
  useWorkoutDetailModel: () => mockModel,
}));

vi.mock("../../molecules/PushButton", () => ({
  PushButton: (props: unknown) => {
    pushButtonProps(props);
    return <button type="button">Send to Garmin</button>;
  },
}));

const ZONE_COUNT = 5;
const ZONE_STEP = 10;
const ZONE_DIST: number[] = Array.from(
  { length: ZONE_COUNT },
  (_, i) => ZONE_STEP * (ZONE_COUNT - 1 - i)
);

const MODEL: ReviewModel = {
  title: "Threshold Builder",
  duration: "1:00:00",
  tss: 72,
  load: "High",
  dist: ZONE_DIST,
  steps: [{ kind: "Warmup", detail: "10 min easy", zone: 1, dur: "10:00" }],
};

const RECORD = {
  id: "w1",
  sport: "cycling",
  tags: ["Endurance"],
  raw: { description: "Threshold Builder" },
  krd: {},
} as unknown as WorkoutRecord;

describe("WorkoutDetail", () => {
  beforeEach(() => {
    mockRecord = RECORD;
    mockLoading = false;
    mockModel = MODEL;
    mockSearch = "";
    navigateMock.mockClear();
  });

  it("should render the route heading and title", () => {
    // Arrange

    // Act

    render(<WorkoutDetail id="w1" />);

    // Assert

    expect(screen.getByText("Threshold Builder")).toBeInTheDocument();
    expect(document.querySelector("[data-route-heading]")).toBeInTheDocument();
  });

  it("should widen the sheet past the phone column and end it at the actions", () => {
    // Arrange
    // `min-h-screen` plus a flex-1 spacer pushed the actions a viewport below
    // the content, and `max-w-md` kept a 448px column on every desktop.

    // Act
    render(<WorkoutDetail id="w1" />);
    const sheet = screen.getByTestId("workout-detail");

    // Assert
    expect(sheet).toHaveClass("max-w-md", "md:max-w-3xl");
    expect(sheet).not.toHaveClass("min-h-screen");
    expect(sheet.lastElementChild).toBe(
      screen.getByTestId("workout-detail-footer")
    );
    expect(sheet.querySelector(":scope > .flex-1")).toBeNull();
  });

  it("should show the not-found state when no record exists", () => {
    // Arrange

    mockRecord = undefined;

    // Act

    render(<WorkoutDetail id="missing" />);

    // Assert

    expect(screen.getByText("Workout not found")).toBeInTheDocument();
  });

  it("should navigate to the editor with a detail origin when Edit is clicked", () => {
    // Arrange

    render(<WorkoutDetail id="w1" />);

    // Act

    screen.getByText("Edit").click();

    // Assert

    expect(navigateMock).toHaveBeenCalledWith("/workout/w1?from=detail");
  });

  it("should navigate Back to /calendar by default when no origin is present", () => {
    // Arrange

    render(<WorkoutDetail id="w1" />);

    // Act

    screen.getByTestId("workout-detail-back").click();

    // Assert

    expect(navigateMock).toHaveBeenCalledWith("/calendar");
  });

  it("should navigate Back to /daily when the legacy ?from=today is present", () => {
    // Arrange

    mockSearch = "from=today";

    // Act

    render(<WorkoutDetail id="w1" />);
    screen.getByTestId("workout-detail-back").click();

    // Assert

    expect(navigateMock).toHaveBeenCalledWith("/daily");
  });

  it("should hand the workout's ledger row to the send control", () => {
    // Arrange

    // Act
    render(<WorkoutDetail id="w1" />);

    // Assert
    expect(pushButtonProps).toHaveBeenCalledWith(
      expect.objectContaining({ workout: RECORD, placementRow: PLACEMENT_ROW })
    );
  });

  it("should name the coach's day when the athlete moved the workout (AC-17)", () => {
    // Arrange
    mockRecord = { ...RECORD, date: "2026-10-08", coachDate: "2026-10-06" };

    // Act
    render(<WorkoutDetail id="w1" />);

    // Assert
    expect(
      screen.getByRole("img", { name: "Moved from Tue, Oct 6" })
    ).toBeVisible();
  });
});
