import type { WorkoutStep } from "../../../types/krd";
import { Icon } from "../../atoms/Icon/Icon";
import { formatDuration } from "./format-duration";
import { formatTarget } from "./format-target";
import { getDurationIcon, getTargetIcon } from "./icons";

type StepDetailsProps = {
  step: WorkoutStep;
};

export const StepDetails = ({ step }: StepDetailsProps) => {
  const targetIcon = getTargetIcon(step.targetType);
  const durationIcon = getDurationIcon(step.durationType);

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={durationIcon} size="sm" color="secondary" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatDuration(step)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Icon icon={targetIcon} size="sm" color="secondary" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatTarget(step)}
        </span>
      </div>
    </>
  );
};
