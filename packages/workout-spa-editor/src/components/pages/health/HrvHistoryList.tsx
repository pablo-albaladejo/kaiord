import { useTranslate } from "../../../i18n/use-translate";
import type { HealthHrvRecord } from "../../../types/health/health-records";
import { HealthSourceBadge } from "./HealthSourceBadge";

type Props = {
  loading: boolean;
  records: HealthHrvRecord[] | undefined;
};

export function HrvHistoryList({ loading, records }: Props) {
  const t = useTranslate("health");
  if (loading)
    return <p className="text-sm text-ink-muted">{t("common.loading")}</p>;
  if (!records || records.length === 0) {
    return <p className="mb-4 text-sm text-ink-muted">{t("hrv.empty")}</p>;
  }
  return (
    <ul className="m-0 mb-4 list-none rounded-2xl border border-edge-soft bg-surface p-0 px-4">
      {records.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-2 border-b border-edge-soft py-3 text-sm last:border-b-0"
        >
          <span className="tabular-nums text-ink-body">{r.date}</span>
          <span className="flex items-center gap-2">
            <span className="font-medium tabular-nums slashed-zero text-ink-strong">
              {r.krd.rMSSD} ms
            </span>
            <HealthSourceBadge sourceBridgeId={r.sourceBridgeId} />
          </span>
        </li>
      ))}
    </ul>
  );
}
