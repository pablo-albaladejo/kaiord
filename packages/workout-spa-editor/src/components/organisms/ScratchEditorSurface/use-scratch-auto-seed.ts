import { useEffect, useRef } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import type { Translate } from "../../../i18n/use-translate";
import {
  useCreateEmptyWorkout,
  useCurrentWorkout,
} from "../../../store/selectors";
import type { Workout } from "../../../types/krd";
import type { Sport } from "../../../types/krd-core";

const DEFAULT_SCRATCH_SPORT: Sport = "cycling";

/**
 * Owns the scratch auto-init lifecycle for `ScratchEditorSurface`.
 *
 * The mount effect seeds an empty in-memory workout via `createEmptyWorkout`
 * ONLY when `currentWorkout === null` — this guard prevents the auto-init from
 * overwriting a template just written by `LibraryPage` before its
 * `navigate("/workout/new?source=scratch")` (see plan A8).
 *
 * The returned `startInEditMode` is wired to `autoCreatedRef`: only the
 * auto-init path opens `WorkoutHeader.MetadataEditMode` so a fresh scratch
 * user commits sport/name inline. Pre-populated workouts (library template
 * load, e2e seeds) already have sport/name and render in view mode.
 *
 * The initial sport is sourced from `userPreferences.lastScratchSport` for the
 * active profile when set; the on-save effect writes the current sport back so
 * the next scratch session pre-selects it. Both reads/writes are gated on
 * `autoCreatedRef.current` so library / e2e-seeded workouts never leak.
 */
export function useScratchAutoSeed(t: Translate): { startInEditMode: boolean } {
  const currentWorkout = useCurrentWorkout();
  const createEmpty = useCreateEmptyWorkout();
  const activeProfile = useActiveProfileLive();
  const profileId = activeProfile?.id ?? null;
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);
  const autoCreatedRef = useRef(false);
  const initialSportRef = useRef<Sport | null>(null);
  const untitledName = t("scratch.untitledName");

  useEffect(() => {
    if (currentWorkout !== null) return;
    // Wait for the active-profile live query to resolve. Then, when a
    // profile is active, also wait for its userPreferences row so the
    // seed picks `lastScratchSport`. With no active profile the prefs
    // query returns undefined permanently — fall through to the
    // hard-coded default so the editor still mounts.
    if (activeProfile === undefined) return;
    if (profileId !== null && prefs === undefined) return;
    autoCreatedRef.current = true;
    const sport = prefs?.lastScratchSport ?? DEFAULT_SCRATCH_SPORT;
    initialSportRef.current = sport;
    createEmpty(untitledName, sport);
  }, [
    currentWorkout,
    createEmpty,
    prefs,
    profileId,
    activeProfile,
    untitledName,
  ]);

  const currentSport = (
    currentWorkout?.extensions?.structured_workout as Workout | undefined
  )?.sport;

  useEffect(() => {
    if (!autoCreatedRef.current) return;
    if (!currentSport) return;
    if (currentSport === initialSportRef.current) return;
    initialSportRef.current = currentSport;
    void setPrefs({ lastScratchSport: currentSport });
  }, [currentSport, setPrefs]);

  return { startInEditMode: autoCreatedRef.current };
}
