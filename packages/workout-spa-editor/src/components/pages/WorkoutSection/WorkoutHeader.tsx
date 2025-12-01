import { useState } from "react";
import { useClearWorkout, useUpdateWorkout } from "../../../store";
import type { KRD, Workout } from "../../../types/krd";
import { MetadataEditMode } from "./MetadataEditMode";
import { WorkoutActions } from "./WorkoutActions";
import { WorkoutTitle } from "./WorkoutTitle";

type WorkoutHeaderProps = {
  readonly workout: Workout;
  readonly krd: KRD;
};

export function WorkoutHeader({ workout, krd }: WorkoutHeaderProps) {
  const clearWorkout = useClearWorkout();
  const updateWorkout = useUpdateWorkout();
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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 kiroween:border-gray-700 kiroween:bg-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <WorkoutTitle workout={workout} onEdit={handleEditMetadata} />
        <WorkoutActions krd={krd} onDiscard={handleDiscard} />
      </div>
    </div>
  );
}
