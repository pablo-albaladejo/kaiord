import type { Meta, StoryObj } from "@storybook/react";

import { StorageAvailabilityBanner } from "./StorageAvailabilityBanner";

const meta = {
  title: "Molecules/StorageAvailabilityBanner",
  component: StorageAvailabilityBanner,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof StorageAvailabilityBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The one state that renders: storage really failed, so anything the user
 * does in this session will not persist. The message names that exact
 * consequence rather than a generic "storage error".
 */
export const Failed: Story = {
  args: { status: "failed" },
};

/** Still probing. Silent — a spinner here would compete with the app chrome
 *  for a check that resolves almost instantly. */
export const Checking: Story = {
  args: { status: "checking" },
};

/** Storage is healthy. No permanent "storage OK" badge — silence when all
 *  is well. */
export const Ok: Story = {
  args: { status: "ok" },
};
