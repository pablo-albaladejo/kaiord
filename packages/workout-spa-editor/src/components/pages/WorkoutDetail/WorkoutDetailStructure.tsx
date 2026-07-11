import { useTranslate } from "../../../i18n/use-translate";
import type { ReviewModel } from "../../../lib/workout-review";
import { Card } from "../../atoms/Card";
import { ZoneDist } from "../../molecules/ZoneDist";
import { StepList } from "../../organisms/StepList";

const ZONE_BAR_HEIGHT = 10;

export type WorkoutDetailStructureProps = {
  dist: ReviewModel["dist"];
  steps: ReviewModel["steps"];
};

/** Structure card: eyebrow, time-in-zone bar, and the step list. */
export function WorkoutDetailStructure({
  dist,
  steps,
}: WorkoutDetailStructureProps) {
  const t = useTranslate("workout-detail");
  return (
    <Card className="border-edge bg-surface p-4">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {t("structure.eyebrow")}
      </p>
      <ZoneDist dist={dist} height={ZONE_BAR_HEIGHT} className="mb-3" />
      <StepList steps={steps} />
    </Card>
  );
}
