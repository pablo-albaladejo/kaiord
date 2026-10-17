/**
 * The athlete section appended to every workout-generation user message:
 * their zones (so the model picks the right zone numbers) and their own
 * instructions for the AI. Both come from the athlete's profile, not from the
 * coach text, and sit after it in their own delimiters.
 *
 * Both are capped, and any `<athlete_` / `</athlete_` sequence inside them is
 * neutralized, so neither can close its block early or open another one.
 * The replacement carries no `<`, so a tag cannot re-form around it.
 */

export const MAX_ATHLETE_INSTRUCTIONS = 500;
export const MAX_ATHLETE_ZONES = 2000;

const ATHLETE_TAG = /<\/?athlete_/gi;
const NEUTRALIZED_TAG = "[athlete_";

export type AthletePromptInput = {
  zonesText?: string;
  instructions?: string;
};

const clean = (text: string | undefined, max: number) =>
  text?.replace(ATHLETE_TAG, NEUTRALIZED_TAG).trim().slice(0, max);

export const buildAthleteContext = (input?: AthletePromptInput): string => {
  const parts: Array<string> = [];
  const zones = clean(input?.zonesText, MAX_ATHLETE_ZONES);
  const instructions = clean(input?.instructions, MAX_ATHLETE_INSTRUCTIONS);

  if (zones) parts.push(`<athlete_zones>\n${zones}\n</athlete_zones>`);
  if (instructions) {
    parts.push(
      `<athlete_instructions>\n${instructions}\n</athlete_instructions>`
    );
  }
  return parts.join("\n\n");
};
