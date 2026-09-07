import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { CalendarViewToggle } from "./CalendarViewToggle";

const meta = {
  title: "Molecules/CalendarViewToggle",
  component: CalendarViewToggle,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof CalendarViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Current view is Grid — the icon and label point at the next state, List. */
export const GridActive: Story = {
  args: { view: "grid", onToggle: fn() },
};

/** Current view is List — the icon and label point back at Grid. */
export const ListActive: Story = {
  args: { view: "list", onToggle: fn() },
};

/** In its real context: a toolbar row beside the week label. */
export const InCalendarToolbar: Story = {
  args: { view: "grid", onToggle: fn() },
  render: (args) => (
    <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 dark:border-slate-700">
      <span className="text-sm font-medium text-ink-strong">
        Apr 6 – Apr 12
      </span>
      <div className="flex-1" />
      <CalendarViewToggle {...args} />
    </div>
  ),
};
