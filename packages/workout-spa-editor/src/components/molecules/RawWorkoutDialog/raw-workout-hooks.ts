/**
 * Hooks for RAW workout dialog comment selection.
 */

import { useCallback, useMemo, useState } from "react";

import type { WorkoutComment } from "../../../types/calendar-fragments";

/**
 * Returns pre-selected comment indices.
 * Pre-workout comments (timestamp < workout date noon) are pre-selected.
 */
export function getPreSelectedComments(
  comments: WorkoutComment[],
  workoutDate: string
): Set<number> {
  const noon = new Date(`${workoutDate}T12:00:00Z`).getTime();
  const indices = new Set<number>();

  comments.forEach((c, i) => {
    if (new Date(c.timestamp).getTime() < noon) {
      indices.add(i);
    }
  });

  return indices;
}

export function useCommentSelection(
  comments: WorkoutComment[],
  workoutDate: string
) {
  const initial = useMemo(
    () => getPreSelectedComments(comments, workoutDate),
    [comments, workoutDate]
  );
  const [selected, setSelected] = useState<Set<number>>(initial);

  const toggle = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return { selected, toggle };
}
