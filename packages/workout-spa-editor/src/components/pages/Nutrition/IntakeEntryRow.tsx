import type { IntakeEntryRecord } from "../../../types/intake-entry-record";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { macroSummary, mealSlotLabel } from "./intake-entry-summary";

export type IntakeEntryRowProps = {
  entry: IntakeEntryRecord;
  onDelete: (id: string) => void;
};

/** One logged intake entry row with its macro summary and a delete button. */
export function IntakeEntryRow({ entry, onDelete }: IntakeEntryRowProps) {
  const slot = mealSlotLabel(entry.mealSlot);
  const title = entry.label ?? slot ?? "Entry";
  return (
    <li className="flex items-center gap-3 py-2" data-testid="intake-entry-row">
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[14px] font-semibold text-slate-100">
          {title}
        </p>
        <p className="m-0 text-[12px] text-slate-400">{macroSummary(entry)}</p>
      </div>
      <button
        type="button"
        onClick={() => onDelete(entry.id)}
        aria-label="Delete entry"
        className="text-slate-500 hover:text-red-400"
      >
        <Icon icon={ICON_MAP.x} size="sm" color="inherit" />
      </button>
    </li>
  );
}
