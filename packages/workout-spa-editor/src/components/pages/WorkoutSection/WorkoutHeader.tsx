import type { RefObject } from "react";
import { useState } from "react";

import {
  useCanRedo,
  useCanUndo,
  useRedo,
  useUndo,
  useUpdateWorkout,
} from "../../../store";
import type { KRD, Workout } from "../../../types/krd";
import { UndoRedoButtons } from "../../molecules/UndoRedoButtons";
import { MetadataEditMode } from "./MetadataEditMode";
import { WorkoutTitle } from "./WorkoutTitle";

type WorkoutHeaderProps = {
  readonly workout: Workout;
  readonly krd: KRD;
  /** Ref to the `<h2>` title for §7.5 heading-fallback focus. */
  readonly titleRef?: RefObject<HTMLHeadingElement | null>;
  /** When true, the header mounts in `MetadataEditMode` so the user
   *  commits `sport`/`name` before the first step is added. Used by
   *  `ScratchEditorSurface` for `/workout/new?source=scratch`. */
  readonly startInEditMode?: boolean;
};

export function WorkoutHeader({
  workout,
  krd,
  titleRef,
  startInEditMode = false,
}: WorkoutHeaderProps) {
  const updateWorkout = useUpdateWorkout();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useUndo();
  const redo = useRedo();
  const [isEditingMetadata, setIsEditingMetadata] = useState(startInEditMode);

  const handleEditMetadata = () => {
    setIsEditingMetadata(true);
  };

  const handleSaveMetadata = (updatedKrd: KRD) => {
    updateWorkout(updatedKrd);
    setIsEditingMetadata(false);
  };

  const handleCancelMetadata = () => {
    setIsEditingMetadata(false);
  };

  if (isEditingMetadata) {
    return (
      <MetadataEditMode
        krd={krd}
        onSave={handleSaveMetadata}
        onCancel={handleCancelMetadata}
      />
    );
  }

  // No card of its own: the title names the canvas below it, and undo/redo
  // sit beside it because they act on the whole workout, not on a step.
  return (
    <div className="flex flex-wrap items-start gap-3">
      <WorkoutTitle
        workout={workout}
        onEdit={handleEditMetadata}
        titleRef={titleRef}
      />
      <UndoRedoButtons
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
    </div>
  );
}
