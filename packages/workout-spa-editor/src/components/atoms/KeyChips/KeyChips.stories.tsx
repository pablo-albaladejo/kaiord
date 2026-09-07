import type { Meta, StoryObj } from "@storybook/react";

import { KeyChips } from "./KeyChips";

const meta = {
  title: "Atoms/KeyChips",
  component: KeyChips,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof KeyChips>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleKey: Story = {
  args: {
    def: {
      id: "clear-selection",
      group: "selection",
      keys: ["Esc"],
      labelKey: "shortcuts.selection.clear",
      handlerKey: "onClearSelection",
    },
  },
};

export const KeyCombo: Story = {
  args: {
    def: {
      id: "ungroup-block",
      group: "steps",
      keys: ["Ctrl", "Shift", "G"],
      macKeys: ["⌘", "⇧", "G"],
      labelKey: "shortcuts.steps.ungroup",
      handlerKey: "onUngroupBlock",
    },
  },
};

export const WithAliasBinding: Story = {
  args: {
    def: {
      id: "redo",
      group: "edit",
      keys: ["Ctrl", "Y"],
      macKeys: ["⌘", "Y"],
      aliasKeys: ["Ctrl", "Shift", "Z"],
      aliasMacKeys: ["⌘", "⇧", "Z"],
      labelKey: "shortcuts.edit.redo",
      handlerKey: "onRedo",
    },
  },
};

export const AliasWithoutMacVariant: Story = {
  args: {
    def: {
      id: "delete",
      group: "edit",
      keys: ["Del"],
      macKeys: ["⌫"],
      aliasKeys: ["Backspace"],
      labelKey: "shortcuts.edit.delete",
      handlerKey: "onDelete",
    },
  },
};
