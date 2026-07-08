/**
 * Versioned generation user-prompt builder.
 *
 * Wraps the coach's description and comments in XML delimiters (prompt
 * injection defense) and carries the Spanish coaching abbreviation dictionary
 * used when converting free-text coaching into structured workouts.
 */

export const PROMPT_VERSION = "1.0.0";

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
  prompt += `<coach_description>\n${description}\n</coach_description>`;

  if (comments.length > 0) {
    const wrapped = comments
      .map((c) => `<coach_comment>\n${c}\n</coach_comment>`)
      .join("\n");
    prompt += `\n\nCoach notes:\n${wrapped}`;
  }

  if (adjustmentNotes) {
    prompt += `\n\nAdjustment notes: ${adjustmentNotes}`;
  }

  return prompt;
}
