import type { Meta, StoryObj } from "@storybook/react";

import { CardShell } from "./CardShell";

const meta = {
  title: "Molecules/CardShell",
  component: CardShell,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof CardShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: {
    borderClass: "border-amber-600",
    titleRow: <span className="font-medium">Z2/Z3 técnica</span>,
    metadataRow: <span>45 min</span>,
    originChip: "T2G",
  },
};

export const Completed: Story = {
  args: {
    borderClass: "border-emerald-600",
    titleRow: <span className="font-medium">FTP test</span>,
    metadataRow: <span>1h 0m</span>,
    originChip: "T2G",
  },
};

export const Skipped: Story = {
  args: {
    borderClass: "border-slate-500",
    titleRow: <span className="font-medium">Easy run</span>,
    metadataRow: <span>30 min</span>,
    originChip: "manual",
  },
};

export const LongTitle: Story = {
  args: {
    borderClass: "border-amber-600",
    titleRow: (
      <span className="font-medium">
        Z2/Z3 técnica con 4×100 fuerte + drills + recovery cool down
      </span>
    ),
    metadataRow: <span>60 min</span>,
    originChip: "T2G",
  },
};
