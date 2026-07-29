import type { ManagedDataType } from "@kaiord/core";

import type { DataTypeGroup } from "../../../application/connections/data-type-groups";
import type { DataTypeRoutingRow as RoutingRow } from "../../../application/connections/data-type-routing";
import { useTranslate } from "../../../i18n/use-translate";
import { DataTypeRoutingRow } from "./DataTypeRoutingRow";

type Props = {
  group: DataTypeGroup;
  byType: ReadonlyMap<ManagedDataType, RoutingRow>;
  lastSyncedAt: ReadonlyMap<string, string | undefined>;
};

export function DataTypeRoutingGroup({ group, byType, lastSyncedAt }: Props) {
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
            lastSyncedAt={lastSyncedAt}
          />
        ))}
      </div>
    </div>
  );
}
