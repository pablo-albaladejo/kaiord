import type { Meta, StoryObj } from "@storybook/react";

import { Markdown } from "./Markdown";

const meta = {
  title: "Atoms/Markdown",
  component: Markdown,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-[420px] rounded-2xl bg-surface px-3 py-2 text-[14px] text-ink-strong">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reply: Story = {
  args: {
    source: [
      "## This week",
      "You have **three** sessions planned and *one* rest day.",
      "",
      "1. Tuesday: `4x8' @ threshold`",
      "2. Thursday: endurance",
      "   - keep it in zone 2",
      "3. Saturday: long ride",
      "",
      "> Recovery matters as much as the work.",
      "",
      "More on [Kaiord](https://kaiord.com).",
    ].join("\n"),
  },
};

export const WideTable: Story = {
  args: {
    source: [
      "| Day | Session | Duration | TSS | IF | Zone | Notes |",
      "|---|---|--:|--:|--:|:-:|---|",
      "| Mon | Rest | 0:00 | 0 | 0.00 | - | Full rest day |",
      "| Tue | Threshold intervals | 1:15 | 85 | 0.88 | Z4 | 4x8' with 4' recovery |",
      "| Sat | Long endurance ride | 3:30 | 180 | 0.72 | Z2 | Fuel every 30 minutes |",
    ].join("\n"),
  },
};

export const CodeBlock: Story = {
  args: { source: '```json\n{ "sport": "cycling", "steps": 6 }\n```' },
};

export const Streaming: Story = {
  args: {
    source: "Here is the plan:\n\n- **Warm up\n- Main set\n```\npartial",
  },
};

export const UnsafeInput: Story = {
  args: {
    source:
      "<script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[bad link](javascript:alert%281%29) stays text.",
  },
};
