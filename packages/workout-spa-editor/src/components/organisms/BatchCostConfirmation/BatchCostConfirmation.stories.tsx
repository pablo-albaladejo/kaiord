import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import type { LlmProviderConfig } from "../../../store/ai-store-types";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { BatchCostConfirmation } from "./BatchCostConfirmation";

const anthropicProvider: LlmProviderConfig = {
  id: "provider-anthropic",
  type: "anthropic",
  apiKey: "sk-ant-demo",
  model: "claude-sonnet-4-5",
  label: "Team Claude",
  isDefault: true,
  createdAt: Date.parse("2026-01-01T00:00:00Z"),
};

const openAiProvider: LlmProviderConfig = {
  id: "provider-openai",
  type: "openai",
  apiKey: "sk-demo",
  model: "gpt-4o",
  label: "GPT-4o",
  isDefault: false,
  createdAt: Date.parse("2026-01-02T00:00:00Z"),
};

const rawWorkout = (
  id: string,
  date: string,
  description: string
): WorkoutRecord =>
  ({
    id,
    date,
    state: "raw",
    raw: { description, comments: [] },
  }) as unknown as WorkoutRecord;

const oneWorkout: WorkoutRecord[] = [
  rawWorkout("w1", "2026-04-18", "3k tempo run, negative split"),
];

const fiveWorkouts: WorkoutRecord[] = [
  rawWorkout("w1", "2026-04-18", "3k tempo run, negative split"),
  rawWorkout("w2", "2026-04-19", "60min endurance ride, Z2"),
  rawWorkout("w3", "2026-04-20", "Rest day, light mobility"),
  rawWorkout("w4", "2026-04-21", "5x1000m intervals, 2min recovery"),
  rawWorkout("w5", "2026-04-22", "Long swim, 2500m technique focus"),
];

const meta = {
  title: "Organisms/BatchCostConfirmation",
  component: BatchCostConfirmation,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    open: true,
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof BatchCostConfirmation>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One raw workout, one configured provider — the common case. */
export const SingleWorkout: Story = {
  args: { workouts: oneWorkout, provider: anthropicProvider },
};

/** A week's worth of raw entries — states plainly what will be spent and on how many items. */
export const BatchOfFive: Story = {
  args: { workouts: fiveWorkouts, provider: anthropicProvider },
};

/** A different provider changes the blended per-token rate, so the USD estimate differs too. */
export const OpenAiProvider: Story = {
  args: { workouts: fiveWorkouts, provider: openAiProvider },
};

/** No provider selected — cost collapses to "—" and Confirm is disabled. */
export const NoProviderSelected: Story = {
  args: { workouts: oneWorkout, provider: null },
};
