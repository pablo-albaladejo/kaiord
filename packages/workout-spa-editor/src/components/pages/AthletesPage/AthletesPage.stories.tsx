import type { Meta, StoryObj } from "@storybook/react";

import AthletesPage from "./AthletesPage";

const meta = {
  title: "Pages/AthletesPage",
  component: AthletesPage,
  parameters: { layout: "fullscreen", route: "/athletes" },
  tags: ["autodocs"],
} satisfies Meta<typeof AthletesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The page reads the athletes from Dexie, which Storybook never seeds: this
 * is a fresh browser before the default athlete exists, with the create form
 * and the file import ready.
 */
export const NoAthletes: Story = {};
