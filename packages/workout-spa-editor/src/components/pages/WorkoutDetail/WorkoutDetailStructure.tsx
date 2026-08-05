import { useActiveProfileLive } from "../../../hooks/use-active-profile-live";
import { useThresholdProvenance } from "../../../hooks/use-threshold-provenance";
import { useTranslate } from "../../../i18n/use-translate";
import type { ReviewModel } from "../../../lib/workout-review";
import { Card } from "../../atoms/Card";
import { ZoneDist } from "../../molecules/ZoneDist";
import { StepList } from "../../organisms/StepList";

const ZONE_BAR_HEIGHT = 10;

export type WorkoutDetailStructureProps = {
  dist: ReviewModel["dist"];
  steps: ReviewModel["steps"];
  sport: string;
};

/** Structure card: eyebrow, time-in-zone bar, the step list, and the threshold
    those step ranges were derived from. */
export function WorkoutDetailStructure({
  dist,
  steps,
  sport,
}: WorkoutDetailStructureProps) {
  const t = useTranslate("workout-detail");
  const profile = useActiveProfileLive()?.profile ?? null;
  const provenance = useThresholdProvenance(profile, sport);

  return (
    <Card className="border-edge bg-surface p-4">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        {t("structure.eyebrow")}
      </p>
      <ZoneDist dist={dist} height={ZONE_BAR_HEIGHT} className="mb-3" />
      <StepList steps={steps} />
      {provenance && (
        <p className="mt-3 text-[12.5px] tabular-nums text-ink-muted">
          {t("structure.targetsFrom", provenance)}
        </p>
      )}
    </Card>
  );
}
