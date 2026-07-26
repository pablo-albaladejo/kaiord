/**
 * CoachingDayComments — read-only panel rendering the day's coach/athlete
 * comment thread. Reuses the shared link-aware renderer so URLs in comment
 * bodies are clickable (https-only) without `dangerouslySetInnerHTML`.
 *
 * Read-only by design: no compose/edit/delete affordances (replying would
 * require write access to the coaching platform — out of scope). `isOwn`
 * drives alignment styling only.
 */

import type { CoachingDayComment } from "../../../types/coaching-day-notes-record";
import { renderCoachingInline } from "../../organisms/CoachingSidebar/coaching-inline";
import { formatCoachingDescription } from "../../organisms/CoachingSidebar/format-coaching-description";

// Localizes the platform timestamp for display; falls back to the raw
// string if it isn't parseable. The raw value is preserved in the
// `<time dateTime>` attribute regardless.
const formatTimestamp = (raw: string): string => {
  const parsed = new Date(raw.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? raw : parsed.toLocaleString();
};

const CommentBody = ({ text }: { text: string }) => (
  <div className="text-sm leading-relaxed">
    {formatCoachingDescription(text).map((p, pi) => (
      <p key={pi}>
        {p.inlines.map((inline, ii) => renderCoachingInline(inline, ii, true))}
      </p>
    ))}
  </div>
);

export function CoachingDayComments({
  comments,
}: {
  comments: CoachingDayComment[];
}) {
  if (comments.length === 0) return null;
  return (
    <div
      data-testid="coaching-day-comments"
      className="space-y-3 border-t border-edge pt-3"
    >
      <h3 className="text-xs font-semibold uppercase text-muted-foreground">
        Comments
      </h3>
      {comments.map((comment, ci) => (
        <div
          key={ci}
          data-testid="coaching-day-comment"
          className={comment.isOwn ? "pl-4" : "pr-4"}
        >
          <div className="flex items-baseline gap-2 text-xs">
            <span className="font-medium">{comment.author}</span>
            <time
              dateTime={comment.timestamp}
              className="text-muted-foreground"
            >
              {formatTimestamp(comment.timestamp)}
            </time>
          </div>
          <CommentBody text={comment.text} />
        </div>
      ))}
    </div>
  );
}
