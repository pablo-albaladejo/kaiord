/**
 * The Garmin Connector as the App runs it, against the fake Garmin at the
 * message contract: the real Dexie ledger (fake-indexeddb), the real bridge
 * adapters (`executePush`, `createGarminCalendarPort`) over
 * `chrome.runtime.sendMessage`, the real Phase 1 (`recordExport`) and the
 * real placement pipeline. Only the clock is faked: `sleep` advances it.
 * `restartTab()` models a tab that died: a fresh in-tab join map and lock
 * manager over the same device storage. `openTab()` is a second tab of the
 * same browser: its own join map, the browser's one lock manager.
 */
import { vi } from "vitest";

import { createDexieExportLedgerRepository } from "../adapters/dexie/dexie-export-ledger-repository";
import type { KaiordDatabase } from "../adapters/dexie/dexie-database";
import { recordExport } from "../application/export/record-export.use-case";
import { pushWorkoutToGarminCalendar } from "../application/garmin-placement/push-workout-to-garmin-calendar";
import type { PlacementPipelineDeps } from "../application/garmin-placement/placement-pipeline-deps";
import { SCHEDULE_IDS_IN_FIND } from "../application/garmin-placement/placement-timing";
import { executePush } from "../hooks/garmin-bridge-operations";
import { createGarminCalendarPort } from "../hooks/garmin-calendar-operations";
import { buildGarminPushFn } from "../hooks/garmin-push-fn";
import { GARMIN_LEDGER_BRIDGE_ID } from "../types/export-ledger";
import { createFakeGarminPlatform } from "./fake-garmin-platform";
import { createInMemoryLockManager } from "./in-memory-record-lock";
import { ALL_FEATURES } from "./placement-harness";

const EXTENSION_ID = "kaiord-for-garmin";

const pushFn = buildGarminPushFn(async (gcn) => {
  const r = await executePush(EXTENSION_ID, gcn);
  return r.status === "success"
    ? { success: true, garminWorkoutId: r.garminWorkoutId }
    : { success: false, garminWorkoutId: null };
});

export const createMessageSeamConnector = (db: KaiordDatabase) => {
  const garmin = createFakeGarminPlatform();
  garmin.install();
  const ledgerRepo = createDexieExportLedgerRepository(db);
  type Tab = {
    joins: PlacementPipelineDeps["joins"];
    locks: ReturnType<typeof createInMemoryLockManager>;
  };
  const tab: Tab = { joins: new Map(), locks: createInMemoryLockManager() };
  const deps = (on: Tab = tab): PlacementPipelineDeps => ({
    ledgerRepo,
    calendar: createGarminCalendarPort(() => EXTENSION_ID),
    scheduleIdsInFind: SCHEDULE_IDS_IN_FIND,
    now: () => Date.now(),
    sleep: async (ms) => {
      vi.setSystemTime(Date.now() + ms);
    },
    features: ALL_FEATURES,
    locks: on.locks.port(),
    secureContext: true,
    joins: on.joins,
  });
  /** The athlete presses Send on Workout `recordId` for `date`. */
  const sendOn = (
    on: Tab,
    recordId: string,
    date: string,
    workoutName: string,
    content = "v1"
  ) =>
    pushWorkoutToGarminCalendar(deps(on), {
      kaiordRecordId: recordId,
      date,
      runLibraryPush: () =>
        recordExport(
          { ledgerRepo },
          {
            kaiordRecordId: recordId,
            dataType: "workout",
            destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
            payload: { workoutName, content },
            postFn: pushFn,
          }
        ),
    });
  const send = (
    recordId: string,
    date: string,
    workoutName: string,
    content = "v1"
  ) => sendOn(tab, recordId, date, workoutName, content);
  const openTab = () => {
    const other: Tab = { joins: new Map(), locks: tab.locks };
    return {
      send: (recordId: string, date: string, workoutName: string) =>
        sendOn(other, recordId, date, workoutName),
    };
  };
  const restartTab = () => {
    tab.joins = new Map();
    tab.locks = createInMemoryLockManager();
  };
  const row = (recordId: string) =>
    ledgerRepo.findByNaturalKey({
      kaiordRecordId: recordId,
      destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
    });
  return { garmin, send, openTab, restartTab, row };
};
