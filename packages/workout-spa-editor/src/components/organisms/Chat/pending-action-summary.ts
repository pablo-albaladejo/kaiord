import {
  type ActionInput,
  num,
  type SummaryContext,
  text,
} from "./action-input";
import { summarizeSetDataRoute } from "./summarize-set-data-route";

type Summarize = (input: ActionInput, ctx: SummaryContext) => string | null;

const METRIC_KEYS = new Set(["weight", "sleep", "hrv", "daily-wellness"]);

const TEXT_SUMMARIES = {
  sync_coaching: (_input, { t }) => t("summary.syncCoaching"),
  create_workout: (input, { t, formatDay }) => {
    const description = text(input, "description");
    const date = text(input, "date");
    if (!description || !date) return null;
    return t("summary.createWorkout", { date: formatDay(date), description });
  },
  log_health_metric: (input, { t, formatDay }) => {
    const metric = text(input, "metric");
    const day = text(input, "day");
    const value = num(input, "value");
    if (!metric || !METRIC_KEYS.has(metric) || !day || value === undefined) {
      return null;
    }
    return t(`summary.metric.${metric}`, { value, date: formatDay(day) });
  },
  log_intake: (input, { t, formatDay }) => {
    const date = text(input, "date");
    const kcal = num(input, "kcal");
    const protein = num(input, "proteinG");
    const carb = num(input, "carbG");
    const fat = num(input, "fatG");
    if (
      !date ||
      kcal === undefined ||
      protein === undefined ||
      carb === undefined ||
      fat === undefined
    ) {
      return null;
    }
    const line = t("summary.intake", {
      kcal,
      protein,
      carb,
      fat,
      date: formatDay(date),
    });
    const label = text(input, "label");
    return label ? t("summary.intakeLabelled", { label, line }) : line;
  },
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
