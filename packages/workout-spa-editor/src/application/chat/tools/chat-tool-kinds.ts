/**
 * The kinds of data each chat tool's answer hands the model, from the
 * fields its reader copies out: the Trace counts these per call. A health
 * tool withheld from the Provider answers HEALTH_WITHHELD and hands none.
 * Action tools answer ids and outcomes the App made, no kind of data.
 */
import type { DataKind } from "../../data-flows/data-kinds";
import type { HealthMetric } from "./profile-readers";

/** Per metric, the kinds `summarizeHealth` copies (NUMERIC_FIELDS). */
export const HEALTH_METRIC_KINDS: Record<HealthMetric, readonly DataKind[]> = {
  sleep: ["sleep", "restingHeartRate"],
  weight: ["weight"],
  hrv: ["hrv"],
  "daily-wellness": ["dailyActivity"],
  "body-composition": ["bodyComposition"],
  stress: ["stress"],
};

const metricOf = (input: unknown): HealthMetric | undefined => {
  const metric = (input as { metric?: unknown } | null)?.metric;
  return typeof metric === "string" && metric in HEALTH_METRIC_KINDS
    ? (metric as HealthMetric)
    : undefined;
};

const TOOL_KINDS: Readonly<
  Record<string, (input: unknown) => readonly DataKind[]>
> = {
  get_today: () => [],
  query_workouts: () => ["workouts"],
  query_coaching: () => ["coachingPlan"],
  get_data_routes: () => ["dataSources"],
  set_data_route: () => ["dataSources"],
  query_health: (input) => {
    const metric = metricOf(input);
    return metric ? HEALTH_METRIC_KINDS[metric] : [];
  },
  query_energy_balance: () => ["meals", "energyBalance"],
  sync_coaching: () => [],
  create_workout: () => [],
  log_health_metric: () => [],
  log_intake: () => [],
  push_to_garmin: () => [],
};

export const CHAT_TOOLS_WITH_KINDS: readonly string[] = Object.keys(TOOL_KINDS);

/** What one call of `tool` with `input` hands the model. */
export const chatToolKinds = (tool: string, input: unknown): DataKind[] => [
  ...(TOOL_KINDS[tool]?.(input) ?? []),
];
