/**
 * Field labels — count + content invariants.
 *
 * Verifies the cross-product label generator produces the expected
 * count (3 sports × HR × 5 bands × 2 bounds = 30; cycling power × 5
 * × 2 = 10; 2 sports × pace × 5 × 2 = 20 — total 60 band-level entries
 * + 8 threshold-scalar entries = 68) and that no T2G-controlled
 * substring leaks into the static label map (defense-in-depth — the
 * dialog renders these as React children).
 */
import { describe, expect, it } from "vitest";

import { FIELD_LABELS } from "./field-labels";
import { FIELD_LABELS_TOTAL } from "./field-labels.test-fixtures";

describe("FIELD_LABELS", () => {
  it("should contain the 8 threshold-scalar labels plus exactly 60 band-level entries (5.1a)", () => {
    // Arrange

    // Act
    const total = Object.keys(FIELD_LABELS).length;

    // Assert
    expect(total).toBe(FIELD_LABELS_TOTAL);
  });

  it("should never contain T2G-controlled substrings in any label value", () => {
    // Arrange
    const FORBIDDEN_SUBSTRINGS = [
      "coach",
      "email",
      "birthday",
      "gender",
      "fat",
      "smoker",
      "imc",
      "user_notes",
    ];

    // Act + Assert
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
      for (const forbidden of FORBIDDEN_SUBSTRINGS) {
        expect(
          label.toLowerCase().includes(forbidden),
          `label for "${field}" contains forbidden substring "${forbidden}": "${label}"`
        ).toBe(false);
      }
    }
  });

  it("should map every band-level FieldKey to a non-empty label", () => {
    // Arrange + Act
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
      // Assert
      expect(label.length, `label for "${field}" is empty`).toBeGreaterThan(0);
    }
  });
});
