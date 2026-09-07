import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, waitFor, within } from "storybook/test";

import { PersistenceProvider } from "../../../contexts/persistence-context";
import { ToastContextProvider } from "../../../contexts/ToastContext";
import type { PersistencePort } from "../../../ports/persistence-port";
import { createInMemoryPersistence } from "../../../test-utils/in-memory-persistence";
import { GoalSetupDialog } from "./GoalSetupDialog";

// Same profile shape GoalSetupForm.test.tsx seeds: BMR estimation needs
// height + birthDate + sex + bodyWeight, otherwise the preview stays
// gated (see resolve-goal-maintenance.ts).
const PROFILE_ID = "profile-goal-story";
const TODAY = "2026-06-21";

const seedAthleteProfile = async (): Promise<PersistencePort> => {
  const persistence = createInMemoryPersistence();
  await persistence.profiles.put({
    id: PROFILE_ID,
    name: "Athlete",
    bodyWeight: 70,
    height: 178,
    birthDate: "1990-06-21",
    sex: "male",
    sportZones: {},
    linkedAccounts: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });
  return persistence;
};

const meta = {
  title: "Molecules/GoalSetupDialog",
  component: GoalSetupDialog,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  // GoalSetupForm reads `usePersistence()` directly (energy-goal baseline +
  // save). The global stack provides one, but it is the real Dexie port shared
  // by every story; an in-memory instance per story keeps a save here out of
  // the browser's database.
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
} satisfies Meta<typeof GoalSetupDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty form with a resolved baseline — "Start weight (kg)" is
 * pre-filled from the profile's body weight, target fields are blank.
 */
export const Default: Story = {
  loaders: [async () => ({ persistence: await seedAthleteProfile() })],
  args: {
    open: true,
    profileId: PROFILE_ID,
    today: TODAY,
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
};

/**
 * No profile record exists for `profileId` — the baseline never
 * resolves, so "Start weight (kg)" stays blank instead of pre-filled.
 */
export const NoBaselineProfile: Story = {
  loaders: [async () => ({ persistence: createInMemoryPersistence() })],
  args: {
    open: true,
    profileId: "unknown-profile",
    today: TODAY,
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
};

/**
 * A moderate, safe-paced goal — filling target weight + date renders
 * the live preview panel (daily delta + target kcal) with no cap
 * warning.
 */
export const WithPreview: Story = {
  loaders: [async () => ({ persistence: await seedAthleteProfile() })],
  args: {
    open: true,
    profileId: PROFILE_ID,
    today: TODAY,
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const targetWeight = await body.findByLabelText("Target weight (kg)");
    await userEvent.type(targetWeight, "65");
    const targetDate = body.getByLabelText("Target date");
    await userEvent.type(targetDate, "2026-09-21");
    await waitFor(() => body.getByTestId("goal-preview"));
  },
};

/**
 * An aggressive goal (15kg in one month) exceeds the safe pace cap —
 * the preview shows the clamp warning plus the override checkbox.
 */
export const CapWarning: Story = {
  loaders: [async () => ({ persistence: await seedAthleteProfile() })],
  args: {
    open: true,
    profileId: PROFILE_ID,
    today: TODAY,
    onOpenChange: (open) => console.log("onOpenChange", open),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const targetWeight = await body.findByLabelText("Target weight (kg)");
    await userEvent.type(targetWeight, "55");
    const targetDate = body.getByLabelText("Target date");
    await userEvent.type(targetDate, "2026-07-21");
    await waitFor(() => body.getByTestId("goal-cap-warning"));
  },
};
