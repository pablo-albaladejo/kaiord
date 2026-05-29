/**
 * DataFlowsGroup — one managed data type with Sources + Destinations subsections.
 * Default-collapsed when both subsections have zero policies; expanded otherwise.
 */
import type { ManagedDataType } from "@kaiord/core";
import { MANAGED_DATA_REGISTRY } from "@kaiord/core";
import { useState } from "react";

import type { DiscoveredBridge } from "../../../../hooks/use-discovered-bridges";
import type { IntegrationPolicy } from "../../../../types/integration-policy";
import { DataFlowsAddDialog } from "./DataFlowsAddDialog";
import { DataFlowsSubsection } from "./DataFlowsSubsection";

type AddTarget = { direction: "import" | "export" } | null;

type Props = {
  profileId: string;
  dataType: ManagedDataType;
  policies: { import: IntegrationPolicy[]; export: IntegrationPolicy[] };
  allBridges: readonly DiscoveredBridge[];
};

export function DataFlowsGroup({
  profileId,
  dataType,
  policies,
  allBridges,
}: Props) {
  const reg = MANAGED_DATA_REGISTRY[dataType];
  const hasAny = policies.import.length > 0 || policies.export.length > 0;
  const [open, setOpen] = useState(hasAny);
  const [adding, setAdding] = useState<AddTarget>(null);

  return (
    <div
      className="rounded border"
      data-testid={`data-flows-group-${dataType}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
        aria-expanded={open}
      >
        {reg.label}
        <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 px-3 pb-3">
          {reg.capabilities.import !== undefined && (
            <DataFlowsSubsection
              label="Sources"
              rows={policies.import}
              allBridges={allBridges}
              emptyText="No source configured."
              onAdd={() => setAdding({ direction: "import" })}
              addLabel="+ Add source"
            />
          )}
          {reg.capabilities.export !== undefined && (
            <DataFlowsSubsection
              label="Destinations"
              rows={policies.export}
              allBridges={allBridges}
              emptyText="No destination configured."
              onAdd={() => setAdding({ direction: "export" })}
              addLabel="+ Add destination"
            />
          )}
        </div>
      )}

      {adding && (
        <DataFlowsAddDialog
          profileId={profileId}
          dataType={dataType}
          direction={adding.direction}
          discoveredBridges={allBridges}
          onClose={() => setAdding(null)}
        />
      )}
    </div>
  );
}
