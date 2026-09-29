/**
 * A placement pipeline wired to in-memory ports for AC-level tests: the
 * in-memory ledger, the fake calendar, a fake library push through the real
 * `recordExport` (so [C] / [U] / [S] take the real Phase 1 paths), a lock
 * manager shared by "tabs", and the clock of `vi.useFakeTimers` — `sleep`
 * advances it instead of waiting.
 */
import { vi } from "vitest";

import type { Analytics } from "@kaiord/core";

import type { ExportLedgerRepository } from "../application/export/export-ledger-repository.port";
import { recordExport } from "../application/export/record-export.use-case";
import type { PlacementRequest } from "../application/garmin-placement/placement-phase-one";
import {
  CALENDAR_FIND_FEATURE,
  CALENDAR_WRITE_FEATURE,
} from "../application/garmin-placement/placement-timing";
import {
  type PlacementPipelineDeps,
  pushWorkoutToGarminCalendar,
} from "../application/garmin-placement/push-workout-to-garmin-calendar";
import type { RecordLockPort } from "../application/garmin-placement/record-lock-port";
import { GARMIN_LEDGER_BRIDGE_ID } from "../types/export-ledger";
import { parseGarminWorkoutId } from "../types/garmin-ledger";
import { createFakeGarminCalendar } from "./fake-garmin-calendar";
import { createInMemoryExportLedgerRepository } from "./in-memory-export-ledger-repository";
import { createInMemoryLockManager } from "./in-memory-record-lock";

export const RECORD_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const LEDGER_KEY = {
  kaiordRecordId: RECORD_ID,
  destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
};
export const ALL_FEATURES = [CALENDAR_WRITE_FEATURE, CALENDAR_FIND_FEATURE];

export type HarnessOptions = {
  features?: readonly string[];
  /** `null`: no Web Locks (a non-secure context). */
  locks?: RecordLockPort | null;
  scheduleIdsInFind?: boolean;
  analytics?: Analytics;
  /** Another repository (Dexie over fake-indexeddb, or a wrapper). */
  ledgerRepo?: ExportLedgerRepository;
};

export const createPlacementHarness = (options: HarnessOptions = {}) => {
  const memory = createInMemoryExportLedgerRepository();
  const ledgerRepo = options.ledgerRepo ?? memory;
  const calendar = createFakeGarminCalendar();
  const lockManager = createInMemoryLockManager();
  const library = { pushes: 0, nextId: 1_700_000, fail: false, noId: false };
  const deps: PlacementPipelineDeps = {
    ledgerRepo,
    calendar: calendar.port,
    scheduleIdsInFind: options.scheduleIdsInFind ?? true,
    now: () => Date.now(),
    sleep: async (ms) => {
      vi.setSystemTime(Date.now() + ms);
    },
    features: options.features ?? ALL_FEATURES,
    locks:
      options.locks === null
        ? undefined
        : (options.locks ?? lockManager.port()),
    joins: new Map(),
    analytics: options.analytics,
  };
  const postFn = async () => {
    library.pushes++;
    if (library.fail) throw new Error("library push failed");
    const id = String(library.nextId++);
    const workoutId = parseGarminWorkoutId(id);
    return {
      externalId: id,
      library:
        library.noId || !workoutId
          ? ({ kind: "unconfirmed" } as const)
          : ({ kind: "confirmed", workoutId } as const),
    };
  };
  const runLibraryPush = (content: string) => () =>
    recordExport(
      { ledgerRepo },
      {
        kaiordRecordId: RECORD_ID,
        dataType: "workout",
        destinationBridgeId: GARMIN_LEDGER_BRIDGE_ID,
        payload: { workoutName: "Tempo", content },
        postFn,
      }
    );
  const push = (
    date: string,
    content = "v1",
    extra: Partial<PlacementRequest> = {},
    pipelineDeps: PlacementPipelineDeps = deps
  ) =>
    pushWorkoutToGarminCalendar(pipelineDeps, {
      kaiordRecordId: RECORD_ID,
      date,
      runLibraryPush: runLibraryPush(content),
      ...extra,
    });
  const row = () => ledgerRepo.findByNaturalKey(LEDGER_KEY);
  /** The in-memory row right now, read synchronously (in-memory repo only). */
  const snapshot = () => structuredClone([...memory.store.values()][0]);
  return {
    deps,
    ledgerRepo,
    calendar,
    lockManager,
    library,
    push,
    row,
    snapshot,
  };
};

export type PlacementHarness = ReturnType<typeof createPlacementHarness>;

/** The three paths of every AC: first push [C], content change [U] (same
    date), date-only move [S]. Runs the setup push and returns the act push's
    inputs plus the setup's schedule count. */
export type PushPath = "C" | "U" | "S";
export const D1 = "2026-10-05";
export const D2 = "2026-10-12";

export const preparePath = async (h: PlacementHarness, path: PushPath) => {
  if (path === "C") return { date: D1, content: "v1" };
  await h.push(D1, "v1");
  return path === "U"
    ? { date: D1, content: "v2" }
    : { date: D2, content: "v1" };
};
