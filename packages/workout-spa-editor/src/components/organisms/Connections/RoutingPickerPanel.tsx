import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeRouteToggle } from "../../../application/connections/data-type-route-toggles";
import { usePolicyToggle } from "../../../hooks/connections/use-policy-toggle";
import { useTranslate } from "../../../i18n/use-translate";
import { RoutingSourceSwitches } from "./RoutingSourceSwitches";

type Props = {
  dataType: ManagedDataType;
  profileId: string;
  toggles: readonly DataTypeRouteToggle[];
};

/**
 * Which sources may send the type. Which one decides when several do is the
 * App's (`automatic-authority.ts`), or the athlete's in the Authority matrix,
 * an advanced Capability: it is never asked here.
 */
export function RoutingPickerPanel({ dataType, profileId, toggles }: Props) {
  const t = useTranslate("connections");
  const { setImportRoute } = usePolicyToggle();
  const type = t(`dataTypes.${dataType}`);

  return (
    <div
      data-testid={`routing-picker-${dataType}`}
      className="space-y-2 rounded-xl border border-edge-soft bg-surface-page p-3"
    >
      <p className="text-[12.5px] font-semibold text-ink-strong">
        {t("routing.change.title", { type })}
      </p>
      <RoutingSourceSwitches
        dataType={dataType}
        toggles={toggles}
        onToggle={(bridgeId, enabled) => {
          void setImportRoute({ profileId, dataType, bridgeId, enabled });
        }}
      />
    </div>
  );
}
