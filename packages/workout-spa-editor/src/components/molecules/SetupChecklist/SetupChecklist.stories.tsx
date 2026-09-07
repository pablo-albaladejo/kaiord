import type { Meta, StoryObj } from "@storybook/react";

import { SetupChecklist } from "./SetupChecklist";

/**
 * SetupChecklist takes no props. Its four rows, progress caption, and the
 * hidden dismissed/complete states are all derived from `useSetupChecklist`,
 * which reads the active profile and Dexie-persisted facts (workout count,
 * thresholds, connections, pushes). Storybook's IndexedDB is empty and
 * unseeded, so it always resolves to the same real state: no active profile,
 * nothing done yet, checklist not dismissed. That is a genuine, reachable
 * state — the card a brand-new install actually shows — but the other three
 * states this component supports (partial progress, dismissed → renders
 * nothing, complete → renders nothing) need persisted fixture data this
 * environment has no way to seed without reaching into the shared Dexie
 * singleton other stories also read from, so they are not represented here.
 */
const meta = {
  title: "Molecules/SetupChecklist",
  component: SetupChecklist,
  parameters: { layout: "padded", route: "/daily" },
  tags: ["autodocs"],
} satisfies Meta<typeof SetupChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
