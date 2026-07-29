/**
 * The coach-mark bubble itself: one sentence, the shortcut it teaches, and
 * two ways out. Purely presentational — the host owns placement and state.
 *
 * The key chips come from `SHORTCUT_CATALOG` by id, exactly as the palette
 * row resolves them, so a rebinding never leaves the mark teaching stale keys.
 */

import { SHORTCUT_CATALOG } from "../../../constants/shortcut-catalog";
import { useTranslate } from "../../../i18n/use-translate";
import { Button } from "../../atoms/Button/Button";
import { KeyChips } from "../../atoms/KeyChips";

export type CoachMarkCardProps = {
  /** Coach-mark id; also the `coach` namespace key and the catalog row id. */
  markId: string;
  onAccept: () => void;
  onDismiss: () => void;
};

export function CoachMarkCard({
  markId,
  onAccept,
  onDismiss,
}: CoachMarkCardProps) {
  const t = useTranslate("coach");
  const def = SHORTCUT_CATALOG.find((row) => row.id === markId);

  return (
    <div className="flex max-w-[330px] flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {t(`marks.${markId}.title`)}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          {t(`marks.${markId}.body`)}
        </p>
        {def && (
          <span className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <KeyChips def={def} />
            {t(`marks.${markId}.shortcutHint`)}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onAccept}>
          {t(`marks.${markId}.action`)}
        </Button>
        <Button variant="secondary" size="sm" onClick={onDismiss}>
          {t("actions.notNow")}
        </Button>
      </div>
    </div>
  );
}
