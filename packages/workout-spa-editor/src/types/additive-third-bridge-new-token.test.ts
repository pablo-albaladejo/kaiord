/**
 * T-27a — Additivity regression: new capability token (AC-10 Option B).
 *
 * INVARIANT (two-edit rule): Adding a new bridge that introduces a NEW
 * data type ("meditation") requires exactly TWO source-tree edits:
 *   1. packages/core/src/domain/managed-data-type.ts  — new registry entry
 *   2. packages/workout-spa-editor/src/types/bridge-schemas.ts — new enum value
 *
 * Zero edits are required to the IntegrationPolicy schema, the DataFlows*
 * components, or any resolver / use case — the registry-driven shape is
 * additive by construction. That additivity is documented here; the single
 * executable assertion below pins the precondition that the new token is
 * genuinely absent from the production schema until edit #2 is made, so an
 * accidental early addition would surface as a test failure.
 */

import { describe, expect, it } from "vitest";

describe("additivity — new capability token (T-27a)", () => {
  it("should confirm the new token is absent from production bridgeCapabilitySchema (i.e. it is genuinely new)", async () => {
    // Arrange
    const { bridgeCapabilitySchema } = await import("./bridge-schemas");

    // Act
    const parseResult = bridgeCapabilitySchema.safeParse("read:meditation");

    // Assert
    expect(parseResult.success).toBe(false);
  });
});
