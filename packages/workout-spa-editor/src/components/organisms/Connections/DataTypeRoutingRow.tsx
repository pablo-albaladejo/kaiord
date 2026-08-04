import type { DataTypeRouteToggle } from "../../../application/connections/data-type-route-toggles";
import type { DataTypeRoutingRow as RoutingRow } from "../../../application/connections/data-type-routing";
import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { canChooseSource } from "../../../application/connections/source-of-truth-options";
import { useTranslate } from "../../../i18n/use-translate";
import { RoutingExportTargets } from "./RoutingExportTargets";
import { RoutingOriginLine } from "./RoutingOriginLine";
import { RoutingSourcePicker } from "./RoutingSourcePicker";

type Props = {
  row: RoutingRow;
  profileId: string;
  lastSyncedAt: ReadonlyMap<string, string | undefined>;
  options: SourceOfTruthOptions | undefined;
  toggles: readonly DataTypeRouteToggle[];
};

/* Raised rather than tinted, for the same reason the source card is: a row
   nothing is being read for asks the reader for something, and the palette
   answers that with elevation and a sentence rather than with a hue. */
const STALLED = "border-edge bg-surface-elevated";
const SETTLED = "border-edge-soft bg-surface";

/**
 * "Also sent to" renders only when an export route could exist at all. Eleven
 * of the thirteen types have no export capability in the registry, so the
 * design's "Nowhere" would there be describing an absence of something that
 * was never possible rather than a route the user has not switched on.
 */
export function DataTypeRoutingRow({
  row,
  profileId,
  lastSyncedAt,
  options,
  toggles,
}: Props) {
  const t = useTranslate("connections");
  const stalled = row.origin.kind === "rankedUnavailable";
  // Either decision is enough to open the panel. Gating on `canChooseSource`
  // alone is what made switching a route on unreachable: a type with no source
  // has nothing to rank, which is exactly when it most needs a source.
  const canChange =
    options !== undefined && (toggles.length > 0 || canChooseSource(options));

  return (
    <div
      data-testid={`routing-row-${row.dataType}`}
      data-origin={row.origin.kind}
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 ${stalled ? STALLED : SETTLED}`}
    >
      <div className="min-w-0 flex-[1_1_180px]">
        <div className="text-[14px] font-semibold text-ink-strong">
          {t(`dataTypes.${row.dataType}`)}
        </div>
        <div className="text-[12px] text-ink-muted">
          {t(`dataTypeHints.${row.dataType}`)}
        </div>
      </div>

      <RoutingOriginLine
        dataType={row.dataType}
        origin={row.origin}
        lastSyncedAt={lastSyncedAt}
      />

      {row.exportable && (
        <RoutingExportTargets dataType={row.dataType} sentTo={row.sentTo} />
      )}

      {canChange && options !== undefined && (
        <RoutingSourcePicker
          dataType={row.dataType}
          profileId={profileId}
          options={options}
          toggles={toggles}
        />
      )}
    </div>
  );
}
