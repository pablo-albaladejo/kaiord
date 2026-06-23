import type { IntakePresetRecord } from "../../../types/intake-preset-record";
import { Icon, ICON_MAP } from "../../atoms/Icon";
import { macroSummary } from "./intake-entry-summary";

export type PresetRowProps = {
  preset: IntakePresetRecord;
  onApply: (presetId: string) => void;
  onRemove: (id: string) => void;
};

/** One saved preset: tap the body to apply it to the day; trash to remove. */
export function PresetRow({ preset, onApply, onRemove }: PresetRowProps) {
  return (
    <li
      className="flex items-center gap-2 py-2"
      data-testid="intake-preset-row"
    >
      <button
        type="button"
        onClick={() => onApply(preset.id)}
        data-testid="intake-preset-apply"
        className="min-w-0 flex-1 text-left"
      >
        <p className="m-0 truncate text-[14px] font-semibold text-slate-100">
          {preset.label}
        </p>
        <p className="m-0 text-[12px] text-slate-400">{macroSummary(preset)}</p>
      </button>
      <button
        type="button"
        onClick={() => onRemove(preset.id)}
        aria-label="Delete preset"
        className="text-slate-500 hover:text-red-400"
      >
        <Icon icon={ICON_MAP.x} size="sm" color="inherit" />
      </button>
    </li>
  );
}
