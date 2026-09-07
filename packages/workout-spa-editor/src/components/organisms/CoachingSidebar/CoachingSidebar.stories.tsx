import type { Meta, StoryObj } from "@storybook/react";

import {
  buildCoachingActivityId,
  type CoachingActivityRecord,
} from "../../../types/coaching-activity-record";
import { CoachingSidebar } from "./CoachingSidebar";

const PROFILE_ID = "profile-1";

function makeActivity(
  overrides: Partial<CoachingActivityRecord> = {}
): CoachingActivityRecord {
  const source = overrides.source ?? "train2go";
  const sourceId = overrides.sourceId ?? "abc123";
  return {
    id: buildCoachingActivityId(PROFILE_ID, source, sourceId),
    profileId: PROFILE_ID,
    source,
    sourceId,
    date: "2026-04-13",
    sport: "cycling",
    title: "Sweet spot intervals",
    duration: "01:00:00",
    intensity: 4,
    status: "pending",
    description:
      "<p>Warm up 15 min Z1-Z2.</p><p><strong>Then</strong> 4×8 min at 90% FTP with 4 min recovery.</p><p>Cool down 10 min.</p>",
    fetchedAt: "2026-04-13T08:00:00.000Z",
    ...overrides,
  };
}

const meta = {
  title: "Organisms/CoachingSidebar",
  component: CoachingSidebar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof CoachingSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A pending prescription with bold emphasis in its description. */
export const PendingSweetSpotIntervals: Story = {
  args: { activity: makeActivity() },
};

/** A completed session, plain-text description. */
export const CompletedRun: Story = {
  args: {
    activity: makeActivity({
      sourceId: "run-42",
      sport: "running",
      title: "Easy recovery run",
      duration: "00:35:00",
      intensity: 2,
      status: "completed",
      description: "<p>Keep it conversational the whole way.</p>",
    }),
  },
};

/** A session the athlete skipped. */
export const SkippedSession: Story = {
  args: {
    activity: makeActivity({
      sourceId: "gym-7",
      sport: "gym",
      title: "Strength: lower body",
      duration: "00:45:00",
      intensity: 3,
      status: "skipped",
      description: "<p>Squats, deadlifts, calf raises.</p>",
    }),
  },
};

/** A markdown link in the description renders as a safe https anchor. */
export const WithLinkedTechniqueVideo: Story = {
  args: {
    activity: makeActivity({
      sourceId: "swim-3",
      sport: "swimming",
      title: "Technique drills",
      duration: "00:50:00",
      intensity: 3,
      description:
        "Focus on catch and pull. [Watch the technique video](https://youtu.be/dQw4w9WgXcQ) before you start.",
    }),
  },
};

/** No prescription text yet — the empty-description fallback. */
export const NoDescription: Story = {
  args: {
    activity: makeActivity({
      sourceId: "yoga-1",
      sport: "yoga",
      title: "Mobility and yoga",
      duration: "00:30:00",
      intensity: 1,
      description: undefined,
    }),
  },
};
