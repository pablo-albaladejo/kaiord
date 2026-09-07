import type { Meta, StoryObj } from "@storybook/react";

import type { KRD } from "../../../types/krd";
import { AiSuccessActions } from "./AiSuccessActions";

const meta = {
  title: "Molecules/AiSuccessActions",
  component: AiSuccessActions,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof AiSuccessActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const cyclingWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-05-17T08:00:00Z", sport: "cycling" },
  extensions: {
    structured_workout: { name: "Generated", sport: "cycling", steps: [] },
  },
};

const runningWorkout: KRD = {
  version: "1.0",
  type: "structured_workout",
  metadata: { created: "2026-06-02T06:30:00Z", sport: "running" },
  extensions: {
    structured_workout: {
      name: "5x1000m Threshold",
      sport: "running",
      steps: [],
    },
  },
};

/**
 * The row after AI hands back a structured workout: keep it, tweak the
 * prompt, edit it by hand, or throw it away. All four affordances are always
 * present together — there is no partial state, since the row only mounts
 * once generation has already succeeded.
 */
export const Default: Story = {
  args: {
    workout: cyclingWorkout,
    onRegenerate: () => {},
    onEdit: () => {},
    onDiscard: () => {},
  },
};

/** Same row, a different generated workout — the action bar itself does not
 *  change shape with the workout's content. */
export const RunningWorkout: Story = {
  args: {
    workout: runningWorkout,
    onRegenerate: () => {},
    onEdit: () => {},
    onDiscard: () => {},
  },
};
