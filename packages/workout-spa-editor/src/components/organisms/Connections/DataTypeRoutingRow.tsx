import type { DataTypeRoutingRow as RoutingRow } from "../../../application/connections/data-type-routing";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";
import { originLabel, originNote, originSourceId } from "./routing-copy";
import { RoutingExportTargets } from "./RoutingExportTargets";
import { RoutingFreshness } from "./RoutingFreshness";

type Props = {
  row: RoutingRow;
  lastSyncedAt: ReadonlyMap<string, string | undefined>;
};

const CAPTION =
  "text-[10.5px] font-bold uppercase tracking-wider text-ink-muted";

/* A ring, not a border tint: `border-edge` and an amber border are the same
   property at the same specificity, so which wins would depend on stylesheet
   order (same reasoning as ConnectionSourceCard's attention ring). */
const STALLED_RING = "ring-1 ring-amber-500/40";

/**
 * "Also sent to" renders only when an export route could exist at all. Eleven
 * of the thirteen types have no export capability in the registry, so the
 * design's "Nowhere" would there be describing an absence of something that
 * was never possible rather than a route the user has not switched on.
 */
export function DataTypeRoutingRow({ row, lastSyncedAt }: Props) {
  const t = useTranslate("connections");
  const sourceId = originSourceId(row.origin);
  const note = originNote(row.origin, t);
  const stalled = row.origin.kind === "rankedUnavailable";

  return (
    <div
      data-testid={`routing-row-${row.dataType}`}
      data-origin={row.origin.kind}
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-edge bg-surface px-4 py-3 ${stalled ? STALLED_RING : ""}`}
    >
      <div className="min-w-0 flex-[1_1_180px]">
        <div className="text-[14px] font-bold text-ink-strong">
          {t(`dataTypes.${row.dataType}`)}
        </div>
        <div className="text-[12px] text-ink-muted">
          {t(`dataTypeHints.${row.dataType}`)}
        </div>
      </div>

      <div className="flex flex-[1_1_220px] flex-wrap items-center gap-2">
        <span className={CAPTION}>{t("routing.from")}</span>
        <Pill
          tone={sourceId === undefined ? "neutral" : "accent"}
          data-testid={`routing-from-${row.dataType}`}
        >
          {originLabel(row.origin, t)}
        </Pill>
        {sourceId !== undefined && (
          <RoutingFreshness
            sourceId={sourceId}
            at={lastSyncedAt.get(sourceId)}
          />
        )}
        {note !== undefined && (
          <span
            className="text-[12px] text-ink-muted"
            data-testid={`routing-note-${row.dataType}`}
          >
            {note}
          </span>
        )}
      </div>

      {row.exportable && (
        <RoutingExportTargets dataType={row.dataType} sentTo={row.sentTo} />
      )}
    </div>
  );
}
