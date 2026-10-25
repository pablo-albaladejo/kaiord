import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import type { ExportLedgerEntry } from "../types/export-ledger";
import { useWeekGarminDrift } from "./use-week-garmin-drift";

const OLD = "2026-10-06";
const NEW = "2026-10-08";

const ledgerRow = (
  kaiordRecordId: string,
  kind: "scheduled" | "unconfirmed",
  date = OLD
): ExportLedgerEntry =>
  ({
    id: `row-${kaiordRecordId}`,
    kaiordRecordId,
    destinationBridgeId: "garmin-bridge",
    dataType: "workout",
    destinationExternalId: "101",
    contentHash: "h",
    exportedAt: "2026-10-01T08:00:00.000Z",
    placement:
      kind === "scheduled"
        ? { kind, workoutScheduleId: "202", workoutId: "101", date }
        : { kind, workoutId: "101", date, supersedes: [] },
  }) as ExportLedgerEntry;

const subject = (id: string, locked = false) => ({
  workout: { id, date: NEW },
  locked,
});

describe("useWeekGarminDrift", () => {
  beforeEach(async () => {
    await db.table("exportLedger").clear();
  });

  it("should map each drifted workout of the week to its Garmin date", async () => {
    // Arrange
    await db
      .table("exportLedger")
      .bulkPut([
        ledgerRow("w1", "scheduled"),
        ledgerRow("w2", "unconfirmed"),
        ledgerRow("w3", "scheduled", NEW),
      ]);
    const subjects = [subject("w1"), subject("w2"), subject("w3")];

    // Act
    const { result } = renderHook(() => useWeekGarminDrift(subjects));

    // Assert
    await waitFor(() => expect(result.current.size).toBe(2));
    expect(result.current.get("w1")).toEqual({
      placedOn: OLD,
      certainty: "placed",
    });
    expect(result.current.get("w2")).toEqual({
      placedOn: OLD,
      certainty: "unconfirmed",
    });
  });

  it("should leave a locked session out of the map", async () => {
    // Arrange
    await db.table("exportLedger").put(ledgerRow("w1", "scheduled"));
    const subjects = [subject("w1", true), subject("w2")];

    // Act
    const { result } = renderHook(() => useWeekGarminDrift(subjects));
    await db.table("exportLedger").put(ledgerRow("w2", "scheduled"));

    // Assert
    await waitFor(() => expect(result.current.has("w2")).toBe(true));
    expect(result.current.has("w1")).toBe(false);
  });

  it("should follow a ledger write made after the first read", async () => {
    // Arrange
    const subjects = [subject("w1")];
    const { result } = renderHook(() => useWeekGarminDrift(subjects));
    await waitFor(() => expect(result.current.size).toBe(0));

    // Act
    await db.table("exportLedger").put(ledgerRow("w1", "scheduled"));

    // Assert
    await waitFor(() => expect(result.current.get("w1")?.placedOn).toBe(OLD));
  });
});
