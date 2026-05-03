/**
 * ConflictRow — single row inside `ZonesConflictDialog`.
 *
 * Lives in its own file to keep the dialog under the editor's 80-line
 * component cap. Same XSS contract as the parent: labels from the
 * static `FIELD_LABELS` map, values rendered as React children.
 */
import type {
  ConflictDecision,
  ConflictItem,
  FieldKey,
} from "../../../types/coaching-zones";
import { FIELD_LABELS, formatFieldValue } from "./field-labels";

type DecisionRadioProps = {
  field: FieldKey;
  value: ConflictDecision;
  current: ConflictDecision;
  label: string;
  onChange: (next: ConflictDecision) => void;
};

const DecisionRadio = ({
  field,
  value,
  current,
  label,
  onChange,
}: DecisionRadioProps) => (
  <label className="flex items-center gap-1">
    <input
      type="radio"
      name={`zones-conflict-${field}`}
      value={value}
      checked={current === value}
      onChange={() => onChange(value)}
    />
    {label}
  </label>
);

type ConflictRowProps = {
  conflict: ConflictItem;
  decision: ConflictDecision;
  onChange: (next: ConflictDecision) => void;
};

export const ConflictRow = ({
  conflict,
  decision,
  onChange,
}: ConflictRowProps) => (
  <li
    data-testid={`zones-conflict-row-${conflict.field}`}
    className="rounded border p-2"
  >
    <div className="text-sm font-medium">{FIELD_LABELS[conflict.field]}</div>
    <div className="mt-1 text-xs text-muted-foreground">
      {formatFieldValue(conflict.field, conflict.current)}
      <span aria-hidden="true"> → </span>
      <span className="font-medium">
        {formatFieldValue(conflict.field, conflict.incoming)}
      </span>
    </div>
    <div className="mt-2 flex gap-3 text-xs">
      <DecisionRadio
        field={conflict.field}
        value="accept"
        current={decision}
        onChange={onChange}
        label="Accept Train2Go"
      />
      <DecisionRadio
        field={conflict.field}
        value="reject"
        current={decision}
        onChange={onChange}
        label="Keep current"
      />
    </div>
  </li>
);
