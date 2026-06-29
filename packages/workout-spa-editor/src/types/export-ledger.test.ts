import { describe, expect, it } from "vitest";

import { exportLedgerEntrySchema } from "./export-ledger";

const VALID_ENTRY = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  kaiordRecordId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  dataType: "weight",
  destinationBridgeId: "garmin-bridge",
  destinationExternalId: "gc-12345",
  contentHash: "abc123def456",
  exportedAt: "2026-05-01T08:00:00.000Z",
} as const;

describe("exportLedgerEntrySchema", () => {
  it("should accept a valid export ledger entry", () => {
    // Arrange

    // Act
    const result = exportLedgerEntrySchema.safeParse(VALID_ENTRY);

    // Assert
    expect(result.success).toBe(true);
  });

  it.each([{ field: "id" }, { field: "kaiordRecordId" }])(
    "should reject an invalid uuid for $field",
    ({ field }) => {
      // Arrange
      const input = { ...VALID_ENTRY, [field]: "not-a-uuid" };

      // Act
      const result = exportLedgerEntrySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    }
  );
});
