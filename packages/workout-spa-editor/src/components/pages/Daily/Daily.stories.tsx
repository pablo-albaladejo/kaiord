import type { Meta, StoryObj } from "@storybook/react";

import Daily from "./Daily";

const meta = {
  title: "Pages/Daily",
  component: Daily,
  parameters: { layout: "fullscreen", route: "/daily" },
  tags: ["autodocs"],
} satisfies Meta<typeof Daily>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * No active profile and an unseeded Dexie database — the real first-run
 * state under Storybook: nothing planned, no readiness data yet, no
 * trends. Every card on the page renders its own honest empty state
 * rather than nothing at all.
 */
export const Today: Story = {};

/**
 * Same empty data, focused on a day other than today via `?date=`. The
 * header swaps its title for the weekday name and reveals "Back to today" —
 * a real state driven by the route, not by faked data.
 */
export const PastDayFocus: Story = {
  parameters: { route: "/daily?date=2026-08-20" },
};
