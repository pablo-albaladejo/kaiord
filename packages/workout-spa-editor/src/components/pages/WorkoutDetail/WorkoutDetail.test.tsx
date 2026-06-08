import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ReviewModel } from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";
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

vi.mock("./use-workout-detail-record", () => ({
  useWorkoutDetailRecord: () => ({
    record: mockRecord,
    loading: mockLoading,
  }),
}));

vi.mock("./use-workout-detail-model", () => ({
  useWorkoutDetailModel: () => mockModel,
}));

vi.mock("../../molecules/PushButton", () => ({
  PushButton: () => <button type="button">Push to Garmin</button>,
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
});
