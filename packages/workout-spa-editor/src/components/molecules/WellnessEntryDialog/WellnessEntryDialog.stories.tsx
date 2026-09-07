import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within } from "storybook/test";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import type { PersistencePort } from "../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { WellnessEntryDialog } from "./WellnessEntryDialog";

const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";
const DAY = "2026-05-04";

const seedActiveProfile = async (): Promise<PersistencePort> => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.setActiveId(PROFILE_ID);
  return persistence;
};

const meta = {
  title: "Molecules/WellnessEntryDialog",
  component: WellnessEntryDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  // WellnessEntryForm reads `usePersistence()` directly (save-wellness use
  // case). The global stack does provide one, but it is the real Dexie port
  // shared by every story; wrapping an in-memory instance per story keeps a
  // save here from landing in the browser's database and leaking into the
  // next one.
  decorators: [
    (Story, context) => {
      const persistence = context.loaded.persistence as PersistencePort;
      return (
        <ToastContextProvider>
          <PersistenceProvider persistence={persistence}>
            <Story />
          </PersistenceProvider>
        </ToastContextProvider>
      );
    },
  ],
} satisfies Meta<typeof WellnessEntryDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty form, dated. The accessible title includes the formatted date.
 */
export const Default: Story = {
  loaders: [async () => ({ persistence: await seedActiveProfile() })],
  args: {
    open: true,
    date: DAY,
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
};

/**
 * All four metric fields filled in.
 */
export const Filled: Story = {
  loaders: [async () => ({ persistence: await seedActiveProfile() })],
  args: {
    open: true,
    date: DAY,
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(await body.findByLabelText("Weight (kg)"), "72");
    await userEvent.type(body.getByLabelText("Sleep score"), "82");
    await userEvent.type(body.getByLabelText("HRV (ms)"), "65");
    await userEvent.type(body.getByLabelText("Steps"), "8400");
  },
};

/**
 * A save is in flight (the active-profile lookup never resolves) — the
 * Save button stays disabled.
 */
export const Saving: Story = {
  loaders: [
    async () => {
      const persistence = await seedActiveProfile();
      const gate = new Promise<void>(() => {
        // Deliberately never resolves — freezes the form mid-submit so
        // the disabled state is visible.
      });
      const originalGetActiveId = persistence.profiles.getActiveId;
      persistence.profiles.getActiveId = async () => {
        await gate;
        return originalGetActiveId();
      };
      return { persistence };
    },
  ],
  args: {
    open: true,
    date: DAY,
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.type(await body.findByLabelText("Weight (kg)"), "72");
    await userEvent.click(body.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      const button = body.getByRole("button", { name: "Save" });
      if (!button.hasAttribute("disabled")) {
        throw new Error("Save button is not disabled yet");
      }
    });
  },
};

/**
 * An empty `date` falls back to the generic "Add wellness" title
 * instead of a date-specific one.
 */
export const GenericTitle: Story = {
  loaders: [async () => ({ persistence: await seedActiveProfile() })],
  args: {
    open: true,
    date: "",
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
};
