import type { Meta, StoryObj } from "@storybook/react";
import type { ReactNode } from "react";

import { SelectionIndicator } from "./SelectionIndicator";

const meta = {
  title: "Molecules/SelectionIndicator",
  component: SelectionIndicator,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof SelectionIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Rendered absolutely-positioned over a card corner in real usage; a
 *  relative wrapper here gives the badge somewhere to anchor to. */
const withAnchor = (children: ReactNode) => (
  <div className="relative h-12 w-12 rounded-lg border border-edge bg-surface-elevated">
    {children}
  </div>
);

export const Selected: Story = {
  args: { selected: true },
  render: (args) => withAnchor(<SelectionIndicator {...args} />),
};

/** Not selected renders nothing at all — no empty outline placeholder. */
export const Unselected: Story = {
  args: { selected: false },
  render: (args) => withAnchor(<SelectionIndicator {...args} />),
};
