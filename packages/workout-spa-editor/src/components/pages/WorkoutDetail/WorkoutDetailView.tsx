import type { ReviewModel } from "../../../lib/workout-review";
import type { WorkoutRecord } from "../../../types/calendar-record";
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

const buildSummary = (model: ReviewModel) => [
  { icon: "clock" as const, value: model.duration, label: "Duration" },
  { icon: "flame" as const, value: String(model.tss), label: "TSS" },
  { icon: "zap" as const, value: model.load, label: "Load" },
];

/** Read-only workout detail sheet with header, summary, structure, and footer. */
export function WorkoutDetailView({
  record,
  model,
  onBack,
  onEdit,
}: WorkoutDetailViewProps) {
  const tag = record.tags[0];
  const title = model?.title ?? "Workout";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 bg-surface-deep p-4">
      <WorkoutDetailHeader onBack={onBack} />
      <WorkoutDetailTitle sport={record.sport} title={title} tag={tag} />
      {model && (
        <>
          <SummaryStrip items={buildSummary(model)} />
          <WorkoutDetailStructure dist={model.dist} steps={model.steps} />
        </>
      )}
      <div className="flex-1" />
      <WorkoutDetailFooter workout={record} onEdit={onEdit} />
    </div>
  );
}
