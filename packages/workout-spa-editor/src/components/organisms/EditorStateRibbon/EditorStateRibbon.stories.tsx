import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { EditorStateRibbon } from "./EditorStateRibbon";

/**
 * `EditorStateRibbon` needs a route for its "Fix" button (`useLocation`
 * from wouter) — set via `parameters: { route }`, which the global
 * `Router`/`memoryLocation` decorator in `.storybook/preview.tsx` reads.
 *
 * `useGarminGate` (via `useGarminBridge`, already covered by the global
 * `GarminBridgeProvider`) resolves from real browser-extension detection.
 * `extensionInstalled` starts `false` and nothing in Storybook can make the
 * real Chrome extension announce itself, so the gate is always
 * `"no-extension"` here — the `export-disabled` / `no-session` / `ready`
 * copy is unreachable without faking that internal, which this file does
 * not do. The two stories below are every visually distinct outcome that
 * combination can actually produce: a sendable state (any of
 * `structured`/`ready`/`modified` render identically once the gate
 * overrides the copy) versus a non-sendable state, which renders nothing.
 */
const meta = {
  title: "Organisms/EditorStateRibbon",
  component: EditorStateRibbon,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onSent: fn(),
  },
} satisfies Meta<typeof EditorStateRibbon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SendableWithNoBridgeInstalled: Story = {
  args: {
    state: "structured",
  },
  parameters: {
    route: "/workout/demo-workout",
  },
};

/** `pushed` renders nothing on purpose — the watch already has this
 * version, so the screen stays silent (see `ribbon-content.ts`). */
export const AlreadyPushedRendersNothing: Story = {
  args: {
    state: "pushed",
  },
  parameters: {
    route: "/workout/demo-workout",
  },
};
