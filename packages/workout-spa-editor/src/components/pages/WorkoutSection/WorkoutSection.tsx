import { FocusRegistryProvider } from "../../../contexts/focus-registry-context";
import { FocusTelemetryProvider } from "../../../contexts/focus-telemetry-context";
import {
  defaultFocusTelemetry,
  type FocusTelemetry,
} from "../../../store/providers/focus-telemetry";
import type { KRD, Workout } from "../../../types/krd";
import { StoreConfirmationModal } from "../../molecules/ConfirmationModal";
import { CreateRepetitionBlockDialog } from "../../molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog";
import { WorkoutPreview } from "../../molecules/WorkoutPreview";
import { WorkoutStats } from "../../organisms/WorkoutStats/WorkoutStats";
import { useWorkoutSectionFocus } from "./use-workout-section-focus";
import { useWorkoutSectionState } from "./useWorkoutSectionState";
import { WorkoutHeader } from "./WorkoutHeader";
import { WorkoutSectionEditor } from "./WorkoutSectionEditor";
import { WorkoutStepsListBinding } from "./WorkoutStepsListBinding";

export type WorkoutSectionProps = {
  workout: Workout;
  krd: KRD;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
  onStepReorder?: (activeIndex: number, overIndex: number) => void;
  onReorderStepsInBlock?: (
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) => void;
  /** Optional telemetry provider. Defaults to a no-op. Production deployments
   *  pass a Sentry/Datadog adapter here without touching focus-rule call sites. */
  focusTelemetry?: FocusTelemetry;
};

function WorkoutSectionInner(props: WorkoutSectionProps) {
  const state = useWorkoutSectionState(
    props.workout,
    props.krd,
    props.selectedStepId,
    props.onStepSelect,
    props.onStepReorder,
    props.onReorderStepsInBlock
  );

  const { editorRootRef, addStepButtonRef, titleRef } =
    useWorkoutSectionFocus();

  return (
    <div className="space-y-6" data-testid="workout-section">
      <WorkoutHeader
        workout={props.workout}
        krd={props.krd}
        titleRef={titleRef}
      />
      <WorkoutStats workout={props.workout} />
      <WorkoutPreview
        workout={props.workout}
        selectedStepId={props.selectedStepId}
        onStepSelect={props.onStepSelect}
      />
      <WorkoutSectionEditor
        isEditing={state.isEditing}
        selectedStep={state.selectedStep}
        onSave={state.handleSave}
        onCancel={state.handleCancel}
      />
      <WorkoutStepsListBinding
        workout={props.workout}
        selectedStepId={props.selectedStepId}
        state={state}
        editorRootRef={editorRootRef}
        addStepButtonRef={addStepButtonRef}
      />
      <CreateRepetitionBlockDialog
        stepCount={state.blockStepCount}
        onConfirm={state.handleConfirmCreateBlock}
        onCancel={state.handleCancelCreateBlock}
        isOpen={state.showCreateBlockDialog}
      />
      <StoreConfirmationModal />
    </div>
  );
}

export function WorkoutSection(props: WorkoutSectionProps) {
  const { focusTelemetry = defaultFocusTelemetry, ...innerProps } = props;
  // Both registry and telemetry providers sit at the WorkoutSection boundary:
  // `FocusRegistryProvider` for DOM-element lookups by ItemId;
  // `FocusTelemetryProvider` for the observability seam.
  return (
    <FocusTelemetryProvider value={focusTelemetry}>
      <FocusRegistryProvider>
        <WorkoutSectionInner {...innerProps} />
      </FocusRegistryProvider>
    </FocusTelemetryProvider>
  );
}
