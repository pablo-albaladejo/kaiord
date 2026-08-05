import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useTranslate } from "../../../i18n/use-translate";
import { humanizeSport } from "../../../lib/format-sport";
import type { Workout } from "../../../types/krd";
import { WorkoutPreview } from "../../molecules/WorkoutPreview";
import { WorkoutStats } from "../../organisms/WorkoutStats/WorkoutStats";
import { buildFtpProvenance } from "./workout-ftp-provenance";

type CanvasShapeHeadProps = {
  workout: Workout;
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
};

/**
 * The canvas head: the shape of the session, and the number every target in
 * it derives from. The reason goes above what it justifies (principle 8), so
 * the FTP line sits over the chart rather than under the list.
 */
export function CanvasShapeHead({
  workout,
  selectedStepId,
  onStepSelect,
}: CanvasShapeHeadProps) {
  const t = useTranslate("editor");
  const commonT = useTranslate("common");
  const profile = useActiveProfileLive()?.profile;
  const provenance = buildFtpProvenance(
    profile,
    workout.sport,
    humanizeSport(workout.sport),
    t,
    commonT,
    new Date()
  );

  return (
    <div className="flex flex-col gap-3 border-b border-edge-soft px-4 pb-3.5 pt-4 sm:px-[18px]">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {t("shape.heading")}
        </h3>
        <p
          className="m-0 text-[12.5px] text-ink-muted"
          data-testid="canvas-ftp-provenance"
        >
          {provenance}
        </p>
      </div>
      <WorkoutPreview
        workout={workout}
        selectedStepId={selectedStepId}
        onStepSelect={onStepSelect}
        height={76}
      />
      <WorkoutStats workout={workout} />
    </div>
  );
}
