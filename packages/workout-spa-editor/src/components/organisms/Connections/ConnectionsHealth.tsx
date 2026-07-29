import { buildConnectionConsequence } from "../../../application/connections/connection-consequence";
import { buildConnectionCoverage } from "../../../application/connections/connection-coverage";
import type { ConnectionSource } from "../../../application/connections/connection-source";
import { buildConnectionSummary } from "../../../application/connections/connection-summary";
import { useBridgeConnectionsRefreshed } from "../../../hooks/use-bridge-connections";
import { useTranslate } from "../../../i18n/use-translate";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { ConnectionRefreshButton } from "./ConnectionRefreshButton";
import { ConnectionsBanner } from "./ConnectionsBanner";
import { ConnectionSummaryRow } from "./ConnectionSummaryRow";

type Props = {
  sources: readonly ConnectionSource[];
  byDataType: DataFlowsByType;
};

/**
 * The health header: four counters, then the consequence of anything broken.
 *
 * Every number is derived from the same `sources` list the cards below are
 * rendered from, so the summary cannot contradict the surface it summarises.
 *
 * The counters wait for the store's first pass; the banner does not need to.
 * Before that pass every bridge reads undiscovered, which makes each source
 * "not connected" rather than broken — so the banner is silent for the same
 * reason a healthy browser leaves it silent, and no false alarm is possible.
 */
export function ConnectionsHealth({ sources, byDataType }: Props) {
  const t = useTranslate("connections");
  const refreshed = useBridgeConnectionsRefreshed();
  const coverage = buildConnectionCoverage(sources, byDataType);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[58ch] text-sm text-ink-body">{t("intro")}</p>
        <ConnectionRefreshButton />
      </div>
      <ConnectionSummaryRow
        summary={refreshed ? buildConnectionSummary(sources, coverage) : null}
      />
      <ConnectionsBanner
        consequence={buildConnectionConsequence(sources, coverage, t)}
      />
    </div>
  );
}
