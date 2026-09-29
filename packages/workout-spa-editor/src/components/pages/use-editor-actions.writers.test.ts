/**
 * The editor's send (`useEditorActions().pushWorkout`) against a week sync
 * following the coach's date. The sync starts between the save's read and
 * its write; the lock stands in for Dexie's serialized transactions, so a
 * save outside the port's transaction would roll the coach's date back.
 */
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { applyCoachDateMoves } from "../../application/coaching/apply-coach-date-moves";
import { makeWorkoutRecord } from "../../application/test-helpers";
import { PersistenceProvider } from "../../contexts/persistence-context";
import type { PersistencePort } from "../../ports/persistence-port";
import { useWorkoutStore } from "../../store/workout-store";
import { createInMemoryPersistence } from "../../test-utils/in-memory-persistence";
import { createTransactionLock } from "../../test-utils/transaction-lock";
import {
  buildCoachingActivityId,
  namespaceSourceId,
} from "../../types/coaching-activity-record";
import type { KRD } from "../../types/krd";
import { useEditorActions } from "./use-editor-actions";

const PROFILE = "p1";
const SOURCE_ID = "77";
const GARMIN_ID = "1700000";
const NOW = "2026-10-01T08:00:00.000Z";
const [D1, D2] = ["2026-10-05", "2026-10-06"];

const opened = makeWorkoutRecord({
  id: "w",
  profileId: PROFILE,
  date: D1,
  coachDate: D1,
  source: "train2go",
  sourceId: namespaceSourceId(PROFILE, SOURCE_ID),
  state: "ready",
  krd: {} as KRD,
});

const syncTo = (persistence: PersistencePort, date: string) =>
  applyCoachDateMoves(
    {
      workouts: persistence.workouts,
      now: () => NOW,
      transaction: persistence.transaction,
    },
    [
      {
        id: buildCoachingActivityId(PROFILE, "train2go", SOURCE_ID),
        profileId: PROFILE,
        source: "train2go",
        sourceId: SOURCE_ID,
        date,
        sport: "cycling",
        title: "Threshold",
        status: "pending",
        fetchedAt: NOW,
      },
    ],
    []
  );

describe("useEditorActions racing a coach move", () => {
  beforeEach(() => useWorkoutStore.setState({ currentWorkout: null }));

  it("should keep the coach's date and the push stamp", async () => {
    // Arrange
    const lock = createTransactionLock();
    const stored: PersistencePort = {
      ...createInMemoryPersistence(),
      transaction: lock.transaction,
    };
    await stored.workouts.put(opened);
    let racing: Promise<unknown> | undefined;
    const editorView: PersistencePort = {
      ...stored,
      workouts: {
        ...stored.workouts,
        getById: async (id) => {
          const read = await stored.workouts.getById(id);
          racing = syncTo(stored, D2);
          await Promise.race([lock.contended, racing]);
          return read;
        },
      },
    };
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(PersistenceProvider, { persistence: editorView, children });
    const { result } = renderHook(() => useEditorActions(opened), { wrapper });

    // Act
    await act(async () => {
      await result.current.pushWorkout(GARMIN_ID);
      await racing;
    });

    // Assert
    expect(await stored.workouts.getById("w")).toMatchObject({
      date: D2,
      coachDate: D2,
      state: "pushed",
      garminPushId: GARMIN_ID,
    });
  });
});
