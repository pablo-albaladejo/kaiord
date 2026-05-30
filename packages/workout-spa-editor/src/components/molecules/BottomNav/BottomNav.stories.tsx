import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

import { BottomNav } from "./BottomNav";

/**
 * Floating glass bottom navigation shown on mobile viewports. Four tabs
 * (Today, Library, Athlete, Settings) plus a raised center FAB that
 * navigates to `/workout/new`. Active state tracks the current route.
 */
const meta = {
  title: "Molecules/BottomNav",
  component: BottomNav,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof BottomNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const withRoute = (path: string): Decorator => {
  const { hook } = memoryLocation({ path });
  return (Story) => (
    <Router hook={hook}>
      <div className="relative h-64 bg-slate-900">
        <Story />
      </div>
    </Router>
  );
};

export const TodayActive: Story = {
  decorators: [withRoute("/calendar")],
};

export const LibraryActive: Story = {
  decorators: [withRoute("/library")],
};

export const SettingsActive: Story = {
  decorators: [withRoute("/settings")],
};
