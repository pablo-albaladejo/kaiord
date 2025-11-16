import { DeleteButton } from "./DeleteButton";
import { DuplicateButton } from "./DuplicateButton";

export type StepCardActionsProps = {
  stepIndex: number;
  onDelete?: (stepIndex: number) => void;
  onDuplicate?: (stepIndex: number) => void;
};

export function StepCardActions({
  stepIndex,
  onDelete,
  onDuplicate,
}: StepCardActionsProps) {
  return (
    <>
      {onDelete && <DeleteButton stepIndex={stepIndex} onDelete={onDelete} />}
      {onDuplicate && (
        <DuplicateButton stepIndex={stepIndex} onDuplicate={onDuplicate} />
      )}
    </>
  );
}
