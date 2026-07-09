import { useTranslate } from "../../../i18n/use-translate";
import type { ActiveSport } from "../../../lib/athlete";
import type { ReviewModel } from "../../../lib/workout-review";
import { Button } from "../../atoms/Button";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { SummaryStrip } from "../../molecules/SummaryStrip";
import { ZoneDist } from "../../molecules/ZoneDist";
import { StepList } from "../../organisms/StepList";
import { CreateResultHeader } from "./CreateResultHeader";
import { CreateSheetHeader } from "./CreateSheetHeader";

const ZONE_BAR_HEIGHT = 10;

export type CreateResultPhaseProps = {
  sport: ActiveSport;
  model: ReviewModel;
  saving: boolean;
  onRedo: () => void;
  onSave: () => void;
  onClose: () => void;
};

export function CreateResultPhase({
  sport,
  model,
  saving,
  onRedo,
  onSave,
  onClose,
}: CreateResultPhaseProps) {
  const t = useTranslate("create-workout");
  const summary = [
    {
      icon: "clock" as const,
      value: model.duration,
      label: t("summary.duration"),
    },
    {
      icon: "flame" as const,
      value: String(model.tss),
      label: t("summary.tss"),
    },
    { icon: "zap" as const, value: model.load, label: t("summary.load") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <CreateSheetHeader title={t("sheet.reviewSession")} onClose={onClose} />
      <CreateResultHeader sport={sport} title={model.title} />
      <SummaryStrip items={summary} />
      <div className="rounded-[16px] border border-slate-800 bg-surface p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {t("result.timeInZone")}
        </p>
        <ZoneDist dist={model.dist} height={ZONE_BAR_HEIGHT} className="mb-3" />
        <StepList steps={model.steps} />
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onRedo}>
          <Icon icon={ICON_MAP.sync} size="sm" color="inherit" />
          {t("result.redo")}
        </Button>
        <Button className="flex-grow" loading={saving} onClick={onSave}>
          <Icon icon={ICON_MAP.check} size="sm" color="inherit" />
          {t("result.savePush")}
        </Button>
      </div>
    </div>
  );
}
