import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Toggle } from "./Toggle";

const meta = {
  title: "Atoms/Toggle",
  component: Toggle,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledToggle({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  return (
    <Toggle
      checked={checked}
      onCheckedChange={setChecked}
      aria-label="Auto zones"
    />
  );
}

export const On: Story = {
  args: { checked: true, onCheckedChange: () => undefined },
  render: () => <ControlledToggle initial />,
};

export const Off: Story = {
  args: { checked: false, onCheckedChange: () => undefined },
  render: () => <ControlledToggle initial={false} />,
};
