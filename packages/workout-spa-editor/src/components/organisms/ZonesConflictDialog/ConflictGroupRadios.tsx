/**
 * `ConflictGroupRadios` — accept/reject radio pair for a single group.
 * Extracted from `ConflictGroup` to keep that component under the cap.
 */
import type { ConflictDecision } from "../../../types/coaching-zones";

export type ConflictGroupRadiosProps = {
  groupKey: string;
  decision: ConflictDecision;
  onChange: (next: ConflictDecision) => void;
};

export const ConflictGroupRadios = ({
  groupKey,
  decision,
  onChange,
}: ConflictGroupRadiosProps) => (
  <div className="mt-2 flex gap-3 text-xs">
    <label className="flex items-center gap-1">
      <input
        type="radio"
        name={`zones-conflict-${groupKey}`}
        value="accept"
        checked={decision === "accept"}
        onChange={() => onChange("accept")}
      />
      Accept Train2Go
    </label>
    <label className="flex items-center gap-1">
      <input
        type="radio"
        name={`zones-conflict-${groupKey}`}
        value="reject"
        checked={decision === "reject"}
        onChange={() => onChange("reject")}
      />
      Keep current
    </label>
  </div>
);
