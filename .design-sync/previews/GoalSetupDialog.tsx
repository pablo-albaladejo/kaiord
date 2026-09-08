import { useEffect } from "react";

import { PersistenceProvider } from "../../packages/workout-spa-editor/src/contexts/persistence-context";
import type { PersistencePort } from "../../packages/workout-spa-editor/src/ports/persistence-port";
import { createInMemoryPersistence } from "../../packages/workout-spa-editor/src/test-utils/in-memory-persistence";
import { GoalSetupDialog } from "../../packages/workout-spa-editor/src/components/molecules/GoalSetupDialog/GoalSetupDialog";

/**
 * `GoalSetupForm` (rendered inside this dialog) reads `usePersistence()`
 * directly. `DesignSystemProviders` deliberately does not supply one — the
 * real Dexie port is out of bounds for the card harness — so each export
 * below wraps an in-memory one locally. `GoalSetupDialog.stories.tsx` seeds
 * its profile via a Storybook `loaders` entry, which the card harness never
 * runs; seeded inline here instead, before the dialog mounts.
 *
 * `ToastContextProvider` is already supplied by `DesignSystemProviders` and
 * is not re-wrapped here.
 *
 * `WithPreview`/`CapWarning` reach their state the same way the story's
 * `play` function does — by typing into the real rendered inputs — since
 * the target weight/date live in `GoalSetupForm`'s own `useState` and
 * cannot be pushed in as props. The card harness does not run `play`
 * either, so this preview replays the same interaction itself via a native
 * `input` event dispatch, which is what `userEvent.type` produces under
 * the hood.
 */
const PROFILE_ID = "profile-goal-story";
const TODAY = "2026-06-21";

// Same profile shape GoalSetupForm.test.tsx seeds: BMR estimation needs
// height + birthDate + sex + bodyWeight, otherwise the preview stays gated
// (see resolve-goal-maintenance.ts).
const seedAthleteProfile = (): PersistencePort => {
  const persistence = createInMemoryPersistence();
  void persistence.profiles.put({
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

function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function fillByLabel(labelText: string, value: string) {
  const label = Array.from(document.querySelectorAll("label")).find(
    (el) => el.textContent?.trim() === labelText
  );
  const input = label?.control;
  if (input instanceof HTMLInputElement) setNativeValue(input, value);
}

const noopOpenChange = () => {};

function SeededDialog({ persistence }: { persistence: PersistencePort }) {
  return (
    <PersistenceProvider persistence={persistence}>
      <GoalSetupDialog
        open
        profileId={PROFILE_ID}
        today={TODAY}
        onOpenChange={noopOpenChange}
      />
    </PersistenceProvider>
  );
}

/**
 * Empty form with a resolved baseline — "Start weight (kg)" is pre-filled
 * from the profile's body weight, target fields are blank.
 */
export const Default = () => (
  <SeededDialog persistence={seedAthleteProfile()} />
);

/**
 * No profile record exists for `profileId` — the baseline never resolves,
 * so "Start weight (kg)" stays blank instead of pre-filled.
 */
export const NoBaselineProfile = () => {
  const persistence = createInMemoryPersistence();
  return (
    <PersistenceProvider persistence={persistence}>
      <GoalSetupDialog
        open
        profileId="unknown-profile"
        today={TODAY}
        onOpenChange={noopOpenChange}
      />
    </PersistenceProvider>
  );
};

/**
 * A moderate, safe-paced goal — filling target weight + date renders the
 * live preview panel (daily delta + target kcal) with no cap warning.
 */
export const WithPreview = () => {
  useEffect(() => {
    fillByLabel("Target weight (kg)", "65");
    fillByLabel("Target date", "2026-09-21");
  }, []);
  return <SeededDialog persistence={seedAthleteProfile()} />;
};

/**
 * An aggressive goal (15kg in one month) exceeds the safe pace cap — the
 * preview shows the clamp warning plus the override checkbox.
 */
export const CapWarning = () => {
  useEffect(() => {
    fillByLabel("Target weight (kg)", "55");
    fillByLabel("Target date", "2026-07-21");
  }, []);
  return <SeededDialog persistence={seedAthleteProfile()} />;
};
