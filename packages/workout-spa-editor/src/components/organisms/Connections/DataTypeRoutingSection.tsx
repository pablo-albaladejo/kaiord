import type { ManagedDataType } from "@kaiord/core";
import { useMemo } from "react";

import { DATA_TYPE_GROUPS } from "../../../application/connections/data-type-groups";
import { useDataTypeRouting } from "../../../hooks/connections/use-data-type-routing";
import { useTranslate } from "../../../i18n/use-translate";
import type { DataFlowsByType } from "../ProfileManager/components/useDataFlows";
import { DataTypeRoutingGroup } from "./DataTypeRoutingGroup";

type Props = { profileId: string; byDataType: DataFlowsByType };

/**
 * Rows report what the stored policies already decide, and — where the row has
 * a decision to make — offer the source of truth to be changed. The section
 * still claims nothing about fallbacks: `usedFallback` is priority-mode only,
 * is per-(type, day), and means "no record that day" rather than "this source
 * broke".
 */
export function DataTypeRoutingSection({ profileId, byDataType }: Props) {
  const t = useTranslate("connections");
  const { rows, lastSyncedAt, options, toggles } = useDataTypeRouting(
    profileId,
    byDataType
  );
  const byType = useMemo(
    () =>
      new Map<ManagedDataType, (typeof rows)[number]>(
        rows.map((row) => [row.dataType, row])
      ),
    [rows]
  );

  return (
    <section className="space-y-3" data-testid="data-type-routing">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">
          {t("routing.title")}
        </h2>
        <span className="text-[12.5px] text-ink-muted">
          {t("routing.freshnessHint")}
        </span>
      </div>
      <div className="space-y-4">
        {DATA_TYPE_GROUPS.map((group) => (
          <DataTypeRoutingGroup
            key={group.id}
            group={group}
            profileId={profileId}
            byType={byType}
            lastSyncedAt={lastSyncedAt}
            options={options}
            toggles={toggles}
          />
        ))}
      </div>
    </section>
  );
}
