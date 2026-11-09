/**
 * The one source of the workout-parser prompt version. The system prompt
 * definition and the user-prompt builder both read it, so the version the
 * registry reports and the one persisted on a converted workout cannot drift.
 */
export const PARSER_PROMPT_VERSION = "1.3.0";
