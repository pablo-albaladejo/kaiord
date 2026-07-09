import { useTranslate } from "../../../i18n/use-translate";
import type { HealthStressRecord } from "../../../types/health/health-records";
import { HealthSourceBadge } from "./HealthSourceBadge";

type Props = {
  loading: boolean;
  records: HealthStressRecord[] | undefined;
};

export function TodayStressList({ loading, records }: Props) {
  const t = useTranslate("health");
  if (loading)
    return <p className="text-sm text-gray-600">{t("common.loading")}</p>;
  if (!records || records.length === 0) {
    return <p className="text-sm text-gray-600">{t("stress.empty")}</p>;
  }
  return (
    <ul className="space-y-1">
      {records.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-2 rounded border border-gray-200 p-2 text-sm dark:border-slate-800"
        >
          <span>
            {t("stress.avgPeak", {
              avg: r.krd.averageLevel,
              peak: r.krd.peakLevel,
            })}
          </span>
          <HealthSourceBadge sourceBridgeId={r.sourceBridgeId} />
        </li>
      ))}
    </ul>
  );
}
