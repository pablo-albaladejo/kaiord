/**
 * GoalPreviewPanel — read-only preview of the computed daily delta + target
 * kcal for the drafted goal, plus a non-blocking safety warning when the
 * delta was clamped to a safe rate. All copy is static (PII-safe).
 */
import type { GoalPreview } from "./goal-preview";

const CAP_WARNING_TEXT =
  "This pace exceeds the safe cap; the plan was clamped to a safe rate.";
const CAP_OVERRIDDEN_TEXT =
  "This pace exceeds the safe cap; you chose to override it.";

const kcal = (value: number): string => `${Math.round(value)} kcal`;

const deltaLabel = (delta: number): string => {
  if (delta < 0) return `${kcal(-delta)} / day deficit`;
  if (delta > 0) return `${kcal(delta)} / day surplus`;
  return "Maintenance (no delta)";
};

export type GoalPreviewPanelProps = { preview: GoalPreview };

export function GoalPreviewPanel({ preview }: GoalPreviewPanelProps) {
  return (
    <div
      data-testid="goal-preview"
      className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700"
    >
      <p className="m-0 font-medium text-gray-900 dark:text-white">
        {deltaLabel(preview.dailyDeltaKcal)}
      </p>
      <p className="m-0 mt-1 text-gray-600 dark:text-gray-300">
        Target {kcal(preview.targetKcal)}
      </p>
      {preview.capped && (
        <p
          role="status"
          data-testid="goal-cap-warning"
          className="m-0 mt-2 text-[12px] font-medium text-amber-600 dark:text-amber-400"
        >
          {preview.overridden ? CAP_OVERRIDDEN_TEXT : CAP_WARNING_TEXT}
        </p>
      )}
    </div>
  );
}
