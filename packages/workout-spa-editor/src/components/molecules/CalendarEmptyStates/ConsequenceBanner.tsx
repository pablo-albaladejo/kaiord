/**
 * A banner that names its consequence.
 *
 * "No AI provider configured" is a fact about Kaiord's settings; "2 sessions
 * arrived as prose and are stuck that way — your watch can't receive prose" is
 * a fact about the athlete's week. Principle 6: what broke, since when, and
 * what it costs.
 *
 * The surface is neutral in both themes and the marker is an icon, not a hue —
 * warning left the palette. Actions are supplied by the caller so the primary
 * one can be the fix (principle 4).
 */
import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export type ConsequenceBannerProps = {
  testId: string;
  headline: string;
  consequence: string;
  actions: ReactNode;
  /** Attention banners carry the triangle marker; a quiet report does not. */
  marked?: boolean;
};

export function ConsequenceBanner({
  testId,
  headline,
  consequence,
  actions,
  marked = true,
}: ConsequenceBannerProps) {
  return (
    <div
      data-testid={testId}
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-4 ${
        marked
          ? "border-edge bg-surface-elevated"
          : "border-edge-soft bg-surface"
      }`}
    >
      {marked && (
        <TriangleAlert
          aria-hidden="true"
          className="h-[18px] w-[18px] shrink-0 text-ink-strong"
        />
      )}
      <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
        <p className="m-0 text-[15px] font-medium tabular-nums text-ink-strong">
          {headline}
        </p>
        <p className="m-0 text-xs leading-relaxed text-ink-muted text-pretty">
          {consequence}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    </div>
  );
}
