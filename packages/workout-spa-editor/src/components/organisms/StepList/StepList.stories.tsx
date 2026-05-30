import type { Meta, StoryObj } from "@storybook/react";

import { StepList } from "./StepList";

const meta = {
  title: "Organisms/StepList",
  component: StepList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StepList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    steps: [
      { kind: "Warmup", detail: "10 min easy spin", zone: 1, dur: "10:00" },
      {
        kind: "Interval",
        detail: "4 × 4 min @ 115% FTP",
        zone: 4,
        dur: "16:00",
      },
      { kind: "Recovery", detail: "3 min between reps", zone: 2, dur: "09:00" },
      { kind: "Cooldown", detail: "5 min easy spin", zone: 1, dur: "05:00" },
    ],
  },
};

export const SingleStep: Story = {
  args: {
    steps: [
      {
        kind: "Steady State",
        detail: "45 min @ 88% FTP",
        zone: 3,
        dur: "45:00",
      },
    ],
  },
};

export const AllZones: Story = {
  args: {
    steps: [
      { kind: "Zone 1", detail: "Active recovery", zone: 1, dur: "05:00" },
      { kind: "Zone 2", detail: "Endurance base", zone: 2, dur: "10:00" },
      { kind: "Zone 3", detail: "Tempo effort", zone: 3, dur: "08:00" },
      { kind: "Zone 4", detail: "Threshold push", zone: 4, dur: "06:00" },
      { kind: "Zone 5", detail: "VO2max spike", zone: 5, dur: "03:00" },
    ],
  },
};
