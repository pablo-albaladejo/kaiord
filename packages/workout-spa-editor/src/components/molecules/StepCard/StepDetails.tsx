import { useUnits } from "../../../contexts/units-context";
import { useTranslate } from "../../../i18n/use-translate";
import { useCurrentWorkout } from "../../../store/selectors";
import type { WorkoutStep } from "../../../types/krd";
import { Icon } from "../../atoms/Icon/Icon";
import { formatDuration } from "./format-duration";
import { formatTarget } from "./format-target";
import { getDurationIcon, getTargetIcon } from "./icons";

type StepDetailsProps = {
  step: WorkoutStep;
};

export const StepDetails = ({ step }: StepDetailsProps) => {
  const units = useUnits();
  // A swim is paced per 100 m, like the step editor types it.
  const sport = useCurrentWorkout()?.metadata.sport;
  const t = useTranslate("editor");
  const hrUnit = useTranslate("common")("units.hr");
  const targetIcon = getTargetIcon(step.targetType);
  const durationIcon = getDurationIcon(step.durationType);

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Icon icon={durationIcon} size="sm" color="secondary" />
        <span className="text-sm text-ink-body">{formatDuration(step, t)}</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Icon icon={targetIcon} size="sm" color="secondary" />
        <span className="text-sm text-ink-body">
          {formatTarget(step, units, t, sport, hrUnit)}
        </span>
      </div>
    </>
  );
};
