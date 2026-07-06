import { healthSourceBadge } from "./health-source-badge";

type Props = {
  sourceBridgeId: string | undefined;
  usedFallback?: boolean;
};

/* Provenance visible per health record (F1.1 stamps every write with
   sourceBridgeId). "usedFallback" marks a record the multi-source
   resolver picked because the preferred source had none that day. */
export function HealthSourceBadge({ sourceBridgeId, usedFallback }: Props) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-400">
      {healthSourceBadge(sourceBridgeId)}
      {usedFallback && <span title="Fallback active">↩</span>}
    </span>
  );
}
