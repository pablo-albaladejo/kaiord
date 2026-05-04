/**
 * ZonesConflictDialog — phase-2 of the zones-sync flow. Conflicts are
 * grouped by `<sport>.<kind>` table for usability (per D-MA5/D-MA6 of
 * zones-method-aware-reconcile). Layout shell extracted to
 * `DialogShell.tsx`; group rendering extracted to `ConflictGroupList`;
 * decision state extracted to `useConflictDecisions`.
 */
import { useMemo } from "react";

import type {
  ConflictDecision,
  ConflictItem,
  FieldKey,
} from "../../../types/coaching-zones";
import { ConflictGroupList } from "./ConflictGroupList";
import { ConflictRow } from "./ConflictRow";
import { DialogShell } from "./DialogShell";
import { groupConflicts } from "./group-conflicts";
import {
  buildConfirmDecisions,
  useConflictDecisions,
} from "./use-conflict-decisions";

export type ZonesConflictDialogProps = {
  open: boolean;
  conflicts: readonly ConflictItem[];
  onConfirm: (decisions: Record<FieldKey, ConflictDecision>) => void;
  onCancel: () => void;
};

export const ZonesConflictDialog = ({
  open,
  conflicts,
  onConfirm,
  onCancel,
}: ZonesConflictDialogProps) => {
  const grouped = useMemo(() => groupConflicts(conflicts), [conflicts]);
  const ds = useConflictDecisions(grouped);
  if (!open) return null;
  return (
    <DialogShell
      onCancel={onCancel}
      onApply={() =>
        onConfirm(
          buildConfirmDecisions(grouped, ds.scalarDecisions, ds.groupDecisions)
        )
      }
    >
      {grouped.scalars.map((c) => (
        <ConflictRow
          key={c.field}
          conflict={c}
          decision={ds.scalarDecisions[c.field] ?? "reject"}
          onChange={(d) => ds.setScalar(c.field, d)}
        />
      ))}
      <ConflictGroupList
        bandGroups={grouped.bandGroups}
        ftpCoupled={grouped.ftpCoupled}
        groupDecisions={ds.groupDecisions}
        expanded={ds.expanded}
        onSetGroup={ds.setGroup}
        onToggleExpand={ds.toggleExpand}
      />
    </DialogShell>
  );
};
