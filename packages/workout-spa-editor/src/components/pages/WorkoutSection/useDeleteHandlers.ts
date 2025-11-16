import { useCallback, useState } from "react";
import { useDeleteStep } from "../../../store/workout-store-selectors";

export const useDeleteHandlers = () => {
  const deleteStep = useDeleteStep();
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);

  const handleDeleteRequest = useCallback((stepIndex: number) => {
    setStepToDelete(stepIndex);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (stepToDelete !== null) {
      deleteStep(stepToDelete);
      setStepToDelete(null);
    }
  }, [stepToDelete, deleteStep]);

  const handleDeleteCancel = useCallback(() => {
    setStepToDelete(null);
  }, []);

  return {
    handleDeleteRequest,
    handleDeleteConfirm,
    handleDeleteCancel,
    stepToDelete,
  };
};
