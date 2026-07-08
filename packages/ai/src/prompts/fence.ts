/**
 * Untrusted-data fencing for tool results.
 *
 * Free text that originated outside the user (coaching descriptions,
 * imported workout names/notes) is wrapped in fixed delimiters and capped
 * in length. The chat system prompt instructs the model to treat anything
 * between these delimiters as data, never as instructions — so a prompt
 * injection embedded in synced text cannot steer the assistant.
 */

export const UNTRUSTED_OPEN = "<<<untrusted_data>>>";
export const UNTRUSTED_CLOSE = "<<</untrusted_data>>>";

const MAX_FIELD_CHARS = 500;

export const fenceUntrusted = (text: string | null | undefined): string => {
  if (!text) return "";
  return `${UNTRUSTED_OPEN}${text.slice(0, MAX_FIELD_CHARS)}${UNTRUSTED_CLOSE}`;
};
