import type { Meta, StoryObj } from "@storybook/react";

import { AttentionMark } from "./AttentionMark";

const meta = {
  title: "Atoms/AttentionMark",
  component: AttentionMark,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof AttentionMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const ExtraSmall: Story = {
  args: { size: "xs" },
};

export const WithCustomClassName: Story = {
  args: { className: "mt-0.5" },
};

export const PairedWithSentence: Story = {
  render: (args) => (
    <p className="flex items-start gap-2 text-sm text-ink-strong">
      <AttentionMark {...args} />
      <span>This step targets a zone that is unreachable at this FTP.</span>
    </p>
  ),
};
