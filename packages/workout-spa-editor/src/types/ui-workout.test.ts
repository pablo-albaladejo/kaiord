/**
 * Type-level tests for UIWorkout.
 *
 * Compile-time check on the UIWorkout/KRD relationship. `UIWorkout` is
 * currently a structural alias of `KRD` (see `ui-workout.ts`), so the
 * portable shape is assignable to `KRD`.
 */

import { describe, expectTypeOf, it } from "vitest";

import type { KRD } from "./krd-core";
import type { UIWorkout } from "./ui-workout";

describe("UIWorkout type boundary", () => {
  it("should make UIWorkout assignable to KRD (portable shape is a supertype)", () => {
    // Arrange

    // Act

    // Assert
    expectTypeOf<UIWorkout>().toMatchTypeOf<KRD>();
  });
});
