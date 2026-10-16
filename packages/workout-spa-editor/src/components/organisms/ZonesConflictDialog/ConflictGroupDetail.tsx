/**
 * `ConflictGroupDetail` — expandable per-band display rows inside a
 * group. Visibility-only (rows stay in DOM via aria-hidden).
 */
import { useTranslate } from "../../../i18n/use-translate";
import type { ConflictItem } from "../../../types/coaching-zones";
import { formatFieldValue } from "./field-labels";

export type ConflictGroupDetailProps = {
  conflicts: readonly ConflictItem[];
  expanded: boolean;
};

export const ConflictGroupDetail = ({
  conflicts,
  expanded,
}: ConflictGroupDetailProps) => {
  const hrUnit = useTranslate("common")("units.hr");
  return (
    <ul
      className={
        expanded ? "mt-2 space-y-1 text-xs" : "mt-2 space-y-1 text-xs hidden"
      }
      aria-hidden={!expanded}
    >
      {conflicts.map((c) => (
        <li
          key={c.field}
          data-testid={`zones-conflict-row-${c.field}`}
          className="text-muted-foreground"
        >
          {c.field}: {formatFieldValue(c.field, c.current, hrUnit)}
          <span aria-hidden="true"> → </span>
          <span className="font-medium">
            {formatFieldValue(c.field, c.incoming, hrUnit)}
          </span>
        </li>
      ))}
    </ul>
  );
};
