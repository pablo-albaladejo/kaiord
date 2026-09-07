import type { Meta, StoryObj } from "@storybook/react";

import { StatusHeader } from "./StatusHeader";

/**
 * StatusHeader takes no props — the nav entries, the account avatar and the
 * source-health pill all come from live hooks (`useActiveProfileLive`,
 * `useConnectionAttention`, bridge discovery) reading Dexie/IndexedDB and a
 * discovery singleton. Storybook's IndexedDB starts empty and unseeded, so
 * every story below renders the same real, reachable state: no active
 * profile and no source-health pill (every consumer of
 * `useConnectionAttention` treats `null` as healthy and renders nothing for
 * it — "silence when all is well" applies here too, not just to the banner
 * components). What genuinely varies story to story is which nav entry is
 * active, driven by the route — the same technique `BottomNav.stories.tsx`
 * uses.
 */
const meta = {
  title: "Molecules/StatusHeader",
  component: StatusHeader,
  parameters: { layout: "padded", route: "/daily" },
  tags: ["autodocs"],
} satisfies Meta<typeof StatusHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DailyActive: Story = {
  parameters: { route: "/daily" },
};

export const CalendarActive: Story = {
  parameters: { route: "/calendar" },
};

export const LibraryActive: Story = {
  parameters: { route: "/library" },
};

export const TrendsActive: Story = {
  parameters: { route: "/health" },
};
