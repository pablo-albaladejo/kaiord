import type { Meta, StoryObj } from "@storybook/react";

import type { ZoneSegment } from "../../../lib/workout-review";
import { ZoneProfileBar } from "./ZoneProfileBar";

const MIN = 60;

/** Warm-up, one long steady block, cool-down — Z2 dominant. */
const ENDURANCE_SEGMENTS: ZoneSegment[] = [
  { zone: 1, seconds: 5 * MIN },
  { zone: 2, seconds: 50 * MIN },
  { zone: 1, seconds: 5 * MIN },
];

/** Warm-up, two threshold blocks with a recovery between, cool-down — Z4 dominant. */
const THRESHOLD_SEGMENTS: ZoneSegment[] = [
  { zone: 2, seconds: 10 * MIN },
  { zone: 4, seconds: 15 * MIN },
  { zone: 1, seconds: 3 * MIN },
  { zone: 4, seconds: 15 * MIN },
  { zone: 2, seconds: 10 * MIN },
];

/** Warm-up, three short hard repeats with jog recovery, cool-down — Z5 dominant in time-at-height, not duration. */
const VO2MAX_SEGMENTS: ZoneSegment[] = [
  { zone: 2, seconds: 10 * MIN },
  { zone: 5, seconds: 3 * MIN },
  { zone: 1, seconds: 2 * MIN },
  { zone: 5, seconds: 3 * MIN },
  { zone: 1, seconds: 2 * MIN },
  { zone: 5, seconds: 3 * MIN },
  { zone: 2, seconds: 5 * MIN },
];

const meta = {
  title: "Molecules/ZoneProfileBar",
  component: ZoneProfileBar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof ZoneProfileBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Calendar grid density (14px) on an endurance ride. */
export const EnduranceRideGrid: Story = {
  args: { segments: ENDURANCE_SEGMENTS, height: 14 },
};

/** Calendar list density (20px) on a threshold session with a real Z4 block. */
export const ThresholdIntervalsList: Story = {
  args: { segments: THRESHOLD_SEGMENTS, height: 20 },
};

/** Library card density (10px) on a VO2max repeat session. */
export const Vo2MaxRepeatsCard: Story = {
  args: { segments: VO2MAX_SEGMENTS, height: 10 },
};

/** With a label, the bar stops being decorative and becomes an accessible image. */
export const WithAccessibleLabel: Story = {
  args: {
    segments: THRESHOLD_SEGMENTS,
    height: 14,
    label: "Time in zone: mostly Z4 threshold work",
  },
};

/** No classifiable structure yet — the bar renders nothing, same as a raw import's card. */
export const NoStructureYet: Story = {
  args: { segments: [] },
};
