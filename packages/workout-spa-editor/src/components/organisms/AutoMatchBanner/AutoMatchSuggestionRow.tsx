/**
 * One row of the AutoMatchBanner — accept / reject controls and the
 * friendly title labels for one suggestion.
 */

import { Check, X } from "lucide-react";

import type { MatchSuggestion } from "../../../application/match-suggestion";
import { useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";

const formatPercent = (score: number | null): string =>
  score === null ? "—" : `${Math.round(score * 100)}%`;

export type AutoMatchSuggestionRowProps = {
  suggestion: MatchSuggestion;
  onAccept: () => void;
  onReject: () => void;
  resolveActivity?: (id: string) => CoachingActivity | undefined;
  resolveWorkoutTitle?: (id: string) => string | undefined;
};

export function AutoMatchSuggestionRow({
  suggestion,
  onAccept,
  onReject,
  resolveActivity,
  resolveWorkoutTitle,
}: AutoMatchSuggestionRowProps) {
  const t = useTranslate("coaching");
  const activity = resolveActivity?.(suggestion.activityId);
  const workoutTitle = resolveWorkoutTitle?.(suggestion.workoutId);
  return (
    <li className="flex items-center gap-2 rounded border border-slate-200 bg-white p-1.5 dark:border-slate-700 dark:bg-slate-800">
      <span className="min-w-0 flex-1 truncate text-xs">
        <strong>{activity?.title ?? suggestion.activityId}</strong>
        {" → "}
        {workoutTitle ?? suggestion.workoutId}
        <span className="ml-2 text-ink-muted">
          · {formatPercent(suggestion.score)}
        </span>
      </span>
      <button
        type="button"
        aria-label={t("suggestion.accept")}
        onClick={onAccept}
        className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={t("suggestion.reject")}
        onClick={onReject}
        className="rounded p-1 text-ink-muted hover:bg-slate-100"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}
