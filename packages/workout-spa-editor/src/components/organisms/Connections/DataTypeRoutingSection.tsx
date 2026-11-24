import type { ManagedDataType } from "@kaiord/core";
import { useMemo } from "react";

import { DATA_TYPE_GROUPS } from "../../../application/connections/data-type-groups";
import type { DataFlowsByType } from "../../../hooks/connections/use-data-flows";
import { useDataTypeRouting } from "../../../hooks/connections/use-data-type-routing";
import { useFocusRoutingRow } from "../../../hooks/connections/use-focus-routing-row";
import { useTranslate } from "../../../i18n/use-translate";
import { AuthorityMatrixLink } from "./AuthorityMatrixLink";
import { DataTypeRoutingGroup } from "./DataTypeRoutingGroup";

type Props = { profileId: string; byDataType: DataFlowsByType };

/**
 * Rows report which source decides each type (the App's rule, or the
 * athlete's choice while the Authority matrix is on) and let each source be
 * switched on or off. Choosing which one decides lives only in the matrix,
 * reached from the link below while it is on.
 */
export function DataTypeRoutingSection({ profileId, byDataType }: Props) {
  const t = useTranslate("connections");
  const { rows, lastSyncedAt, toggles, exportToggles } = useDataTypeRouting(
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
  useFocusRoutingRow(rows);

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
            toggles={toggles}
            exportToggles={exportToggles}
          />
        ))}
      </div>
      <AuthorityMatrixLink />
    </section>
  );
}
