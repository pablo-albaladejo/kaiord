/**
 * Button row for the no-workout state. Split out from
 * `NoWorkoutActions` so the parent stays under the per-function and
 * per-file line caps. The single-writer invariant is enforced by the
 * caller passing `writeInFlight`.
 */

import { useTranslate } from "../../../i18n/use-translate";

export type NoWorkoutButtonsProps = {
  pickerOpen: boolean;
  writeInFlight: boolean;
  creatingManual: boolean;
  onClose: () => void;
  onOpenPicker: () => void;
  onEditManually: () => void;
  onAiProcess: () => void;
};

export function NoWorkoutButtons(props: NoWorkoutButtonsProps) {
  const t = useTranslate("coaching");
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={props.onClose}
        className="rounded-md border border-edge px-3 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {t("actions.close")}
      </button>
      {!props.pickerOpen && (
        <button
          type="button"
          data-testid="coaching-dialog-match-existing"
          disabled={props.writeInFlight}
          onClick={props.onOpenPicker}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          {t("actions.matchExisting")}
        </button>
      )}
      <button
        type="button"
        data-testid="coaching-dialog-edit-manually"
        disabled={props.writeInFlight}
        onClick={props.onEditManually}
        className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        {props.creatingManual
          ? t("actions.creating")
          : t("actions.editManually")}
      </button>
      <button
        type="button"
        data-testid="coaching-dialog-ai-process"
        disabled={props.writeInFlight}
        onClick={props.onAiProcess}
        className="rounded-md bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {t("actions.aiProcess")}
      </button>
    </div>
  );
}
