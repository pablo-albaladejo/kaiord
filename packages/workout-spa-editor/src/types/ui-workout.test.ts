/**
 * Type-level tests for UIWorkout.
 *
 * Compile-time checks that ensure the UIWorkout contract is actually
 * enforced by TypeScript (not just documented). If TypeScript stops
 * rejecting a plain-KRD assignment, these assertions start failing at
 * `pnpm exec tsc` time.
 */

import { describe, expectTypeOf, it } from "vitest";

import type { KRD } from "./krd-core";
import type { UIWorkout } from "./ui-workout";

describe("UIWorkout type boundary", () => {
  it("does not accept a plain KRD (ids required in structured_workout)", () => {
    expectTypeOf<KRD>().not.toMatchTypeOf<UIWorkout>();
  });

  it("UIWorkout is assignable to KRD (portable shape is a supertype)", () => {
    expectTypeOf<UIWorkout>().toMatchTypeOf<KRD>();
  });
});
