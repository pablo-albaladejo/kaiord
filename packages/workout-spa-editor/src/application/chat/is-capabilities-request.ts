import { normalizeSearchText } from "./normalize-search-text";

/** Slash commands: always answered locally. */
const COMMANDS = new Set(["/ayuda", "/help"]);

/** Asked of the assistant ("what can YOU do"): unambiguous at any point. */
const ABOUT_ASSISTANT = new Set([
  "que puedes hacer",
  "que sabes hacer",
  "what can you do",
]);

/** Only a capabilities question in an empty conversation: mid-conversation
 * "what can I do?" follows up on context ("my knee hurts") and goes to the
 * model. */
const OPENERS = new Set(["que puedo hacer", "ayuda", "help", "what can i do"]);

const fold = (text: string): string =>
  normalizeSearchText(text).replace(/\s+/g, " ").trim();

export type CapabilitiesRequestContext = {
  /** The conversation already has messages. */
  started: boolean;
};

/** True when the message only asks what the assistant can do, so the UI can
 * show the catalog instead of sending it to the model. */
export const isCapabilitiesRequest = (
  text: string,
  { started }: CapabilitiesRequestContext
): boolean => {
  if (COMMANDS.has(fold(text))) return true;
  const phrase = fold(text.replace(/\p{P}/gu, " "));
  return ABOUT_ASSISTANT.has(phrase) || (!started && OPENERS.has(phrase));
};
