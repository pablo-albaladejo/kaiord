/**
 * Explicit save for a scheduled workout open in the editor: the draft is
 * dirty while it differs from the baseline (the copy as last loaded or
 * saved), a save makes the saved draft the baseline, and a discard reloads
 * the baseline. While dirty, leaving the page asks first (`beforeunload`).
 */

import { useCallback, useEffect, useState } from "react";

import { useToastContext } from "../../contexts/ToastContext";
import { useTranslate } from "../../i18n/use-translate";
import { useWorkoutStore } from "../../store/workout-store";
import type { KRD } from "../../types/krd";

export type EditorBaseline = {
  baselineKrd: KRD | null;
  setBaselineKrd: (krd: KRD) => void;
  reload: (krd: KRD) => void;
};

function useBeforeUnloadGuard(armed: boolean) {
  useEffect(() => {
    if (!armed) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers only prompt when `returnValue` is set.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [armed]);
}

export function useEditorSave(
  saveEdits: (krd: KRD) => Promise<boolean>,
  { baselineKrd, setBaselineKrd, reload }: EditorBaseline
) {
  const t = useTranslate("editor");
  const toast = useToastContext();
  const currentWorkout = useWorkoutStore((s) => s.currentWorkout);
  const [saving, setSaving] = useState(false);
  const isDirty =
    baselineKrd !== null &&
    currentWorkout !== null &&
    currentWorkout !== baselineKrd;
  useBeforeUnloadGuard(isDirty);

  const save = useCallback(async () => {
    if (!currentWorkout) return;
    setSaving(true);
    try {
      if (await saveEdits(currentWorkout)) {
        setBaselineKrd(currentWorkout);
        toast.success(t("edits.saved"));
      } else toast.error(t("edits.notFound"));
    } finally {
      setSaving(false);
    }
  }, [currentWorkout, saveEdits, setBaselineKrd, toast, t]);

  const discard = useCallback(() => {
    if (baselineKrd) reload(baselineKrd);
  }, [baselineKrd, reload]);

  return { isDirty, saving, save, discard };
}
