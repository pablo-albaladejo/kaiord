import { useTranslate } from "../../../i18n/use-translate";
import { Card } from "../../atoms/Card";
import { ReadinessRing } from "../../molecules/ReadinessRing";
import { ReadinessStat } from "./ReadinessStat";
import type { ReadinessModel } from "./today-readiness";

export type ReadinessCardProps = {
  readiness: ReadinessModel;
};

export function ReadinessCard({ readiness }: ReadinessCardProps) {
  const t = useTranslate("daily");
  const { score, headline, rationale, hrv, sleep, battery } = readiness;

  return (
    <Card className="bg-primary-900 border-slate-800 p-4">
      <div className="flex items-center gap-4">
        <ReadinessRing
          score={score ?? 0}
          label={score === null ? t("readiness.noData") : t("readiness.ready")}
        />
        <div className="min-w-0">
          <p className="text-[16px] font-bold text-slate-50 m-0">{headline}</p>
          <p className="text-[13px] text-slate-400 m-0 mt-1">{rationale}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2 border-t border-slate-800 pt-4">
        <ReadinessStat metric={hrv} />
        <ReadinessStat metric={sleep} />
        <ReadinessStat metric={battery} />
      </div>
    </Card>
  );
}
