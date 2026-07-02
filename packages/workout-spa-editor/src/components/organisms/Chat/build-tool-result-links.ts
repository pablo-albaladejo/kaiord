/**
 * Maps a persisted chat tool-event message to the deep-links its result
 * unlocks. `create_workout` and `push_to_garmin` carry a renderable
 * result: a link to the workout and, when dated, to its calendar week.
 * Any other tool, or a failed run with no `toolResult`, yields no links.
 */
import { calendarWeekHref } from "../../../routing/calendar-week-href";
import { withOrigin } from "../../../routing/with-origin";
import type { ChatMessageRecord } from "../../../types/chat/chat-message-record";

export type ToolResultLink = { href: string; label: string };

const LINKABLE_TOOLS = new Set(["create_workout", "push_to_garmin"]);

type WorkoutToolResult = { workoutId: string; date?: string };

function isWorkoutToolResult(value: unknown): value is WorkoutToolResult {
  if (typeof value !== "object" || value === null) return false;
  const { workoutId, date } = value as Record<string, unknown>;
  return (
    typeof workoutId === "string" &&
    (date === undefined || typeof date === "string")
  );
}

export function buildToolResultLinks(
  message: ChatMessageRecord
): ToolResultLink[] {
  if (!message.toolName || !LINKABLE_TOOLS.has(message.toolName)) return [];
  if (!isWorkoutToolResult(message.toolResult)) return [];

  const { workoutId, date } = message.toolResult;
  const links: ToolResultLink[] = [
    {
      href: withOrigin(`/workout/view/${workoutId}`, "chat"),
      label: "View workout",
    },
  ];
  if (date)
    links.push({ href: calendarWeekHref(date), label: "View on calendar" });
  return links;
}
