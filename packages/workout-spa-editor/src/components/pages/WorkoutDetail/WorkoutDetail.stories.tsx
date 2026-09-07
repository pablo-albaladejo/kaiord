import type { Meta, StoryObj } from "@storybook/react";

import WorkoutDetail from "./WorkoutDetail";

const meta = {
  title: "Pages/WorkoutDetail",
  component: WorkoutDetail,
  parameters: {
    layout: "fullscreen",
    route: "/workout/view/w1?from=calendar",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof WorkoutDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * WorkoutDetail loads its record with `useWorkoutDetailRecord(id)`, a
 * Dexie live query. Storybook's database is never seeded, so any `id`
 * resolves to "not found" — the same real state a reader hits from a
 * stale or copy-pasted link. This is the only state this page can reach
 * without seeding the database, which the design brief for this page
 * explicitly asks us not to fake.
 */
export const NotFound: Story = {
  args: { id: "w1" },
};
