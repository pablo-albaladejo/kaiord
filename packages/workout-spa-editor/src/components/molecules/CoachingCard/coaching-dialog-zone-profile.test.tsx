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
const CAPTION_TESTID = "coaching-dialog-zone-estimate-caption";
const ZONED_TEXT = "12' Z1, 4x(3' Z4 + 2' Z1), 10' Z1";

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

  it("should draw the structured profile, not the estimate, when the linked workout has one", () => {
    // Arrange
    const workout = makeWorkout(
      structuredKrd([{ percentFtp: PCT_Z4, seconds: LONG_STEP_SECONDS }])
    );

    // Act
    render(
      <CoachingDialogZoneProfile workout={workout} description={ZONED_TEXT} />
    );

    // Assert
    expect(bars().map((bar) => bar.getAttribute("data-zone"))).toEqual(["4"]);
    expect(screen.queryByTestId(CAPTION_TESTID)).not.toBeInTheDocument();
  });

  it.each([
    ["no linked workout", null],
    ["a linked workout without structure", makeWorkout(null)],
  ])(
    "should estimate the profile from the coach's text with %s",
    (_case, workout) => {
      // Arrange
      const name = `Estimated intensity profile from coach text, 42m in 9 blocks: Z1 30m, Z4 12m`;

      // Act
      render(
        <CoachingDialogZoneProfile workout={workout} description={ZONED_TEXT} />
      );

      // Assert
      expect(screen.getByRole("img", { name })).toBeInTheDocument();
      expect(screen.getByTestId(CAPTION_TESTID)).toHaveTextContent(
        "Estimated from coach text"
      );
    }
  );

  it("should draw an unzoned span as a neutral bar titled no zone given", () => {
    // Arrange
    const text = "10' z1 + 30' contrastes";

    // Act
    render(<CoachingDialogZoneProfile workout={null} description={text} />);

    // Assert
    const [zoned, unzoned] = bars();
    expect(unzoned?.getAttribute("data-zone")).toBe("none");
    expect(unzoned?.className).toContain("bg-ink-muted");
    expect(bars().map((bar) => bar.title)).toEqual([
      "Z1 · 10m",
      "No zone given · 30m",
    ]);
    expect(zoned?.getAttribute("data-zone")).toBe("1");
    expect(
      screen.getByRole("img", {
        name: "Estimated intensity profile from coach text, 40m in 2 blocks: Z1 10m, No zone given 30m",
      })
    ).toBeInTheDocument();
  });

  it.each(["10' z1 + 1K fuerte", "Easy spin with friends", ""])(
    "should render no chart for the text %j",
    (text) => {
      // Arrange
      const description = text;

      // Act
      const { container } = render(
        <CoachingDialogZoneProfile workout={null} description={description} />
      );

      // Assert
      expect(container).toBeEmptyDOMElement();
    }
  );
});
