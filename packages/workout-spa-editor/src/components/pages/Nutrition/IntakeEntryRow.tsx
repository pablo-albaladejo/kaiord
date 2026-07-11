import { useTranslate } from "../../../i18n/use-translate";
import type { IntakeEntryRecord } from "../../../types/intake-entry-record";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { macroSummary, mealSlotLabel } from "./intake-entry-summary";

export type IntakeEntryRowProps = {
  entry: IntakeEntryRecord;
  onDelete: (id: string) => void;
};

/** One logged intake entry row with its macro summary and a delete button. */
export function IntakeEntryRow({ entry, onDelete }: IntakeEntryRowProps) {
  const t = useTranslate("nutrition");
  const slot = mealSlotLabel(entry.mealSlot, t);
  const title = entry.label ?? slot ?? t("intake.entryFallback");
  return (
    <li className="flex items-center gap-3 py-2" data-testid="intake-entry-row">
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[14px] font-semibold text-ink-strong">
          {title}
        </p>
        <p className="m-0 text-[12px] text-ink-muted">
          {macroSummary(entry, t)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(entry.id)}
        aria-label={t("intake.deleteEntry")}
        className="text-ink-muted hover:text-red-400"
      >
        <Icon icon={ICON_MAP.x} size="sm" color="inherit" />
      </button>
    </li>
  );
}
