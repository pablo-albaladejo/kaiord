import { useLocation } from "wouter";

import { adjustWithAiHref } from "../../../routing/adjust-with-ai-href";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { PushButton } from "../../molecules/PushButton";

export type WorkoutDetailFooterProps = {
  workout: WorkoutRecord | undefined;
  onEdit: () => void;
};

/** Sticky action bar: ghost "Edit" + "Adjust with AI" + "Push to Garmin". */
export function WorkoutDetailFooter({
  workout,
  onEdit,
}: WorkoutDetailFooterProps) {
  const [, navigate] = useLocation();
  return (
    <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-slate-800 bg-surface-deep px-4 py-3">
      <Button variant="ghost" onClick={onEdit}>
        <Icon icon={ICON_MAP.edit} size="sm" color="inherit" />
        Edit
      </Button>
      {workout && (
        <Button
          variant="ghost"
          onClick={() => navigate(adjustWithAiHref(workout))}
        >
          <Icon icon={ICON_MAP.chat} size="sm" color="inherit" />
          Adjust with AI
        </Button>
      )}
      <div className="flex-1">
        <PushButton workout={workout} full />
      </div>
    </div>
  );
}
