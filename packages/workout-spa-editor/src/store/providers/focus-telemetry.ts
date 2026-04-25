export type FocusTelemetryEvent =
  | { type: "wiring-canary" }
  | {
      type: "unresolved-target-fallback";
      targetKind: "item" | "empty-state";
      fallback: "empty-state" | "first-item" | "heading";
    }
  | { type: "form-field-short-circuit" }
  | { type: "overlay-deferred-apply"; deferredForMs: number }
  | { type: "focus-error"; phase: "focus" | "scrollIntoView" };

export type FocusTelemetry = (event: FocusTelemetryEvent) => void;

export const defaultFocusTelemetry: FocusTelemetry = () => {};

export const wiringCanaryEvent = (): FocusTelemetryEvent => ({
  type: "wiring-canary",
});

export const unresolvedTargetFallbackEvent = (
  targetKind: "item" | "empty-state",
  fallback: "empty-state" | "first-item" | "heading"
): FocusTelemetryEvent => ({
  type: "unresolved-target-fallback",
  targetKind,
  fallback,
});

export const formFieldShortCircuitEvent = (): FocusTelemetryEvent => ({
  type: "form-field-short-circuit",
});

export const overlayDeferredApplyEvent = (
  measuredMs: number
): FocusTelemetryEvent => ({
  type: "overlay-deferred-apply",
  deferredForMs: Math.max(0, Math.round(Math.max(0, measuredMs) / 100) * 100),
});

export const focusErrorEvent = (
  phase: "focus" | "scrollIntoView"
): FocusTelemetryEvent => ({ type: "focus-error", phase });

export const safeEmit = (
  telemetry: FocusTelemetry,
  event: FocusTelemetryEvent
): void => {
  try {
    telemetry(event);
  } catch {
    console.warn(
      "[FocusTelemetry] telemetry handler threw — focus behavior unaffected",
      event
    );
  }
};
