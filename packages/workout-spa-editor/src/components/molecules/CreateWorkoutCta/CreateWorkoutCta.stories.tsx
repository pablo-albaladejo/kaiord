import type { Meta, StoryObj } from "@storybook/react";

import { CreateWorkoutCta } from "./CreateWorkoutCta";

const meta = {
  title: "Molecules/CreateWorkoutCta",
  component: CreateWorkoutCta,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The `cta` (magenta) action row entry each route hosts to create a new workout, carrying `origin` so closing the editor returns here. Hidden below `md` — the floating create FAB covers that breakpoint instead.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CreateWorkoutCta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FromLibrary: Story = {
  args: { origin: "library" },
  parameters: { route: "/library" },
};

export const FromDaily: Story = {
  args: { origin: "daily" },
  parameters: { route: "/daily" },
};

export const FromCalendarWeek: Story = {
  name: "From a calendar week (carries the week back)",
  args: { origin: "calendar", week: "2026-W32" },
  parameters: { route: "/calendar" },
};
