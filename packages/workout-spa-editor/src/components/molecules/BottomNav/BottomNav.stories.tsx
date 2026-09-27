import type { Decorator, Meta, StoryObj } from "@storybook/react";

import { BottomNav } from "./BottomNav";

/**
 * Floating glass bottom navigation shown on mobile viewports. Five tabs
 * (Daily, Calendar, Library, Nutrition, Athlete) around a raised center FAB
 * that navigates to `/workout/new`. Active state tracks the current route,
 * set per story through the global `parameters.route`.
 */

// The nav is `position: fixed`. The transform makes this frame its
// containing block, so the nav sits inside the frame and inside the story's
// capture instead of pinning to the viewport outside it. The dark backdrop
// stands in for page content: the nav is glass and reads as nothing on white.
const withFrame: Decorator = (Story) => (
  <div
    className="relative h-64 bg-slate-900"
    style={{ transform: "translateZ(0)" }}
  >
    <Story />
  </div>
);

const meta = {
  title: "Molecules/BottomNav",
  component: BottomNav,
  decorators: [withFrame],
  parameters: { layout: "fullscreen", route: "/daily" },
  tags: ["autodocs"],
} satisfies Meta<typeof BottomNav>;

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

export const NutritionActive: Story = {
  parameters: { route: "/nutrition" },
};

export const AthleteActive: Story = {
  parameters: { route: "/athlete" },
};
