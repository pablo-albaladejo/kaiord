import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeRouteToggle } from "../../../application/connections/data-type-route-toggles";
import { usePolicyToggle } from "../../../hooks/connections/use-policy-toggle";
import { useTranslate } from "../../../i18n/use-translate";
import { Pill } from "../../atoms/Pill";
import { sourceName } from "./routing-copy";
import { RoutingChoiceButton } from "./RoutingChoiceButton";

type Props = {
  dataType: ManagedDataType;
  profileId: string;
  sentTo: readonly string[];
  toggles: readonly DataTypeRouteToggle[];
};

/**
 * Rendered only for the types the registry gives an export capability.
 * "Nowhere" here means a route the user has not switched on, and it stays
 * next to the destination switches until one of them is on; on the other
 * types it would mean a route that cannot be created, which is why the caller
 * omits this whole block rather than passing an empty list.
 *
 * Each destination whose bridge is connected and announces the export token is
 * a pressed-state switch — the same write path as the import switches, so the
 * send route no longer depends on a seed migration or the assistant.
 */
export function RoutingExportTargets({
  dataType,
  profileId,
  sentTo,
  toggles,
}: Props) {
  const t = useTranslate("connections");
  const { setExportRoute } = usePolicyToggle();
  const label = t("routing.exportSwitches", {
    type: t(`dataTypes.${dataType}`),
  });
  const onToggle = (toggle: DataTypeRouteToggle) => {
    const { bridgeId, enabled } = toggle;
    void setExportRoute({ profileId, dataType, bridgeId, enabled: !enabled });
  };

  return (
    <div className="flex flex-[1_1_180px] flex-wrap items-center gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">
        {t("routing.sentTo")}
      </span>
      {/* "Nowhere" stays beside the switches until one is on: a switch alone
          does not say that nothing is being sent yet. */}
      {sentTo.length === 0 && (
        <span
          className="text-[12.5px] text-ink-muted"
          data-testid={`routing-nowhere-${dataType}`}
        >
          {t("routing.nowhere")}
        </span>
      )}
      {toggles.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
          {toggles.map((toggle) => (
            <RoutingChoiceButton
              key={toggle.bridgeId}
              testId={`routing-export-${dataType}-${toggle.integrationId}`}
              selected={toggle.enabled}
              label={sourceName(toggle.integrationId)}
              onClick={() => onToggle(toggle)}
            />
          ))}
        </div>
      ) : (
        sentTo.map((id) => (
          <Pill key={id} tone="neutral">
            {sourceName(id)}
          </Pill>
        ))
      )}
    </div>
  );
}
