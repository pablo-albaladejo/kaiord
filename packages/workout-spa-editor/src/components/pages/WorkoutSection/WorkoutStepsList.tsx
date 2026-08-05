import type { ReactNode, RefObject } from "react";

import type { Workout } from "../../../types/krd";
import { EditorContextMenu } from "../../organisms/EditorContextMenu";
import { WorkoutList } from "../../organisms/WorkoutList/WorkoutList";
import { WorkoutStepsListActions } from "./WorkoutStepsListActions";

type WorkoutStepsListProps = {
  readonly workout: Workout;
  readonly selectedStepId: string | null;
  readonly selectedStepIds: readonly string[];
  readonly onStepSelect: (stepId: string) => void;
  readonly onBlockSelect?: (blockId: string) => void;
  readonly onToggleStepSelection: (stepId: string) => void;
  readonly onStepDelete: (stepIndex: number) => void;
  readonly onStepDuplicate: (stepIndex: number) => void;
  readonly onStepCopy: (stepIndex: number) => void;
  readonly onStepPaste?: () => void;
  readonly onStepReorder: (activeIndex: number, overIndex: number) => void;
  readonly onReorderStepsInBlock?: (
    blockId: string,
    activeIndex: number,
    overIndex: number
  ) => void;
  readonly onAddStep: () => void;
  readonly onCreateRepetitionBlock: () => void;
  readonly onCreateEmptyRepetitionBlock: () => void;
  readonly onEditRepetitionBlock: (
    blockId: string,
    repeatCount: number
  ) => void;
  readonly onAddStepToRepetitionBlock: (blockId: string) => void;
  readonly onUngroupRepetitionBlock?: (blockId: string) => void;
  readonly onDeleteRepetitionBlock?: (blockId: string) => void;
  readonly onDuplicateStepInRepetitionBlock: (
    blockId: string,
    stepIndex: number
  ) => void;
  readonly onDeleteStepInRepetitionBlock: (
    blockId: string,
    stepIndex: number
  ) => void;
  /**
   * Ref to the outer editor root. `useFocusAfterAction` (§7.4) scopes
   * its overlay MutationObserver to this element, and `isFormFieldFocused`
   * (§7.3) uses it to decide whether `document.activeElement` is
   * "inside the editor" for the form-field guard.
   */
  readonly editorRootRef?: RefObject<HTMLDivElement | null>;
  /** Ref to the Add Step button — §7.5 empty-state focus target. */
  readonly addStepButtonRef?: RefObject<HTMLButtonElement | null>;
  /** The step form, rendered under the row it edits. */
  readonly renderStepForm?: (itemId: string) => ReactNode;
};

export function WorkoutStepsList(props: WorkoutStepsListProps) {
  const {
    selectedStepIds,
    onStepPaste,
    editorRootRef,
    addStepButtonRef,
    onCreateRepetitionBlock,
    onCreateEmptyRepetitionBlock,
    renderStepForm,
    ...workoutListProps
  } = props;
  const hasMultipleSelection = selectedStepIds.length >= 2;

  // No card chrome here any more: `EditorCanvas` owns the one border on
  // the screen, and the rows sit directly under the chart that indexes them.
  return (
    <EditorContextMenu>
      <div ref={editorRootRef} data-testid="editor-root">
        <div className="px-4 py-4 sm:px-[18px]">
          <WorkoutList
            {...workoutListProps}
            selectedStepIds={selectedStepIds}
            renderAfterItem={renderStepForm}
          />
        </div>
        <WorkoutStepsListActions
          hasMultipleSelection={hasMultipleSelection}
          selectedStepCount={selectedStepIds.length}
          onCreateRepetitionBlock={onCreateRepetitionBlock}
          onCreateEmptyRepetitionBlock={onCreateEmptyRepetitionBlock}
          onAddStep={props.onAddStep}
          onPasteStep={onStepPaste}
          addStepButtonRef={addStepButtonRef}
        />
      </div>
    </EditorContextMenu>
  );
}
