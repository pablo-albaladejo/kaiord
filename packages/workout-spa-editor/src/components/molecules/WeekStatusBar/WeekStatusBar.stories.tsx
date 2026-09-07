import type { Meta, StoryObj } from "@storybook/react";

import type { WeekStatus } from "../../pages/week-status";
import { WeekStatusBar } from "./WeekStatusBar";

const status = (overrides: Partial<WeekStatus> = {}): WeekStatus => ({
  doneAndMatched: 0,
  readyNotPushed: 0,
  needsStructure: 0,
  ...overrides,
});

const meta = {
  title: "Molecules/WeekStatusBar",
  component: WeekStatusBar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof WeekStatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A typical mid-week mix of all three steps. */
export const BusyWeek: Story = {
  args: {
    status: status({
      doneAndMatched: 2,
      readyNotPushed: 3,
      needsStructure: 4,
    }),
  },
};

/** Nearly the whole week is done and matched, nothing waiting on a watch. */
export const MostlyWrappedUp: Story = {
  args: {
    status: status({ doneAndMatched: 9 }),
  },
};

/** Every session this week is still a raw import. */
export const AllRawImports: Story = {
  args: { status: status({ needsStructure: 6 }) },
};

/** A single ready session — copy stays grammatically singular. */
export const SingleSessionWaiting: Story = {
  args: { status: status({ readyNotPushed: 1 }) },
};

/** All three counts are zero: a week with nothing to report says nothing. */
export const SilentWeek: Story = {
  args: { status: status() },
};
