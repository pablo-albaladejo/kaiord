/**
 * Editor New Workout Section
 *
 * Shows AI input + welcome section for creating new workouts.
 */

import { lazy, Suspense } from "react";

import { useSettingsDialog } from "../../contexts";
import { useAppHandlers } from "../../hooks/useAppHandlers";
import type { Workout } from "../../types/krd";
import { WelcomeSection } from "./WelcomeSection";

const AiWorkoutInput = lazy(() =>
  import("../organisms/AiWorkoutInput/AiWorkoutInput").then((m) => ({
    default: m.AiWorkoutInput,
  }))
);

type EditorNewWorkoutProps = {
  workout: Workout | undefined;
};

export function EditorNewWorkout({ workout }: EditorNewWorkoutProps) {
  const { show: settingsShow } = useSettingsDialog();
  const { handleFileLoad, handleFileError, handleCreateWorkout } =
    useAppHandlers();

  return (
    <>
      <Suspense fallback={null}>
        <AiWorkoutInput onSettingsClick={settingsShow} />
      </Suspense>
      {!workout && (
        <WelcomeSection
          onFileLoad={handleFileLoad}
          onFileError={handleFileError}
          onCreateWorkout={handleCreateWorkout}
        />
      )}
    </>
  );
}
