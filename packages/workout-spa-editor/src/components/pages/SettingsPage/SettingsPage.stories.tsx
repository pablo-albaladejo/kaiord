import type { Meta, StoryObj } from "@storybook/react";
import { Route } from "wouter";

import SettingsPage from "./SettingsPage";

const meta = {
  title: "Pages/SettingsPage",
  component: SettingsPage,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  // SettingsPage reads its open tab via `useParams<{ section? }>()`, which
  // only resolves inside a matching `<Route>` ancestor (wouter's params
  // context is populated by route matching, not by the current location
  // alone). Production wires the same `/settings/:section?` route in
  // AppRoutes.tsx, so this mirrors real wiring rather than faking one.
  decorators: [
    (Story) => (
      <Route path="/settings/:section?">
        <Story />
      </Route>
    ),
  ],
} satisfies Meta<typeof SettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The index edits General (language, units, notifications, theme) in place,
 * then lists one row per page in the rail's order, each carrying its
 * current value on the right, not just a label. No Dexie seed is needed:
 * this is the real shell, reading its own live values.
 */
export const Index: Story = {
  parameters: { route: "/settings" },
};

/**
 * A detail section replaces the index with the section rail + panel split.
 * AI providers is where "provenance is part of the value" shows up most:
 * every model binding names where it came from.
 */
export const AiSection: Story = {
  parameters: { route: "/settings/ai" },
};

/**
 * The Connections tab is where synced-source provenance lives — bridge
 * discovery state resolves for real here, there is just nothing connected
 * under Storybook, which is the honest first-run reading of this panel.
 */
export const ConnectionsSection: Story = {
  parameters: { route: "/settings/connections" },
};

/** General: language, units, notifications and theme for this device. */
export const GeneralSection: Story = {
  parameters: { route: "/settings/general" },
};

/** Data & backup: export, import, and deleting everything in this browser. */
export const DataSection: Story = {
  parameters: { route: "/settings/data" },
};
