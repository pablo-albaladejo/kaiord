/**
 * The athlete section appended to every workout-generation user message:
 * their zones (so the model picks the right zone numbers) and their own
 * instructions for the AI. Both come from the athlete's profile, not from the
 * coach text, and sit after it in their own delimiters.
 */

export const MAX_ATHLETE_INSTRUCTIONS = 500;

export type AthletePromptInput = {
  zonesText?: string;
  instructions?: string;
};

export const buildAthleteContext = (input?: AthletePromptInput): string => {
  const parts: Array<string> = [];
  const zones = input?.zonesText?.trim();
  const instructions = input?.instructions
    ?.trim()
    .slice(0, MAX_ATHLETE_INSTRUCTIONS);

  if (zones) parts.push(`<athlete_zones>\n${zones}\n</athlete_zones>`);
  if (instructions) {
    parts.push(
      `<athlete_instructions>\n${instructions}\n</athlete_instructions>`
    );
  }
  return parts.join("\n\n");
};
