import { z } from "zod";

/**
 * The one field of `rate_limit_info` read for the seven-day window, with the
 * scale it is written in and, when the event names its window, which one.
 */
export type WeeklyField = {
  path: ReadonlyArray<string>;
  scale: "fraction" | "percent";
  when?: Readonly<Record<string, string>>;
};

/**
 * Pinned from the real calibration capture (2026-10-23, CLI 2.1.309): every
 * `rate_limit_event` carries both windows under `unifiedWindows`, whatever its
 * `rateLimitType`, and `utilization` reads as a 0–1 fraction (0.51 and 0.52
 * across two calls; as a percent that would be half of one percent of a week
 * in use). Mis-pinned this way the guard fails closed: a percent value above 1
 * is out of scale, and one below 1 would stop the pass at 0.85% of real use.
 */
export const SEVEN_DAY_FIELD: WeeklyField | null = {
  path: ["unifiedWindows", "seven_day", "utilization"],
  scale: "fraction",
};

export const DEFAULT_MAX_WEEKLY_UTILIZATION = 0.85;

/** The fixed conversion to 0–1; the scale is pinned, never inferred. */
const SCALE_MAX = { fraction: 1, percent: 100 } as const;

/** D1b: the fraction governs, so a warning continues; anything else stops. */
const ALLOWED_STATUS = new Set(["allowed", "allowed_warning"]);

const infoSchema = z.looseObject({ status: z.string() });
type Info = z.infer<typeof infoSchema>;

export type GuardDecision =
  | { action: "continue"; utilization: number }
  | { action: "stop"; kind: "rate-limit" | "harness-fault"; reason: string };

const fault = (reason: string): GuardDecision => ({
  action: "stop",
  kind: "harness-fault",
  reason,
});

const valueAt = (info: Info, path: ReadonlyArray<string>): unknown =>
  path.reduce<unknown>(
    (node, key) =>
      typeof node === "object" && node !== null
        ? (node as Record<string, unknown>)[key]
        : undefined,
    info
  );

const matches = (info: Info, when: WeeklyField["when"]): boolean =>
  Object.entries(when ?? {}).every(([key, value]) => info[key] === value);

const utilizationOf = (infos: Array<Info>, field: WeeklyField) => {
  const name = field.path.join(".");
  const values = infos
    .filter((info) => matches(info, field.when))
    .map((info) => valueAt(info, field.path));
  // Every event the pin applies to must carry it: one without is no signal.
  if (values.length === 0) {
    return fault(
      `pinned field ${name} is missing: no rate_limit_event matches`
    );
  }
  const lacking = values.filter((value) => value === undefined).length;
  if (lacking > 0) {
    return fault(
      `pinned field ${name} is missing in ${lacking} of ${values.length} rate_limit_event`
    );
  }
  const max = SCALE_MAX[field.scale];
  for (const value of values) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fault(`pinned field ${name} is not a number`);
    }
    if (value < 0 || value > max) {
      return fault(`pinned field ${name} is outside its ${field.scale} scale`);
    }
  }
  return Math.max(...(values as Array<number>)) / max;
};

/**
 * Whether the next call may run, read from the events of the call just made.
 * No signal is not room left: a missing event, an unrecognized shape or an
 * unusable pinned field stops the pass as a harness fault.
 */
export const decideNextCall = (
  infos: ReadonlyArray<unknown>,
  options: { field: WeeklyField | null; maxWeekly: number }
): GuardDecision => {
  const { field, maxWeekly } = options;
  if (field === null) {
    return fault(
      "the seven-day rate-limit field is not pinned: run the calibration step (eval:live --calibrate) and pin SEVEN_DAY_FIELD"
    );
  }
  if (infos.length === 0)
    return fault("the CLI output carried no rate_limit_event");
  const parsed = infos.map((info) => infoSchema.safeParse(info));
  if (parsed.some((p) => !p.success))
    return fault("unrecognized rate_limit_event shape");
  const all = parsed.flatMap((p) => (p.success ? [p.data] : []));
  const blocked = all.find((info) => !ALLOWED_STATUS.has(info.status));
  if (blocked) {
    return {
      action: "stop",
      kind: "rate-limit",
      reason: "the CLI reports a rate-limit status other than allowed",
    };
  }
  const utilization = utilizationOf(all, field);
  if (typeof utilization !== "number") return utilization;
  return utilization > maxWeekly
    ? {
        action: "stop",
        kind: "rate-limit",
        reason: `seven-day utilization ${utilization} is above ${maxWeekly}`,
      }
    : { action: "continue", utilization };
};
