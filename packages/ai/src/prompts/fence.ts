/**
 * Untrusted-data fencing for tool results.
 *
 * Free text that originated outside the user (coaching descriptions,
 * imported workout names/notes) is wrapped in fixed delimiters and capped
 * in length. The chat system prompt instructs the model to treat anything
 * between these delimiters as data, never as instructions — so a prompt
 * injection embedded in synced text cannot steer the assistant.
 *
 * The payload is neutralized before it is wrapped. Text carrying the closing
 * delimiter would otherwise end the fence early and land its remainder in
 * trusted prompt space, which is the one thing the fence exists to prevent.
 * Both delimiters open with `FENCE_PREFIX`, so removing every occurrence of
 * that prefix removes every delimiter; the replacement carries no `<`, so a
 * delimiter cannot re-form by the neighbours of a replacement joining up.
 */

export const UNTRUSTED_OPEN = "<<<untrusted_data>>>";
export const UNTRUSTED_CLOSE = "<<</untrusted_data>>>";

const FENCE_PREFIX = "<<<";
const NEUTRALIZED_PREFIX = "[fence]";
const MAX_FIELD_CHARS = 500;

/**
 * An absent field returns `""` and stays the caller's to represent — usually
 * as `null`, so the model can tell "no description" from "an empty one". A
 * field that is present but empty returns an empty fence, which is not the
 * same value: flattening the two loses a distinction the model can act on.
 */
export const fenceUntrusted = (text: string | null | undefined): string => {
  if (text === null || text === undefined) return "";
  const neutralized = text.replaceAll(FENCE_PREFIX, NEUTRALIZED_PREFIX);
  const capped = neutralized.slice(0, MAX_FIELD_CHARS);
  return `${UNTRUSTED_OPEN}${capped}${UNTRUSTED_CLOSE}`;
};
