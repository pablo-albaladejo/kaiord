import "fake-indexeddb/auto";

import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../../adapters/dexie/dexie-database";
import {
  coachWorkout,
  sessionMatch,
} from "../../application/session-move.test-fixtures";
import type { MatchedSessionWithMetadata } from "../../hooks/use-matched-sessions";
import type { CoachingActivity } from "../../types/coaching-activity";
import type { ExportLedgerEntry } from "../../types/export-ledger";
import { GarminDriftBadge } from "../molecules/GarminDriftBadge/GarminDriftBadge";
import { CalendarGarminDrift } from "./CalendarGarminDrift";

const plan = (overrides: Partial<CoachingActivity> = {}): CoachingActivity => ({
  id: "train2go:77",
  source: "train2go",
  sourceBadge: "T2G",
  date: "2026-10-08",
  sport: { label: "Bike", icon: "🚴" },
  title: "Threshold",
  status: "pending",
  ...overrides,
});

const matched = (
  id: string,
  overrides: Partial<MatchedSessionWithMetadata> = {}
): MatchedSessionWithMetadata => ({
  activity: plan({ id: `train2go:${id}` }),
  workout: coachWorkout({ id, date: "2026-10-08" }),
  complianceScore: null,
  executed: [],
  match: sessionMatch({ id: `m-${id}`, workoutId: id }),
  ...overrides,
});

const placedOnTuesday = (kaiordRecordId: string) =>
  ({
    id: `row-${kaiordRecordId}`,
    kaiordRecordId,
    destinationBridgeId: "garmin-bridge",
    dataType: "workout",
    destinationExternalId: "101",
    contentHash: "h",
    exportedAt: "2026-10-01T08:00:00.000Z",
    placement: {
      kind: "scheduled",
      workoutScheduleId: "202",
      workoutId: "101",
      date: "2026-10-06",
    },
  }) as ExportLedgerEntry;

describe("CalendarGarminDrift", () => {
  beforeEach(async () => {
    await db.table("exportLedger").clear();
  });

  it("should badge a moved session but not a done one Garmin also holds elsewhere (AC-19, AC-29)", async () => {
    // Arrange
    await db
      .table("exportLedger")
      .bulkPut([placedOnTuesday("open"), placedOnTuesday("done")]);
    const buckets = {
      matchedByDay: {
        "2026-10-08": [
          matched("open"),
          matched("done", { activity: plan({ status: "completed" }) }),
        ],
      },
      soloActualsByDay: {},
      executedRefIds: new Set<string>(),
    };

    // Act
    render(
      <CalendarGarminDrift buckets={buckets}>
        <div data-testid="open">
          <GarminDriftBadge workoutId="open" />
        </div>
        <div data-testid="done">
          <GarminDriftBadge workoutId="done" />
        </div>
      </CalendarGarminDrift>
    );

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("open")).toHaveTextContent("Garmin: Tue 6")
    );
    expect(screen.getByTestId("done")).toBeEmptyDOMElement();
  });
});
