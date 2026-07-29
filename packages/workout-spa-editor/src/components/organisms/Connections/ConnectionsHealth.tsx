import { buildConnectionConsequence } from "../../../application/connections/connection-consequence";
import { buildConnectionCoverage } from "../../../application/connections/connection-coverage";
import type { ConnectionSource } from "../../../application/connections/connection-source";
import { buildConnectionSummary } from "../../../application/connections/connection-summary";
import { useDiscoverySettled } from "../../../hooks/connections/use-discovery-settled";
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
 * The counters wait for discovery to have had its window — NOT for the store
 * to have completed a pass, which happens microseconds after boot and long
 * before any extension could have announced. The banner needs no such wait:
 * until a bridge is discovered every source reads "not connected" rather than
 * broken, so it is silent for exactly the reason a healthy browser leaves it
 * silent, and there is no window in which it can raise a false alarm.
 */
export function ConnectionsHealth({ sources, byDataType }: Props) {
  const t = useTranslate("connections");
  const coverage = buildConnectionCoverage(sources, byDataType);
  const summary = buildConnectionSummary(sources, coverage);
  const settled = useDiscoverySettled(summary.detected);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-[58ch] text-sm text-ink-body">{t("intro")}</p>
        <ConnectionRefreshButton />
      </div>
      <ConnectionSummaryRow summary={settled ? summary : null} />
      <ConnectionsBanner
        consequence={buildConnectionConsequence(sources, coverage, t)}
      />
    </div>
  );
}
