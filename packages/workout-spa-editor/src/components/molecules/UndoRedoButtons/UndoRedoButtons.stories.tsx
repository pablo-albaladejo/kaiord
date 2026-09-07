import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { UndoRedoButtons } from "./UndoRedoButtons";

const meta = {
  title: "Molecules/UndoRedoButtons",
  component: UndoRedoButtons,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof UndoRedoButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MidHistory: Story = {
  name: "Mid-history (can go either way)",
  args: {
    canUndo: true,
    canRedo: true,
    onUndo: fn(),
    onRedo: fn(),
  },
};

export const NoHistoryYet: Story = {
  name: "Fresh workout (nothing to undo or redo)",
  args: {
    canUndo: false,
    canRedo: false,
    onUndo: fn(),
    onRedo: fn(),
  },
};

export const AtLatestEdit: Story = {
  name: "At the latest edit (the common case)",
  args: {
    canUndo: true,
    canRedo: false,
    onUndo: fn(),
    onRedo: fn(),
  },
};

export const AtOldestEdit: Story = {
  name: "Rewound to the oldest edit",
  args: {
    canUndo: false,
    canRedo: true,
    onUndo: fn(),
    onRedo: fn(),
  },
};
