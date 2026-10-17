import {
  type ActionInput,
  num,
  type SummaryContext,
  text,
} from "./action-input";
import { summarizeLogIntake } from "./summarize-log-intake";
import { summarizeSetDataRoute } from "./summarize-set-data-route";

type Summarize = (input: ActionInput, ctx: SummaryContext) => string | null;

const METRIC_KEYS = new Set(["weight", "sleep", "hrv", "daily-wellness"]);

const TEXT_SUMMARIES = {
  sync_coaching: (_input, { t }) => t("summary.syncCoaching"),
  create_workout: (input, { t, formatDay, sportLabel }) => {
    const description = text(input, "description");
    const date = formatDay(text(input, "date") ?? "");
    if (!description || !date) return null;
    const sport = sportLabel(text(input, "sport") ?? "");
    return sport
      ? t("summary.createWorkoutSport", { date, description, sport })
      : t("summary.createWorkout", { date, description });
  },
  log_health_metric: (input, { t, formatDay }) => {
    const metric = text(input, "metric");
    const date = formatDay(text(input, "day") ?? "");
    const value = num(input, "value");
    if (!metric || !METRIC_KEYS.has(metric) || !date || value === undefined) {
      return null;
    }
    return t(`summary.metric.${metric}`, { value, date });
  },
  log_intake: summarizeLogIntake,
  set_data_route: summarizeSetDataRoute,
} satisfies Record<string, Summarize>;

export type TextActionName = keyof typeof TEXT_SUMMARIES;

/** Every confirmation-gated tool the card can describe. `push_to_garmin`
 * is rendered by a component because it resolves the workout from Dexie. */
export type ActionToolName = TextActionName | "push_to_garmin";

export const ACTION_TOOL_NAMES: ReadonlyArray<ActionToolName> = [
  ...(Object.keys(TEXT_SUMMARIES) as TextActionName[]),
  "push_to_garmin",
];

/** Actions whose effect reaches a service outside this device. */
export const EXTERNAL_ACTIONS: ReadonlySet<ActionToolName> = new Set([
  "push_to_garmin",
  "sync_coaching",
]);

export const isActionToolName = (name: string): name is ActionToolName =>
  (ACTION_TOOL_NAMES as ReadonlyArray<string>).includes(name);

export const summarizeAction = (
  name: TextActionName,
  input: unknown,
  ctx: SummaryContext
): string | null =>
  input !== null && typeof input === "object"
    ? TEXT_SUMMARIES[name](input as ActionInput, ctx)
    : null;
