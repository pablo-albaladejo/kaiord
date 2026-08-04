import { FocusRegistryProvider } from "../../../contexts/focus-registry-context";
import { FocusTelemetryProvider } from "../../../contexts/focus-telemetry-context";
import {
  defaultFocusTelemetry,
  type FocusTelemetry,
} from "../../../store/providers/focus-telemetry";
import type { KRD, Workout } from "../../../types/krd";
import { StoreConfirmationModal } from "../../molecules/ConfirmationModal";
import { CreateRepetitionBlockDialog } from "../../molecules/CreateRepetitionBlockDialog/CreateRepetitionBlockDialog";
import { CoachMarkHost } from "../../organisms/CoachMark/CoachMarkHost";
import { CanvasShapeHead } from "./CanvasShapeHead";
import { EditorCanvas } from "./EditorCanvas";
import { useDiscardConfirmation } from "./use-discard-confirmation";
import { useWorkoutSectionFocus } from "./use-workout-section-focus";
import { useWorkoutSectionState } from "./useWorkoutSectionState";
import { WorkoutActions } from "./WorkoutActions";
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
  /** Forwarded to `WorkoutHeader` so scratch mode pre-opens
   *  `MetadataEditMode` for sport/name commit on first mount. */
  startInEditMode?: boolean;
};

/* One canvas, not five cards. The chart indexes the rows beneath it, the
   step form opens at the row it belongs to, and the only controls outside
   the canvas are the three that end the task. */
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
  const handleDiscard = useDiscardConfirmation();

  const renderStepForm = (itemId: string) => (
    <WorkoutSectionEditor
      itemId={itemId}
      selectedStepId={props.selectedStepId}
      isEditing={state.isEditing}
      selectedStep={state.selectedStep}
      onSave={state.handleSave}
      onCancel={state.handleCancel}
    />
  );

  return (
    <div className="flex flex-col gap-4" data-testid="workout-section">
      <WorkoutHeader
        workout={props.workout}
        krd={props.krd}
        titleRef={titleRef}
        startInEditMode={props.startInEditMode}
      />
      <EditorCanvas>
        <CanvasShapeHead
          workout={props.workout}
          selectedStepId={props.selectedStepId}
          onStepSelect={props.onStepSelect}
        />
        <WorkoutStepsListBinding
          workout={props.workout}
          selectedStepId={props.selectedStepId}
          state={state}
          editorRootRef={editorRootRef}
          addStepButtonRef={addStepButtonRef}
          renderStepForm={renderStepForm}
        />
      </EditorCanvas>
      <WorkoutActions krd={props.krd} onDiscard={handleDiscard} />
      <CreateRepetitionBlockDialog
        stepCount={state.blockStepCount}
        onConfirm={state.handleConfirmCreateBlock}
        onCancel={state.handleCancelCreateBlock}
        isOpen={state.showCreateBlockDialog}
      />
      <StoreConfirmationModal />
      {/* Inside `FocusRegistryProvider` — the mark anchors by item id. */}
      <CoachMarkHost />
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
