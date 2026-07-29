import type { DataTypeRoutingRow as RoutingRow } from "../../../application/connections/data-type-routing";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";
import { originLabel, originSourceId, sourceName } from "./routing-copy";
import { RoutingFreshness } from "./RoutingFreshness";

type Props = {
  row: RoutingRow;
  lastSyncedAt: ReadonlyMap<string, string | undefined>;
};

const CAPTION =
  "text-[10.5px] font-bold uppercase tracking-wider text-ink-muted";

/**
 * "Also sent to" renders only when an export route could exist at all. Eleven
 * of the thirteen types have no export capability in the registry, so the
 * design's "Nowhere" would there be describing an absence of something that
 * was never possible rather than a route the user has not switched on.
 */
export function DataTypeRoutingRow({ row, lastSyncedAt }: Props) {
  const t = useTranslate("connections");
  const sourceId = originSourceId(row.origin);

  return (
    <div
      data-testid={`routing-row-${row.dataType}`}
      data-origin={row.origin.kind}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-edge bg-surface px-4 py-3"
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
          tone={row.origin.kind === "none" ? "neutral" : "accent"}
          data-testid={`routing-from-${row.dataType}`}
          title={
            row.origin.kind === "unranked"
              ? t("routing.unrankedHint")
              : undefined
          }
        >
          {originLabel(row.origin, t)}
        </Pill>
        {sourceId !== undefined && (
          <RoutingFreshness
            sourceId={sourceId}
            at={lastSyncedAt.get(sourceId)}
          />
        )}
      </div>

      {row.exportable && (
        <div className="flex flex-[1_1_180px] flex-wrap items-center gap-2">
          <span className={CAPTION}>{t("routing.sentTo")}</span>
          {row.sentTo.length === 0 ? (
            <span className="text-[12.5px] text-ink-muted">
              {t("routing.nowhere")}
            </span>
          ) : (
            row.sentTo.map((id) => (
              <Pill key={id} tone="neutral">
                {sourceName(id)}
              </Pill>
            ))
          )}
        </div>
      )}
    </div>
  );
}
