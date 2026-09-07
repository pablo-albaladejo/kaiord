import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { StepNotesEditor } from "./StepNotesEditor";

const meta = {
  title: "Molecules/StepNotesEditor",
  component: StepNotesEditor,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof StepNotesEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    value: "",
  },
};

export const WithCoachingNotes: Story = {
  args: {
    value: "Focus on cadence, stay seated on climbs.",
  },
};

export const NearCharacterLimit: Story = {
  args: {
    value: "a".repeat(250),
  },
};

export const OverCharacterLimit: Story = {
  args: {
    value: "a".repeat(260),
  },
};

export const Disabled: Story = {
  args: {
    value: "Coach notes locked while the step is syncing.",
    disabled: true,
  },
};
