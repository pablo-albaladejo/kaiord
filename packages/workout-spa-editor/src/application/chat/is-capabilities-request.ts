import { normalizeSearchText } from "./normalize-search-text";

/** Typed questions answered locally with the capability catalog, in both
 * supported locales. Compared after accent, case and punctuation folding. */
const CAPABILITY_REQUESTS = new Set([
  "/ayuda",
  "/help",
  "ayuda",
  "help",
  "que puedo hacer",
  "que puedes hacer",
  "que sabes hacer",
  "what can i do",
  "what can you do",
]);

const PUNCTUATION = /[¿?¡!.]/g;

/** True when the message only asks what the assistant can do, so the UI can
 * show the catalog instead of sending it to the model. */
export const isCapabilitiesRequest = (text: string): boolean =>
  CAPABILITY_REQUESTS.has(
    normalizeSearchText(text)
      .replace(PUNCTUATION, "")
      .replace(/\s+/g, " ")
      .trim()
  );
