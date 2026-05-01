import type { Meta, StoryObj } from "@storybook/react";

import type { CoachingActivity } from "../../../types/coaching-activity";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { MatchedSessionCard, type MatchedSession } from "./MatchedSessionCard";

const activity: CoachingActivity = {
  id: "a1",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-04-29",
  sport: { label: "Cycling", icon: "\u{1F6B4}" },
  title: "FTP test",
  duration: "60 min",
  effort: 4,
  status: "completed",
};

const workout: WorkoutRecord = {
  id: "w1",
  date: "2026-04-29",
  state: "ready",
  source: "train2go",
  sourceId: null,
  planId: null,
  sport: "cycling",
  raw: {
    title: "FTP test executed",
    description: "",
    comments: [],
    distance: null,
    duration: { value: 3540, unit: "s" }, // 59 min — close to 60
    prescribedRpe: null,
    rawHash: "h",
  },
  krd: null,
  lastProcessingError: null,
  feedback: null,
  aiMeta: null,
  garminPushId: null,
  tags: [],
  previousState: null,
  createdAt: "2026-04-29T10:00:00.000Z",
  modifiedAt: null,
  updatedAt: "2026-04-29T10:00:00.000Z",
};

const session = (overrides: Partial<MatchedSession> = {}): MatchedSession => ({
  activity,
  workout,
  complianceScore: 0.98,
  ...overrides,
});

const meta = {
  title: "Molecules/MatchedSessionCard",
  component: MatchedSessionCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof MatchedSessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HighComplianceCompact: Story = {
  args: { session: session(), density: "compact" },
};

export const HighComplianceComfortable: Story = {
  args: { session: session(), density: "comfortable" },
};

export const MidComplianceComfortable: Story = {
  args: {
    session: session({
      complianceScore: 0.65,
      workout: {
        ...workout,
        raw: { ...workout.raw!, duration: { value: 2400, unit: "s" } },
      },
    }),
    density: "comfortable",
  },
};

export const LowComplianceComfortable: Story = {
  args: {
    session: session({
      complianceScore: 0.25,
      workout: {
        ...workout,
        raw: { ...workout.raw!, duration: { value: 900, unit: "s" } },
      },
    }),
    density: "comfortable",
  },
};

export const NullComplianceCompact: Story = {
  args: {
    session: session({ complianceScore: null }),
    density: "compact",
  },
};
