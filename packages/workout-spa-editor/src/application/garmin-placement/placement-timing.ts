/**
 * The placement timings of design §3.4. They must keep the order
 * `D_START` (15 s, bridge) < `BRIDGE_DEADLINE_MS` < `SPA_ACTION_TIMEOUT_MS`
 * < `SPA_ACTION_TIMEOUT_MS + SETTLE_MS` < `POST_GATE_MS`: the SPA hears the
 * bridge's own answer before it gives up, and an absence read that starts
 * after the gate sees any POST of the attempt Garmin committed.
 */
export const SETTLE_MS = 3_000;
export const BRIDGE_DEADLINE_MS = 25_000;
export const SPA_ACTION_TIMEOUT_MS = BRIDGE_DEADLINE_MS + 5_000;
export const POST_GATE_MS = BRIDGE_DEADLINE_MS + SETTLE_MS + 10_000;

/** Failed `unschedule` attempts before an entry is `abandoned`. */
export const MAX_DELETE_ATTEMPTS = 3;

export const CALENDAR_WRITE_FEATURE = "calendar-write-v1";
export const CALENDAR_FIND_FEATURE = "calendar-find-v1";

/** A3 (T0b, 2026-09-28): `calendar-find` exposes each entry's schedule id. */
export const SCHEDULE_IDS_IN_FIND = true;
