/**
 * Which chat tools hand the athlete's stored health data to the model. These
 * are the tools the first-time notice covers and "don't send" withholds; every
 * other tool is listed as reading none, so a new tool is classified before it
 * ships (`data-flows-coverage.test.ts`).
 */
export const HEALTH_READING_TOOLS: ReadonlySet<string> = new Set([
  "query_health",
  "query_energy_balance",
]);

/** Tools whose answers carry no stored health values, with why. */
export const NO_HEALTH_TOOLS: Readonly<Record<string, string>> = {
  get_today: "the date only",
  query_workouts: "workout names, dates, durations and distances",
  query_coaching: "the coach's plan and comments",
  get_data_routes: "which source feeds each kind of data, no values",
  sync_coaching: "the outcome of a coaching sync",
  create_workout: "the new workout's id and date",
  log_health_metric: "the id of a value the athlete just gave",
  log_intake: "the id of a meal the athlete just gave",
  push_to_garmin: "the outcome of a send",
  set_data_route: "the routing state of one kind of data",
};
