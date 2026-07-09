import { useTranslate } from "../../../i18n/use-translate";
import type { IntakePresetRecord } from "../../../types/intake-preset-record";
import { Card } from "../../atoms/Card";
import { PresetRow } from "./PresetRow";

export type PresetListProps = {
  presets: IntakePresetRecord[] | undefined;
  onApply: (presetId: string) => void;
  onRemove: (id: string) => void;
};

/** Saved presets with one-tap apply; hidden body when none are saved yet. */
export function PresetList({ presets, onApply, onRemove }: PresetListProps) {
  const t = useTranslate("nutrition");
  return (
    <Card
      className="border-slate-800 bg-primary-900 p-4"
      data-testid="intake-preset-list"
    >
      <p className="m-0 mb-2 text-[15px] font-semibold text-slate-100">
        {t("presets.title")}
      </p>
      {!presets || presets.length === 0 ? (
        <p
          className="m-0 text-[13px] text-slate-400"
          data-testid="intake-presets-empty"
        >
          {t("presets.empty")}
        </p>
      ) : (
        <ul className="m-0 list-none divide-y divide-slate-800 p-0">
          {presets.map((preset) => (
            <PresetRow
              key={preset.id}
              preset={preset}
              onApply={onApply}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
