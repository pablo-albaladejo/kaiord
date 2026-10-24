import { useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { LifecycleChip } from "../CardShell/LifecycleChip";

export const DialogMeta = ({
  activity,
  duration,
}: {
  activity: CoachingActivity;
  duration: string | undefined;
}) => {
  const t = useTranslate("coaching");
  return (
    <div
      data-testid="coaching-dialog-meta"
      className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
    >
      <span aria-hidden="true">{activity.sport.icon}</span>
      <span>{activity.sport.label}</span>
      {duration && <span>· {duration}</span>}
      <span className="ml-auto flex items-center gap-2">
        <LifecycleChip label={t(`status.${activity.status}`)} />
        <span className="rounded bg-danger-bg px-1 py-0.5 text-[10px] font-bold text-danger-text">
          {activity.sourceBadge}
        </span>
      </span>
    </div>
  );
};
