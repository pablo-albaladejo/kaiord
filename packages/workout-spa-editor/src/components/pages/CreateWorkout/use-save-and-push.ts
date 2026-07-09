import { useCallback, useEffect, useRef, useState } from "react";

import { db } from "../../../adapters/dexie/dexie-database";
import { useGarminBridge } from "../../../contexts";
import { useToastContext } from "../../../contexts/ToastContext";
import { useTranslate } from "../../../i18n/use-translate";
import type { WorkoutRecord } from "../../../types/calendar-record";
import { useGarminPush } from "../../molecules/GarminPushButton/useGarminPush";

export type SaveAndPushInput = {
  buildRecord: () => Promise<WorkoutRecord>;
  /** Called with the just-persisted record so callers can route by date. */
  onDone: (record: WorkoutRecord) => void;
};

/**
 * Persist a generated workout to Dexie, then push it to Garmin when a session
 * is active. The push hook is bound to the just-saved record via an effect so
 * `useGarminPush` sees the persisted record at top level.
 */
export function useSaveAndPush({ buildRecord, onDone }: SaveAndPushInput) {
  const [record, setRecord] = useState<WorkoutRecord | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const { sessionActive } = useGarminBridge();
  const toast = useToastContext();
  const t = useTranslate("create-workout");
  const { push } = useGarminPush(record);
  const pendingRef = useRef(false);

  const save = useCallback(async () => {
    setSaving(true);
    const built = await buildRecord();
    await db.table("workouts").put(built);
    pendingRef.current = true;
    setRecord(built);
  }, [buildRecord]);

  useEffect(() => {
    if (!record || !pendingRef.current) return;
    pendingRef.current = false;
    void (async () => {
      if (sessionActive) {
        await push();
        toast.success(t("toast.savedAndPushed"));
      } else {
        toast.success(t("toast.savedOnly"));
      }
      setSaving(false);
      onDone(record);
    })();
  }, [record, sessionActive, push, toast, onDone, t]);

  return { save, saving };
}
