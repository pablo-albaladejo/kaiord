import { type Translate, useTranslate } from "../../../i18n/use-translate";
import type { ReviewModel } from "../../../lib/workout-review";
import { hardestZone } from "../../../lib/workout-review/zone-emphasis";
import type { WorkoutRecord } from "../../../types/calendar-record";
import type { SummaryItem } from "../../molecules/SummaryStrip";
import { SummaryStrip } from "../../molecules/SummaryStrip";
import { WorkoutDetailFooter } from "./WorkoutDetailFooter";
import { WorkoutDetailHeader } from "./WorkoutDetailHeader";
import { WorkoutDetailStructure } from "./WorkoutDetailStructure";
import { WorkoutDetailTitle } from "./WorkoutDetailTitle";

export type WorkoutDetailViewProps = {
  record: WorkoutRecord;
  model: ReviewModel | null;
  onBack: () => void;
  onEdit: () => void;
};

/* The third metric is the hardest zone the session reaches, said with a swatch
   AND the word. It replaces the old "Load" tile, which rendered
   `loadLabel(tss)` — a second name for the number in the tile beside it. A
   session with no classifiable structure has no hardest zone, and shows two. */
const buildSummary = (
  model: ReviewModel,
  t: Translate,
  tZones: Translate
): SummaryItem[] => {
  const items: SummaryItem[] = [
    { icon: "clock", value: model.duration, label: t("summary.duration") },
    { icon: "flame", value: String(model.tss), label: t("summary.tss") },
  ];
  const zone = hardestZone(model.dist);
  if (zone !== null) {
    items.push({
      icon: "zap",
      zone,
      value: tZones(`zoneName.z${zone}`),
      label: t("summary.hardestZone"),
    });
  }
  return items;
};

/** Read-only workout detail sheet with header, summary, structure, and footer. */
export function WorkoutDetailView({
  record,
  model,
  onBack,
  onEdit,
}: WorkoutDetailViewProps) {
  const t = useTranslate("workout-detail");
  const tZones = useTranslate("zones");
  const tag = record.tags[0];
  const title = model?.title ?? t("fallbackTitle");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-surface-deep p-4">
      <WorkoutDetailHeader onBack={onBack} />
      <WorkoutDetailTitle sport={record.sport} title={title} tag={tag} />
      {model && (
        <>
          <SummaryStrip items={buildSummary(model, t, tZones)} />
          <WorkoutDetailStructure
            dist={model.dist}
            steps={model.steps}
            sport={record.sport}
          />
        </>
      )}
      <div className="flex-1" />
      <WorkoutDetailFooter workout={record} onEdit={onEdit} />
    </div>
  );
}
