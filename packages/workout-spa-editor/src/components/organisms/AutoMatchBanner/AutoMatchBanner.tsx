/**
 * Surfaces auto-match suggestions for the current week and lets the
 * user accept / reject each pair, or dismiss the banner for 24h.
 *
 * Renders as a `role="region"` landmark with a polite live-region
 * sub-element (NOT aria-live on the region itself, which causes NVDA
 * to re-announce the entire region on any DOM change).
 */

import { useState } from "react";

import type { MatchSuggestion } from "../../../application/match-suggestion";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { AutoMatchBannerHeader } from "./AutoMatchBannerHeader";
import { AutoMatchSuggestionRow } from "./AutoMatchSuggestionRow";

export type AutoMatchBannerProps = {
  suggestions: MatchSuggestion[];
  onAccept: (s: MatchSuggestion) => Promise<void> | void;
  onReject: (s: MatchSuggestion) => void;
  onDismissAll: () => Promise<void> | void;
  resolveActivity?: (id: string) => CoachingActivity | undefined;
  resolveWorkoutTitle?: (id: string) => string | undefined;
};

const VISIBLE_ROW_CAP = 2;

const remainingMessage = (verb: string, after: number): string =>
  after === 0
    ? `${verb}. No suggestions remaining.`
    : `${verb}. ${after} suggestions remaining.`;

export function AutoMatchBanner({
  suggestions,
  onAccept,
  onReject,
  onDismissAll,
  resolveActivity,
  resolveWorkoutTitle,
}: AutoMatchBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState("");

  if (suggestions.length === 0) return null;
  const visible = expanded
    ? suggestions
    : suggestions.slice(0, VISIBLE_ROW_CAP);
  const overflow = suggestions.length > VISIBLE_ROW_CAP;

  const onAcceptRow = async (s: MatchSuggestion) => {
    await onAccept(s);
    setStatus(remainingMessage("Session matched", suggestions.length - 1));
  };
  const onRejectRow = (s: MatchSuggestion) => {
    onReject(s);
    setStatus(remainingMessage("Suggestion dismissed", suggestions.length - 1));
  };

  return (
    <section
      role="region"
      aria-label="Auto-match suggestions"
      data-testid="auto-match-banner"
      className={`overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-900 ${expanded ? "max-h-64" : "max-h-32"}`}
    >
      <AutoMatchBannerHeader
        total={suggestions.length}
        expanded={expanded}
        overflow={overflow}
        onToggleExpanded={() => setExpanded((e) => !e)}
        onDismissAll={() => void onDismissAll()}
      />
      <ul className="space-y-1">
        {visible.map((s) => (
          <AutoMatchSuggestionRow
            key={`${s.activityId}|${s.workoutId}`}
            suggestion={s}
            onAccept={() => void onAcceptRow(s)}
            onReject={() => onRejectRow(s)}
            resolveActivity={resolveActivity}
            resolveWorkoutTitle={resolveWorkoutTitle}
          />
        ))}
      </ul>
      <div role="status" aria-live="polite" className="sr-only">
        {status}
      </div>
    </section>
  );
}
