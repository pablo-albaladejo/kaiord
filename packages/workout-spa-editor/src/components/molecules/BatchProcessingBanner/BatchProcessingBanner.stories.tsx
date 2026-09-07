import type { Meta, StoryObj } from "@storybook/react";

import type { BatchProgress } from "../../../application/batch-processor";
import { BatchProcessingBanner } from "./BatchProcessingBanner";

const meta = {
  title: "Molecules/BatchProcessingBanner",
  component: BatchProcessingBanner,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof BatchProcessingBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const progressOf = (
  overrides: Partial<BatchProgress> & Pick<BatchProgress, "counts" | "byId">
): BatchProgress => ({
  total: 5,
  current: null,
  processed: 0,
  succeeded: 0,
  failed: 0,
  ...overrides,
});

/**
 * Nothing raw and nothing running — the calendar's normal state. The banner
 * renders nothing at all rather than an empty shell; there is no "0 raw
 * workouts" placeholder to keep chrome permanently on screen.
 */
export const NothingToProcess: Story = {
  args: {
    rawCount: 0,
    isProcessing: false,
    progress: null,
    onProcess: () => {},
    onCancel: () => {},
  },
};

export const ReadyToProcess: Story = {
  args: {
    rawCount: 3,
    isProcessing: false,
    progress: null,
    onProcess: () => {},
    onCancel: () => {},
  },
};

/** The singular copy branch — one raw workout, not "1 raw workouts". */
export const SingleRawWorkout: Story = {
  args: {
    rawCount: 1,
    isProcessing: false,
    progress: null,
    onProcess: () => {},
    onCancel: () => {},
  },
};

export const Processing: Story = {
  args: {
    rawCount: 5,
    isProcessing: true,
    progress: progressOf({
      total: 5,
      current: "w3",
      processed: 2,
      succeeded: 2,
      failed: 0,
      counts: { queued: 2, processing: 1, succeeded: 2, failed: 0 },
      byId: {
        w1: "succeeded",
        w2: "succeeded",
        w3: "processing",
        w4: "queued",
        w5: "queued",
      },
    }),
    onProcess: () => {},
    onCancel: () => {},
  },
};

/** The per-bucket breakdown is where a failure becomes visible mid-run. */
export const ProcessingWithFailures: Story = {
  args: {
    rawCount: 5,
    isProcessing: true,
    progress: progressOf({
      total: 5,
      current: "w4",
      processed: 3,
      succeeded: 2,
      failed: 1,
      counts: { queued: 1, processing: 1, succeeded: 2, failed: 1 },
      byId: {
        w1: "succeeded",
        w2: "failed",
        w3: "succeeded",
        w4: "processing",
        w5: "queued",
      },
    }),
    onProcess: () => {},
    onCancel: () => {},
  },
};
