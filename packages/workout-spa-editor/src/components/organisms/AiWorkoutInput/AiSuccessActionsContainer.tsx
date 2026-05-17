import { useAiRuntimeStore } from "../../../store/ai-runtime-store";
import { useClearWorkout, useCurrentWorkout } from "../../../store/selectors";
import { AiSuccessActions } from "../../molecules/AiSuccessActions/AiSuccessActions";

export type AiSuccessActionsContainerProps = {
  onRegenerate: () => void;
};

export function AiSuccessActionsContainer({
  onRegenerate,
}: AiSuccessActionsContainerProps) {
  const setGeneration = useAiRuntimeStore((s) => s.setGeneration);
  const currentWorkout = useCurrentWorkout();
  const clearWorkout = useClearWorkout();

  if (!currentWorkout) return null;

  const handleEdit = () => setGeneration({ status: "idle" });
  const handleDiscard = () => {
    clearWorkout();
    setGeneration({ status: "idle" });
  };

  return (
    <AiSuccessActions
      workout={currentWorkout}
      onRegenerate={onRegenerate}
      onEdit={handleEdit}
      onDiscard={handleDiscard}
    />
  );
}
