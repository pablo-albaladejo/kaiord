/**
 * Replaces `{{variable}}` placeholders in a raw prompt template.
 * Returns the raw string unchanged if no variables are provided.
 */
export const loadPrompt = (
  raw: string,
  vars?: Record<string, string>
): string => {
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    raw
  );
};
