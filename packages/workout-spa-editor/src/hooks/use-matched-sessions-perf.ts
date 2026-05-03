/**
 * Single source of truth for the `useMatchedSessions` performance mark
 * name. Shared between the hook (which emits the marks under DEV/test
 * mode only) and the Playwright spec (which reads the resulting
 * `performance.measure` entry).
 *
 * Per design D16 of calendar-coaching-redesign-completion: the hook
 * SHALL contribute no more than 30 ms to the CalendarPage FCP budget.
 * Production bundles MUST NOT carry the perf-mark calls — they are
 * gated behind `import.meta.env.DEV || import.meta.env.MODE === "test"`
 * so Vite's transform tree-shakes them out for prod builds. The
 * `scripts/check-no-perf-marks-in-prod.mjs` build-output assertion
 * pins that property.
 */

export const USE_MATCHED_SESSIONS_PERF_MARK = "useMatchedSessions";
export const USE_MATCHED_SESSIONS_PERF_START = `${USE_MATCHED_SESSIONS_PERF_MARK}:start`;
export const USE_MATCHED_SESSIONS_PERF_END = `${USE_MATCHED_SESSIONS_PERF_MARK}:end`;

const PERF_INSTRUMENTATION_ENABLED =
  import.meta.env.DEV || import.meta.env.MODE === "test";

export const markUseMatchedSessionsStart = (): void => {
  if (!PERF_INSTRUMENTATION_ENABLED) return;
  if (typeof performance === "undefined") return;
  performance.mark(USE_MATCHED_SESSIONS_PERF_START);
};

export const markUseMatchedSessionsEnd = (): void => {
  if (!PERF_INSTRUMENTATION_ENABLED) return;
  if (typeof performance === "undefined") return;
  performance.mark(USE_MATCHED_SESSIONS_PERF_END);
  performance.measure(
    USE_MATCHED_SESSIONS_PERF_MARK,
    USE_MATCHED_SESSIONS_PERF_START,
    USE_MATCHED_SESSIONS_PERF_END
  );
};
