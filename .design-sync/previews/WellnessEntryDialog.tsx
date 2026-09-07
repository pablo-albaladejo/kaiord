import { useEffect } from "react";

import { PersistenceProvider } from "@ds-stories/packages/workout-spa-editor/src/contexts/persistence-context";
import type { PersistencePort } from "@ds-stories/packages/workout-spa-editor/src/ports/persistence-port";
import { createInMemoryPersistence } from "@ds-stories/packages/workout-spa-editor/src/test-utils/in-memory-persistence";
import { WellnessEntryDialog } from "@ds-stories/packages/workout-spa-editor/src/components/molecules/WellnessEntryDialog/WellnessEntryDialog";

/**
 * `WellnessEntryForm` (rendered inside this dialog) reads `usePersistence()`
 * directly. `DesignSystemProviders` deliberately does not supply one — the
 * real Dexie port is out of bounds for the card harness — so each export
 * below wraps an in-memory one locally, seeded inline instead of via the
 * story's `loaders`. `ToastContextProvider` is already supplied by
 * `DesignSystemProviders` and is not re-wrapped here.
 *
 * `Filled`/`Saving` reach their state the same way the story's `play`
 * function does — by typing into (and, for `Saving`, clicking) the real
 * rendered controls — since the field values live in `WellnessEntryForm`'s
 * own `useState` and cannot be pushed in as props.
 */
const PROFILE_ID = "00000000-0000-4000-8000-0000000000a1";
const DAY = "2026-05-04";

const seedActiveProfile = (): PersistencePort => {
  const persistence = createInMemoryPersistence();
  void persistence.profiles.setActiveId(PROFILE_ID);
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

function clickButton(text: string) {
  const button = Array.from(document.querySelectorAll("button")).find(
    (el) => el.textContent?.trim() === text
  );
  button?.click();
}

const noopOpenChange = () => {};

function SeededDialog({
  persistence,
  date = DAY,
}: {
  persistence: PersistencePort;
  date?: string;
}) {
  return (
    <PersistenceProvider persistence={persistence}>
      <WellnessEntryDialog open date={date} onOpenChange={noopOpenChange} />
    </PersistenceProvider>
  );
}

/** Empty form, dated. The accessible title includes the formatted date. */
export const Default = () => <SeededDialog persistence={seedActiveProfile()} />;

/** All four metric fields filled in. */
export const Filled = () => {
  useEffect(() => {
    fillByLabel("Weight (kg)", "72");
    fillByLabel("Sleep score", "82");
    fillByLabel("HRV (ms)", "65");
    fillByLabel("Steps", "8400");
  }, []);
  return <SeededDialog persistence={seedActiveProfile()} />;
};

/**
 * A save is in flight (the active-profile lookup never resolves) — the
 * Save button stays disabled.
 */
export const Saving = () => {
  const persistence = seedActiveProfile();
  // Deliberately never resolves — freezes the form mid-submit so the
  // disabled state is visible.
  persistence.profiles.getActiveId = () => new Promise<string | null>(() => {});

  useEffect(() => {
    fillByLabel("Weight (kg)", "72");
    clickButton("Save");
  }, []);

  return <SeededDialog persistence={persistence} />;
};

/**
 * An empty `date` falls back to the generic "Add wellness" title instead
 * of a date-specific one.
 */
export const GenericTitle = () => (
  <SeededDialog persistence={seedActiveProfile()} date="" />
);
