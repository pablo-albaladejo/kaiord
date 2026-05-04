/**
 * `useConflictDecisions` — owns the per-row + per-group decision state
 * + expand state for the conflict dialog. Co-located with
 * `ZonesConflictDialog.tsx` so the parent component stays under the
 * 60-line React component cap.
 */
import { useState } from "react";

import type { ConflictDecision, FieldKey } from "../../../types/coaching-zones";
import type { GroupedConflicts } from "./group-conflicts";

type GroupDecisions = Record<string, ConflictDecision>;
type ScalarDecisions = Record<FieldKey, ConflictDecision>;

const initialScalars = (grouped: GroupedConflicts): ScalarDecisions => {
  const out = {} as ScalarDecisions;
  for (const c of grouped.scalars) out[c.field] = "reject";
  return out;
};

const initialGroups = (grouped: GroupedConflicts): GroupDecisions => {
  const out: GroupDecisions = {};
  for (const g of grouped.bandGroups) out[g.groupKey] = "reject";
  if (grouped.ftpCoupled) out[grouped.ftpCoupled.groupKey] = "reject";
  return out;
};

export const useConflictDecisions = (grouped: GroupedConflicts) => {
  const [scalarDecisions, setScalarDecisions] = useState<ScalarDecisions>(() =>
    initialScalars(grouped)
  );
  const [groupDecisions, setGroupDecisions] = useState<GroupDecisions>(() =>
    initialGroups(grouped)
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const setScalar = (field: FieldKey, d: ConflictDecision) =>
    setScalarDecisions((prev) => ({ ...prev, [field]: d }));

  const setGroup = (groupKey: string, d: ConflictDecision) =>
    setGroupDecisions((prev) => ({ ...prev, [groupKey]: d }));

  const toggleExpand = (groupKey: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });

  return {
    scalarDecisions,
    groupDecisions,
    expanded,
    setScalar,
    setGroup,
    toggleExpand,
  };
};

export const buildConfirmDecisions = (
  grouped: GroupedConflicts,
  scalarDecisions: ScalarDecisions,
  groupDecisions: GroupDecisions
): Record<FieldKey, ConflictDecision> => {
  const out = { ...scalarDecisions } as Record<FieldKey, ConflictDecision>;
  for (const g of grouped.bandGroups) {
    const d = groupDecisions[g.groupKey] ?? "reject";
    for (const c of g.conflicts) out[c.field] = d;
  }
  if (grouped.ftpCoupled) {
    const d = groupDecisions[grouped.ftpCoupled.groupKey] ?? "reject";
    out[grouped.ftpCoupled.ftpConflict.field] = d;
    for (const c of grouped.ftpCoupled.powerBandConflicts) {
      out[c.field] = d;
    }
  }
  return out;
};
