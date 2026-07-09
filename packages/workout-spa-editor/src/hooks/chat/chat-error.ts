/**
 * Maps a provider/tool failure to a stable, user-safe error-category key.
 *
 * Returns ONLY a fixed enum key — never the error message or any conversation
 * content — so the PII guard holds when the value is rendered (localized by
 * category key at the display boundary) or (optionally) toasted.
 */
export type ChatErrorCategory = "auth" | "rate" | "network" | "generic";

export const categorizeChatError = (error: unknown): ChatErrorCategory => {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|unauthor|api[_\s-]?key/i.test(message)) return "auth";
  if (/429|rate|quota|overload/i.test(message)) return "rate";
  if (/network|fetch|cors|timeout/i.test(message)) return "network";
  return "generic";
};
