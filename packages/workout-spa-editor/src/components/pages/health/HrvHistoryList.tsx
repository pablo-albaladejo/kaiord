import type { HealthHrvRecord } from "../../../types/health/health-records";
import { HealthSourceBadge } from "./HealthSourceBadge";

type Props = {
  loading: boolean;
  records: HealthHrvRecord[] | undefined;
};

export function HrvHistoryList({ loading, records }: Props) {
  if (loading) return <p className="text-sm text-gray-600">Loading…</p>;
  if (!records || records.length === 0) {
    return <p className="mb-4 text-sm text-gray-600">No HRV records yet.</p>;
  }
  return (
    <ul className="mb-4 space-y-1">
      {records.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between gap-2 rounded border border-gray-200 p-2 text-sm dark:border-slate-800"
        >
          <span>{r.date}</span>
          <span className="flex items-center gap-2">
            <span className="font-mono">{r.krd.rMSSD} ms</span>
            <HealthSourceBadge sourceBridgeId={r.sourceBridgeId} />
          </span>
        </li>
      ))}
    </ul>
  );
}
