import type { SourcePolicyRow } from "../../../application/data-hub/source-policy-rows";
import { useTranslate } from "../../../i18n/use-translate";
import type { DataTypeSourceMode } from "../../../types/data-type-source-policy";
import { SourceOrderList } from "./SourceOrderList";

const MODES: readonly DataTypeSourceMode[] = ["union", "priority"];

type Props = {
  row: SourcePolicyRow;
  onMode: (row: SourcePolicyRow, mode: DataTypeSourceMode) => void;
  onMove: (row: SourcePolicyRow, bridgeId: string, delta: number) => void;
};

export const SourcePriorityRow: React.FC<Props> = ({ row, onMode, onMove }) => {
  const t = useTranslate("data-hub");
  return (
    <div
      className="rounded border border-gray-200 p-3 dark:border-gray-700"
      data-testid={`source-policy-${row.dataType}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900 dark:text-white">
          {row.label}
        </span>
        <div
          className="flex gap-1"
          role="group"
          aria-label={t("sourceModeAria", { label: row.label })}
        >
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={row.mode === mode}
              data-testid={`source-mode-${row.dataType}-${mode}`}
              onClick={() => {
                void onMode(row, mode);
              }}
              className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
                row.mode === mode
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {t(`sourceMode.${mode}`)}
            </button>
          ))}
        </div>
      </div>
      {row.mode === "priority" && <SourceOrderList row={row} onMove={onMove} />}
    </div>
  );
};
