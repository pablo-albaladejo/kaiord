import {
  type FocusTelemetry,
  formFieldShortCircuitEvent,
  overlayDeferredApplyEvent,
  safeEmit,
  wiringCanaryEvent,
} from "../../store/providers/focus-telemetry";

let hasFiredCanaryThisSession = false;

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    hasFiredCanaryThisSession = false;
  });
}

export const __resetCanaryForTests = (): void => {
  hasFiredCanaryThisSession = false;
};

export const emitCanaryIfFirst = (telemetry: FocusTelemetry): void => {
  if (!hasFiredCanaryThisSession) {
    hasFiredCanaryThisSession = true;
    safeEmit(telemetry, wiringCanaryEvent());
  }
};

export const emitFormFieldShortCircuit = (
  telemetry: FocusTelemetry,
  lastEmitRef: { current: number }
): void => {
  const now = Date.now();
  if (now - lastEmitRef.current >= 1000) {
    lastEmitRef.current = now;
    safeEmit(telemetry, formFieldShortCircuitEvent());
  }
};

export const emitOverlayDeferredApply = (
  telemetry: FocusTelemetry,
  startMs: number
): void => {
  safeEmit(telemetry, overlayDeferredApplyEvent(performance.now() - startMs));
};
