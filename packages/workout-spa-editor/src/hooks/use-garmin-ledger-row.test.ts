import "fake-indexeddb/auto";

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db } from "../adapters/dexie/dexie-database";
import { useGarminLedgerRow } from "./use-garmin-ledger-row";

const row = {
  id: "row-w1",
  kaiordRecordId: "w1",
  destinationBridgeId: "garmin-bridge",
  dataType: "workout",
  destinationExternalId: "101",
  contentHash: "h",
  exportedAt: "2026-10-01T08:00:00.000Z",
};

describe("useGarminLedgerRow", () => {
  beforeEach(async () => {
    await db.table("exportLedger").clear();
  });

  it("should follow the workout's Garmin row as it is written", async () => {
    // Arrange
    const { result } = renderHook(() => useGarminLedgerRow("w1"));

    // Act
    await db.table("exportLedger").put(row);

    // Assert
    await waitFor(() => expect(result.current?.id).toBe("row-w1"));
  });
});
