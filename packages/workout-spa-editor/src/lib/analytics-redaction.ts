import type { AnalyticsEvent } from "@kaiord/core";

// Route segments that name one of the user's own records. The page view keeps
// the route (useful) and drops the record (a stable per-person key).
const ID_ROUTES: ReadonlyArray<[RegExp, string]> = [
  [/^\/workout\/view\/[^/?#]+/, "/workout/view/:id"],
  [/^\/workout\/(?!new(?:[/?#]|$))[^/?#]+/, "/workout/:id"],
  [/^\/chat\/[^/?#]+/, "/chat/:conversationId"],
];

// Keys that identify a person rather than describe an action. Stripped at
// the sink so a call site that forgets cannot send them.
const IDENTIFYING_KEYS: ReadonlySet<string> = new Set(["profileId"]);

export const redactAnalyticsPath = (path: string): string => {
  const bare = path.replace(/[?#][\s\S]*$/, "");
  for (const [pattern, replacement] of ID_ROUTES) {
    if (pattern.test(bare)) return bare.replace(pattern, replacement);
  }
  return bare;
};

export const stripIdentifyingProps = (
  props: AnalyticsEvent | undefined
): AnalyticsEvent | undefined => {
  if (!props) return props;
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => !IDENTIFYING_KEYS.has(key))
  );
};
