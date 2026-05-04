/**
 * ConflictGroup — single group row inside `ZonesConflictDialog`.
 * Represents one `<sport>.<kind>` table or the coupled FTP+power-bands
 * decision (per D-MA5/D-MA6 of zones-method-aware-reconcile).
 */
import type {
  ConflictDecision,
  ConflictItem,
} from "../../../types/coaching-zones";
import { ConflictGroupDetail } from "./ConflictGroupDetail";
import { ConflictGroupHeader } from "./ConflictGroupHeader";
import { ConflictGroupRadios } from "./ConflictGroupRadios";

export type ConflictGroupProps = {
  groupKey: string;
  label: string;
  conflicts: readonly ConflictItem[];
  decision: ConflictDecision;
  expanded: boolean;
  onChange: (next: ConflictDecision) => void;
  onToggleExpand: () => void;
};

export const ConflictGroup = ({
  groupKey,
  label,
  conflicts,
  decision,
  expanded,
  onChange,
  onToggleExpand,
}: ConflictGroupProps) => (
  <li
    data-testid={`zones-conflict-group-${groupKey}`}
    className="rounded border p-2"
  >
    <ConflictGroupHeader
      label={label}
      bandCount={conflicts.length}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
    />
    <ConflictGroupRadios
      groupKey={groupKey}
      decision={decision}
      onChange={onChange}
    />
    <ConflictGroupDetail conflicts={conflicts} expanded={expanded} />
  </li>
);
