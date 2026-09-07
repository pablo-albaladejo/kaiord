import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { ShortcutSheet } from "./ShortcutSheet";

/**
 * The `?` sheet: every catalog shortcut, grouped, so they can be read
 * without scrolling — content is the static `SHORTCUT_CATALOG`, so
 * `open` is the only prop that changes what renders. Closed renders
 * nothing, which would look identical to a broken story, so every
 * story here keeps it open.
 */
const meta = {
  title: "Organisms/ShortcutSheet",
  component: ShortcutSheet,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    open: true,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof ShortcutSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
