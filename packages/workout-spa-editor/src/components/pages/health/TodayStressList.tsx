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
    return <p className="text-sm text-ink-muted">{t("common.loading")}</p>;
  if (!records || records.length === 0) {
    return <p className="text-sm text-ink-muted">{t("stress.empty")}</p>;
  }
  return (
    <ul className="m-0 list-none rounded-2xl border border-edge-soft bg-surface p-0 px-4">
      {records.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-2 border-b border-edge-soft py-3 text-sm last:border-b-0"
        >
          <span className="tabular-nums text-ink-body">
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
