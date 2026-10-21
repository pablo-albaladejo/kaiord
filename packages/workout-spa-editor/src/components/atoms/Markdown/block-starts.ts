import { FENCE } from "./parse-fence";
import { LIST_ITEM } from "./parse-list";
import { isTableStart } from "./parse-table";

/* Every pattern here is anchored and unambiguous (no two adjacent quantifiers
   can trade characters), so a hostile line costs linear time. Anything that
   needed an ambiguous regex (closing `#`s, rules) is done in code instead. */
export const HEADING = /^ {0,3}#{1,6}(?:[ \t]+(.*))?$/;
export const QUOTE = /^ {0,3}>[ \t]?(.*)$/;
const RULE_BODY = /^(?:-+|\*+|_+)$/;
const MAX_INDENT = 3;

/** `## Title ##` → `Title`. A trailing run of `#` is only a closing sequence
 * when a space precedes it (`C#` keeps its hash). */
export function headingText(raw: string): string {
  const text = raw.trimEnd();
  let end = text.length;
  while (end > 0 && text[end - 1] === "#") end--;
  if (end === 0) return "";
  const before = text[end - 1];
  return before === " " || before === "\t"
    ? text.slice(0, end).trimEnd()
    : text;
}

/** `---`, `* * *`, `___`: three or more of one marker, spaces allowed. */
export function isRule(line: string): boolean {
  if (line.length - line.trimStart().length > MAX_INDENT) return false;
  const body = line.replace(/[ \t]/g, "");
  return body.length >= MAX_INDENT && RULE_BODY.test(body);
}

export function startsBlock(lines: string[], i: number): boolean {
  const line = lines[i] ?? "";
  return (
    FENCE.test(line) ||
    HEADING.test(line) ||
    isRule(line) ||
    QUOTE.test(line) ||
    LIST_ITEM.test(line) ||
    isTableStart(lines, i)
  );
}

/** The text of the paragraph starting at `i`, up to a blank line or a line
 * that opens another block. */
export function readParagraphText(
  lines: string[],
  i: number
): [string, number] {
  let j = i + 1;
  while ((lines[j] ?? "").trim() !== "" && !startsBlock(lines, j)) j++;
  return [
    lines
      .slice(i, j)
      .map((l) => l.trim())
      .join("\n"),
    j,
  ];
}

/** The body of the quote starting at `i`, one `>` removed from each line. */
export function readQuoteBody(lines: string[], i: number): [string, number] {
  const body: string[] = [];
  let j = i;
  for (let m = QUOTE.exec(lines[j] ?? ""); m; m = QUOTE.exec(lines[j] ?? "")) {
    body.push(m[1] ?? "");
    j++;
  }
  return [body.join("\n"), j];
}
