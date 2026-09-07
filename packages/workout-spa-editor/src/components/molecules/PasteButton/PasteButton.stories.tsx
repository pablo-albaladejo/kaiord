import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { PasteButton } from "./PasteButton";

const meta = {
  title: "Molecules/PasteButton",
  component: PasteButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Pastes a copied step from the clipboard into the step list. It exposes no disabled/loading prop of its own — the caller only mounts it once a paste target exists (`WorkoutStepsListActions` renders it conditionally on `onPasteStep`).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PasteButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onPaste: fn(),
  },
};

export const InActionRow: Story = {
  name: "In the steps-list action row (full width on mobile)",
  args: {
    onPaste: fn(),
    className: "w-full sm:w-auto",
  },
};
