/**
 * Train2Go Store Actions
 *
 * Read-week and read-day actions for fetching training plans.
 */

import { createDetectAction } from "./train2go-detect";
import {
  openTrain2Go,
  readDay,
  readWeek,
} from "./train2go-extension-transport";
import type { Train2GoStore } from "./train2go-store";

type Set = (fn: Partial<Train2GoStore>) => void;
type Get = () => Train2GoStore;

const createReadWeekAction =
  (set: Set, get: Get, extensionId: string) => async (date: string) => {
    const { userId } = get();
    if (!userId) {
      set({ lastError: "Not connected to Train2Go" });
      return;
    }

    set({ loading: true, lastError: null });

    const res = await readWeek(extensionId, date, userId);

    if (!res.ok) {
      if (res.error === "Session expired") {
        set({ sessionActive: false, loading: false, lastError: res.error });
      } else {
        set({ loading: false, lastError: res.error ?? "Read week failed" });
      }
      return;
    }

    set({ activities: res.data?.activities ?? [], loading: false });
  };

const createReadDayAction =
  (set: Set, get: Get, extensionId: string) => async (date: string) => {
    const { userId } = get();
    if (!userId) return;

    const res = await readDay(extensionId, date, userId);

    if (!res.ok) {
      set({ lastError: res.error ?? "Read day failed" });
      return;
    }

    const dayActivities = res.data?.activities ?? [];
    const { activities } = get();

    const merged = activities.map((a) => {
      const detail = dayActivities.find((d) => d.id === a.id);
      return detail
        ? {
            ...a,
            description: detail.description,
            completion: detail.completion,
          }
        : a;
    });

    set({ activities: merged });
  };

const createOpenAction =
  (_set: Set, _get: Get, extensionId: string) => async () => {
    await openTrain2Go(extensionId);
  };

export const createTrain2GoActions = (
  set: Set,
  get: Get,
  extensionId: string
) => ({
  detectExtension: createDetectAction(set, get, extensionId),
  fetchWeek: createReadWeekAction(set, get, extensionId),
  fetchDay: createReadDayAction(set, get, extensionId),
  openTrain2Go: createOpenAction(set, get, extensionId),
});
