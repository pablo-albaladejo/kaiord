/**
 * CommentSelector - Checkbox list for workout comments.
 *
 * Pre-selects comments before noon on workout date.
 */

import type { WorkoutComment } from "../../../types/calendar-fragments";

export type CommentSelectorProps = {
  comments: WorkoutComment[];
  selected: Set<number>;
  onToggle: (index: number) => void;
};

export function CommentSelector({
  comments,
  selected,
  onToggle,
}: CommentSelectorProps) {
  if (comments.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No comments available.</p>
    );
  }

  return (
    <div className="space-y-2" data-testid="comment-selector">
      <p className="text-xs font-medium text-muted-foreground">
        Include comments:
      </p>
      {comments.map((c, i) => (
        <label key={i} className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.has(i)}
            onChange={() => onToggle(i)}
            className="mt-0.5"
          />
          <div>
            <span className="font-medium">{c.author}</span>
            <p className="text-xs text-muted-foreground">{c.text}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
