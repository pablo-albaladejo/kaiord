import type { Meta, StoryObj } from "@storybook/react";

import type { KRD } from "../../../types/krd";
import { SaveToLibraryButton } from "./SaveToLibraryButton";

const meta = {
  title: "Molecules/SaveToLibraryButton",
  component: SaveToLibraryButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Opens a dialog to **Keep** the current workout in the library — one of the three verbs (Send · Keep · Download) the editor's action set was cut down to.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SaveToLibraryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const workout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2026-05-01T08:00:00Z",
    sport: "cycling",
  },
  extensions: {
    structured_workout: {
      name: "Sweet Spot Intervals",
      sport: "cycling",
      steps: [
        {
          stepIndex: 0,
          durationType: "time",
          duration: { type: "time", seconds: 600 },
          targetType: "open",
          target: { type: "open" },
          intensity: "warmup",
        },
        {
          stepIndex: 1,
          durationType: "time",
          duration: { type: "time", seconds: 1200 },
          targetType: "power",
          target: {
            type: "power",
            value: { unit: "percent_ftp", value: 92 },
          },
          intensity: "active",
        },
      ],
    },
  },
};

const emptyWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: {
    created: "2026-05-01T08:00:00Z",
    sport: "cycling",
  },
  extensions: {
    structured_workout: {
      name: "Untitled workout",
      sport: "cycling",
      steps: [],
    },
  },
};

export const Idle: Story = {
  args: { workout },
};

export const EmptyWorkout: Story = {
  name: "Empty workout (no steps yet)",
  args: { workout: emptyWorkout },
};

export const Disabled: Story = {
  name: "Disabled (nothing new to keep)",
  args: { workout, disabled: true },
};
