import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  LONG_STEP_SECONDS,
  PCT_Z1,
  PCT_Z2,
  PCT_Z4,
  PCT_Z5,
  SHORT_STEP_SECONDS,
  structuredKrd,
  structuredWorkout,
} from "../../../test-utils/zone-profile-fixtures";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { KRD } from "../../../types/krd";
import { CoachingDialogZoneProfile } from "./coaching-dialog-zone-profile";

const REPEATS = 3;
const INTERVAL_SECONDS = 60;
const PROFILE_TESTID = "coaching-dialog-zone-profile";

const makeWorkout = (krd: KRD | null): WorkoutRecord =>
  ({
    id: "w1",
    sport: "cycling",
    state: krd ? "structured" : "raw",
    krd,
  }) as WorkoutRecord;

const bars = () =>
  Array.from(screen.getByTestId("zone-profile-bar").children) as HTMLElement[];

/** Warm-up, a 3× (1 min Z5 / 1 min Z1) repeat block, cool-down. */
const repeatKrd = (): KRD => {
  const warm = structuredWorkout([
    { percentFtp: PCT_Z2, seconds: SHORT_STEP_SECONDS },
  ]);
  const inner = structuredWorkout([
    { percentFtp: PCT_Z5, seconds: INTERVAL_SECONDS },
    { percentFtp: PCT_Z1, seconds: INTERVAL_SECONDS },
  ]).steps;
  const workout = {
    ...warm,
    steps: [...warm.steps, { repeatCount: REPEATS, steps: inner }],
  };
  return {
    version: "1.0.0",
    type: "workout",
    metadata: { source: "fixture" },
    extensions: { structured_workout: workout },
  } as unknown as KRD;
};

describe("CoachingDialogZoneProfile", () => {
  it("should size each bar in proportion to its step's duration", () => {
    // Arrange
    const workout = makeWorkout(
      structuredKrd([
        { percentFtp: PCT_Z2, seconds: SHORT_STEP_SECONDS },
        { percentFtp: PCT_Z4, seconds: LONG_STEP_SECONDS },
        { percentFtp: PCT_Z1, seconds: SHORT_STEP_SECONDS },
      ])
    );

    // Act
    render(<CoachingDialogZoneProfile workout={workout} />);

    // Assert
    const grows = bars().map((bar) => Number(bar.style.flexGrow));
    expect(grows).toEqual([
      SHORT_STEP_SECONDS,
      LONG_STEP_SECONDS,
      SHORT_STEP_SECONDS,
    ]);
    expect(bars().every((bar) => bar.style.flexBasis === "0%")).toBe(true);
  });

  it("should expand a repeat block into one bar per repetition", () => {
    // Arrange
    const workout = makeWorkout(repeatKrd());

    // Act
    render(<CoachingDialogZoneProfile workout={workout} />);

    // Assert
    const zones = bars().map((bar) => bar.getAttribute("data-zone"));
    expect(zones).toEqual(["2", "5", "1", "5", "1", "5", "1"]);
  });

  it("should render nothing when the workout has no structure yet", () => {
    // Arrange
    const workout = makeWorkout(null);

    // Act
    const { container } = render(
      <CoachingDialogZoneProfile workout={workout} />
    );

    // Assert
    expect(screen.queryByTestId(PROFILE_TESTID)).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it("should expose the chart as an image summarising its structure", () => {
    // Arrange
    const workout = makeWorkout(
      structuredKrd([
        { percentFtp: PCT_Z2, seconds: SHORT_STEP_SECONDS },
        { percentFtp: PCT_Z4, seconds: LONG_STEP_SECONDS },
      ])
    );

    // Act
    render(<CoachingDialogZoneProfile workout={workout} />);

    // Assert
    expect(
      screen.getByRole("img", {
        name: "Intensity profile, 25m in 2 blocks: Z2 5m, Z4 20m",
      })
    ).toBeInTheDocument();
    expect(bars().map((bar) => bar.title)).toEqual(["Z2 · 5m", "Z4 · 20m"]);
  });

  it("should draw the minute axis and the Z1–Z5 legend under the bars", () => {
    // Arrange
    const workout = makeWorkout(
      structuredKrd([{ percentFtp: PCT_Z2, seconds: LONG_STEP_SECONDS * 2 }])
    );

    // Act
    render(<CoachingDialogZoneProfile workout={workout} />);

    // Assert
    expect(screen.getByTestId("zone-profile-axis")).toHaveTextContent(
      "0′15′30′"
    );
    expect(
      screen.getByRole("list", { name: "Training zones" })
    ).toHaveTextContent("Z1Z2Z3Z4Z5");
  });
});
