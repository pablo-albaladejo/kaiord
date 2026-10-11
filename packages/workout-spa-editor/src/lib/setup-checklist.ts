/**
 * Pure model behind the "Getting set up" checklist.
 *
 * Four onboarding steps, each derived from real persisted state rather than
 * from a "seen the tour" flag. Every step is reachable by hand in this
 * browser alone: integrations are optional, so a step that only a bridge or
 * a provider could tick would leave the checklist forever short of 100%. The hook layer (`use-setup-checklist`) reads
 * the state; this module owns the item vocabulary, the hrefs and the
 * threshold predicate, so all of it is unit-testable without Dexie.
 */

import { withOrigin } from "../routing/with-origin";
import type { Profile } from "../types/profile";

export type SetupChecklistItemId =
  "create-workout" | "set-thresholds" | "log-wellness" | "save-to-library";

export type SetupChecklistItem = {
  readonly id: SetupChecklistItemId;
  readonly titleKey: string;
  readonly hintKey: string;
  readonly done: boolean;
  readonly href: string;
};

export type SetupChecklistSignals = {
  readonly hasWorkout: boolean;
  readonly hasThreshold: boolean;
  readonly hasWellness: boolean;
  readonly hasTemplate: boolean;
};

/**
 * "Zones are configured" is answered by a THRESHOLD, never by the zone
 * arrays. A brand-new profile is seeded with `DEFAULT_POWER_ZONES` /
 * `DEFAULT_HEART_RATE_ZONES` (see `types/profile-defaults.ts`), so a
 * `zones.length > 0` test would tick on day zero for every user. Any of
 * `ftp` / `lthr` / `thresholdPace` on any sport counts, because power is
 * only meaningful for cycling and running — swimmers set a threshold pace.
 */
export const hasAnyThreshold = (profile: Profile | null): boolean =>
  Object.values(profile?.sportZones ?? {}).some((config) => {
    const thresholds = config?.thresholds;
    if (!thresholds) return false;
    return (
      thresholds.ftp != null ||
      thresholds.lthr != null ||
      thresholds.thresholdPace != null
    );
  });

export const buildSetupChecklistItems = (
  signals: SetupChecklistSignals
): readonly SetupChecklistItem[] => [
  {
    id: "create-workout",
    titleKey: "items.createWorkout.title",
    hintKey: "items.createWorkout.hint",
    done: signals.hasWorkout,
    // Only the editor parses `?from=`; the other two targets ignore it and
    // `/calendar` redirects to the current week, dropping the query entirely.
    href: withOrigin("/workout/new", "daily"),
  },
  {
    id: "set-thresholds",
    titleKey: "items.setThresholds.title",
    hintKey: "items.setThresholds.hint",
    done: signals.hasThreshold,
    href: "/athlete",
  },
  {
    id: "log-wellness",
    titleKey: "items.logWellness.title",
    hintKey: "items.logWellness.hint",
    done: signals.hasWellness,
    href: "/health",
  },
  {
    id: "save-to-library",
    titleKey: "items.saveToLibrary.title",
    hintKey: "items.saveToLibrary.hint",
    done: signals.hasTemplate,
    href: "/library",
  },
];
