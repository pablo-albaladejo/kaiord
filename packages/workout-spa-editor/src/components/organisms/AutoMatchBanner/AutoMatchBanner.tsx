/**
 * Surfaces auto-match suggestions for the current week and lets the
 * user accept or reject each pair. Reject persists a per-pair dismissal
 * via `dismissAutoMatchBanner` (the parent dispatches), so the row
 * does NOT re-surface for that week on the same device.
 *
 * Renders as a `role="region"` landmark with a polite live-region
 * sub-element (NOT aria-live on the region itself, which causes NVDA
 * to re-announce the entire region on any DOM change).
 */

import { useState } from "react";

import type { MatchSuggestion } from "../../../application/match-suggestion";
import { type Translate, useTranslate } from "../../../i18n/use-translate";
import type { CoachingActivity } from "../../../types/coaching-activity";
import { AutoMatchBannerHeader } from "./AutoMatchBannerHeader";
import { AutoMatchSuggestionRow } from "./AutoMatchSuggestionRow";

export type AutoMatchBannerProps = {
  suggestions: MatchSuggestion[];
  onAccept: (s: MatchSuggestion) => Promise<void> | void;
  onReject: (s: MatchSuggestion) => Promise<void> | void;
  resolveActivity?: (id: string) => CoachingActivity | undefined;
  resolveWorkoutTitle?: (id: string) => string | undefined;
};

const VISIBLE_ROW_CAP = 2;

const statusMessage = (t: Translate, verbKey: string, after: number): string =>
  `${t(verbKey)} ${
    after === 0
      ? t("suggestion.noneRemaining")
      : t("suggestion.nRemaining", { count: after })
  }`;

export function AutoMatchBanner({
  suggestions,
  onAccept,
  onReject,
  resolveActivity,
  resolveWorkoutTitle,
}: AutoMatchBannerProps) {
  const t = useTranslate("coaching");
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState("");

  if (suggestions.length === 0) return null;
  const visible = expanded
    ? suggestions
    : suggestions.slice(0, VISIBLE_ROW_CAP);
  const overflow = suggestions.length > VISIBLE_ROW_CAP;
  const after = suggestions.length - 1;

  const onAcceptRow = async (s: MatchSuggestion) => {
    await onAccept(s);
    setStatus(statusMessage(t, "suggestion.sessionMatched", after));
  };
  const onRejectRow = async (s: MatchSuggestion) => {
    await onReject(s);
    setStatus(statusMessage(t, "suggestion.suggestionDismissed", after));
  };

  return (
    <section
      role="region"
      aria-label={t("banner.ariaLabel")}
      data-testid="auto-match-banner"
      className={`overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-900 ${expanded ? "max-h-64" : "max-h-32"}`}
    >
      <AutoMatchBannerHeader
        total={suggestions.length}
        expanded={expanded}
        overflow={overflow}
        onToggleExpanded={() => setExpanded((e) => !e)}
      />
      <ul className="space-y-1">
        {visible.map((s) => (
          <AutoMatchSuggestionRow
            key={`${s.activityId}|${s.workoutId}`}
            suggestion={s}
            onAccept={() => void onAcceptRow(s)}
            onReject={() => void onRejectRow(s)}
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
