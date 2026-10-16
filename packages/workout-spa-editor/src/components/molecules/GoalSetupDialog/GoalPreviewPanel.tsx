/**
 * GoalPreviewPanel — read-only preview of the computed daily delta + target
 * kcal for the drafted goal, plus a non-blocking safety warning when the
 * delta was clamped to a safe rate. All copy is static (PII-safe).
 */
import { useTranslate } from "../../../i18n/use-translate";
import type { GoalPreview } from "./goal-preview";

type Translate = ReturnType<typeof useTranslate>;

const deltaLabel = (t: Translate, delta: number): string => {
  const value = Math.round(Math.abs(delta));
  if (delta < 0) return t("goalSetup.deficit", { value });
  if (delta > 0) return t("goalSetup.surplus", { value });
  return t("goalSetup.maintenance");
};

export type GoalPreviewPanelProps = { preview: GoalPreview };

export function GoalPreviewPanel({ preview }: GoalPreviewPanelProps) {
  const t = useTranslate("nutrition");
  return (
    <div
      data-testid="goal-preview"
      className="rounded border border-gray-200 p-3 text-sm dark:border-gray-700"
    >
      <p className="m-0 font-medium text-gray-900 dark:text-white">
        {deltaLabel(t, preview.dailyDeltaKcal)}
      </p>
      <p className="m-0 mt-1 text-gray-600 dark:text-gray-300">
        {t("goalSetup.target", { value: Math.round(preview.targetKcal) })}
      </p>
      {preview.capped && (
        <p
          role="status"
          data-testid="goal-cap-warning"
          className="m-0 mt-2 text-[12px] font-medium text-ink-strong"
        >
          {preview.overridden
            ? t("goalSetup.capOverridden")
            : t("goalSetup.capWarning")}
        </p>
      )}
    </div>
  );
}
