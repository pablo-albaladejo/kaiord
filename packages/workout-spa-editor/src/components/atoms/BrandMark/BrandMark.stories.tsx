import type { CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { zoneVar } from "../../../lib/zone-colors";
import { BrandMark } from "./BrandMark";

const meta = {
  title: "Atoms/BrandMark",
  component: BrandMark,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { size: 28 },
};

export const LiveCore: Story = {
  args: { size: 28, core: "live" },
  decorators: [
    (Story) => (
      <div
        className="text-ink-strong"
        style={{ "--core-live": zoneVar(4) } as CSSProperties}
      >
        <Story />
      </div>
    ),
  ],
};

export const Compact: Story = {
  args: { size: 16 },
};

export const WithTitle: Story = {
  args: { size: 28, title: "Kaiord" },
};
