import { useState } from "react";
import { MetadataEditMode } from "./MetadataEditMode";
import { WorkoutActions } from "./WorkoutActions";
import { WorkoutTitle } from "./WorkoutTitle";
import {
  useCanRedo,
  useCanUndo,
  useClearWorkout,
  useRedo,
  useUndo,
  useUpdateWorkout,
} from "../../../store";
import type { KRD, Workout } from "../../../types/krd";

type WorkoutHeaderProps = {
  readonly workout: Workout;
  readonly krd: KRD;
};

export function WorkoutHeader({ workout, krd }: WorkoutHeaderProps) {
  const clearWorkout = useClearWorkout();
  const updateWorkout = useUpdateWorkout();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useUndo();
  const redo = useRedo();
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  const handleDiscard = () => {
    clearWorkout();
  };

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <WorkoutTitle workout={workout} onEdit={handleEditMetadata} />
        <WorkoutActions
          krd={krd}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onDiscard={handleDiscard}
        />
      </div>
    </div>
  );
}
