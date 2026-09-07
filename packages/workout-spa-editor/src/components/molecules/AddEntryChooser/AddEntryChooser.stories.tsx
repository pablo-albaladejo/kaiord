import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { AddEntryChooser } from "./AddEntryChooser";

const meta = {
  title: "Molecules/AddEntryChooser",
  component: AddEntryChooser,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: fn(),
    onChoose: fn(),
  },
} satisfies Meta<typeof AddEntryChooser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChooseForToday: Story = {
  args: { date: "2026-05-04" },
};

export const ChooseForAPastDay: Story = {
  args: { date: "2026-01-12" },
};

/**
 * An empty `date` falls back to the generic "Add entry" title instead of
 * "Add to {date}" — the header-entry flow (no bound calendar day) hits
 * this branch.
 */
export const WithoutABoundDate: Story = {
  args: { date: "" },
};
