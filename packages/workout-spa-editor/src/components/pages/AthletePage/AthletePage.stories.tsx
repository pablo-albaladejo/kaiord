import type { Meta, StoryObj } from "@storybook/react";

import AthletePage from "./AthletePage";

const meta = {
  title: "Pages/AthletePage",
  component: AthletePage,
  parameters: { layout: "fullscreen", route: "/athlete" },
  tags: ["autodocs"],
} satisfies Meta<typeof AthletePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * AthletePage pulls its data from `useActiveProfileLive`, and Storybook's
 * Dexie database is never seeded — so this resolves the same way a brand
 * new install does: no active profile. That is a real first-run state, not
 * a fake one, and it is the only state this page can show without props.
 */
export const NoActiveProfile: Story = {};
