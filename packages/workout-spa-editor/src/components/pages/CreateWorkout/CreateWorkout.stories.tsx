import type { Meta, StoryObj } from "@storybook/react";
import { fn, screen, userEvent, waitFor } from "storybook/test";

import CreateWorkout from "./CreateWorkout";

const meta = {
  title: "Pages/CreateWorkout",
  component: CreateWorkout,
  parameters: { layout: "fullscreen", route: "/workout/new" },
  tags: ["autodocs"],
} satisfies Meta<typeof CreateWorkout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * CreateWorkout always mounts in its "input" phase, and with Storybook's
 * Dexie database unseeded there is no AI provider configured — so the
 * generator hero is replaced by `CreateProvidersEmpty`, the real state a
 * brand-new install shows before connecting a provider in Settings. The
 * "generating" and "result" phases both require a live provider call, so
 * they cannot be reached without one.
 */
export const NoProviderConfigured: Story = {
  args: { onClose: fn(), onSaved: fn() },
};

/**
 * The sport segmented control is real, local state — switching it is a
 * genuine interaction, not faked data.
 */
export const RunningSelected: Story = {
  args: { onClose: fn(), onSaved: fn() },
  play: async () => {
    const button = await waitFor(() =>
      screen.getByRole("radio", { name: "Running" })
    );
    await userEvent.click(button);
  },
};
