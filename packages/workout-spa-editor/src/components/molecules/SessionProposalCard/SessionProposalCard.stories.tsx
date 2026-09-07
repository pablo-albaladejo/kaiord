import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type { ProposalMetric } from "./SessionProposalCard";
import { SessionProposalCard } from "./SessionProposalCard";

const meta = {
  title: "Molecules/SessionProposalCard",
  component: SessionProposalCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof SessionProposalCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** From the coach: what the draft actually structures to, beneath what was prescribed. Z4 dominant. */
export const FromCoachThreshold: Story = {
  args: {
    title: "Threshold 2 × 15",
    subtitle: "From your coach",
    metrics: [
      { value: "45 min", comparison: "Coach said: 40 min", label: "Duration" },
      { value: "78", comparison: "Coach said: 65", label: "TSS" },
    ] satisfies ProposalMetric[],
    dist: [3, 8, 2, 20, 1],
  },
};

/** A plain draft with nothing to compare against — no subtitle, no dash, no empty row. Z2 dominant. */
export const EnduranceLongRide: Story = {
  args: {
    title: "Zone 2 endurance ride",
    metrics: [
      { value: "90 min", label: "Duration" },
      { value: "60", label: "TSS" },
    ] satisfies ProposalMetric[],
    dist: [5, 70, 5, 0, 0],
  },
};

/** A chat-generated proposal landing beside an existing session. Z3 dominant tempo work. */
export const LandsBesideExisting: Story = {
  args: {
    title: "Tempo 3 × 10",
    subtitle: "Lands beside Yesterday's recovery spin",
    metrics: [
      {
        value: "50 min",
        comparison: "Already there: 45 min",
        label: "Duration",
      },
    ] satisfies ProposalMetric[],
    dist: [5, 10, 25, 5, 0],
  },
};

/** Footer actions render in their own row, below the zone bar. Z5 dominant VO2max work. */
export const WithFooterActions: Story = {
  args: {
    title: "VO2max 5 × 3",
    subtitle: "From chat proposal",
    metrics: [
      { value: "38 min", label: "Duration" },
      { value: "82", label: "TSS" },
    ] satisfies ProposalMetric[],
    dist: [2, 5, 2, 6, 15],
    children: (
      <>
        <button
          type="button"
          onClick={fn()}
          className="rounded-full bg-ink-strong px-3 py-1 text-xs font-medium text-surface"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={fn()}
          className="rounded-full border border-edge-soft px-3 py-1 text-xs font-medium text-ink-muted"
        >
          Adjust in chat
        </button>
      </>
    ),
  },
};

/** An all-zero distribution has no classifiable structure: no border, no zone bar. */
export const NoZoneData: Story = {
  args: {
    title: "Recovery walk",
    metrics: [
      { value: "30 min", label: "Duration" },
    ] satisfies ProposalMetric[],
    dist: [0, 0, 0, 0, 0],
  },
};
