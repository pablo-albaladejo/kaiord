import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Segmented, type SegmentedOption } from "./Segmented";

type Sport = "cycling" | "running" | "swimming";

const OPTIONS: SegmentedOption<Sport>[] = [
  { value: "cycling", label: "Cycling", icon: "bike" },
  { value: "running", label: "Running", icon: "run" },
  { value: "swimming", label: "Swim", icon: "swim" },
];

const meta = {
  title: "Atoms/Segmented",
  component: Segmented<Sport>,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Segmented<Sport>>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledSegmented() {
  const [value, setValue] = useState<Sport>("cycling");
  return (
    <div className="w-[320px]">
      <Segmented
        options={OPTIONS}
        value={value}
        onChange={setValue}
        ariaLabel="Sport"
      />
    </div>
  );
}

export const Sports: Story = {
  args: {
    options: OPTIONS,
    value: "cycling",
    onChange: () => undefined,
    ariaLabel: "Sport",
  },
  render: () => <ControlledSegmented />,
};
