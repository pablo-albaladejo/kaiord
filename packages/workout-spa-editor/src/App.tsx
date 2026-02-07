/* eslint-disable max-lines, max-lines-per-function */
import { useEffect, useState } from "react";
import "./App.css";
import {
  hasCompletedOnboarding,
  OnboardingTutorial,
  type TutorialStep,
} from "./components/organisms/OnboardingTutorial/OnboardingTutorial";
import { WelcomeSection } from "./components/pages/WelcomeSection";
import { WorkoutSection } from "./components/pages/WorkoutSection/WorkoutSection";
import { AppToastProvider } from "./components/providers/AppToastProvider";
import { MainLayout } from "./components/templates/MainLayout";
import { useAppHandlers } from "./hooks/useAppHandlers";
import { useDeleteCleanup } from "./hooks/useDeleteCleanup";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useWorkoutStore } from "./store/workout-store";
import {
  useCurrentWorkout,
  useSelectedStepId,
} from "./store/workout-store-selectors";
import { saveWorkout } from "./utils/save-workout";
import { parseStepId } from "./utils/step-id-parser";
import type { Workout } from "./types/krd";

// ============================================
// Tutorial Steps Configuration
// ============================================

const TUTORIAL_STEPS: Array<TutorialStep> = [
  {
    title: "Welcome to Workout Editor",
    description:
      "This tutorial will guide you through the key features of the Workout Editor. You can skip at any time or replay this tutorial from the Help section.",
    position: "center",
  },
  {
    title: "Create or Load Workouts",
    description:
      "Start by creating a new workout or loading an existing one. Supported formats include KRD, FIT, TCX, and ZWO.",
    position: "center",
  },
  {
    title: "Add Workout Steps",
    description:
      "Build your workout by adding steps with specific durations and target intensities. Each step can be customized for time, distance, or open duration.",
    position: "center",
  },
  {
    title: "Organize with Drag & Drop",
    description:
      "Reorder steps by dragging them, or use keyboard shortcuts (Alt+Up/Down) for quick adjustments.",
    position: "center",
  },
  {
    title: "Create Repetition Blocks",
    description:
      "Group multiple steps into repetition blocks to create interval workouts. Select steps and press Ctrl+G (Cmd+G on Mac).",
    position: "center",
  },
  {
    title: "Save Your Work",
    description:
      "Save your workout using Ctrl+S (Cmd+S on Mac) or the Save button. You can also save to your library for quick access later.",
    position: "center",
  },
];

/**
 * Main App Component
 *
 * Integrates file upload, workout state management, and workout display.
 * Implements Requirements 1, 7, 37.1, and 37.5:
 * - Requirement 1: Display workout structure in clear visual format
 * - Requirement 7: Load existing KRD files
 * - Requirement 37.1: Display onboarding tutorial on first visit
 * - Requirement 37.5: Allow skipping or replaying tutorial
 */
function App() {
  const currentWorkout = useCurrentWorkout();
  const selectedStepId = useSelectedStepId();
  const undo = useWorkoutStore((state) => state.undo);
  const redo = useWorkoutStore((state) => state.redo);
  const reorderStep = useWorkoutStore((state) => state.reorderStep);
  const reorderStepsInBlock = useWorkoutStore(
    (state) => state.reorderStepsInBlock
  );
  const copyStep = useWorkoutStore((state) => state.copyStep);
  const pasteStep = useWorkoutStore((state) => state.pasteStep);
  const canUndo = useWorkoutStore((state) => state.canUndo());
  const canRedo = useWorkoutStore((state) => state.canRedo());

  const {
    handleFileLoad,
    handleFileError,
    handleStepSelect,
    handleCreateWorkout,
  } = useAppHandlers();

  // Onboarding tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Check if user has completed onboarding on first mount
  // Skip tutorial in E2E testing environment
  useEffect(() => {
    // Disable tutorial during E2E tests
    // Check for Playwright's user agent or window property set by tests
    const isE2ETesting =
      window.location.search.includes("e2e=true") ||
      window.location.search.includes("skipTutorial=true") ||
      // @ts-expect-error - Playwright sets this property during tests
      window.__PLAYWRIGHT__ === true;

    if (isE2ETesting) {
      return;
    }

    const completed = hasCompletedOnboarding();
    if (!completed) {
      setShowTutorial(true);
    }
  }, []);

  // Cleanup expired deleted steps
  useDeleteCleanup();

  const workout = currentWorkout?.extensions?.structured_workout as
    | Workout
    | undefined;

  // Helper function to get step index from selected step ID
  // Returns the current array position of the selected step
  const getSelectedStepIndex = (): number | null => {
    if (!selectedStepId || !workout) return null;

    try {
      const parsed = parseStepId(selectedStepId);

      // Only handle main workout steps (not block steps) for keyboard shortcuts
      if (parsed.type !== "step" || parsed.stepIndex === undefined) {
        return null;
      }

      // For keyboard shortcuts, only handle main workout steps (no blockIndex)
      if (parsed.blockIndex !== undefined) {
        return null;
      }

      const stepIndex = parsed.stepIndex;

      // Find the current position of this step in the array
      // After reordering, stepIndex may not match array position
      const currentPosition = workout.steps.findIndex(
        (step) => "stepIndex" in step && step.stepIndex === stepIndex
      );

      if (currentPosition === -1) return null;

      return currentPosition;
    } catch {
      return null;
    }
  };

  useKeyboardShortcuts({
    onSave: () => {
      if (currentWorkout) {
        saveWorkout(currentWorkout);
      }
    },
    onUndo: () => {
      if (canUndo) {
        undo();
      }
    },
    onRedo: () => {
      if (canRedo) {
        redo();
      }
    },
    onMoveStepUp: () => {
      const stepIndex = getSelectedStepIndex();
      if (stepIndex !== null && stepIndex > 0) {
        reorderStep(stepIndex, stepIndex - 1);
      }
    },
    onMoveStepDown: () => {
      const stepIndex = getSelectedStepIndex();
      if (
        stepIndex !== null &&
        workout &&
        stepIndex < workout.steps.length - 1
      ) {
        reorderStep(stepIndex, stepIndex + 1);
      }
    },
    onCopy: () => {
      const stepIndex = getSelectedStepIndex();
      if (stepIndex !== null && workout) {
        const step = workout.steps[stepIndex];
        if (step && "stepIndex" in step) {
          copyStep(step.stepIndex);
        }
      }
    },
    onPaste: () => {
      const stepIndex = getSelectedStepIndex();
      if (stepIndex !== null) {
        pasteStep(stepIndex + 1);
      } else if (workout) {
        pasteStep(workout.steps.length);
      }
    },
  });

  return (
    <AppToastProvider>
      <MainLayout onReplayTutorial={() => setShowTutorial(true)}>
        <div className="space-y-6">
          {!workout && (
            <WelcomeSection
              onFileLoad={handleFileLoad}
              onFileError={handleFileError}
              onCreateWorkout={handleCreateWorkout}
            />
          )}
          {workout && currentWorkout && (
            <WorkoutSection
              workout={workout}
              krd={currentWorkout}
              selectedStepId={selectedStepId}
              onStepSelect={handleStepSelect}
              onStepReorder={reorderStep}
              onReorderStepsInBlock={reorderStepsInBlock}
            />
          )}
        </div>
      </MainLayout>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        steps={TUTORIAL_STEPS}
        open={showTutorial}
        onOpenChange={setShowTutorial}
      />
    </AppToastProvider>
  );
}

export default App;
