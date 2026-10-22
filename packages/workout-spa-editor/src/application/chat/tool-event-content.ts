/** The transcript line of a tool row; the model replay reads it back to tell
 * a failed action from one that ran, so both sides share this definition. */
export const toolEventContent = (toolName: string, ok: boolean): string =>
  ok ? `Ran ${toolName}.` : `${toolName} failed.`;

export const isFailedToolEvent = (toolName: string, content: string): boolean =>
  content === toolEventContent(toolName, false);
