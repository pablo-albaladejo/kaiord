/**
 * The declared inventory of model-facing sinks: every chat tool whose
 * `execute` returns a value the model reads.
 *
 * A guard over field names catches the fields you named. This catches the
 * sinks you forgot — which is the failure that actually happened twice: a
 * summarizer passed `workout.name` through raw for the life of the function
 * while the fence docstring claimed it was covered, and a coaching bridge's
 * exception text reached the model through a field called `error`, in a file
 * outside the tools directory, with no summarizer involved.
 *
 * `provenance` is the load-bearing column. "Why it needs no fence" can be
 * argued from the `execute` body; where a string was PRODUCED usually cannot,
 * and that is exactly where the live channel was hiding.
 */

/** Field names the fence guard recognizes as externally authored. */
export const FENCED_FIELD_NAMES = [
  "name",
  "title",
  "description",
  "notes",
  "error",
  "message",
  "reason",
];

/**
 * Known limits, stated so a green run is not read as more than it is:
 *  - syntactic: an externally-authored field under a NEW name is not caught;
 *  - opaque payloads: a nested `unknown` forwarded whole is not inspected;
 *  - provenance is declared here by a human, not derived.
 */
export const SINKS = [
  {
    tool: "get_today",
    status: "clean",
    provenance: "computed from deps.today; no data path at all",
  },
  {
    tool: "query_workouts",
    status: "fenced",
    provenance:
      "workout.name arrives with imported files and platform sync; fenced in summarize-workouts.ts",
  },
  {
    tool: "query_coaching",
    status: "fenced",
    provenance:
      "title and description are coach-authored on the coaching platform; fenced in summarize-coaching.ts",
  },
  {
    tool: "query_health",
    status: "unbounded",
    provenance:
      "summarize-health.ts forwards krd: unknown verbatim. Health schemas carry externalId: z.string().optional(), written upstream, and the Dexie adapter never parses. Benign today by write-path discipline, not by type. A syntactic guard cannot see inside it.",
  },
  {
    tool: "query_energy_balance",
    status: "clean",
    provenance:
      "EnergyTargetRecord is .strict() with no free-text field; capReason is one of three app literals",
  },
  {
    tool: "get_data_routes",
    status: "clean",
    provenance:
      "label comes from MANAGED_DATA_REGISTRY, a compile-time constant; integrationId and sourceOrder are rejected at write time against INTEGRATION_REGISTRY",
  },
  {
    tool: "sync_coaching",
    status: "clean",
    provenance:
      "produced in application/coaching/sync-week.ts, OUTSIDE this directory: the bridge's exception text was read into SyncWeekResult.error and returned verbatim. doSyncCoaching now projects it away; the use case keeps it for the UI and the log.",
  },
  {
    tool: "create_workout",
    status: "clean",
    provenance: "returns ids the app generated",
  },
  {
    tool: "log_health_metric",
    status: "clean",
    provenance: "returns the persisted record's own numeric fields",
  },
  {
    tool: "log_intake",
    status: "clean",
    provenance: "returns app-computed totals",
  },
  {
    tool: "push_to_garmin",
    status: "clean",
    provenance:
      "garminPushId is echoed from the Garmin bridge and validated to an id shape at the source before it is persisted or returned",
  },
  {
    tool: "set_data_route",
    status: "clean",
    provenance: "returns the same route answer as get_data_routes",
  },
];
