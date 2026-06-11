import { useEffect, useRef } from "react";

import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useAppHandlers } from "../../../hooks/use-app-handlers";
import { useSetUserPreferenceFields } from "../../../hooks/use-set-user-preference-fields";
import { useUserPreferences } from "../../../hooks/use-user-preferences";
import {
  useCreateEmptyWorkout,
  useCurrentWorkout,
} from "../../../store/selectors";
import { useWorkoutStore } from "../../../store/workout-store";
import type { Workout } from "../../../types/krd";
import type { Sport } from "../../../types/krd-core";
import { todayIsoDate } from "../../../utils/today-iso-date";
import { AiBanner } from "../../molecules/AiBanner/AiBanner";
import { useCoachingSidebar } from "../../organisms/CoachingSidebar/use-coaching-sidebar";
import { EditorBody } from "../../pages/EditorBody";
import { WorkoutSection } from "../../pages/WorkoutSection/WorkoutSection";
import { ScratchScheduleButton } from "./ScratchScheduleButton";

const DEFAULT_SCRATCH_SPORT: Sport = "cycling";
const DEFAULT_SCRATCH_NAME = "Untitled workout";

/**
 * Editor canvas for `/workout/new?source=scratch`.
 *
 * Composes the collapsed `AiBanner` above the editor body. The mount
 * effect seeds an empty in-memory workout via `createEmptyWorkout`
 * ONLY when `currentWorkout === null` — this guard prevents the
 * auto-init from overwriting a template just written by `LibraryPage`
 * before its `navigate("/workout/new?source=scratch")` (see plan A8).
 *
 * `startInEditMode` is wired to `autoCreatedRef`: only the auto-init
 * path opens `WorkoutHeader.MetadataEditMode` so a fresh scratch user
 * commits sport/name inline. Pre-populated workouts (library template
 * load, e2e seeds) already have sport/name and render in view mode.
 *
 * The initial sport is sourced from `userPreferences.lastScratchSport`
 * for the active profile when set; the on-save effect writes the
 * current sport back so the next scratch session pre-selects it.
 * Both reads/writes are gated on `autoCreatedRef.current` so library
 * / e2e-seeded workouts never leak into the preference.
 */
export function ScratchEditorSurface({ date }: { date: string | null }) {
  const currentWorkout = useCurrentWorkout();
  const createEmpty = useCreateEmptyWorkout();
  const selectedStepId = useWorkoutStore((s) => s.selectedStepId);
  const reorderStep = useWorkoutStore((s) => s.reorderStep);
  const reorderStepsInBlock = useWorkoutStore((s) => s.reorderStepsInBlock);
  const { handleStepSelect } = useAppHandlers();
  const sidebarData = useCoachingSidebar(null, undefined);
  const autoCreatedRef = useRef(false);
  const activeProfile = useActiveProfileLive();
  const profileId = activeProfile?.id ?? null;
  const prefs = useUserPreferences({ profileId, defaultView: "grid" });
  const setPrefs = useSetUserPreferenceFields(profileId);
  const initialSportRef = useRef<Sport | null>(null);

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
    createEmpty(DEFAULT_SCRATCH_NAME, sport);
  }, [currentWorkout, createEmpty, prefs, profileId, activeProfile]);

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;
  const currentSport = workout?.sport;

  useEffect(() => {
    if (!autoCreatedRef.current) return;
    if (!currentSport) return;
    if (currentSport === initialSportRef.current) return;
    initialSportRef.current = currentSport;
    void setPrefs({ lastScratchSport: currentSport });
  }, [currentSport, setPrefs]);

  return (
    <div className="space-y-6">
      <AiBanner />
      <ScratchScheduleButton date={date ?? todayIsoDate()} />
      {workout && currentWorkout && (
        <EditorBody sidebar={sidebarData}>
          <WorkoutSection
            workout={workout}
            krd={currentWorkout}
            selectedStepId={selectedStepId}
            onStepSelect={handleStepSelect}
            onStepReorder={reorderStep}
            onReorderStepsInBlock={reorderStepsInBlock}
            startInEditMode={autoCreatedRef.current}
          />
        </EditorBody>
      )}
    </div>
  );
}
