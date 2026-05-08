/**
 * Test fixtures for focus-telemetry.test.ts.
 * Pure constants — no logic, no functions.
 */

export const FOCUS_TELEMETRY_TARGETS = {
  itemKind: "item",
  firstItemFallback: "first-item",
  focusPhase: "focus",
} as const;

export const FOCUS_TELEMETRY_ERRORS = {
  telemetryDown: "telemetry down",
  unhandledEventPrefix: "Unhandled event type: ",
} as const;

export const FOCUS_TELEMETRY_EVENT_TYPES = {
  wiringCanary: "wiring-canary",
  unresolvedTargetFallback: "unresolved-target-fallback",
  formFieldShortCircuit: "form-field-short-circuit",
  overlayDeferredApply: "overlay-deferred-apply",
  focusError: "focus-error",
} as const;

export const FOCUS_TELEMETRY_DEFERRED_MS = {
  zero: 0,
  fifty: 50,
  ninetyNine: 99,
  oneHundredFortyNine: 149,
  oneHundredFifty: 150,
  twoHundredFifty: 250,
  fiveHundred: 500,
  oneThousandTwoThirtyFour: 1234,
  negativeTen: -10,
} as const;

export const FOCUS_TELEMETRY_DEFERRED_BUCKETS = {
  zero: 0,
  oneHundred: 100,
  twoHundred: 200,
  threeHundred: 300,
} as const;

export const FOCUS_TELEMETRY_DEFERRED_INPUT_BATCH = [
  FOCUS_TELEMETRY_DEFERRED_MS.zero,
  FOCUS_TELEMETRY_DEFERRED_MS.fifty,
  FOCUS_TELEMETRY_DEFERRED_MS.ninetyNine,
  FOCUS_TELEMETRY_DEFERRED_MS.oneHundredFifty,
  FOCUS_TELEMETRY_DEFERRED_MS.fiveHundred,
  FOCUS_TELEMETRY_DEFERRED_MS.oneThousandTwoThirtyFour,
] as const;
