/**
 * ZonesConflictDialog — phase-2 of the zones-sync flow.
 *
 * The use case `syncZones` returns an array of `ConflictItem`s with
 * the user's current value and the incoming Train2Go value. The user
 * picks accept or reject per row; on confirm the parent invokes
 * `commitConflictResolution` with the per-row decisions.
 *
 * Hard contract (verified by tests + ESLint react/no-danger):
 *   - NEVER use `dangerouslySetInnerHTML`.
 *   - Field labels come from the static `FIELD_LABELS` map keyed by
 *     `FieldKey`, NEVER from a T2G-supplied string.
 *   - Numeric values render as React children so React's default
 *     escaping handles any future shape drift.
 */
import { useState } from "react";

import type {
  ConflictDecision,
  ConflictItem,
  FieldKey,
} from "../../../types/coaching-zones";
import { ConflictRow } from "./ConflictRow";

export type ZonesConflictDialogProps = {
  open: boolean;
  conflicts: readonly ConflictItem[];
  onConfirm: (decisions: Record<FieldKey, ConflictDecision>) => void;
  onCancel: () => void;
};

const initialDecisions = (
  conflicts: readonly ConflictItem[]
): Record<FieldKey, ConflictDecision> => {
  const out = {} as Record<FieldKey, ConflictDecision>;
  for (const c of conflicts) out[c.field] = "reject";
  return out;
};

export const ZonesConflictDialog = ({
  open,
  conflicts,
  onConfirm,
  onCancel,
}: ZonesConflictDialogProps) => {
  const [decisions, setDecisions] = useState<
    Record<FieldKey, ConflictDecision>
  >(() => initialDecisions(conflicts));

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="zones-conflict-title"
      data-testid="zones-conflict-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900">
        <h2 id="zones-conflict-title" className="text-base font-semibold">
          Resolve zones-sync conflicts
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Train2Go has different values for these fields. Pick which to keep —
          Kaiord (current) or Train2Go (incoming).
        </p>
        <ul className="mt-3 space-y-2">
          {conflicts.map((c) => (
            <ConflictRow
              key={c.field}
              conflict={c}
              decision={decisions[c.field] ?? "reject"}
              onChange={(d) =>
                setDecisions((prev) => ({ ...prev, [c.field]: d }))
              }
            />
          ))}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(decisions)}
            className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
