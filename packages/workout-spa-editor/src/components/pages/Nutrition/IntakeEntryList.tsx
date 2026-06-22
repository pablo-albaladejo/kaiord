import type { IntakeEntryRecord } from "../../../types/intake-entry-record";
import { Card } from "../../atoms/Card";
import { IntakeEntryRow } from "./IntakeEntryRow";

export type IntakeEntryListProps = {
  entries: IntakeEntryRecord[] | undefined;
  onDelete: (id: string) => void;
};

/** Today's logged intake entries with per-row delete; empty state when none. */
export function IntakeEntryList({ entries, onDelete }: IntakeEntryListProps) {
  return (
    <Card
      className="border-slate-800 bg-primary-900 p-4"
      data-testid="intake-entry-list"
    >
      <p className="m-0 mb-2 text-[15px] font-semibold text-slate-100">
        Logged today
      </p>
      {!entries || entries.length === 0 ? (
        <p
          className="m-0 text-[13px] text-slate-400"
          data-testid="intake-entries-empty"
        >
          No entries logged yet
        </p>
      ) : (
        <ul className="m-0 list-none divide-y divide-slate-800 p-0">
          {entries.map((entry) => (
            <IntakeEntryRow key={entry.id} entry={entry} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </Card>
  );
}
