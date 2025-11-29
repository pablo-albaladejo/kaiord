import { CopyButton } from "./CopyButton";
import { DeleteButton } from "./DeleteButton";
import { DuplicateButton } from "./DuplicateButton";

export type StepCardActionsProps = {
  stepIndex: number;
  onDelete?: (stepIndex: number) => void;
  onDuplicate?: (stepIndex: number) => void;
  onCopy?: (stepIndex: number) => void;
};

export function StepCardActions({
  stepIndex,
  onDelete,
  onDuplicate,
  onCopy,
}: StepCardActionsProps) {
  return (
    <>
      {onDelete && <DeleteButton stepIndex={stepIndex} onDelete={onDelete} />}
      {onCopy && <CopyButton stepIndex={stepIndex} onCopy={onCopy} />}
      {onDuplicate && (
        <DuplicateButton stepIndex={stepIndex} onDuplicate={onDuplicate} />
      )}
    </>
  );
}
