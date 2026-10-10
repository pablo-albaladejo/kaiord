import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ExportLedgerEntry } from "../types/export-ledger";

const { findByNaturalKey } = vi.hoisted(() => ({ findByNaturalKey: vi.fn() }));

vi.mock("./garmin-push-fn", () => ({
  GARMIN_BRIDGE_ID: "garmin-bridge",
  ledgerRepo: { findByNaturalKey },
}));

import { useGarminPlacementNotice } from "./use-garmin-placement-notice";

const ROW = {
  kaiordRecordId: "record-1",
  placement: { kind: "uncertain", workoutId: "9", date: "2026-10-05" },
} as unknown as ExportLedgerEntry;

describe("useGarminPlacementNotice", () => {
  it("should derive the notice from the page's row, with no query of its own", () => {
    // Arrange
    const recordId = "record-1";

    // Act
    const { result } = renderHook(() =>
      useGarminPlacementNotice(recordId, ROW)
    );

    // Assert
    expect(result.current.result).toEqual({
      kind: "uncertain",
      date: "2026-10-05",
      canConfirm: true,
    });
    expect(findByNaturalKey).not.toHaveBeenCalled();
  });
});
