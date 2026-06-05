import { useLocation } from "wouter";

import type { ReviewModel } from "../../../lib/workout-review";
import { withOrigin } from "../../../routing/with-origin";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { Button } from "../../atoms/Button";
import { Card } from "../../atoms/Card";
import { Icon, ICON_MAP, SPORT_ICON_NAME } from "../../atoms/Icon";
import { PushButton } from "../../molecules/PushButton";
import { ZoneDist } from "../../molecules/ZoneDist";
import { PlannedMeta } from "./PlannedMeta";

export type PlannedSessionCardProps = {
  workout: WorkoutRecord;
  review: ReviewModel;
};

const SPORT_FALLBACK = "bike" as const;

export function PlannedSessionCard({
  workout,
  review,
}: PlannedSessionCardProps) {
  const [, navigate] = useLocation();
  const sportIcon =
    SPORT_ICON_NAME[workout.sport as keyof typeof SPORT_ICON_NAME] ??
    SPORT_FALLBACK;

  return (
    <Card className="bg-primary-900 border-slate-800 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
          <Icon icon={ICON_MAP[sportIcon]} size="md" color="inherit" />
        </div>
        <div className="min-w-0">
          <p className="text-[16px] font-bold text-slate-50 m-0 truncate">
            {review.title}
          </p>
          <p className="text-[13px] text-slate-400 m-0 truncate">
            {review.load} session
          </p>
        </div>
      </div>
      <div className="mt-4">
        <PlannedMeta
          items={[
            { icon: "clock", value: review.duration, label: "Duration" },
            { icon: "zap", value: `${review.tss}`, label: "TSS" },
            { icon: "flame", value: review.load, label: "Load" },
          ]}
        />
      </div>
      <ZoneDist dist={review.dist} className="mt-4" height={10} />
      <div className="mt-4 flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() =>
            navigate(withOrigin(`/workout/view/${workout.id}`, "today"))
          }
        >
          Details
          <Icon icon={ICON_MAP.chevR} size="sm" color="inherit" />
        </Button>
        <PushButton workout={workout} />
      </div>
    </Card>
  );
}
