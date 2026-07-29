import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeGroup } from "../../../application/connections/data-type-groups";
import type { DataTypeRouteToggle } from "../../../application/connections/data-type-route-toggles";
import type { DataTypeRoutingRow as RoutingRow } from "../../../application/connections/data-type-routing";
import type { SourceOfTruthOptions } from "../../../application/connections/source-of-truth-options";
import { useTranslate } from "../../../i18n/use-translate";
import { DataTypeRoutingRow } from "./DataTypeRoutingRow";

type Props = {
  group: DataTypeGroup;
  profileId: string;
  byType: ReadonlyMap<ManagedDataType, RoutingRow>;
  lastSyncedAt: ReadonlyMap<string, string | undefined>;
  options: ReadonlyMap<ManagedDataType, SourceOfTruthOptions>;
  toggles: ReadonlyMap<ManagedDataType, readonly DataTypeRouteToggle[]>;
};

const NO_TOGGLES: readonly DataTypeRouteToggle[] = [];

export function DataTypeRoutingGroup({
  group,
  profileId,
  byType,
  lastSyncedAt,
  options,
  toggles,
}: Props) {
  const t = useTranslate("connections");
  const rows = group.types.flatMap((dataType) => byType.get(dataType) ?? []);

  return (
    <div className="space-y-2" data-testid={`routing-group-${group.id}`}>
      <h3 className="text-[13.5px] font-bold text-ink-strong">
        {t(`routing.groups.${group.id}`)}
      </h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <DataTypeRoutingRow
            key={row.dataType}
            row={row}
            profileId={profileId}
            lastSyncedAt={lastSyncedAt}
            options={options.get(row.dataType)}
            toggles={toggles.get(row.dataType) ?? NO_TOGGLES}
          />
        ))}
      </div>
    </div>
  );
}
