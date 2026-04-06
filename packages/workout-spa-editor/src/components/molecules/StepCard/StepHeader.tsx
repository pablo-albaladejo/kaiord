import type { Intensity } from "../../../types/krd";
import { Badge } from "../../atoms/Badge/Badge";

type StepHeaderProps = {
  stepName: string;
  intensity: Intensity | "other";
};

export const StepHeader = ({ stepName, intensity }: StepHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
        {stepName}
      </span>
      <Badge variant={intensity} size="sm">
        {intensity}
      </Badge>
    </div>
  );
};
