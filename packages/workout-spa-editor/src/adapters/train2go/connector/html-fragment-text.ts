import { anchorToMarkdown } from "./anchor-to-markdown";
import { decodeEntities } from "./decode-entities";
import { replaceUntilStable } from "./replace-until-stable";

// Keeps `<strong>` as `**`, `<a href>` as `[label](url)` and break/block
// tags as newlines; strips every other tag. Callers strip
// fragment-specific wrappers (SVGs, hint divs) first.
export const htmlFragmentToText = (fragment: string): string => {
  let text = fragment.replace(/<strong>([^<]*)<\/strong>/g, "**$1**");
  // `<\/a\s*>` tolerates pretty-printed closers such as `</a\n>`.
  text = text.replace(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi, anchorToMarkdown);
  // Block tags become newlines BEFORE strip-all, otherwise
  // `<p>t</p><ul><li>a</li><li>b</li></ul>` collapses to `tab`.
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|h[1-6]|li|ul|ol)>/gi, "\n");
  text = text.replace(/<(p|li)\b[^>]*>/gi, "\n");
  text = replaceUntilStable(text, /<[^>]+>/g, "");
  text = decodeEntities(text);
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l)
    .join("\n");
};
