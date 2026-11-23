/**
 * How one health question is decided: the standing answer when there is one,
 * otherwise the athlete through the notice (the question counts as unsaved
 * work while it waits); an answer other than "send this time" is kept.
 */
import type { HealthShare } from "../application/data-flows/data-flows";
import { abortError } from "./health-question-queue";
import type { HealthAsker, HealthQuestion } from "./health-sharing-gate";
import type { HealthSharingStore } from "./health-sharing-store";
import { armUnsavedEdits } from "./unsaved-edits";

export const createHealthDecision = (
  store: HealthSharingStore,
  asker: () => HealthAsker | null
) => {
  const standing = (q: HealthQuestion): HealthShare | null => {
    const decision = store.read()[q.providerType];
    if (!decision) return null;
    return decision === "always" ? "send" : "withhold";
  };

  const decide = async (q: HealthQuestion, cancelled: AbortSignal) => {
    const known = standing(q);
    if (known) return known;
    if (cancelled.aborted) throw abortError();
    const current = asker();
    if (!current) return "withhold";
    const disarm = armUnsavedEdits();
    try {
      const answer = await current(q, cancelled);
      if (answer !== "once") store.set(q.providerType, answer);
      return answer === "never" ? "withhold" : "send";
    } finally {
      disarm();
    }
  };

  return { standing, decide };
};
