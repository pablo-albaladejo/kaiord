import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type { KRD } from "../../../types/krd";
import { WorkoutMetadataEditor } from "./WorkoutMetadataEditor";

const meta = {
  title: "Molecules/WorkoutMetadataEditor",
  component: WorkoutMetadataEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onSave: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof WorkoutMetadataEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const namedCyclingKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2026-06-01T08:00:00Z",
    sport: "cycling",
    subSport: "indoor_cycling",
  },
  extensions: {
    structured_workout: {
      name: "Sweet Spot Intervals",
      sport: "cycling",
      subSport: "indoor_cycling",
      steps: [],
    },
  },
};

const unnamedRunningKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-02T07:00:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      sport: "running",
      subSport: "trail",
      steps: [],
    },
  },
};

const withCoachNotesKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-03T06:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: {
      name: "Threshold Set",
      sport: "cycling",
      steps: [],
      notes:
        "Keep cadence above 85rpm on all intervals. See [video](https://youtu.be/example) for form cues.",
    },
  },
};

const swimmingKrd: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2026-06-04T06:30:00Z",
    sport: "swimming",
    subSport: "lap_swimming",
  },
  extensions: {
    structured_workout: {
      name: "Endurance Swim",
      sport: "swimming",
      subSport: "lap_swimming",
      steps: [],
    },
  },
};

export const NamedCyclingWorkout: Story = {
  args: {
    krd: namedCyclingKrd,
  },
};

export const UnnamedRunningWorkout: Story = {
  args: {
    krd: unnamedRunningKrd,
  },
};

export const WithCoachNotes: Story = {
  args: {
    krd: withCoachNotesKrd,
  },
};

export const SwimmingWorkout: Story = {
  args: {
    krd: swimmingKrd,
  },
};
