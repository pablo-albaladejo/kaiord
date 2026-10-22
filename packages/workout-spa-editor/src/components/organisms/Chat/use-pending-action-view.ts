import type { PendingAction } from "@kaiord/ai";

import { useWorkoutLabelLive } from "../../../hooks/use-workout-label-live";
import { useActiveLocale } from "../../../i18n/LocaleProvider";
import { useTranslate } from "../../../i18n/use-translate";
import {
  formatShortDay,
  labelOf,
  pushWorkoutId,
  type SummaryContext,
} from "./action-input";
import {
  EXTERNAL_ACTIONS,
  isActionToolName,
  summarizeAction,
} from "./pending-action-summary";

/** Everything the confirmation card shows for one pending action, and
 * whether it can describe it well enough to be approved. */
export function usePendingActionView(action: PendingAction) {
  const t = useTranslate("chat");
  const tc = useTranslate("connections");
  const tcal = useTranslate("calendar");
  const locale = useActiveLocale();
  const name = action.toolName;
  const known = isActionToolName(name);
  const isPush = name === "push_to_garmin";
  const ctx: SummaryContext = {
    t,
    dataTypeLabel: (type) => labelOf(tc, `dataTypes.${type}`),
    sportLabel: (sport) => labelOf(tcal, `sport.${sport}`),
    formatDay: (day) => formatShortDay(day, locale),
  };
  const workout = useWorkoutLabelLive(
    isPush ? pushWorkoutId(action.input) : "",
    t("proposal.untitled")
  );
  const summary =
    known && !isPush ? summarizeAction(name, action.input, ctx) : null;
  // Approving what the card cannot describe would be approving blind; a push
  // is readable only once its workout resolved to the active athlete's.
  const readable = isPush ? Boolean(workout) : summary !== null;
  const external = known && EXTERNAL_ACTIONS.has(name);
  return { t, name, known, isPush, ctx, workout, summary, readable, external };
}
