import type { Intensity } from "../../../types/krd";
import { Badge } from "../../atoms/Badge/Badge";

type StepHeaderProps = {
  stepIndex: number;
  intensity: Intensity | "other";
};

export const StepHeader = ({ stepIndex, intensity }: StepHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
        Step {stepIndex + 1}
      </span>
      <Badge variant={intensity} size="sm">
        {intensity}
      </Badge>
    </div>
  );
};
