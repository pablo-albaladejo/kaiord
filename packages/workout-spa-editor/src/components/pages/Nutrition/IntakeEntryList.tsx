import { useTranslate } from "../../../i18n/use-translate";
import type { IntakeEntryRecord } from "../../../types/intake-entry-record";
import { Card } from "../../atoms/Card";
import { IntakeEntryRow } from "./IntakeEntryRow";

export type IntakeEntryListProps = {
  entries: IntakeEntryRecord[] | undefined;
  onDelete: (id: string) => void;
};

/** Today's logged intake entries with per-row delete; empty state when none. */
export function IntakeEntryList({ entries, onDelete }: IntakeEntryListProps) {
  const t = useTranslate("nutrition");
  return (
    <Card
      className="border-edge bg-surface p-4"
      data-testid="intake-entry-list"
    >
      <p className="m-0 mb-2 text-[15px] font-semibold text-ink-strong">
        {t("intake.loggedToday")}
      </p>
      {!entries || entries.length === 0 ? (
        <p
          className="m-0 text-[13px] text-ink-muted"
          data-testid="intake-entries-empty"
        >
          {t("intake.empty")}
        </p>
      ) : (
        <ul className="m-0 list-none divide-y divide-edge-soft p-0">
          {entries.map((entry) => (
            <IntakeEntryRow key={entry.id} entry={entry} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </Card>
  );
}
