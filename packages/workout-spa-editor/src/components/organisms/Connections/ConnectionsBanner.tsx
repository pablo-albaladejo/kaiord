import type { ConnectionConsequence } from "../../../application/connections/connection-consequence";
import { AttentionMark } from "../../atoms/AttentionMark";

/**
 * Absent consequence renders nothing at all — no container, no placeholder.
 *
 * No call to action: the fix for a signed-out source is a sign-in on the
 * provider's own site, which this page cannot perform, and the card that can
 * say more about it sits directly below. A button that only scrolled the
 * reader to that card would be a control that does not fix the thing it names.
 */
type Props = { consequence: ConnectionConsequence | null };

export function ConnectionsBanner({ consequence }: Props) {
  if (consequence === null) return null;

  return (
    // It appears seconds after the page renders, and again on any later poll,
    // so it announces itself rather than waiting to be found.
    <div
      role="status"
      aria-live="polite"
      data-testid="connections-banner"
      className="flex gap-3 rounded-2xl border border-edge bg-surface-elevated p-4"
    >
      {/* The icon carries the alarm the palette no longer does: success and
          warning hues left the system, so a state that needs the reader says
          so with a mark and a sentence. */}
      <AttentionMark className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className="text-sm font-semibold text-ink-strong"
          data-testid="connections-banner-title"
        >
          {consequence.title}
        </p>
        <p
          className="text-[12.5px] leading-relaxed text-ink-muted"
          data-testid="connections-banner-detail"
        >
          {consequence.detail}
        </p>
      </div>
    </div>
  );
}
