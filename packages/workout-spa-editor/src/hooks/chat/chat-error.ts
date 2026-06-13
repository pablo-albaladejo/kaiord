/**
 * Maps a provider/tool failure to a fixed, user-safe category string.
 *
 * Returns ONLY static literals — never interpolates the error message or any
 * conversation content — so the PII guard holds when this is rendered or
 * (optionally) toasted.
 */
export const categorizeChatError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|unauthor|api[_\s-]?key/i.test(message)) {
    return "Authentication failed — check your API key in settings.";
  }
  if (/429|rate|quota|overload/i.test(message)) {
    return "Rate limit or quota reached — try again shortly.";
  }
  if (/network|fetch|cors|timeout/i.test(message)) {
    return "Network error reaching the provider — try again.";
  }
  return "The assistant hit an error. Try again.";
};
