/**
 * Versioned generation user-prompt builder.
 *
 * Wraps the coach's description and comments in XML delimiters. The closing
 * delimiter is neutralized inside the wrapped text, so coach text cannot end
 * its own block early and land the rest in trusted prompt space. The athlete's zones and instructions are appended by
 * `buildAthleteContext` on every generation path.
 *
 * `PROMPT_VERSION` is persisted on each AI-converted workout; 1.2.0 is the
 * first version whose generation carries the athlete's zones, their custom
 * instructions and the sport target rules; 1.3.0 teaches the explicit
 * heart-rate and power `range` forms.
 */

import { PARSER_PROMPT_VERSION } from "./parser-prompt-version";

export const PROMPT_VERSION = PARSER_PROMPT_VERSION;

/**
 * Replaces every literal `</tag>` in `text` with `[/tag]`. The replacement has
 * no `<`, so a closing tag cannot re-form from the neighbours of a
 * replacement. Text that does not contain the closing tag is returned
 * unchanged.
 */
export const neutralizeClosingTag = (text: string, tag: string): string =>
  text.replaceAll(`</${tag}>`, `[/${tag}]`);

/**
 * @deprecated Never sent to the model. The workout-parser system prompt
 * (`parse-workout.md`) carries these abbreviations in its tables.
 */
export const SPANISH_ABBREVIATION_DICTIONARY = `
Common coaching abbreviations:
- Z1-Z5: training zones (mapped to athlete values below)
- CV/VC: vuelta a la calma (cool down)
- RI: recuperación intermedia (rest interval)
- prog: progressive (increasing intensity)
- desc: descanso (rest)
- rep: repetition
- esc: escalera (ladder)
- piram: pirámide (pyramid)
- ritmo: pace
- series: intervals
- Rec: recovery
`;

export function buildUserPrompt(
  sport: string,
  description: string,
  comments: string[],
  adjustmentNotes?: string
): string {
  let prompt = `Sport: ${sport}\n\n`;
  prompt += `<coach_description>\n${neutralizeClosingTag(description, "coach_description")}\n</coach_description>`;

  if (comments.length > 0) {
    const wrapped = comments
      .map(
        (c) =>
          `<coach_comment>\n${neutralizeClosingTag(c, "coach_comment")}\n</coach_comment>`
      )
      .join("\n");
    prompt += `\n\nCoach notes:\n${wrapped}`;
  }

  if (adjustmentNotes) {
    prompt += `\n\nAdjustment notes: ${adjustmentNotes}`;
  }

  return prompt;
}
