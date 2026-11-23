import { htmlFragmentToText } from "./html-fragment-text";

// The lookahead stops at the START of the next sibling tag (`<div ...
// activity-hint-ecos`), not at the substring, so a partial `<div class="`
// never leaks into the captured description.
const DESCRIPTION_RE =
  /activity-description[^>]*>([\s\S]*?)(?=<div[^>]*activity-hint-ecos|<\/form>|<\/aside>|$)/;

export const extractDescription = (block: string): string => {
  const descMatch = block.match(DESCRIPTION_RE);
  if (!descMatch) return "";
  let text = descMatch[1] ?? "";
  text = text.replace(/<svg[\s\S]*?<\/svg>/g, "");
  // Drops ANY balanced <div>...</div> with its content (meant for the
  // trailing hint div); bullets survive because they arrive as <ul><li>.
  text = text.replace(/<div[\s\S]*?<\/div>/g, "");
  return htmlFragmentToText(text);
};

export const extractCompletion = (block: string): number => {
  const pctMatch = block.match(/class="percent[^"]*"[^>]*>\s*(\d+)%/);
  return pctMatch ? Number(pctMatch[1]) : 0;
};
